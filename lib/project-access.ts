import type { ProjectStatus, UserRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/**
 * Role-scoped project visibility — one set of rules for every
 * /api/projects/[id]/* route:
 *
 *   owner                  → always
 *   ADMIN                  → all projects
 *   TTO_LEAD / TTO_ANALYST → their institution's projects
 *   COMMITTEE_MEMBER       → institution projects in IN_REVIEW / READY_FOR_EXPORT
 *
 * Routes distinguish a missing project (404) from an existing project the
 * caller may not touch (403) — authorization failures are a clean 403, they
 * do not masquerade as not-found.
 */

export type AccessUser = { role: UserRole; institutionId: string | null } | null

export type AccessProject = {
	ownerId: string
	institutionId: string
	status: ProjectStatus
}

/** Pure visibility predicate — unit-testable without the DB. */
export function canViewProject(
	userId: string,
	user: AccessUser,
	project: AccessProject,
): boolean {
	if (project.ownerId === userId) return true
	if (!user) return false

	switch (user.role) {
		case 'ADMIN':
			return true
		case 'TTO_LEAD':
		case 'TTO_ANALYST':
			return user.institutionId != null && project.institutionId === user.institutionId
		case 'COMMITTEE_MEMBER':
			return (
				user.institutionId != null &&
				project.institutionId === user.institutionId &&
				(project.status === 'IN_REVIEW' || project.status === 'READY_FOR_EXPORT')
			)
		default:
			return false
	}
}

export type ProjectAccess =
	| { outcome: 'not_found' }
	| { outcome: 'forbidden' }
	| {
			outcome: 'ok'
			user: NonNullable<AccessUser> | null
			project: AccessProject & {
				id: string
				status: ProjectStatus
				analysisStatus: 'IDLE' | 'PROCESSING' | 'COMPLETE' | 'FAILED'
			}
	  }

/**
 * Load the caller's role and the project, and resolve visibility.
 * Returns `not_found` only when the project genuinely does not exist.
 */
export async function getProjectAccess(
	projectId: string,
	userId: string,
): Promise<ProjectAccess> {
	const [user, project] = await Promise.all([
		prisma.user.findUnique({
			where: { id: userId },
			select: { role: true, institutionId: true },
		}),
		prisma.project.findUnique({
			where: { id: projectId },
			select: {
				id: true,
				ownerId: true,
				institutionId: true,
				status: true,
				analysisStatus: true,
			},
		}),
	])

	if (!project) return { outcome: 'not_found' }
	if (!canViewProject(userId, user, project)) return { outcome: 'forbidden' }
	return { outcome: 'ok', user, project }
}
