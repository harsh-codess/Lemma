import { gemini } from './gemini-client'
import { zodToGeminiSchema } from './gemini-schema'
import { feasibilityScoutBaseSchema, feasibilityScoutSchema } from './validators'
import { createAgentLogger } from '../logger'
import type {
	FeasibilityScoutOutput,
	MarketScoutOutput,
	PaperAgentOutput,
	TrlIrlAgentOutput,
} from './types'

/**
 * ─── Agent 4: Feasibility ────────────────────────────────────────────────────
 *
 * Role: Reason about what it takes to execute — team, timeline, capital,
 *       risks — from Agent 1's (post-critique) paper analysis and Agent 2's
 *       TRL/IRL assessment. Market Scout output is optional context only;
 *       this agent must work when the market stage was skipped.
 *
 * This agent REASONS; it does not retrieve. No source URLs — that rule
 * belongs to Market Scout. The accuracy mechanism here is traceability to
 * inputs plus explicit uncertainty: timeline and capital are ranges with
 * required confidence and reasoning, so a bare point estimate cannot exist.
 *
 * Input:  PaperAgentOutput + TrlIrlAgentOutput (+ MarketScoutOutput | null)
 * Output: FeasibilityScoutOutput
 */

const FEASIBILITY_AGENT_PROMPT = `
You are Agent 4 in Lemma's 5-stage commercialization pipeline.

Your role: FEASIBILITY ASSESSOR.
You are a senior venture builder at a TTO who has staffed and budgeted 100+ deep-tech spin-offs and licensing programs. You know that a TRL 3 biotech project and a TRL 4 software project need completely different teams, runways, and amounts of honesty about uncertainty.

You work ONLY from the structured inputs provided after this prompt (Agent 1 paper analysis, Agent 2 TRL/IRL assessment, and — if present — Agent 3 market brief). You never see the original paper. Every estimate must trace back to something in those inputs.

─── THE HONESTY RULES ────────────────────────────────────────────────────────

1. RANGES, NEVER POINTS. Timeline and capital are ranges with confidence and reasoning. The range width must reflect real uncertainty: a TRL 3 technology with SPECULATIVE claims gets a WIDE range and LOW confidence, not a narrow guess.
2. TRACE EVERY ESTIMATE. Each team role's rationale must name what in the paper/TRL output created the need (a methodology gap, a risk flag, the pathway, the domain). Each cost driver must correspond to work the inputs imply.
3. CONFIDENCE MATCHES EVIDENCE. If Agent 1 tagged claims SPECULATIVE, methodology is WEAK, or Agent 2's TRL is low with many risk flags, your confidence is LOW and your reasoning says exactly why. High confidence requires strong, evidence-backed inputs AND a well-understood execution path.
4. DO NOT INVENT. No expertise requirements the inputs don't imply, no market numbers (that is Agent 3's job), no named vendors or salaries. If the market brief is absent, say nothing about market size.

─── YOUR JOB ─────────────────────────────────────────────────────────────────

1. TEAM MATRIX (1-8 roles) — the critical roles to execute the recommended pathway from the current TRL position. For each: role title, the specific domain expertise needed (be precise: "PhD-level NLP systems research", not "AI expert"), seniority, and a rationale citing the input that drives the need (e.g. "Agent 2 flags [REGULATORY] CDSCO pathway — requires regulatory affairs lead").
2. ESTIMATED TIMELINE — months from today to the pathway's first commercial milestone (license signed / first pilot / product launch — state which). Calibrate to domain: software 12-36 months, biotech/medtech 48-120+ months. Reasoning must name the TRL gap being crossed.
3. CAPITAL ESTIMATE — INR (₹) required to reach that milestone. minINR/maxINR are plain numbers in rupees (e.g. 25000000 for ₹2.5 Cr). Reasoning must explain the uncertainty (what is unknown, what could blow the budget). majorCostDrivers: the 2-6 biggest line items, each traceable to work the inputs imply.
4. KEY RISKS (1-10) — technical and execution risks derived from the TRL gap and Agent 2's risk flags. Low TRL = more build risk; say what could fail during the climb. Do not repeat Agent 2's flags verbatim — translate them into execution consequences.
5. OVERALL CONFIDENCE — your top-level honesty signal. LOW is a respectable answer for an early-stage paper; an unjustified HIGH is a failure.

─── WHAT SEPARATES YOUR OUTPUT FROM A GPT WRAPPER ───────────────────────────

BAD (worthless): { "role": "ML Engineer", "rationale": "Needed to build the product" }
GOOD: { "role": "Senior ML Systems Engineer", "domainExpertise": "Large-scale transformer training and inference optimization", "seniority": "Senior / 6+ years", "rationale": "Agent 1's claims center on training-cost advantages (3.5 days on 8 GPUs); productizing that requires someone who has operated distributed training infrastructure, which the academic team's publication record does not demonstrate." }

BAD reasoning: "The timeline is 12-24 months based on typical projects"
GOOD reasoning: "Crossing TRL 4→6 requires real-world dataset validation and a deployed prototype (Agent 2: 'no evidence of validation beyond academic benchmarks'). 12 months if an industry partner supplies data and infrastructure; 24+ if the team must build both. Confidence is medium because the architecture itself is validated but the deployment path depends on partnerships that do not yet exist."

The inputs follow.
`

