import { describe, it, expect } from 'vitest'
import { paperAgentSchema, paperCritiqueSchema, trlIrlAgentSchema, marketAgentSchema, buildMarketScoutValidator, feasibilityAgentSchema, feasibilityScoutSchema, buildPitchValidator, type PitchRefIndex, deckAgentSchema } from './validators'

/**
 * ─── Agent Output Validation Tests ───────────────────────────────────────────
 *
 * These tests verify that Zod schemas correctly catch:
 *   1. Valid outputs from well-behaved Gemini responses
 *   2. Missing required fields
 *   3. Hallucinated / out-of-range values
 *   4. Malformed JSON structures
 */

// ─── Agent 1: Paper Analysis ─────────────────────────────────────────────────

describe('Agent 1 — Paper Analysis Validator', () => {
	const validOutput = {
		abstractSummary: 'This paper describes an antimicrobial coating that prevents infections on surgical implants by creating a bioactive surface layer.',
		noveltySummary: 'The novelty lies in a specific sol-gel coating chemistry that bonds to titanium implant surfaces while maintaining porosity for tissue integration — this dual function is novel.',
		domainClassification: 'Primary: Biotech / Materials. Secondary: Medtech.',
		keyClaims: [
			'Reduces bacterial adhesion by 94% compared to uncoated titanium.',
			'Compatible with standard implant manufacturing workflows.',
			'Demonstrates stability over 12-month accelerated aging tests.',
		],
		domain: 'Biotech / Materials',
		initialReadinessEstimate: 55,
		claimConfidence: [
			{
				claim: 'Reduces bacterial adhesion by 94% compared to uncoated titanium.',
				confidence: 'EVIDENCE_BACKED' as const,
				reasoning: 'Quantified in the comparative adhesion assay with controls.',
			},
		],
		methodologyStrength: 'STRONG' as const,
		commercializationBarriers: ['Scale-up of the sol-gel process beyond lab batches is untested.'],
		institutionContext: 'University materials lab, India; likely DST/BIRAC funding environment.',
	}

	it('accepts valid paper analysis output', () => {
		const result = paperAgentSchema.safeParse(validOutput)
		expect(result.success).toBe(true)
	})

	it('rejects empty abstract summary', () => {
		const result = paperAgentSchema.safeParse({ ...validOutput, abstractSummary: '' })
		expect(result.success).toBe(false)
	})

	it('rejects missing key claims', () => {
		const result = paperAgentSchema.safeParse({ ...validOutput, keyClaims: [] })
		expect(result.success).toBe(false)
	})

	it('rejects readiness score above 100', () => {
		const result = paperAgentSchema.safeParse({ ...validOutput, initialReadinessEstimate: 150 })
		expect(result.success).toBe(false)
	})

	it('rejects readiness score below 0', () => {
		const result = paperAgentSchema.safeParse({ ...validOutput, initialReadinessEstimate: -5 })
		expect(result.success).toBe(false)
	})

	it('rejects trivially short claims', () => {
		const result = paperAgentSchema.safeParse({ ...validOutput, keyClaims: ['yes'] })
		expect(result.success).toBe(false)
	})

	it('rejects too many claims (likely padding)', () => {
		const result = paperAgentSchema.safeParse({
			...validOutput,
			keyClaims: Array(15).fill('This is a long enough claim to pass minimum length'),
		})
		expect(result.success).toBe(false)
	})
})

// ─── Critique: Skeptical Review ──────────────────────────────────────────────

