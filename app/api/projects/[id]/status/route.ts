import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

type RouteContext = { params: { id: string } }

// ─── GET /api/projects/[id]/status ───────────────────────────────────────────
// Lightweight endpoint used for polling during analysis.
// Returns only the fields needed to track progress — avoids 17+ queries.

export async function GET(_request: NextRequest, { params }: RouteContext) {
	const { userId } = await auth()
	if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const project = await prisma.project.findFirst({
		where: { id: params.id, ownerId: userId },
		select: {
			analysisStatus: true,
			analysisError: true,
			currentStage: true,
			readinessScore: true,
			stages: {
				select: { id: true, projectId: true, key: true, label: true, description: true, status: true },
				orderBy: { key: 'asc' },
			},
		},
	})

	if (!project) {
		return NextResponse.json({ error: 'Project not found' }, { status: 404 })
	}

	return NextResponse.json(project)
}
