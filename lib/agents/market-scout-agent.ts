import { gemini } from './gemini-client'
import { zodToGeminiSchema } from './gemini-schema'
import { getSearchClient } from './search-client'
import { marketScoutBaseSchema, buildMarketScoutValidator } from './validators'
import { createAgentLogger } from '../logger'
import type {
	MarketScoutOutput,
	MarketSource,
	MarketSearchCategory,
	PaperAgentOutput,
} from './types'

/**
 * ─── Agent 3: Market Scout ───────────────────────────────────────────────────
 *
 * Two-stage agent.
 *
 * Stage 1 — runMarketRetrieval: targeted web searches (via the swappable
 *   search client) derived from the paper's domain and key claims —
 *   competitors, funding, patents, market size. Returns raw sources;
 *   the pipeline persists them to the RetrievedSource table.
 *
 * Stage 2 — runMarketSynthesis: feeds ONLY the retrieved sources to Gemini.
 *   Every figure/competitor/signal in the output requires a sourceUrl, and
 *   the validator rejects any sourceUrl that was not retrieved in Stage 1.
 *   On rejection, the validation errors are fed back into the prompt and
 *   the synthesis retries (up to MAX_SYNTHESIS_ATTEMPTS). No source, no
 *   claim — enforced by the type, not by instruction.
 */

const MAX_SYNTHESIS_ATTEMPTS = 3
const MAX_RESULTS_PER_QUERY = 5

// ─── Stage 1: Retrieval ──────────────────────────────────────────────────────

/** Extract the primary domain phrase from "Primary: X. Secondary: Y." */
function primaryDomainPhrase(paperAnalysis: PaperAgentOutput): string {
	const match = paperAnalysis.domainClassification.match(/Primary:\s*([^.]+)/i)
	return (match?.[1] ?? paperAnalysis.domain).trim()
}

/** First key claim, stripped of citations/parentheticals, trimmed to a search phrase */
function keyClaimPhrase(paperAnalysis: PaperAgentOutput): string {
	const claim = paperAnalysis.keyClaims[0] ?? ''
	return claim
		.replace(/\([^)]*\)/g, '')
		.replace(/[^a-zA-Z0-9\s%.-]/g, ' ')
		.split(/\s+/)
		.slice(0, 12)
		.join(' ')
		.trim()
}

export function buildRetrievalQueries(
	paperAnalysis: PaperAgentOutput
): Array<{ category: MarketSearchCategory; query: string; topic: 'general' | 'news' }> {
	const tech = primaryDomainPhrase(paperAnalysis)
	const claim = keyClaimPhrase(paperAnalysis)

	return [
		{ category: 'competitors', query: `${tech} companies startups products competitive landscape`, topic: 'general' },
		{ category: 'competitors', query: `${claim} commercial products companies`, topic: 'general' },
		{ category: 'funding', query: `${tech} startup funding round venture investment`, topic: 'news' },
		{ category: 'patents', query: `${tech} patent filings intellectual property landscape`, topic: 'general' },
		{ category: 'market-size', query: `${tech} market size forecast CAGR billion`, topic: 'general' },
		{ category: 'market-size', query: `${paperAnalysis.domain} total addressable market report`, topic: 'general' },
	]
}

export async function runMarketRetrieval(
	paperAnalysis: PaperAgentOutput,
	projectId: string
): Promise<MarketSource[]> {
	const log = createAgentLogger('Market Scout (retrieval)', 3, projectId)
	const startTime = Date.now()

	log.start()

	const client = getSearchClient()
	const queries = buildRetrievalQueries(paperAnalysis)

	const resultsPerQuery = await Promise.all(
		queries.map(async ({ category, query, topic }) => {
			try {
				const hits = await client.search(query, { maxResults: MAX_RESULTS_PER_QUERY, topic })
				return hits.map((hit) => ({ ...hit, category, query }))
			} catch (error) {
				// One failed query shouldn't sink the whole retrieval
				log.error('Search query failed (non-fatal)', {
					query,
					error: error instanceof Error ? error.message : 'Unknown error',
				})
				return []
			}
		})
	)

	// Dedupe by URL — the same source often answers multiple queries
	const byUrl = new Map<string, MarketSource>()
	for (const source of resultsPerQuery.flat()) {
		if (!byUrl.has(source.url)) byUrl.set(source.url, source)
	}
	const sources = Array.from(byUrl.values())

	if (sources.length === 0 && resultsPerQuery.every((r) => r.length === 0)) {
		// All queries failed or returned nothing — likely a config/outage issue
		throw new Error('Agent 3 retrieval returned zero sources across all queries')
	}

	log.complete(Date.now() - startTime)
	log.info('Retrieval summary', {
		queryCount: queries.length,
		sourceCount: sources.length,
		byCategory: queries.reduce<Record<string, number>>((acc, q) => {
			acc[q.category] = sources.filter((s) => s.category === q.category).length
			return acc
		}, {}),
	})

	return sources
}

// ─── Stage 2: Synthesis ──────────────────────────────────────────────────────

