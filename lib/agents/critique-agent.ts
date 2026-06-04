import { gemini } from './gemini-client'
import { zodToGeminiSchema } from './gemini-schema'
import { paperCritiqueSchema } from './validators'
import { buildFeasibilityContext } from './feasibility-agent'
import { buildRefMenu } from './pitch-builder-agent'
import { createAgentLogger } from '../logger'
import type {
	FeasibilityScoutOutput,
	MarketScoutOutput,
	PaperAgentOutput,
	PaperCritiqueOutput,
	PitchBuilderOutput,
	TrlIrlAgentOutput,
} from './types'

/**
 * ─── Critique: Skeptical Review of Agent 1 ───────────────────────────────────
 *
 * Role: Audit Agent 1's analysis AGAINST THE PAPER TEXT before Agent 2
 *       scores TRL/IRL from it. Agent 2 never sees the paper — any
 *       ungrounded claim that survives this step becomes an ungrounded
 *       readiness score.
 *
 * Input:  Raw PDF (base64) + PaperAgentOutput — the only other consumer
 *         of the PDF besides Agent 1 itself.
 * Output: PaperCritiqueOutput — verdict, grounding issues, summary.
 *
 * If the verdict is NEEDS_REVISION, the pipeline regenerates Agent 1
 * exactly ONCE with the critique as context (see buildRevisionContext).
 */

const CRITIQUE_PROMPT = `
You are the SKEPTICAL REVIEWER in Lemma's commercialization pipeline.

You sit between Agent 1 (Paper Analysis) and Agent 2 (TRL/IRL Scoring). Agent 2 will score technology readiness using ONLY Agent 1's output — it never sees the paper. Any ungrounded claim or readiness justification that survives you becomes an ungrounded TRL/IRL score downstream.

You receive:
1. The original research paper (PDF)
2. Agent 1's structured analysis of it (JSON, after this prompt)

Your job: verify every statement Agent 1 attributes to the paper against the actual paper text. You are the reviewer who checks the tables, not the one who skims the abstract.

─── CHECK EACH OF THESE ─────────────────────────────────────────────────────

1. keyClaims — Does each claim's specific data (numbers, tables, figures, statistical values) actually appear in the paper? Flag invented metrics, misquoted figures, wrong table references, and claims that exaggerate what the paper demonstrates.
2. claimConfidence — Is each EVIDENCE_BACKED tag backed by experiments/data actually in the paper? Flag tags that should be INFERRED or SPECULATIVE, and reasoning that cites evidence the paper does not contain.
3. methodologyStrength — Is the rating consistent with the experimental design actually described (controls, sample sizes, statistical tests, reproducibility)?
4. commercializationBarriers — Are these drawn from the paper's own limitations and experimental scope, or invented?
5. initialReadinessEstimate — Is this readiness justification consistent with the validation evidence actually shown in the paper (the same evidence Agent 2 will use to score TRL/IRL)? Flag scores propped up by claims you flagged above.
6. abstractSummary / noveltySummary — Flag any statement ATTRIBUTED TO THE PAPER that the paper text does not support.

─── OUT OF SCOPE (do NOT flag) ──────────────────────────────────────────────

- External knowledge not attributed to the paper (competitor names, funding programs, regulatory context)
- Style, phrasing, or completeness preferences
- Defensible judgment calls — only flag what the paper text contradicts or fails to support

─── SEVERITY ────────────────────────────────────────────────────────────────

CRITICAL: fabricated or misquoted data, an EVIDENCE_BACKED tag on a claim the paper does not demonstrate, a readiness estimate contradicted by the paper's actual validation level
MINOR: imprecise paraphrase, slightly overstated wording, missing caveat

─── VERDICT ─────────────────────────────────────────────────────────────────

NEEDS_REVISION: one or more CRITICAL issues found
PASS: zero CRITICAL issues (MINOR issues alone never trigger revision)

Be genuinely skeptical — open the tables and check the numbers — but do not manufacture issues to look thorough. An analysis that is fully grounded gets a clean PASS with an empty or MINOR-only issues list.

─── OUTPUT ──────────────────────────────────────────────────────────────────

For each issue:
- field: which part of Agent 1's output, e.g. "keyClaims[1]", "claimConfidence[0]", "initialReadinessEstimate"
- quote: the exact text from Agent 1's output you are challenging
- issue: what the paper actually says, or fails to say
- severity: CRITICAL | MINOR

Plus a verdict (PASS | NEEDS_REVISION) and a 1-3 sentence summary of the overall grounding quality.
`

