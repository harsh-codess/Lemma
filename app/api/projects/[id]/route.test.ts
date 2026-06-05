import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'

/**
 * ─── /api/projects/[id] ──────────────────────────────────────────────────────
 *
 * The core object route: unauthenticated → 401, authenticated-but-not-owner
 * (and not a permitted role) → clean 403, owner → 200. Mutations (PATCH /
 * DELETE) are owner-only even for users who can view the project.
 */

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
	prisma: {
		user: { findUnique: vi.fn() },
		project: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
		institution: { upsert: vi.fn() },
	},
}))

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { GET, PATCH, DELETE } from './route'

const authMock = vi.mocked(auth)
const userFindUnique = vi.mocked(prisma.user.findUnique)
const projectFindUnique = vi.mocked(prisma.project.findUnique)
const projectUpdate = vi.mocked(prisma.project.update)
const projectDelete = vi.mocked(prisma.project.delete)

const CTX = { params: { id: 'proj_1' } }

const getProject = () =>
	GET(new Request('http://test.local/api/projects/proj_1') as NextRequest, CTX)

const patchProject = (body: unknown) =>
	PATCH(
		new Request('http://test.local/api/projects/proj_1', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		}) as NextRequest,
		CTX,
	)

const deleteProject = () =>
	DELETE(
		new Request('http://test.local/api/projects/proj_1', { method: 'DELETE' }) as NextRequest,
		CTX,
	)

const signInAs = (role: string | null, institutionId = 'inst_1') => {
	authMock.mockResolvedValue({ userId: 'user_1' } as never)
	userFindUnique.mockResolvedValue((role ? { role, institutionId } : null) as never)
}

const withProject = (overrides: Record<string, unknown> = {}) => {
	projectFindUnique.mockResolvedValue({
		id: 'proj_1',
		ownerId: 'user_1',
		institutionId: 'inst_1',
		status: 'DRAFT',
		analysisStatus: 'COMPLETE',
		reviewNotes: [],
		stages: [],
		...overrides,
	} as never)
}

beforeEach(() => {
	vi.clearAllMocks()
	projectUpdate.mockResolvedValue({ id: 'proj_1' } as never)
	projectDelete.mockResolvedValue({ id: 'proj_1' } as never)
})

describe('GET /api/projects/[id]', () => {
	it('401 when signed out', async () => {
		authMock.mockResolvedValue({ userId: null } as never)
		const res = await getProject()
		expect(res.status).toBe(401)
		expect(projectFindUnique).not.toHaveBeenCalled()
	})

	it('200 for the owner, with viewerRole attached', async () => {
		signInAs('RESEARCHER')
		withProject({ ownerId: 'user_1' })
		const res = await getProject()
		expect(res.status).toBe(200)
		const data = await res.json()
		expect(data.id).toBe('proj_1')
		expect(data.viewerRole).toBe('RESEARCHER')
	})

	it('403 (not 404) for an authenticated non-owner with no qualifying role', async () => {
		signInAs('RESEARCHER')
		withProject({ ownerId: 'someone_else' })
		const res = await getProject()
		expect(res.status).toBe(403)
	})

	it('200 for a TTO lead in the same institution', async () => {
		signInAs('TTO_LEAD')
		withProject({ ownerId: 'someone_else', institutionId: 'inst_1' })
		const res = await getProject()
		expect(res.status).toBe(200)
	})

	it('404 only when the project does not exist', async () => {
		signInAs('RESEARCHER')
		projectFindUnique.mockResolvedValue(null as never)
		const res = await getProject()
		expect(res.status).toBe(404)
	})
})

describe('PATCH /api/projects/[id]', () => {
	it('401 when signed out', async () => {
		authMock.mockResolvedValue({ userId: null } as never)
		const res = await patchProject({ title: 'New title' })
		expect(res.status).toBe(401)
	})

	it('200 for the owner', async () => {
		signInAs('RESEARCHER')
		withProject({ ownerId: 'user_1' })
		const res = await patchProject({ title: 'New title' })
		expect(res.status).toBe(200)
		expect(projectUpdate).toHaveBeenCalled()
	})

	it('403 for a TTO lead who can view but does not own the project', async () => {
		signInAs('TTO_LEAD')
		withProject({ ownerId: 'someone_else' })
		const res = await patchProject({ title: 'Hijacked' })
		expect(res.status).toBe(403)
		expect(projectUpdate).not.toHaveBeenCalled()
	})

	it('403 for an unrelated researcher (ID edited in the URL)', async () => {
		signInAs('RESEARCHER')
		withProject({ ownerId: 'someone_else' })
		const res = await patchProject({ title: 'Hijacked' })
		expect(res.status).toBe(403)
		expect(projectUpdate).not.toHaveBeenCalled()
	})

	it('404 when the project does not exist', async () => {
		signInAs('RESEARCHER')
		projectFindUnique.mockResolvedValue(null as never)
		const res = await patchProject({ title: 'New title' })
		expect(res.status).toBe(404)
	})
})

describe('DELETE /api/projects/[id]', () => {
	it('200 for the owner', async () => {
		signInAs('RESEARCHER')
		withProject({ ownerId: 'user_1' })
		const res = await deleteProject()
		expect(res.status).toBe(200)
		expect(projectDelete).toHaveBeenCalled()
	})

	it('403 for an authenticated non-owner', async () => {
		signInAs('TTO_LEAD')
		withProject({ ownerId: 'someone_else' })
		const res = await deleteProject()
		expect(res.status).toBe(403)
		expect(projectDelete).not.toHaveBeenCalled()
	})
})
