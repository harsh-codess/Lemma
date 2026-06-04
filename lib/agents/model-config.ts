/**
 * ─── Per-Agent Model Configuration ───────────────────────────────────────────
 *
 * Each agent maps to { primary, fallback, thinkingLevel }. The shared Gemini
 * client (gemini-client.ts) reads this to pick the model, apply the Gemini 3
 * `thinking_level`, and fall back to the same-provider fallback model on a
 * retryable failure. Agents pull their tier from here — no model strings or
 * thinking levels are hardcoded inside agent files.
 *
 * Model strings below were VERIFIED callable by this project's key via the
 * models.list endpoint (Step 0). Only stable, non-preview, non-2.0 strings:
 *   - gemini-pro-latest    — GA Pro alias (no pinned `gemini-3-pro` exists yet)
 *   - gemini-3.5-flash     — pinned stable
 *   - gemini-3.1-flash-lite — pinned stable
 *
 * Every field can be overridden from the environment (where practical), e.g.
 *   GEMINI_MODEL_PAPER_READER_PRIMARY=gemini-3.1-pro-preview
 *   GEMINI_MODEL_CRITIQUE_THINKING=medium
 */

export type ThinkingLevel = 'minimal' | 'low' | 'medium' | 'high'

export const THINKING_LEVELS: readonly ThinkingLevel[] = ['minimal', 'low', 'medium', 'high']

export interface AgentModelConfig {
	primary: string
	fallback: string
	thinkingLevel: ThinkingLevel
}

export type AgentKey =
	| 'paper-reader'
	| 'trl-irl'
	| 'market-retrieval'
	| 'market-synthesis'
	| 'feasibility'
	| 'pitch-builder'
	| 'critique'

// ── Verified-available model strings (Step 0) ────────────────────────────────
const PRO = 'gemini-pro-latest'
const FLASH = 'gemini-3.5-flash'
const FLASH_LITE = 'gemini-3.1-flash-lite'

/**
 * Defaults. The five tiers in the spec are set verbatim. `trl-irl` is on
 * the Pro tier (its TRL/IRL scores propagate downstream as a source of
 * truth). `feasibility` stays on Flash → Flash-lite with high thinking —
 * its Pro critique guards it. `market-retrieval` is
 * currently Tavily-only (no Gemini call) — its entry is reserved so a
 * future LLM-assisted retrieval stage inherits a tier without a code change.
 */
const DEFAULTS: Record<AgentKey, AgentModelConfig> = {
	'paper-reader': { primary: PRO, fallback: FLASH, thinkingLevel: 'high' },
	'critique': { primary: PRO, fallback: FLASH, thinkingLevel: 'high' },
	'trl-irl': { primary: PRO, fallback: FLASH, thinkingLevel: 'high' },
	'feasibility': { primary: FLASH, fallback: FLASH_LITE, thinkingLevel: 'high' },
	'pitch-builder': { primary: FLASH, fallback: FLASH_LITE, thinkingLevel: 'medium' },
	'market-synthesis': { primary: FLASH, fallback: FLASH_LITE, thinkingLevel: 'medium' },
	'market-retrieval': { primary: FLASH_LITE, fallback: FLASH_LITE, thinkingLevel: 'minimal' },
}

export const AGENT_KEYS = Object.keys(DEFAULTS) as AgentKey[]

function envVar(agent: AgentKey, slot: 'PRIMARY' | 'FALLBACK' | 'THINKING'): string {
	return `GEMINI_MODEL_${agent.replace(/-/g, '_').toUpperCase()}_${slot}`
}

function resolveThinking(agent: AgentKey, fallback: ThinkingLevel): ThinkingLevel {
	const raw = process.env[envVar(agent, 'THINKING')]?.trim().toLowerCase()
	if (!raw) return fallback
	if ((THINKING_LEVELS as readonly string[]).includes(raw)) return raw as ThinkingLevel
	// Invalid override — ignore rather than send a bad param to the API
	return fallback
}

/** Resolves an agent's model config, applying any environment overrides. */
export function getAgentModelConfig(agent: AgentKey): AgentModelConfig {
	const d = DEFAULTS[agent]
	return {
		primary: process.env[envVar(agent, 'PRIMARY')]?.trim() || d.primary,
		fallback: process.env[envVar(agent, 'FALLBACK')]?.trim() || d.fallback,
		thinkingLevel: resolveThinking(agent, d.thinkingLevel),
	}
}
