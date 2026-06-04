import { type ResponseSchema } from '@google/generative-ai'
import {
	getAgentModelConfig,
	type AgentKey,
	type ThinkingLevel,
} from './model-config'

/**
 * ─── Shared Gemini Client ────────────────────────────────────────────────────
 *
 * Calls the Gemini REST generateContent endpoint directly (not the SDK): the
 * installed @google/generative-ai predates Gemini 3 and does not forward the
 * `thinking_level` param, so we own the request body. This gives full control
 * over per-agent model selection, native structured output (responseSchema),
 * the Gemini 3 thinkingConfig.thinkingLevel, and same-provider tiered fallback.
 *
 * Flow for each call:
 *   1. Resolve { primary, fallback, thinkingLevel } for the caller's agentKey.
 *   2. Try primary (with a short intra-model retry for transient blips).
 *   3. On a retryable failure (429-after-retries, 503/overload, 5xx, timeout,
 *      network), fall back to the SAME-provider fallback model — identical
 *      responseSchema + thinkingLevel.
 *   4. Return a { response: { text() } } shape so agents stay unchanged; the
 *      caller's Zod safeParse remains the single source of truth.
 */

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const ATTEMPTS_PER_MODEL = 2
const RETRY_DELAYS_MS = [1200, 3000]
const DEFAULT_MODEL = 'gemini-3.5-flash'
const DEFAULT_THINKING: ThinkingLevel = 'medium'

export interface GeminiCallOptions {
	/**
	 * Gemini native structured output (OpenAPI subset). When set, the model is
	 * constrained to emit JSON matching this schema — fenced/malformed output
	 * becomes structurally impossible, so JSON.parse can never fail.
	 */
	responseSchema?: ResponseSchema
	/** Selects model tier (primary/fallback) + thinking level from model-config. */
	agentKey?: AgentKey
	/** Optional thinking-level override (otherwise taken from the agent config). */
	thinkingLevel?: ThinkingLevel
}

export type GeminiPart =
	| { text: string }
	| { inlineData: { data: string; mimeType: string } }

export type GeminiRequest = GeminiPart[]

export type ModelTier = 'primary' | 'fallback'

export interface GeminiResult {
	response: { text: () => string }
	/** Which model actually served the response (after any fallback). */
	modelUsed: string
	tier: ModelTier
	thinkingLevel: ThinkingLevel
}

// ── Errors ───────────────────────────────────────────────────────────────────

export class GeminiHttpError extends Error {
	constructor(
		public status: number,
		public statusText: string,
		public body: string,
	) {
		super(`Gemini API error (${status} ${statusText}): ${body.slice(0, 300)}`)
		this.name = 'GeminiHttpError'
	}
}

export class GeminiNetworkError extends Error {
	constructor(message: string, public cause?: unknown) {
		super(message)
		this.name = 'GeminiNetworkError'
	}
}

