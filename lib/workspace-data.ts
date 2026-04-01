export type ProjectStageKey =
	| 'paper'
	| 'trl-irl'
	| 'market'
	| 'feasibility'
	| 'deck'
	| 'review'

export type ProjectStatus = 'Draft' | 'In review' | 'Ready for export'
export type StageStatus = 'complete' | 'current' | 'upcoming'

export interface ProjectStage {
	key: ProjectStageKey
	label: string
	description: string
	status: StageStatus
}

export interface EvidenceItem {
	id: string
	stageKey: ProjectStageKey
	claim: string
	sourceType: 'Paper' | 'Patent' | 'News' | 'Funding' | 'Market report' | 'Internal note'
	sourceTitle: string
	confidence: 'High' | 'Medium' | 'Watch'
	summary: string
}

export interface CompetitorItem {
	id: string
	name: string
	positioning: string
	stage: string
	signal: string
}

export interface MarketSignal {
	id: string
	title: string
	type: 'Funding' | 'Patent' | 'Demand' | 'Policy'
	impact: 'High' | 'Medium' | 'Watch'
	summary: string
}

export interface FeasibilitySummary {
	teamRequirements: string[]
	timeline: string
	capitalEstimate: string
	grantFit: string
	keyRisks: string[]
}

export interface DeckSlideOutline {
	id: string
	order: number
	title: string
	keyPoint: string
}

export interface ReviewNote {
	id: string
	author: string
	role: string
	stageKey: ProjectStageKey
	status: 'Open' | 'Resolved'
	comment: string
}

export interface CopilotPrompt {
	id: string
	label: string
	answer: string
}

export interface WorkspaceProject {
	id: string
	title: string
	institution: string
	lab: string
	owner: string
	status: ProjectStatus
	currentStage: ProjectStageKey
	updatedAt: string
	readinessScore: number
	domain: string
	shortNote: string
	stages: ProjectStage[]
	paper: {
		abstractSummary: string
		noveltySummary: string
		domainClassification: string
		keyClaims: string[]
	}
	trlIrl: {
		trlScore: string
		irlScore: string
		rationale: string[]
		confidence: string
		riskFlags: string[]
	}
	market: {
		tam: string
		sam: string
		som: string
		summary: string
		competitors: CompetitorItem[]
		signals: MarketSignal[]
	}
	feasibility: FeasibilitySummary
	deck: {
		fundingAsk: string
		keyNarrativePoints: string[]
		slides: DeckSlideOutline[]
	}
	review: {
		status: string
		exportReadiness: string
		approvalChecklist: string[]
		notes: ReviewNote[]
	}
	evidence: EvidenceItem[]
	copilot: Record<ProjectStageKey, CopilotPrompt[]>
}

export interface WorkspaceProjectDraftInput {
	title: string
	institution: string
	lab: string
	domain: string
	shortNote: string
	fileName?: string
}

export const workspaceNavItems = [
	{
		href: '/app',
		label: 'Projects',
		description: 'Portfolio and active workspaces',
	},
	{
		href: '/app/review',
		label: 'Review',
		description: 'Committee queue and approvals',
	},
	{
		href: '/app/exports',
		label: 'Exports',
		description: 'Decks, briefs, and reports',
	},
	{
		href: '/app/settings',
		label: 'Settings',
		description: 'Templates and workspace controls',
	},
] as const

export const workspaceStageOrder: Array<{
	key: ProjectStageKey
	label: string
	description: string
}> = [
	{
		key: 'paper',
		label: 'Paper',
		description: 'Understand the research and its core claim.',
	},
	{
		key: 'trl-irl',
		label: 'TRL / IRL',
		description: 'Score maturity, readiness, and risk.',
	},
	{
		key: 'market',
		label: 'Market',
		description: 'Map demand, competitors, patents, and signals.',
	},
	{
		key: 'feasibility',
		label: 'Feasibility',
		description: 'Estimate team, timeline, capital, and grant fit.',
	},
	{
		key: 'deck',
		label: 'Deck',
		description: 'Frame the venture narrative and funding ask.',
	},
	{
		key: 'review',
		label: 'Review',
		description: 'Prepare for committee approval and export readiness.',
	},
] as const

