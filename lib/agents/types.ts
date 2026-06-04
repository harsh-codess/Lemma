/**
 * ─── Agent Output Types ──────────────────────────────────────────────────────
 *
 * Each agent returns a strongly-typed output that feeds into the next agent.
 * This creates the pipeline:
 *
 *   PDF → PaperAgent → TrlIrlAgent → MarketAgent → FeasibilityAgent → DeckAgent
 *              ↓            ↓              ↓               ↓              ↓
 *          PaperOutput  TrlIrlOutput  MarketOutput  FeasibilityOutput  DeckOutput
 *              ↓            ↓              ↓               ↓              ↓
 *          writes to    writes to     writes to       writes to      writes to
 *          PaperData    TrlIrlData    MarketData      Feasibility    DeckData
 *                                    + Competitors     Data
 *                                    + MarketSignals
 */

// ─── Agent 1: Paper Analysis ─────────────────────────────────────────────────

export interface PaperAgentOutput {
	// Document validation
	documentType: 'RESEARCH_PAPER' | 'NOT_RESEARCH_PAPER'
	rejectionReason?: string

	// Core extraction
	abstractSummary: string
	noveltySummary: string
	domainClassification: string
	keyClaims: string[]
	domain: string // e.g. "Biotech / Materials"
	initialReadinessEstimate: number // 0-100, rough first pass

	// Startup-grade additions
	claimConfidence: ClaimConfidenceItem[] // per-claim evidence tagging
	methodologyStrength: 'STRONG' | 'ADEQUATE' | 'WEAK' | 'UNKNOWN'
	commercializationBarriers: string[] // what the paper itself reveals as blockers
	institutionContext: string // institution, country, relevant bodies detected
}

export interface ClaimConfidenceItem {
	claim: string
	confidence: 'EVIDENCE_BACKED' | 'INFERRED' | 'SPECULATIVE'
	reasoning: string
}

// ─── Critique: Skeptical Review of Agent 1 ───────────────────────────────────

export interface PaperCritiqueIssue {
	field: string // which Agent 1 field is challenged, e.g. "keyClaims[1]"
	quote: string // exact text from Agent 1's output being challenged
	issue: string // what the paper actually says (or fails to say)
	severity: 'CRITICAL' | 'MINOR'
}

export interface PaperCritiqueOutput {
	verdict: 'PASS' | 'NEEDS_REVISION' // NEEDS_REVISION ⇢ ≥1 CRITICAL issue
	issues: PaperCritiqueIssue[]
	summary: string
}

// ─── Agent 2: TRL / IRL Scoring ──────────────────────────────────────────────

export interface TrlIrlAgentInput {
	paperAnalysis: PaperAgentOutput
}

export interface TrlIrlAgentOutput {
	// Core scores
	trlScore: string // e.g. "TRL 5"
	irlScore: string // e.g. "IRL 6.2 / 10"
	rationale: string[]
	confidence: string // e.g. "82% confidence based on..."
	riskFlags: string[] // prefixed: [TECHNICAL], [REGULATORY], [IP], [MARKET], [TEAM]
	evidence: EvidenceItem[]

	// Startup-grade additions
	commercializationPathway: 'SPIN_OFF' | 'LICENSING' | 'PARTNERSHIP' | 'NOT_RECOMMENDED'
	pathwayRationale: string
	recommendedGrants: string[] // specific programs: DST-SERB, BIRAC, DBT, MEITY, NSF, etc.
	timeToMarket: string // e.g. "3-5 years via licensing, 7-10 years via spin-off"
	domainRubricApplied: string // which domain-specific TRL rubric was used
}

// ─── Agent 3: Market Scout ───────────────────────────────────────────────────
//
// Two-stage agent. Stage 1 (retrieval) gathers web sources via the search
// client; Stage 2 (synthesis) writes a brief grounded ONLY in those sources.
// Every figure and competitor claim carries a sourceUrl that MUST be one of
// the retrieved URLs — enforced by the validator, not by prompt instruction.

export type MarketSearchCategory = 'competitors' | 'funding' | 'patents' | 'market-size'

/** A raw Stage-1 retrieval result, persisted to the RetrievedSource table */
export interface MarketSource {
	category: MarketSearchCategory
	query: string // the search query that produced this hit
	title: string
	url: string
	snippet: string
	publishedDate: string | null
}

/** A market figure that cannot exist without a retrieved source behind it */
export interface SourcedFigure {
	value: string // e.g. "$4.2B by 2030"
	basis: string // what the figure measures and how it applies to this technology
	sourceUrl: string // must be one of the Stage-1 retrieved URLs
	sourceTitle: string
}

export interface MarketScoutCompetitor {
	name: string
	positioning: string
	stage: string
	signal: string
	sourceUrl: string // must be one of the Stage-1 retrieved URLs
}

export interface MarketScoutSignal {
	title: string
	type: 'Funding' | 'Patent' | 'Demand' | 'Policy'
	impact: 'High' | 'Medium' | 'Watch'
	summary: string
	sourceUrl: string // must be one of the Stage-1 retrieved URLs
}

export interface MarketScoutOutput {
	// null = no retrieved source supports a figure ("no source, no claim")
	tam: SourcedFigure | null
	sam: SourcedFigure | null
	som: SourcedFigure | null
	summary: string
	competitors: MarketScoutCompetitor[]
	signals: MarketScoutSignal[]
}

