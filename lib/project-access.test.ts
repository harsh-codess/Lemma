import { describe, it, expect } from 'vitest'
import { canViewProject, type AccessProject } from './project-access'

/**
 * ─── Project Access Tests ────────────────────────────────────────────────────
 *
 * Lock the visibility matrix used by every /api/projects/[id]/* route:
 * owner always; ADMIN everything; TTO roles institution-wide; committee
 * members institution-wide but only once a project is in review.
 */

// Mock prisma so importing the module (which pulls in @/lib/prisma for the
// async helper) never touches a real client. canViewProject itself is pure.
import { vi } from 'vitest'
vi.mock('@/lib/prisma', () => ({ prisma: {} }))

const project = (overrides: Partial<AccessProject> = {}): AccessProject => ({
	ownerId: 'owner_1',
	institutionId: 'inst_1',
	status: 'DRAFT',
	...overrides,
})

describe('canViewProject', () => {
	it('the owner always sees their project, regardless of role record', () => {
		expect(canViewProject('owner_1', null, project())).toBe(true)
		expect(
			canViewProject('owner_1', { role: 'RESEARCHER', institutionId: null }, project()),
		).toBe(true)
	})

	it('a stranger with no user record sees nothing', () => {
		expect(canViewProject('user_x', null, project())).toBe(false)
	})

	it('a researcher cannot see another user’s project', () => {
		expect(
			canViewProject('user_x', { role: 'RESEARCHER', institutionId: 'inst_1' }, project()),
		).toBe(false)
	})

	it('ADMIN sees everything', () => {
		expect(canViewProject('user_x', { role: 'ADMIN', institutionId: null }, project())).toBe(
			true,
		)
	})

	it.each(['TTO_LEAD', 'TTO_ANALYST'] as const)(
		'%s sees institution projects but not other institutions',
		(role) => {
			expect(canViewProject('user_x', { role, institutionId: 'inst_1' }, project())).toBe(true)
			expect(canViewProject('user_x', { role, institutionId: 'inst_2' }, project())).toBe(false)
			expect(canViewProject('user_x', { role, institutionId: null }, project())).toBe(false)
		},
	)

	it('COMMITTEE_MEMBER sees institution projects only once they are in review', () => {
		const member = { role: 'COMMITTEE_MEMBER', institutionId: 'inst_1' } as const
		expect(canViewProject('user_x', member, project({ status: 'DRAFT' }))).toBe(false)
		expect(canViewProject('user_x', member, project({ status: 'IN_REVIEW' }))).toBe(true)
		expect(canViewProject('user_x', member, project({ status: 'READY_FOR_EXPORT' }))).toBe(true)
		// other institution, even in review
		expect(
			canViewProject(
				'user_x',
				{ role: 'COMMITTEE_MEMBER', institutionId: 'inst_2' },
				project({ status: 'IN_REVIEW' }),
			),
		).toBe(false)
	})
})
