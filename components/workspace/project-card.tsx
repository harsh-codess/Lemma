'use client'

import { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
	Loader2,
	Clock,
	CheckCircle2,
	AlertTriangle,
	MoreHorizontal,
	X,
	Trash2,
	ExternalLink,
	RotateCcw,
	Copy,
	Pencil,
	ArrowRight,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────
type StatusKey = 'COMPLETE' | 'PROCESSING' | 'IDLE' | 'FAILED'

const STATUS_CFG: Record<
	StatusKey,
	{ bg: string; text: string; border: string; label: string; Icon: React.ComponentType<{ className?: string }>; spin: boolean }
> = {
	COMPLETE: { bg: '#052010', text: '#10b981', border: '#10b981', label: 'Complete', Icon: CheckCircle2, spin: false },
	PROCESSING: { bg: '#030d2a', text: '#60a5fa', border: '#3b82f6', label: 'Analyzing', Icon: Loader2, spin: true },
	IDLE: { bg: '#0d1117', text: '#8899BB', border: '#4a5a7a', label: 'Queued', Icon: Clock, spin: false },
	FAILED: { bg: '#200505', text: '#ef4444', border: '#ef4444', label: 'Failed', Icon: AlertTriangle, spin: false },
}

const DOMAIN_OPTIONS = ['AI / Software', 'Biotech / Materials', 'Hardware', 'Finance', 'Clean Energy', 'Quantum', 'Other']
const AGENT_STAGE_KEYS = ['PAPER', 'TRL_IRL', 'MARKET', 'FEASIBILITY', 'DECK']
const AGENT_LABELS: Record<string, string> = {
	PAPER: 'Paper Reader',
	TRL_IRL: 'TRL / IRL',
	MARKET: 'Market Scout',
	FEASIBILITY: 'Feasibility',
	DECK: 'Pitch Builder',
}

const DOMAIN_MARKET: Record<string, string> = {
	'AI / Software': 'AI Market — $180B',
	'Biotech / Materials': 'Biotech Market — $4.2B',
	Hardware: 'Hardware Market — $2.8B',
	Finance: 'Fintech Market — $310B',
	'Clean Energy': 'Clean Energy — $1.2T',
	Quantum: 'Quantum Market — $850M',
}

export type EditData = { title: string; domain: string; institution: string }

export type ProjectCardProps = {
	title: string
	domain: string
	institution: string
	lab: string | null
	status: StatusKey
	trlScore: number | null
	irlScore: number | null
	stages: Array<{ key: string; status: string }>
	authorName: string
	date: string
	projectId: string
	onDelete: (id: string) => void
	onEdit: (id: string, data: EditData) => void
	onDuplicate: (id: string) => void
	onRerun: (id: string) => void
}

type ToastState = { message: string; variant: 'green' | 'blue' } | null

const inputStyle: React.CSSProperties = {
	background: '#0a1020',
	border: '1px solid rgba(59,130,246,0.15)',
	borderRadius: '6px',
	padding: '10px 14px',
	fontFamily: 'DM Sans, sans-serif',
	transition: 'border-color 0.15s ease',
	width: '100%',
}

// ── Visual panel ─────────────────────────────────────────────────────────────

function PitchDeckPanel({ domain, trlScore }: { domain: string; trlScore: number | null }) {
	const trl = trlScore ? `TRL ${trlScore}` : 'TRL —'
	const slides = [
		'Problem & Opportunity',
		`Technology (${trl})`,
		DOMAIN_MARKET[domain] ?? 'Market Opportunity',
		'Business Model',
		'Team & Advisors',
		'The Ask',
	]
	return (
		<div style={{ padding: '16px 16px 0', fontFamily: 'DM Sans, sans-serif' }}>
			<div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
				<div style={{ width: 6, height: 6, borderRadius: '50%', background: '#60a5fa', flexShrink: 0 }} />
				<span style={{ fontSize: '10px', color: '#60a5fa', letterSpacing: '0.04em' }}>
					Pitch Deck · 12 slides
				</span>
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
				{slides.map((slide, i) => (
					<div
						key={i}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							padding: '5px 9px',
							borderRadius: '6px',
							background: 'rgba(255,255,255,0.025)',
							border: '1px solid rgba(255,255,255,0.04)',
						}}>
						<span style={{ fontSize: '9px', color: '#4a5a7a', minWidth: '12px' }}>{i + 1}.</span>
						<span style={{ fontSize: '10px', color: '#8899bb' }}>{slide}</span>
					</div>
				))}
			</div>
		</div>
	)
}

