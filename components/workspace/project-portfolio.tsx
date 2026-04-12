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
	MoreHorizontal,
	ExternalLink,
	Pencil,
	RotateCcw,
	Copy,
	Trash2,
	X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import ResearchPortfolioEmptyState from '@/components/workspace/research-portfolio-empty-state'

// ── Types ─────────────────────────────────────────────────────────────────────

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

type EditData = { title: string; domain: string; institution: string }
type ToastState = { message: string; variant: 'green' | 'blue' } | null

const DOMAIN_OPTIONS = ['AI / Software', 'Biotech / Materials', 'Hardware', 'Finance', 'Clean Energy', 'Quantum', 'Other']

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

const inputStyle: React.CSSProperties = {
	background: '#0a1020',
	border: '1px solid rgba(59,130,246,0.15)',
	borderRadius: '6px',
	padding: '10px 14px',
	fontFamily: 'DM Sans, sans-serif',
	transition: 'border-color 0.15s ease',
	width: '100%',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function DropItem({ icon, label, color = '#F0F4FF', onClick }: { icon: React.ReactNode; label: string; color?: string; onClick: () => void }) {
	return (
		<button
			onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick() }}
			className='flex w-full items-center gap-2 rounded-md text-[13px] transition-colors duration-100'
			style={{ color, fontFamily: 'DM Sans, sans-serif', padding: '8px 14px', background: 'transparent' }}
			onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)')}
			onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
			{icon}
			{label}
		</button>
	)
}

function DropDivider() {
	return <div className='my-1 h-px' style={{ background: 'rgba(59,130,246,0.08)' }} />
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<label className='block'>
			<span className='mb-1.5 block text-[12px]' style={{ color: '#8899BB' }}>{label}</span>
			{children}
		</label>
	)
}

// ── Main component ────────────────────────────────────────────────────────────

