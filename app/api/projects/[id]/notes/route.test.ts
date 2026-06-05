import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'

/**
 * ─── /api/projects/[id]/notes ────────────────────────────────────────────────
 *
 * Note creation is reviewer-gated (403 otherwise); listing follows project
 * visibility — the owner can read the feedback on their project, strangers
 * get a clean 403, and only a truly missing project 404s.
 */

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
	prisma: {
		user: { findUnique: vi.fn() },
		project: { findUnique: vi.fn() },
		reviewNote: { create: vi.fn(), findMany: vi.fn() },
	},
}))

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { GET, POST } from './route'

const authMock = vi.mocked(auth)
const userFindUnique = vi.mocked(prisma.user.findUnique)
const projectFindUnique = vi.mocked(prisma.project.findUnique)
const noteCreate = vi.mocked(prisma.reviewNote.create)
const noteFindMany = vi.mocked(prisma.reviewNote.findMany)

const CTX = { params: { id: 'proj_1' } }

const postNote = (body: unknown) =>
	POST(
		new Request('http://test.local/api/projects/proj_1/notes', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		}) as NextRequest,
		CTX,
	)

const getNotes = () =>
	GET(new Request('http://test.local/api/projects/proj_1/notes') as NextRequest, CTX)

const signInAs = (role: string | null, institutionId = 'inst_1') => {
	authMock.mockResolvedValue({ userId: 'user_1' } as never)
	userFindUnique.mockResolvedValue((role ? { role, institutionId } : null) as never)
}

const withProject = (overrides: Record<string, unknown> = {}) => {
	projectFindUnique.mockResolvedValue({
		id: 'proj_1',
		ownerId: 'owner_9',
		institutionId: 'inst_1',
		status: 'DRAFT',
		analysisStatus: 'COMPLETE',
		...overrides,
	} as never)
}

beforeEach(() => {
	vi.clearAllMocks()
	withProject()
	noteCreate.mockResolvedValue({ id: 'note_1', comment: 'Tighten the market slide.' } as never)
	noteFindMany.mockResolvedValue([] as never)
})

describe('POST /notes', () => {
	it('401 when signed out', async () => {
		authMock.mockResolvedValue({ userId: null } as never)
		const res = await postNote({ comment: 'hello' })
		expect(res.status).toBe(401)
	})

	it.each(['RESEARCHER', 'TTO_ANALYST', 'ADMIN'])('403 for %s', async (role) => {
		signInAs(role)
		const res = await postNote({ comment: 'hello' })
		expect(res.status).toBe(403)
		expect(noteCreate).not.toHaveBeenCalled()
	})

	it('403 for a reviewer from another institution', async () => {
		signInAs('TTO_LEAD', 'inst_OTHER')
		const res = await postNote({ comment: 'hello' })
		expect(res.status).toBe(403)
		expect(noteCreate).not.toHaveBeenCalled()
	})

	it('creates a note for a reviewer (defaults to the REVIEW stage)', async () => {
		signInAs('TTO_LEAD')
		const res = await postNote({ comment: 'Tighten the market slide.' })
		expect(res.status).toBe(201)
		expect(noteCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					projectId: 'proj_1',
					authorId: 'user_1',
					stageKey: 'REVIEW',
					comment: 'Tighten the market slide.',
				}),
			}),
		)
	})

	it('accepts an explicit stage key', async () => {
		signInAs('COMMITTEE_MEMBER')
		withProject({ status: 'IN_REVIEW' })
		const res = await postNote({ comment: 'TRL claim needs evidence.', stageKey: 'TRL_IRL' })
		expect(res.status).toBe(201)
		expect(noteCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ stageKey: 'TRL_IRL' }),
			}),
		)
	})

	it('400 on an empty comment', async () => {
		signInAs('TTO_LEAD')
		const res = await postNote({ comment: '   ' })
		expect(res.status).toBe(400)
		expect(noteCreate).not.toHaveBeenCalled()
	})

	it('404 only when the project truly does not exist', async () => {
		signInAs('TTO_LEAD')
		projectFindUnique.mockResolvedValue(null as never)
		const res = await postNote({ comment: 'hello' })
		expect(res.status).toBe(404)
	})
})

describe('GET /notes', () => {
	it('lets the project owner read notes (RESEARCHER, own project)', async () => {
		signInAs('RESEARCHER')
		withProject({ ownerId: 'user_1' })
		noteFindMany.mockResolvedValue([{ id: 'note_1' }] as never)
		const res = await getNotes()
		expect(res.status).toBe(200)
		const data = await res.json()
		expect(data.notes).toHaveLength(1)
	})

	it('403 (not 404) for an authenticated user with no access', async () => {
		signInAs('RESEARCHER')
		withProject({ ownerId: 'someone_else' })
		const res = await getNotes()
		expect(res.status).toBe(403)
		expect(noteFindMany).not.toHaveBeenCalled()
	})

	it('404 for a project that does not exist', async () => {
		signInAs('RESEARCHER')
		projectFindUnique.mockResolvedValue(null as never)
		const res = await getNotes()
		expect(res.status).toBe(404)
	})
})
