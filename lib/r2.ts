import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/**
 * Server-side upload of an in-memory buffer (e.g. a rendered deck export).
 * Returns the storage key; pair with getPublicUrl()/getDownloadPresignedUrl().
 */
export async function uploadBuffer(key: string, body: Buffer, contentType: string) {
	await r2.send(
		new PutObjectCommand({
			Bucket: BUCKET_NAME,
			Key: key,
			Body: body,
			ContentType: contentType,
		}),
	)
	return key
}

export const r2 = new S3Client({
	region: 'auto',
	endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID!,
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
	},
})

export const BUCKET_NAME = process.env.R2_BUCKET_NAME ?? 'lemma-papers'

/**
 * Generate a presigned URL for direct browser → R2 upload.
 * The file never passes through the Next.js server.
 */
export async function getUploadPresignedUrl(key: string, contentType: string) {
	const command = new PutObjectCommand({
		Bucket: BUCKET_NAME,
		Key: key,
		ContentType: contentType,
	})
	// URL valid for 15 minutes
	const url = await getSignedUrl(r2, command, { expiresIn: 900 })
	return { url, key }
}

/**
 * Generate a presigned URL for reading a private file.
 */
export async function getDownloadPresignedUrl(key: string) {
	const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key })
	return getSignedUrl(r2, command, { expiresIn: 3600 })
}

/**
 * Build the public URL for a file (requires R2 bucket to have public access enabled).
 */
export function getPublicUrl(key: string) {
	return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`
}