// Computed once at module load — the same Zod schema drives Gemini's
// constrained generation AND the safeParse validation below.
const CRITIQUE_RESPONSE_SCHEMA = zodToGeminiSchema(paperCritiqueSchema)

export async function runPaperCritique(
	pdfBase64: string,
	paperAnalysis: PaperAgentOutput,
	projectId: string
): Promise<PaperCritiqueOutput> {
	const log = createAgentLogger('Skeptical Review', 1.5, projectId)
	const startTime = Date.now()

	log.start()

	const result = await gemini.generateContent(
		[
			{
				inlineData: {
					data: pdfBase64,
					mimeType: 'application/pdf',
				},
			},
			{ text: CRITIQUE_PROMPT },
			{
				text: `── AGENT 1 OUTPUT TO AUDIT ──────────────────────────────────────────\n\n${JSON.stringify(paperAnalysis, null, 2)}`,
			},
		],
		{ responseSchema: CRITIQUE_RESPONSE_SCHEMA }
	)

	const text = result.response.text()
	log.debug('Raw Gemini response received', { responseLength: text.length })

	let rawOutput: unknown
	try {
		rawOutput = JSON.parse(text)
	} catch {
		log.error('Failed to parse Gemini JSON response', { rawText: text.slice(0, 500) })
		throw new Error('Critique agent returned invalid JSON')
	}

	// ── Validate output with Zod ─────────────────────────────────────────
	const validation = paperCritiqueSchema.safeParse(rawOutput)

	if (!validation.success) {
		log.validationFailed(validation.error.flatten())
		throw new Error(
			`Critique agent output validation failed: ${validation.error.issues.map((i) => i.message).join('; ')}`
		)
	}

	const output = validation.data
	const durationMs = Date.now() - startTime

	log.complete(durationMs)
	log.info('Output summary', {
		verdict: output.verdict,
		issueCount: output.issues.length,
		criticalCount: output.issues.filter((i) => i.severity === 'CRITICAL').length,
	})

	return output
}

// ─── Feasibility Critique: Skeptical Review of Agent 4 ───────────────────────
//
// Same pattern as the paper critique, different grounding target: Agent 4
// reasons (no retrieval), so the reviewer checks traceability-to-inputs and
// honesty of uncertainty — not citations. CRITICAL findings trigger exactly
// one regeneration; an unusable critique falls back to the original output.

