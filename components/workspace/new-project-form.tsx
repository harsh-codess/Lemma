'use client'

import Link from 'next/link'
import {
	ArrowLeft,
	ChevronDown,
	FileText,
	FolderUp,
	Lock,
	X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import AnalyzePaperButton from '@/components/workspace/analyze-paper-button'
import {
	isProjectDomainOption,
	projectCreationPhaseLabels,
	projectDomainOptions,
	type ProjectCreationPhase,
	runProjectCreationFlow,
} from '@/lib/project-intake'
import { cn } from '@/lib/utils'

const AUTO_DETECT_DOMAIN = 'Auto-detect'

const intentOptions = [
	'Validate commercial potential',
	'Prepare for funding',
	'Explore startup idea',
	'Just analyze',
] as const

const inputClassName =
	'h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 pr-11 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-blue-500/40 focus:bg-white/[0.05]'

const helperTextClassName = 'mt-2 text-xs leading-5 text-white/35'

const formatBytes = (bytes: number) => {
	if (!Number.isFinite(bytes)) return ''
	const value = bytes / 1024 / 1024
	return `${value.toFixed(value >= 10 ? 0 : 1)} MB`
}

const deriveTitleFromFile = (file: File | null) => {
	if (!file) return ''
	return file.name
		.replace(/\.[^.]+$/, '')
		.replace(/[-_]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
}

const NewProjectForm = () => {
	const router = useRouter()
	const inputRef = useRef<HTMLInputElement | null>(null)

	const [institution, setInstitution] = useState('')
	const [lab, setLab] = useState('')
	const [researchFocus, setResearchFocus] = useState('')
	const [selectedDomain, setSelectedDomain] = useState<string>(AUTO_DETECT_DOMAIN)
	const [intent, setIntent] = useState<(typeof intentOptions)[number]>(
		intentOptions[0],
	)
	const [isConfidential, setIsConfidential] = useState(false)
	const [notes, setNotes] = useState('')
	const [file, setFile] = useState<File | null>(null)

	const [phase, setPhase] = useState<ProjectCreationPhase>('idle')
	const [errorMessage, setErrorMessage] = useState('')
	const [createdProjectId, setCreatedProjectId] = useState<string | null>(null)
	const [didHydrateDefaults, setDidHydrateDefaults] = useState(false)
	const [previewUrl, setPreviewUrl] = useState<string | null>(null)

	const resolvedDomain = useMemo(() => {
		if (selectedDomain !== AUTO_DETECT_DOMAIN) return selectedDomain
		if (isProjectDomainOption(researchFocus)) return researchFocus
		return 'Other'
	}, [researchFocus, selectedDomain])

	const derivedTitle = useMemo(() => deriveTitleFromFile(file), [file])
	const isSubmitting = phase !== 'idle' && phase !== 'error'

	useEffect(() => {
		if (didHydrateDefaults) return

		let isCancelled = false

		fetch('/api/onboarding')
			.then((response) => (response.ok ? response.json() : null))
			.then((data) => {
				if (isCancelled || !data) return
				if (data.institution) setInstitution(data.institution)
				if (data.labName) setLab(data.labName)
				if (data.researchFocus) setResearchFocus(data.researchFocus)
				setDidHydrateDefaults(true)
			})
			.catch(() => {
				if (!isCancelled) {
					setDidHydrateDefaults(true)
				}
			})

		return () => {
			isCancelled = true
		}
	}, [didHydrateDefaults])

	useEffect(() => {
		if (!file) {
			setPreviewUrl(null)
			return
		}

		const url = URL.createObjectURL(file)
		setPreviewUrl(url)

		return () => {
			URL.revokeObjectURL(url)
		}
	}, [file])

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const selected = event.target.files?.[0]
		if (!selected) return
		setFile(selected)
		setErrorMessage('')
		if (phase === 'error') {
			setPhase('idle')
		}
	}

	const removeFile = () => {
		setFile(null)
		setCreatedProjectId(null)
		setErrorMessage('')
		if (phase === 'error') {
			setPhase('idle')
		}
		if (inputRef.current) {
			inputRef.current.value = ''
		}
	}

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		if (!file || isSubmitting) return

		setErrorMessage('')
		setCreatedProjectId(null)

		const shortNoteParts = [
			`Intent: ${intent}.`,
			isConfidential ? 'Confidential: unpublished or sensitive research.' : null,
			notes.trim() ? `Notes: ${notes.trim()}` : null,
		].filter(Boolean)

		try {
			const { projectId } = await runProjectCreationFlow({
				title: derivedTitle || 'Untitled research paper',
				institution: institution || 'Independent Research Organization',
				lab: lab || 'General research group',
				domain: resolvedDomain,
				shortNote: shortNoteParts.join(' '),
				file,
				onPhaseChange: setPhase,
				onProjectCreated: setCreatedProjectId,
			})

			router.push(`/app/projects/${projectId}`)
		} catch (err) {
			setPhase('error')
			setErrorMessage(
				err instanceof Error ? err.message : 'An unexpected error occurred',
			)
		}
	}

	return (
		<section className='mx-auto max-w-[1180px] lg:flex lg:h-full lg:flex-col lg:overflow-hidden'>
			<div className='mb-4 lg:mb-3 lg:flex-none'>
				<Button
					asChild
					variant='outline'
					className='h-10 rounded-full border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white/60 hover:bg-white/[0.07] hover:text-white'>
					<Link href='/app'>
						<ArrowLeft className='mr-2 h-3.5 w-3.5' />
						Back to projects
					</Link>
				</Button>
			</div>

			<div className='grid grid-cols-1 gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-2 lg:gap-6'>
				<div className='space-y-4 lg:flex lg:min-h-0 lg:flex-col lg:space-y-3'>
					<div>
						<p className='text-[0.68rem] uppercase tracking-[0.24em] text-[#e7c35a]'>
							New project
						</p>
						<h1 className='mt-2 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-[2.45rem]'>
							Analyze a research paper
						</h1>
						<p className='mt-2 max-w-xl text-sm leading-6 text-white/48'>
							Upload a paper and Lemma will evaluate its commercial potential.
						</p>
					</div>

					<form onSubmit={handleSubmit} className='space-y-4 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:space-y-3'>
						<div
							className={cn(
								'group relative rounded-2xl border border-dashed border-white/10 bg-white/[0.02] transition-all duration-200 hover:border-blue-500/40 hover:bg-white/[0.03] hover:shadow-[0_0_0_1px_rgba(59,130,246,0.12),0_18px_50px_rgba(0,0,0,0.22)]',
								file && 'border-solid border-white/[0.08]',
							)}>
							{file ? (
								<div className='flex items-center gap-4 p-5'>
									<div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300'>
										<FileText className='h-5 w-5' />
									</div>
									<div className='min-w-0 flex-1'>
										<p className='truncate text-sm font-medium text-white'>
											{file.name}
										</p>
										<p className='mt-1 text-xs text-white/40'>
											{formatBytes(file.size)} · PDF
										</p>
									</div>
									<button
										type='button'
										onClick={removeFile}
										disabled={isSubmitting}
										className='flex h-9 w-9 items-center justify-center rounded-xl text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60 disabled:opacity-30'>
										<X className='h-4 w-4' />
									</button>
								</div>
							) : (
								<button
									type='button'
									onClick={() => inputRef.current?.click()}
									className='flex min-h-[180px] w-full flex-col items-center justify-center gap-3 px-6 py-7 text-center lg:min-h-[156px] lg:py-6'>
									<div className='rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-blue-300 transition-colors group-hover:border-blue-500/30 group-hover:bg-blue-500/10'>
										<FolderUp className='h-6 w-6' />
									</div>
									<p className='text-base font-medium text-white'>
										Upload your paper
									</p>
									<p className='max-w-[260px] text-sm leading-6 text-white/40'>
										Click to browse or drag a PDF here. Files up to 50MB.
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

						<div className='space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 lg:flex-none'>
							<div>
								<label className='text-xs font-medium uppercase tracking-[0.18em] text-white/46'>
									Domain
								</label>
								<div className='relative mt-2'>
									<select
										value={selectedDomain}
										onChange={(event) => setSelectedDomain(event.target.value)}
										className={cn(inputClassName, 'appearance-none')}
										disabled={isSubmitting}>
										<option value={AUTO_DETECT_DOMAIN} className='bg-[#0c0d10]'>
											Auto-detect
										</option>
										{projectDomainOptions.map((option) => (
											<option key={option} value={option} className='bg-[#0c0d10]'>
												{option}
											</option>
										))}
									</select>
									<ChevronDown className='pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35' />
								</div>
								<p className={helperTextClassName}>
									Lemma will detect automatically
									{selectedDomain === AUTO_DETECT_DOMAIN && isProjectDomainOption(researchFocus)
										? ` · current workspace focus: ${researchFocus}`
										: ''}
								</p>
							</div>

							<div>
								<label className='text-xs font-medium uppercase tracking-[0.18em] text-white/46'>
									Intent
								</label>
								<div className='relative mt-2'>
									<select
										value={intent}
										onChange={(event) =>
											setIntent(event.target.value as (typeof intentOptions)[number])
										}
										className={cn(inputClassName, 'appearance-none')}
										disabled={isSubmitting}>
										{intentOptions.map((option) => (
											<option key={option} value={option} className='bg-[#0c0d10]'>
												{option}
											</option>
										))}
									</select>
									<ChevronDown className='pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35' />
								</div>
							</div>

							<div className='rounded-xl border border-blue-500/20 bg-[#0A0F1C] p-3.5 shadow-[0_0_0_1px_rgba(59,130,246,0.06)]'>
								<button
									type='button'
									onClick={() => setIsConfidential((value) => !value)}
									className='flex w-full items-center gap-4 text-left'>
									<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-300'>
										<Lock className='h-4 w-4' />
									</div>
									<div className='min-w-0 flex-1'>
										<p className='text-sm font-medium text-white'>
											Unpublished or confidential
										</p>
										<p className='mt-1 text-xs leading-5 text-white/38'>
											Never stored or used for training
										</p>
									</div>
									<div
										className={cn(
											'relative h-7 w-12 shrink-0 rounded-full border transition-colors',
											isConfidential
												? 'border-blue-400/50 bg-blue-500/25 shadow-[0_0_20px_rgba(59,130,246,0.18)]'
												: 'border-white/12 bg-white/[0.08]',
										)}>
										<span
											className={cn(
												'absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
												isConfidential ? 'translate-x-[24px]' : 'translate-x-[3px]',
											)}
										/>
									</div>
								</button>
							</div>

							<div>
								<label className='text-xs font-medium uppercase tracking-[0.18em] text-white/46'>
									Notes
								</label>
								<textarea
									value={notes}
									onChange={(event) => setNotes(event.target.value)}
									placeholder='Anything we should know?'
									rows={3}
									className={cn(
										'mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-blue-500/40 focus:bg-white/[0.05]',
									)}
									disabled={isSubmitting}
								/>
							</div>
						</div>

						{phase === 'error' ? (
							<div className='rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3'>
								<p className='text-sm text-red-300'>{errorMessage}</p>
								{createdProjectId ? (
									<Link
										href={`/app/projects/${createdProjectId}`}
										className='mt-2 inline-flex text-xs text-red-100/70 underline underline-offset-2 hover:text-white'>
										Open created draft
									</Link>
								) : null}
							</div>
						) : null}

						<AnalyzePaperButton
							type='submit'
							disabled={!file || isSubmitting}
							loading={isSubmitting}
							loadingLabel={projectCreationPhaseLabels[phase] || 'Processing...'}
							className='mt-1 lg:mt-auto lg:flex-none'>
							Analyze this paper
						</AnalyzePaperButton>
					</form>
				</div>

				<div className='lg:min-h-0'>
					<div className='rounded-xl border border-white/10 bg-[#0A0F1C] p-4 lg:flex lg:h-full lg:min-h-0 lg:flex-col'>
						<div className='mb-3 flex items-center justify-between gap-4 lg:flex-none'>
							<div>
								<p className='text-sm font-medium text-white'>PDF preview</p>
								<p className='mt-1 text-xs text-white/36'>
									Preview the uploaded paper before analysis
								</p>
							</div>
							{file ? (
								<div className='rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/42'>
									{formatBytes(file.size)}
								</div>
							) : null}
						</div>

						<div className='overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#0d1422] lg:flex-1'>
							{previewUrl ? (
								<iframe
									key={previewUrl}
									src={previewUrl}
									title='PDF preview'
									className='h-[360px] w-full bg-white lg:h-full lg:min-h-0'
								/>
							) : (
								<div className='flex h-[360px] flex-col items-center justify-center px-8 text-center lg:h-full lg:min-h-0'>
									<div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/18 bg-blue-500/10 text-blue-300'>
										<FileText className='h-6 w-6' />
									</div>
									<p className='mt-5 text-base font-medium text-white'>
										Your PDF preview will appear here
									</p>
									<p className='mt-2 max-w-[280px] text-sm leading-6 text-white/38'>
										Upload a research paper on the left to review it before sending it into Lemma&apos;s analysis pipeline.
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}

export default NewProjectForm