const WORKSPACE_DRAFT_STORAGE_KEY = 'lemma.workspace.drafts.v1'

const createStages = (currentStage: ProjectStageKey): ProjectStage[] => {
	const currentIndex = workspaceStageOrder.findIndex((stage) => stage.key === currentStage)

	return workspaceStageOrder.map((stage, index) => {
		const status: StageStatus =
			index < currentIndex
				? 'complete'
				: index === currentIndex
					? 'current'
					: 'upcoming'

		return {
			...stage,
			status,
		}
	})
}

const createProject = (
	project: Omit<WorkspaceProject, 'stages'> & { stages?: WorkspaceProject['stages'] }
): WorkspaceProject => {
	return {
		...project,
		stages: project.stages ?? createStages(project.currentStage),
	}
}

const defaultCopilot = (projectTitle: string): WorkspaceProject['copilot'] => ({
	paper: [
		{
			id: 'paper-explain',
			label: 'Explain the core technical claim',
			answer: `${projectTitle} is strongest when it stays anchored in the technical moat. The best investor framing is not “interesting science,” but “a defensible product path created by a specific research advantage.”`,
		},
		{
			id: 'paper-rewrite',
			label: 'Rewrite the abstract for an incubator team',
			answer: 'Frame the work as a commercialization summary: what problem it solves, what is novel, why it is harder to copy than a generic lab result, and what proof already exists in the paper.',
		},
	],
	'trl-irl': [
		{
			id: 'trl-risk',
			label: 'Explain the readiness score',
			answer: 'The score is driven by how much of the system has been validated outside ideal lab conditions, how transferable the process is, and whether the output can support a credible next funding milestone.',
		},
		{
			id: 'trl-risks',
			label: 'Surface the biggest commercialization risks',
			answer: 'The key watch-outs are repeatability outside the lab, regulatory or procurement friction, and whether the current validation is enough to support the next checkwriters in the process.',
		},
	],
	market: [
		{
			id: 'market-summary',
			label: 'Summarize the market in plain English',
			answer: 'The goal is not a giant market paragraph. It is a tight argument that there is a real buyer, that adjacent players are already proving demand, and that the timing is not purely speculative.',
		},
		{
			id: 'market-compare',
			label: 'Compare against current competitors',
			answer: 'Focus on differentiation through technical edge, deployment fit, and why the research story creates a different margin or adoption path from incumbents and adjacent startups.',
		},
	],
	feasibility: [
		{
			id: 'feasibility-team',
			label: 'What team is needed next?',
			answer: 'The immediate next hires should support translation, not scale theatre. The strongest early team mixes technical continuity from the lab with one operator who can own pilots, grants, and venture readiness.',
		},
		{
			id: 'feasibility-funding',
			label: 'Explain the capital plan',
			answer: 'Treat funding as milestone-based. The right ask is the amount needed to hit the next clear proof point, not a padded venture number disconnected from what the science can justify today.',
		},
	],
	deck: [
		{
			id: 'deck-story',
			label: 'Rewrite the investor narrative',
			answer: 'The deck should move from problem to technical wedge to proof to market timing to capital path. Every slide should feel like a step in a commercialization argument, not a generic startup template.',
		},
		{
			id: 'deck-ask',
			label: 'Tighten the funding ask',
			answer: 'The ask should connect directly to milestones, evidence generation, and the unlock for the next round or institutional decision. Investors need to see what changes after this capital is deployed.',
		},
	],
	review: [
		{
			id: 'review-prepare',
			label: 'Prepare for committee review',
			answer: 'A review-ready package needs clear claims, visible evidence, explicit risks, and a concrete recommendation. The committee should be able to inspect why Lemma believes this project is worth the next step.',
		},
		{
			id: 'review-export',
			label: 'Summarize what is ready to export',
			answer: 'Only export material that the institution would be comfortable sharing externally today: a defensible summary, a clear score narrative, the market brief, and an investor-facing draft that still preserves scientific nuance.',
		},
	],
})

