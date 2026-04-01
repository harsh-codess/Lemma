import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUploadPresignedUrl } from '@/lib/r2'
import { z } from 'zod'

const schema = z.object({
	projectId: z.string(),
	filename: z.string(),
	contentType: z.enum(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
})

/**
 * GET /api/upload?projectId=xxx&filename=paper.pdf&contentType=application/pdf
 *
 * Returns a presigned R2 URL valid for 15 minutes.
 * The browser uploads the file DIRECTLY to R2 — it never passes through our server.
 *
 * Flow:
 *   1. Browser → GET /api/upload → { url, key, publicUrl }
 *   2. Browser → PUT <presigned url> (direct to R2, with file body)
 *   3. Browser → PATCH /api/projects/[id] { paperUrl: publicUrl }
 *   4. Browser → POST /api/projects/[id]/analyze (triggers Inngest)
 */
export async function GET(request: NextRequest) {
	const { userId } = await auth()
	if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const { searchParams } = new URL(request.url)
	const parsed = schema.safeParse({
		projectId: searchParams.get('projectId'),
		filename: searchParams.get('filename'),
		contentType: searchParams.get('contentType'),
	})

	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
	}

	const { projectId, filename, contentType } = parsed.data

	// Store as: papers/{userId}/{projectId}/{timestamp}-{filename}
	const timestamp = Date.now()
	const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
	const key = `papers/${userId}/${projectId}/${timestamp}-${sanitizedFilename}`

	const { url } = await getUploadPresignedUrl(key, contentType)
	const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`

	return NextResponse.json({ url, key, publicUrl })
}
