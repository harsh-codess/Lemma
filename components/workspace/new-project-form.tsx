'use client'

import Link from 'next/link'
import {
	ArrowLeft,
	ArrowRight,
	FileText,
	FolderUp,
	Loader2,
	Sparkles,
	X,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'

const domainOptions = [
	'Biotech / Materials',
	'Medtech',
	'Diagnostics',
	'Energy / Advanced materials',
	'Climate / Industrial',
	'AI / Software',
	'Other',
]

type SubmitPhase =
	| 'idle'
	| 'creating-project'
	| 'uploading-paper'
	| 'linking-paper'
	| 'starting-analysis'
	| 'done'
	| 'error'

const phaseLabels: Record<SubmitPhase, string> = {
	idle: '',
	'creating-project': 'Creating project...',
	'uploading-paper': 'Uploading paper to secure storage...',
	'linking-paper': 'Linking paper to project...',
	'starting-analysis': 'Starting AI analysis pipeline...',
	done: 'Redirecting to workspace...',
	error: 'Something went wrong',
}

const inputClassName =
	'h-12 w-full rounded-2xl bg-white/[0.06] px-4 text-sm text-white placeholder:text-white/30 outline-none ring-0 transition-colors focus:bg-white/[0.09] focus:ring-1 focus:ring-[#e7c35a]/20'

const NewProjectForm = () => {
	const router = useRouter()
	const inputRef = useRef<HTMLInputElement | null>(null)

	const [title, setTitle] = useState('')
	const [institution, setInstitution] = useState('')
	const [lab, setLab] = useState('')
	const [domain, setDomain] = useState(domainOptions[0])
	const [shortNote, setShortNote] = useState('')
	const [file, setFile] = useState<File | null>(null)

	const [phase, setPhase] = useState<SubmitPhase>('idle')
	const [errorMessage, setErrorMessage] = useState('')

	const isValid = useMemo(
		() => title.trim() && institution.trim() && lab.trim() && domain.trim() && file !== null,
		[domain, institution, lab, title, file],
	)

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const selected = event.target.files?.[0]
		if (selected) setFile(selected)
	}

	const removeFile = () => {
		setFile(null)
		if (inputRef.current) inputRef.current.value = ''
	}

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		if (!isValid || (phase !== 'idle' && phase !== 'error')) return

		setErrorMessage('')

		try {
			// ── Step 1: Create project in DB ─────────────────────────────
			setPhase('creating-project')
			const createRes = await fetch('/api/projects', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: title.trim(),
					institution: institution.trim(),
					lab: lab.trim(),
					domain,
					shortNote: shortNote.trim() || undefined,
				}),
			})
			if (!createRes.ok) {
				const err = await createRes.json()
				throw new Error(err.error?.formErrors?.[0] ?? err.error ?? 'Failed to create project')
			}
			const project = await createRes.json()

			// ── Step 2: Upload paper via server (no CORS) ────────────
			if (file) {
				setPhase('uploading-paper')
				const formData = new FormData()
				formData.append('file', file)
				formData.append('projectId', project.id)

				const uploadRes = await fetch('/api/upload', {
					method: 'POST',
					body: formData,
				})
				if (!uploadRes.ok) {
					const err = await uploadRes.json()
					throw new Error(err.error ?? 'Failed to upload paper')
				}
				const { publicUrl } = await uploadRes.json()

				// ── Step 3: Link paper URL to project ────────────────────
				setPhase('linking-paper')
				const patchRes = await fetch(`/api/projects/${project.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						paperUrl: publicUrl,
						paperFileName: file.name,
					}),
				})
				if (!patchRes.ok) throw new Error('Failed to link paper to project')

				// ── Step 4: Trigger analysis pipeline ────────────────────
				setPhase('starting-analysis')
				const analyzeRes = await fetch(`/api/projects/${project.id}/analyze`, {
					method: 'POST',
				})
				if (!analyzeRes.ok) {
					const err = await analyzeRes.json()
					throw new Error(err.error ?? 'Failed to start analysis')
				}
			}

			// ── Done: redirect to workspace ──────────────────────────────
			setPhase('done')
			router.push(`/app/projects/${project.id}`)
		} catch (err) {
			setPhase('error')
			setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred')
		}
	}

	const isSubmitting = phase !== 'idle' && phase !== 'error'

	return (
		<section className='mx-auto max-w-[860px]'>
			{/* ── Header ──────────────────────────────────────────────────── */}
			<div className='mb-10'>
				<Button
					asChild
					variant='outline'
					className='mb-8 h-10 rounded-full border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white/60 hover:bg-white/[0.07] hover:text-white'>
					<Link href='/app'>
						<ArrowLeft className='mr-2 h-3.5 w-3.5' />
						Back to projects
					</Link>
				</Button>

				<div className='flex items-center gap-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e7c35a]/10'>
						<Sparkles className='h-5 w-5 text-[#e7c35a]' />
					</div>
					<div>
						<p className='text-[0.68rem] uppercase tracking-[0.24em] text-[#e7c35a]'>
							New project
						</p>
						<h1 className='text-2xl font-semibold tracking-[-0.04em] text-white'>
							Analyze a research paper
						</h1>
					</div>
				</div>
				<p className='mt-3 max-w-lg text-sm leading-6 text-white/50'>
					Upload a paper, add the core metadata, and Lemma will score its commercial readiness through TRL, IRL, risk, and pathway analysis.
				</p>
			</div>

			{/* ── Form ────────────────────────────────────────────────────── */}
			<form onSubmit={handleSubmit} className='space-y-6'>
				{/* ── Upload area ── */}
				<div className='group relative overflow-hidden rounded-[28px] border border-dashed border-white/[0.08] bg-white/[0.02] transition-colors hover:border-[#e7c35a]/20 hover:bg-white/[0.03]'>
					{file ? (
						<div className='flex items-center gap-4 p-6'>
							<div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e7c35a]/10'>
								<FileText className='h-5 w-5 text-[#e7c35a]' />
							</div>
							<div className='min-w-0 flex-1'>
								<p className='truncate text-sm font-medium text-white'>
									{file.name}
								</p>
								<p className='mt-0.5 text-xs text-white/40'>
									{(file.size / 1024 / 1024).toFixed(1)} MB · PDF
								</p>
							</div>
							<button
								type='button'
								onClick={removeFile}
								disabled={isSubmitting}
								className='flex h-8 w-8 items-center justify-center rounded-xl text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60 disabled:opacity-30'>
								<X className='h-4 w-4' />
							</button>
						</div>
					) : (
						<button
							type='button'
							onClick={() => inputRef.current?.click()}
							className='flex w-full flex-col items-center justify-center px-6 py-12 text-center'>
							<div className='rounded-2xl bg-white/[0.06] p-4 transition-colors group-hover:bg-[#e7c35a]/10'>
								<FolderUp className='h-6 w-6 text-white/50 transition-colors group-hover:text-[#e7c35a]' />
							</div>
							<p className='mt-4 text-sm font-medium text-white'>
								Drop a research paper or click to browse
							</p>
							<p className='mt-1.5 text-xs text-white/35'>
								PDF up to 50 MB
							</p>
						</button>
					)}
					<input
						ref={inputRef}
						type='file'
						accept='application/pdf'
						className='sr-only'
						onChange={handleFileChange}
					/>
				</div>

				{/* ── Metadata grid ── */}
				<div className='rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-6'>
					<div className='grid gap-5 sm:grid-cols-2'>
						<label className='space-y-1.5 sm:col-span-2'>
							<span className='text-xs font-medium uppercase tracking-wider text-white/50'>
								Paper title
							</span>
							<input
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder='Attention Is All You Need'
								className={inputClassName}
								disabled={isSubmitting}
							/>
						</label>

						<label className='space-y-1.5'>
							<span className='text-xs font-medium uppercase tracking-wider text-white/50'>
								Institution
							</span>
							<input
								value={institution}
								onChange={(e) => setInstitution(e.target.value)}
								placeholder='Indian Institute of Technology Delhi'
								className={inputClassName}
								disabled={isSubmitting}
							/>
						</label>

						<label className='space-y-1.5'>
							<span className='text-xs font-medium uppercase tracking-wider text-white/50'>
								Lab / group
							</span>
							<input
								value={lab}
								onChange={(e) => setLab(e.target.value)}
								placeholder='Advanced Biomaterials Lab'
								className={inputClassName}
								disabled={isSubmitting}
							/>
						</label>

						<label className='space-y-1.5'>
							<span className='text-xs font-medium uppercase tracking-wider text-white/50'>
								Domain
							</span>
							<select
								value={domain}
								onChange={(e) => setDomain(e.target.value)}
								className={`${inputClassName} appearance-none`}
								disabled={isSubmitting}>
								{domainOptions.map((option) => (
									<option key={option} value={option} className='bg-[#0c0d10]'>
										{option}
									</option>
								))}
							</select>
						</label>

						<label className='space-y-1.5'>
							<span className='text-xs font-medium uppercase tracking-wider text-white/50'>
								Short note
								<span className='ml-1 normal-case tracking-normal text-white/25'>optional</span>
							</span>
							<input
								value={shortNote}
								onChange={(e) => setShortNote(e.target.value)}
								placeholder='Why is this paper worth a second look?'
								className={inputClassName}
								disabled={isSubmitting}
							/>
						</label>
					</div>
				</div>

				{/* ── Submit section ── */}
				<div className='flex flex-col items-center gap-4'>
					{phase === 'error' && (
						<div className='w-full rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-3'>
							<p className='text-sm text-red-400'>{errorMessage}</p>
							<button
								type='button'
								onClick={() => setPhase('idle')}
								className='mt-1 text-xs text-red-400/60 underline underline-offset-2 hover:text-red-400'>
								Try again
							</button>
						</div>
					)}

					{isSubmitting && (
						<div className='flex w-full items-center gap-3 rounded-2xl bg-[#e7c35a]/5 px-5 py-3'>
							<Loader2 className='h-4 w-4 shrink-0 animate-spin text-[#e7c35a]' />
							<div className='flex-1'>
								<p className='text-sm font-medium text-[#e7c35a]'>
									{phaseLabels[phase]}
								</p>
								<div className='mt-2 flex gap-1'>
									{(['creating-project', 'uploading-paper', 'linking-paper', 'starting-analysis'] as const).map(
										(step, i) => (
											<div
												key={step}
												className='h-1 flex-1 rounded-full transition-colors duration-500'
												style={{
													backgroundColor:
														(['creating-project', 'uploading-paper', 'linking-paper', 'starting-analysis'] as const).indexOf(phase as typeof step) >= i
															? 'rgba(231, 195, 90, 0.6)'
															: 'rgba(255, 255, 255, 0.06)',
												}}
											/>
										),
									)}
								</div>
							</div>
						</div>
					)}

					<Button
						type='submit'
						disabled={!isValid || isSubmitting}
						className='h-12 w-full rounded-full bg-white px-6 text-sm font-semibold text-black transition-all hover:bg-white/92 hover:shadow-[0_0_40px_rgba(231,195,90,0.12)] disabled:bg-white/10 disabled:text-white/30'>
						{isSubmitting ? (
							<>
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
								Processing...
							</>
						) : (
							<>
								Create project & analyze
								<ArrowRight className='ml-2 h-4 w-4' />
							</>
						)}
					</Button>

					{!isSubmitting && (
						<p className='text-center text-xs text-white/25'>
							Lemma will analyze your paper with AI agents for TRL scoring, risk assessment, and commercialization pathway.
						</p>
					)}
				</div>
			</form>
		</section>
	)
}

export default NewProjectForm
