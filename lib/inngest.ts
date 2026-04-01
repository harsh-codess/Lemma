import { Inngest } from 'inngest'
import { prisma } from '@/lib/prisma'
import { runPaperAgent } from '@/lib/agents/paper-agent'
import { createAgentLogger } from '@/lib/logger'
import Pusher from 'pusher'

export const inngest = new Inngest({ id: 'lemma' })

// ── Lazy Pusher initialization ───────────────────────────────────────────────
// Pusher keys may not be set yet. Initialize lazily so the module doesn't
// crash on import. If Pusher isn't configured, notifications are skipped.

let _pusher: Pusher | null = null

function getPusher(): Pusher | null {
	if (_pusher) return _pusher
	if (!process.env.PUSHER_APP_ID || process.env.PUSHER_APP_ID === 'FILL_ME_IN') {
		return null
	}
	_pusher = new Pusher({
		appId: process.env.PUSHER_APP_ID,
		key: process.env.PUSHER_KEY!,
		secret: process.env.PUSHER_SECRET!,
		cluster: process.env.PUSHER_CLUSTER ?? 'ap2',
		useTLS: true,
	})
	return _pusher
}

/** Safe Pusher trigger — silently skips if Pusher isn't configured */
async function notify(channel: string, event: string, data: unknown) {
	const pusher = getPusher()
	if (!pusher) return // No Pusher configured — skip silently
	try {
		await pusher.trigger(channel, event, data)
	} catch (err) {
		// Pusher failure should never kill the pipeline
		console.warn('Pusher notification failed (non-fatal):', err)
	}
}

// ─── Pipeline Orchestrator ───────────────────────────────────────────────────
//
// Chains agents sequentially. Each agent is its own `step.run()`.
// If one fails, Inngest retries ONLY that step.
//
// Current: Agent 1 (Paper) only
// Next:    Agent 2 (TRL/IRL) → Agent 3 (Market) → Agent 4 (Feasibility) → Agent 5 (Deck)

export const analyzePaper = inngest.createFunction(
	{
		id: 'analyze-paper-pipeline',
		retries: 3,
		concurrency: { limit: 10 },
		triggers: [{ event: 'paper/uploaded' }],
		onFailure: async ({ event, error }: { event: any; error: Error }) => {
			// If all retries are exhausted, mark the project as FAILED
			// so it doesn't stay stuck in PROCESSING forever
			const projectId = event.data?.event?.data?.projectId
			if (projectId) {
				await prisma.project.update({
					where: { id: projectId },
					data: {
						analysisStatus: 'FAILED',
						analysisError: error.message ?? 'Unknown error during analysis',
					},
				})
				await notify(`project-${projectId}`, 'pipeline-failed', {
					projectId,
					error: error.message,
				})
			}
		},
	},

	async ({ event, step }: { event: { data: { projectId: string; paperUrl: string; userId: string } }; step: any }) => {
		const { projectId, paperUrl } = event.data
		const pipelineLog = createAgentLogger('Pipeline', 0, projectId)

		// ── Mark pipeline as started ─────────────────────────────────────
		await step.run('pipeline-start', async () => {
			pipelineLog.info('Pipeline starting')
			await prisma.project.update({
				where: { id: projectId },
				data: { analysisStatus: 'PROCESSING', analysisError: null },
			})
			await notify(`project-${projectId}`, 'pipeline-started', {
				projectId,
				stage: 'paper',
				message: 'Starting paper analysis...',
			})
		})

		// ── Agent 1: Paper Analysis ──────────────────────────────────────
		const paperAnalysis = await step.run('agent-1-paper', async () => {
			await notify(`project-${projectId}`, 'agent-started', {
				projectId,
				agent: 1,
				name: 'Paper Analysis',
				stage: 'paper',
			})

			// Fetch PDF and convert to base64
			const response = await fetch(paperUrl)
			if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`)
			const pdfBuffer = await response.arrayBuffer()
			const pdfBase64 = Buffer.from(pdfBuffer).toString('base64')

			// Run Agent 1 (includes Zod validation + logging internally)
			const result = await runPaperAgent(pdfBase64, projectId)

			await notify(`project-${projectId}`, 'agent-complete', {
				projectId,
				agent: 1,
				name: 'Paper Analysis',
				stage: 'paper',
				output: {
					domain: result.domain,
					claimCount: result.keyClaims.length,
					readinessEstimate: result.initialReadinessEstimate,
				},
			})

			return result
		})

		// ── Save Agent 1 output to DB ────────────────────────────────────
		await step.run('save-agent-1', async () => {
			await prisma.$transaction([
				prisma.project.update({
					where: { id: projectId },
					data: {
						domain: paperAnalysis.domain,
						readinessScore: paperAnalysis.initialReadinessEstimate,
						currentStage: 'PAPER',
						// Mark COMPLETE since only Agent 1 exists for now
						// When Agent 2 is added, this stays PROCESSING until Agent 5
						analysisStatus: 'COMPLETE',
					},
				}),
				prisma.paperData.upsert({
					where: { projectId },
					create: {
						projectId,
						abstractSummary: paperAnalysis.abstractSummary,
						noveltySummary: paperAnalysis.noveltySummary,
						domainClassification: paperAnalysis.domainClassification,
						keyClaims: paperAnalysis.keyClaims,
					},
					update: {
						abstractSummary: paperAnalysis.abstractSummary,
						noveltySummary: paperAnalysis.noveltySummary,
						domainClassification: paperAnalysis.domainClassification,
						keyClaims: paperAnalysis.keyClaims,
					},
				}),
				prisma.projectStage.updateMany({
					where: { projectId, key: 'PAPER' },
					data: { status: 'COMPLETE' },
				}),
				prisma.projectStage.updateMany({
					where: { projectId, key: 'TRL_IRL' },
					data: { status: 'CURRENT' },
				}),
			])
			pipelineLog.info('Agent 1 output saved to database')
		})

		// ── Agent 2: TRL/IRL Scoring ─────────────────────────────────────
		// TODO: receives paperAnalysis as input
		// const trlIrlAnalysis = await step.run('agent-2-trl-irl', async () => { ... })

		// ── Agent 3: Market Intelligence ─────────────────────────────────
		// TODO: receives paperAnalysis + trlIrlAnalysis
		// const marketAnalysis = await step.run('agent-3-market', async () => { ... })

		// ── Agent 4: Feasibility Assessment ──────────────────────────────
		// TODO: receives all prior outputs
		// const feasibilityAnalysis = await step.run('agent-4-feasibility', async () => { ... })

		// ── Agent 5: Deck Generation ─────────────────────────────────────
		// TODO: receives all prior outputs, produces final score
		// const deckAnalysis = await step.run('agent-5-deck', async () => { ... })

		// ── Pipeline complete ────────────────────────────────────────────
		await step.run('pipeline-complete', async () => {
			pipelineLog.info('Pipeline complete', {
				readinessScore: paperAnalysis.initialReadinessEstimate,
			})
			await notify(`project-${projectId}`, 'pipeline-complete', {
				projectId,
				readinessScore: paperAnalysis.initialReadinessEstimate,
				completedAgents: ['paper'],
			})
		})

		return { success: true, projectId, paperAnalysis }
	}
)
