'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
	ArrowLeft,
	ArrowRight,
	Building2,
	ClipboardList,
	FileText,
	FlaskConical,
	FolderUp,
	Loader2,
	Rocket,
	ShieldCheck,
	Sparkles,
	X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
	isProjectDomainOption,
	projectCreationPhaseLabels,
	projectDomainOptions,
	type ProjectCreationPhase,
	runProjectCreationFlow,
} from '@/lib/project-intake'
import { cn } from '@/lib/utils'
import {
	isOnboardingStep,
	onboardingGoalOptions,
	onboardingRoleOptions,
	RESEARCH_FOCUS_OPTIONS,
	type OnboardingGoalValue,
	type OnboardingRoleValue,
	type OnboardingStep,
} from '@/lib/onboarding-config'

type InitialState = {
	displayName: string
	email: string
	role: OnboardingRoleValue
	primaryGoal: OnboardingGoalValue | null
	institution: string
	labName: string
	researchFocus: string
	nextRoute: string
}

type CardOptionProps = {
	active: boolean
	title: string
	description: string
	icon: React.ReactNode
	onClick: () => void
}

const STEP_ORDER: OnboardingStep[] = ['intro', 'goal', 'role', 'profile', 'project']

const projectInputClassName =
	'h-12 w-full rounded-2xl border border-white/[0.08] bg-[#0e1014] px-4 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-[#e7c35a]/30 focus:bg-[#12151b]'

const shellAnimation = {
	initial: { opacity: 0, y: 16 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -10 },
	transition: { duration: 0.2, ease: 'easeOut' },
}

function CardOption({
	active,
	title,
	description,
	icon,
	onClick,
}: CardOptionProps) {
	return (
		<button
			type='button'
			onClick={onClick}
			className={cn(
				'group relative overflow-hidden rounded-[28px] border p-5 text-left transition-all duration-200 sm:p-6',
				active
					? 'border-[#e7c35a]/55 bg-[#e7c35a]/10 shadow-[0_0_0_1px_rgba(231,195,90,0.08)]'
					: 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.16] hover:bg-white/[0.05]',
			)}>
			<div className='absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(231,195,90,0.16),transparent_38%)] opacity-80' />
			<div className='relative'>
				<div
					className={cn(
						'flex h-12 w-12 items-center justify-center rounded-2xl border',
						active
							? 'border-[#e7c35a]/30 bg-[#e7c35a]/14 text-[#f4d777]'
							: 'border-white/[0.08] bg-white/[0.04] text-white/72',
					)}>
					{icon}
				</div>
				<h3 className='mt-5 text-base font-semibold tracking-[-0.03em] text-white'>
					{title}
				</h3>
				<p className='mt-2 text-sm leading-6 text-white/55'>{description}</p>
			</div>
		</button>
	)
}

