'use client'

import Link from 'next/link'
import {
	AlertTriangle,
	ArrowRight,
	CheckCircle2,
	ChevronRight,
	ClipboardCheck,
	FileBarChart2,
	FileText,
	FolderSearch2,
	Loader2,
	SearchCode,
	ShieldCheck,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
	type EvidenceItem,
	type ProjectStageKey,
	type ReviewNote,
	type WorkspaceProject,
	getWorkspaceProjectFromStorage,
} from '@/lib/workspace-data'

type WorkspaceTab = 'summary' | 'evidence' | 'notes'
type DetailState =
	| { type: 'evidence'; item: EvidenceItem }
	| { type: 'review'; item: ReviewNote }
	| null

const stageIcons: Record<ProjectStageKey, React.ComponentType<{ className?: string }>> = {
	paper: FileText,
	'trl-irl': SearchCode,
	market: FolderSearch2,
	feasibility: ClipboardCheck,
	deck: FileBarChart2,
	review: ShieldCheck,
}

const stageAccentClasses: Record<ProjectStageKey, string> = {
	paper: 'text-sky-200 bg-sky-400/10',
	'trl-irl': 'text-violet-200 bg-violet-400/10',
	market: 'text-[#f6df9d] bg-[#e7c35a]/10',
	feasibility: 'text-emerald-200 bg-emerald-400/10',
	deck: 'text-fuchsia-200 bg-fuchsia-400/10',
	review: 'text-white/75 bg-white/[0.06]',
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
}) => {
	return (
		<section
			className={cn(
				'rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-5 sm:p-6',
				className,
			)}>
			<div className='flex flex-wrap items-start justify-between gap-3'>
				<div className='min-w-0'>
					<h3 className='text-lg font-semibold tracking-[-0.02em] text-white'>
						{title}
					</h3>
					{description ? (
						<p className='mt-2 text-sm leading-6 text-white/50'>
							{description}
						</p>
					) : null}
				</div>
			</div>
			<div className='mt-5'>{children}</div>
		</section>
	)
}

