import { gemini } from './gemini-client'
import { zodToGeminiSchema } from './gemini-schema'
import {
	pitchBuilderBaseSchema,
	buildPitchValidator,
	normalizeSourceUrl,
	type PitchRefIndex,
} from './validators'
import { createAgentLogger } from '../logger'
import type {
	FeasibilityScoutOutput,
	MarketScoutOutput,
	PaperAgentOutput,
	PitchBuilderOutput,
	TrlIrlAgentOutput,
} from './types'

/**
 * ─── Agent 5: Pitch Builder ──────────────────────────────────────────────────
 *
 * Synthesizes a structured investor deck (slide CONTENT, not a rendered file)
 * from agents 1–4. It is a synthesizer, not a source: it may restate, reframe,
 * and structure upstream facts but introduce NO new fact. Every factual claim
 * on a slide carries a factRef naming its upstream origin; market figures also
 * carry the Market Scout sourceUrl so the deck is citable.
 *
 * Two guardrails, both proven elsewhere in this pipeline:
 *   1. Structural (here): buildPitchValidator rejects invented refs and any
 *      market figure missing/mismatching its carried sourceUrl. Failures feed
 *      the Zod errors back into the prompt and retry (max attempts below).
 *   2. Semantic (Inngest critique-pitch step): a traceability reviewer flags
 *      any claim whose VALUE doesn't match upstream, triggering one regen.
 *
 * Input:  paper (post-critique) + trlIrl + market|null + feasibility
 * Output: PitchBuilderOutput (ordered slides with factRefs)
 *
 * NOTE: uses the structured upstream values (e.g. feasibility.capitalEstimate
 * range object), NOT the legacy display strings.
 */

const MAX_STRUCTURAL_ATTEMPTS = 3

// ─── Building the citation menu the model must pick from ─────────────────────

interface RefMenuEntry {
	ref: string
	value: string
	sourceUrl?: string
}

/**
 * Enumerates every citable upstream fact as a (ref, value, sourceUrl?) entry.
 * This is both the menu shown to the model AND the source of truth for the
 * structural validator's index — so the two can never drift.
 */
export function buildRefMenu(
	paper: PaperAgentOutput,
	trlIrl: TrlIrlAgentOutput,
	market: MarketScoutOutput | null,
	feasibility: FeasibilityScoutOutput
): RefMenuEntry[] {
	const menu: RefMenuEntry[] = []

	// Paper (Agent 1)
	menu.push({ ref: 'paper.domain', value: paper.domain })
	menu.push({ ref: 'paper.domainClassification', value: paper.domainClassification })
	menu.push({ ref: 'paper.abstractSummary', value: paper.abstractSummary })
	menu.push({ ref: 'paper.noveltySummary', value: paper.noveltySummary })
	menu.push({ ref: 'paper.methodologyStrength', value: paper.methodologyStrength })
	menu.push({ ref: 'paper.institutionContext', value: paper.institutionContext })
	menu.push({ ref: 'paper.initialReadinessEstimate', value: `${paper.initialReadinessEstimate}/100` })
	paper.keyClaims.forEach((c, i) => menu.push({ ref: `paper.keyClaims[${i}]`, value: c }))
	;(paper.commercializationBarriers ?? []).forEach((b, i) =>
		menu.push({ ref: `paper.commercializationBarriers[${i}]`, value: b })
	)

	// TRL/IRL (Agent 2)
	menu.push({ ref: 'trlIrl.trlScore', value: trlIrl.trlScore })
	menu.push({ ref: 'trlIrl.irlScore', value: trlIrl.irlScore })
	menu.push({ ref: 'trlIrl.confidence', value: trlIrl.confidence })
	menu.push({ ref: 'trlIrl.commercializationPathway', value: trlIrl.commercializationPathway })
	menu.push({ ref: 'trlIrl.pathwayRationale', value: trlIrl.pathwayRationale })
	menu.push({ ref: 'trlIrl.timeToMarket', value: trlIrl.timeToMarket })
	menu.push({ ref: 'trlIrl.domainRubricApplied', value: trlIrl.domainRubricApplied })
	trlIrl.riskFlags.forEach((r, i) => menu.push({ ref: `trlIrl.riskFlags[${i}]`, value: r }))
	;(trlIrl.recommendedGrants ?? []).forEach((g, i) =>
		menu.push({ ref: `trlIrl.recommendedGrants[${i}]`, value: g })
	)

	// Market Scout (Agent 3) — optional, carries source URLs
	if (market) {
		if (market.tam) menu.push({ ref: 'market.tam', value: market.tam.value, sourceUrl: market.tam.sourceUrl })
		if (market.sam) menu.push({ ref: 'market.sam', value: market.sam.value, sourceUrl: market.sam.sourceUrl })
		if (market.som) menu.push({ ref: 'market.som', value: market.som.value, sourceUrl: market.som.sourceUrl })
		menu.push({ ref: 'market.summary', value: market.summary })
		market.competitors.forEach((c, i) =>
			menu.push({ ref: `market.competitors[${i}]`, value: `${c.name} — ${c.signal}`, sourceUrl: c.sourceUrl })
		)
		market.signals.forEach((s, i) =>
			menu.push({ ref: `market.signals[${i}]`, value: `${s.title}: ${s.summary}`, sourceUrl: s.sourceUrl })
		)
	}

	// Feasibility (Agent 4) — use the STRUCTURED values, not display strings
	const t = feasibility.estimatedTimeline
	menu.push({ ref: 'feasibility.estimatedTimeline', value: `${t.minMonths}-${t.maxMonths} months (${t.confidence} confidence)` })
	const cap = feasibility.capitalEstimate
	menu.push({ ref: 'feasibility.capitalEstimate', value: `₹${cap.minINR}-${cap.maxINR} (${cap.confidence} confidence)` })
	menu.push({ ref: 'feasibility.overallConfidence', value: `${feasibility.overallConfidence.level}` })
	feasibility.teamMatrix.forEach((r, i) =>
		menu.push({ ref: `feasibility.teamMatrix[${i}]`, value: `${r.role} — ${r.domainExpertise}` })
	)
	feasibility.keyRisks.forEach((r, i) => menu.push({ ref: `feasibility.keyRisks[${i}]`, value: r }))

	return menu
}

