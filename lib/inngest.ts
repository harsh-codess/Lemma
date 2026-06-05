import { Inngest } from 'inngest'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { runPaperAgent } from '@/lib/agents/paper-agent'
import { runPaperCritique, buildRevisionContext } from '@/lib/agents/critique-agent'
import { runTrlIrlAgent } from '@/lib/agents/trl-irl-agent'
import { runMarketRetrieval, runMarketSynthesis } from '@/lib/agents/market-scout-agent'
import { runFeasibilityAgent } from '@/lib/agents/feasibility-agent'
import { runPitchBuilder } from '@/lib/agents/pitch-builder-agent'
import {
	runFeasibilityCritique,
	buildFeasibilityRevisionContext,
	runPitchCritique,
	buildPitchRevisionContext,
} from '@/lib/agents/critique-agent'
import type {
	MarketSource,
	MarketScoutOutput,
	FeasibilityScoutOutput,
	PitchBuilderOutput,
} from '@/lib/agents/types'
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
			error.message.startsWith('Agent 2 output validation failed:') ||
			error.message === 'Critique agent returned invalid JSON' ||
			error.message.startsWith('Critique agent output validation failed:') ||
			error.message === 'Agent 3 returned invalid JSON' ||
			error.message.startsWith('Agent 3 output validation failed:') ||
			error.message.startsWith('Agent 3 retrieval returned zero sources') ||
			error.message === 'Agent 4 returned invalid JSON' ||
			error.message.startsWith('Agent 4 output validation failed:') ||
			error.message === 'Agent 5 returned invalid JSON' ||
			error.message.startsWith('Agent 5 output validation failed:'))
	)
}

