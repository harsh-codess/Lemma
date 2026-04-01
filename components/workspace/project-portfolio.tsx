'use client'

import Link from 'next/link'
import { ArrowRight, FlaskConical, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	type WorkspaceProject,
	getAllWorkspaceProjects,
	getStoredDraftWorkspaceProjects,
	workspaceStageOrder,
} from '@/lib/workspace-data'

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

const ProjectPortfolio = ({
	initialProjects,
}: {
	initialProjects: WorkspaceProject[]
}) => {
	const [projects, setProjects] = useState(initialProjects)

	useEffect(() => {
		const drafts = getStoredDraftWorkspaceProjects()
		setProjects(getAllWorkspaceProjects(drafts))
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
			<div className='flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between'>
				<div>
					<p className='text-[0.7rem] uppercase tracking-[0.24em] text-[#e7c35a]'>
						Projects
					</p>
					<h1 className='mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl'>
						Open a workspace or create a new one.
					</h1>
					<p className='mt-3 max-w-2xl text-sm leading-7 text-white/56'>
						Today’s flow is simple: create a project, enter the workspace, and move stage by stage.
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

			{sortedProjects.length ? (
				<div className='grid gap-4 xl:grid-cols-2'>
					{sortedProjects.map((project) => {
						const currentStage = workspaceStageOrder.find(
							(stage) => stage.key === project.currentStage,
						)

						return (
							<article
								key={project.id}
								className='group relative overflow-hidden rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-6 transition-transform duration-300 hover:-translate-y-1 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]'>
								<div className='flex flex-wrap items-start justify-between gap-3'>
									<div className='min-w-0'>
										<div className='flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.22em] text-white/38'>
											<FlaskConical className='h-3.5 w-3.5 text-[#e7c35a]' />
											<span>{project.domain}</span>
										</div>
										<h2 className='mt-3 max-w-xl text-2xl font-semibold tracking-[-0.03em] text-white'>
											{project.title}
										</h2>
										<p className='mt-2 text-sm leading-6 text-white/50'>
											{project.institution} · {project.lab}
										</p>
									</div>
									<div className='rounded-full bg-white/[0.07] px-3 py-1 text-sm font-medium text-white/80'>
										{project.status}
									</div>
								</div>

								<p className='mt-5 max-w-2xl text-sm leading-7 text-white/58'>
									{project.shortNote}
								</p>

								<div className='mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
									<div className='rounded-2xl bg-black/30 p-4'>
										<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
											Current stage
										</p>
										<p className='mt-2 text-sm font-semibold text-white'>
											{currentStage?.label ?? 'Project setup'}
										</p>
									</div>
									<div className='rounded-2xl bg-black/30 p-4'>
										<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
											Readiness
										</p>
										<p className='mt-2 text-sm font-semibold text-white'>
											{project.readinessScore}/100
										</p>
									</div>
									<div className='rounded-2xl bg-black/30 p-4'>
										<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
											Owner
										</p>
										<p className='mt-2 text-sm font-semibold text-white'>
											{project.owner}
										</p>
									</div>
									<div className='rounded-2xl bg-black/30 p-4'>
										<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
											Updated
										</p>
										<p className='mt-2 text-sm font-semibold text-white'>
											{formatUpdatedAt(project.updatedAt)}
										</p>
									</div>
								</div>

								<div className='mt-6 flex flex-wrap items-center gap-3'>
									<Link
										href={`/app/projects/${project.id}`}
										className='inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/90'>
										Open workspace
										<ArrowRight className='h-4 w-4' />
									</Link>
								</div>
							</article>
						)
					})}
				</div>
			) : (
				<div className='rounded-[32px] bg-white/[0.03] px-6 py-16 text-center'>
					<p className='text-lg font-medium text-white'>No projects yet</p>
					<p className='mt-2 text-sm text-white/52'>
						Create the first workspace to start shaping a research paper into a commercialization decision.
					</p>
				</div>
			)}
		</section>
	)
}

export default ProjectPortfolio