const FEASIBILITY_CRITIQUE_PROMPT = `
You are the SKEPTICAL REVIEWER auditing Agent 4 (Feasibility) in Lemma's commercialization pipeline.

Agent 4 reasons about team, timeline, capital, and risks using ONLY the structured inputs from Agent 1 (paper analysis), Agent 2 (TRL/IRL), and optionally Agent 3 (market brief). It does not retrieve and cites no sources — so the audit standard here is NOT citations. It is:

1. TRACEABILITY — does every estimate, role, and risk follow from the inputs?
2. HONESTY — does every confidence level match how thin the evidence actually is?

You receive the same inputs Agent 4 saw, followed by Agent 4's output. Check:

- TEAM MATRIX: Does each role's rationale trace to something real in the inputs (a claim, a risk flag, the pathway, the domain)? Flag invented expertise the inputs do not imply (e.g. quantum-hardware PhDs for an NLP paper) and rationales that cite things the inputs do not say.
- TIMELINE: Is the range consistent with the TRL gap and domain calibration in the inputs? Flag ranges that are implausibly narrow for the stated uncertainty, or reasoning that contradicts Agent 2's assessment.
- CAPITAL: Does every major cost driver correspond to work the inputs imply? Flag drivers with no basis, a range too narrow for the stated unknowns, and reasoning that fails to explain the uncertainty.
- KEY RISKS: Are they derived from the TRL gap and risk flags? Flag risks invented from outside the inputs, and important input risk flags with no execution consequence reflected.
- CONFIDENCE LEVELS (per-range and overall): A HIGH confidence on top of SPECULATIVE claims, WEAK methodology, low TRL, or many risk flags is a CRITICAL finding. Over-confidence is the failure mode this audit exists to catch.

OUT OF SCOPE (do not flag):
- Style, phrasing, or formatting preferences
- Defensible judgment calls within a reasonable range
- The absence of market figures when no market brief was provided (that is correct behavior)

SEVERITY:
- CRITICAL: an estimate/role/risk with no basis in the inputs, a cost driver with no implied work behind it, or a confidence level clearly unjustified by the evidence
- MINOR: imprecise traceability, slightly narrow range, missing caveat

VERDICT:
- NEEDS_REVISION: one or more CRITICAL issues
- PASS: zero CRITICAL issues (MINOR issues alone never trigger revision)

For each issue: field (e.g. "teamMatrix[2].domainExpertise", "capitalEstimate.confidence"), quote (the exact text/value from Agent 4's output), issue (why it does not follow from the inputs), severity. Plus a verdict and a 1-3 sentence summary.
`

export async function runFeasibilityCritique(
	paperAnalysis: PaperAgentOutput,
	trlIrlAnalysis: TrlIrlAgentOutput,
	marketAnalysis: MarketScoutOutput | null,
	feasibility: FeasibilityScoutOutput,
	projectId: string
): Promise<PaperCritiqueOutput> {
	const log = createAgentLogger('Skeptical Review (Feasibility)', 4.5, projectId)
	const startTime = Date.now()

	log.start()

	const result = await gemini.generateContent(
		[
			{ text: FEASIBILITY_CRITIQUE_PROMPT },
			{
				text: `── INPUTS AGENT 4 WORKED FROM ──────────────────────────────────────\n\n${buildFeasibilityContext(paperAnalysis, trlIrlAnalysis, marketAnalysis)}`,
			},
			{
				text: `── AGENT 4 OUTPUT TO AUDIT ─────────────────────────────────────────\n\n${JSON.stringify(feasibility, null, 2)}`,
			},
		],
		{ responseSchema: CRITIQUE_RESPONSE_SCHEMA }
	)

	const text = result.response.text()
	log.debug('Raw Gemini response received', { responseLength: text.length })

	let rawOutput: unknown
	try {
		rawOutput = JSON.parse(text)
	} catch {
		log.error('Failed to parse Gemini JSON response', { rawText: text.slice(0, 500) })
		throw new Error('Critique agent returned invalid JSON')
	}

	const validation = paperCritiqueSchema.safeParse(rawOutput)

	if (!validation.success) {
		log.validationFailed(validation.error.flatten())
		throw new Error(
			`Critique agent output validation failed: ${validation.error.issues.map((i) => i.message).join('; ')}`
		)
	}

	const output = validation.data
	log.complete(Date.now() - startTime)
	log.info('Output summary', {
		verdict: output.verdict,
		issueCount: output.issues.length,
		criticalCount: output.issues.filter((i) => i.severity === 'CRITICAL').length,
	})

	return output
}

/**
 * Turns a feasibility critique into the revision context appended to
 * Agent 4's prompt for the single regeneration pass.
 */
