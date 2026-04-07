'use client'

import Link from 'next/link'
import {
	ChevronRight,
	FlaskConical,
	Loader2,
	Plus,
	Sparkles,
	Clock,
	CheckCircle2,
	AlertTriangle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'

type PortfolioProject = {
	id: string
	title: string
	domain: string
	shortNote: string | null
	status: string
	currentStage: string
	readinessScore: number
	analysisStatus: string
	updatedAt: string
	owner: { name: string | null; email: string }
	institution: { name: string }
	stages: Array<{ key: string; label: string; status: string }>
}

const formatUpdatedAt = (value: string) => {
	try {
		return new Intl.DateTimeFormat('en', {
			month: 'short',
			day: 'numeric',
		}).format(new Date(value))
	} catch {
		return value
	}
}

const statusConfig: Record<
	string,
	{ label: string; icon: typeof CheckCircle2; className: string }
> = {
	COMPLETE: {
		label: 'Complete',
		icon: CheckCircle2,
		className: 'text-emerald-400 bg-emerald-400/10',
	},
	PROCESSING: {
		label: 'Analyzing',
		icon: Loader2,
		className: 'text-[#e7c35a] bg-[#e7c35a]/10',
	},
	FAILED: {
		label: 'Failed',
		icon: AlertTriangle,
		className: 'text-red-400 bg-red-400/10',
	},
	IDLE: {
		label: 'Queued',
		icon: Clock,
		className: 'text-white/50 bg-white/[0.06]',
	},
}

const ProjectPortfolio = () => {
	const [projects, setProjects] = useState<PortfolioProject[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		fetch('/api/projects')
			.then((res) => (res.ok ? res.json() : []))
			.then((data) => setProjects(data))
			.catch(() => setProjects([]))
			.finally(() => setIsLoading(false))
	}, [])

	const sortedProjects = useMemo(
		() =>
			[...projects].sort(
				(a, b) =>
					new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
			),
		[projects],
	)

	return (
		<section className='space-y-8'>
			{/* Header */}
			<div className='flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between'>
				<div>
					<p className='text-[0.7rem] uppercase tracking-[0.24em] text-[#e7c35a]'>
						Projects
					</p>
					<h1 className='mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl'>
						Your research portfolio
					</h1>
					<p className='mt-3 max-w-lg text-sm leading-7 text-white/50'>
						Track every paper from upload through commercialization scoring.
						Open a workspace to see the full analysis.
					</p>
				</div>

				<Button
					asChild
					className='h-12 rounded-full bg-white px-5 text-sm font-semibold text-black hover:bg-white/92'>
					<Link href='/app/projects/new'>
						<Plus className='mr-2 h-4 w-4' />
						New project
					</Link>
				</Button>
			</div>

			{/* Content */}
			{isLoading ? (
				<div className='flex min-h-[30vh] items-center justify-center rounded-[32px] border border-white/[0.04] bg-white/[0.02]'>
					<div className='flex items-center gap-3 text-white/55'>
						<Loader2 className='h-5 w-5 animate-spin' />
						<span className='text-sm'>Loading projects</span>
					</div>
				</div>
			) : sortedProjects.length ? (
				<div className='space-y-3'>
					{sortedProjects.map((project) => {
						const currentStage = project.stages.find(
							(s) => s.key === project.currentStage,
						)
						const completedStages = project.stages.filter(
							(s) => s.status === 'COMPLETE',
						).length
						const status =
							statusConfig[project.analysisStatus] ?? statusConfig.IDLE
						const StatusIcon = status.icon
						const ownerDisplay =
							project.owner.name ??
							project.owner.email.replace(/@.*/, '')

						return (
							<Link
								key={project.id}
								href={`/app/projects/${project.id}`}
								className='group relative flex flex-col overflow-hidden rounded-[22px] border border-white/[0.04] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] transition-all duration-300 hover:border-white/[0.08] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] sm:flex-row sm:items-center sm:gap-6 sm:pr-5'>
								{/* Left: Main info */}
								<div className='min-w-0 flex-1 p-5 sm:py-5 sm:pl-6'>
									<div className='flex items-center gap-2.5'>
										<div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#e7c35a]/10'>
											<FlaskConical className='h-3.5 w-3.5 text-[#e7c35a]' />
										</div>
										<span className='text-[0.65rem] uppercase tracking-[0.22em] text-white/35'>
											{project.domain}
										</span>
										<span className='text-white/15'>&middot;</span>
										<span className='text-[0.65rem] uppercase tracking-[0.22em] text-white/30'>
											{project.institution.name}
										</span>
									</div>
									<h2 className='mt-2.5 text-[1.05rem] font-semibold leading-snug tracking-[-0.02em] text-white group-hover:text-white'>
										{project.title}
									</h2>
									{project.shortNote && (
										<p className='mt-1.5 line-clamp-1 max-w-2xl text-sm text-white/40'>
											{project.shortNote}
										</p>
									)}
								</div>

								{/* Right: Meta chips */}
								<div className='flex flex-wrap items-center gap-2.5 px-5 pb-5 sm:shrink-0 sm:pb-0'>
									<span
										className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.16em] ${status.className}`}>
										<StatusIcon
											className={`h-3 w-3 ${project.analysisStatus === 'PROCESSING' ? 'animate-spin' : ''}`}
										/>
										{status.label}
									</span>

									<span className='inline-flex items-center rounded-full bg-white/[0.05] px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.16em] text-white/50'>
										{currentStage?.label ?? 'Paper'}
										{completedStages > 0 && (
											<span className='ml-1.5 text-white/25'>
												{completedStages}/{project.stages.length}
											</span>
										)}
									</span>

									{project.readinessScore > 0 && (
										<span className='inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-white/50'>
											<Sparkles className='h-3 w-3 text-[#e7c35a]' />
											{project.readinessScore}
										</span>
									)}

									<span className='hidden text-[0.65rem] text-white/25 sm:inline'>
										{ownerDisplay} &middot;{' '}
										{formatUpdatedAt(project.updatedAt)}
									</span>

									<ChevronRight className='hidden h-4 w-4 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-white/40 sm:block' />
								</div>
							</Link>
						)
					})}
				</div>
			) : (
				<div className='rounded-[28px] border border-white/[0.04] bg-white/[0.02] px-6 py-20 text-center'>
					<div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e7c35a]/10'>
						<Sparkles className='h-6 w-6 text-[#e7c35a]' />
					</div>
					<h2 className='mt-5 text-lg font-semibold text-white'>
						No projects yet
					</h2>
					<p className='mx-auto mt-2 max-w-sm text-sm leading-6 text-white/45'>
						Upload a research paper and let Lemma score its commercial
						readiness through TRL/IRL, market, and feasibility analysis.
					</p>
					<Button
						asChild
						className='mt-6 h-11 rounded-full bg-white px-5 text-sm font-semibold text-black hover:bg-white/90'>
						<Link href='/app/projects/new'>
							<Plus className='mr-2 h-4 w-4' />
							Create first project
						</Link>
					</Button>
				</div>
			)}
		</section>
	)
}

export default ProjectPortfolio
