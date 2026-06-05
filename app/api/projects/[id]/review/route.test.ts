import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'

/**
 * ─── POST /api/projects/[id]/review ──────────────────────────────────────────
 *
 * Route-level tests with Clerk auth and Prisma mocked: role gating (403),
 * visibility (404 vs clean 403), legal/illegal status transitions, and the
 * decision-comment → ReviewNote path.
 */

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
	prisma: {
		user: { findUnique: vi.fn() },
		project: { findUnique: vi.fn(), update: vi.fn() },
		projectStage: { updateMany: vi.fn() },
		reviewNote: { create: vi.fn() },
		$transaction: vi.fn(async (ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
	},
}))

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { POST } from './route'

const authMock = vi.mocked(auth)
const userFindUnique = vi.mocked(prisma.user.findUnique)
const projectFindUnique = vi.mocked(prisma.project.findUnique)
const projectUpdate = vi.mocked(prisma.project.update)
const stageUpdateMany = vi.mocked(prisma.projectStage.updateMany)
const noteCreate = vi.mocked(prisma.reviewNote.create)

const CTX = { params: { id: 'proj_1' } }

const postReview = (body: unknown) =>
	POST(
		new Request('http://test.local/api/projects/proj_1/review', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		}) as NextRequest,
		CTX,
	)

const signInAs = (role: string | null, institutionId = 'inst_1') => {
	authMock.mockResolvedValue({ userId: 'user_1' } as never)
	userFindUnique.mockResolvedValue((role ? { role, institutionId } : null) as never)
}

/** Project owned by someone else in inst_1 — visible to inst_1 reviewers. */
const withProject = (
	status: string,
	analysisStatus = 'COMPLETE',
	overrides: Record<string, unknown> = {},
) => {
	projectFindUnique.mockResolvedValue({
		id: 'proj_1',
		ownerId: 'owner_9',
		institutionId: 'inst_1',
		status,
		analysisStatus,
		...overrides,
	} as never)
}

beforeEach(() => {
	vi.clearAllMocks()
	projectUpdate.mockResolvedValue({
		id: 'proj_1',
		status: 'IN_REVIEW',
		currentStage: 'DECK',
	} as never)
	stageUpdateMany.mockResolvedValue({ count: 1 } as never)
	noteCreate.mockResolvedValue({ id: 'note_1' } as never)
})

describe('authentication and authorization', () => {
	it('401 when signed out', async () => {
		authMock.mockResolvedValue({ userId: null } as never)
		const res = await postReview({ action: 'approve' })
		expect(res.status).toBe(401)
	})

	it.each(['RESEARCHER', 'TTO_ANALYST', 'ADMIN'])('403 for %s', async (role) => {
		signInAs(role)
		const res = await postReview({ action: 'approve' })
		expect(res.status).toBe(403)
		expect(projectFindUnique).not.toHaveBeenCalled()
	})

	it('403 when the user record does not exist (onboarding not completed)', async () => {
		signInAs(null)
		const res = await postReview({ action: 'approve' })
		expect(res.status).toBe(403)
	})

	it('404 only when the project truly does not exist', async () => {
		signInAs('TTO_LEAD')
		projectFindUnique.mockResolvedValue(null as never)
		const res = await postReview({ action: 'approve' })
		expect(res.status).toBe(404)
	})

	it('403 (not 404) for a reviewer from another institution', async () => {
		signInAs('TTO_LEAD', 'inst_OTHER')
		withProject('DRAFT')
		const res = await postReview({ action: 'approve' })
		expect(res.status).toBe(403)
		expect(projectUpdate).not.toHaveBeenCalled()
	})

	it('403 for a committee member on a project still in DRAFT (not yet in review)', async () => {
		signInAs('COMMITTEE_MEMBER')
		withProject('DRAFT')
		const res = await postReview({ action: 'approve' })
		expect(res.status).toBe(403)
	})

	it('200 for a committee member once the project is IN_REVIEW', async () => {
		signInAs('COMMITTEE_MEMBER')
		withProject('IN_REVIEW')
		const res = await postReview({ action: 'approve' })
		expect(res.status).toBe(200)
	})
})

describe('legal transitions', () => {
	it('approve: DRAFT → IN_REVIEW', async () => {
		signInAs('TTO_LEAD')
		withProject('DRAFT')
		const res = await postReview({ action: 'approve' })
		expect(res.status).toBe(200)
		expect(projectUpdate).toHaveBeenCalledWith(
			expect.objectContaining({ data: { status: 'IN_REVIEW' } }),
		)
		// First approval does not touch the REVIEW stage row.
		expect(stageUpdateMany).not.toHaveBeenCalled()
	})

	it('approve: IN_REVIEW → READY_FOR_EXPORT and completes the REVIEW stage', async () => {
		signInAs('COMMITTEE_MEMBER')
		withProject('IN_REVIEW')
		const res = await postReview({ action: 'approve' })
		expect(res.status).toBe(200)
		expect(projectUpdate).toHaveBeenCalledWith(
			expect.objectContaining({ data: { status: 'READY_FOR_EXPORT' } }),
		)
		expect(stageUpdateMany).toHaveBeenCalledWith(
			expect.objectContaining({ data: { status: 'COMPLETE' } }),
		)
	})

	it('request_changes: READY_FOR_EXPORT → IN_REVIEW', async () => {
		signInAs('TTO_LEAD')
		withProject('READY_FOR_EXPORT')
		const res = await postReview({ action: 'request_changes' })
		expect(res.status).toBe(200)
		expect(projectUpdate).toHaveBeenCalledWith(
			expect.objectContaining({ data: { status: 'IN_REVIEW' } }),
		)
		expect(stageUpdateMany).toHaveBeenCalledWith(
			expect.objectContaining({ data: { status: 'CURRENT' } }),
		)
	})

	it('records the decision comment as a ReviewNote', async () => {
		signInAs('TTO_LEAD')
		withProject('IN_REVIEW')
		const res = await postReview({ action: 'approve', comment: 'Deck looks solid.' })
		expect(res.status).toBe(200)
		expect(noteCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					projectId: 'proj_1',
					authorId: 'user_1',
					stageKey: 'REVIEW',
					status: 'RESOLVED',
					comment: 'Deck looks solid.',
				}),
			}),
		)
	})

	it('skips the ReviewNote when no comment is given', async () => {
		signInAs('TTO_LEAD')
		withProject('DRAFT')
		await postReview({ action: 'approve' })
		expect(noteCreate).not.toHaveBeenCalled()
	})
})

describe('illegal transitions → 409', () => {
	it('approve on READY_FOR_EXPORT (already approved for export)', async () => {
		signInAs('TTO_LEAD')
		withProject('READY_FOR_EXPORT')
		const res = await postReview({ action: 'approve' })
		expect(res.status).toBe(409)
		expect(projectUpdate).not.toHaveBeenCalled()
	})

	it('approve on DRAFT before the analysis completes', async () => {
		signInAs('TTO_LEAD')
		withProject('DRAFT', 'PROCESSING')
		const res = await postReview({ action: 'approve' })
		expect(res.status).toBe(409)
	})

	it('request_changes on DRAFT (nothing to send back)', async () => {
		signInAs('TTO_LEAD')
		withProject('DRAFT')
		const res = await postReview({ action: 'request_changes' })
		expect(res.status).toBe(409)
	})
})

describe('validation', () => {
	it('400 on an unknown action', async () => {
		signInAs('TTO_LEAD')
		const res = await postReview({ action: 'reject' })
		expect(res.status).toBe(400)
	})
})