function isRetryable(error: unknown): boolean {
	if (error instanceof GeminiHttpError) {
		return [429, 500, 502, 503, 504].includes(error.status)
	}
	if (error instanceof GeminiNetworkError) return true
	if (error instanceof Error) {
		return /fetch failed|network|timeout|etimedout|econnreset|socket hang up/i.test(error.message)
	}
	return false
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── Transport (swappable for tests/demos) ────────────────────────────────────

export interface TransportArgs {
	model: string
	tier: ModelTier
	parts: GeminiRequest
	responseSchema?: ResponseSchema
	thinkingLevel: ThinkingLevel
}

/** The real REST transport. A single model call — no retries, no fallback. */
async function restTransport(args: TransportArgs): Promise<string> {
	const apiKey = process.env.GEMINI_API_KEY
	if (!apiKey) throw new Error('GEMINI_API_KEY is not set')

	const body = {
		contents: [{ role: 'user', parts: args.parts }],
		generationConfig: {
			responseMimeType: 'application/json',
			temperature: 0.3,
			...(args.responseSchema ? { responseSchema: args.responseSchema } : {}),
			thinkingConfig: { thinkingLevel: args.thinkingLevel },
		},
	}

	let res: Response
	try {
		res = await fetch(`${API_BASE}/${args.model}:generateContent?key=${apiKey}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		})
	} catch (err) {
		throw new GeminiNetworkError(
			`Gemini network error calling ${args.model}: ${err instanceof Error ? err.message : 'unknown'}`,
			err,
		)
	}

	if (!res.ok) {
		throw new GeminiHttpError(res.status, res.statusText, await res.text().catch(() => ''))
	}

	const data = (await res.json()) as {
		candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>
		promptFeedback?: { blockReason?: string }
	}

	if (data.promptFeedback?.blockReason) {
		throw new Error(`Gemini blocked the request: ${data.promptFeedback.blockReason}`)
	}

	const text = (data.candidates?.[0]?.content?.parts ?? [])
		.map((p) => p.text ?? '')
		.join('')

	if (!text) throw new Error(`Gemini returned no text (finishReason: ${data.candidates?.[0]?.finishReason ?? 'unknown'})`)

	return text
}

let transport: (args: TransportArgs) => Promise<string> = restTransport

/** Swap the transport (tests/demos). Returns the previous one. */
export function setTransportForTesting(fn: (args: TransportArgs) => Promise<string>) {
	const prev = transport
	transport = fn
	return prev
}
/** Restore the real REST transport. */
export function resetTransport() {
	transport = restTransport
}
/** The real transport, exported so a stub can delegate to it. */
export const defaultTransport = restTransport

// ── Generate with intra-model retry + same-provider tiered fallback ──────────

async function tryModel(
	model: string,
	tier: ModelTier,
	parts: GeminiRequest,
	responseSchema: ResponseSchema | undefined,
	thinkingLevel: ThinkingLevel,
): Promise<string> {
	let lastError: unknown
	for (let attempt = 1; attempt <= ATTEMPTS_PER_MODEL; attempt += 1) {
		try {
			return await transport({ model, tier, parts, responseSchema, thinkingLevel })
		} catch (error) {
			lastError = error
			if (!isRetryable(error) || attempt >= ATTEMPTS_PER_MODEL) throw error
			await sleep(RETRY_DELAYS_MS[attempt - 1] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1])
		}
	}
	throw lastError
}

async function generate(parts: GeminiRequest, options?: GeminiCallOptions): Promise<GeminiResult> {
	const cfg = options?.agentKey ? getAgentModelConfig(options.agentKey) : null
	const primary = cfg?.primary ?? DEFAULT_MODEL
	const fallback = cfg?.fallback ?? primary
	const thinkingLevel = options?.thinkingLevel ?? cfg?.thinkingLevel ?? DEFAULT_THINKING
	const schema = options?.responseSchema
	const agentLabel = options?.agentKey ?? '—'

	// Tier list: primary, then fallback (only if different).
	const tiers: Array<{ model: string; tier: ModelTier }> = [{ model: primary, tier: 'primary' }]
	if (fallback !== primary) tiers.push({ model: fallback, tier: 'fallback' })

	let lastError: unknown
	for (const { model, tier } of tiers) {
		try {
			const text = await tryModel(model, tier, parts, schema, thinkingLevel)
			if (tier === 'fallback') {
				console.warn(`🔁 [gemini] agent=${agentLabel} primary ${primary} failed → served by fallback ${model}`)
			}
			console.log(`🤖 [gemini] agent=${agentLabel} → ${model} (thinking=${thinkingLevel}, tier=${tier})`)
			return { response: { text: () => text }, modelUsed: model, tier, thinkingLevel }
		} catch (error) {
			lastError = error
			if (!isRetryable(error)) {
				// Non-retryable (e.g. 400 bad request, safety block) — don't burn the fallback
				throw error instanceof Error ? error : new Error(String(error))
			}
			if (tier === 'primary' && fallback !== primary) {
				console.warn(`⚠️  [gemini] agent=${agentLabel} primary ${primary} retryable failure (${error instanceof Error ? error.message.slice(0, 120) : 'unknown'}) — falling back to ${fallback}`)
			}
		}
	}

	throw new Error(
		`Gemini request failed on both primary (${primary}) and fallback (${fallback}). Last error: ${lastError instanceof Error ? lastError.message : 'unknown'}`,
		{ cause: lastError instanceof Error ? lastError : undefined },
	)
}

/**
 * Shared Gemini entry point. Pass `agentKey` to select the model tier +
 * thinking level from model-config; the client handles structured output and
 * same-provider fallback. The returned `.response.text()` keeps agents
 * unchanged; their Zod safeParse stays the source of truth.
 */
export const gemini = {
	generateContent: (request: GeminiRequest, options?: GeminiCallOptions) =>
		generate(request, options),
}