export const workspaceProjects: WorkspaceProject[] = [
	createProject({
		id: 'bioactive-coating-spinout',
		title: 'Bioactive surface coating spinout',
		institution: 'Indian Institute of Technology Delhi',
		lab: 'Advanced Biomaterials Lab',
		owner: 'Dr. Kavya Raman',
		status: 'In review',
		currentStage: 'market',
		updatedAt: '2026-03-29T17:40:00.000Z',
		readinessScore: 82,
		domain: 'Biotech / Materials',
		shortNote: 'Prioritized for TTO review after strong TRL and low patent overlap.',
		paper: {
			abstractSummary:
				'The paper describes an antimicrobial coating process for implant surfaces that improves resistance to infection while preserving material performance.',
			noveltySummary:
				'The research appears differentiated through the coating chemistry and its compatibility with existing implant manufacturing pathways.',
			domainClassification: 'Primary: Biotech / Materials. Secondary: Medtech.',
			keyClaims: [
				'Improves surface resistance to infection in implant-like environments.',
				'Can integrate with existing implant material stacks.',
				'Creates a translational path toward hospital and device partnerships.',
			],
		},
		trlIrl: {
			trlScore: 'TRL 5',
			irlScore: 'IRL 6.2 / 10',
			rationale: [
				'Validated beyond purely theoretical work and supported by experimental evidence.',
				'Commercial readiness is constrained more by translation and evidence packaging than by novelty.',
				'The path to venture readiness depends on proving deployment economics and regulatory sequencing.',
			],
			confidence: '82% confidence based on paper evidence, adjacent market signals, and competitor maturity.',
			riskFlags: [
				'Pilot design needs to demonstrate repeatability outside ideal lab conditions.',
				'Clinical procurement pathway should be clarified before broader investor outreach.',
			],
		},
		market: {
			tam: '$4.2B',
			sam: '$1.1B',
			som: '$180M',
			summary:
				'The strongest near-term market story sits around infection-sensitive implant categories where prevention can command procurement attention and premium value.',
			competitors: [
				{
					id: 'competitor-1',
					name: 'SurfaceShield Bio',
					positioning: 'Antimicrobial implant coating platform for premium surgical devices.',
					stage: 'Series A',
					signal: 'Raised an extension round tied to hospital pilot traction.',
				},
				{
					id: 'competitor-2',
					name: 'NanoGuard Med',
					positioning: 'Protective surface chemistry for long-life device coatings.',
					stage: 'Seed',
					signal: 'Published new filings around adjacent coating durability claims.',
				},
				{
					id: 'competitor-3',
					name: 'Biolayer Systems',
					positioning: 'Hospital-acquired infection prevention through material science.',
					stage: 'Strategic pilot',
					signal: 'Partnered with a regional device manufacturer for validation.',
				},
			],
			signals: [
				{
					id: 'signal-1',
					title: 'Funding activity increased across infection-prevention materials',
					type: 'Funding',
					impact: 'High',
					summary: 'Recent financings suggest investor appetite for hospital cost-reduction narratives tied to infection control.',
				},
				{
					id: 'signal-2',
					title: 'Patent density is strongest in adjacent implant categories',
					type: 'Patent',
					impact: 'Medium',
					summary: 'The strongest overlap sits in adjacent categories rather than in the specific coating pathway described here.',
				},
				{
					id: 'signal-3',
					title: 'Procurement teams are under pressure to justify infection-reduction spend',
					type: 'Demand',
					impact: 'High',
					summary: 'This supports a commercial story focused on economic outcomes rather than pure material novelty.',
				},
			],
		},
		feasibility: {
			teamRequirements: [
				'Principal investigator or technical founder continuity',
				'Materials engineer with pilot-transfer experience',
				'Commercial operator for hospital and device partnerships',
			],
			timeline: '12 to 18 months to reach an investor-ready pilot package.',
			capitalEstimate: '₹1.2 Cr seed plus grant-supported validation.',
			grantFit: 'DST SBIRI and medtech translational grants.',
			keyRisks: [
				'External validation package needs to be shaped for non-academic reviewers.',
				'Procurement proof may matter as much as technical proof for the next raise.',
			],
		},
		deck: {
			fundingAsk: '₹2 Cr to complete pilots, regulatory preparation, and early device partnerships.',
			keyNarrativePoints: [
				'Healthcare systems already spend to prevent device-related infection.',
				'The paper provides a concrete technical wedge, not generic platform science.',
				'The next milestone is a translation package strong enough for grant and seed committees.',
			],
			slides: [
				{ id: 'slide-1', order: 1, title: 'Problem & opportunity', keyPoint: 'Hospital infection prevention is expensive and urgent.' },
				{ id: 'slide-2', order: 2, title: 'Technology moat', keyPoint: 'The coating pathway is defensible and compatible with existing surfaces.' },
				{ id: 'slide-3', order: 3, title: 'Market timing', keyPoint: 'Recent funding and procurement pressure support near-term relevance.' },
				{ id: 'slide-4', order: 4, title: 'Capital path', keyPoint: 'The ask funds pilots, packaging, and venture-ready proof.' },
			],
		},
		review: {
			status: 'Awaiting TTO comments',
			exportReadiness: 'Deck draft and market brief are ready for internal review.',
			approvalChecklist: [
				'Confirm IP ownership and filing strategy',
				'Validate commercialization assumptions with the PI',
				'Approve external deck language before investor sharing',
			],
			notes: [
				{
					id: 'review-note-1',
					author: 'Ritika Sen',
					role: 'TTO lead',
					stageKey: 'review',
					status: 'Open',
					comment: 'The market narrative is strong. Please tighten the IP section before external sharing.',
				},
				{
					id: 'review-note-2',
					author: 'Arjun Mehta',
					role: 'Incubator associate',
					stageKey: 'deck',
					status: 'Resolved',
					comment: 'Funding ask now reads clearly against milestones and pilot goals.',
				},
			],
		},
		evidence: [
			{
				id: 'evidence-1',
				stageKey: 'paper',
				claim: 'The coating process preserves material compatibility while improving infection resistance.',
				sourceType: 'Paper',
				sourceTitle: 'Primary research manuscript',
				confidence: 'High',
				summary: 'Experimental sections support both the antimicrobial effect and material compatibility claim.',
			},
			{
				id: 'evidence-2',
				stageKey: 'market',
				claim: 'Adjacent startups have successfully raised around infection-prevention material narratives.',
				sourceType: 'Funding',
				sourceTitle: 'Recent medtech financing digest',
				confidence: 'Medium',
				summary: 'Capital has flowed into adjacent categories with strong hospital cost-savings framing.',
			},
			{
				id: 'evidence-3',
				stageKey: 'feasibility',
				claim: 'Grant pathways can subsidize a meaningful portion of validation work.',
				sourceType: 'Internal note',
				sourceTitle: 'Grant fit memo',
				confidence: 'Medium',
				summary: 'The current scope aligns with translational grant programs relevant to medtech and materials.',
			},
			{
				id: 'evidence-4',
				stageKey: 'review',
				claim: 'The project is ready for internal committee review before investor outreach.',
				sourceType: 'Internal note',
				sourceTitle: 'TTO review summary',
				confidence: 'High',
				summary: 'Outputs are sufficiently structured for institutional decision-making, but IP copy still needs review.',
			},
		],
		copilot: defaultCopilot('Bioactive surface coating spinout'),
	}),
	createProject({
		id: 'graphene-storage-platform',
		title: 'Graphene energy storage platform',
		institution: 'Indian Institute of Science Bengaluru',
		lab: 'Electrochemical Systems Group',
		owner: 'Prof. Neel Rao',
		status: 'Draft',
		currentStage: 'trl-irl',
		updatedAt: '2026-03-27T11:15:00.000Z',
		readinessScore: 68,
		domain: 'Energy / Advanced materials',
		shortNote: 'Strong technical upside, but translation story needs sharper market segmentation.',
		paper: {
			abstractSummary:
				'The paper presents a graphene-based energy storage architecture intended to improve charge cycles and system durability.',
			noveltySummary:
				'The scientific differentiation is compelling, but the commercialization wedge depends on choosing the right application layer.',
			domainClassification: 'Primary: Energy. Secondary: Advanced materials.',
			keyClaims: [
				'Improves durability compared with common benchmark materials.',
				'Could support industrial energy storage or grid-adjacent deployments.',
				'Needs clearer application framing before external commercialization messaging.',
			],
		},
		trlIrl: {
			trlScore: 'TRL 4',
			irlScore: 'IRL 5.4 / 10',
			rationale: [
				'The research is promising but still needs translation into a specific commercial use case.',
				'The technical story is ahead of the venture story at this stage.',
				'Market and pilot framing will do most of the work in the next iteration.',
			],
			confidence: '68% confidence while application focus remains broad.',
			riskFlags: [
				'Use-case ambiguity is suppressing the commercial score.',
				'Cost and deployment assumptions need sharper benchmarking.',
			],
		},
		market: {
			tam: '$6.8B',
			sam: '$1.9B',
			som: '$220M',
			summary:
				'The technology could play across several storage categories, but the investable thesis likely needs a narrower vertical and cleaner customer problem.',
			competitors: [
				{
					id: 'competitor-4',
					name: 'VoltStack Materials',
					positioning: 'Advanced energy storage materials for industrial storage systems.',
					stage: 'Seed',
					signal: 'Partnered with a grid hardware integrator.',
				},
				{
					id: 'competitor-5',
					name: 'AnodeGrid Labs',
					positioning: 'Battery material improvements for demanding cycle environments.',
					stage: 'Pilot',
					signal: 'Released performance benchmarks against incumbent chemistries.',
				},
			],
			signals: [
				{
					id: 'signal-4',
					title: 'Industrial storage buyers are prioritizing reliability over novelty',
					type: 'Demand',
					impact: 'High',
					summary: 'The best go-to-market path likely starts with reliability-sensitive industrial deployments.',
				},
				{
					id: 'signal-5',
					title: 'Policy tailwinds continue for localized storage solutions',
					type: 'Policy',
					impact: 'Medium',
					summary: 'There is opportunity, but the buyer story needs to stay specific and grounded.',
				},
			],
		},
		feasibility: {
			teamRequirements: [
				'Materials science continuity',
				'Battery systems engineer or industrial deployment specialist',
				'Commercial lead for pilots and industry partnerships',
			],
			timeline: '18 to 24 months to reach strong pilot readiness.',
			capitalEstimate: '₹1.8 Cr across pilot engineering and validation.',
			grantFit: 'Energy storage and industrial decarbonization grant programs.',
			keyRisks: [
				'Application focus must narrow before the venture story becomes strong.',
				'Cost benchmarking will matter heavily in investor diligence.',
			],
		},
		deck: {
			fundingAsk: '₹2.5 Cr for pilot engineering, partner validation, and application narrowing.',
			keyNarrativePoints: [
				'The scientific asset is real, but the company thesis must pick one buyer problem first.',
				'Industrial reliability may be a stronger first market than broad storage storytelling.',
				'Pilot and economics evidence will decide the next capital conversation.',
			],
			slides: [
				{ id: 'slide-5', order: 1, title: 'Market wedge', keyPoint: 'Narrow the buyer and deployment setting.' },
				{ id: 'slide-6', order: 2, title: 'Technical advantage', keyPoint: 'Explain durability and cycle-life improvements clearly.' },
				{ id: 'slide-7', order: 3, title: 'Pilot plan', keyPoint: 'Show how the next experiment becomes a commercial proof point.' },
				{ id: 'slide-8', order: 4, title: 'Capital ask', keyPoint: 'Tie funding to engineering and benchmarking milestones.' },
			],
		},
		review: {
			status: 'Needs narrower application thesis',
			exportReadiness: 'Internal only; not ready for external investor sharing.',
			approvalChecklist: [
				'Select the first market wedge',
				'Benchmark cost and durability against incumbents',
				'Clarify pilot partner targets',
			],
			notes: [
				{
					id: 'review-note-3',
					author: 'Minal Kapoor',
					role: 'Incubator partner',
					stageKey: 'market',
					status: 'Open',
					comment: 'The technology reads well, but the customer problem is still too broad for a strong memo.',
				},
			],
		},
		evidence: [
			{
				id: 'evidence-5',
				stageKey: 'trl-irl',
				claim: 'Technical maturity is promising but not yet matched by a specific commercialization path.',
				sourceType: 'Paper',
				sourceTitle: 'Electrochemical systems manuscript',
				confidence: 'High',
				summary: 'The science is credible; the application framing remains open.',
			},
			{
				id: 'evidence-6',
				stageKey: 'market',
				claim: 'Industrial storage buyers prioritize reliability and deployment fit.',
				sourceType: 'Market report',
				sourceTitle: 'Industrial storage buyer landscape',
				confidence: 'Medium',
				summary: 'This suggests a narrower first market than the current broad energy narrative.',
			},
		],
		copilot: defaultCopilot('Graphene energy storage platform'),
	}),
	createProject({
		id: 'protein-diagnostics-platform',
		title: 'Protein diagnostics platform',
		institution: 'Indian Institute of Technology Bombay',
		lab: 'Translational Biosystems Unit',
		owner: 'Dr. Isha Verma',
		status: 'Ready for export',
		currentStage: 'review',
		updatedAt: '2026-03-25T09:05:00.000Z',
		readinessScore: 88,
		domain: 'Biotech / Diagnostics',
		shortNote: 'Committee-ready package with strong market logic and investor deck draft.',
		paper: {
			abstractSummary:
				'The work enables a protein-based diagnostics workflow with faster interpretation and lower sample complexity than current alternatives.',
			noveltySummary:
				'The core wedge is a workflow advantage that can map cleanly into a diagnostics commercialization story.',
			domainClassification: 'Primary: Biotech / Diagnostics.',
			keyClaims: [
				'Reduces sample handling complexity.',
				'Supports faster interpretation in a clinically relevant context.',
				'May create a strong translational case for targeted diagnostics markets.',
			],
		},
		trlIrl: {
			trlScore: 'TRL 6',
			irlScore: 'IRL 7.1 / 10',
			rationale: [
				'The work has enough shape for an investor-facing narrative tied to diagnostics adoption.',
				'Key risks now sit in execution, partnerships, and validation sequencing rather than in basic product framing.',
			],
			confidence: '88% confidence with review-ready evidence and strong market pull.',
			riskFlags: [
				'Clinical validation scope still needs disciplined milestone sequencing.',
			],
		},
		market: {
			tam: '$3.6B',
			sam: '$920M',
			som: '$140M',
			summary:
				'The market story is strongest in targeted diagnostics segments where workflow speed and lower complexity can directly change adoption.',
			competitors: [
				{
					id: 'competitor-6',
					name: 'RapidProtein Dx',
					positioning: 'Fast protein interpretation for point-of-care workflows.',
					stage: 'Series A',
					signal: 'Scaled pilot partnerships with hospital groups.',
				},
			],
			signals: [
				{
					id: 'signal-6',
					title: 'Hospital buyers are rewarding faster interpretation workflows',
					type: 'Demand',
					impact: 'High',
					summary: 'This directly reinforces the commercial value of the platform story.',
				},
				{
					id: 'signal-7',
					title: 'Recent diagnostics financings favor workflow + economics narratives',
					type: 'Funding',
					impact: 'High',
					summary: 'The investment climate is strongest where the technology advantage maps to workflow outcomes.',
				},
			],
		},
		feasibility: {
			teamRequirements: [
				'Scientific founder continuity',
				'Diagnostics regulatory lead',
				'Commercial lead for hospital and lab partnerships',
			],
			timeline: '9 to 15 months to investor-ready validation package.',
			capitalEstimate: '₹1.5 Cr with room for validation and BD.',
			grantFit: 'Biotech translational and diagnostics acceleration programs.',
			keyRisks: [
				'Validation planning must stay tight to keep the capital story credible.',
			],
		},
		deck: {
			fundingAsk: '₹2.2 Cr for validation, partner pilots, and early commercialization packaging.',
			keyNarrativePoints: [
				'The diagnostics story is strongest when framed through workflow and turnaround improvement.',
				'The product thesis is mature enough for external committee and investor conversations.',
			],
			slides: [
				{ id: 'slide-9', order: 1, title: 'Clinical problem', keyPoint: 'Interpretation speed and complexity are painful today.' },
				{ id: 'slide-10', order: 2, title: 'Platform wedge', keyPoint: 'The paper creates a cleaner diagnostics workflow advantage.' },
				{ id: 'slide-11', order: 3, title: 'Go-to-market', keyPoint: 'Initial segment focus keeps adoption and validation credible.' },
				{ id: 'slide-12', order: 4, title: 'Funding ask', keyPoint: 'Capital maps clearly to the next validation milestone.' },
			],
		},
		review: {
			status: 'Ready for external sharing after final sign-off',
			exportReadiness: 'Commercial memo and investor deck can be exported today.',
			approvalChecklist: [
				'Final PI sign-off',
				'Confirm external language for deck export',
				'Assign outbound investor or partner targets',
			],
			notes: [
				{
					id: 'review-note-4',
					author: 'Nidhi Bhat',
					role: 'Committee reviewer',
					stageKey: 'review',
					status: 'Resolved',
					comment: 'This is ready for the next meeting packet and external conversations after sign-off.',
				},
			],
		},
		evidence: [
			{
				id: 'evidence-7',
				stageKey: 'review',
				claim: 'The package is ready for committee use and external export after final sign-off.',
				sourceType: 'Internal note',
				sourceTitle: 'Committee review memo',
				confidence: 'High',
				summary: 'All major workstreams are sufficiently structured and reviewer feedback has been incorporated.',
			},
		],
		copilot: defaultCopilot('Protein diagnostics platform'),
	}),
]