describe('Critique — Skeptical Review Validator', () => {
	const validOutput = {
		verdict: 'NEEDS_REVISION' as const,
		issues: [
			{
				field: 'keyClaims[1]',
				quote: 'Reduces bacterial adhesion by 99% compared to uncoated titanium.',
				issue: 'The paper reports 94% reduction in Table 3, not 99%.',
				severity: 'CRITICAL' as const,
			},
		],
		summary: 'One key claim misquotes the adhesion figure from Table 3.',
	}

	it('accepts valid critique output', () => {
		const result = paperCritiqueSchema.safeParse(validOutput)
		expect(result.success).toBe(true)
	})

	it('accepts a clean PASS with no issues', () => {
		const result = paperCritiqueSchema.safeParse({
			verdict: 'PASS',
			issues: [],
			summary: 'All claims are grounded in the paper text.',
		})
		expect(result.success).toBe(true)
	})

	it('accepts short quotes (e.g. challenging a numeric readiness estimate)', () => {
		const result = paperCritiqueSchema.safeParse({
			...validOutput,
			issues: [{ ...validOutput.issues[0], field: 'initialReadinessEstimate', quote: '85' }],
		})
		expect(result.success).toBe(true)
	})

	it('rejects an invalid verdict', () => {
		const result = paperCritiqueSchema.safeParse({ ...validOutput, verdict: 'MAYBE' })
		expect(result.success).toBe(false)
	})

	it('rejects an issue without severity', () => {
		const { severity: _severity, ...issueWithoutSeverity } = validOutput.issues[0]
		const result = paperCritiqueSchema.safeParse({
			...validOutput,
			issues: [issueWithoutSeverity],
		})
		expect(result.success).toBe(false)
	})
})

// ─── Agent 2: TRL/IRL ────────────────────────────────────────────────────────

describe('Agent 2 — TRL/IRL Validator', () => {
	const validOutput = {
		trlScore: 'TRL 5',
		irlScore: 'IRL 6.2 / 10',
		rationale: [
			'Validated in lab conditions with multiple material substrates.',
			'Agent 1 tagged the adhesion claim EVIDENCE_BACKED with STRONG methodology.',
			'No in vivo or pilot-scale data, capping the score at lab validation level.',
		],
		confidence: '72% confidence based on experimental evidence.',
		riskFlags: ['Needs external validation beyond controlled lab environment.'],
		evidence: [],
		commercializationPathway: 'LICENSING' as const,
		pathwayRationale: 'Incremental improvement to an existing implant workflow suits an industry licensee.',
		recommendedGrants: ['BIRAC BIG Grant (India, biotech/medtech TRL 3-6)'],
		timeToMarket: '5-8 years via licensing given regulatory pathway.',
		domainRubricApplied: 'Biotech/Materials domain rubric — in vitro validation threshold',
	}

	it('accepts valid TRL/IRL output', () => {
		const result = trlIrlAgentSchema.safeParse(validOutput)
		expect(result.success).toBe(true)
	})

	it('rejects invalid TRL format', () => {
		const result = trlIrlAgentSchema.safeParse({ ...validOutput, trlScore: 'Level 5' })
		expect(result.success).toBe(false)
	})

	it('rejects empty rationale', () => {
		const result = trlIrlAgentSchema.safeParse({ ...validOutput, rationale: [] })
		expect(result.success).toBe(false)
	})

	it('rejects empty risk flags', () => {
		const result = trlIrlAgentSchema.safeParse({ ...validOutput, riskFlags: [] })
		expect(result.success).toBe(false)
	})
})

// ─── Agent 3: Market ─────────────────────────────────────────────────────────

describe('Agent 3 — Market Validator', () => {
	const validOutput = {
		tam: '$4.2B',
		sam: '$1.1B',
		som: '$180M',
		summary: 'The infection-prevention materials market is growing at 12% CAGR driven by hospital procurement pressure.',
		competitors: [
			{ name: 'SurfaceShield Bio', positioning: 'Antimicrobial coatings for surgical devices.', stage: 'Series A', signal: 'Raised extension round.' },
		],
		signals: [
			{ title: 'Funding activity in infection prevention', type: 'Funding' as const, impact: 'High' as const, summary: 'Multiple seed-stage financings in adjacent categories.' },
		],
		evidence: [],
	}

	it('accepts valid market output', () => {
		const result = marketAgentSchema.safeParse(validOutput)
		expect(result.success).toBe(true)
	})

	it('rejects with zero competitors', () => {
		const result = marketAgentSchema.safeParse({ ...validOutput, competitors: [] })
		expect(result.success).toBe(false)
	})

	it('rejects invalid signal type', () => {
		const result = marketAgentSchema.safeParse({
			...validOutput,
			signals: [{ ...validOutput.signals[0], type: 'Rumor' }],
		})
		expect(result.success).toBe(false)
	})

	it('rejects invalid impact level', () => {
		const result = marketAgentSchema.safeParse({
			...validOutput,
			signals: [{ ...validOutput.signals[0], impact: 'Critical' }],
		})
		expect(result.success).toBe(false)
	})
})

