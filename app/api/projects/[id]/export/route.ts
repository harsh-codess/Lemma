import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { generateAndStoreExports } from '@/lib/deck-render/store-exports'
import { EXPORT_FORMATS, isExportFormat, type ExportFormat } from '@/lib/deck-render'

/**
 * Deck export endpoint. On-demand (renders are heavy and optional) — call it
 * once a project has reached the deck/REVIEW stage. The deck JSON is the single
 * source of truth; PDF/PPTX/DOCX are deterministic renders of it.
 *
 *   POST /api/projects/[id]/export            → render + store all three formats
 *   POST /api/projects/[id]/export?format=pdf → render + store one format
 *   GET  /api/projects/[id]/export            → list stored exports
 */

type RouteContext = { params: { id: string } }

// PDFs need the Node runtime (Chromium), not the edge runtime.
export const runtime = 'nodejs'
export const maxDuration = 120

/** Confirm the signed-in user may see this project (mirrors the GET route's rules). */
async function assertVisible(projectId: string, userId: string) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { role: true, institutionId: true },
	})

	let where: Record<string, unknown> = { id: projectId, ownerId: userId }
	if (user) {
		switch (user.role) {
			case 'ADMIN':
				where = { id: projectId }
				break
			case 'TTO_LEAD':
			case 'TTO_ANALYST':
				where = user.institutionId ? { id: projectId, institutionId: user.institutionId } : where
				break
			case 'COMMITTEE_MEMBER':
				where = user.institutionId
					? { id: projectId, institutionId: user.institutionId, status: { in: ['IN_REVIEW', 'READY_FOR_EXPORT'] } }
					: where
				break
		}
	}

	return prisma.project.findFirst({
		where,
		select: { id: true, deck: { select: { id: true } } },
	})
}

export async function POST(request: NextRequest, { params }: RouteContext) {
	const { userId } = await auth()
	if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const project = await assertVisible(params.id, userId)
	if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
	if (!project.deck) {
		return NextResponse.json(
			{ error: 'No deck to export — the project has not produced a pitch deck yet.' },
			{ status: 409 },
		)
	}

	const formatParam = request.nextUrl.searchParams.get('format')
	let formats: ExportFormat[] = EXPORT_FORMATS
	if (formatParam && formatParam !== 'all') {
		if (!isExportFormat(formatParam)) {
			return NextResponse.json({ error: `Unknown format "${formatParam}"` }, { status: 400 })
		}
		formats = [formatParam]
	}

	try {
		const exports = await generateAndStoreExports(params.id, formats)
		return NextResponse.json({ exports })
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Export failed' },
			{ status: 500 },
		)
	}
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
	const { userId } = await auth()
	if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const project = await assertVisible(params.id, userId)
	if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

	const exports = await prisma.deckExport.findMany({
		where: { projectId: params.id },
		select: { format: true, url: true, fileName: true, byteSize: true, createdAt: true },
		orderBy: { format: 'asc' },
	})
	return NextResponse.json({ exports })
}
