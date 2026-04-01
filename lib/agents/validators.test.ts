import { describe, it, expect } from 'vitest'
import { paperAgentSchema, trlIrlAgentSchema, marketAgentSchema, feasibilityAgentSchema, deckAgentSchema } from './validators'

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

// ─── Agent 2: TRL/IRL ────────────────────────────────────────────────────────

describe('Agent 2 — TRL/IRL Validator', () => {
	const validOutput = {
		trlScore: 'TRL 5',
		irlScore: 'IRL 6.2 / 10',
		rationale: ['Validated in lab conditions with multiple material substrates.'],
		confidence: '72% confidence based on experimental evidence.',
		riskFlags: ['Needs external validation beyond controlled lab environment.'],
		evidence: [],
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

// ─── Agent 5: Deck ───────────────────────────────────────────────────────────

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