// ─── Agent 3: Market Scout (grounded) ────────────────────────────────────────

describe('Agent 3 — Market Scout Grounding Validator', () => {
	const retrievedUrls = [
		'https://example.com/market-report-2026',
		'https://news.example.com/funding/coating-startup',
	]
	const validator = buildMarketScoutValidator(retrievedUrls)

	const validOutput = {
		tam: {
			value: '$4.2B by 2030',
			basis: 'Global antimicrobial coatings market as sized by the retrieved report.',
			sourceUrl: 'https://example.com/market-report-2026',
			sourceTitle: 'Antimicrobial Coatings Market Report 2026',
		},
		sam: null,
		som: null,
		summary:
			'Retrieved sources establish a multi-billion dollar coatings market with active early-stage funding; SAM/SOM could not be grounded.',
		competitors: [
			{
				name: 'CoatShield Bio',
				positioning: 'Antimicrobial implant coatings for orthopaedic devices.',
				stage: 'Series A',
				signal: 'Raised a $12M round per the retrieved article.',
				sourceUrl: 'https://news.example.com/funding/coating-startup',
			},
		],
		signals: [
			{
				title: 'Early-stage funding in implant coatings',
				type: 'Funding' as const,
				impact: 'Medium' as const,
				summary: 'A coatings startup raised funding in an adjacent category.',
				sourceUrl: 'https://news.example.com/funding/coating-startup',
			},
		],
	}

	it('accepts output where every sourceUrl was retrieved', () => {
		const result = validator.safeParse(validOutput)
		expect(result.success).toBe(true)
	})

	it('accepts null figures (no source, no claim)', () => {
		const result = validator.safeParse({ ...validOutput, tam: null })
		expect(result.success).toBe(true)
	})

	it('rejects a market figure citing a URL that was never retrieved', () => {
		const result = validator.safeParse({
			...validOutput,
			tam: { ...validOutput.tam, sourceUrl: 'https://statista.com/hallucinated-report' },
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0].message).toContain('Ungrounded sourceUrl')
			expect(result.error.issues[0].path).toEqual(['tam', 'sourceUrl'])
		}
	})

	it('rejects a competitor citing an unretrieved URL', () => {
		const result = validator.safeParse({
			...validOutput,
			competitors: [{ ...validOutput.competitors[0], sourceUrl: 'https://crunchbase.com/invented' }],
		})
		expect(result.success).toBe(false)
	})

	it('rejects a figure with a missing sourceUrl entirely', () => {
		const { sourceUrl: _omitted, ...tamWithoutSource } = validOutput.tam
		const result = validator.safeParse({ ...validOutput, tam: tamWithoutSource })
		expect(result.success).toBe(false)
	})

	it('tolerates cosmetic URL differences (trailing slash)', () => {
		const result = validator.safeParse({
			...validOutput,
			tam: { ...validOutput.tam, sourceUrl: 'https://example.com/market-report-2026/' },
		})
		expect(result.success).toBe(true)
	})
})

// ─── Agent 4: Feasibility (false-precision guard) ────────────────────