/** Derives the structural validator's index from the same menu shown to the model */
export function buildRefIndex(menu: RefMenuEntry[], marketPresent: boolean): PitchRefIndex {
	const validRefs = new Set(menu.map((e) => e.ref))
	const marketSourceByRef = new Map<string, string>()
	const allowedMarketUrls = new Set<string>()

	for (const entry of menu) {
		if (entry.sourceUrl) {
			marketSourceByRef.set(entry.ref, normalizeSourceUrl(entry.sourceUrl))
			allowedMarketUrls.add(normalizeSourceUrl(entry.sourceUrl))
		}
	}

	return { validRefs, marketSourceByRef, allowedMarketUrls, marketPresent }
}

function formatRefMenu(menu: RefMenuEntry[]): string {
	const lines = menu.map((e) => {
		const src = e.sourceUrl ? `  [sourceUrl to carry: ${e.sourceUrl}]` : ''
		const value = e.value.length > 220 ? `${e.value.slice(0, 220)}…` : e.value
		return `  ${e.ref} = ${value}${src}`
	})
	return lines.join('\n')
}

const PITCH_BUILDER_PROMPT = `
You are Agent 5 in Lemma's commercialization pipeline.

Your role: PITCH BUILDER.
You write the structured content of an investor deck for a research commercialization opportunity. You are a SYNTHESIZER, not a source.

─── THE ONE RULE THAT MATTERS ────────────────────────────────────────────────

You may RESTATE, REFRAME, and STRUCTURE facts that already exist in the upstream agent outputs. You may NOT introduce a single new fact.

- Narrative and persuasive framing are FREE: vision, why-now, problem stakes, momentum — write compellingly.
- Factual CLAIMS are NOT free. Any number, market size, competitor, TRL/IRL, capital figure, timeline, team role, or technical capability you put on a slide MUST come from the AVAILABLE FACTS menu below.
- Do NOT invent figures, round upstream numbers to "nicer" ones, merge two numbers into a new one, or state a capability the paper analysis did not support.
- If a fact you want is not in the menu, you cannot use it. Reframe with what exists.

─── HOW TO CITE (factRefs) ───────────────────────────────────────────────────

Every bullet that contains a factual claim must be backed by one or more factRefs on that slide. A factRef is { ref, sourceUrl }:
- ref: copy the EXACT ref string from the AVAILABLE FACTS menu (e.g. "market.tam", "paper.keyClaims[2]", "feasibility.capitalEstimate").
- sourceUrl: for any market.* ref that shows a "[sourceUrl to carry: …]", copy that URL VERBATIM into sourceUrl. For every other ref, set sourceUrl to "" (empty string).
- Pure-narrative slides (e.g. a vision or problem-framing slide with no hard claims) may have an empty factRefs array — but then their bullets must not contain numbers or specific technical claims.

Output is machine-validated: an invented ref, or a market figure missing its source URL, is rejected and returned to you as an error.

─── DECK STRUCTURE ───────────────────────────────────────────────────────────

Produce an ordered deck (4–12 slides) using these slideTypes. Include MARKET only if market facts appear in the menu; if there are none, skip the market slide entirely (do not fabricate one):
  PROBLEM     — the pain/opportunity (framing; claims optional)
  SOLUTION    — what the technology does (from paper.noveltySummary / keyClaims)
  TECHNOLOGY  — how it works and why it's defensible (from paper.* claims)
  MARKET      — size and competitive signals (from market.* — carry source URLs)
  READINESS   — TRL/IRL position and what it means (from trlIrl.*)
  FEASIBILITY — timeline + capital to the next milestone (from feasibility.* ranges)
  TEAM        — the roles needed to execute (from feasibility.teamMatrix[*])
  ASK         — what is being requested, grounded in the capital/timeline ranges and pathway

Honor uncertainty: if feasibility.overallConfidence is low or the TRL is early, the ASK and FEASIBILITY slides must read as a range with that confidence, not false precision.

─── OUTPUT ──────────────────────────────────────────────────────────────────

Each slide: { order, slideType, title, bullets[], narrative, factRefs[] }. Return ONLY valid JSON.

The available facts (your ONLY citable claims) follow.
`

