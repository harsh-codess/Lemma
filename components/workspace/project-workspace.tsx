'use client'

import Link from 'next/link'
import {
	AlertTriangle,
	ArrowRight,
	CheckCircle2,
	ChevronRight,
	ClipboardCheck,
	Download,
	ExternalLink,
	FileBarChart2,
	FileText,
	FolderSearch2,
	Loader2,
	SearchCode,
	ShieldCheck,
	Sparkles,
	TrendingUp,
	Clock,
	RefreshCw,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
// Pure string helper from the deck render layer — reused so on-screen capital
// figures match the exported deck exactly (raw rupees → crores).
import { formatCurrencyInText } from '@/lib/deck-render/currency'

// ─── Types matching the real API response ────────────────────────────────────

type StageKey = 'PAPER' | 'TRL_IRL' | 'MARKET' | 'FEASIBILITY' | 'DECK' | 'REVIEW'

type ApiProject = {
	id: string
	title: string
	domain: string
	shortNote: string | null
	status: string
	currentStage: StageKey
	readinessScore: number
	paperUrl: string | null
	paperFileName: string | null
	analysisStatus: 'IDLE' | 'PROCESSING' | 'COMPLETE' | 'FAILED'
	analysisError: string | null
	createdAt: string
	updatedAt: string
	owner: { name: string | null; email: string }
	institution: { id: string; name: string }
	stages: Array<{ id: string; key: StageKey; label: string; description: string; status: string }>
	paper: {
		abstractSummary: string
		noveltySummary: string
		domainClassification: string
		keyClaims: string[]
		methodologyStrength: string | null
		commercializationBarriers: string[]
		institutionContext: string | null
		claimConfidence: Array<{ claim: string; confidence: string; reasoning: string }> | null
	} | null
	trlIrl: {
		trlScore: string
		irlScore: string
		rationale: string[]
		confidence: string
		riskFlags: string[]
		commercializationPathway: string | null
		pathwayRationale: string | null
		recommendedGrants: string[]
		timeToMarket: string | null
		domainRubricApplied: string | null
	} | null
	market: {
		tam: string
		sam: string
		som: string
		summary: string
		tamSourceUrl: string | null
		samSourceUrl: string | null
		somSourceUrl: string | null
	} | null
	feasibility: {
		teamRequirements: string[]
		timeline: string
		capitalEstimate: string
		grantFit: string
		keyRisks: string[]
		// Structured detail (Agent 4) — present on newer runs; fall back to the
		// string fields above when null.
		teamMatrix:
			| Array<{ role: string; domainExpertise: string; seniority: string; rationale: string }>
			| null
		timelineDetail:
			| { minMonths: number; maxMonths: number; confidence: string; reasoning: string }
			| null
		capitalDetail:
			| { minINR: number; maxINR: number; confidence: string; reasoning: string; majorCostDrivers: string[] }
			| null
		overallConfidence: string | null
		confidenceReasoning: string | null
	} | null
	deck: { fundingAsk: string; keyNarrativePoints: string[] } | null
	review: { status: string; exportReadiness: string; approvalChecklist: string[] } | null
	evidence: Array<{
		id: string
		stageKey: StageKey
		claim: string
		sourceType: string
		sourceTitle: string
		confidence: string
		summary: string
	}>
	competitors: Array<{
		id: string
		name: string
		positioning: string
		stage: string
		signal: string
		sourceUrl: string | null
	}>
	marketSignals: Array<{
		id: string
		title: string
		type: string
		impact: string
		summary: string
		sourceUrl: string | null
	}>
	deckSlides: Array<{
		id: string
		order: number
		title: string
		keyPoint: string
		slideType: string | null
		factRefs: Array<{ ref: string; sourceUrl: string }> | null
	}>
	reviewNotes: Array<{
		id: string
		stageKey: StageKey | null
		comment: string
		status: string
		createdAt: string
		author: { name: string | null; email: string; role: string }
	}>
}

type EvidenceItem = ApiProject['evidence'][number]
type ReviewNoteItem = ApiProject['reviewNotes'][number]
type WorkspaceTab = 'summary' | 'evidence' | 'notes'
type DetailState =
	| { type: 'evidence'; item: EvidenceItem }
	| { type: 'review'; item: ReviewNoteItem }
	| null

// ─── Constants ───────────────────────────────────────────────────────────────

const stageIcons: Record<StageKey, React.ComponentType<{ className?: string }>> = {
	PAPER: FileText,
	TRL_IRL: SearchCode,
	MARKET: FolderSearch2,
	FEASIBILITY: ClipboardCheck,
	DECK: FileBarChart2,
	REVIEW: ShieldCheck,
}

const stageOrder: StageKey[] = ['PAPER', 'TRL_IRL', 'MARKET', 'FEASIBILITY', 'DECK', 'REVIEW']

const sortStages = <T extends { key: StageKey }>(stages: T[]) =>
	[...stages].sort((a, b) => stageOrder.indexOf(a.key) - stageOrder.indexOf(b.key))

const stageAccentClasses: Record<StageKey, string> = {
	PAPER: 'text-sky-200 bg-sky-400/10',
	TRL_IRL: 'text-violet-200 bg-violet-400/10',
	MARKET: 'text-[#f6df9d] bg-[#e7c35a]/10',
	FEASIBILITY: 'text-emerald-200 bg-emerald-400/10',
	DECK: 'text-fuchsia-200 bg-fuchsia-400/10',
	REVIEW: 'text-white/75 bg-white/[0.06]',
}

// Human-readable label per stage for the analysis progress stepper.
const stageStepLabels: Record<StageKey, string> = {
	PAPER: 'Paper Analysis',
	TRL_IRL: 'TRL / IRL Scoring',
	MARKET: 'Market Intelligence',
	FEASIBILITY: 'Feasibility',
	DECK: 'Pitch Deck',
	REVIEW: 'Review',
}

// A skipped stage (enrichment, not failure) renders muted with this label.
const stageUnavailableLabels: Partial<Record<StageKey, string>> = {
	MARKET: 'Market analysis — unavailable',
}

type StepState = 'done' | 'active' | 'skipped' | 'pending'

// Derives each stage's visual state from the ProjectStage rows (status:
// COMPLETE | CURRENT | UPCOMING). A non-complete stage that sits BEFORE the
// pipeline's furthest progress was skipped — e.g. Market Scout is enrichment
// and can be skipped without failing the run — and is shown distinctly from
// the genuinely active stage and from still-pending stages.
const deriveStageSteps = (
	stages: ApiProject['stages'],
): Array<{ key: StageKey; state: StepState }> => {
	const statusByKey = new Map(stages.map((stage) => [stage.key, stage.status]))
	let frontier = -1
	stageOrder.forEach((key, index) => {
		const status = statusByKey.get(key)
		if (status === 'COMPLETE' || status === 'CURRENT') frontier = index
	})
	return stageOrder.map((key, index) => {
		const status = statusByKey.get(key) ?? 'UPCOMING'
		let state: StepState
		if (status === 'COMPLETE') state = 'done'
		else if (index < frontier) state = 'skipped'
		else if (status === 'CURRENT') state = 'active'
		else state = 'pending'
		return { key, state }
	})
}

const formatDate = (value: string) => {
	try {
		return new Intl.DateTimeFormat('en', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		}).format(new Date(value))
	} catch {
		return value
	}
}

