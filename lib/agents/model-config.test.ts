import { describe, it, expect, afterEach } from 'vitest'
import { getAgentModelConfig, AGENT_KEYS } from './model-config'

/**
 * ─── Model Config Tests ──────────────────────────────────────────────────────
 *
 * Lock the per-agent defaults (Pro on paper-reader + critiques, Flash on
 * pitch/market-synthesis, Flash-lite on retrieval) and the env-override path.
 */

const TOUCHED_ENV: string[] = []
function setEnv(key: string, value: string) {
	TOUCHED_ENV.push(key)
	process.env[key] = value
}

afterEach(() => {
	for (const key of TOUCHED_ENV.splice(0)) delete process.env[key]
})

describe('model-config defaults', () => {
	it('puts gemini-pro-latest + high thinking on the paper reader', () => {
		expect(getAgentModelConfig('paper-reader')).toEqual({
			primary: 'gemini-pro-latest',
			fallback: 'gemini-3.5-flash',
			thinkingLevel: 'high',
		})
	})

	it('puts gemini-pro-latest + high thinking on critiques', () => {
		expect(getAgentModelConfig('critique')).toEqual({
			primary: 'gemini-pro-latest',
			fallback: 'gemini-3.5-flash',
			thinkingLevel: 'high',
		})
	})

	it('puts Flash → Flash-lite + medium thinking on pitch and market-synthesis', () => {
		for (const key of ['pitch-builder', 'market-synthesis'] as const) {
			expect(getAgentModelConfig(key)).toEqual({
				primary: 'gemini-3.5-flash',
				fallback: 'gemini-3.1-flash-lite',
				thinkingLevel: 'medium',
			})
		}
	})

	it('puts Flash-lite + minimal thinking on market-retrieval', () => {
		expect(getAgentModelConfig('market-retrieval')).toEqual({
			primary: 'gemini-3.1-flash-lite',
			fallback: 'gemini-3.1-flash-lite',
			thinkingLevel: 'minimal',
		})
	})

	it('uses ONLY verified-available, non-preview, non-2.0 strings across all agents', () => {
		const allowed = new Set(['gemini-pro-latest', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'])
		for (const key of AGENT_KEYS) {
			const cfg = getAgentModelConfig(key)
			expect(allowed.has(cfg.primary), `${key}.primary=${cfg.primary}`).toBe(true)
			expect(allowed.has(cfg.fallback), `${key}.fallback=${cfg.fallback}`).toBe(true)
			expect(cfg.primary).not.toMatch(/preview|gemini-2\.0/)
			expect(cfg.fallback).not.toMatch(/preview|gemini-2\.0/)
		}
	})
})

describe('model-config env overrides', () => {
	it('overrides the primary model from the environment', () => {
		setEnv('GEMINI_MODEL_PAPER_READER_PRIMARY', 'gemini-3.1-pro-preview')
		expect(getAgentModelConfig('paper-reader').primary).toBe('gemini-3.1-pro-preview')
	})

	it('overrides the thinking level from the environment', () => {
		setEnv('GEMINI_MODEL_CRITIQUE_THINKING', 'medium')
		expect(getAgentModelConfig('critique').thinkingLevel).toBe('medium')
	})

	it('ignores an invalid thinking-level override rather than passing a bad param', () => {
		setEnv('GEMINI_MODEL_CRITIQUE_THINKING', 'ultra')
		expect(getAgentModelConfig('critique').thinkingLevel).toBe('high') // default retained
	})
})
