import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { canViewProject } from '@/lib/project-access'

type RouteContext = { params: { id: string } }

// ─── GET /api/projects/[id]/status ───────────────────────────────────────────
// Lightweight endpoint used for polling during analysis.
// Returns only the fields needed to track progress — avoids 17+ queries.
// Visibility matches the project GET (owner / institution roles / admin);
// the access fields ride along on the same query to keep this to two
// parallel round-trips.

export async function GET(_request: NextRequest, { params }: RouteContext) {
	const { userId } = await auth()
	if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const [user, project] = await Promise.all([
		prisma.user.findUnique({
			where: { id: userId },
			select: { role: true, institutionId: true },
		}),
		prisma.project.findUnique({
			where: { id: params.id },
			select: {
				ownerId: true,
				institutionId: true,
				status: true,
				analysisStatus: true,
				analysisError: true,
				currentStage: true,
				readinessScore: true,
				stages: {
					select: { id: true, projectId: true, key: true, label: true, description: true, status: true },
					orderBy: { key: 'asc' },
				},
			},
		}),
	])

	if (!project) {
		return NextResponse.json({ error: 'Project not found' }, { status: 404 })
	}
	if (!canViewProject(userId, user, project)) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	const { ownerId: _ownerId, institutionId: _institutionId, status: _status, ...statusFields } = project
	return NextResponse.json(statusFields)
}