const methodologyBadge: Record<string, { label: string; className: string }> = {
	STRONG: { label: 'Strong methodology', className: 'text-emerald-300 bg-emerald-400/10' },
	ADEQUATE: { label: 'Adequate methodology', className: 'text-sky-300 bg-sky-400/10' },
	WEAK: { label: 'Weak methodology', className: 'text-amber-300 bg-amber-400/10' },
	UNKNOWN: { label: 'Methodology unclear', className: 'text-white/50 bg-white/[0.06]' },
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const SurfaceCard = ({
	title,
	description,
	children,
	className,
}: {
	title: string
	description?: string
	children: React.ReactNode
	className?: string
}) => (
	<section
		className={cn(
			'rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-5 sm:p-6',
			className,
		)}>
		<div className='flex flex-wrap items-start justify-between gap-3'>
			<div className='min-w-0'>
				<h3 className='text-lg font-semibold tracking-[-0.02em] text-white'>{title}</h3>
				{description && (
					<p className='mt-2 text-sm leading-6 text-white/50'>{description}</p>
				)}
			</div>
		</div>
		<div className='mt-5'>{children}</div>
	</section>
)

const AnalysisProgress = ({
	project,
	onRetry,
	isRetrying,
}: {
	project: ApiProject
	onRetry: () => void
	isRetrying: boolean
}) => {
	const isActive = project.analysisStatus === 'PROCESSING'

	if (
		!isActive &&
		project.analysisStatus !== 'FAILED' &&
		project.analysisStatus !== 'COMPLETE'
	)
		return null

	if (project.analysisStatus === 'FAILED') {
		return (
			<div className='flex flex-col gap-4 rounded-[28px] border border-red-500/20 bg-red-500/5 p-5 sm:flex-row sm:items-center'>
				<AlertTriangle className='h-5 w-5 shrink-0 text-red-400' />
				<div className='min-w-0 flex-1'>
					<p className='text-sm font-medium text-red-400'>Analysis failed</p>
					<p className='mt-1 text-xs text-red-400/60'>
						{project.analysisError ?? 'An unexpected error occurred during analysis.'}
					</p>
				</div>
				{project.paperUrl && (
					<Button
						type='button'
						onClick={onRetry}
						disabled={isRetrying}
						variant='outline'
						className='h-10 rounded-full border-red-400/20 bg-red-400/10 px-4 text-xs font-semibold text-red-100 hover:bg-red-400/15 hover:text-white disabled:opacity-50'>
						{isRetrying ? (
							<Loader2 className='mr-2 h-3.5 w-3.5 animate-spin' />
						) : (
							<RefreshCw className='mr-2 h-3.5 w-3.5' />
						)}
						Retry analysis
					</Button>
				)}
			</div>
		)
	}

	// No stage rows yet (e.g. project created but not analyzed) — nothing to show.
	if (project.stages.length === 0) return null

	const steps = deriveStageSteps(project.stages)
	const activeStep = steps.find((stepState) => stepState.state === 'active')
	const headerLabel = isActive
		? activeStep
			? `${stageStepLabels[activeStep.key]}…`
			: 'Finalizing analysis…'
		: 'Analysis complete'

	return (
		<div className='rounded-[28px] bg-white/[0.03] p-5'>
			<div className='flex items-center gap-3'>
				<div
					className={cn(
						'flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl',
						isActive ? 'bg-[#e7c35a]/10' : 'bg-emerald-400/10',
					)}>
					{isActive ? (
						<Loader2 className='h-4 w-4 animate-spin text-[#e7c35a]' />
					) : (
						<CheckCircle2 className='h-4 w-4 text-emerald-400' />
					)}
				</div>
				<p
					className={cn(
						'text-sm font-medium',
						isActive ? 'text-[#e7c35a]' : 'text-white/80',
					)}>
					{headerLabel}
				</p>
			</div>
			<ol className='mt-4 grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-6'>
				{steps.map((stepState) => {
					const isSkipped = stepState.state === 'skipped'
					const label = isSkipped
						? stageUnavailableLabels[stepState.key] ??
							`${stageStepLabels[stepState.key]} — skipped`
						: stageStepLabels[stepState.key]
					return (
						<li key={stepState.key} className='min-w-0'>
							<div
								className={cn(
									'h-1.5 rounded-full',
									isSkipped && 'border border-dashed border-white/20',
								)}
								style={{
									backgroundColor: isSkipped
										? 'transparent'
										: stepState.state === 'done'
											? 'rgba(74, 222, 128, 0.65)'
											: stepState.state === 'active'
												? 'rgba(231, 195, 90, 0.85)'
												: 'rgba(255, 255, 255, 0.06)',
								}}
							/>
							<p
								className={cn(
									'mt-2 truncate text-[0.7rem] leading-4',
									stepState.state === 'done' && 'text-white/70',
									stepState.state === 'active' && 'font-medium text-[#e7c35a]',
									stepState.state === 'skipped' && 'text-white/35',
									stepState.state === 'pending' && 'text-white/30',
								)}
								title={label}>
								{stepState.state === 'active' && isActive && (
									<span className='mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#e7c35a] align-middle' />
								)}
								{label}
							</p>
						</li>
					)
				})}
			</ol>
		</div>
	)
}

const AnalysisIdleState = ({
	project,
	onStart,
	isStarting,
	actionError,
}: {
	project: ApiProject
	onStart: () => void
	isStarting: boolean
	actionError: string | null
}) => {
	if (project.analysisStatus !== 'IDLE') return null

	return (
		<div className='rounded-[28px] bg-white/[0.03] p-5'>
			<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<p className='text-sm font-semibold text-white'>
						{project.paperUrl ? 'Analysis is ready to start' : 'Paper upload is missing'}
					</p>
					<p className='mt-1 max-w-2xl text-xs leading-6 text-white/45'>
						{project.paperUrl
							? 'Start the AI pipeline to generate the paper readout, TRL/IRL score, and commercialization evidence.'
							: 'This draft exists, but no paper is attached yet. Create a new project with a paper upload to run analysis.'}
					</p>
					{actionError && (
						<p className='mt-2 text-xs leading-5 text-red-400'>{actionError}</p>
					)}
				</div>
				{project.paperUrl ? (
					<Button
						type='button'
						onClick={onStart}
						disabled={isStarting}
						className='h-10 rounded-full bg-white px-4 text-xs font-semibold text-black hover:bg-white/90 disabled:opacity-50'>
						{isStarting ? (
							<Loader2 className='mr-2 h-3.5 w-3.5 animate-spin' />
						) : (
							<Sparkles className='mr-2 h-3.5 w-3.5' />
						)}
						Start analysis
					</Button>
				) : (
					<Button
						asChild
						className='h-10 rounded-full bg-white px-4 text-xs font-semibold text-black hover:bg-white/90'>
						<Link href='/app/projects/new'>Create with paper</Link>
					</Button>
				)}
			</div>
		</div>
	)
}

const StagePendingState = ({ label }: { label: string }) => (
	<div className='flex flex-col items-center justify-center rounded-[28px] bg-white/[0.03] px-6 py-12 text-center'>
		<div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7c35a]/10'>
			<Loader2 className='h-5 w-5 animate-spin text-[#e7c35a]' />
		</div>
		<p className='mt-4 text-sm font-semibold text-white'>{label}</p>
		<p className='mt-2 max-w-sm text-xs leading-6 text-white/45'>
			This section will fill in automatically while the analysis pipeline runs.
		</p>
	</div>
)

