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
	abstractSummary: string
	noveltySummary: string
	domainClassification: string
	keyClaims: string[]
	domain: string // e.g. "Biotech / Materials"
	initialReadinessEstimate: number // 0-100, rough first pass
}

// ─── Agent 2: TRL / IRL Scoring ──────────────────────────────────────────────

export interface TrlIrlAgentInput {
	paperAnalysis: PaperAgentOutput
}

export interface TrlIrlAgentOutput {
	trlScore: string // e.g. "TRL 5"
	irlScore: string // e.g. "IRL 6.2 / 10"
	rationale: string[]
	confidence: string // e.g. "82% confidence based on..."
	riskFlags: string[]
	evidence: EvidenceItem[]
}

// ─── Agent 3: Market Intelligence ────────────────────────────────────────────

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

// ─── Agent 4: Feasibility Assessment ─────────────────────────────────────────

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

// ─── Agent 5: Deck Generation ────────────────────────────────────────────────

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
