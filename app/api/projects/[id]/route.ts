import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { canViewProject, getProjectAccess } from '@/lib/project-access'
import { z } from 'zod'

type RouteContext = { params: { id: string } }

// ─── GET /api/projects/[id] ───────────────────────────────────────────────────

export async function GET(_request: NextRequest, { params }: RouteContext) {
	const { userId } = await auth()
	if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	// One project fetch with all relations; visibility is decided in code so a
	// real 404 (no such project) is distinct from a 403 (not yours to see).
	const [user, project] = await Promise.all([
		prisma.user.findUnique({
			where: { id: userId },
			select: { role: true, institutionId: true },
		}),
		prisma.project.findUnique({
			where: { id: params.id },
			include: {
				owner: { select: { name: true, email: true } },
				institution: true,
				stages: { orderBy: { key: 'asc' } },
				paper: true,
				trlIrl: true,
				market: true,
				feasibility: true,
				deck: true,
				review: true,
				evidence: true,
				competitors: true,
				marketSignals: true,
				deckSlides: { orderBy: { order: 'asc' } },
				reviewNotes: {
					include: { author: { select: { name: true, email: true, role: true } } },
					orderBy: { createdAt: 'desc' },
				},
				copilotPrompts: { orderBy: { order: 'asc' } },
			},
		}),
	])

	if (!project) {
		return NextResponse.json({ error: 'Project not found' }, { status: 404 })
	}
	if (!canViewProject(userId, user, project)) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
	}

	// The viewer's role rides along so the workspace can gate reviewer-only
	// controls (approve / request changes / notes) without an extra fetch.
	return NextResponse.json({ ...project, viewerRole: user?.role ?? 'RESEARCHER' })
}

// ─── PATCH /api/projects/[id] ─────────────────────────────────────────────────

const patchProjectSchema = z.object({
	title: z.string().min(1).optional(),
	domain: z.string().optional(),
	shortNote: z.string().optional(),
	institution: z.string().optional(),
	status: z.enum(['DRAFT', 'IN_REVIEW', 'READY_FOR_EXPORT']).optional(),
	currentStage: z.enum(['PAPER', 'TRL_IRL', 'MARKET', 'FEASIBILITY', 'DECK', 'REVIEW']).optional(),
	readinessScore: z.number().int().min(0).max(100).optional(),
	paperUrl: z.string().url().optional(),
	paperFileName: z.string().optional(),
	analysisStatus: z.enum(['IDLE', 'PROCESSING', 'COMPLETE', 'FAILED']).optional(),
})

export async function PATCH(request: NextRequest, { params }: RouteContext) {
	const { userId } = await auth()
	if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	// Mutations are owner-only — a reviewer who can SEE the project still may
	// not edit it.
	const access = await getProjectAccess(params.id, userId)
	if (access.outcome === 'not_found') {
		return NextResponse.json({ error: 'Project not found' }, { status: 404 })
	}
	if (access.outcome === 'forbidden' || access.project.ownerId !== userId) {
		return NextResponse.json(
			{ error: 'Only the project owner can update this project' },
			{ status: 403 },
		)
	}

	const body = await request.json()
	const parsed = patchProjectSchema.safeParse(body)
	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
	}

	const { institution: institutionName, ...projectData } = parsed.data

	let institutionId: string | undefined
	if (institutionName) {
		const institutionRecord = await prisma.institution.upsert({
			where: { name: institutionName },
			update: {},
			create: { name: institutionName },
		})
		institutionId = institutionRecord.id
	}

	const updated = await prisma.project.update({
		where: { id: params.id },
		data: {
			...projectData,
			...(institutionId ? { institutionId } : {}),
		},
		include: {
			stages: true,
			institution: true,
		},
	})

	return NextResponse.json(updated)
}

// ─── DELETE /api/projects/[id] ────────────────────────────────────────────────

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
	const { userId } = await auth()
	if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const access = await getProjectAccess(params.id, userId)
	if (access.outcome === 'not_found') {
		return NextResponse.json({ error: 'Project not found' }, { status: 404 })
	}
	if (access.outcome === 'forbidden' || access.project.ownerId !== userId) {
		return NextResponse.json(
			{ error: 'Only the project owner can delete this project' },
			{ status: 403 },
		)
	}

	await prisma.project.delete({ where: { id: params.id } })

	return NextResponse.json({ success: true })
}
