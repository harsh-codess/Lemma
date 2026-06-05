import type { AnalysisStatus, ProjectStatus, StageStatus, UserRole } from '@prisma/client'

/**
 * Human review flow — pure transition rules for the approval handoff that
 * follows the AI pipeline. The pipeline ends with the REVIEW stage CURRENT and
 * project.status still DRAFT; from there reviewers walk the status forward:
 *
 *   approve:          DRAFT → IN_REVIEW → READY_FOR_EXPORT
 *   request_changes:  READY_FOR_EXPORT → IN_REVIEW → DRAFT
 *
 * Kept free of Prisma/Next imports (types only) so the rules are unit-testable
 * without mocking the route layer.
 */

export const REVIEW_ACTIONS = ['approve', 'request_changes'] as const
export type ReviewAction = (typeof REVIEW_ACTIONS)[number]

/** Roles allowed to approve / request changes / write review notes. */
export const REVIEWER_ROLES: readonly UserRole[] = ['TTO_LEAD', 'COMMITTEE_MEMBER']

export const isReviewerRole = (role: UserRole | undefined | null): boolean =>
	role != null && REVIEWER_ROLES.includes(role)

export type ReviewTransition =
	| {
			ok: true
			nextStatus: ProjectStatus
			/** New status for the REVIEW ProjectStage row (null = leave as-is). */
			reviewStageStatus: Extract<StageStatus, 'COMPLETE' | 'CURRENT'> | null
	  }
	| { ok: false; error: string }

/**
 * Resolve what a review action does from the project's current state, or why
 * it is illegal. Approval requires a finished analysis (the REVIEW stage is
 * only reached when the pipeline completes), and an already-approved project
 * (READY_FOR_EXPORT) cannot be approved again.
 */
export function resolveReviewTransition(
	action: ReviewAction,
	project: { status: ProjectStatus; analysisStatus: AnalysisStatus },
): ReviewTransition {
	const { status, analysisStatus } = project

	if (action === 'approve') {
		switch (status) {
			case 'DRAFT':
				if (analysisStatus !== 'COMPLETE') {
					return {
						ok: false,
						error: 'Analysis has not completed — the project has not reached the review stage yet.',
					}
				}
				return { ok: true, nextStatus: 'IN_REVIEW', reviewStageStatus: null }
			case 'IN_REVIEW':
				return { ok: true, nextStatus: 'READY_FOR_EXPORT', reviewStageStatus: 'COMPLETE' }
			case 'READY_FOR_EXPORT':
				return {
					ok: false,
					error: 'Project is already approved for export — nothing further to approve.',
				}
		}
	}

	// request_changes
	switch (status) {
		case 'DRAFT':
			return {
				ok: false,
				error: 'Project is not in review — there is no approval to send back.',
			}
		case 'IN_REVIEW':
			return { ok: true, nextStatus: 'DRAFT', reviewStageStatus: 'CURRENT' }
		case 'READY_FOR_EXPORT':
			return { ok: true, nextStatus: 'IN_REVIEW', reviewStageStatus: 'CURRENT' }
	}
}