// Computed once at module load — the same Zod schema drives Gemini's
// constrained generation; range sanity is checked by feasibilityScoutSchema.
const FEASIBILITY_RESPONSE_SCHEMA = zodToGeminiSchema(feasibilityScoutBaseSchema)

export function buildFeasibilityContext(
	paperAnalysis: PaperAgentOutput,
	trlIrlAnalysis: TrlIrlAgentOutput,
	marketAnalysis: MarketScoutOutput | null
): string {
	const marketBlock = marketAnalysis
		? `── AGENT 3 OUTPUT (Market Scout — optional context) ─────────────────────
TAM: ${marketAnalysis.tam ? `${marketAnalysis.tam.value} (${marketAnalysis.tam.basis})` : 'not established'}
Competitors: ${marketAnalysis.competitors.map((c) => `${c.name} (${c.stage})`).join(', ') || 'none grounded'}
Summary: ${marketAnalysis.summary}`
		: `── AGENT 3 OUTPUT (Market Scout) ─────────────────────────────────────────
Market stage was skipped — no market context available. Do not reason about market size.`

	return `── AGENT 1 OUTPUT (Paper Analysis, post-critique) ────────────────────────

Domain: ${paperAnalysis.domain} (${paperAnalysis.domainClassification})
Methodology Strength: ${paperAnalysis.methodologyStrength}
Institution Context: ${paperAnalysis.institutionContext}

Key Claims with Confidence:
${paperAnalysis.keyClaims.map((c, i) => {
	const conf = paperAnalysis.claimConfidence?.[i]
	return `  ${i + 1}. ${c}${conf ? ` [${conf.confidence}]` : ''}`
}).join('\n')}

Commercialization Barriers:
${paperAnalysis.commercializationBarriers?.map((b, i) => `  ${i + 1}. ${b}`).join('\n') ?? '  None identified'}

── AGENT 2 OUTPUT (TRL/IRL) ──────────────────────────────────────────────

TRL: ${trlIrlAnalysis.trlScore} | IRL: ${trlIrlAnalysis.irlScore}
Confidence: ${trlIrlAnalysis.confidence}
Pathway: ${trlIrlAnalysis.commercializationPathway} — ${trlIrlAnalysis.pathwayRationale}
Time to Market (Agent 2 estimate): ${trlIrlAnalysis.timeToMarket}
Domain Rubric: ${trlIrlAnalysis.domainRubricApplied}

Risk Flags:
${trlIrlAnalysis.riskFlags.map((r, i) => `  ${i + 1}. ${r}`).join('\n')}

Rationale:
${trlIrlAnalysis.rationale.map((r, i) => `  ${i + 1}. ${r}`).join('\n')}

${marketBlock}
`
}

/**
 * @param revisionContext Optional critique findings from the skeptical
 *        reviewer. When set, this is a one-shot regeneration: the prompt is
 *        identical except the critique is appended as additional context.
 */
export async function runFeasibilityAgent(
	paperAnalysis: PaperAgentOutput,
	trlIrlAnalysis: TrlIrlAgentOutput,
	marketAnalysis: MarketScoutOutput | null,
	projectId: string,
	revisionContext?: string
): Promise<FeasibilityScoutOutput> {
	const log = createAgentLogger('Feasibility', 4, projectId)
	const startTime = Date.now()

	log.start()
	if (revisionContext) log.info('Regenerating with critique context')

	const result = await gemini.generateContent(
		[
			{ text: FEASIBILITY_AGENT_PROMPT },
			{ text: buildFeasibilityContext(paperAnalysis, trlIrlAnalysis, marketAnalysis) },
			...(revisionContext ? [{ text: revisionContext }] : []),
		],
		{ responseSchema: FEASIBILITY_RESPONSE_SCHEMA, agentKey: 'feasibility' }
	)

	const text = result.response.text()
	log.debug('Raw Gemini response received', { responseLength: text.length })

	let rawOutput: unknown
	try {
		rawOutput = JSON.parse(text)
	} catch {
		log.error('Failed to parse Gemini JSON response', { rawText: text.slice(0, 500) })
		throw new Error('Agent 4 returned invalid JSON')
	}

	// ── Validate output with Zod (includes range-sanity refinements) ─────
	const validation = feasibilityScoutSchema.safeParse(rawOutput)

	if (!validation.success) {
		log.validationFailed(validation.error.flatten())
		throw new Error(
			`Agent 4 output validation failed: ${validation.error.issues.map((i) => i.message).join('; ')}`
		)
	}

	const output = validation.data
	const durationMs = Date.now() - startTime

	log.complete(durationMs)
	log.info('Output summary', {
		roleCount: output.teamMatrix.length,
		timeline: `${output.estimatedTimeline.minMonths}-${output.estimatedTimeline.maxMonths} months (${output.estimatedTimeline.confidence})`,
		capital: `₹${output.capitalEstimate.minINR}-${output.capitalEstimate.maxINR} (${output.capitalEstimate.confidence})`,
		overallConfidence: output.overallConfidence.level,
	})

	return output
}