export function buildFeasibilityRevisionContext(critique: PaperCritiqueOutput): string {
	const issueList = critique.issues
		.map(
			(issue, i) =>
				`${i + 1}. [${issue.severity}] ${issue.field}\n   Flagged: "${issue.quote}"\n   Problem: ${issue.issue}`
		)
		.join('\n')

	return `
── REVISION REQUIRED — SKEPTICAL REVIEW FINDINGS ────────────────────────────

A skeptical reviewer audited your previous feasibility assessment against the Agent 1/2/3 inputs and found these traceability/honesty issues:

${issueList}

Reviewer summary: ${critique.summary}

Regenerate the COMPLETE assessment with every issue fixed:
- Remove or re-derive any role, estimate, or risk that does not follow from the inputs.
- Lower any confidence level the evidence does not support, and widen ranges to match the real uncertainty.
- Make every rationale and cost driver name the input that drives it.
- Do NOT introduce new estimates that are not grounded in the inputs.
- Keep everything that was NOT flagged unchanged.
`
}

// ─── Pitch Critique: Traceability Review of Agent 5 ──────────────────────────
//
// Cross-agent consistency check pointed at the deck: every factual claim on a
// slide must be present in — and match — the upstream agent outputs. Polices
// FACTS only; narrative/persuasive prose is explicitly out of scope so the
// writing isn't strangled. CRITICAL → one regeneration; best-effort fallback.

const PITCH_CRITIQUE_PROMPT = `
You are the TRACEABILITY REVIEWER auditing Agent 5 (Pitch Builder) in Lemma's pipeline.

Agent 5 builds an investor deck by SYNTHESIZING facts from agents 1–4. It is allowed to restate and reframe upstream facts persuasively, but it may NOT introduce a single new fact. A deck is what an investor reads — an unsourced number on a slide is the failure this audit exists to catch.

You receive the canonical UPSTREAM FACTS (the only legitimate source of any claim) and the DECK to audit.

─── WHAT TO POLICE (facts only) ──────────────────────────────────────────────

Check every factual CLAIM on every slide — numbers, market sizes (TAM/SAM/SOM), competitor names/counts, TRL/IRL levels, capital figures, timelines, team roles, technical capabilities. For each such claim:
- Is the fact present in the UPSTREAM FACTS? Flag any claim with no upstream basis (invented number, a capability the paper analysis never supported, a grant or competitor not upstream).
- Does the VALUE match? Flag mismatches — a market size that differs from market.tam, a capital figure that doesn't match feasibility.capitalEstimate, a TRL that isn't trlIrl.trlScore, a number rounded or inflated away from its upstream value.
- Does the confidence/certainty match? Flag a slide that presents a low-confidence feasibility figure as a hard promise.

─── EXPLICITLY OUT OF SCOPE (do NOT flag) ────────────────────────────────────

- Narrative, vision, persuasive framing, problem stakes, tone, word choice — prose is FREE. Do not flag a slide for being ambitious or emotive.
- Reasonable restatement/paraphrase of an upstream fact in plainer language.
- The ABSENCE of a market slide when no market facts exist upstream (that is correct).
- Editorial/structure preferences.

Only flag a FACTUAL claim that is absent upstream or contradicts an upstream value. When in doubt about whether something is prose vs a claim, and it carries no number/specific capability, leave it alone.

─── SEVERITY ────────────────────────────────────────────────────────────────

CRITICAL: a numeric/technical claim with no upstream basis, or one that contradicts the upstream value (wrong market size, wrong capital, wrong TRL, invented competitor/figure).
MINOR: a slightly loose paraphrase of a real upstream fact, or a missing nuance.

VERDICT:
- NEEDS_REVISION: one or more CRITICAL issues
- PASS: zero CRITICAL issues (MINOR issues alone never trigger revision)

For each issue: field (e.g. "slides[3].bullets[1]"), quote (the exact claim text from the deck), issue (what upstream says, or that nothing does), severity. Plus a verdict and a 1-3 sentence summary.
`

