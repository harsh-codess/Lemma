import { describe, it, expect } from 'vitest'
import { isReviewerRole, resolveReviewTransition } from './review-flow'

/**
 * ─── Review Flow Tests ───────────────────────────────────────────────────────
 *
 * Lock the approval state machine:
 *   approve:          DRAFT → IN_REVIEW → READY_FOR_EXPORT (then terminal)
 *   request_changes:  READY_FOR_EXPORT → IN_REVIEW → DRAFT (then terminal)
 * plus the analysis-complete gate on the first approval.
 */

describe('isReviewerRole', () => {
	it('allows TTO_LEAD and COMMITTEE_MEMBER', () => {
		expect(isReviewerRole('TTO_LEAD')).toBe(true)
		expect(isReviewerRole('COMMITTEE_MEMBER')).toBe(true)
	})

	it('rejects every other role (spec: 403 for non-reviewers, including ADMIN)', () => {
		expect(isReviewerRole('RESEARCHER')).toBe(false)
		expect(isReviewerRole('TTO_ANALYST')).toBe(false)
		expect(isReviewerRole('ADMIN')).toBe(false)
		expect(isReviewerRole(null)).toBe(false)
		expect(isReviewerRole(undefined)).toBe(false)
	})
})

describe('resolveReviewTransition — approve', () => {
	it('DRAFT with completed analysis → IN_REVIEW (review stage untouched)', () => {
		expect(
			resolveReviewTransition('approve', { status: 'DRAFT', analysisStatus: 'COMPLETE' }),
		).toEqual({ ok: true, nextStatus: 'IN_REVIEW', reviewStageStatus: null })
	})

	it.each(['IDLE', 'PROCESSING', 'FAILED'] as const)(
		'DRAFT with %s analysis is illegal — the project has not reached review',
		(analysisStatus) => {
			const result = resolveReviewTransition('approve', { status: 'DRAFT', analysisStatus })
			expect(result.ok).toBe(false)
		},
	)

	it('IN_REVIEW → READY_FOR_EXPORT and completes the REVIEW stage', () => {
		expect(
			resolveReviewTransition('approve', { status: 'IN_REVIEW', analysisStatus: 'COMPLETE' }),
		).toEqual({ ok: true, nextStatus: 'READY_FOR_EXPORT', reviewStageStatus: 'COMPLETE' })
	})

	it('READY_FOR_EXPORT is terminal — cannot approve an already-approved project', () => {
		const result = resolveReviewTransition('approve', {
			status: 'READY_FOR_EXPORT',
			analysisStatus: 'COMPLETE',
		})
		expect(result.ok).toBe(false)
	})
})

describe('resolveReviewTransition — request_changes', () => {
	it('DRAFT is illegal — nothing to send back', () => {
		const result = resolveReviewTransition('request_changes', {
			status: 'DRAFT',
			analysisStatus: 'COMPLETE',
		})
		expect(result.ok).toBe(false)
	})

	it('IN_REVIEW → DRAFT and reopens the REVIEW stage', () => {
		expect(
			resolveReviewTransition('request_changes', {
				status: 'IN_REVIEW',
				analysisStatus: 'COMPLETE',
			}),
		).toEqual({ ok: true, nextStatus: 'DRAFT', reviewStageStatus: 'CURRENT' })
	})

	it('READY_FOR_EXPORT → IN_REVIEW and reopens the REVIEW stage', () => {
		expect(
			resolveReviewTransition('request_changes', {
				status: 'READY_FOR_EXPORT',
				analysisStatus: 'COMPLETE',
			}),
		).toEqual({ ok: true, nextStatus: 'IN_REVIEW', reviewStageStatus: 'CURRENT' })
	})
})
