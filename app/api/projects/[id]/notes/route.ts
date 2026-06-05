import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getProjectAccess } from '@/lib/project-access'
import { isReviewerRole } from '@/lib/review-flow'

/**
 * Review notes on a project.
 *
 *   GET  /api/projects/[id]/notes  → list notes (anyone who can see the project,
 *                                    including the owner)
 *   POST /api/projects/[id]/notes  → create a note (reviewers only:
 *                                    TTO_LEAD / COMMITTEE_MEMBER → 403 otherwise)
 */

type RouteContext = { params: { id: string } }

const STAGE_KEYS = ['PAPER', 'TRL_IRL', 'MARKET', 'FEASIBILITY', 'DECK', 'REVIEW'] as const

const createNoteSchema = z.object({
	comment: z.string().trim().min(1, 'Comment is required').max(4000),
	stageKey: z.enum(STAGE_KEYS).default('REVIEW'),
})

const noteInclude = {
	author: { select: { name: true, email: true, role: true } },
} as const

export async function GET(_request: NextRequest, { params }: RouteContext) {
	const { userId } = await auth()
	if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const access = await getProjectAccess(params.id, userId)
	if (access.outcome === 'not_found') {
		return NextResponse.json({ error: 'Project not found' }, { status: 404 })
	}
	if (access.outcome === 'forbidden') {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	const notes = await prisma.reviewNote.findMany({
		where: { projectId: access.project.id },
		include: noteInclude,
		orderBy: { createdAt: 'desc' },
	})
	return NextResponse.json({ notes })
}

export async function POST(request: NextRequest, { params }: RouteContext) {
	const { userId } = await auth()
	if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { role: true, institutionId: true },
	})
	if (!user || !isReviewerRole(user.role)) {
		return NextResponse.json(
			{ error: 'Only TTO leads and committee members can write review notes' },
			{ status: 403 },
		)
	}

	const body = await request.json().catch(() => null)
	const parsed = createNoteSchema.safeParse(body)
	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
	}

	const access = await getProjectAccess(params.id, userId)
	if (access.outcome === 'not_found') {
		return NextResponse.json({ error: 'Project not found' }, { status: 404 })
	}
	if (access.outcome === 'forbidden') {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	const note = await prisma.reviewNote.create({
		data: {
			projectId: access.project.id,
			authorId: userId,
			stageKey: parsed.data.stageKey,
			comment: parsed.data.comment,
		},
		include: noteInclude,
	})
	return NextResponse.json({ note }, { status: 201 })
}