describe('Agent 4 — Feasibility Scout Validator', () => {
	const validOutput = {
		teamMatrix: [
			{
				role: 'Senior ML Systems Engineer',
				domainExpertise: 'Distributed transformer training and inference optimization',
				seniority: 'Senior / 6+ years',
				rationale: 'Agent 1 claims center on training-cost advantages; productizing requires distributed-training operations experience the academic team lacks.',
			},
		],
		estimatedTimeline: {
			minMonths: 12,
			maxMonths: 24,
			confidence: 'medium' as const,
			reasoning: 'Crossing TRL 4→6 needs real-world validation and a deployed prototype; range depends on whether an industry partner supplies data.',
		},
		capitalEstimate: {
			minINR: 25_000_000,
			maxINR: 60_000_000,
			confidence: 'low' as const,
			reasoning: 'Wide because the deployment path depends on partnerships that do not yet exist and compute costs scale with dataset size, both unknown from the inputs.',
			majorCostDrivers: ['GPU compute for training/inference', 'Senior ML engineering salaries'],
		},
		keyRisks: ['TRL 4 position means the real-world deployment path is unproven and may require architecture changes.'],
		overallConfidence: {
			level: 'low' as const,
			reasoning: 'Inputs validate the architecture on benchmarks only; the execution path beyond the lab is largely unestablished.',
		},
	}

	it('accepts a valid feasibility assessment with genuine ranges', () => {
		const result = feasibilityScoutSchema.safeParse(validOutput)
		expect(result.success).toBe(true)
	})

	it('rejects a timeline that is a point estimate (max == min)', () => {
		const result = feasibilityScoutSchema.safeParse({
			...validOutput,
			estimatedTimeline: { ...validOutput.estimatedTimeline, minMonths: 18, maxMonths: 18 },
		})
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0].message).toContain('genuine range')
			expect(result.error.issues[0].path).toEqual(['estimatedTimeline', 'maxMonths'])
		}
	})

	it('rejects a capital estimate that is a point estimate (max == min)', () => {
		const result = feasibilityScoutSchema.safeParse({
			...validOutput,
			capitalEstimate: { ...validOutput.capitalEstimate, minINR: 40_000_000, maxINR: 40_000_000 },
		})
		expect(result.success).toBe(false)
	})

	it('rejects an inverted capital range (max < min)', () => {
		const result = feasibilityScoutSchema.safeParse({
			...validOutput,
			capitalEstimate: { ...validOutput.capitalEstimate, minINR: 60_000_000, maxINR: 25_000_000 },
		})
		expect(result.success).toBe(false)
	})

	it('rejects a capital estimate with no cost drivers', () => {
		const result = feasibilityScoutSchema.safeParse({
			...validOutput,
			capitalEstimate: { ...validOutput.capitalEstimate, majorCostDrivers: [] },
		})
		expect(result.success).toBe(false)
	})

	it('rejects an invalid confidence level', () => {
		const result = feasibilityScoutSchema.safeParse({
			...validOutput,
			overallConfidence: { ...validOutput.overallConfidence, level: 'very-high' },
		})
		expect(result.success).toBe(false)
	})

	it('rejects an empty team matrix', () => {
		const result = feasibilityScoutSchema.safeParse({ ...validOutput, teamMatrix: [] })
		expect(result.success).toBe(false)
	})
})

