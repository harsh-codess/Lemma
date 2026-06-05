import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { inngest } from '@/lib/inngest'
import { analyzeRateLimiter, checkRateLimit } from '@/lib/rate-limit'
import { createRouteLogger } from '@/lib/logger'

const log = createRouteLogger('/api/projects/[id]/analyze')

type RouteContext = { params: { id: string } }

/**
 * POST /api/projects/[id]/analyze
 *
 * Triggers the Inngest background job to analyze the uploaded PDF.
 * Rate limited: 5 analyses per user per hour.
 * Returns immediately — the browser gets the result via Pusher.
 */
export async function POST(_request: NextRequest, { params }: RouteContext) {
	const { userId } = await auth()
	if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	// ── Rate limiting ────────────────────────────────────────────────────
	const rateLimit = await checkRateLimit(analyzeRateLimiter, userId)
	if (!rateLimit.allowed) {
		log.warn('Rate limit exceeded', { userId, remaining: rateLimit.remaining })
		return NextResponse.json(
			{
				error: 'Rate limit exceeded. You can analyze up to 5 papers per hour.',
				remaining: rateLimit.remaining,
				resetAt: rateLimit.resetAt.toISOString(),
			},
			{
				status: 429,
				headers: {
					'X-RateLimit-Remaining': String(rateLimit.remaining),
					'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
					'Retry-After': String(Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)),
				},
			}
		)
	}

	const project = await prisma.project.findUnique({
		where: { id: params.id },
		select: { id: true, ownerId: true, paperUrl: true, analysisStatus: true, title: true },
	})

	if (!project) {
		return NextResponse.json({ error: 'Project not found' }, { status: 404 })
	}
	// Triggering analysis is owner-only (it spends the owner's rate budget).
	if (project.ownerId !== userId) {
		return NextResponse.json(
			{ error: 'Only the project owner can start an analysis' },
			{ status: 403 },
		)
	}

	if (!project.paperUrl) {
		return NextResponse.json({ error: 'No paper uploaded yet' }, { status: 400 })
	}

	if (project.analysisStatus === 'PROCESSING') {
		return NextResponse.json({ error: 'Analysis already in progress' }, { status: 409 })
	}

	log.info('Triggering analysis pipeline', {
		projectId: project.id,
		userId,
		remaining: rateLimit.remaining,
	})

	// Mark as processing immediately so the workspace reflects the action
	// even before the background runner picks up the event.
	await prisma.project.update({
		where: { id: project.id },
		data: {
			analysisStatus: 'PROCESSING',
			analysisError: null,
		},
	})

	try {
		// Fire the Inngest event — returns in milliseconds, job runs in background
		await inngest.send({
			name: 'paper/uploaded',
			data: {
				projectId: project.id,
				paperUrl: project.paperUrl,
				userId,
			},
		})
	} catch (error) {
		log.error('Failed to queue analysis pipeline', {
			projectId: project.id,
			userId,
			error: error instanceof Error ? error.message : 'Unknown error',
		})

		await prisma.project.update({
			where: { id: project.id },
			data: {
				analysisStatus: 'FAILED',
				analysisError:
					error instanceof Error
						? `Could not queue analysis: ${error.message}`
						: 'Could not queue analysis.',
			},
		})

		return NextResponse.json(
			{
				error:
					error instanceof Error
						? `Could not queue analysis: ${error.message}`
						: 'Could not queue analysis.',
			},
			{ status: 500 }
		)
	}

	return NextResponse.json({
		success: true,
		message: 'Analysis pipeline queued',
		remaining: rateLimit.remaining,
	})
}
