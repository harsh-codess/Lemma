import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getProjectAccess } from '@/lib/project-access'
import { isReviewerRole, resolveReviewTransition, REVIEW_ACTIONS } from '@/lib/review-flow'

/**
 * Human review decision endpoint — completes the handoff the pipeline leaves
 * at the REVIEW stage.
 *
 *   POST /api/projects/[id]/review  { action: 'approve' | 'request_changes', comment? }
 *
 * Reviewer-only (TTO_LEAD / COMMITTEE_MEMBER → 403 otherwise). Visibility
 * follows the same role scoping as the project GET, so a committee member can
 * only act on IN_REVIEW / READY_FOR_EXPORT projects — the initial
 * DRAFT → IN_REVIEW approval is a TTO lead's call. Illegal transitions
 * (approving an already-exported project, sending back a draft) return 409.
 */

type RouteContext = { params: { id: string } }

const reviewActionSchema = z.object({
	action: z.enum(REVIEW_ACTIONS),
	comment: z.string().trim().max(4000).optional(),
})

export async function POST(request: NextRequest, { params }: RouteContext) {
	const { userId } = await auth()
	if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { role: true, institutionId: true },
	})
	if (!user || !isReviewerRole(user.role)) {
		return NextResponse.json(
			{ error: 'Only TTO leads and committee members can review projects' },
			{ status: 403 },
		)
	}

	const body = await request.json().catch(() => null)
	const parsed = reviewActionSchema.safeParse(body)
	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
	}
	const { action, comment } = parsed.data

	const access = await getProjectAccess(params.id, userId)
	if (access.outcome === 'not_found') {
		return NextResponse.json({ error: 'Project not found' }, { status: 404 })
	}
	if (access.outcome === 'forbidden') {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}
	const { project } = access

	const transition = resolveReviewTransition(action, project)
	if (!transition.ok) {
		return NextResponse.json({ error: transition.error }, { status: 409 })
	}

	const [updated] = await prisma.$transaction([
		prisma.project.update({
			where: { id: project.id },
			data: { status: transition.nextStatus },
			select: { id: true, status: true, currentStage: true },
		}),
		...(transition.reviewStageStatus
			? [
					prisma.projectStage.updateMany({
						where: { projectId: project.id, key: 'REVIEW' as const },
						data: { status: transition.reviewStageStatus },
					}),
				]
			: []),
		...(comment
			? [
					prisma.reviewNote.create({
						data: {
							projectId: project.id,
							authorId: userId,
							stageKey: 'REVIEW',
							// A request-changes comment needs action; an approval comment doesn't.
							status: action === 'approve' ? 'RESOLVED' : 'OPEN',
							comment,
						},
					}),
				]
			: []),
	])

	return NextResponse.json({ action, project: updated })
}