/** ₹ display string for rupee amounts: Crores above 1 Cr, Lakhs below */
function formatINR(amount: number): string {
	if (amount >= 1_00_00_000) {
		const cr = amount / 1_00_00_000
		return `₹${cr % 1 === 0 ? cr : cr.toFixed(1)} Cr`
	}
	const lakh = amount / 1_00_000
	return `₹${lakh % 1 === 0 ? lakh : lakh.toFixed(1)} L`
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
		// Inngest free-plan cap is 5 concurrent runs; higher values are
		// rejected at app-sync time ("higher concurrency limits than your plan").
		concurrency: { limit: 5 },
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
				pipelineLog.error('Agent 1 execution failed', {
					error: error instanceof Error ? error.message : 'Unknown error',
				})

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

		const draftPaperAnalysis = paperAnalysisResult.result

		// ── Critique: Skeptical Review of Agent 1 ────────────────────────
		// A skeptical reviewer audits Agent 1's output against the paper
		// text. If it finds ungrounded claims, Agent 1 is regenerated ONCE
		// with the critique as context. Best-effort: an unusable critique
		// never kills the pipeline — the original analysis proceeds.
		const critiqueStepResult = await step.run('critique-paper', async () => {
			// Nothing to critique on a rejected document
			if (draftPaperAnalysis.documentType === 'NOT_RESEARCH_PAPER') {
				return { paperAnalysis: draftPaperAnalysis, revised: false as const, critique: null }
			}

			await notify(`project-${projectId}`, 'critique-started', {
				projectId,
				stage: 'paper',
				message: 'Skeptical review of paper analysis...',
			})

			// Re-fetch the PDF — step results are serialized between steps,
			// so the base64 from the agent-1 step is not carried over.
			const response = await fetch(paperUrl)
			if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`)
			const pdfBase64 = Buffer.from(await response.arrayBuffer()).toString('base64')

			try {
				const critique = await runPaperCritique(pdfBase64, draftPaperAnalysis, projectId)

				if (critique.verdict === 'PASS') {
					await notify(`project-${projectId}`, 'critique-complete', {
						projectId,
						verdict: 'PASS',
						issueCount: critique.issues.length,
						revised: false,
					})
					return { paperAnalysis: draftPaperAnalysis, revised: false as const, critique }
				}

				pipelineLog.info('Critique found grounding issues — regenerating Agent 1 once', {
					issueCount: critique.issues.length,
				})

				const revisedAnalysis = await runPaperAgent(
					pdfBase64,
					projectId,
					buildRevisionContext(critique)
				)

				await notify(`project-${projectId}`, 'critique-complete', {
					projectId,
					verdict: 'NEEDS_REVISION',
					issueCount: critique.issues.length,
					revised: true,
				})

				return { paperAnalysis: revisedAnalysis, revised: true as const, critique }
			} catch (error) {
				// Critique is best-effort: an unusable critique or a failed
				// regeneration falls back to the original analysis instead
				// of failing the pipeline. Transient errors still retry.
				if (!isNonRetryableAgentError(error)) {
					throw error
				}

				pipelineLog.error('Critique pass returned unusable output; keeping original Agent 1 analysis', {
					error: error.message,
				})

				return { paperAnalysis: draftPaperAnalysis, revised: false as const, critique: null }
			}
		})

		const paperAnalysis = critiqueStepResult.paperAnalysis

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
				pipelineLog.error('Agent 2 execution failed', {
					error: error instanceof Error ? error.message : 'Unknown error',
				})

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

		// ── Agent 3: Market Scout — Stage 1 (retrieval) ──────────────────
		// Targeted web searches derived from the paper's domain and key
		// claims. Raw sources are persisted to RetrievedSource so the
		// synthesis stage (and reviewers) can audit exactly what was
		// citable. Market Scout is ENRICHMENT: failures here skip the
		// market stage but never fail an analysis that already produced
		// paper + TRL/IRL data.
		const retrievalResult = await step.run('agent-3-retrieve', async () => {
			await notify(`project-${projectId}`, 'agent-started', {
				projectId,
				agent: 3,
				name: 'Market Scout',
				stage: 'market',
			})

			try {
				const sources = await runMarketRetrieval(paperAnalysis, projectId)

				await prisma.$transaction([
					prisma.retrievedSource.deleteMany({ where: { projectId, stageKey: 'MARKET' } }),
					prisma.retrievedSource.createMany({
						data: sources.map((s) => ({
							projectId,
							stageKey: 'MARKET' as const,
							category: s.category,
							query: s.query,
							title: s.title,
							url: s.url,
							snippet: s.snippet,
							publishedDate: s.publishedDate,
						})),
					}),
				])
				pipelineLog.info('Market sources persisted', { sourceCount: sources.length })

				return { skipped: false as const, sources }
			} catch (error) {
				const reason = error instanceof Error ? error.message : 'Unknown retrieval error'
				pipelineLog.error('Market retrieval failed; skipping market stage', { error: reason })
				await notify(`project-${projectId}`, 'market-skipped', { projectId, reason })
				return { skipped: true as const, reason, sources: [] as MarketSource[] }
			}
		})

		// ── Agent 3: Market Scout — Stage 2 (synthesis) ──────────────────
		const marketAnalysisResult = retrievalResult.skipped
			? { skipped: true as const, result: null }
			: await step.run('agent-3-market', async () => {
					try {
						const result = await runMarketSynthesis(
							paperAnalysis,
							retrievalResult.sources,
							projectId
						)

						await notify(`project-${projectId}`, 'agent-complete', {
							projectId,
							agent: 3,
							name: 'Market Scout',
							stage: 'market',
							output: {
								tam: result.tam?.value ?? null,
								competitorCount: result.competitors.length,
								signalCount: result.signals.length,
							},
						})

						return { skipped: false as const, result }
					} catch (error) {
						pipelineLog.error('Agent 3 execution failed', {
							error: error instanceof Error ? error.message : 'Unknown error',
						})

						if (!isNonRetryableAgentError(error)) {
							throw error
						}

						// Output stayed ungrounded after all attempts — skip the
						// market stage rather than fail the whole analysis.
						pipelineLog.error('Agent 3 returned unusable output; skipping market stage', {
							error: error.message,
						})
						await notify(`project-${projectId}`, 'market-skipped', {
							projectId,
							reason: error.message,
						})
						return { skipped: true as const, result: null }
					}
				})

		const marketAnalysis: MarketScoutOutput | null = marketAnalysisResult.skipped
			? null
			: marketAnalysisResult.result

		// ── Save Agent 3 output to DB ────────────────────────────────────
		if (marketAnalysis) {
			await step.run('save-agent-3', async () => {
				const NO_GROUNDED_FIGURE = 'Not established — no grounded source'
				await prisma.$transaction([
					prisma.project.update({
						where: { id: projectId },
						data: { currentStage: 'MARKET', analysisStatus: 'PROCESSING' },
					}),
					prisma.marketData.upsert({
						where: { projectId },
						create: {
							projectId,
							tam: marketAnalysis.tam?.value ?? NO_GROUNDED_FIGURE,
							sam: marketAnalysis.sam?.value ?? NO_GROUNDED_FIGURE,
							som: marketAnalysis.som?.value ?? NO_GROUNDED_FIGURE,
							summary: marketAnalysis.summary,
							tamSourceUrl: marketAnalysis.tam?.sourceUrl ?? null,
							samSourceUrl: marketAnalysis.sam?.sourceUrl ?? null,
							somSourceUrl: marketAnalysis.som?.sourceUrl ?? null,
						},
						update: {
							tam: marketAnalysis.tam?.value ?? NO_GROUNDED_FIGURE,
							sam: marketAnalysis.sam?.value ?? NO_GROUNDED_FIGURE,
							som: marketAnalysis.som?.value ?? NO_GROUNDED_FIGURE,
							summary: marketAnalysis.summary,
							tamSourceUrl: marketAnalysis.tam?.sourceUrl ?? null,
							samSourceUrl: marketAnalysis.sam?.sourceUrl ?? null,
							somSourceUrl: marketAnalysis.som?.sourceUrl ?? null,
						},
					}),
					prisma.competitor.deleteMany({ where: { projectId } }),
					prisma.competitor.createMany({
						data: marketAnalysis.competitors.map((c) => ({
							projectId,
							name: c.name,
							positioning: c.positioning,
							stage: c.stage,
							signal: c.signal,
							sourceUrl: c.sourceUrl,
						})),
					}),
					prisma.marketSignal.deleteMany({ where: { projectId } }),
					prisma.marketSignal.createMany({
						data: marketAnalysis.signals.map((s) => ({
							projectId,
							title: s.title,
							type: s.type.toUpperCase() as 'FUNDING' | 'PATENT' | 'DEMAND' | 'POLICY',
							impact: s.impact === 'High' ? ('HIGH' as const) : s.impact === 'Medium' ? ('MEDIUM' as const) : ('WATCH' as const),
							summary: s.summary,
							sourceUrl: s.sourceUrl,
						})),
					}),
					prisma.projectStage.updateMany({
						where: { projectId, key: 'MARKET' },
						data: { status: 'COMPLETE' },
					}),
					prisma.projectStage.updateMany({
						where: { projectId, key: 'FEASIBILITY' },
						data: { status: 'CURRENT' },
					}),
				])
				pipelineLog.info('Agent 3 output saved to database')
			})
		}

		// ── Agent 4: Feasibility ─────────────────────────────────────────
		// Reasons from Agent 1 (post-critique) + Agent 2; the market brief
		// is optional context (null when the market stage was skipped).
		// Skip-don't-fail: unusable output skips the feasibility stage but
		// never fails an analysis that already produced earlier data.
		const feasibilityDraftResult = await step.run('agent-4-feasibility', async () => {
			await notify(`project-${projectId}`, 'agent-started', {
				projectId,
				agent: 4,
				name: 'Feasibility',
				stage: 'feasibility',
			})

			try {
				const result = await runFeasibilityAgent(
					paperAnalysis,
					trlIrlAnalysis,
					marketAnalysis,
					projectId
				)
				return { skipped: false as const, result }
			} catch (error) {
				pipelineLog.error('Agent 4 execution failed', {
					error: error instanceof Error ? error.message : 'Unknown error',
				})

				if (!isNonRetryableAgentError(error)) {
					throw error
				}

				pipelineLog.error('Agent 4 returned unusable output; skipping feasibility stage', {
					error: error.message,
				})
				await notify(`project-${projectId}`, 'feasibility-skipped', {
					projectId,
					reason: error.message,
				})
				return { skipped: true as const, result: null }
			}
		})

		// ── Critique: Skeptical Review of Agent 4 ────────────────────────
		// Audits traceability-to-inputs and honesty of uncertainty (no
		// citations — Agent 4 reasons, it does not retrieve). CRITICAL
		// findings trigger exactly one regeneration. Best-effort: an
		// unusable critique keeps the original output.
		const feasibilityStepResult = feasibilityDraftResult.skipped
			? { feasibility: null, revised: false as const }
			: await step.run('critique-feasibility', async () => {
					const draft: FeasibilityScoutOutput = feasibilityDraftResult.result

					await notify(`project-${projectId}`, 'critique-started', {
						projectId,
						stage: 'feasibility',
						message: 'Skeptical review of feasibility assessment...',
					})

					try {
						const critique = await runFeasibilityCritique(
							paperAnalysis,
							trlIrlAnalysis,
							marketAnalysis,
							draft,
							projectId
						)

						if (critique.verdict === 'PASS') {
							await notify(`project-${projectId}`, 'critique-complete', {
								projectId,
								stage: 'feasibility',
								verdict: 'PASS',
								issueCount: critique.issues.length,
								revised: false,
							})
							return { feasibility: draft, revised: false as const }
						}

						pipelineLog.info('Feasibility critique found issues — regenerating Agent 4 once', {
							issueCount: critique.issues.length,
						})

						const revised = await runFeasibilityAgent(
							paperAnalysis,
							trlIrlAnalysis,
							marketAnalysis,
							projectId,
							buildFeasibilityRevisionContext(critique)
						)

						await notify(`project-${projectId}`, 'critique-complete', {
							projectId,
							stage: 'feasibility',
							verdict: 'NEEDS_REVISION',
							issueCount: critique.issues.length,
							revised: true,
						})

						return { feasibility: revised, revised: true as const }
					} catch (error) {
						if (!isNonRetryableAgentError(error)) {
							throw error
						}

						pipelineLog.error('Feasibility critique returned unusable output; keeping original Agent 4 output', {
							error: error.message,
						})

						return { feasibility: draft, revised: false as const }
					}
				})

		const feasibilityAnalysis: FeasibilityScoutOutput | null = feasibilityStepResult.feasibility

		// ── Save Agent 4 output to DB ────────────────────────────────────
		if (feasibilityAnalysis) {
			await step.run('save-agent-4', async () => {
				const timeline = feasibilityAnalysis.estimatedTimeline
				const capital = feasibilityAnalysis.capitalEstimate

				// Display-formatted derivations for the legacy string columns
				const timelineDisplay = `${timeline.minMonths}–${timeline.maxMonths} months (${timeline.confidence} confidence)`
				const capitalDisplay = `${formatINR(capital.minINR)}–${formatINR(capital.maxINR)} (${capital.confidence} confidence)`
				const teamDisplay = feasibilityAnalysis.teamMatrix.map(
					(r) => `${r.role} — ${r.domainExpertise} (${r.seniority})`
				)
				const grantFit =
					trlIrlAnalysis.recommendedGrants?.length > 0
						? `Per TRL/IRL assessment: ${trlIrlAnalysis.recommendedGrants.join('; ')}`
						: 'No grant programs identified by TRL/IRL assessment'

				const feasibilityData = {
					teamRequirements: teamDisplay,
					timeline: timelineDisplay,
					capitalEstimate: capitalDisplay,
					grantFit,
					keyRisks: feasibilityAnalysis.keyRisks,
					// Typed interfaces lack the index signature Prisma's Json input
					// expects — cast through InputJsonValue (shapes are JSON-safe).
					teamMatrix: feasibilityAnalysis.teamMatrix as unknown as Prisma.InputJsonValue,
					timelineDetail: timeline as unknown as Prisma.InputJsonValue,
					capitalDetail: capital as unknown as Prisma.InputJsonValue,
					overallConfidence: feasibilityAnalysis.overallConfidence.level,
					confidenceReasoning: feasibilityAnalysis.overallConfidence.reasoning,
				}

				await prisma.$transaction([
					prisma.project.update({
						where: { id: projectId },
						data: { currentStage: 'FEASIBILITY', analysisStatus: 'PROCESSING' },
					}),
					prisma.feasibilityData.upsert({
						where: { projectId },
						create: { projectId, ...feasibilityData },
						update: feasibilityData,
					}),
					prisma.projectStage.updateMany({
						where: { projectId, key: 'FEASIBILITY' },
						data: { status: 'COMPLETE' },
					}),
					prisma.projectStage.updateMany({
						where: { projectId, key: 'DECK' },
						data: { status: 'CURRENT' },
					}),
				])
				pipelineLog.info('Agent 4 output saved to database')

				await notify(`project-${projectId}`, 'agent-complete', {
					projectId,
					agent: 4,
					name: 'Feasibility',
					stage: 'feasibility',
					output: {
						timeline: timelineDisplay,
						capital: capitalDisplay,
						overallConfidence: feasibilityAnalysis.overallConfidence.level,
					},
				})
			})
		}

		// ── Agent 5: Pitch Builder ───────────────────────────────────────
		// Synthesizes structured deck CONTENT (not a rendered file) from
		// agents 1–4. Needs feasibility, so it only runs when the
		// feasibility stage produced output. Skip-don't-fail like the
		// other enrichment agents.
		const pitchDraftResult = feasibilityAnalysis
			? await step.run('agent-5-pitch', async () => {
					await notify(`project-${projectId}`, 'agent-started', {
						projectId,
						agent: 5,
						name: 'Pitch Builder',
						stage: 'deck',
					})

					try {
						const result = await runPitchBuilder(
							paperAnalysis,
							trlIrlAnalysis,
							marketAnalysis,
							feasibilityAnalysis,
							projectId
						)
						return { skipped: false as const, result }
					} catch (error) {
						pipelineLog.error('Agent 5 execution failed', {
							error: error instanceof Error ? error.message : 'Unknown error',
						})

						if (!isNonRetryableAgentError(error)) {
							throw error
						}

						pipelineLog.error('Agent 5 returned unusable output; skipping deck stage', {
							error: error.message,
						})
						await notify(`project-${projectId}`, 'deck-skipped', {
							projectId,
							reason: error.message,
						})
						return { skipped: true as const, result: null }
					}
				})
			: { skipped: true as const, result: null }

		// ── Critique: Traceability Review of Agent 5 ─────────────────────
		// Polices factual claims on every slide against agents 1–4; CRITICAL
		// findings (an unsourced/contradicting number) trigger one regen.
		// Best-effort: an unusable critique keeps the original deck.
		const pitchStepResult = pitchDraftResult.skipped
			? { deck: null, revised: false as const }
			: await step.run('critique-pitch', async () => {
					const draft: PitchBuilderOutput = pitchDraftResult.result

					await notify(`project-${projectId}`, 'critique-started', {
						projectId,
						stage: 'deck',
						message: 'Traceability review of pitch deck...',
					})

					try {
						const critique = await runPitchCritique(
							paperAnalysis,
							trlIrlAnalysis,
							marketAnalysis,
							feasibilityAnalysis as FeasibilityScoutOutput,
							draft,
							projectId
						)

						if (critique.verdict === 'PASS') {
							await notify(`project-${projectId}`, 'critique-complete', {
								projectId,
								stage: 'deck',
								verdict: 'PASS',
								issueCount: critique.issues.length,
								revised: false,
							})
							return { deck: draft, revised: false as const }
						}

						pipelineLog.info('Pitch critique found ungrounded claims — regenerating Agent 5 once', {
							issueCount: critique.issues.length,
						})

						const revised = await runPitchBuilder(
							paperAnalysis,
							trlIrlAnalysis,
							marketAnalysis,
							feasibilityAnalysis as FeasibilityScoutOutput,
							projectId,
							buildPitchRevisionContext(critique)
						)

						await notify(`project-${projectId}`, 'critique-complete', {
							projectId,
							stage: 'deck',
							verdict: 'NEEDS_REVISION',
							issueCount: critique.issues.length,
							revised: true,
						})

						return { deck: revised, revised: true as const }
					} catch (error) {
						if (!isNonRetryableAgentError(error)) {
							throw error
						}

						pipelineLog.error('Pitch critique returned unusable output; keeping original Agent 5 deck', {
							error: error.message,
						})

						return { deck: draft, revised: false as const }
					}
				})

		const pitchDeck: PitchBuilderOutput | null = pitchStepResult.deck

		// ── Save Agent 5 output to DB ────────────────────────────────────
		if (pitchDeck) {
			await step.run('save-agent-5', async () => {
				// Display-formatted derivations for the legacy columns + frontend
				const askSlide = pitchDeck.slides.find((s) => s.slideType === 'ASK')
				const fundingAsk = askSlide
					? askSlide.bullets.join(' ')
					: 'See deck for the funding ask.'
				const keyNarrativePoints = pitchDeck.slides
					.map((s) => s.narrative)
					.filter((n) => n.trim().length > 0)

				await prisma.$transaction([
					prisma.project.update({
						where: { id: projectId },
						data: { currentStage: 'DECK', analysisStatus: 'PROCESSING' },
					}),
					prisma.deckData.upsert({
						where: { projectId },
						create: {
							projectId,
							fundingAsk,
							keyNarrativePoints,
							slides: pitchDeck.slides as unknown as Prisma.InputJsonValue,
						},
						update: {
							fundingAsk,
							keyNarrativePoints,
							slides: pitchDeck.slides as unknown as Prisma.InputJsonValue,
						},
					}),
					prisma.deckSlide.deleteMany({ where: { projectId } }),
					prisma.deckSlide.createMany({
						data: pitchDeck.slides.map((s) => ({
							projectId,
							order: s.order,
							title: s.title,
							keyPoint: s.bullets.join(' • '),
							slideType: s.slideType,
							factRefs: s.factRefs as unknown as Prisma.InputJsonValue,
						})),
					}),
					prisma.projectStage.updateMany({
						where: { projectId, key: 'DECK' },
						data: { status: 'COMPLETE' },
					}),
					prisma.projectStage.updateMany({
						where: { projectId, key: 'REVIEW' },
						data: { status: 'CURRENT' },
					}),
				])
				pipelineLog.info('Agent 5 output saved to database')

				await notify(`project-${projectId}`, 'agent-complete', {
					projectId,
					agent: 5,
					name: 'Pitch Builder',
					stage: 'deck',
					output: {
						slideCount: pitchDeck.slides.length,
						marketIncluded: pitchDeck.slides.some((s) => s.slideType === 'MARKET'),
					},
				})
			})
		}

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
				marketStage: marketAnalysis ? 'complete' : 'skipped',
				feasibilityStage: feasibilityAnalysis ? 'complete' : 'skipped',
				deckStage: pitchDeck ? 'complete' : 'skipped',
			})
			await notify(`project-${projectId}`, 'pipeline-complete', {
				projectId,
				readinessScore: paperAnalysis.initialReadinessEstimate,
				completedAgents: [
					'paper',
					'trl-irl',
					...(marketAnalysis ? ['market'] : []),
					...(feasibilityAnalysis ? ['feasibility'] : []),
					...(pitchDeck ? ['deck'] : []),
				],
			})
		})

		return { success: true, projectId, paperAnalysis, trlIrlAnalysis, marketAnalysis, feasibilityAnalysis, pitchDeck }
	}
)
