import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getUploadPresignedUrl, getPublicUrl } from '@/lib/r2'

const ALLOWED_TYPES = new Set([
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const MAX_SIZE_BYTES = 30 * 1024 * 1024 // 30 MB

const presignSchema = z.object({
	projectId: z.string().min(1),
	fileName: z.string().min(1).max(255),
	fileType: z.string().min(1),
	fileSize: z.number().int().positive(),
})

/**
 * POST /api/upload  (JSON: { projectId, fileName, fileType, fileSize })
 *
 * Returns a presigned PUT URL for a direct browser → R2 upload. The file
 * itself never passes through this server: Vercel rejects request bodies
 * over ~4.5 MB at the platform edge, so proxying the upload (the previous
 * design) silently broke for most real papers. Validation happens here;
 * the browser then PUTs the bytes straight to R2.
 *
 * Returns { uploadUrl, publicUrl, key }.
 */
export async function POST(request: NextRequest) {
	const { userId } = await auth()
	if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const body = await request.json().catch(() => null)
	const parsed = presignSchema.safeParse(body)
	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
	}
	const { projectId, fileName, fileType, fileSize } = parsed.data

	if (!ALLOWED_TYPES.has(fileType)) {
		return NextResponse.json({ error: 'Only PDF and Word documents are allowed' }, { status: 415 })
	}
	if (fileSize > MAX_SIZE_BYTES) {
		return NextResponse.json({ error: 'File exceeds 30 MB limit' }, { status: 413 })
	}

	// Only the project owner may attach a paper to it.
	const project = await prisma.project.findUnique({
		where: { id: projectId },
		select: { ownerId: true },
	})
	if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
	if (project.ownerId !== userId) {
		return NextResponse.json(
			{ error: 'Only the project owner can upload a paper' },
			{ status: 403 },
		)
	}

	const timestamp = Date.now()
	const sanitizedFilename = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
	const key = `papers/${userId}/${projectId}/${timestamp}-${sanitizedFilename}`

	const { url: uploadUrl } = await getUploadPresignedUrl(key, fileType)
	return NextResponse.json({ uploadUrl, publicUrl: getPublicUrl(key), key })
}
