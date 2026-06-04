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
	documentType: z
		.enum(['RESEARCH_PAPER', 'NOT_RESEARCH_PAPER'])
		.default('RESEARCH_PAPER'),
	rejectionReason: z.string().optional(),
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

// ─── Critique: Skeptical Review of Agent 1 ──────────────────────────────────

export const paperCritiqueSchema = z.object({
	verdict: z.enum(['PASS', 'NEEDS_REVISION']),
	issues: z
		.array(z.object({
			field: z
				.string()
				.min(3, 'Issue must name the field it challenges, e.g. "keyClaims[1]"'),
			// Quotes can legitimately be short — e.g. "85" when challenging
			// initialReadinessEstimate — so only require non-empty.
			quote: z
				.string()
				.min(1, 'Issue must quote the exact text from Agent 1 output being challenged'),
			issue: z
				.string()
				.min(15, 'Issue must explain what the paper actually says or lacks'),
			severity: z.enum(['CRITICAL', 'MINOR']),
		}))
		.default([]),
	summary: z
		.string()
		.min(10, 'Critique summary is required'),
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

// ─── Agent 3: Market Scout ───────────────────────────────────────────────────

const sourcedFigureSchema = z.object({
	value: z.string().min(2, 'Figure value is required, e.g. "$4.2B by 2030"'),
	basis: z
		.string()
		.min(20, 'Figure basis must explain what the figure measures and how it applies'),
	sourceUrl: z.string().min(8, 'sourceUrl is required — no source, no claim'),
	sourceTitle: z.string().min(2, 'sourceTitle is required'),
})

/**
 * Structural shape of the Market Scout brief. This drives Gemini's native
 * responseSchema. Grounding (sourceUrl ∈ retrieved set) cannot be expressed
 * in Gemini's schema subset — use buildMarketScoutValidator() for that.
 */
export const marketScoutBaseSchema = z.object({
	tam: sourcedFigureSchema.nullable(),
	sam: sourcedFigureSchema.nullable(),
	som: sourcedFigureSchema.nullable(),
	summary: z
		.string()
		.min(40, 'Market summary must synthesize the retrieved evidence, not restate the paper'),
	competitors: z
		.array(z.object({
			name: z.string().min(1),
			positioning: z.string().min(10),
			stage: z.string().min(2),
			signal: z.string().min(10),
			sourceUrl: z.string().min(8, 'Competitor claims require a sourceUrl — no source, no claim'),
		}))
		.max(10, 'Too many competitors — likely padding'),
	signals: z
		.array(z.object({
			title: z.string().min(5),
			type: z.enum(['Funding', 'Patent', 'Demand', 'Policy']),
			impact: z.enum(['High', 'Medium', 'Watch']),
			summary: z.string().min(10),
			sourceUrl: z.string().min(8, 'Market signals require a sourceUrl — no source, no claim'),
		}))
		.max(10, 'Too many signals — likely padding'),
})

/** Normalize URLs enough to survive cosmetic model rewrites (trailing slash, case in host) */
export function normalizeSourceUrl(url: string): string {
	const trimmed = url.trim().replace(/\/+$/, '')
	try {
		const parsed = new URL(trimmed)
		return `${parsed.protocol}//${parsed.host.toLowerCase()}${parsed.pathname}${parsed.search}`
	} catch {
		return trimmed
	}
}

/**
 * Grounded validator for the Market Scout brief: every sourceUrl in the
 * output MUST be one of the Stage-1 retrieved URLs. A figure or competitor
 * Gemini cannot attribute to a retrieved source is structurally rejected —
 * the resulting Zod error is fed back into the retry prompt.
 */
export function buildMarketScoutValidator(allowedUrls: Iterable<string>) {
	const allowed = new Set(Array.from(allowedUrls, normalizeSourceUrl))

	return marketScoutBaseSchema.superRefine((output, ctx) => {
		const check = (url: string, path: (string | number)[]) => {
			if (!allowed.has(normalizeSourceUrl(url))) {
				ctx.addIssue({
					code: 'custom',
					path,
					message: `Ungrounded sourceUrl "${url}" — this URL is not among the ${allowed.size} retrieved Stage-1 sources. Every claim must cite a retrieved source verbatim; if no retrieved source supports it, drop the claim (or return null for the figure).`,
				})
			}
		}

		if (output.tam) check(output.tam.sourceUrl, ['tam', 'sourceUrl'])
		if (output.sam) check(output.sam.sourceUrl, ['sam', 'sourceUrl'])
		if (output.som) check(output.som.sourceUrl, ['som', 'sourceUrl'])
		output.competitors.forEach((c, i) => check(c.sourceUrl, ['competitors', i, 'sourceUrl']))
		output.signals.forEach((s, i) => check(s.sourceUrl, ['signals', i, 'sourceUrl']))
	})
}

// ─── Agent 3 (legacy shape): Market Intelligence ─────────────────────────────

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

// ─── Agent 4: Feasibility (reasoning agent) ──────────────────────────────────

const feasibilityConfidenceEnum = z.enum(['high', 'medium', 'low'])

/**
 * Structural shape for Gemini's native responseSchema (pure — no refinements).
 * Range sanity (max strictly greater than min) lives in feasibilityScoutSchema
 * below, since Gemini's schema subset cannot express cross-field constraints.
 */
export const feasibilityScoutBaseSchema = z.object({
	teamMatrix: z
		.array(z.object({
			role: z.string().min(3, 'Role title is required'),
			domainExpertise: z
				.string()
				.min(5, 'Domain expertise must be specific, e.g. "PhD-level quantum hardware"'),
			seniority: z.string().min(3, 'Seniority level is required'),
			rationale: z
				.string()
				.min(30, 'Role rationale must reference what in the paper/TRL output drove this need'),
		}))
		.min(1, 'At least one role is required')
		.max(8, 'Too many roles — focus on the critical hires'),
	estimatedTimeline: z.object({
		minMonths: z.number().int().min(1).max(240),
		maxMonths: z.number().int().min(1).max(360),
		confidence: feasibilityConfidenceEnum,
		reasoning: z
			.string()
			.min(30, 'Timeline reasoning must explain what drives the range and its uncertainty'),
	}),
	capitalEstimate: z.object({
		minINR: z.number().positive(),
		maxINR: z.number().positive(),
		confidence: feasibilityConfidenceEnum,
		reasoning: z
			.string()
			.min(40, 'Capital reasoning must explain what makes the estimate uncertain'),
		majorCostDrivers: z
			.array(z.string().min(5))
			.min(1, 'A capital figure without cost drivers is not an estimate')
			.max(8, 'Too many cost drivers — name the major ones'),
	}),
	keyRisks: z
		.array(z.string().min(15, 'Each risk must be a specific technical/execution risk'))
		.min(1, 'At least one risk is required — a TRL gap always carries risk')
		.max(10, 'Too many risks — likely padding'),
	overallConfidence: z.object({
		level: feasibilityConfidenceEnum,
		reasoning: z
			.string()
			.min(30, 'Overall confidence must be justified against the thinness of the evidence'),
	}),
})

/**
 * Full Feasibility validator: ranges must be genuine ranges. A point
 * estimate (max <= min) is structurally rejected — false precision is the
 * failure mode this agent guards against.
 */
export const feasibilityScoutSchema = feasibilityScoutBaseSchema.superRefine(
	(output, ctx) => {
		if (output.estimatedTimeline.maxMonths <= output.estimatedTimeline.minMonths) {
			ctx.addIssue({
				code: 'custom',
				path: ['estimatedTimeline', 'maxMonths'],
				message: `Timeline must be a genuine range — maxMonths (${output.estimatedTimeline.maxMonths}) must be strictly greater than minMonths (${output.estimatedTimeline.minMonths}). A single number is false precision.`,
			})
		}
		if (output.capitalEstimate.maxINR <= output.capitalEstimate.minINR) {
			ctx.addIssue({
				code: 'custom',
				path: ['capitalEstimate', 'maxINR'],
				message: `Capital must be a genuine range — maxINR (${output.capitalEstimate.maxINR}) must be strictly greater than minINR (${output.capitalEstimate.minINR}). A single number is false precision.`,
			})
		}
	}
)

// ─── Agent 4 (legacy shape): Feasibility ─────────────────────────────────────

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

// ─── Agent 5: Pitch Builder (synthesizer) ────────────────────────────────────

const pitchSlideTypeEnum = z.enum([
	'PROBLEM',
	'SOLUTION',
	'TECHNOLOGY',
	'MARKET',
	'FEASIBILITY',
	'TEAM',
	'READINESS',
	'ASK',
])

const factRefSchema = z.object({
	ref: z
		.string()
		.min(3, 'A factRef must name its upstream origin, e.g. "market.tam"'),
	// '' when the ref is not a market figure with a source. Required (not
	// optional) so Gemini always emits the field — empty string = "no source".
	sourceUrl: z.string(),
})

/**
 * Structural shape for Gemini's native responseSchema (pure — no refinements).
 * Cross-agent grounding (refs exist upstream, market source carry-through)
 * lives in buildPitchValidator below.
 */
export const pitchBuilderBaseSchema = z.object({
	slides: z
		.array(z.object({
			order: z.number().int().min(1),
			slideType: pitchSlideTypeEnum,
			title: z.string().min(3, 'Slide title is required'),
			bullets: z
				.array(z.string().min(3))
				.min(1, 'Each slide needs at least one bullet')
				.max(8, 'Too many bullets — keep slides tight'),
			narrative: z.string(), // persuasive framing; may be ''
			factRefs: z.array(factRefSchema),
		}))
		.min(4, 'A deck needs at least the core slides (problem, solution, tech, ask)')
		.max(12, 'Too many slides — keep the deck investor-tight'),
})

export interface PitchRefIndex {
	/** Every valid upstream ref string (e.g. "paper.keyClaims[2]", "market.tam") */
	validRefs: Set<string>
	/** Market refs whose upstream fact carries a sourceUrl → that exact url */
	marketSourceByRef: Map<string, string>
	/** All sourceUrls present in the Market Scout output (normalized) */
	allowedMarketUrls: Set<string>
	/** False when the market stage was skipped — no MARKET slide / market.* refs allowed */
	marketPresent: boolean
}

/**
 * Cross-agent grounding validator for the deck. Enforces, structurally:
 *  - every factRef.ref names a real upstream output (no invented references);
 *  - market figures carry the exact Market Scout sourceUrl (source carry-through);
 *  - no sourceUrl that Market Scout never produced (no fabricated citations);
 *  - when the market stage was skipped, no MARKET slide and no market.* refs.
 *
 * The semantic "this number doesn't match upstream" check is the traceability
 * critique's job; this guard makes invented references and unsourced figures
 * impossible before the critique even runs.
 */
export function buildPitchValidator(index: PitchRefIndex) {
	return pitchBuilderBaseSchema.superRefine((output, ctx) => {
		output.slides.forEach((slide, si) => {
			if (slide.slideType === 'MARKET' && !index.marketPresent) {
				ctx.addIssue({
					code: 'custom',
					path: ['slides', si, 'slideType'],
					message:
						'A MARKET slide cannot exist — the Market Scout stage was skipped, so no market facts are available. Remove this slide.',
				})
			}

			slide.factRefs.forEach((fr, fi) => {
				const refPath = ['slides', si, 'factRefs', fi] as (string | number)[]

				if (!index.validRefs.has(fr.ref)) {
					ctx.addIssue({
						code: 'custom',
						path: [...refPath, 'ref'],
						message: `Invented upstream reference "${fr.ref}" — this ref does not exist in agents 1–4's outputs. Every factual claim must cite a real upstream fact; if none supports the claim, remove the claim.`,
					})
					return
				}

				if (fr.ref.startsWith('market.') && !index.marketPresent) {
					ctx.addIssue({
						code: 'custom',
						path: [...refPath, 'ref'],
						message: `Reference "${fr.ref}" is unavailable — the Market Scout stage was skipped. Do not cite market facts.`,
					})
					return
				}

				// Source carry-through: if the upstream fact has a sourceUrl,
				// the deck must carry that exact url onto the slide.
				const requiredUrl = index.marketSourceByRef.get(fr.ref)
				if (requiredUrl) {
					if (normalizeSourceUrl(fr.sourceUrl) !== requiredUrl) {
						ctx.addIssue({
							code: 'custom',
							path: [...refPath, 'sourceUrl'],
							message: `Market figure "${fr.ref}" must carry its Market Scout source URL (${requiredUrl}). A market figure with no upstream source cannot appear on a slide.`,
						})
					}
					return
				}

				// Any sourceUrl that IS provided must be a real Market Scout url
				if (fr.sourceUrl !== '' && !index.allowedMarketUrls.has(normalizeSourceUrl(fr.sourceUrl))) {
					ctx.addIssue({
						code: 'custom',
						path: [...refPath, 'sourceUrl'],
						message: `sourceUrl "${fr.sourceUrl}" was never produced by Market Scout. Cite only retrieved source URLs, or leave sourceUrl empty.`,
					})
				}
			})
		})
	})
}

// ─── Agent 5 (legacy shape): Deck Generation ─────────────────────────────────

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
