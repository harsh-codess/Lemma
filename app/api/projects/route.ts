import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createRouteLogger } from '@/lib/logger'

const log = createRouteLogger('/api/projects')

// ─── GET /api/projects ────────────────────────────────────────────────────────
//
// Multi-tenancy: scopes results based on user role.
//   - RESEARCHER:        sees only their own projects
//   - TTO_ANALYST/LEAD:  sees all projects in their institution
//   - COMMITTEE_MEMBER:  sees all IN_REVIEW + READY_FOR_EXPORT in their institution
//   - ADMIN:             sees everything

export async function GET(request: NextRequest) {
	const { userId } = await auth()
	if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const { searchParams } = new URL(request.url)
	const status = searchParams.get('status')
	const domain = searchParams.get('domain')

	// Get user with their role and institution
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { role: true, institutionId: true, email: true },
	})

	// If user has stale placeholder email, backfill from Clerk
	if (user?.email.includes('@clerk.placeholder')) {
		const clerkUser = await currentUser()
		if (clerkUser) {
			const realEmail = clerkUser.emailAddresses?.[0]?.emailAddress ?? user.email
			const realName = clerkUser.firstName
				? `${clerkUser.firstName}${clerkUser.lastName ? ` ${clerkUser.lastName}` : ''}`
				: null
			await prisma.user.update({
				where: { id: userId },
				data: { email: realEmail, ...(realName ? { name: realName } : {}) },
			})
		}
	}

	// Build the where clause based on role
	const whereClause = buildWhereClause(userId, user, status, domain)

	const projects = await prisma.project.findMany({
		where: whereClause,
		include: {
			owner: { select: { name: true, email: true } },
			institution: { select: { name: true } },
			stages: { orderBy: { key: 'asc' } },
		},
		orderBy: { updatedAt: 'desc' },
	})

	log.info('Projects listed', {
		userId,
		role: user?.role,
		count: projects.length,
	})

	return NextResponse.json(projects)
}

function buildWhereClause(
	userId: string,
	user: { role: string; institutionId: string | null } | null,
	status: string | null,
	domain: string | null,
) {
	const statusFilter = status
		? { status: status as 'DRAFT' | 'IN_REVIEW' | 'READY_FOR_EXPORT' }
		: {}
	const domainFilter = domain
		? { domain: { contains: domain, mode: 'insensitive' as const } }
		: {}

	// No user record yet — they can only see their own projects
	if (!user) {
		return { ownerId: userId, ...statusFilter, ...domainFilter }
	}

	switch (user.role) {
		case 'ADMIN':
			// Sees everything
			return { ...statusFilter, ...domainFilter }

		case 'TTO_LEAD':
		case 'TTO_ANALYST':
			// Sees all projects in their institution
			return {
				...(user.institutionId ? { institutionId: user.institutionId } : { ownerId: userId }),
				...statusFilter,
				...domainFilter,
			}

		case 'COMMITTEE_MEMBER':
			// Sees only IN_REVIEW and READY_FOR_EXPORT in their institution
			return {
				...(user.institutionId ? { institutionId: user.institutionId } : { ownerId: userId }),
				status: { in: ['IN_REVIEW' as const, 'READY_FOR_EXPORT' as const] },
				...domainFilter,
			}

		case 'RESEARCHER':
		default:
			// Sees only their own projects
			return { ownerId: userId, ...statusFilter, ...domainFilter }
	}
}

// ─── POST /api/projects ───────────────────────────────────────────────────────

const createProjectSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	institution: z.string().min(1, 'Institution is required'),
	lab: z.string().min(1, 'Lab is required'),
	domain: z.string().min(1, 'Domain is required'),
	shortNote: z.string().optional(),
	paperUrl: z.string().url().optional(),
	paperFileName: z.string().optional(),
})

export async function POST(request: NextRequest) {
	const { userId } = await auth()
	if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const body = await request.json()
	const parsed = createProjectSchema.safeParse(body)
	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
	}

	const { title, institution, lab, domain, shortNote, paperUrl, paperFileName } = parsed.data

	// Fetch real user data from Clerk
	const clerkUser = await currentUser()
	const realEmail = clerkUser?.emailAddresses?.[0]?.emailAddress ?? `${userId}@unknown`
	const realName = clerkUser?.firstName
		? `${clerkUser.firstName}${clerkUser.lastName ? ` ${clerkUser.lastName}` : ''}`
		: null

	// Ensure user exists in DB with real Clerk data
	const user = await prisma.user.upsert({
		where: { id: userId },
		update: { email: realEmail, ...(realName ? { name: realName } : {}) },
		create: {
			id: userId,
			email: realEmail,
			name: realName,
			role: 'RESEARCHER',
		},
	})

	// Ensure institution exists
	const institutionRecord = await prisma.institution.upsert({
		where: { name: institution },
		update: {},
		create: { name: institution },
	})

	// Link user to institution if not already linked
	if (!user.institutionId) {
		await prisma.user.update({
			where: { id: userId },
			data: { institutionId: institutionRecord.id },
		})
	}

	const stageOrder = [
		{ key: 'PAPER' as const, label: 'Paper', description: 'Understand the research and its core claim.' },
		{ key: 'TRL_IRL' as const, label: 'TRL / IRL', description: 'Score maturity, readiness, and risk.' },
		{ key: 'MARKET' as const, label: 'Market', description: 'Map demand, competitors, patents, and signals.' },
		{ key: 'FEASIBILITY' as const, label: 'Feasibility', description: 'Estimate team, timeline, capital, and grant fit.' },
		{ key: 'DECK' as const, label: 'Deck', description: 'Frame the venture narrative and funding ask.' },
		{ key: 'REVIEW' as const, label: 'Review', description: 'Prepare for committee approval and export readiness.' },
	]

	const project = await prisma.project.create({
		data: {
			title,
			domain,
			shortNote,
			paperUrl,
			paperFileName,
			ownerId: user.id,
			institutionId: institutionRecord.id,
			currentStage: 'PAPER',
			status: 'DRAFT',
			analysisStatus: 'IDLE',
			stages: {
				create: stageOrder.map((stage, index) => ({
					key: stage.key,
					label: stage.label,
					description: stage.description,
					status: index === 0 ? ('CURRENT' as const) : ('UPCOMING' as const),
				})),
			},
		},
		include: {
			stages: true,
			institution: true,
			owner: { select: { name: true, email: true } },
		},
	})

	log.info('Project created', {
		projectId: project.id,
		userId,
		domain: project.domain,
	})

	return NextResponse.json(project, { status: 201 })
}