export async function runPitchCritique(
	paper: PaperAgentOutput,
	trlIrl: TrlIrlAgentOutput,
	market: MarketScoutOutput | null,
	feasibility: FeasibilityScoutOutput,
	deck: PitchBuilderOutput,
	projectId: string
): Promise<PaperCritiqueOutput> {
	const log = createAgentLogger('Traceability Review (Pitch)', 5.5, projectId)
	const startTime = Date.now()

	log.start()

	const menu = buildRefMenu(paper, trlIrl, market, feasibility)
	const factsBlock = menu
		.map((e) => `  ${e.ref} = ${e.value}${e.sourceUrl ? `  [source: ${e.sourceUrl}]` : ''}`)
		.join('\n')

	const result = await gemini.generateContent(
		[
			{ text: PITCH_CRITIQUE_PROMPT },
			{ text: `── UPSTREAM FACTS (the ONLY legitimate basis for any claim) ─────────\n\n${factsBlock}` },
			{ text: `── DECK TO AUDIT ───────────────────────────────────────────────────\n\n${JSON.stringify(deck, null, 2)}` },
		],
		{ responseSchema: CRITIQUE_RESPONSE_SCHEMA }
	)

	const text = result.response.text()
	log.debug('Raw Gemini response received', { responseLength: text.length })

	let rawOutput: unknown
	try {
		rawOutput = JSON.parse(text)
	} catch {
		log.error('Failed to parse Gemini JSON response', { rawText: text.slice(0, 500) })
		throw new Error('Critique agent returned invalid JSON')
	}

	const validation = paperCritiqueSchema.safeParse(rawOutput)

	if (!validation.success) {
		log.validationFailed(validation.error.flatten())
		throw new Error(
			`Critique agent output validation failed: ${validation.error.issues.map((i) => i.message).join('; ')}`
		)
	}

	const output = validation.data
	log.complete(Date.now() - startTime)
	log.info('Output summary', {
		verdict: output.verdict,
		issueCount: output.issues.length,
		criticalCount: output.issues.filter((i) => i.severity === 'CRITICAL').length,
	})

	return output
}

/**
 * Turns a pitch critique into the revision context appended to Agent 5's
 * prompt for the single regeneration pass.
 */
export function buildPitchRevisionContext(critique: PaperCritiqueOutput): string {
	const issueList = critique.issues
		.map(
			(issue, i) =>
				`${i + 1}. [${issue.severity}] ${issue.field}\n   Flagged claim: "${issue.quote}"\n   Problem: ${issue.issue}`
		)
		.join('\n')

	return `
── REVISION REQUIRED — TRACEABILITY REVIEW FINDINGS ─────────────────────────

A traceability reviewer audited your deck against the upstream agent outputs and found factual claims that are not grounded upstream:

${issueList}

Reviewer summary: ${critique.summary}

Regenerate the COMPLETE deck with every issue fixed:
- Remove or correct any number, market size, capability, or figure that is not in the AVAILABLE FACTS menu or that contradicts its upstream value.
- Restate facts at their upstream values exactly — do not round, inflate, or merge them.
- Keep your narrative and framing; only the flagged factual claims need to change.
- Do NOT introduce any new fact to replace a removed one.
`
}

/**
 * Turns a critique into the revision context appended to Agent 1's prompt
 * for the single regeneration pass.
 */
export function buildRevisionContext(critique: PaperCritiqueOutput): string {
	const issueList = critique.issues
		.map(
			(issue, i) =>
				`${i + 1}. [${issue.severity}] ${issue.field}\n   Flagged text: "${issue.quote}"\n   Problem: ${issue.issue}`
		)
		.join('\n')

	return `
── REVISION REQUIRED — SKEPTICAL REVIEW FINDINGS ────────────────────────────

A skeptical reviewer audited your previous analysis against the paper text and found these grounding issues:

${issueList}

Reviewer summary: ${critique.summary}

Regenerate the COMPLETE analysis with every issue fixed:
- Remove or rewrite any claim whose data does not appear in the paper.
- Downgrade confidence tags the paper does not support (EVIDENCE_BACKED → INFERRED → SPECULATIVE).
- Adjust methodologyStrength and initialReadinessEstimate if the fixes affect them.
- Do NOT introduce new claims that are not grounded in the paper text.
- Keep everything that was NOT flagged unchanged.
`
}
