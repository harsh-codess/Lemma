'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
	Download,
	FileText,
	Loader2,
	CheckCircle2,
	ArrowRight,
	FileBarChart2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type ExportProject = {
	id: string
	title: string
	domain: string
	analysisStatus: string
	readinessScore: number
	institution: { name: string }
}

export default function ExportsPage() {
	const [projects, setProjects] = useState<ExportProject[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		fetch('/api/projects')
			.then((res) => (res.ok ? res.json() : []))
			.then((data: ExportProject[]) =>
				setProjects(data.filter((p) => p.analysisStatus === 'COMPLETE')),
			)
			.catch(() => setProjects([]))
			.finally(() => setIsLoading(false))
	}, [])

	return (
		<section className='space-y-8'>
			{/* Header */}
			<div>
				<p className='text-[0.7rem] uppercase tracking-[0.24em] text-[#e7c35a]'>
					Exports
				</p>
				<h1 className='mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl'>
					Export completed analyses
				</h1>
				<p className='mt-3 max-w-lg text-sm leading-7 text-white/50'>
					Download full reports for completed projects. Available formats include PDF summary, raw JSON data, and committee-ready slide decks.
				</p>
			</div>

			{/* Format cards */}
			<div className='grid gap-3 sm:grid-cols-3'>
				{[
					{
						icon: FileText,
						label: 'PDF Report',
						desc: 'Full analysis with TRL/IRL scores, risk flags, and pathway rationale.',
						tag: 'Coming soon',
					},
					{
						icon: FileBarChart2,
						label: 'Slide Deck',
						desc: 'Committee-ready presentation with key findings and commercial case.',
						tag: 'Coming soon',
					},
					{
						icon: Download,
						label: 'JSON Export',
						desc: 'Raw structured data for integration with your own tools and workflows.',
						tag: 'Coming soon',
					},
				].map((fmt) => (
					<div
						key={fmt.label}
						className='rounded-[22px] border border-white/[0.04] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] p-5'>
						<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]'>
							<fmt.icon className='h-5 w-5 text-white/50' />
						</div>
						<h3 className='mt-4 text-sm font-semibold text-white'>
							{fmt.label}
						</h3>
						<p className='mt-1.5 text-[0.8rem] leading-5 text-white/40'>
							{fmt.desc}
						</p>
						<span className='mt-3 inline-block rounded-full bg-white/[0.05] px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.16em] text-white/30'>
							{fmt.tag}
						</span>
					</div>
				))}
			</div>

			{/* Completed projects list */}
			<div>
				<h2 className='text-lg font-semibold tracking-[-0.02em] text-white'>
					Ready for export
				</h2>
				<p className='mt-1 text-sm text-white/40'>
					Projects with completed analysis pipelines.
				</p>
			</div>

			{isLoading ? (
				<div className='flex min-h-[20vh] items-center justify-center rounded-[22px] border border-white/[0.04] bg-white/[0.02]'>
					<div className='flex items-center gap-3 text-white/55'>
						<Loader2 className='h-5 w-5 animate-spin' />
						<span className='text-sm'>Loading</span>
					</div>
				</div>
			) : projects.length ? (
				<div className='space-y-2'>
					{projects.map((project) => (
						<div
							key={project.id}
							className='flex flex-col gap-4 rounded-[18px] border border-white/[0.04] bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between'>
							<div className='min-w-0 flex-1'>
								<div className='flex items-center gap-2'>
									<CheckCircle2 className='h-4 w-4 shrink-0 text-emerald-400' />
									<h3 className='truncate text-sm font-medium text-white'>
										{project.title}
									</h3>
								</div>
								<p className='mt-1 text-xs text-white/35'>
									{project.institution.name} · {project.domain}
									{project.readinessScore > 0 &&
										` · Readiness ${project.readinessScore}/100`}
								</p>
							</div>
							<div className='flex items-center gap-2'>
								<Button
									asChild
									variant='outline'
									size='sm'
									className='h-9 rounded-full border-white/[0.08] bg-white/[0.04] px-4 text-xs text-white/60 hover:bg-white/[0.07] hover:text-white'>
									<Link href={`/app/projects/${project.id}`}>
										View workspace
										<ArrowRight className='ml-2 h-3.5 w-3.5' />
									</Link>
								</Button>
							</div>
						</div>
					))}
				</div>
			) : (
				<div className='rounded-[22px] border border-white/[0.04] bg-white/[0.02] px-6 py-14 text-center'>
					<p className='text-sm text-white/40'>
						No completed analyses yet. Projects will appear here once their pipeline finishes.
					</p>
				</div>
			)}
		</section>
	)
}