describe('Agent 5 — Pitch Builder Traceability Validator', () => {
	const marketUrl = 'https://example.com/nlp-market-report'
	const index: PitchRefIndex = {
		validRefs: new Set([
			'paper.noveltySummary',
			'paper.keyClaims[0]',
			'trlIrl.trlScore',
			'market.tam',
			'feasibility.capitalEstimate',
		]),
		marketSourceByRef: new Map([['market.tam', marketUrl]]),
		allowedMarketUrls: new Set([marketUrl]),
		marketPresent: true,
	}
	const validator = buildPitchValidator(index)

	const validDeck = {
		slides: [
			{
				order: 1,
				slideType: 'PROBLEM' as const,
				title: 'The Problem',
				bullets: ['Sequence models are slow and hard to parallelize.'],
				narrative: 'Every lab racing to scale language models hits the same wall.',
				factRefs: [], // pure narrative — allowed
			},
			{
				order: 2,
				slideType: 'TECHNOLOGY' as const,
				title: 'Our Technology',
				bullets: ['Attention-only architecture removes recurrence entirely.'],
				narrative: '',
				factRefs: [{ ref: 'paper.noveltySummary', sourceUrl: '' }],
			},
			{
				order: 3,
				slideType: 'MARKET' as const,
				title: 'Market',
				bullets: ['The NLP market is large and growing fast.'],
				narrative: '',
				factRefs: [{ ref: 'market.tam', sourceUrl: marketUrl }],
			},
			{
				order: 4,
				slideType: 'ASK' as const,
				title: 'The Ask',
				bullets: ['We are raising to reach the next milestone.'],
				narrative: '',
				factRefs: [{ ref: 'feasibility.capitalEstimate', sourceUrl: '' }],
			},
		],
	}

	it('accepts a deck where every factRef is valid and market sources carry through', () => {
		const result = validator.safeParse(validDeck)
		expect(result.success).toBe(true)
	})

	it('rejects an invented upstream reference', () => {
		const bad = structuredClone(validDeck)
		bad.slides[1].factRefs = [{ ref: 'paper.fabricatedField', sourceUrl: '' }]
		const result = validator.safeParse(bad)
		expect(result.success).toBe(false)
		if (!result.success) expect(result.error.issues[0].message).toContain('Invented upstream reference')
	})

	it('rejects a market figure that does not carry its Market Scout source URL', () => {
		const bad = structuredClone(validDeck)
		bad.slides[2].factRefs = [{ ref: 'market.tam', sourceUrl: '' }]
		const result = validator.safeParse(bad)
		expect(result.success).toBe(false)
		if (!result.success) expect(result.error.issues[0].message).toContain('must carry its Market Scout source URL')
	})

	it('rejects a market figure carrying a fabricated source URL', () => {
		const bad = structuredClone(validDeck)
		bad.slides[2].factRefs = [{ ref: 'market.tam', sourceUrl: 'https://statista.com/invented' }]
		const result = validator.safeParse(bad)
		expect(result.success).toBe(false)
	})

	it('carries through despite a cosmetic trailing-slash difference', () => {
		const ok = structuredClone(validDeck)
		ok.slides[2].factRefs = [{ ref: 'market.tam', sourceUrl: marketUrl + '/' }]
		const result = validator.safeParse(ok)
		expect(result.success).toBe(true)
	})

	it('rejects a MARKET slide when the market stage was skipped', () => {
		const noMarket = buildPitchValidator({
			validRefs: new Set(['paper.noveltySummary', 'feasibility.capitalEstimate']),
			marketSourceByRef: new Map(),
			allowedMarketUrls: new Set(),
			marketPresent: false,
		})
		const deck = structuredClone(validDeck)
		// drop the market factRef so only the slideType triggers the issue
		deck.slides[2].factRefs = []
		const result = noMarket.safeParse(deck)
		expect(result.success).toBe(false)
		if (!result.success) expect(result.error.issues.some((i) => i.message.includes('MARKET slide cannot exist'))).toBe(true)
	})
})

describe('Agent 5 — Deck Validator', () => {
	const validOutput = {
		fundingAsk: '₹2 Cr for pilots, regulatory prep, and early device partnerships.',
		keyNarrativePoints: [
			'Healthcare systems already spend significantly on infection prevention.',
			'The paper provides a concrete technical wedge, not generic science.',
		],
		slides: [
			{ order: 1, title: 'Problem & Opportunity', keyPoint: 'Hospital infection prevention is expensive and urgent.' },
			{ order: 2, title: 'Technology Moat', keyPoint: 'The coating pathway is defensible.' },
			{ order: 3, title: 'Market Timing', keyPoint: 'Recent funding supports near-term relevance.' },
		],
		readinessScore: 78,
	}

	it('accepts valid deck output', () => {
		const result = deckAgentSchema.safeParse(validOutput)
		expect(result.success).toBe(true)
	})

	it('rejects readiness score above 100', () => {
		const result = deckAgentSchema.safeParse({ ...validOutput, readinessScore: 120 })
		expect(result.success).toBe(false)
	})

	it('rejects fewer than 3 slides', () => {
		const result = deckAgentSchema.safeParse({ ...validOutput, slides: [validOutput.slides[0]] })
		expect(result.success).toBe(false)
	})

	it('rejects fewer than 2 narrative points', () => {
		const result = deckAgentSchema.safeParse({
			...validOutput,
			keyNarrativePoints: ['Only one point here.'],
		})
		expect(result.success).toBe(false)
	})

	it('rejects too many slides (bloated deck)', () => {
		const result = deckAgentSchema.safeParse({
			...validOutput,
			slides: Array(15).fill(validOutput.slides[0]),
		})
		expect(result.success).toBe(false)
	})
})