// ─── Agent 3 (legacy shape): Market Intelligence ─────────────────────────────

export interface MarketAgentInput {
	paperAnalysis: PaperAgentOutput
	trlIrlAnalysis: TrlIrlAgentOutput
}

export interface MarketAgentOutput {
	tam: string
	sam: string
	som: string
	summary: string
	competitors: CompetitorItem[]
	signals: MarketSignalItem[]
	evidence: EvidenceItem[]
}

export interface CompetitorItem {
	name: string
	positioning: string
	stage: string
	signal: string
}

export interface MarketSignalItem {
	title: string
	type: 'Funding' | 'Patent' | 'Demand' | 'Policy'
	impact: 'High' | 'Medium' | 'Watch'
	summary: string
}

// ─── Agent 4: Feasibility (reasoning agent) ──────────────────────────────────
//
// Reasons from Agent 1 (post-critique) + Agent 2 outputs; Market Scout output
// is optional context. No retrieval, no source URLs — the accuracy mechanism
// is traceability-to-inputs plus explicit uncertainty. Ranges + confidence +
// reasoning are REQUIRED so a bare point estimate cannot be emitted.

export type FeasibilityConfidence = 'high' | 'medium' | 'low'

export interface FeasibilityRole {
	role: string // e.g. "Lead ML Engineer"
	domainExpertise: string // e.g. "PhD-level quantum hardware"
	seniority: string // e.g. "Senior / 8+ years"
	rationale: string // must reference what in the paper/TRL drove this need
}

export interface TimelineRange {
	minMonths: number
	maxMonths: number // strictly > minMonths — never a single number
	confidence: FeasibilityConfidence
	reasoning: string
}

export interface CapitalRange {
	minINR: number
	maxINR: number // strictly > minINR — never a single number
	confidence: FeasibilityConfidence
	reasoning: string // must explain what makes the estimate uncertain
	majorCostDrivers: string[]
}

export interface FeasibilityScoutOutput {
	teamMatrix: FeasibilityRole[]
	estimatedTimeline: TimelineRange
	capitalEstimate: CapitalRange
	keyRisks: string[] // technical/execution risks derived from the TRL gap
	overallConfidence: {
		level: FeasibilityConfidence // top-level honesty signal
		reasoning: string
	}
}

// ─── Agent 4 (legacy shape): Feasibility Assessment ──────────────────────────

export interface FeasibilityAgentInput {
	paperAnalysis: PaperAgentOutput
	trlIrlAnalysis: TrlIrlAgentOutput
	marketAnalysis: MarketAgentOutput
}

export interface FeasibilityAgentOutput {
	teamRequirements: string[]
	timeline: string
	capitalEstimate: string
	grantFit: string
	keyRisks: string[]
	evidence: EvidenceItem[]
}

// ─── Agent 5: Pitch Builder (synthesizer) ────────────────────────────────────
//
// Synthesizes a structured investor deck from agents 1–4. It may restate,
// reframe, and structure upstream facts but introduce NO new fact. Every
// factual claim on a slide carries a factRef naming its upstream origin
// (e.g. "market.tam", "feasibility.capitalEstimate", "paper.keyClaims[2]");
// market figures additionally carry the Market Scout sourceUrl so the deck
// itself is citable. Narrative prose is free; claims are not.

export type PitchSlideType =
	| 'PROBLEM'
	| 'SOLUTION'
	| 'TECHNOLOGY'
	| 'MARKET'
	| 'FEASIBILITY'
	| 'TEAM'
	| 'READINESS'
	| 'ASK'

export interface FactRef {
	ref: string // upstream origin, e.g. "market.tam" | "paper.keyClaims[2]"
	sourceUrl: string // Market Scout URL for market figures; '' otherwise
}

export interface PitchSlide {
	order: number
	slideType: PitchSlideType
	title: string
	bullets: string[] // where factual claims live — each must trace via factRefs
	narrative: string // persuasive framing; free prose, '' if none
	factRefs: FactRef[] // empty for pure-narrative slides (vision, problem framing)
}

export interface PitchBuilderOutput {
	slides: PitchSlide[]
}

// ─── Agent 5 (legacy shape): Deck Generation ─────────────────────────────────

export interface DeckAgentInput {
	paperAnalysis: PaperAgentOutput
	trlIrlAnalysis: TrlIrlAgentOutput
	marketAnalysis: MarketAgentOutput
	feasibilityAnalysis: FeasibilityAgentOutput
}

export interface DeckAgentOutput {
	fundingAsk: string
	keyNarrativePoints: string[]
	slides: DeckSlideItem[]
	readinessScore: number // 0-100, final calibrated score
}

export interface DeckSlideItem {
	order: number
	title: string
	keyPoint: string
}

// ─── Shared ──────────────────────────────────────────────────────────────────

export interface EvidenceItem {
	stageKey: string // paper | trl-irl | market | feasibility
	claim: string
	sourceType: string // Paper | Patent | News | Funding | Market report | Internal note
	sourceTitle: string
	confidence: string // High | Medium | Watch
	summary: string
}

/**
 * Full pipeline output — the combined result of all 5 agents.
 */
export interface PipelineOutput {
	paperAnalysis: PaperAgentOutput
	trlIrlAnalysis: TrlIrlAgentOutput
	marketAnalysis: MarketAgentOutput
	feasibilityAnalysis: FeasibilityAgentOutput
	deckAnalysis: DeckAgentOutput
}