function ProcessingPanel({ stages }: { stages: Array<{ key: string; status: string }> }) {
	return (
		<div style={{ padding: '16px', fontFamily: 'DM Sans, sans-serif' }}>
			<div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
				<Loader2 style={{ width: 10, height: 10, color: '#60a5fa', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
				<span style={{ fontSize: '10px', color: '#60a5fa', letterSpacing: '0.04em' }}>Running analysis…</span>
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
				{AGENT_STAGE_KEYS.map((key) => {
					const stage = stages.find((s) => s.key === key)
					const st = stage?.status ?? 'PENDING'
					const isDone = st === 'COMPLETE'
					const isCurrent = st === 'CURRENT'
					return (
						<div
							key={key}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								padding: '5px 9px',
								borderRadius: '6px',
								background: isCurrent ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)',
								border: isCurrent ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(255,255,255,0.03)',
							}}>
							<div
								style={{
									width: 6,
									height: 6,
									borderRadius: '50%',
									flexShrink: 0,
									background: isDone ? '#10b981' : isCurrent ? '#f59e0b' : 'transparent',
									border: !isDone && !isCurrent ? '1px solid #4a5a7a' : 'none',
									animation: isCurrent ? 'pulse 2s ease-in-out infinite' : 'none',
								}}
							/>
							<span
								style={{
									fontSize: '10px',
									color: isDone ? '#4a7a5a' : isCurrent ? '#fbbf24' : '#4a5a7a',
								}}>
								{AGENT_LABELS[key]}
							</span>
						</div>
					)
				})}
			</div>
		</div>
	)
}

function IdlePanel() {
	return (
		<div
			style={{
				padding: '16px',
				fontFamily: 'DM Sans, sans-serif',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				height: '100%',
				gap: '8px',
			}}>
			<Clock style={{ width: 20, height: 20, color: '#4a5a7a' }} />
			<span style={{ fontSize: '11px', color: '#4a5a7a', textAlign: 'center' }}>
				Queued for analysis
			</span>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', marginTop: '4px' }}>
				{[80, 60, 70].map((w, i) => (
					<div
						key={i}
						style={{
							height: '6px',
							borderRadius: '3px',
							background: 'rgba(255,255,255,0.04)',
							width: `${w}%`,
						}}
					/>
				))}
			</div>
		</div>
	)
}

function FailedPanel() {
	return (
		<div
			style={{
				padding: '16px',
				fontFamily: 'DM Sans, sans-serif',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				height: '100%',
				gap: '8px',
			}}>
			<AlertTriangle style={{ width: 20, height: 20, color: '#ef4444' }} />
			<span style={{ fontSize: '11px', color: '#6b3333', textAlign: 'center' }}>
				Analysis failed
			</span>
			<span style={{ fontSize: '10px', color: '#4a2020', textAlign: 'center' }}>
				Re-run to retry
			</span>
		</div>
	)
}

// Panel bg based on status
const PANEL_BG: Record<StatusKey, string> = {
	COMPLETE: 'rgba(16,185,129,0.03)',
	PROCESSING: 'rgba(59,130,246,0.04)',
	IDLE: 'rgba(255,255,255,0.01)',
	FAILED: 'rgba(239,68,68,0.04)',
}

