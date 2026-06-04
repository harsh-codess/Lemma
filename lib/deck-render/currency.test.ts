import { describe, it, expect } from 'vitest'
import { formatCurrencyInText } from './currency'

describe('formatCurrencyInText', () => {
	it('formats a raw rupee range into crores (dash, no spaces)', () => {
		expect(formatCurrencyInText('₹120000000-350000000')).toBe('₹12–35 Cr')
	})

	it('formats a raw range written with commas and "to"', () => {
		expect(formatCurrencyInText('an investment of ₹55,000,000 to ₹125,000,000 is sought')).toBe(
			'an investment of ₹5.5–12.5 Cr is sought',
		)
	})

	it('formats a single raw rupee amount', () => {
		expect(formatCurrencyInText('Capital required: ₹250000000.')).toBe('Capital required: ₹25 Cr.')
	})

	it('preserves the space after a converted amount (no unit eats trailing space)', () => {
		expect(formatCurrencyInText('₹120000000-350000000 (medium confidence)')).toBe('₹12–35 Cr (medium confidence)')
	})

	it('uses one decimal only when needed', () => {
		expect(formatCurrencyInText('₹125000000')).toBe('₹12.5 Cr')
		expect(formatCurrencyInText('₹120000000')).toBe('₹12 Cr')
	})

	it('normalizes abbreviated ₹ forms (M / lakh) to crores', () => {
		expect(formatCurrencyInText('deploy ₹120M to ₹350M to build out')).toBe('deploy ₹12–35 Cr to build out')
		expect(formatCurrencyInText('₹120M to ₹350M')).toBe('₹12–35 Cr')
		expect(formatCurrencyInText('a ₹50 lakh tranche')).toBe('a ₹0.5 Cr tranche')
	})

	it('does not read a unit letter inside a following word', () => {
		expect(formatCurrencyInText('₹120 Marketing budget')).toBe('₹120 Marketing budget')
	})

	it('leaves already-crore figures untouched and is idempotent', () => {
		expect(formatCurrencyInText('We raised ₹2 Cr last year')).toBe('We raised ₹2 Cr last year')
		expect(formatCurrencyInText('₹12–35 Cr')).toBe('₹12–35 Cr')
		expect(formatCurrencyInText(formatCurrencyInText('₹120000000-350000000'))).toBe('₹12–35 Cr')
	})

	it('never touches non-rupee numbers (years, TRL, market sizes, BLEU)', () => {
		const samples = [
			'CAGR of 38.40% from 2025 to 2034',
			'TRL 4-6 readiness',
			'$791.16 billion by 2034',
			'28.4 BLEU, +2.0 over prior',
		]
		for (const s of samples) expect(formatCurrencyInText(s)).toBe(s)
	})

	it('handles an en-dash range', () => {
		expect(formatCurrencyInText('₹100000000–₹200000000')).toBe('₹10–20 Cr')
	})

	it('is a no-op on text with no rupee figures', () => {
		expect(formatCurrencyInText('The Transformer architecture is highly parallelizable.')).toBe(
			'The Transformer architecture is highly parallelizable.',
		)
	})
})