const renderEvidenceTable = (
	evidence: EvidenceItem[],
	onOpenDetail: (item: EvidenceItem) => void,
) => {
	if (!evidence.length) {
		return (
			<div className='rounded-[26px] bg-white/[0.03] px-5 py-10 text-center text-sm text-white/48'>
				No evidence rows are attached to this stage yet.
			</div>
		)
	}

	return (
		<div className='overflow-hidden rounded-[26px] bg-black/25'>
			<div className='overflow-x-auto'>
				<table className='min-w-full text-left text-sm'>
					<thead className='bg-white/[0.04] text-[0.68rem] uppercase tracking-[0.22em] text-white/40'>
						<tr>
							<th className='px-4 py-3 font-medium'>Claim</th>
							<th className='px-4 py-3 font-medium'>Source</th>
							<th className='px-4 py-3 font-medium'>Confidence</th>
							<th className='px-4 py-3 font-medium'>Action</th>
						</tr>
					</thead>
					<tbody className='bg-black/20'>
						{evidence.map((item) => (
							<tr key={item.id}>
								<td className='px-4 py-4 text-white/82'>{item.claim}</td>
								<td className='px-4 py-4 text-white/55'>
									<div className='font-medium text-white/72'>{item.sourceTitle}</div>
									<div className='mt-1 text-xs uppercase tracking-[0.16em] text-white/35'>
										{item.sourceType}
									</div>
								</td>
								<td className='px-4 py-4 text-white/60'>{item.confidence}</td>
								<td className='px-4 py-4'>
									<button
										type='button'
										onClick={() => onOpenDetail(item)}
										className='inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white/72 transition-colors hover:bg-white/[0.12]'>
										Open
										<ChevronRight className='h-3.5 w-3.5' />
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}

const ComingSoon = ({ label }: { label: string }) => (
	<div className='flex flex-col items-center justify-center rounded-[28px] bg-white/[0.03] px-6 py-16 text-center'>
		<div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06]'>
			<Clock className='h-6 w-6 text-white/40' />
		</div>
		<h3 className='mt-5 text-lg font-semibold text-white'>{label}</h3>
		<p className='mt-2 max-w-md text-sm leading-6 text-white/45'>
			This agent is being built. Results for this stage will appear here once the pipeline is extended.
		</p>
	</div>
)

const sourceDomain = (url: string) => {
	try {
		return new URL(url).hostname.replace(/^www\./, '')
	} catch {
		return url.replace(/^https?:\/\//, '').split('/')[0]
	}
}

// Visible grounding: a small external-link chip showing the source domain.
const SourceLink = ({ url }: { url: string }) => (
	<a
		href={url}
		target='_blank'
		rel='noreferrer'
		className='inline-flex items-center gap-1.5 text-[0.7rem] font-medium text-[#7281ff] transition-colors hover:text-white'>
		<ExternalLink className='h-3 w-3' />
		{sourceDomain(url)}
	</a>
)

// Confidence / impact chip tone (high·medium·low / High·Medium·Watch).
const confidenceTone = (level: string) => {
	const l = level.toLowerCase()
	if (l === 'high') return 'bg-emerald-400/10 text-emerald-300'
	if (l === 'medium') return 'bg-amber-400/10 text-amber-300'
	if (l === 'low' || l === 'watch') return 'bg-red-400/10 text-red-300'
	return 'bg-white/[0.06] text-white/60'
}

// Market was skipped (enrichment, not failure) — distinct from ComingSoon.
const MarketUnavailable = () => (
	<div className='flex items-start gap-4 rounded-[28px] border border-white/10 bg-white/[0.02] p-6'>
		<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.05]'>
			<FolderSearch2 className='h-5 w-5 text-white/40' />
		</div>
		<div className='min-w-0'>
			<p className='text-sm font-medium text-white/75'>
				Market analysis unavailable — insufficient grounded sources
			</p>
			<p className='mt-1.5 text-xs leading-5 text-white/45'>
				The market stage was skipped rather than report figures without a verifiable source. Other stages are unaffected.
			</p>
		</div>
	</div>
)

// ─── Main component ──────────────────────────────────────────────────────────

const ProjectWorkspace = ({ projectId }: { projectId: string }) => {
	const [project, setProject] = useState<ApiProject | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [actionError, setActionError] = useState<string | null>(null)
	const [isStartingAnalysis, setIsStartingAnalysis] = useState(false)
	const [activeStage, setActiveStage] = useState<StageKey>('PAPER')
	const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('summary')
	const [detailState, setDetailState] = useState<DetailState>(null)

	const hasInitialLoad = useRef(false)

	const fetchProject = useCallback(async () => {
		try {
			const res = await fetch(`/api/projects/${projectId}`)
			if (!res.ok) {
				if (res.status === 404) {
					setError('not-found')
				} else {
					setError('Failed to load project')
				}
				return
			}
			const data: ApiProject = await res.json()
			setProject({ ...data, stages: sortStages(data.stages) })
			setError(null)

			// Set the active stage to the current one on first load only
			if (!hasInitialLoad.current) {
				setActiveStage(data.currentStage)
				hasInitialLoad.current = true
			}
		} catch {
			setError('Failed to load project')
		} finally {
			setIsLoading(false)
		}
	}, [projectId]) // stable — no `project` dep

	// Initial fetch
	useEffect(() => {
		fetchProject()
	}, [fetchProject])

	// Poll every 5s while analysis is processing.
	// Uses a lightweight status endpoint to avoid firing 17+ queries per tick.
	useEffect(() => {
		if (project?.analysisStatus !== 'PROCESSING') return

		const tick = async () => {
			try {
				const res = await fetch(`/api/projects/${projectId}/status`)
				if (!res.ok) return
				const status: Pick<ApiProject, 'analysisStatus' | 'analysisError' | 'stages' | 'currentStage' | 'readinessScore'> = await res.json()
				setProject((prev) => prev ? { ...prev, ...status, stages: sortStages(status.stages) } : prev)
				// Full refresh when analysis completes so all agent data loads
				if (status.analysisStatus !== 'PROCESSING') {
					fetchProject()
				}
			} catch {
				// ignore transient polling errors
			}
		}

		const interval = setInterval(tick, 5000)
		return () => clearInterval(interval)
	}, [project?.analysisStatus, projectId, fetchProject])

	useEffect(() => {
		setWorkspaceTab('summary')
	}, [activeStage])

	const handleStartAnalysis = useCallback(async () => {
		if (!project || !project.paperUrl || isStartingAnalysis) return

		setActionError(null)
		setIsStartingAnalysis(true)
		try {
			const res = await fetch(`/api/projects/${project.id}/analyze`, {
				method: 'POST',
			})
			if (!res.ok) {
				const data = await res.json().catch(() => null)
				throw new Error(data?.error ?? 'Failed to start analysis')
			}
			setProject((current) =>
				current
					? {
							...current,
							analysisStatus: 'PROCESSING',
							analysisError: null,
						}
					: current,
			)
			await fetchProject()
		} catch (err) {
			setActionError(err instanceof Error ? err.message : 'Failed to start analysis')
		} finally {
			setIsStartingAnalysis(false)
		}
	}, [fetchProject, isStartingAnalysis, project])

	const activeStageMeta = project?.stages.find((s) => s.key === activeStage)

	const stageEvidence = useMemo(
		() => project?.evidence.filter((e) => e.stageKey === activeStage) ?? [],
		[activeStage, project],
	)

	const stageNotes = useMemo(
		() => project?.reviewNotes.filter((n) => n.stageKey === activeStage) ?? [],
		[activeStage, project],
	)

	// ── Loading state ─────────────────────────────────────────────────
	if (isLoading) {
		return (
			<div className='flex min-h-[60vh] items-center justify-center rounded-[34px] bg-white/[0.03]'>
				<div className='flex items-center gap-3 text-white/65'>
					<Loader2 className='h-5 w-5 animate-spin' />
					<span>Loading workspace</span>
				</div>
			</div>
		)
	}

	// ── Error / not found ─────────────────────────────────────────────
	if (error || !project || !activeStageMeta) {
		return (
			<div className='mx-auto max-w-3xl rounded-[34px] bg-white/[0.03] px-6 py-16 text-center'>
				<div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] text-white/70'>
					<AlertTriangle className='h-6 w-6' />
				</div>
				<h1 className='mt-5 text-3xl font-semibold tracking-[-0.04em] text-white'>
					Project not found
				</h1>
				<p className='mt-3 text-sm leading-7 text-white/52'>
					This project may have been deleted or you may not have access.
				</p>
				<Button
					asChild
					className='mt-6 h-12 rounded-full bg-white px-5 text-sm font-semibold text-black hover:bg-white/92'>
					<Link href='/app'>
						Back to projects
						<ArrowRight className='ml-2 h-4 w-4' />
					</Link>
				</Button>
			</div>
		)
	}

	const StageIcon = stageIcons[activeStage]

	// ── Stage summaries ───────────────────────────────────────────────

	const renderPaperSummary = () => {
		if (!project.paper) {
			return project.analysisStatus === 'PROCESSING' ? (
				<StagePendingState label='Paper analysis is running' />
			) : (
				<ComingSoon label='Paper analysis pending' />
			)
		}

		const { paper } = project
		const badge = paper.methodologyStrength
			? methodologyBadge[paper.methodologyStrength]
			: null

		return (
			<div className='space-y-5'>
				<SurfaceCard
					title='Research abstract'
					description='Structured paper readout that the commercialization workflow starts from.'>
					<p className='max-w-4xl text-sm leading-7 text-white/72'>
						{paper.abstractSummary}
					</p>
				</SurfaceCard>

				<div className='grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]'>
					<SurfaceCard
						title='Novelty and commercialization wedge'
						description='The technical edge tied to why the project may matter commercially.'>
						<p className='text-sm leading-7 text-white/72'>{paper.noveltySummary}</p>
					</SurfaceCard>
					<SurfaceCard title='Domain classification'>
						<p className='text-sm leading-7 text-white/72'>
							{paper.domainClassification}
						</p>
						{badge && (
							<span
								className={cn(
									'mt-3 inline-flex rounded-full px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.18em]',
									badge.className,
								)}>
								{badge.label}
							</span>
						)}
					</SurfaceCard>
				</div>

				<SurfaceCard title='Key claims'>
					<ul className='space-y-3'>
						{paper.keyClaims.map((claim, i) => (
							<li
								key={i}
								className='flex items-start gap-3 rounded-2xl bg-black/25 px-4 py-4 text-sm leading-7 text-white/70'>
								<CheckCircle2 className='mt-1 h-4 w-4 shrink-0 text-[#68cc58]' />
								<span>{claim}</span>
							</li>
						))}
					</ul>
				</SurfaceCard>

				{paper.claimConfidence && paper.claimConfidence.length > 0 && (
					<SurfaceCard
						title='Claim confidence'
						description='Per-claim confidence with reasoning from the paper analysis agent.'>
						<div className='overflow-hidden rounded-[24px] bg-black/25'>
							<div className='overflow-x-auto'>
								<table className='min-w-full text-left text-sm'>
									<thead className='bg-white/[0.04] text-[0.68rem] uppercase tracking-[0.22em] text-white/40'>
										<tr>
											<th className='px-4 py-3 font-medium'>Claim</th>
											<th className='px-4 py-3 font-medium'>Confidence</th>
											<th className='px-4 py-3 font-medium'>Reasoning</th>
										</tr>
									</thead>
									<tbody className='bg-black/20'>
										{paper.claimConfidence.map((c, i) => (
											<tr key={i}>
												<td className='px-4 py-4 text-white/82'>{c.claim}</td>
												<td className='px-4 py-4'>
													<span
														className={cn(
															'inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.16em]',
															c.confidence === 'High'
																? 'bg-emerald-400/10 text-emerald-300'
																: c.confidence === 'Medium'
																	? 'bg-amber-400/10 text-amber-300'
																	: 'bg-red-400/10 text-red-300',
														)}>
														{c.confidence}
													</span>
												</td>
												<td className='px-4 py-4 text-white/55'>{c.reasoning}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</SurfaceCard>
				)}

				{paper.commercializationBarriers.length > 0 && (
					<SurfaceCard
						title='Commercialization barriers'
						description='Key obstacles identified before this research can reach market.'>
						<ul className='space-y-3'>
							{paper.commercializationBarriers.map((barrier, i) => (
								<li
									key={i}
									className='flex items-start gap-3 rounded-2xl bg-[#e7c35a]/10 px-4 py-4 text-sm leading-7 text-[#f3db90]'>
									<AlertTriangle className='mt-1 h-4 w-4 shrink-0' />
									<span>{barrier}</span>
								</li>
							))}
						</ul>
					</SurfaceCard>
				)}

				{paper.institutionContext && (
					<SurfaceCard title='Institution context'>
						<p className='text-sm leading-7 text-white/72'>
							{paper.institutionContext}
						</p>
					</SurfaceCard>
				)}
			</div>
		)
	}

	const renderTrlIrlSummary = () => {
		if (!project.trlIrl) {
			return project.analysisStatus === 'PROCESSING' ? (
				<StagePendingState label='TRL / IRL scoring is running' />
			) : (
				<ComingSoon label='TRL / IRL scoring pending' />
			)
		}

		const { trlIrl } = project

		return (
			<div className='space-y-5'>
				<div className='grid gap-4 md:grid-cols-3'>
					<div className='rounded-[28px] bg-black/25 p-5'>
						<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
							TRL score
						</p>
						<p className='mt-3 text-3xl font-semibold text-white'>{trlIrl.trlScore}</p>
					</div>
					<div className='rounded-[28px] bg-black/25 p-5'>
						<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
							IRL score
						</p>
						<p className='mt-3 text-3xl font-semibold text-white'>{trlIrl.irlScore}</p>
					</div>
					<div className='rounded-[28px] bg-black/25 p-5'>
						<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
							Confidence
						</p>
						<p className='mt-3 text-sm leading-7 text-white/72'>{trlIrl.confidence}</p>
					</div>
				</div>

				{trlIrl.commercializationPathway && (
					<div className='grid gap-4 md:grid-cols-2'>
						<SurfaceCard title='Commercialization pathway'>
							<span className='inline-flex items-center gap-2 rounded-full bg-[#e7c35a]/10 px-3 py-1.5 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-[#f6df9d]'>
								<TrendingUp className='h-3.5 w-3.5' />
								{trlIrl.commercializationPathway.replace(/_/g, ' ')}
							</span>
							{trlIrl.pathwayRationale && (
								<p className='mt-4 text-sm leading-7 text-white/68'>
									{trlIrl.pathwayRationale}
								</p>
							)}
						</SurfaceCard>
						<div className='space-y-4'>
							{trlIrl.timeToMarket && (
								<div className='rounded-[28px] bg-black/25 p-5'>
									<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
										Time to market
									</p>
									<p className='mt-3 text-sm leading-7 text-white/72'>
										{trlIrl.timeToMarket}
									</p>
								</div>
							)}
							{trlIrl.domainRubricApplied && (
								<div className='rounded-[28px] bg-black/25 p-5'>
									<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
										Domain rubric
									</p>
									<p className='mt-3 text-sm leading-7 text-white/72'>
										{trlIrl.domainRubricApplied}
									</p>
								</div>
							)}
						</div>
					</div>
				)}

				<SurfaceCard title='Scoring rationale'>
					<ul className='space-y-3'>
						{trlIrl.rationale.map((reason, i) => (
							<li
								key={i}
								className='rounded-2xl bg-black/25 px-4 py-4 text-sm leading-7 text-white/70'>
								{reason}
							</li>
						))}
					</ul>
				</SurfaceCard>

				<SurfaceCard
					title='Risk flags'
					description='Watch-outs that keep the score from being interpreted too optimistically.'>
					<ul className='space-y-3'>
						{trlIrl.riskFlags.map((flag, i) => (
							<li
								key={i}
								className='flex items-start gap-3 rounded-2xl bg-[#e7c35a]/10 px-4 py-4 text-sm leading-7 text-[#f3db90]'>
								<AlertTriangle className='mt-1 h-4 w-4 shrink-0' />
								<span>{flag}</span>
							</li>
						))}
					</ul>
				</SurfaceCard>

				{trlIrl.recommendedGrants.length > 0 && (
					<SurfaceCard title='Recommended grants'>
						<ul className='space-y-3'>
							{trlIrl.recommendedGrants.map((grant, i) => (
								<li
									key={i}
									className='flex items-start gap-3 rounded-2xl bg-black/25 px-4 py-4 text-sm leading-7 text-white/70'>
									<Sparkles className='mt-1 h-4 w-4 shrink-0 text-[#e7c35a]' />
									<span>{grant}</span>
								</li>
							))}
						</ul>
					</SurfaceCard>
				)}
			</div>
		)
	}

	// ── Market ────────────────────────────────────────────────────────
	const renderMarketSummary = () => {
		if (!project.market) {
			return project.analysisStatus === 'PROCESSING' ? (
				<StagePendingState label='Market intelligence is running' />
			) : (
				<MarketUnavailable />
			)
		}

		const { market, competitors, marketSignals } = project
		const figures = [
			{ label: 'TAM', value: market.tam, src: market.tamSourceUrl },
			{ label: 'SAM', value: market.sam, src: market.samSourceUrl },
			{ label: 'SOM', value: market.som, src: market.somSourceUrl },
		]

		return (
			<div className='space-y-5'>
				<div className='grid gap-4 md:grid-cols-3'>
					{figures.map((item) => (
						<div key={item.label} className='rounded-[28px] bg-black/25 p-5'>
							<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
								{item.label}
							</p>
							<p className='mt-3 text-2xl font-semibold text-white'>{item.value}</p>
							{item.src && (
								<div className='mt-3 border-t border-white/[0.06] pt-3'>
									<SourceLink url={item.src} />
								</div>
							)}
						</div>
					))}
				</div>

				<SurfaceCard title='Market summary'>
					<p className='max-w-4xl text-sm leading-7 text-white/72'>{market.summary}</p>
				</SurfaceCard>

				{competitors.length > 0 && (
					<SurfaceCard
						title='Competitive landscape'
						description='Companies and signals found in the retrieved sources.'>
						<ul className='space-y-3'>
							{competitors.map((c) => (
								<li key={c.id} className='rounded-2xl bg-black/25 px-4 py-4'>
									<div className='flex flex-wrap items-center justify-between gap-2'>
										<p className='text-sm font-medium text-white/85'>{c.name}</p>
										<span className='inline-flex rounded-full bg-white/[0.06] px-2.5 py-1 text-[0.66rem] font-medium uppercase tracking-[0.16em] text-white/55'>
											{c.stage}
										</span>
									</div>
									<p className='mt-2 text-sm leading-6 text-white/65'>{c.positioning}</p>
									<p className='mt-1 text-sm leading-6 text-white/50'>{c.signal}</p>
									{c.sourceUrl && (
										<div className='mt-3'>
											<SourceLink url={c.sourceUrl} />
										</div>
									)}
								</li>
							))}
						</ul>
					</SurfaceCard>
				)}

				{marketSignals.length > 0 && (
					<SurfaceCard
						title='Market signals'
						description='Funding, patent, demand, and policy signals with their sources.'>
						<ul className='space-y-3'>
							{marketSignals.map((s) => (
								<li key={s.id} className='rounded-2xl bg-black/25 px-4 py-4'>
									<div className='flex flex-wrap items-center gap-2'>
										<span className='inline-flex rounded-full bg-white/[0.06] px-2.5 py-1 text-[0.66rem] font-medium uppercase tracking-[0.16em] text-white/55'>
											{s.type}
										</span>
										<span
											className={cn(
												'inline-flex rounded-full px-2.5 py-1 text-[0.66rem] font-medium uppercase tracking-[0.16em]',
												confidenceTone(s.impact),
											)}>
											{s.impact}
										</span>
									</div>
									<p className='mt-2 text-sm font-medium text-white/85'>{s.title}</p>
									<p className='mt-1 text-sm leading-6 text-white/60'>{s.summary}</p>
									{s.sourceUrl && (
										<div className='mt-3'>
											<SourceLink url={s.sourceUrl} />
										</div>
									)}
								</li>
							))}
						</ul>
					</SurfaceCard>
				)}
			</div>
		)
	}

	// ── Feasibility ───────────────────────────────────────────────────
	const renderFeasibilitySummary = () => {
		if (!project.feasibility) {
			return project.analysisStatus === 'PROCESSING' ? (
				<StagePendingState label='Feasibility analysis is running' />
			) : (
				<ComingSoon label='Feasibility agent' />
			)
		}

		const { feasibility } = project
		const timeline = feasibility.timelineDetail
		const capital = feasibility.capitalDetail
		const timelineLabel = timeline
			? `${timeline.minMonths}–${timeline.maxMonths} months · ${timeline.confidence} confidence`
			: feasibility.timeline
		const capitalLabel = capital
			? `${formatCurrencyInText(`₹${capital.minINR}-${capital.maxINR}`)} · ${capital.confidence} confidence`
			: feasibility.capitalEstimate

		return (
			<div className='space-y-5'>
				<div className='grid gap-4 md:grid-cols-2'>
					<div className='rounded-[28px] bg-black/25 p-5'>
						<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>Timeline</p>
						<p className='mt-3 text-xl font-semibold text-white'>{timelineLabel}</p>
						{timeline?.reasoning && (
							<p className='mt-2 text-sm leading-6 text-white/55'>{timeline.reasoning}</p>
						)}
					</div>
					<div className='rounded-[28px] bg-black/25 p-5'>
						<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
							Capital estimate
						</p>
						<p className='mt-3 text-xl font-semibold text-white'>{capitalLabel}</p>
						{capital?.reasoning && (
							<p className='mt-2 text-sm leading-6 text-white/55'>{capital.reasoning}</p>
						)}
					</div>
				</div>

				{feasibility.overallConfidence && (
					<SurfaceCard title='Overall confidence'>
						<span
							className={cn(
								'inline-flex rounded-full px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.18em]',
								confidenceTone(feasibility.overallConfidence),
							)}>
							{feasibility.overallConfidence} confidence
						</span>
						{feasibility.confidenceReasoning && (
							<p className='mt-4 text-sm leading-7 text-white/68'>
								{feasibility.confidenceReasoning}
							</p>
						)}
					</SurfaceCard>
				)}

				{capital?.majorCostDrivers && capital.majorCostDrivers.length > 0 && (
					<SurfaceCard title='Major cost drivers'>
						<ul className='space-y-3'>
							{capital.majorCostDrivers.map((driver, i) => (
								<li
									key={i}
									className='flex items-start gap-3 rounded-2xl bg-black/25 px-4 py-4 text-sm leading-6 text-white/70'>
									<TrendingUp className='mt-0.5 h-4 w-4 shrink-0 text-[#e7c35a]' />
									<span>{driver}</span>
								</li>
							))}
						</ul>
					</SurfaceCard>
				)}

				{feasibility.teamMatrix && feasibility.teamMatrix.length > 0 ? (
					<SurfaceCard
						title='Team matrix'
						description='The critical roles to execute, each traced to the analysis.'>
						<ul className='space-y-3'>
							{feasibility.teamMatrix.map((role, i) => (
								<li key={i} className='rounded-2xl bg-black/25 px-4 py-4'>
									<div className='flex flex-wrap items-center justify-between gap-2'>
										<p className='text-sm font-medium text-white/85'>{role.role}</p>
										<span className='inline-flex rounded-full bg-white/[0.06] px-2.5 py-1 text-[0.66rem] font-medium uppercase tracking-[0.16em] text-white/55'>
											{role.seniority}
										</span>
									</div>
									<p className='mt-1.5 text-sm font-medium text-[#f6df9d]'>
										{role.domainExpertise}
									</p>
									<p className='mt-2 text-sm leading-6 text-white/55'>{role.rationale}</p>
								</li>
							))}
						</ul>
					</SurfaceCard>
				) : (
					feasibility.teamRequirements.length > 0 && (
						<SurfaceCard title='Team requirements'>
							<ul className='space-y-3'>
								{feasibility.teamRequirements.map((req, i) => (
									<li
										key={i}
										className='rounded-2xl bg-black/25 px-4 py-4 text-sm leading-6 text-white/70'>
										{req}
									</li>
								))}
							</ul>
						</SurfaceCard>
					)
				)}

				{feasibility.keyRisks.length > 0 && (
					<SurfaceCard
						title='Key risks'
						description='Technical and execution risks derived from the TRL gap.'>
						<ul className='space-y-3'>
							{feasibility.keyRisks.map((risk, i) => (
								<li
									key={i}
									className='flex items-start gap-3 rounded-2xl bg-[#e7c35a]/10 px-4 py-4 text-sm leading-7 text-[#f3db90]'>
									<AlertTriangle className='mt-1 h-4 w-4 shrink-0' />
									<span>{risk}</span>
								</li>
							))}
						</ul>
					</SurfaceCard>
				)}

				{feasibility.grantFit && (
					<SurfaceCard title='Grant fit'>
						<p className='text-sm leading-7 text-white/72'>{feasibility.grantFit}</p>
					</SurfaceCard>
				)}
			</div>
		)
	}

	// ── Deck ──────────────────────────────────────────────────────────
	const renderDeckSummary = () => {
		if (!project.deck && project.deckSlides.length === 0) {
			return project.analysisStatus === 'PROCESSING' ? (
				<StagePendingState label='Pitch deck is being assembled' />
			) : (
				<ComingSoon label='Deck generation agent' />
			)
		}

		const { deck, deckSlides } = project

		return (
			<div className='space-y-5'>
				{deck?.fundingAsk && (
					<SurfaceCard title='Funding ask'>
						<p className='max-w-4xl text-sm leading-7 text-white/72'>{deck.fundingAsk}</p>
					</SurfaceCard>
				)}

				{deck?.keyNarrativePoints && deck.keyNarrativePoints.length > 0 && (
					<SurfaceCard title='Narrative points'>
						<ul className='space-y-3'>
							{deck.keyNarrativePoints.map((point, i) => (
								<li
									key={i}
									className='flex items-start gap-3 rounded-2xl bg-black/25 px-4 py-4 text-sm leading-7 text-white/70'>
									<Sparkles className='mt-1 h-4 w-4 shrink-0 text-[#e7c35a]' />
									<span>{point}</span>
								</li>
							))}
						</ul>
					</SurfaceCard>
				)}

				{deckSlides.length > 0 && (
					<SurfaceCard
						title='Deck outline'
						description='Generated slides — each factual claim is traced to its upstream source.'>
						<ol className='space-y-3'>
							{deckSlides.map((slide) => {
								const sources = (slide.factRefs ?? []).filter((f) => f.sourceUrl)
								return (
									<li key={slide.id} className='rounded-2xl bg-black/25 px-4 py-4'>
										<div className='flex items-center gap-3'>
											<span className='inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[0.7rem] font-semibold text-white/55'>
												{slide.order}
											</span>
											{slide.slideType && (
												<span className='inline-flex rounded-full bg-fuchsia-400/10 px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-fuchsia-200'>
													{slide.slideType}
												</span>
											)}
										</div>
										<p className='mt-2.5 text-sm font-medium text-white/85'>{slide.title}</p>
										<p className='mt-1 text-sm leading-6 text-white/60'>{slide.keyPoint}</p>
										{sources.length > 0 && (
											<div className='mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-white/[0.06] pt-3'>
												{sources.map((s, i) => (
													<SourceLink key={i} url={s.sourceUrl} />
												))}
											</div>
										)}
									</li>
								)
							})}
						</ol>
					</SurfaceCard>
				)}
			</div>
		)
	}

	// ── Review ────────────────────────────────────────────────────────
	const renderReviewSummary = () => {
		if (!project.review) {
			return project.analysisStatus === 'PROCESSING' ? (
				<StagePendingState label='Review preparation is running' />
			) : (
				<ComingSoon label='Review agent' />
			)
		}

		const { review } = project

		return (
			<div className='space-y-5'>
				<div className='grid gap-4 md:grid-cols-2'>
					<div className='rounded-[28px] bg-black/25 p-5'>
						<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
							Review status
						</p>
						<p className='mt-3 text-lg font-semibold text-white'>{review.status}</p>
					</div>
					<div className='rounded-[28px] bg-black/25 p-5'>
						<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
							Export readiness
						</p>
						<p className='mt-3 text-lg font-semibold text-white'>{review.exportReadiness}</p>
					</div>
				</div>

				{review.approvalChecklist.length > 0 && (
					<SurfaceCard
						title='Approval checklist'
						description='What committee review needs before export.'>
						<ul className='space-y-3'>
							{review.approvalChecklist.map((item, i) => (
								<li
									key={i}
									className='flex items-start gap-3 rounded-2xl bg-black/25 px-4 py-4 text-sm leading-7 text-white/70'>
									<CheckCircle2 className='mt-1 h-4 w-4 shrink-0 text-[#68cc58]' />
									<span>{item}</span>
								</li>
							))}
						</ul>
					</SurfaceCard>
				)}
			</div>
		)
	}

	const renderSummary = () => {
		switch (activeStage) {
			case 'PAPER':
				return renderPaperSummary()
			case 'TRL_IRL':
				return renderTrlIrlSummary()
			case 'MARKET':
				return renderMarketSummary()
			case 'FEASIBILITY':
				return renderFeasibilitySummary()
			case 'DECK':
				return renderDeckSummary()
			case 'REVIEW':
				return renderReviewSummary()
		}
	}

	return (
		<>
			<section className='space-y-6'>
				{/* ── Hero header ─────────────────────────────────────────── */}
				<div className='overflow-hidden rounded-[34px] bg-[radial-gradient(circle_at_top_left,_rgba(231,195,90,0.08),_transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-6 py-7 sm:px-8'>
					<div className='flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between'>
						<div className='min-w-0 max-w-4xl'>
							<div className='flex flex-wrap items-center gap-2'>
								<span
									className={cn(
										'inline-flex items-center rounded-full px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.18em]',
										stageAccentClasses[activeStage],
									)}>
									<StageIcon className='mr-2 h-3.5 w-3.5' />
									{activeStageMeta.label}
								</span>
								<span className='inline-flex items-center rounded-full bg-white/[0.07] px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-white/55'>
									{project.status}
								</span>
								<span className='inline-flex items-center rounded-full bg-white/[0.07] px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-white/55'>
									Updated {formatDate(project.updatedAt)}
								</span>
							</div>
							<h1 className='mt-4 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl'>
								{project.title}
							</h1>
							<p className='mt-4 max-w-3xl text-sm leading-7 text-white/56 sm:text-base'>
								{project.institution.name} · {project.owner.name ?? project.owner.email}
								{project.readinessScore > 0 && (
									<> · Readiness {project.readinessScore}/100</>
								)}
							</p>
						</div>

						<div className='flex flex-wrap items-center gap-3'>
							<Button
								asChild
								type='button'
								variant='outline'
								className='h-11 rounded-full bg-white/[0.05] px-4 text-white hover:bg-white/[0.08] hover:text-white'>
								<Link href='/app'>Back to portfolio</Link>
							</Button>
							<Button
								asChild
								type='button'
								variant='outline'
								className='h-11 rounded-full bg-white/[0.05] px-4 text-white hover:bg-white/[0.08] hover:text-white'>
								<Link href='/app/projects/new'>New project</Link>
							</Button>
						</div>
					</div>

					{/* ── Stat cards ─────────────────────────────────────── */}
					<div className='mt-6 grid gap-4 lg:grid-cols-4'>
						<div className='rounded-[26px] bg-black/25 p-5'>
							<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
								Readiness score
							</p>
							<p className='mt-3 text-3xl font-semibold text-white'>
								{project.readinessScore}
								<span className='text-base text-white/45'> / 100</span>
							</p>
						</div>
						<div className='rounded-[26px] bg-black/25 p-5'>
							<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
								Domain
							</p>
							<p className='mt-3 text-sm leading-7 text-white/72'>{project.domain}</p>
						</div>
						<div className='rounded-[26px] bg-black/25 p-5'>
							<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
								Institution
							</p>
							<p className='mt-3 text-sm leading-7 text-white/72'>
								{project.institution.name}
							</p>
						</div>
						<div className='rounded-[26px] bg-black/25 p-5'>
							<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
								Analysis
							</p>
							<p className='mt-3 text-sm leading-7 text-white/72'>
								{project.analysisStatus === 'COMPLETE'
									? 'Complete'
									: project.analysisStatus === 'PROCESSING'
										? 'In progress...'
										: project.analysisStatus === 'FAILED'
											? 'Failed'
											: 'Not started'}
							</p>
						</div>
					</div>
				</div>

				{/* ── Analysis progress banner ────────────────────────────── */}
				<AnalysisProgress
					project={project}
					onRetry={handleStartAnalysis}
					isRetrying={isStartingAnalysis}
				/>
				<AnalysisIdleState
					project={project}
					onStart={handleStartAnalysis}
					isStarting={isStartingAnalysis}
					actionError={actionError}
				/>

				{/* ── Stage tabs ──────────────────────────────────────────── */}
				<div className='overflow-x-auto pb-1'>
					<div className='flex min-w-max gap-3'>
						{project.stages.map((stage, index) => {
							const Icon = stageIcons[stage.key]
							const isActive = stage.key === activeStage

							return (
								<button
									key={stage.key}
									type='button'
									onClick={() => setActiveStage(stage.key)}
									className={cn(
										'group w-[220px] rounded-[28px] px-4 py-4 text-left transition-all',
										isActive
											? 'bg-white/[0.07] text-white'
											: 'bg-white/[0.03] text-white/60 hover:bg-white/[0.05] hover:text-white',
									)}>
									<div className='flex items-center justify-between gap-3'>
										<span
											className={cn(
												'inline-flex h-9 w-9 items-center justify-center rounded-xl',
												isActive ? 'bg-white/[0.08]' : 'bg-black/30',
											)}>
											<Icon className='h-4 w-4' />
										</span>
										<span className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
											{stage.status === 'COMPLETE' ? (
												<CheckCircle2 className='inline h-3.5 w-3.5 text-emerald-400' />
											) : (
												`0${index + 1}`
											)}
										</span>
									</div>
									<p className='mt-4 text-base font-semibold'>{stage.label}</p>
									<p className='mt-2 text-sm leading-6 text-white/45 group-hover:text-white/55'>
										{stage.description}
									</p>
								</button>
							)
						})}
					</div>
				</div>

				{/* ── Content area ────────────────────────────────────────── */}
				<div className='space-y-5'>
					<div className='flex flex-wrap gap-2'>
						{(['summary', 'evidence', 'notes'] as WorkspaceTab[]).map((tab) => (
							<button
								key={tab}
								type='button'
								onClick={() => setWorkspaceTab(tab)}
								className={cn(
									'rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] transition-colors',
									workspaceTab === tab
										? 'bg-white/[0.08] text-white'
										: 'bg-white/[0.03] text-white/52 hover:bg-white/[0.06] hover:text-white',
								)}>
								{tab}
							</button>
						))}
					</div>

					<div className='rounded-[32px] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-5 sm:p-6'>
						<div className='pb-5'>
							<div
								className={cn(
									'inline-flex items-center rounded-full px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.18em]',
									stageAccentClasses[activeStage],
								)}>
								<StageIcon className='mr-2 h-3.5 w-3.5' />
								{activeStageMeta.label}
							</div>
							<h2 className='mt-4 text-2xl font-semibold tracking-[-0.03em] text-white'>
								{activeStageMeta.description}
							</h2>
						</div>

						<div className='mt-6'>
							{workspaceTab === 'summary'
								? renderSummary()
								: workspaceTab === 'evidence'
									? renderEvidenceTable(stageEvidence, (item) =>
											setDetailState({ type: 'evidence', item }),
										)
									: stageNotes.length ? (
											<div className='space-y-3'>
												{stageNotes.map((note) => (
													<button
														key={note.id}
														type='button'
														onClick={() =>
															setDetailState({ type: 'review', item: note })
														}
														className='flex w-full items-start justify-between gap-3 rounded-2xl bg-black/25 px-4 py-4 text-left transition-colors hover:bg-white/[0.04]'>
														<div>
															<p className='text-sm font-semibold text-white'>
																{note.author.name ?? note.author.email} ·{' '}
																{note.author.role}
															</p>
															<p className='mt-2 text-sm leading-7 text-white/62'>
																{note.comment}
															</p>
														</div>
														<ChevronRight className='mt-1 h-4 w-4 shrink-0 text-white/35' />
													</button>
												))}
											</div>
										) : (
											<div className='rounded-[26px] bg-white/[0.03] px-5 py-10 text-center text-sm text-white/48'>
												No reviewer notes are attached to this stage yet.
											</div>
										)}
						</div>
					</div>
				</div>
			</section>

			{/* ── Detail drawer ───────────────────────────────────────────── */}
			<Dialog
				open={Boolean(detailState)}
				onOpenChange={(open) => {
					if (!open) setDetailState(null)
				}}>
				<DialogContent className='!left-auto !right-0 !top-0 !h-dvh !max-h-dvh !w-[min(560px,100vw)] !max-w-none !translate-x-0 !translate-y-0 rounded-none bg-[#0a0b0e] p-0 text-white'>
					<div className='flex h-full flex-col'>
						<DialogHeader className='px-6 py-6 text-left'>
							<DialogTitle className='text-2xl font-semibold tracking-[-0.03em] text-white'>
								{detailState?.type === 'evidence'
									? 'Evidence detail'
									: 'Reviewer note'}
							</DialogTitle>
							<DialogDescription className='mt-2 text-sm leading-6 text-white/48'>
								{detailState?.type === 'evidence'
									? 'Inspect the supporting source behind the current stage.'
									: 'Inspect reviewer context and resolution status.'}
							</DialogDescription>
						</DialogHeader>

						<div className='flex-1 space-y-6 overflow-y-auto px-6 py-6'>
							{detailState?.type === 'evidence' ? (
								<>
									<div className='space-y-3'>
										<div className='inline-flex rounded-full bg-white/[0.08] px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em] text-white/50'>
											{detailState.item.sourceType}
										</div>
										<h3 className='text-2xl font-semibold tracking-[-0.03em] text-white'>
											{detailState.item.claim}
										</h3>
										<p className='text-sm leading-7 text-white/58'>
											Source: {detailState.item.sourceTitle}
										</p>
									</div>

									<div className='rounded-[28px] bg-white/[0.04] p-5'>
										<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
											Summary
										</p>
										<p className='mt-3 text-sm leading-7 text-white/72'>
											{detailState.item.summary}
										</p>
									</div>

									<div className='grid gap-4 sm:grid-cols-2'>
										<div className='rounded-[28px] bg-white/[0.04] p-5'>
											<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
												Confidence
											</p>
											<p className='mt-3 text-lg font-semibold text-white'>
												{detailState.item.confidence}
											</p>
										</div>
										<div className='rounded-[28px] bg-white/[0.04] p-5'>
											<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
												Linked stage
											</p>
											<p className='mt-3 text-lg font-semibold text-white'>
												{project.stages.find(
													(s) => s.key === detailState.item.stageKey,
												)?.label}
											</p>
										</div>
									</div>
								</>
							) : detailState?.type === 'review' ? (
								<>
									<div className='space-y-3'>
										<div className='inline-flex rounded-full bg-white/[0.08] px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em] text-white/50'>
											{detailState.item.status}
										</div>
										<h3 className='text-2xl font-semibold tracking-[-0.03em] text-white'>
											{detailState.item.author.name ?? detailState.item.author.email}
										</h3>
										<p className='text-sm leading-7 text-white/58'>
											{detailState.item.author.role}
										</p>
									</div>

									<div className='rounded-[28px] bg-white/[0.04] p-5'>
										<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
											Comment
										</p>
										<p className='mt-3 text-sm leading-7 text-white/72'>
											{detailState.item.comment}
										</p>
									</div>
								</>
							) : null}
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}

export default ProjectWorkspace