// ── Dropdown helpers ──────────────────────────────────────────────────────────
function DropItem({ icon, label, color = '#F0F4FF', onClick }: { icon: React.ReactNode; label: string; color?: string; onClick: () => void }) {
	return (
		<button
			onClick={(e) => { e.stopPropagation(); onClick() }}
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
export function ProjectCard({
	title, domain, institution, lab, status, trlScore, irlScore,
	stages, authorName, date, projectId, onDelete, onEdit, onDuplicate, onRerun,
}: ProjectCardProps) {
	const router = useRouter()
	const cfg = STATUS_CFG[status] ?? STATUS_CFG.IDLE

	const [dropdownOpen, setDropdownOpen] = useState(false)
	const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })
	const [editOpen, setEditOpen] = useState(false)
	const [deleteOpen, setDeleteOpen] = useState(false)
	const [toast, setToast] = useState<ToastState>(null)
	const [editTitle, setEditTitle] = useState(title)
	const [editInstitution, setEditInstitution] = useState(institution)
	const [editDomain, setEditDomain] = useState(domain)
	const [isMounted, setIsMounted] = useState(false)
	const [isHovered, setIsHovered] = useState(false)

	const menuBtnRef = useRef<HTMLButtonElement>(null)
	const dropdownRef = useRef<HTMLDivElement>(null)

	useEffect(() => { setIsMounted(true) }, [])
	useEffect(() => { setEditTitle(title); setEditInstitution(institution); setEditDomain(domain) }, [title, institution, domain])
	useEffect(() => {
		if (!toast) return
		const t = setTimeout(() => setToast(null), 2500)
		return () => clearTimeout(t)
	}, [toast])
	useEffect(() => {
		if (!dropdownOpen) return
		const handler = (e: MouseEvent) => {
			if (dropdownRef.current?.contains(e.target as Node) || menuBtnRef.current?.contains(e.target as Node)) return
			setDropdownOpen(false)
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [dropdownOpen])
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return
			setDropdownOpen(false); setEditOpen(false); setDeleteOpen(false)
		}
		document.addEventListener('keydown', handler)
		return () => document.removeEventListener('keydown', handler)
	}, [])

	const agentDots = AGENT_STAGE_KEYS.map((key) => {
		const stage = stages.find((s) => s.key === key)
		if (!stage) return 'pending'
		if (stage.status === 'COMPLETE') return 'complete'
		if (stage.status === 'CURRENT') return 'running'
		return 'pending'
	})

	const openDropdown = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (!menuBtnRef.current) return
		const rect = menuBtnRef.current.getBoundingClientRect()
		setDropdownPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
		setDropdownOpen((v) => !v)
	}

	const handleSaveEdit = () => { onEdit(projectId, { title: editTitle, domain: editDomain, institution: editInstitution }); setEditOpen(false) }
	const handleConfirmDelete = () => { onDelete(projectId); setDeleteOpen(false) }
	const handleDuplicate = () => { setDropdownOpen(false); onDuplicate(projectId); setToast({ message: 'Project duplicated', variant: 'green' }) }
	const handleRerun = () => { setDropdownOpen(false); onRerun(projectId); setToast({ message: 'Analysis queued', variant: 'blue' }) }

	return (
		<>
			{/* ── Card ─────────────────────────────────────────────────── */}
			<div
				onClick={() => router.push(`/app/projects/${projectId}`)}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				className='group relative flex flex-col cursor-pointer overflow-hidden rounded-[16px]'
				style={{
					background: '#05070a',
					border: `1px solid ${isHovered ? 'rgba(59,130,246,0.28)' : 'rgba(59,130,246,0.10)'}`,
					transition: 'border-color 0.15s ease',
				}}>

				{/* ── Visual panel ──────────────────────────────────────── */}
				<div
					style={{
						position: 'relative',
						minHeight: status === 'IDLE' || status === 'FAILED' ? '120px' : '192px',
						borderBottom: '1px solid rgba(59,130,246,0.08)',
						background: PANEL_BG[status],
						overflow: 'hidden',
					}}>

					{/* Three-dot menu button — top-right of panel */}
					<button
						ref={menuBtnRef}
						onClick={openDropdown}
						className='absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-lg opacity-0 transition-opacity duration-150 group-hover:opacity-100'
						style={{ background: 'rgba(0,0,0,0.55)', color: '#8899BB', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.06)' }}
						onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.75)')}
						onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.55)')}>
						<MoreHorizontal className='h-3.5 w-3.5' />
					</button>

					{/* Panel content */}
					{status === 'COMPLETE' && <PitchDeckPanel domain={domain} trlScore={trlScore} />}
					{status === 'PROCESSING' && <ProcessingPanel stages={stages} />}
					{status === 'IDLE' && <IdlePanel />}
					{status === 'FAILED' && <FailedPanel />}

					{/* Gradient fade at bottom of panel */}
					<div
						style={{
							position: 'absolute',
							bottom: 0,
							left: 0,
							right: 0,
							height: '40px',
							background: `linear-gradient(to top, #05070a, transparent)`,
							pointerEvents: 'none',
						}}
					/>
				</div>

				{/* ── Card body ─────────────────────────────────────────── */}
				<div className='flex flex-1 flex-col gap-3 p-4'>
					{/* Eyebrow */}
					<div className='flex items-center gap-1.5'>
						<span className='truncate text-[9px] uppercase tracking-[0.22em]' style={{ color: '#8899BB' }}>
							{domain}
						</span>
						<span style={{ color: '#4A5A7A' }}>·</span>
						<span className='truncate text-[9px] uppercase tracking-[0.22em]' style={{ color: '#4A5A7A' }}>
							{institution}
						</span>
					</div>

					{/* Title */}
					<h2
						className='line-clamp-2 text-[14px] leading-snug text-[#F0F4FF]'
						style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
						{title}
					</h2>

					{lab && (
						<p className='truncate text-[10px]' style={{ color: '#4A5A7A' }}>{lab}</p>
					)}

					{/* Agent dots */}
					<div className='flex items-center gap-1'>
						{agentDots.map((state, i) => (
							<div
								key={i}
								className={`h-[6px] w-[6px] rounded-full ${state === 'running' ? 'animate-pulse' : ''}`}
								style={{
									background: state === 'complete' ? '#3b82f6' : state === 'running' ? '#f59e0b' : 'transparent',
									border: state === 'pending' ? '1px solid #4a5a7a' : 'none',
								}}
							/>
						))}
					</div>

					{/* Status + TRL/IRL pills */}
					<div className='flex flex-wrap items-center gap-1.5'>
						<span
							className='inline-flex items-center gap-1 text-[9px] font-semibold uppercase'
							style={{
								background: cfg.bg,
								color: cfg.text,
								border: `0.5px solid ${cfg.border}`,
								borderRadius: '4px',
								padding: '2px 8px',
								letterSpacing: '0.05em',
							}}>
							<cfg.Icon className={`h-2.5 w-2.5 ${cfg.spin ? 'animate-spin' : ''}`} />
							{cfg.label}
						</span>
						<span
							className='font-mono text-[10px]'
							style={{
								background: trlScore !== null ? '#03082a' : '#0d1117',
								color: trlScore !== null ? '#60a5fa' : '#4a5a7a',
								border: trlScore !== null ? '0.5px solid #3b82f6' : '0.5px solid #4a5a7a',
								borderRadius: '4px',
								padding: '2px 7px',
							}}>
							{trlScore !== null ? `TRL ${trlScore}` : 'TRL —'}
						</span>
						<span
							className='font-mono text-[10px]'
							style={{
								background: irlScore !== null ? '#0d0720' : '#0d1117',
								color: irlScore !== null ? '#a78bfa' : '#4a5a7a',
								border: irlScore !== null ? '0.5px solid #7c3aed' : '0.5px solid #4a5a7a',
								borderRadius: '4px',
								padding: '2px 7px',
							}}>
							{irlScore !== null ? `IRL ${irlScore}` : 'IRL —'}
						</span>
					</div>

					{/* Divider */}
					<div style={{ height: '1px', background: 'rgba(59,130,246,0.07)', margin: '2px 0' }} />

					{/* Footer row */}
					<div className='flex items-center justify-between'>
						<span className='text-[10px]' style={{ color: '#4A5A7A' }}>
							{authorName} · {date}
						</span>
						<div
							className='flex items-center gap-1 text-[11px] font-medium transition-colors'
							style={{ color: isHovered ? '#60a5fa' : '#4A5A7A' }}>
							Open
							<ArrowRight className='h-3 w-3' />
						</div>
					</div>
				</div>
			</div>

			{/* ── Dropdown (portal) ─────────────────────────────────── */}
			{dropdownOpen && isMounted && createPortal(
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
						onClick={() => { setDropdownOpen(false); router.push(`/app/projects/${projectId}`) }} />
					<DropDivider />
					<DropItem icon={<Pencil className='h-3.5 w-3.5' />} label='Edit project'
						onClick={() => { setDropdownOpen(false); setEditOpen(true) }} />
					{(status === 'COMPLETE' || status === 'FAILED') && (
						<DropItem icon={<RotateCcw className='h-3.5 w-3.5' />} label='Re-run analysis' onClick={handleRerun} />
					)}
					<DropItem icon={<Copy className='h-3.5 w-3.5' />} label='Duplicate project' onClick={handleDuplicate} />
					<DropDivider />
					<DropItem icon={<Trash2 className='h-3.5 w-3.5' />} label='Delete project' color='#ef4444'
						onClick={() => { setDropdownOpen(false); setDeleteOpen(true) }} />
				</div>,
				document.body,
			)}

			{/* ── Edit modal ────────────────────────────────────────── */}
			{editOpen && isMounted && createPortal(
				<div
					className='fixed inset-0 z-[9999] flex items-center justify-center'
					style={{ background: 'rgba(0,0,0,0.65)' }}
					onClick={() => setEditOpen(false)}>
					<div
						className='w-[480px] max-w-[calc(100vw-2rem)]'
						onClick={(e) => e.stopPropagation()}
						style={{ background: '#070c14', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', padding: '28px' }}>
						<div className='mb-6 flex items-center justify-between'>
							<h2 className='text-[18px] text-[#F0F4FF]' style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
								Edit project
							</h2>
							<button onClick={() => setEditOpen(false)} className='flex h-8 w-8 items-center justify-center rounded-lg text-[#8899BB] hover:bg-white/[0.06]'>
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
							<button onClick={() => setEditOpen(false)}
								className='h-10 rounded-[6px] px-5 text-[14px] font-medium'
								style={{ border: '1px solid rgba(59,130,246,0.2)', color: '#8899BB', background: 'transparent' }}>
								Cancel
							</button>
						</div>
					</div>
				</div>,
				document.body,
			)}

			{/* ── Delete dialog ─────────────────────────────────────── */}
			{deleteOpen && isMounted && createPortal(
				<div
					className='fixed inset-0 z-[9999] flex items-center justify-center'
					style={{ background: 'rgba(0,0,0,0.65)' }}
					onClick={() => setDeleteOpen(false)}>
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
							<button onClick={handleConfirmDelete}
								className='h-10 rounded-[6px] px-5 text-[14px] font-medium text-white transition-opacity hover:opacity-90'
								style={{ background: '#ef4444' }}>
								Delete project
							</button>
							<button onClick={() => setDeleteOpen(false)}
								className='h-10 rounded-[6px] px-5 text-[14px] font-medium'
								style={{ border: '1px solid rgba(59,130,246,0.2)', color: '#8899BB', background: 'transparent' }}>
								Cancel
							</button>
						</div>
					</div>
				</div>,
				document.body,
			)}

			{/* ── Toast ─────────────────────────────────────────────── */}
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
