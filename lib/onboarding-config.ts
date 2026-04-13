export const ONBOARDING_STEPS = [
	'intro',
	'goal',
	'role',
	'profile',
	'project',
] as const

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]

export const ONBOARDING_GOALS = [
	'PAPER_EVALUATION',
	'COMMERCIALIZATION_PATHWAY',
	'COMMITTEE_REVIEW',
	'INVESTOR_DECK',
] as const

export type OnboardingGoalValue = (typeof ONBOARDING_GOALS)[number]

export const ONBOARDING_ROLES = [
	'RESEARCHER',
	'TTO_ANALYST',
	'TTO_LEAD',
	'COMMITTEE_MEMBER',
	'ADMIN',
] as const

export type OnboardingRoleValue = (typeof ONBOARDING_ROLES)[number]

export const RESEARCH_FOCUS_OPTIONS = [
	'Biotech / Materials',
	'Medtech',
	'Diagnostics',
	'Energy / Advanced materials',
	'Climate / Industrial',
	'AI / Software',
	'Other',
] as const

export const onboardingGoalOptions: Array<{
	value: OnboardingGoalValue
	label: string
	description: string
}> = [
	{
		value: 'PAPER_EVALUATION',
		label: 'Evaluate a paper',
		description:
			'Score technical maturity, commercial readiness, and the next diligence steps.',
	},
	{
		value: 'COMMERCIALIZATION_PATHWAY',
		label: 'Map the pathway',
		description:
			'Build a commercialization thesis across TRL, IRL, market pull, and grant fit.',
	},
	{
		value: 'COMMITTEE_REVIEW',
		label: 'Prepare review',
		description:
			'Organize the evidence and export-ready narrative needed for committee decisions.',
	},
	{
		value: 'INVESTOR_DECK',
		label: 'Shape a deck',
		description:
			'Turn research into an investor-facing story with risks, traction signals, and ask framing.',
	},
]

export const onboardingRoleOptions: Array<{
	value: OnboardingRoleValue
	label: string
	description: string
}> = [
	{
		value: 'RESEARCHER',
		label: 'Researcher',
		description: 'I need a fast commercialization read on my research.',
	},
	{
		value: 'TTO_ANALYST',
		label: 'TTO analyst',
		description: 'I triage disclosures and compare venture-readiness across projects.',
	},
	{
		value: 'TTO_LEAD',
		label: 'TTO lead',
		description: 'I manage pipeline quality, prioritization, and institutional outcomes.',
	},
	{
		value: 'COMMITTEE_MEMBER',
		label: 'Committee member',
		description: 'I review evidence and approve which opportunities move forward.',
	},
	{
		value: 'ADMIN',
		label: 'Admin',
		description: 'I configure the workspace and support the rest of the team.',
	},
]

export const getOnboardingDestination = (
	goal?: OnboardingGoalValue | null,
) => {
	switch (goal) {
		case 'COMMITTEE_REVIEW':
			return '/app/review'
		case 'COMMERCIALIZATION_PATHWAY':
			return '/app'
		case 'PAPER_EVALUATION':
		case 'INVESTOR_DECK':
		default:
			return '/app/projects/new'
	}
}

export const isOnboardingStep = (
	value: string | null | undefined,
): value is OnboardingStep =>
	Boolean(value && ONBOARDING_STEPS.includes(value as OnboardingStep))