const ProjectPortfolio = () => {
	const router = useRouter()
	const [projects, setProjects] = useState<PortfolioProject[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isMounted, setIsMounted] = useState(false)

	// Dropdown state
	const [dropdownId, setDropdownId] = useState<string | null>(null)
	const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })
	const menuBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({})
	const dropdownRef = useRef<HTMLDivElement>(null)

	// Modal state
	const [editOpen, setEditOpen] = useState<string | null>(null)
	const [deleteOpen, setDeleteOpen] = useState<string | null>(null)
	const [editTitle, setEditTitle] = useState('')
	const [editInstitution, setEditInstitution] = useState('')
	const [editDomain, setEditDomain] = useState('')
	const [toast, setToast] = useState<ToastState>(null)

	useEffect(() => { setIsMounted(true) }, [])

	useEffect(() => {
		fetch('/api/projects')
			.then((res) => (res.ok ? res.json() : []))
			.then((data) => setProjects(data))
			.catch(() => setProjects([]))
			.finally(() => setIsLoading(false))
	}, [])

	// Close dropdown on outside click
	useEffect(() => {
		if (!dropdownId) return
		const handler = (e: MouseEvent) => {
			const btn = menuBtnRefs.current[dropdownId]
			if (dropdownRef.current?.contains(e.target as Node) || btn?.contains(e.target as Node)) return
			setDropdownId(null)
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [dropdownId])

	// Escape key closes everything
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return
			setDropdownId(null); setEditOpen(null); setDeleteOpen(null)
		}
		document.addEventListener('keydown', handler)
		return () => document.removeEventListener('keydown', handler)
	}, [])

	// Toast auto-dismiss
	useEffect(() => {
		if (!toast) return
		const t = setTimeout(() => setToast(null), 2500)
		return () => clearTimeout(t)
	}, [toast])

	const sortedProjects = useMemo(
		() =>
			[...projects].sort(
				(a, b) =>
					new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
			),
		[projects],
	)

	// ── Handlers ──────────────────────────────────────────────────────────────

	const openDropdown = (e: React.MouseEvent, projectId: string) => {
		e.preventDefault()
		e.stopPropagation()
		const btn = menuBtnRefs.current[projectId]
		if (!btn) return
		const rect = btn.getBoundingClientRect()
		setDropdownPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
		setDropdownId((prev) => (prev === projectId ? null : projectId))
	}

	const openEditModal = (projectId: string) => {
		const project = projects.find((p) => p.id === projectId)
		if (!project) return
		setEditTitle(project.title)
		setEditInstitution(project.institution.name)
		setEditDomain(project.domain)
		setDropdownId(null)
		setEditOpen(projectId)
	}

	const handleSaveEdit = async () => {
		if (!editOpen) return
		const id = editOpen
		setProjects((prev) =>
			prev.map((p) =>
				p.id === id
					? { ...p, title: editTitle, domain: editDomain, institution: { name: editInstitution } }
					: p,
			),
		)
		setEditOpen(null)
		await fetch(`/api/projects/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: editTitle, domain: editDomain, institution: editInstitution }),
		})
	}

	const handleDelete = async () => {
		if (!deleteOpen) return
		const id = deleteOpen
		setProjects((prev) => prev.filter((p) => p.id !== id))
		setDeleteOpen(null)
		await fetch(`/api/projects/${id}`, { method: 'DELETE' })
	}

	const handleDuplicate = async (projectId: string) => {
		setDropdownId(null)
		const project = projects.find((p) => p.id === projectId)
		if (!project) return
		setToast({ message: 'Project duplicated', variant: 'green' })
		const res = await fetch('/api/projects', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				title: `${project.title} (copy)`,
				institution: project.institution.name,
				lab: project.shortNote ?? 'Lab',
				domain: project.domain,
				shortNote: project.shortNote ?? '',
			}),
		})
		if (res.ok) {
			const newProject: PortfolioProject = await res.json()
			setProjects((prev) => [newProject, ...prev])
		}
	}

	const handleRerun = async (projectId: string) => {
		setDropdownId(null)
		setProjects((prev) =>
			prev.map((p) => (p.id === projectId ? { ...p, analysisStatus: 'PROCESSING' } : p)),
		)
		setToast({ message: 'Analysis queued', variant: 'blue' })
		await fetch(`/api/projects/${projectId}/analyze`, { method: 'POST' })
	}

	// ── Render ────────────────────────────────────────────────────────────────

	if (isLoading) {
		return (
			<div className='flex items-center justify-center py-32'>
				<Loader2 className='h-6 w-6 animate-spin text-white/25' />
			</div>
		)
	}

	if (!sortedProjects.length) {
		return <ResearchPortfolioEmptyState />
	}

	const activeDropdownProject = dropdownId ? projects.find((p) => p.id === dropdownId) : null

	return (
		<>
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

								{/* Right: Meta chips + three-dot */}
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

									{/* Three-dot menu button */}
									<button
										ref={(el) => { menuBtnRefs.current[project.id] = el }}
										onClick={(e) => openDropdown(e, project.id)}
										className='flex h-7 w-7 items-center justify-center rounded-lg opacity-0 transition-opacity duration-150 group-hover:opacity-100 sm:ml-1'
										style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
										onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)' }}
										onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)' }}>
										<MoreHorizontal className='h-3.5 w-3.5' />
									</button>

									<ChevronRight className='hidden h-4 w-4 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-white/40 sm:block' />
								</div>
							</Link>
						)
					})}
				</div>
			</section>

			{/* ── Dropdown (portal) ─────────────────────────────────────── */}
			{dropdownId && activeDropdownProject && isMounted && createPortal(
				<div
					ref={dropdownRef}
					className='fixed z-[9999] w-44'
					style={{
						top: dropdownPos.top,
						right: dropdownPos.right,
						background: '#0d1117',
						border: '1px solid rgba(59,130,246,0.15)',
						borderRadius: '8px',
						padding: '4px',
						boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
					}}>
					<DropItem icon={<ExternalLink className='h-3.5 w-3.5' />} label='Open workspace' color='#60a5fa'
						onClick={() => { setDropdownId(null); router.push(`/app/projects/${dropdownId}`) }} />
					<DropDivider />
					<DropItem icon={<Pencil className='h-3.5 w-3.5' />} label='Edit project'
						onClick={() => openEditModal(dropdownId)} />
					{(activeDropdownProject.analysisStatus === 'COMPLETE' || activeDropdownProject.analysisStatus === 'FAILED') && (
						<DropItem icon={<RotateCcw className='h-3.5 w-3.5' />} label='Re-run analysis' onClick={() => handleRerun(dropdownId)} />
					)}
					<DropItem icon={<Copy className='h-3.5 w-3.5' />} label='Duplicate project' onClick={() => handleDuplicate(dropdownId)} />
					<DropDivider />
					<DropItem icon={<Trash2 className='h-3.5 w-3.5' />} label='Delete project' color='#ef4444'
						onClick={() => { setDropdownId(null); setDeleteOpen(dropdownId) }} />
				</div>,
				document.body,
			)}

			{/* ── Edit modal (portal) ───────────────────────────────────── */}
			{editOpen && isMounted && createPortal(
				<div
					className='fixed inset-0 z-[9999] flex items-center justify-center'
					style={{ background: 'rgba(0,0,0,0.65)' }}
					onClick={() => setEditOpen(null)}>
					<div
						className='w-[480px] max-w-[calc(100vw-2rem)]'
						onClick={(e) => e.stopPropagation()}
						style={{ background: '#070c14', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', padding: '28px' }}>
						<div className='mb-6 flex items-center justify-between'>
							<h2 className='text-[18px] text-[#F0F4FF]' style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
								Edit project
							</h2>
							<button onClick={() => setEditOpen(null)} className='flex h-8 w-8 items-center justify-center rounded-lg text-[#8899BB] hover:bg-white/[0.06]'>
								<X className='h-4 w-4' />
							</button>
						</div>
						<div className='space-y-4'>
							<ModalField label='Paper title'>
								<input type='text' value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
									className='text-[14px] text-[#F0F4FF] outline-none' style={inputStyle}
									onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
									onBlur={(e) => (e.target.style.borderColor = 'rgba(59,130,246,0.15)')} />
							</ModalField>
							<ModalField label='Institution'>
								<input type='text' value={editInstitution} onChange={(e) => setEditInstitution(e.target.value)}
									className='text-[14px] text-[#F0F4FF] outline-none' style={inputStyle}
									onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
									onBlur={(e) => (e.target.style.borderColor = 'rgba(59,130,246,0.15)')} />
							</ModalField>
							<ModalField label='Domain'>
								<select value={editDomain} onChange={(e) => setEditDomain(e.target.value)}
									className='text-[14px] text-[#F0F4FF] outline-none' style={{ ...inputStyle, appearance: 'none' }}
									onFocus={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
									onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.15)')}>
									{DOMAIN_OPTIONS.map((opt) => (
										<option key={opt} value={opt} style={{ background: '#070c14' }}>{opt}</option>
									))}
								</select>
							</ModalField>
						</div>
						<div className='mt-6 flex items-center gap-3'>
							<button onClick={handleSaveEdit}
								className='h-10 rounded-[6px] px-5 text-[14px] font-medium text-white transition-opacity hover:opacity-90'
								style={{ background: '#3b82f6' }}>
								Save changes
							</button>
							<button onClick={() => setEditOpen(null)}
								className='h-10 rounded-[6px] px-5 text-[14px] font-medium'
								style={{ border: '1px solid rgba(59,130,246,0.2)', color: '#8899BB', background: 'transparent' }}>
								Cancel
							</button>
						</div>
					</div>
				</div>,
				document.body,
			)}

			{/* ── Delete dialog (portal) ────────────────────────────────── */}
			{deleteOpen && isMounted && createPortal(
				<div
					className='fixed inset-0 z-[9999] flex items-center justify-center'
					style={{ background: 'rgba(0,0,0,0.65)' }}
					onClick={() => setDeleteOpen(null)}>
					<div
						className='w-[420px] max-w-[calc(100vw-2rem)]'
						onClick={(e) => e.stopPropagation()}
						style={{ background: '#070c14', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', padding: '28px' }}>
						<div className='mb-4 flex justify-center'>
							<div className='flex h-12 w-12 items-center justify-center rounded-full' style={{ background: 'rgba(239,68,68,0.12)' }}>
								<Trash2 className='h-5 w-5' style={{ color: '#ef4444' }} />
							</div>
						</div>
						<h2 className='mb-2 text-center text-[18px] text-[#F0F4FF]' style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
							Delete this project?
						</h2>
						<p className='mb-6 text-center text-[13px] leading-relaxed' style={{ color: '#8899BB' }}>
							This will permanently remove the project and all generated outputs. This cannot be undone.
						</p>
						<div className='flex items-center justify-center gap-3'>
							<button onClick={handleDelete}
								className='h-10 rounded-[6px] px-5 text-[14px] font-medium text-white transition-opacity hover:opacity-90'
								style={{ background: '#ef4444' }}>
								Delete project
							</button>
							<button onClick={() => setDeleteOpen(null)}
								className='h-10 rounded-[6px] px-5 text-[14px] font-medium'
								style={{ border: '1px solid rgba(59,130,246,0.2)', color: '#8899BB', background: 'transparent' }}>
								Cancel
							</button>
						</div>
					</div>
				</div>,
				document.body,
			)}

			{/* ── Toast (portal) ────────────────────────────────────────── */}
			{toast && isMounted && createPortal(
				<div
					className='pointer-events-none fixed bottom-6 right-6 z-[9999] rounded-lg px-4 py-3 text-[13px] font-medium'
					style={
						toast.variant === 'green'
							? { background: '#052010', border: '1px solid #10b981', color: '#10b981' }
							: { background: '#030d2a', border: '1px solid #3b82f6', color: '#60a5fa' }
					}>
					{toast.message}
				</div>,
				document.body,
			)}
		</>
	)
}

export default ProjectPortfolio
