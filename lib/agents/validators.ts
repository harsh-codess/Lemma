import { z } from 'zod'

/**
 * ─── Agent Output Validators ─────────────────────────────────────────────────
 *
 * Every agent's raw JSON output passes through Zod validation before it enters
 * the pipeline or the database. This catches hallucinations, missing fields,
 * and malformed data AT THE BOUNDARY — not deep inside a Prisma transaction.
 *
 * If Gemini returns a $500B TAM or forgets to include keyClaims, this is where
 * we catch it and throw a retryable error back to Inngest.
 */

// ─── Agent 1: Paper Analysis ─────────────────────────────────────────────────

export const paperAgentSchema = z.object({
	abstractSummary: z
		.string()
		.min(50, 'Abstract summary is too short — Gemini likely hallucinated or returned garbage'),
	noveltySummary: z
		.string()
		.min(50, 'Novelty summary must be specific, not generic praise'),
	domainClassification: z
		.string()
		.min(5, 'Domain classification is missing'),
	keyClaims: z
		.array(z.string().min(20, 'Each claim must be a specific, evidenced statement'))
		.min(2, 'At least 2 key claims are required')
		.max(6, 'Too many claims — Gemini is padding'),
	domain: z
		.string()
		.min(2, 'Domain tag is required'),
	initialReadinessEstimate: z
		.number()
		.int()
		.min(0)
		.max(100),
	claimConfidence: z
		.array(z.object({
			claim: z.string().min(10),
			confidence: z.enum(['EVIDENCE_BACKED', 'INFERRED', 'SPECULATIVE']),
			reasoning: z.string().min(10),
		}))
		.min(1, 'Claim confidence tagging is required'),
	methodologyStrength: z.enum(['STRONG', 'ADEQUATE', 'WEAK', 'UNKNOWN']),
	commercializationBarriers: z
		.array(z.string().min(10))
		.default([]),
	institutionContext: z
		.string()
		.min(5, 'Institution context must be detected'),
})

// ─── Agent 2: TRL / IRL ─────────────────────────────────────────────────────

export const trlIrlAgentSchema = z.object({
	trlScore: z
		.string()
		.regex(/^TRL\s*\d/i, 'trlScore must follow format like "TRL 5"'),
	irlScore: z
		.string()
		.min(3, 'irlScore is required'),
	rationale: z
		.array(z.string().min(20))
		.min(3, 'At least 3 rationale points are required'),
	confidence: z
		.string()
		.min(10, 'Confidence explanation is required'),
	riskFlags: z
		.array(z.string().min(15))
		.min(1, 'At least 1 risk flag is required'),
	evidence: z
		.array(z.object({
			stageKey: z.string(),
			claim: z.string(),
			sourceType: z.string(),
			sourceTitle: z.string(),
			confidence: z.enum(['High', 'Medium', 'Watch']),
			summary: z.string(),
		}))
		.optional()
		.default([]),
	commercializationPathway: z.enum(['SPIN_OFF', 'LICENSING', 'PARTNERSHIP', 'NOT_RECOMMENDED']),
	pathwayRationale: z
		.string()
		.min(20, 'Pathway rationale must explain the recommendation'),
	recommendedGrants: z
		.array(z.string().min(3))
		.min(1, 'At least one grant program must be identified')
		.max(8, 'Too many grants — focus on the most relevant'),
	timeToMarket: z
		.string()
		.min(5, 'Time to market estimate is required'),
	domainRubricApplied: z
		.string()
		.min(3, 'Must state which domain rubric was applied'),
})

// ─── Agent 3: Market Intelligence ────────────────────────────────────────────

export const marketAgentSchema = z.object({
	tam: z
		.string()
		.regex(/^\$[\d.]+[BMK]?$/i, 'TAM must be a dollar figure like "$4.2B"')
		.or(z.string().min(2)), // fallback for different formats
	sam: z.string().min(2),
	som: z.string().min(2),
	summary: z
		.string()
		.min(20, 'Market summary is too short'),
	competitors: z
		.array(z.object({
			name: z.string().min(1),
			positioning: z.string().min(5),
			stage: z.string().min(1),
			signal: z.string().min(5),
		}))
		.min(1, 'At least one competitor is required')
		.max(10, 'Too many competitors — likely padding'),
	signals: z
		.array(z.object({
			title: z.string().min(5),
			type: z.enum(['Funding', 'Patent', 'Demand', 'Policy']),
			impact: z.enum(['High', 'Medium', 'Watch']),
			summary: z.string().min(10),
		}))
		.min(1, 'At least one market signal is required'),
	evidence: z.array(z.object({
		stageKey: z.string(),
		claim: z.string(),
		sourceType: z.string(),
		sourceTitle: z.string(),
		confidence: z.string(),
		summary: z.string(),
	})).optional().default([]),
})

// ─── Agent 4: Feasibility ────────────────────────────────────────────────────

export const feasibilityAgentSchema = z.object({
	teamRequirements: z
		.array(z.string().min(5))
		.min(1, 'At least one team requirement is needed'),
	timeline: z
		.string()
		.min(5, 'Timeline estimate is required'),
	capitalEstimate: z
		.string()
		.min(3, 'Capital estimate is required'),
	grantFit: z
		.string()
		.min(5, 'Grant fit assessment is required'),
	keyRisks: z
		.array(z.string().min(10))
		.min(1, 'At least one risk is required'),
	evidence: z.array(z.object({
		stageKey: z.string(),
		claim: z.string(),
		sourceType: z.string(),
		sourceTitle: z.string(),
		confidence: z.string(),
		summary: z.string(),
	})).optional().default([]),
})

// ─── Agent 5: Deck Generation ────────────────────────────────────────────────

export const deckAgentSchema = z.object({
	fundingAsk: z
		.string()
		.min(5, 'Funding ask is required'),
	keyNarrativePoints: z
		.array(z.string().min(10))
		.min(2, 'At least 2 narrative points are needed'),
	slides: z
		.array(z.object({
			order: z.number().int().min(1),
			title: z.string().min(2),
			keyPoint: z.string().min(10),
		}))
		.min(3, 'At least 3 slides are required')
		.max(12, 'Too many slides — keep the deck tight'),
	readinessScore: z
		.number()
		.int()
		.min(0)
		.max(100, 'Final readiness score must be 0-100'),
})