export const getWorkspaceProjectById = (projectId: string) => {
	return workspaceProjects.find((project) => project.id === projectId) ?? null
}

export const getWorkspaceProjects = () => {
	return workspaceProjects
}

const slugify = (value: string) => {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '')
}

export const createDraftWorkspaceProject = (
	input: WorkspaceProjectDraftInput
): WorkspaceProject => {
	const baseProject = workspaceProjects[0]
	const draftId = `${slugify(input.title || input.fileName || 'new-project')}-${Date.now()
		.toString()
		.slice(-6)}`
	const title =
		input.title.trim() || input.fileName?.replace(/\.[^/.]+$/, '') || 'New research project'
	const domain = input.domain.trim() || 'Unclassified domain'
	const note = input.shortNote.trim() || 'New draft created from upload flow.'

	return createProject({
		...baseProject,
		id: draftId,
		title,
		institution: input.institution.trim() || 'Institution workspace',
		lab: input.lab.trim() || 'Incubation desk',
		owner: 'Current workspace owner',
		status: 'Draft',
		currentStage: 'paper',
		updatedAt: new Date().toISOString(),
		readinessScore: 54,
		domain,
		shortNote: note,
		paper: {
			...baseProject.paper,
			abstractSummary:
				'This draft project has been created from a newly uploaded paper. Use the workspace to inspect the inferred commercialization path and refine the narrative before review.',
			noveltySummary:
				'The novelty summary is seeded from a default template and should be reviewed once the real analysis pipeline is connected.',
			domainClassification: `Primary: ${domain}. Secondary classification pending analyst review.`,
			keyClaims: [
				'Paper uploaded into the commercialization workflow.',
				'Initial project scaffold created for structured review.',
				'Next step is to inspect the paper summary and refine the startup thesis.',
			],
		},
		trlIrl: {
			...baseProject.trlIrl,
			trlScore: 'TRL 3',
			irlScore: 'IRL 4.8 / 10',
			confidence: 'Seeded draft score until full analysis is connected.',
			rationale: [
				'This draft starts with a conservative readiness posture.',
				'The first real decision is whether the paper suggests a clear market or translation wedge.',
			],
			riskFlags: [
				'This is a draft workspace generated from uploaded metadata.',
				'Commercial and market outputs are placeholder recommendations until the pipeline is connected.',
			],
		},
		market: {
			...baseProject.market,
			summary:
				'The market stage is seeded as a placeholder. Use it to review the structure of Lemma’s market output before real ingestion is wired up.',
		},
		feasibility: {
			...baseProject.feasibility,
			timeline: 'Timeline to be refined after paper and market review.',
			capitalEstimate: 'Capital estimate will sharpen after the next pass.',
			grantFit: 'Grant fit pending domain-specific review.',
		},
		deck: {
			...baseProject.deck,
			fundingAsk: 'Draft ask placeholder until the feasibility pass is complete.',
		},
		review: {
			status: 'Draft workspace not yet reviewed',
			exportReadiness: 'Internal scaffold only.',
			approvalChecklist: [
				'Review uploaded paper details',
				'Confirm lab and institution metadata',
				'Refine the first commercialization narrative',
			],
			notes: [
				{
					id: `${draftId}-note-1`,
					author: 'Lemma system',
					role: 'Workspace setup',
					stageKey: 'review',
					status: 'Open',
					comment:
						'This project was created from the mock upload flow. Use it to shape how the full analysis experience should work.',
				},
			],
		},
		evidence: [
			{
				id: `${draftId}-evidence-1`,
				stageKey: 'paper',
				claim: 'A new paper has been uploaded into the workspace.',
				sourceType: 'Internal note',
				sourceTitle: input.fileName || 'New upload',
				confidence: 'Watch',
				summary: 'This evidence row is a placeholder until upload parsing and source extraction are connected.',
			},
		],
		copilot: defaultCopilot(title),
	})
}

