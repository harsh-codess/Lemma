import { Inngest } from 'inngest'
import { prisma } from '@/lib/prisma'
import { runPaperAgent } from '@/lib/agents/paper-agent'
import { runTrlIrlAgent } from '@/lib/agents/trl-irl-agent'
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

function isNonRetryableAgentError(error: unknown): error is Error {
	return (
		error instanceof Error &&
		(error.message === 'Agent 1 returned invalid JSON' ||
			error.message.startsWith('Agent 1 output validation failed:') ||
			error.message === 'Agent 2 returned invalid JSON' ||
			error.message.startsWith('Agent 2 output validation failed:'))
	)
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
			const projectId = event.data?.projectId
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
		const paperAnalysisResult = await step.run('agent-1-paper', async () => {
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

			try {
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

				return { aborted: false as const, result }
			} catch (error) {
				if (!isNonRetryableAgentError(error)) {
					throw error
				}

				pipelineLog.error('Agent 1 returned unusable output; aborting pipeline without retry', {
					error: error.message,
				})

				await prisma.project.update({
					where: { id: projectId },
					data: {
						analysisStatus: 'FAILED',
						analysisError: error.message,
					},
				})

				await notify(`project-${projectId}`, 'pipeline-failed', {
					projectId,
					error: error.message,
				})

				return { aborted: true as const, reason: error.message }
			}
		})

		if (paperAnalysisResult.aborted) {
			return { success: false, projectId, aborted: true, reason: paperAnalysisResult.reason }
		}

		const paperAnalysis = paperAnalysisResult.result

		// ── Save Agent 1 output to DB ────────────────────────────────────
		await step.run('save-agent-1', async () => {
			// ── Early abort: not a research paper ────────────────────────
			if (paperAnalysis.documentType === 'NOT_RESEARCH_PAPER') {
				await prisma.project.update({
					where: { id: projectId },
					data: {
						analysisStatus: 'FAILED',
						analysisError: `Document rejected: ${paperAnalysis.rejectionReason ?? 'This does not appear to be a research paper or technical innovation document. Please upload an academic paper, patent, or technical report.'}`,
					},
				})
				await notify(`project-${projectId}`, 'pipeline-failed', {
					projectId,
					error: paperAnalysis.rejectionReason ?? 'Not a research paper',
				})
				return { aborted: true }
			}

			await prisma.$transaction([
				prisma.project.update({
					where: { id: projectId },
					data: {
						domain: paperAnalysis.domain,
						readinessScore: paperAnalysis.initialReadinessEstimate,
						currentStage: 'PAPER',
						analysisStatus: 'PROCESSING',
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
						methodologyStrength: paperAnalysis.methodologyStrength,
						commercializationBarriers: paperAnalysis.commercializationBarriers ?? [],
						institutionContext: paperAnalysis.institutionContext,
						claimConfidence: paperAnalysis.claimConfidence ?? [],
					},
					update: {
						abstractSummary: paperAnalysis.abstractSummary,
						noveltySummary: paperAnalysis.noveltySummary,
						domainClassification: paperAnalysis.domainClassification,
						keyClaims: paperAnalysis.keyClaims,
						methodologyStrength: paperAnalysis.methodologyStrength,
						commercializationBarriers: paperAnalysis.commercializationBarriers ?? [],
						institutionContext: paperAnalysis.institutionContext,
						claimConfidence: paperAnalysis.claimConfidence ?? [],
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
			return { aborted: false }
		})

		// ── Abort if not a research paper ────────────────────────────────
		if (paperAnalysis.documentType === 'NOT_RESEARCH_PAPER') {
			return { success: false, projectId, aborted: true, reason: paperAnalysis.rejectionReason }
		}

		// ── Agent 2: TRL/IRL Scoring ─────────────────────────────────────
		const trlIrlAnalysisResult = await step.run('agent-2-trl-irl', async () => {
			await notify(`project-${projectId}`, 'agent-started', {
				projectId,
				agent: 2,
				name: 'TRL/IRL Scoring',
				stage: 'trl-irl',
			})

			try {
				const result = await runTrlIrlAgent(paperAnalysis, projectId)

				await notify(`project-${projectId}`, 'agent-complete', {
					projectId,
					agent: 2,
					name: 'TRL/IRL Scoring',
					stage: 'trl-irl',
					output: {
						trlScore: result.trlScore,
						irlScore: result.irlScore,
						riskCount: result.riskFlags.length,
					},
				})

				return { aborted: false as const, result }
			} catch (error) {
				if (!isNonRetryableAgentError(error)) {
					throw error
				}

				pipelineLog.error('Agent 2 returned unusable output; aborting pipeline without retry', {
					error: (error as Error).message,
				})

				await prisma.project.update({
					where: { id: projectId },
					data: {
						analysisStatus: 'FAILED',
						analysisError: (error as Error).message,
					},
				})

				await notify(`project-${projectId}`, 'pipeline-failed', {
					projectId,
					error: (error as Error).message,
				})

				return { aborted: true as const, reason: (error as Error).message }
			}
		})

		if (trlIrlAnalysisResult.aborted) {
			return { success: false, projectId, aborted: true, reason: trlIrlAnalysisResult.reason }
		}

		const trlIrlAnalysis = trlIrlAnalysisResult.result

		// ── Save Agent 2 output to DB ────────────────────────────────────
		await step.run('save-agent-2', async () => {
			await prisma.$transaction([
				prisma.project.update({
					where: { id: projectId },
					data: {
						currentStage: 'TRL_IRL',
						// Keep PROCESSING until all 5 agents complete
						analysisStatus: 'PROCESSING',
					},
				}),
				prisma.trlIrlData.upsert({
					where: { projectId },
					create: {
						projectId,
						trlScore: trlIrlAnalysis.trlScore,
						irlScore: trlIrlAnalysis.irlScore,
						rationale: trlIrlAnalysis.rationale,
						confidence: trlIrlAnalysis.confidence,
						riskFlags: trlIrlAnalysis.riskFlags,
						commercializationPathway: trlIrlAnalysis.commercializationPathway,
						pathwayRationale: trlIrlAnalysis.pathwayRationale,
						recommendedGrants: trlIrlAnalysis.recommendedGrants ?? [],
						timeToMarket: trlIrlAnalysis.timeToMarket,
						domainRubricApplied: trlIrlAnalysis.domainRubricApplied,
					},
					update: {
						trlScore: trlIrlAnalysis.trlScore,
						irlScore: trlIrlAnalysis.irlScore,
						rationale: trlIrlAnalysis.rationale,
						confidence: trlIrlAnalysis.confidence,
						riskFlags: trlIrlAnalysis.riskFlags,
						commercializationPathway: trlIrlAnalysis.commercializationPathway,
						pathwayRationale: trlIrlAnalysis.pathwayRationale,
						recommendedGrants: trlIrlAnalysis.recommendedGrants ?? [],
						timeToMarket: trlIrlAnalysis.timeToMarket,
						domainRubricApplied: trlIrlAnalysis.domainRubricApplied,
					},
				}),
				prisma.projectStage.updateMany({
					where: { projectId, key: 'TRL_IRL' },
					data: { status: 'COMPLETE' },
				}),
				prisma.projectStage.updateMany({
					where: { projectId, key: 'MARKET' },
					data: { status: 'CURRENT' },
				}),
				// Save evidence items from Agent 2
				...trlIrlAnalysis.evidence.map((e: { claim: string; sourceTitle: string; confidence: string; summary: string }) =>
					prisma.evidence.create({
						data: {
							projectId,
							stageKey: 'TRL_IRL',
							claim: e.claim,
							sourceType: 'PAPER',
							sourceTitle: e.sourceTitle,
							confidence: e.confidence === 'High' ? 'HIGH' : e.confidence === 'Medium' ? 'MEDIUM' : 'WATCH',
							summary: e.summary,
						},
					})
				),
			])
			pipelineLog.info('Agent 2 output saved to database')
		})

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
			await prisma.project.update({
				where: { id: projectId },
				data: { analysisStatus: 'COMPLETE' },
			});
			pipelineLog.info('Pipeline complete', {
				readinessScore: paperAnalysis.initialReadinessEstimate,
				trlScore: trlIrlAnalysis.trlScore,
				irlScore: trlIrlAnalysis.irlScore,
			})
			await notify(`project-${projectId}`, 'pipeline-complete', {
				projectId,
				readinessScore: paperAnalysis.initialReadinessEstimate,
				completedAgents: ['paper', 'trl-irl'],
			})
		})

		return { success: true, projectId, paperAnalysis, trlIrlAnalysis }
	}
)
