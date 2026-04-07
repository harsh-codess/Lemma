'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
	Loader2,
	ClipboardCheck,
	AlertTriangle,
	CheckCircle2,
	Sparkles,
	ChevronRight,
} from 'lucide-react'

type ReviewProject = {
	id: string
	title: string
	domain: string
	analysisStatus: string
	readinessScore: number
	status: string
	currentStage: string
	institution: { name: string }
	stages: Array<{ key: string; label: string; status: string }>
}

export default function ReviewPage() {
	const [projects, setProjects] = useState<ReviewProject[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		fetch('/api/projects')
			.then((res) => (res.ok ? res.json() : []))
			.then((data: ReviewProject[]) => setProjects(data))
			.catch(() => setProjects([]))
			.finally(() => setIsLoading(false))
	}, [])

	const completed = projects.filter((p) => p.analysisStatus === 'COMPLETE')
	const inProgress = projects.filter((p) => p.analysisStatus === 'PROCESSING')
	const needsAttention = completed.filter((p) => p.readinessScore > 0 && p.readinessScore < 40)
	const highReadiness = completed.filter((p) => p.readinessScore >= 60)

	return (
		<section className='space-y-8'>
			{/* Header */}
			<div>
				<p className='text-[0.7rem] uppercase tracking-[0.24em] text-[#e7c35a]'>
					Review
				</p>
				<h1 className='mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl'>
					Pipeline overview
				</h1>
				<p className='mt-3 max-w-lg text-sm leading-7 text-white/50'>
					Monitor the status of all analyses across your portfolio. Flag projects that need attention or are ready for committee review.
				</p>
			</div>

			{/* Quick stats */}
			<div className='grid gap-3 sm:grid-cols-4'>
				{[
					{
						label: 'Total projects',
						value: projects.length,
						icon: ClipboardCheck,
						color: 'text-white/70',
					},
					{
						label: 'Analyzing',
						value: inProgress.length,
						icon: Loader2,
						color: 'text-[#e7c35a]',
					},
					{
						label: 'High readiness',
						value: highReadiness.length,
						icon: CheckCircle2,
						color: 'text-emerald-400',
					},
					{
						label: 'Needs attention',
						value: needsAttention.length,
						icon: AlertTriangle,
						color: 'text-amber-400',
					},
				].map((stat) => (
					<div
						key={stat.label}
						className='rounded-[22px] border border-white/[0.04] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] p-5'>
						<div className='flex items-center gap-2'>
							<stat.icon
								className={`h-4 w-4 ${stat.color} ${stat.label === 'Analyzing' && inProgress.length > 0 ? 'animate-spin' : ''}`}
							/>
							<span className='text-[0.65rem] uppercase tracking-[0.22em] text-white/35'>
								{stat.label}
							</span>
						</div>
						<p className='mt-3 text-2xl font-semibold text-white'>
							{isLoading ? '—' : stat.value}
						</p>
					</div>
				))}
			</div>

			{/* Project list */}
			{isLoading ? (
				<div className='flex min-h-[20vh] items-center justify-center rounded-[22px] border border-white/[0.04] bg-white/[0.02]'>
					<div className='flex items-center gap-3 text-white/55'>
						<Loader2 className='h-5 w-5 animate-spin' />
						<span className='text-sm'>Loading</span>
					</div>
				</div>
			) : projects.length ? (
				<div className='space-y-6'>
					{/* In Progress */}
					{inProgress.length > 0 && (
						<div>
							<h2 className='mb-3 flex items-center gap-2 text-sm font-medium text-[#e7c35a]'>
								<Loader2 className='h-3.5 w-3.5 animate-spin' />
								Currently analyzing
							</h2>
							<div className='space-y-2'>
								{inProgress.map((project) => (
									<ProjectRow key={project.id} project={project} />
								))}
							</div>
						</div>
					)}

					{/* High readiness */}
					{highReadiness.length > 0 && (
						<div>
							<h2 className='mb-3 flex items-center gap-2 text-sm font-medium text-emerald-400'>
								<Sparkles className='h-3.5 w-3.5' />
								High readiness — consider for committee
							</h2>
							<div className='space-y-2'>
								{highReadiness.map((project) => (
									<ProjectRow key={project.id} project={project} />
								))}
							</div>
						</div>
					)}

					{/* All completed */}
					{completed.length > 0 && (
						<div>
							<h2 className='mb-3 text-sm font-medium text-white/50'>
								All completed analyses
							</h2>
							<div className='space-y-2'>
								{completed.map((project) => (
									<ProjectRow key={project.id} project={project} />
								))}
							</div>
						</div>
					)}
				</div>
			) : (
				<div className='rounded-[22px] border border-white/[0.04] bg-white/[0.02] px-6 py-14 text-center'>
					<p className='text-sm text-white/40'>
						No projects to review yet. Start by creating a project and running the analysis pipeline.
					</p>
				</div>
			)}
		</section>
	)
}

function ProjectRow({ project }: { project: ReviewProject }) {
	const stage = project.stages.find((s) => s.key === project.currentStage)

	return (
		<Link
			href={`/app/projects/${project.id}`}
			className='group flex items-center gap-4 rounded-[16px] border border-white/[0.04] bg-white/[0.02] px-4 py-3.5 transition-all hover:border-white/[0.08] hover:bg-white/[0.04]'>
			<div className='min-w-0 flex-1'>
				<h3 className='truncate text-sm font-medium text-white'>
					{project.title}
				</h3>
				<p className='mt-0.5 text-xs text-white/30'>
					{project.institution.name} · {project.domain} · {stage?.label ?? 'Paper'}
				</p>
			</div>
			{project.readinessScore > 0 && (
				<span className='inline-flex items-center gap-1 rounded-full bg-white/[0.05] px-2.5 py-1 text-[0.65rem] font-medium text-white/50'>
					<Sparkles className='h-3 w-3 text-[#e7c35a]' />
					{project.readinessScore}
				</span>
			)}
			<span
				className={`inline-flex rounded-full px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.16em] ${
					project.analysisStatus === 'COMPLETE'
						? 'bg-emerald-400/10 text-emerald-400'
						: project.analysisStatus === 'PROCESSING'
							? 'bg-[#e7c35a]/10 text-[#e7c35a]'
							: 'bg-white/[0.05] text-white/40'
				}`}>
				{project.analysisStatus === 'COMPLETE'
					? 'Done'
					: project.analysisStatus === 'PROCESSING'
						? 'Running'
						: project.status}
			</span>
			<ChevronRight className='h-4 w-4 shrink-0 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-white/40' />
		</Link>
	)
}
