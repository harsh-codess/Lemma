import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

type RouteContext = { params: { id: string } }

// ─── GET /api/projects/[id] ───────────────────────────────────────────────────

export async function GET(_request: NextRequest, { params }: RouteContext) {
	const { userId } = await auth()
	if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	// Build access check based on user role (multi-tenancy)
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { role: true, institutionId: true },
	})

	// Determine who can see this project
	let whereClause: Record<string, unknown> = { id: params.id, ownerId: userId }

	if (user) {
		switch (user.role) {
			case 'ADMIN':
				whereClause = { id: params.id }
				break
			case 'TTO_LEAD':
			case 'TTO_ANALYST':
				whereClause = user.institutionId
					? { id: params.id, institutionId: user.institutionId }
					: { id: params.id, ownerId: userId }
				break
			case 'COMMITTEE_MEMBER':
				whereClause = user.institutionId
					? { id: params.id, institutionId: user.institutionId, status: { in: ['IN_REVIEW', 'READY_FOR_EXPORT'] } }
					: { id: params.id, ownerId: userId }
				break
		}
	}

	const project = await prisma.project.findFirst({
		where: whereClause,
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
	})

	if (!project) {
		return NextResponse.json({ error: 'Project not found' }, { status: 404 })
	}

	return NextResponse.json(project)
}

// ─── PATCH /api/projects/[id] ─────────────────────────────────────────────────

const patchProjectSchema = z.object({
	title: z.string().min(1).optional(),
	domain: z.string().optional(),
	shortNote: z.string().optional(),
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

	// Verify ownership
	const existing = await prisma.project.findFirst({ where: { id: params.id, ownerId: userId } })
	if (!existing) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

	const body = await request.json()
	const parsed = patchProjectSchema.safeParse(body)
	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
	}

	const updated = await prisma.project.update({
		where: { id: params.id },
		data: parsed.data,
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

	const existing = await prisma.project.findFirst({ where: { id: params.id, ownerId: userId } })
	if (!existing) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

	await prisma.project.delete({ where: { id: params.id } })

	return NextResponse.json({ success: true })
}