// Computed once at module load — the same Zod base schema drives Gemini's
// constrained generation; grounding is checked by buildPitchValidator.
const PITCH_RESPONSE_SCHEMA = zodToGeminiSchema(pitchBuilderBaseSchema)

export async function runPitchBuilder(
	paper: PaperAgentOutput,
	trlIrl: TrlIrlAgentOutput,
	market: MarketScoutOutput | null,
	feasibility: FeasibilityScoutOutput,
	projectId: string,
	revisionContext?: string
): Promise<PitchBuilderOutput> {
	const log = createAgentLogger('Pitch Builder', 5, projectId)
	const startTime = Date.now()

	log.start()
	if (revisionContext) log.info('Regenerating with critique context')

	const menu = buildRefMenu(paper, trlIrl, market, feasibility)
	const index = buildRefIndex(menu, market !== null)
	const validator = buildPitchValidator(index)
	const menuBlock = `── AVAILABLE FACTS (your ONLY citable claims) ───────────────────────────\n\n${formatRefMenu(menu)}`

	let validationFeedback: string | null = null

	for (let attempt = 1; attempt <= MAX_STRUCTURAL_ATTEMPTS; attempt += 1) {
		const result = await gemini.generateContent(
			[
				{ text: PITCH_BUILDER_PROMPT },
				{ text: menuBlock },
				...(revisionContext ? [{ text: revisionContext }] : []),
				...(validationFeedback
					? [{
							text: `── PREVIOUS ATTEMPT REJECTED BY VALIDATOR ──────────────────────────\n\n${validationFeedback}\n\nFix every issue: cite only refs that appear in the AVAILABLE FACTS menu, carry the exact sourceUrl for market figures, and remove any claim you cannot ground.`,
						}]
					: []),
			],
			{ responseSchema: PITCH_RESPONSE_SCHEMA }
		)

		const text = result.response.text()
		log.debug('Raw Gemini response received', { attempt, responseLength: text.length })

		let rawOutput: unknown
		try {
			rawOutput = JSON.parse(text)
		} catch {
			log.error('Failed to parse Gemini JSON response', { rawText: text.slice(0, 500) })
			throw new Error('Agent 5 returned invalid JSON')
		}

		const validation = validator.safeParse(rawOutput)

		if (validation.success) {
			const output = validation.data
			log.complete(Date.now() - startTime)
			log.info('Output summary', {
				attempt,
				slideCount: output.slides.length,
				factRefCount: output.slides.reduce((n, s) => n + s.factRefs.length, 0),
				marketIncluded: output.slides.some((s) => s.slideType === 'MARKET'),
			})
			return output
		}

		validationFeedback = validation.error.issues
			.map((issue) => `- at ${issue.path.join('.') || '(root)'}: ${issue.message}`)
			.join('\n')

		log.validationFailed(validation.error.flatten())
		log.retry(attempt, 'Deck rejected by structural grounding validator — feeding errors back')
	}

	throw new Error(
		`Agent 5 output validation failed: deck remained ungrounded after ${MAX_STRUCTURAL_ATTEMPTS} attempts. Last errors:\n${validationFeedback}`
	)
}