export default function LemmaOnboardingFlow({
	initialState,
}: {
	initialState: InitialState
}) {
	const router = useRouter()
	const searchParams = useSearchParams()

	const currentStep = useMemo<OnboardingStep>(() => {
		const step = searchParams.get('step')
		return isOnboardingStep(step) ? step : 'intro'
	}, [searchParams])

	const [primaryGoal, setPrimaryGoal] = useState<OnboardingGoalValue | null>(
		initialState.primaryGoal,
	)
	const [role, setRole] = useState<OnboardingRoleValue>(initialState.role)
	const [institution, setInstitution] = useState(initialState.institution)
	const [labName, setLabName] = useState(initialState.labName)
	const [researchFocus, setResearchFocus] = useState(
		initialState.researchFocus || RESEARCH_FOCUS_OPTIONS[0],
	)
	const [projectTitle, setProjectTitle] = useState('')
	const [projectNote, setProjectNote] = useState('')
	const [projectFile, setProjectFile] = useState<File | null>(null)
	const [createdProjectId, setCreatedProjectId] = useState<string | null>(null)
	const [projectPhase, setProjectPhase] = useState<ProjectCreationPhase>('idle')
	const [errorMessage, setErrorMessage] = useState('')
	const [isSaving, setIsSaving] = useState(false)
	const showProjectProgress =
		projectPhase !== 'idle' && projectPhase !== 'error'

	const goToStep = useCallback((step: OnboardingStep) => {
		const params = new URLSearchParams(searchParams.toString())
		if (step === 'intro') {
			params.delete('step')
		} else {
			params.set('step', step)
		}
		const query = params.toString()
		router.replace(query ? `/onboarding?${query}` : '/onboarding')
	}, [router, searchParams])

	const stepIndex = STEP_ORDER.indexOf(currentStep)
	const progress = ((Math.max(stepIndex, 0) + 1) / STEP_ORDER.length) * 100

	const handleBack = () => {
		if (currentStep === 'intro') return
		goToStep(STEP_ORDER[Math.max(stepIndex - 1, 0)])
	}

	const saveOnboardingProfile = useCallback(async () => {
		const response = await fetch('/api/onboarding', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				primaryGoal,
				role,
				institution: institution.trim(),
				labName: labName.trim(),
				researchFocus,
			}),
		})

		if (!response.ok) {
			const data = await response.json().catch(() => null)
			throw new Error(
				data?.error?.formErrors?.[0] ??
					data?.error ??
					'Unable to finish onboarding.',
			)
		}

		return response.json().catch(() => null)
	}, [institution, labName, primaryGoal, researchFocus, role])

	const handleContinue = async () => {
		setErrorMessage('')

		if (currentStep === 'intro') {
			goToStep('goal')
			return
		}

		if (currentStep === 'goal') {
			if (!primaryGoal) {
				setErrorMessage('Choose the main outcome you want Lemma to optimize for.')
				return
			}
			goToStep('role')
			return
		}

		if (currentStep === 'role') {
			goToStep('profile')
			return
		}

		if (currentStep !== 'profile') return

		if (!institution.trim()) {
			setErrorMessage('Add your institution so Lemma can scope your workspace correctly.')
			return
		}

		if (!researchFocus.trim() || !primaryGoal) {
			setErrorMessage('Complete the profile fields before finishing setup.')
			return
		}

		goToStep('project')
	}

	useEffect(() => {
		if (currentStep === 'project' && !primaryGoal) {
			goToStep('goal')
		}
	}, [currentStep, goToStep, primaryGoal])

	const handleProjectFileChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const selected = event.target.files?.[0]
		if (selected) {
			setProjectFile(selected)
			if (projectPhase === 'error') {
				setProjectPhase('idle')
			}
		}
	}

	const handleRemoveProjectFile = () => {
		setProjectFile(null)
	}

	const handleSkipToDashboard = async () => {
		setErrorMessage('')
		setIsSaving(true)
		try {
			await saveOnboardingProfile()
			router.push('/app')
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : 'Unable to finish onboarding.',
			)
		} finally {
			setIsSaving(false)
		}
	}

	const handleCreateFirstWorkspace = async () => {
		setErrorMessage('')

		if (!projectTitle.trim()) {
			setErrorMessage('Add a paper title to create the first workspace.')
			return
		}

		if (!projectFile) {
			setErrorMessage('Upload a paper to create the first workspace.')
			return
		}

		setIsSaving(true)

		try {
			let projectId = createdProjectId

			if (!projectId) {
				const result = await runProjectCreationFlow({
					title: projectTitle,
					institution,
					lab: labName || 'General research group',
					domain: isProjectDomainOption(researchFocus)
						? researchFocus
						: projectDomainOptions[projectDomainOptions.length - 1],
					shortNote: projectNote,
					file: projectFile,
					onPhaseChange: setProjectPhase,
					onProjectCreated: setCreatedProjectId,
				})

				projectId = result.projectId
			}

			await saveOnboardingProfile()
			router.push(`/app/projects/${projectId}`)
		} catch (error) {
			setProjectPhase('error')
			setErrorMessage(
				error instanceof Error
					? error.message
					: 'Unable to create the first workspace.',
			)
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<div className='relative min-h-screen overflow-hidden bg-[#050607] text-white'>
			<div className='absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(231,195,90,0.14),transparent_34%),radial-gradient(circle_at_20%_20%,rgba(74,222,128,0.08),transparent_28%),linear-gradient(180deg,#08090b_0%,#050607_100%)]' />
			<div className='absolute inset-x-0 top-0 h-px bg-white/10' />
			<div className='absolute left-1/2 top-0 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#e7c35a]/10 blur-[140px]' />

			<div className='relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8'>
				<div className='flex items-center justify-between gap-4'>
					<div>
						<p className='text-[0.68rem] uppercase tracking-[0.28em] text-[#e7c35a]'>
							Lemma onboarding
						</p>
						<h1 className='mt-2 text-lg font-semibold tracking-[-0.04em] text-white sm:text-xl'>
							Configure the workspace around how your team evaluates research
						</h1>
					</div>
					{currentStep !== 'intro' ? (
						<Button
							type='button'
							variant='outline'
							onClick={handleBack}
							className='h-11 rounded-full border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white/70 hover:bg-white/[0.07] hover:text-white'>
							<ArrowLeft className='mr-2 h-4 w-4' />
							Back
						</Button>
					) : (
						<div className='rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs text-white/42'>
							{initialState.email}
						</div>
					)}
				</div>

				<div className='mt-6 h-1.5 overflow-hidden rounded-full bg-white/[0.06]'>
					<div
						className='h-full rounded-full bg-[linear-gradient(90deg,#f0d77a,#e7c35a)] transition-all duration-300'
						style={{ width: `${progress}%` }}
					/>
				</div>

				<div className='flex flex-1 items-center justify-center py-10 sm:py-14'>
					<AnimatePresence mode='wait'>
						{currentStep === 'intro' && (
							<motion.section
								key='intro'
								{...shellAnimation}
								className='w-full max-w-4xl text-center'>
								<div className='mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-[#e7c35a]/20 bg-[#e7c35a]/10'>
									<Sparkles className='h-7 w-7 text-[#f4d777]' />
								</div>
								<h2 className='mt-8 text-4xl font-semibold tracking-[-0.06em] text-white sm:text-6xl'>
									Welcome to Lemma, {initialState.displayName}.
								</h2>
								<p className='mx-auto mt-5 max-w-2xl text-base leading-8 text-white/58 sm:text-lg'>
									This setup mirrors the crisp, progressive onboarding flow you liked in Papermark,
									but tuned for research commercialization: align the goal, set the reviewer context,
									and prime the workspace before anyone lands in the app.
								</p>
								<div className='mx-auto mt-10 grid max-w-3xl gap-4 text-left sm:grid-cols-3'>
									<div className='rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5'>
										<FlaskConical className='h-5 w-5 text-[#e7c35a]' />
										<p className='mt-4 text-sm font-semibold text-white'>
											Research-first setup
										</p>
										<p className='mt-2 text-sm leading-6 text-white/48'>
											Guide the product toward paper triage, commercialization, or committee review.
										</p>
									</div>
									<div className='rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5'>
										<Building2 className='h-5 w-5 text-[#e7c35a]' />
										<p className='mt-4 text-sm font-semibold text-white'>
											Institution-aware defaults
										</p>
										<p className='mt-2 text-sm leading-6 text-white/48'>
											Carry your institution, lab, and domain context directly into new projects.
										</p>
									</div>
									<div className='rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5'>
										<ShieldCheck className='h-5 w-5 text-[#e7c35a]' />
										<p className='mt-4 text-sm font-semibold text-white'>
											Forced clean routing
										</p>
										<p className='mt-2 text-sm leading-6 text-white/48'>
											Everyone completes setup before the workspace opens, keeping first-run navigation consistent.
										</p>
									</div>
								</div>
								<Button
									type='button'
									onClick={handleContinue}
									className='mt-10 h-12 rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-white/92'>
									Start setup
									<ArrowRight className='ml-2 h-4 w-4' />
								</Button>
							</motion.section>
						)}

						{currentStep === 'goal' && (
							<motion.section
								key='goal'
								{...shellAnimation}
								className='w-full max-w-5xl'>
								<div className='mb-8 text-center'>
									<p className='text-sm uppercase tracking-[0.24em] text-[#e7c35a]'>
										Step 1
									</p>
									<h2 className='mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl'>
										What should Lemma optimize for first?
									</h2>
									<p className='mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/52 sm:text-base'>
										This shapes the first destination after onboarding and the language we use across the workspace.
									</p>
								</div>
								<div className='grid gap-4 md:grid-cols-2'>
									{onboardingGoalOptions.map((option) => (
										<CardOption
											key={option.value}
											active={primaryGoal === option.value}
											title={option.label}
											description={option.description}
											icon={<Rocket className='h-5 w-5' />}
											onClick={() => setPrimaryGoal(option.value)}
										/>
									))}
								</div>
							</motion.section>
						)}

						{currentStep === 'role' && (
							<motion.section
								key='role'
								{...shellAnimation}
								className='w-full max-w-5xl'>
								<div className='mb-8 text-center'>
									<p className='text-sm uppercase tracking-[0.24em] text-[#e7c35a]'>
										Step 2
									</p>
									<h2 className='mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl'>
										Which seat are you operating from?
									</h2>
									<p className='mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/52 sm:text-base'>
										We’ll use this to frame visibility and review language more appropriately inside Lemma.
									</p>
								</div>
								<div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
									{onboardingRoleOptions.map((option) => (
										<CardOption
											key={option.value}
											active={role === option.value}
											title={option.label}
											description={option.description}
											icon={<ClipboardList className='h-5 w-5' />}
											onClick={() => setRole(option.value)}
										/>
									))}
								</div>
							</motion.section>
						)}

						{currentStep === 'profile' && (
							<motion.section
								key='profile'
								{...shellAnimation}
								className='w-full max-w-3xl'>
								<div className='rounded-[32px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8'>
									<p className='text-sm uppercase tracking-[0.24em] text-[#e7c35a]'>
										Step 3
									</p>
									<h2 className='mt-3 text-3xl font-semibold tracking-[-0.05em] text-white'>
										Finish your workspace profile
									</h2>
									<p className='mt-3 max-w-2xl text-sm leading-7 text-white/52 sm:text-base'>
										These values are used as smart defaults when you create a project, so your first run through Lemma starts closer to real work.
									</p>

									<div className='mt-8 grid gap-5'>
										<label className='space-y-2'>
											<span className='text-xs font-medium uppercase tracking-[0.18em] text-white/46'>
												Institution
											</span>
											<input
												value={institution}
												onChange={(event) => setInstitution(event.target.value)}
												placeholder='Stanford Office of Technology Licensing'
												className='h-12 w-full rounded-[22px] border border-white/[0.08] bg-[#0e1014] px-4 text-sm text-white outline-none transition focus:border-[#e7c35a]/30 focus:bg-[#12151b]'
											/>
										</label>

										<label className='space-y-2'>
											<span className='text-xs font-medium uppercase tracking-[0.18em] text-white/46'>
												Lab or team
											</span>
											<input
												value={labName}
												onChange={(event) => setLabName(event.target.value)}
												placeholder='Computational Biology Lab'
												className='h-12 w-full rounded-[22px] border border-white/[0.08] bg-[#0e1014] px-4 text-sm text-white outline-none transition focus:border-[#e7c35a]/30 focus:bg-[#12151b]'
											/>
										</label>

										<div className='space-y-2'>
											<span className='text-xs font-medium uppercase tracking-[0.18em] text-white/46'>
												Primary research focus
											</span>
											<div className='flex flex-wrap gap-2'>
												{RESEARCH_FOCUS_OPTIONS.map((option) => (
													<button
														key={option}
														type='button'
														onClick={() => setResearchFocus(option)}
														className={cn(
															'rounded-full border px-4 py-2 text-sm transition-colors',
															researchFocus === option
																? 'border-[#e7c35a]/40 bg-[#e7c35a]/12 text-[#f4d777]'
																: 'border-white/[0.08] bg-white/[0.03] text-white/70 hover:border-white/[0.16] hover:text-white',
														)}>
														{option}
													</button>
												))}
											</div>
										</div>
									</div>

									{errorMessage ? (
										<p className='mt-5 text-sm text-red-300'>{errorMessage}</p>
									) : null}
								</div>
							</motion.section>
						)}

						{currentStep === 'project' && (
							<motion.section
								key='project'
								{...shellAnimation}
								className='w-full max-w-5xl'>
								<div className='grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
									<div className='rounded-[32px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8'>
										<p className='text-sm uppercase tracking-[0.24em] text-[#e7c35a]'>
											Optional first workspace
										</p>
										<h2 className='mt-3 text-3xl font-semibold tracking-[-0.05em] text-white'>
											Upload a paper and open your first project now
										</h2>
										<p className='mt-3 max-w-2xl text-sm leading-7 text-white/52 sm:text-base'>
											This is only shown on first login. If you create a workspace here, onboarding will end by sending you straight into that project dashboard.
										</p>

										<div className='mt-8 space-y-6'>
											<div className='group relative overflow-hidden rounded-[28px] border border-dashed border-white/[0.08] bg-white/[0.02] transition-colors hover:border-[#e7c35a]/20 hover:bg-white/[0.03]'>
												{projectFile ? (
													<div className='flex items-center gap-4 p-6'>
														<div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e7c35a]/10'>
															<FileText className='h-5 w-5 text-[#e7c35a]' />
														</div>
														<div className='min-w-0 flex-1'>
															<p className='truncate text-sm font-medium text-white'>
																{projectFile.name}
															</p>
															<p className='mt-0.5 text-xs text-white/40'>
																{(projectFile.size / 1024 / 1024).toFixed(1)} MB · PDF
															</p>
														</div>
														<button
															type='button'
															onClick={handleRemoveProjectFile}
															disabled={isSaving}
															className='flex h-8 w-8 items-center justify-center rounded-xl text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60 disabled:opacity-30'>
															<X className='h-4 w-4' />
														</button>
													</div>
												) : (
													<label className='flex cursor-pointer flex-col items-center justify-center px-6 py-12 text-center'>
														<div className='rounded-2xl bg-white/[0.06] p-4 transition-colors group-hover:bg-[#e7c35a]/10'>
															<FolderUp className='h-6 w-6 text-white/50 transition-colors group-hover:text-[#e7c35a]' />
														</div>
														<p className='mt-4 text-sm font-medium text-white'>
															Upload your research paper
														</p>
														<p className='mt-1.5 text-xs text-white/35'>
															PDF up to 50 MB
														</p>
														<input
															type='file'
															accept='application/pdf'
															className='sr-only'
															onChange={handleProjectFileChange}
														/>
													</label>
												)}
											</div>

											<div className='grid gap-5'>
												<label className='space-y-2'>
													<span className='text-xs font-medium uppercase tracking-[0.18em] text-white/46'>
														Paper title
													</span>
													<input
														value={projectTitle}
														onChange={(event) => setProjectTitle(event.target.value)}
														placeholder='Attention Is All You Need'
														className={projectInputClassName}
														disabled={isSaving}
													/>
												</label>

												<label className='space-y-2'>
													<span className='text-xs font-medium uppercase tracking-[0.18em] text-white/46'>
														Short note
														<span className='ml-1 normal-case tracking-normal text-white/25'>optional</span>
													</span>
													<input
														value={projectNote}
														onChange={(event) => setProjectNote(event.target.value)}
														placeholder='Why is this paper worth a second look?'
														className={projectInputClassName}
														disabled={isSaving}
													/>
												</label>
											</div>
										</div>
									</div>

									<div className='space-y-6'>
										<div className='rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6'>
											<p className='text-xs uppercase tracking-[0.18em] text-white/40'>
												Workspace defaults
											</p>
											<div className='mt-5 space-y-4 text-left'>
												<div>
													<p className='text-sm text-white/42'>Institution</p>
													<p className='mt-1 text-sm font-medium text-white'>{institution}</p>
												</div>
												<div>
													<p className='text-sm text-white/42'>Lab / team</p>
													<p className='mt-1 text-sm font-medium text-white'>
														{labName || 'General research group'}
													</p>
												</div>
												<div>
													<p className='text-sm text-white/42'>Research focus</p>
													<p className='mt-1 text-sm font-medium text-white'>{researchFocus}</p>
												</div>
											</div>
										</div>

										<div className='rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6'>
											<p className='text-xs uppercase tracking-[0.18em] text-white/40'>
												Choose the exit path
											</p>
											<p className='mt-4 text-sm leading-7 text-white/52'>
												Create the first workspace now, or finish onboarding and land in the main dashboard with no project created yet.
											</p>
											<div className='mt-6 flex flex-col gap-3'>
												<Button
													type='button'
													onClick={handleCreateFirstWorkspace}
													disabled={isSaving}
													className='h-12 rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-white/92 disabled:bg-white/70'>
													{showProjectProgress ? (
														<>
															<Loader2 className='mr-2 h-4 w-4 animate-spin' />
															Creating first workspace
														</>
													) : (
														<>
															Create first workspace
															<ArrowRight className='ml-2 h-4 w-4' />
														</>
													)}
												</Button>
												<Button
													type='button'
													variant='outline'
													onClick={handleSkipToDashboard}
													disabled={isSaving}
													className='h-12 rounded-full border-white/[0.08] bg-white/[0.04] px-6 text-sm text-white/70 hover:bg-white/[0.07] hover:text-white'>
													Skip to dashboard
												</Button>
											</div>
										</div>

										{showProjectProgress && (
											<div className='flex items-center gap-3 rounded-2xl bg-[#e7c35a]/5 px-5 py-4'>
												<Loader2 className='h-4 w-4 shrink-0 animate-spin text-[#e7c35a]' />
												<div className='flex-1'>
													<p className='text-sm font-medium text-[#e7c35a]'>
														{projectCreationPhaseLabels[projectPhase]}
													</p>
													<div className='mt-2 flex gap-1'>
														{(['creating-project', 'uploading-paper', 'linking-paper', 'starting-analysis'] as const).map(
															(step, index) => (
																<div
																	key={step}
																	className='h-1 flex-1 rounded-full transition-colors duration-500'
																	style={{
																		backgroundColor:
																			(['creating-project', 'uploading-paper', 'linking-paper', 'starting-analysis'] as const).indexOf(projectPhase as typeof step) >= index
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

										{createdProjectId && projectPhase === 'error' ? (
											<p className='text-xs leading-6 text-white/38'>
												The project draft already exists. Fix the onboarding error and retry to continue into the created workspace.
											</p>
										) : null}
									</div>
								</div>
							</motion.section>
						)}
					</AnimatePresence>
				</div>

				{currentStep !== 'project' ? (
					<div className='flex flex-col items-stretch justify-between gap-4 border-t border-white/[0.08] pt-6 sm:flex-row sm:items-center'>
						<div className='text-sm text-white/42'>
							{currentStep === 'intro'
								? 'A short first-run setup adapted for Lemma.'
								: 'This setup is required before the protected workspace opens.'}
						</div>
						<div className='flex items-center gap-3 self-end'>
							<Button
								type='button'
								onClick={handleContinue}
								disabled={isSaving}
								className='h-11 rounded-full bg-white px-5 text-sm font-semibold text-black hover:bg-white/92 disabled:bg-white/70'>
								{isSaving ? (
									<>
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
										Saving setup
									</>
								) : currentStep === 'profile' ? (
									'Continue to project setup'
								) : (
									<>
										Continue
										<ArrowRight className='ml-2 h-4 w-4' />
									</>
								)}
							</Button>
						</div>
					</div>
				) : null}
			</div>
		</div>
	)
}