export const getStoredDraftWorkspaceProjects = (): WorkspaceProject[] => {
	if (typeof window === 'undefined') {
		return []
	}

	try {
		const storedValue = window.localStorage.getItem(WORKSPACE_DRAFT_STORAGE_KEY)

		if (!storedValue) {
			return []
		}

		const parsedValue = JSON.parse(storedValue) as WorkspaceProject[]

		return Array.isArray(parsedValue) ? parsedValue : []
	} catch {
		return []
	}
}

export const saveDraftWorkspaceProject = (project: WorkspaceProject) => {
	if (typeof window === 'undefined') {
		return
	}

	const existingDrafts = getStoredDraftWorkspaceProjects()
	const nextDrafts = [project, ...existingDrafts.filter((draft) => draft.id !== project.id)]

	window.localStorage.setItem(WORKSPACE_DRAFT_STORAGE_KEY, JSON.stringify(nextDrafts))
}

export const getWorkspaceProjectFromStorage = (projectId: string) => {
	return getStoredDraftWorkspaceProjects().find((project) => project.id === projectId) ?? null
}

export const getAllWorkspaceProjects = (draftProjects: WorkspaceProject[] = []) => {
	const draftIds = new Set(draftProjects.map((project) => project.id))

	return [...draftProjects, ...workspaceProjects.filter((project) => !draftIds.has(project.id))]
}