const renderEvidenceTable = (
	stageEvidence: EvidenceItem[],
	onOpenDetail: (item: EvidenceItem) => void,
) => {
	if (!stageEvidence.length) {
		return (
			<div className='rounded-[26px] bg-white/[0.03] px-5 py-10 text-center text-sm text-white/48'>
				No source rows are attached to this stage yet.
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
						{stageEvidence.map((item) => (
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

const ProjectWorkspace = ({
	projectId,
	initialProject,
}: {
	projectId: string
	initialProject: WorkspaceProject | null
}) => {
	const [project, setProject] = useState<WorkspaceProject | null>(initialProject)
	const [isResolvingStorage, setIsResolvingStorage] = useState(!initialProject)
	const [activeStage, setActiveStage] = useState<ProjectStageKey>(
		initialProject?.currentStage ?? 'paper',
	)
	const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('summary')
	const [detailState, setDetailState] = useState<DetailState>(null)

	useEffect(() => {
		const storedProject = getWorkspaceProjectFromStorage(projectId)

		if (storedProject) {
			setProject(storedProject)
			setActiveStage(storedProject.currentStage)
		}

		setIsResolvingStorage(false)
	}, [projectId])

	useEffect(() => {
		setWorkspaceTab('summary')
	}, [activeStage])

	const activeStageMeta = project?.stages.find((stage) => stage.key === activeStage)
	const stageEvidence = useMemo(
		() =>
			project?.evidence.filter((item) => item.stageKey === activeStage) ?? [],
		[activeStage, project],
	)
	const stageNotes = useMemo(
		() =>
			project?.review.notes.filter((note) => note.stageKey === activeStage) ?? [],
		[activeStage, project],
	)

	if (isResolvingStorage) {
		return (
			<div className='flex min-h-[60vh] items-center justify-center rounded-[34px] bg-white/[0.03]'>
				<div className='flex items-center gap-3 text-white/65'>
					<Loader2 className='h-5 w-5 animate-spin' />
					<span>Loading workspace</span>
				</div>
			</div>
		)
	}

	if (!project || !activeStageMeta) {
		return (
			<div className='mx-auto max-w-3xl rounded-[34px] bg-white/[0.03] px-6 py-16 text-center'>
				<div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] text-white/70'>
					<AlertTriangle className='h-6 w-6' />
				</div>
				<h1 className='mt-5 text-3xl font-semibold tracking-[-0.04em] text-white'>
					Project not found
				</h1>
				<p className='mt-3 text-sm leading-7 text-white/52'>
					This workspace could not be resolved from the seeded fixtures or local draft storage.
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

	const renderSummary = () => {
		switch (activeStage) {
			case 'paper':
				return (
					<div className='space-y-5'>
						<SurfaceCard
							title='Research abstract'
							description='This is the structured paper readout that the commercialization workflow starts from.'>
							<p className='max-w-4xl text-sm leading-7 text-white/72'>
								{project.paper.abstractSummary}
							</p>
						</SurfaceCard>

						<div className='grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]'>
							<SurfaceCard
								title='Novelty and commercialization wedge'
								description='Lemma keeps the technical edge tied to why the project may matter commercially.'>
								<p className='text-sm leading-7 text-white/72'>
									{project.paper.noveltySummary}
								</p>
							</SurfaceCard>
							<SurfaceCard title='Domain classification'>
								<p className='text-sm leading-7 text-white/72'>
									{project.paper.domainClassification}
								</p>
							</SurfaceCard>
						</div>

						<SurfaceCard title='Key claims'>
							<ul className='space-y-3'>
								{project.paper.keyClaims.map((claim) => (
									<li
										key={claim}
										className='flex items-start gap-3 rounded-2xl bg-black/25 px-4 py-4 text-sm leading-7 text-white/70'>
										<CheckCircle2 className='mt-1 h-4 w-4 shrink-0 text-[#68cc58]' />
										<span>{claim}</span>
									</li>
								))}
							</ul>
						</SurfaceCard>
					</div>
				)
			case 'trl-irl':
				return (
					<div className='space-y-5'>
						<div className='grid gap-4 md:grid-cols-3'>
							<div className='rounded-[28px] bg-black/25 p-5'>
								<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
									TRL score
								</p>
								<p className='mt-3 text-3xl font-semibold text-white'>
									{project.trlIrl.trlScore}
								</p>
							</div>
							<div className='rounded-[28px] bg-black/25 p-5'>
								<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
									IRL score
								</p>
								<p className='mt-3 text-3xl font-semibold text-white'>
									{project.trlIrl.irlScore}
								</p>
							</div>
							<div className='rounded-[28px] bg-black/25 p-5'>
								<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
									Confidence
								</p>
								<p className='mt-3 text-sm leading-7 text-white/72'>
									{project.trlIrl.confidence}
								</p>
							</div>
						</div>

						<SurfaceCard title='Scoring rationale'>
							<ul className='space-y-3'>
								{project.trlIrl.rationale.map((reason) => (
									<li
										key={reason}
										className='rounded-2xl bg-black/25 px-4 py-4 text-sm leading-7 text-white/70'>
										{reason}
									</li>
								))}
							</ul>
						</SurfaceCard>

						<SurfaceCard
							title='Risk flags'
							description='These are the watch-outs that keep the score from being interpreted too optimistically.'>
							<ul className='space-y-3'>
								{project.trlIrl.riskFlags.map((flag) => (
									<li
										key={flag}
										className='flex items-start gap-3 rounded-2xl bg-[#e7c35a]/10 px-4 py-4 text-sm leading-7 text-[#f3db90]'>
										<AlertTriangle className='mt-1 h-4 w-4 shrink-0' />
										<span>{flag}</span>
									</li>
								))}
							</ul>
						</SurfaceCard>
					</div>
				)
			case 'market':
				return (
					<div className='space-y-5'>
						<div className='grid gap-4 md:grid-cols-3'>
							{[
								{ label: 'TAM', value: project.market.tam },
								{ label: 'SAM', value: project.market.sam },
								{ label: 'SOM', value: project.market.som },
							].map((item) => (
								<div
									key={item.label}
									className='rounded-[28px] bg-black/25 p-5'>
									<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
										{item.label}
									</p>
									<p className='mt-3 text-3xl font-semibold text-white'>
										{item.value}
									</p>
								</div>
							))}
						</div>

						<SurfaceCard
							title='Market summary'
							description='The market surface is framed for institutional decision-making, not generic startup theatre.'>
							<p className='max-w-4xl text-sm leading-7 text-white/72'>
								{project.market.summary}
							</p>
						</SurfaceCard>

						<SurfaceCard title='Competitor landscape'>
							<div className='overflow-hidden rounded-[24px] bg-black/25'>
								<div className='overflow-x-auto'>
									<table className='min-w-full text-left text-sm'>
										<thead className='bg-white/[0.04] text-[0.68rem] uppercase tracking-[0.22em] text-white/40'>
											<tr>
												<th className='px-4 py-3 font-medium'>Company</th>
												<th className='px-4 py-3 font-medium'>Positioning</th>
												<th className='px-4 py-3 font-medium'>Stage</th>
												<th className='px-4 py-3 font-medium'>Signal</th>
											</tr>
										</thead>
										<tbody className='bg-black/20'>
											{project.market.competitors.map((competitor) => (
												<tr key={competitor.id}>
													<td className='px-4 py-4 font-medium text-white'>
														{competitor.name}
													</td>
													<td className='px-4 py-4 text-white/62'>
														{competitor.positioning}
													</td>
													<td className='px-4 py-4 text-white/62'>
														{competitor.stage}
													</td>
													<td className='px-4 py-4 text-white/62'>
														{competitor.signal}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						</SurfaceCard>

						<div className='grid gap-4 xl:grid-cols-3'>
							{project.market.signals.map((signal) => (
								<SurfaceCard
									key={signal.id}
									title={signal.title}
									description={`${signal.type} · ${signal.impact} impact`}
									className='h-full'>
									<p className='text-sm leading-7 text-white/68'>
										{signal.summary}
									</p>
								</SurfaceCard>
							))}
						</div>
					</div>
				)
			case 'feasibility':
				return (
					<div className='space-y-5'>
						<div className='grid gap-4 md:grid-cols-3'>
							{[
								{ label: 'Timeline', value: project.feasibility.timeline },
								{
									label: 'Capital estimate',
									value: project.feasibility.capitalEstimate,
								},
								{ label: 'Grant fit', value: project.feasibility.grantFit },
							].map((item) => (
								<div
									key={item.label}
									className='rounded-[28px] bg-black/25 p-5'>
									<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
										{item.label}
									</p>
									<p className='mt-3 text-sm leading-7 text-white/72'>
										{item.value}
									</p>
								</div>
							))}
						</div>

						<div className='grid gap-5 xl:grid-cols-2'>
							<SurfaceCard title='Team requirements'>
								<ul className='space-y-3'>
									{project.feasibility.teamRequirements.map((item) => (
										<li
											key={item}
											className='rounded-2xl bg-black/25 px-4 py-4 text-sm leading-7 text-white/70'>
											{item}
										</li>
									))}
								</ul>
							</SurfaceCard>
							<SurfaceCard title='Key risks'>
								<ul className='space-y-3'>
									{project.feasibility.keyRisks.map((item) => (
										<li
											key={item}
											className='flex items-start gap-3 rounded-2xl bg-[#e7c35a]/10 px-4 py-4 text-sm leading-7 text-[#f3db90]'>
											<AlertTriangle className='mt-1 h-4 w-4 shrink-0' />
											<span>{item}</span>
										</li>
									))}
								</ul>
							</SurfaceCard>
						</div>
					</div>
				)
			case 'deck':
				return (
					<div className='space-y-5'>
						<SurfaceCard
							title='Funding ask'
							description='The ask is tied to the next milestone, not a generic startup round size.'>
							<p className='text-2xl font-semibold tracking-[-0.03em] text-white'>
								{project.deck.fundingAsk}
							</p>
						</SurfaceCard>

						<SurfaceCard title='Key narrative points'>
							<ul className='space-y-3'>
								{project.deck.keyNarrativePoints.map((item) => (
									<li
										key={item}
										className='rounded-2xl bg-black/25 px-4 py-4 text-sm leading-7 text-white/70'>
										{item}
									</li>
								))}
							</ul>
						</SurfaceCard>

						<SurfaceCard title='Slide outline'>
							<div className='overflow-hidden rounded-[24px] bg-black/25'>
								<div className='overflow-x-auto'>
									<table className='min-w-full text-left text-sm'>
										<thead className='bg-white/[0.04] text-[0.68rem] uppercase tracking-[0.22em] text-white/40'>
											<tr>
												<th className='px-4 py-3 font-medium'>Order</th>
												<th className='px-4 py-3 font-medium'>Slide</th>
												<th className='px-4 py-3 font-medium'>Key point</th>
											</tr>
										</thead>
										<tbody className='bg-black/20'>
											{project.deck.slides.map((slide) => (
												<tr key={slide.id}>
													<td className='px-4 py-4 text-white/60'>{slide.order}</td>
													<td className='px-4 py-4 font-medium text-white'>
														{slide.title}
													</td>
													<td className='px-4 py-4 text-white/62'>
														{slide.keyPoint}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						</SurfaceCard>
					</div>
				)
			case 'review':
				return (
					<div className='space-y-5'>
						<div className='grid gap-4 lg:grid-cols-2'>
							<SurfaceCard title='Review status'>
								<p className='text-sm leading-7 text-white/72'>{project.review.status}</p>
							</SurfaceCard>
							<SurfaceCard title='Export readiness'>
								<p className='text-sm leading-7 text-white/72'>
									{project.review.exportReadiness}
								</p>
							</SurfaceCard>
						</div>

						<SurfaceCard title='Approval checklist'>
							<ul className='space-y-3'>
								{project.review.approvalChecklist.map((item) => (
									<li
										key={item}
										className='flex items-start gap-3 rounded-2xl bg-black/25 px-4 py-4 text-sm leading-7 text-white/70'>
										<CheckCircle2 className='mt-1 h-4 w-4 shrink-0 text-[#68cc58]' />
										<span>{item}</span>
									</li>
								))}
							</ul>
						</SurfaceCard>

						<SurfaceCard title='Reviewer notes'>
							<div className='space-y-3'>
								{project.review.notes.map((note) => (
									<button
										key={note.id}
										type='button'
										onClick={() => setDetailState({ type: 'review', item: note })}
										className='flex w-full items-start justify-between gap-3 rounded-2xl bg-black/25 px-4 py-4 text-left transition-colors hover:bg-white/[0.04]'>
										<div>
											<p className='text-sm font-semibold text-white'>
												{note.author} · {note.role}
											</p>
											<p className='mt-2 text-sm leading-7 text-white/62'>
												{note.comment}
											</p>
										</div>
										<ChevronRight className='mt-1 h-4 w-4 shrink-0 text-white/35' />
									</button>
								))}
							</div>
						</SurfaceCard>
					</div>
				)
		}
	}

	return (
		<>
			<section className='space-y-6'>
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
								{project.institution} · {project.lab} · Owner {project.owner}. This project is currently anchored in the {activeStageMeta.label.toLowerCase()} stage and carries a readiness score of {project.readinessScore}/100.
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
							<p className='mt-3 text-sm leading-7 text-white/72'>
								{project.domain}
							</p>
						</div>
						<div className='rounded-[26px] bg-black/25 p-5'>
							<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
								Institution
							</p>
							<p className='mt-3 text-sm leading-7 text-white/72'>
								{project.institution}
							</p>
						</div>
						<div className='rounded-[26px] bg-black/25 p-5'>
							<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
								Next move
							</p>
							<p className='mt-3 text-sm leading-7 text-white/72'>
								{project.shortNote}
							</p>
						</div>
					</div>
				</div>

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
												isActive
													? 'bg-white/[0.08]'
													: 'bg-black/30',
											)}>
											<Icon className='h-4 w-4' />
										</span>
										<span className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
											0{index + 1}
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
																{note.author} · {note.role}
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

			<Dialog
				open={Boolean(detailState)}
				onOpenChange={(open) => {
					if (!open) {
						setDetailState(null)
					}
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
												{
													project.stages.find(
														(stage) => stage.key === detailState.item.stageKey,
													)?.label
												}
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
											{detailState.item.author}
										</h3>
										<p className='text-sm leading-7 text-white/58'>
											{detailState.item.role}
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
