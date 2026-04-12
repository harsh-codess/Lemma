'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
	ArrowRight,
	CheckCircle2,
	Download,
	FileText,
	Loader2,
	Plus,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

type ExportProject = {
	id: string
	title: string
	domain: string
	analysisStatus: string
	readinessScore: number
	updatedAt: string
	institution: { name: string }
	stages: Array<{ key: string; label: string; status: string }>
}

const formatUpdatedAt = (value: string) => {
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

export default function ExportsPage() {
	const [projects, setProjects] = useState<ExportProject[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		fetch('/api/projects')
			.then((res) => (res.ok ? res.json() : []))
			.then((data: ExportProject[]) => setProjects(data))
			.catch(() => setProjects([]))
			.finally(() => setIsLoading(false))
	}, [])

	const completedProjects = useMemo(
		() => projects.filter((p) => p.analysisStatus === 'COMPLETE'),
		[projects],
	)
	const activeProjects = useMemo(
		() => projects.filter((p) => p.analysisStatus === 'PROCESSING'),
		[projects],
	)

	return (
		<section className='space-y-8'>
			<div>
				<p className='text-[0.7rem] uppercase tracking-[0.24em] text-[#e7c35a]'>
					Exports
				</p>
				<h1 className='mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl'>
					Export queue
				</h1>
				<p className='mt-3 max-w-lg text-sm leading-7 text-white/50'>
					Completed analyses appear here when their evidence, scoring, and review
					outputs are ready to package.
				</p>
			</div>

			{isLoading ? (
				<div className='flex min-h-[20vh] items-center justify-center rounded-[28px] bg-white/[0.025]'>
					<div className='flex items-center gap-3 text-white/55'>
						<Loader2 className='h-5 w-5 animate-spin' />
						<span className='text-sm'>Loading export queue</span>
					</div>
				</div>
			) : completedProjects.length > 0 ? (
				<div className='space-y-3'>
					{completedProjects.map((project) => (
						<div
							key={project.id}
							className='flex flex-col gap-4 rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] p-5 sm:flex-row sm:items-center sm:justify-between'>
							<div className='min-w-0 flex-1'>
								<div className='flex items-center gap-2'>
									<CheckCircle2 className='h-4 w-4 shrink-0 text-emerald-400' />
									<h3 className='truncate text-sm font-semibold text-white'>
										{project.title}
									</h3>
								</div>
								<p className='mt-1.5 text-xs leading-5 text-white/35'>
									{project.institution.name} · {project.domain}
									{project.readinessScore > 0 &&
										` · Readiness ${project.readinessScore}/100`}
									{` · Updated ${formatUpdatedAt(project.updatedAt)}`}
								</p>
							</div>
							<Button
								asChild
								className='h-10 rounded-full bg-white px-4 text-xs font-semibold text-black hover:bg-white/90'>
								<Link href={`/app/projects/${project.id}`}>
									Open workspace
									<ArrowRight className='ml-2 h-3.5 w-3.5' />
								</Link>
							</Button>
						</div>
					))}
				</div>
			) : projects.length > 0 ? (
				<div className='rounded-[28px] bg-white/[0.025] px-6 py-14 text-center'>
					<div className='mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7c35a]/10 text-[#e7c35a]'>
						<Download className='h-5 w-5' />
					</div>
					<h2 className='mt-5 text-xl font-semibold tracking-[-0.03em] text-white'>
						No completed analyses yet
					</h2>
					<p className='mx-auto mt-3 max-w-md text-sm leading-7 text-white/45'>
						Exports will unlock after a project finishes analysis. For now, open an
						active workspace to inspect its progress.
					</p>
					{activeProjects.length > 0 && (
						<div className='mx-auto mt-6 max-w-lg space-y-2 text-left'>
							{activeProjects.map((project) => (
								<Link
									key={project.id}
									href={`/app/projects/${project.id}`}
									className='flex items-center justify-between gap-3 rounded-2xl bg-white/[0.035] px-4 py-3 text-sm text-white/65 transition-colors hover:bg-white/[0.055] hover:text-white'>
									<span className='truncate'>{project.title}</span>
									<span className='flex shrink-0 items-center gap-1 text-xs text-[#e7c35a]'>
										<Loader2 className='h-3.5 w-3.5 animate-spin' />
										Running
									</span>
								</Link>
							))}
						</div>
					)}
				</div>
			) : (
				<div className='rounded-[28px] bg-white/[0.025] px-6 py-14 text-center'>
					<div className='mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7c35a]/10 text-[#e7c35a]'>
						<FileText className='h-5 w-5' />
					</div>
					<h2 className='mt-5 text-xl font-semibold tracking-[-0.03em] text-white'>
						Nothing to export yet
					</h2>
					<p className='mx-auto mt-3 max-w-md text-sm leading-7 text-white/45'>
						Create your first project and run analysis before exporting reports or
						investor materials.
					</p>
					<Button
						asChild
						className='mt-6 h-11 rounded-full bg-white px-5 text-sm font-semibold text-black hover:bg-white/90'>
						<Link href='/app/projects/new'>
							<Plus className='mr-2 h-4 w-4' />
							Create project
						</Link>
					</Button>
				</div>
			)}
		</section>
	)
}