const SYNTHESIS_PROMPT = `
You are Agent 3 in Lemma's 5-stage commercialization pipeline.

Your role: MARKET SCOUT.
You are a market analyst at a TTO writing an evidence brief. You work ONLY from the retrieved web sources provided below — you never see the original paper, and you must NOT use your own background knowledge for any figure, company, or signal.

─── THE GROUNDING RULE (enforced by schema, not honor system) ────────────────

Every market figure (TAM/SAM/SOM), every competitor, and every market signal in your output carries a sourceUrl. That URL must be copied VERBATIM from one of the retrieved sources below. Output is machine-validated: any sourceUrl that is not in the retrieved set is rejected and returned to you as an error.

- If no retrieved source supports a TAM/SAM/SOM figure, return null for that figure. A null figure is correct; an invented figure is a failure.
- If you cannot attribute a competitor or signal to a retrieved source, omit it. Empty lists are acceptable.
- Never adjust, extrapolate, or combine numbers across sources into a new number. Report figures as the source states them; scope differences go in the "basis" field.

─── YOUR JOB ─────────────────────────────────────────────────────────────────

1. TAM / SAM / SOM — only from retrieved market-size sources. value = the figure as stated (e.g. "$4.2B by 2030, 12.1% CAGR"). basis = what market the source measured and how it maps to this technology. If sources only support a TAM, set sam/som to null.
2. COMPETITORS (0-10) — real companies/products named in the retrieved sources. positioning = what they do per the source. stage = maturity per the source (e.g. "Series B", "public", "research spin-off"); say "Unknown" if the source doesn't state it. signal = the concrete fact the source reports.
3. MARKET SIGNALS (0-10) — funding rounds, patent activity, demand or policy indicators found in the sources. impact: High (direct evidence for this technology's market), Medium (adjacent), Watch (weak/ambiguous).
4. SUMMARY — 3-6 sentences synthesizing what the retrieved evidence says about the commercial opportunity, including what could NOT be established from the sources (gaps are signal too).

Context about the technology (for relevance judgment ONLY — never as a citable source):
`

function formatSources(sources: MarketSource[]): string {
	const lines = sources.map((s, i) =>
		[
			`[${i + 1}] ${s.title}`,
			`    url: ${s.url}`,
			`    category: ${s.category} | published: ${s.publishedDate ?? 'unknown'}`,
			`    snippet: ${s.snippet}`,
		].join('\n')
	)
	return `── RETRIEVED SOURCES (the ONLY citable URLs) ────────────────────────────\n\n${lines.join('\n\n')}`
}

// Computed once at module load — the same Zod schema drives Gemini's
// constrained generation; grounding is checked by buildMarketScoutValidator.
const MARKET_SCOUT_RESPONSE_SCHEMA = zodToGeminiSchema(marketScoutBaseSchema)

export async function runMarketSynthesis(
	paperAnalysis: PaperAgentOutput,
	sources: MarketSource[],
	projectId: string,
	options?: {
		/**
		 * Override the set of URLs accepted by the grounding validator.
		 * ONLY for testing the rejection path — production always grounds
		 * against the URLs of the sources passed in.
		 */
		allowedUrls?: string[]
	}
): Promise<MarketScoutOutput> {
	const log = createAgentLogger('Market Scout (synthesis)', 3, projectId)
	const startTime = Date.now()

	log.start()

	const allowedUrls = options?.allowedUrls ?? sources.map((s) => s.url)
	const validator = buildMarketScoutValidator(allowedUrls)

	const technologyContext = [
		`Domain: ${paperAnalysis.domain} (${paperAnalysis.domainClassification})`,
		`Novelty: ${paperAnalysis.noveltySummary}`,
		`Key claims: ${paperAnalysis.keyClaims.join(' | ')}`,
	].join('\n')

	let validationFeedback: string | null = null

	for (let attempt = 1; attempt <= MAX_SYNTHESIS_ATTEMPTS; attempt += 1) {
		const result = await gemini.generateContent(
			[
				{ text: SYNTHESIS_PROMPT + technologyContext },
				{ text: formatSources(sources) },
				...(validationFeedback
					? [{
							text: `── PREVIOUS ATTEMPT REJECTED BY VALIDATOR ──────────────────────────\n\n${validationFeedback}\n\nFix every issue above: cite only URLs that appear VERBATIM in the retrieved sources, return null for figures you cannot ground, and drop claims you cannot attribute.`,
						}]
					: []),
			],
			{ responseSchema: MARKET_SCOUT_RESPONSE_SCHEMA, agentKey: 'market-synthesis' }
		)

		const text = result.response.text()
		log.debug('Raw Gemini response received', { attempt, responseLength: text.length })

		let rawOutput: unknown
		try {
			rawOutput = JSON.parse(text)
		} catch {
			log.error('Failed to parse Gemini JSON response', { rawText: text.slice(0, 500) })
			throw new Error('Agent 3 returned invalid JSON')
		}

		const validation = validator.safeParse(rawOutput)

		if (validation.success) {
			const output = validation.data
			log.complete(Date.now() - startTime)
			log.info('Output summary', {
				attempt,
				tam: output.tam?.value ?? null,
				competitorCount: output.competitors.length,
				signalCount: output.signals.length,
			})
			return output
		}

		validationFeedback = validation.error.issues
			.map((issue) => `- at ${issue.path.join('.') || '(root)'}: ${issue.message}`)
			.join('\n')

		log.validationFailed(validation.error.flatten())
		log.retry(attempt, `Synthesis output rejected by grounding validator — feeding errors back`)
	}

	throw new Error(
		`Agent 3 output validation failed: output remained ungrounded after ${MAX_SYNTHESIS_ATTEMPTS} attempts. Last errors:\n${validationFeedback}`
	)
}
