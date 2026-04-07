import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { r2, BUCKET_NAME } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'

const ALLOWED_TYPES = new Set([
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const MAX_SIZE_BYTES = 30 * 1024 * 1024 // 30 MB

/**
 * POST /api/upload  (multipart/form-data: file, projectId)
 *
 * Uploads the file server-side to R2 — avoids cross-origin CORS issues entirely.
 * Returns { publicUrl, key }.
 */
export async function POST(request: NextRequest) {
	const { userId } = await auth()
	if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const formData = await request.formData()
	const file = formData.get('file')
	const projectId = formData.get('projectId')

	if (!file || typeof file === 'string') {
		return NextResponse.json({ error: 'No file provided' }, { status: 400 })
	}
	if (!projectId || typeof projectId !== 'string') {
		return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
	}
	if (!ALLOWED_TYPES.has(file.type)) {
		return NextResponse.json({ error: 'Only PDF and Word documents are allowed' }, { status: 415 })
	}
	if (file.size > MAX_SIZE_BYTES) {
		return NextResponse.json({ error: 'File exceeds 30 MB limit' }, { status: 413 })
	}

	const timestamp = Date.now()
	const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
	const key = `papers/${userId}/${projectId}/${timestamp}-${sanitizedFilename}`

	const buffer = Buffer.from(await file.arrayBuffer())

	await r2.send(
		new PutObjectCommand({
			Bucket: BUCKET_NAME,
			Key: key,
			Body: buffer,
			ContentType: file.type,
		}),
	)

	const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`
	return NextResponse.json({ publicUrl, key })
}
