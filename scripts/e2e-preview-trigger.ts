/**
 * E2E pipeline check against a DEPLOYED app (Inngest Cloud, not the dev server).
 *
 * Finds the newest project with an uploaded paper, resets its analysis state,
 * sends the real `paper/uploaded` event to Inngest Cloud (event key from
 * .env.local), then polls the DB until the pipeline completes or fails.
 * Inngest Cloud invokes whichever deployment is synced to the app —
 * run `curl -X PUT https://<deployment>/api/inngest` first.
 *
 *   npx tsx scripts/e2e-preview-trigger.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
// Target Inngest CLOUD: the local dev flag would route the event to localhost.
delete process.env.INNGEST_DEV

import { Inngest } from 'inngest'

async function main() {
	// Dynamic import — static imports hoist above dotenv.config(), which would
	// build the pg Pool with DATABASE_URL undefined (→ localhost ECONNREFUSED).
	const { prisma } = await import('../lib/prisma')
	const project = await prisma.project.findFirst({
		where: { paperUrl: { not: null } },
		orderBy: { updatedAt: 'desc' },
		select: { id: true, title: true, paperUrl: true, ownerId: true },
	})
	if (!project?.paperUrl) {
		console.error('No project with an uploaded paper found — upload one first.')
		process.exit(1)
	}
	console.log(`Project: ${project.id} — "${project.title}"`)

	await prisma.project.update({
		where: { id: project.id },
		data: { analysisStatus: 'PROCESSING', analysisError: null },
	})

	const inngest = new Inngest({ id: 'lemma' })
	await inngest.send({
		name: 'paper/uploaded',
		data: { projectId: project.id, paperUrl: project.paperUrl, userId: project.ownerId },
	})
	console.log('Event sent to Inngest Cloud. Polling…')

	const startedAt = Date.now()
	const timeoutMs = 12 * 60 * 1000
	let lastLine = ''
	while (Date.now() - startedAt < timeoutMs) {
		await new Promise((r) => setTimeout(r, 10_000))
		const p = await prisma.project.findUnique({
			where: { id: project.id },
			select: {
				analysisStatus: true,
				analysisError: true,
				currentStage: true,
				readinessScore: true,
				stages: { select: { key: true, status: true } },
			},
		})
		if (!p) continue
		const stageSummary = p.stages
			.map((s) => `${s.key}:${s.status[0]}`)
			.join(' ')
		const line = `[${Math.round((Date.now() - startedAt) / 1000)}s] ${p.analysisStatus} stage=${p.currentStage} ${stageSummary}`
		if (line.slice(line.indexOf(']')) !== lastLine.slice(lastLine.indexOf(']'))) console.log(line)
		lastLine = line
		if (p.analysisStatus === 'COMPLETE') {
			console.log(`✅ Pipeline COMPLETE — readiness ${p.readinessScore}/100`)
			process.exit(0)
		}
		if (p.analysisStatus === 'FAILED') {
			console.error(`❌ Pipeline FAILED: ${p.analysisError}`)
			process.exit(1)
		}
	}
	console.error('⏱ Timed out waiting for the pipeline.')
	process.exit(1)
}

main()
