import { type FeatureLookupProps } from '@/components/bento-grid/components/bento-grid-feature-lookup-card'
import CrossTerm from '@/assets/cross-team.svg'
import Initiative from '@/assets/initiative.svg'
import Insight from '@/assets/insight.svg'
import Milestone from '@/assets/milestone.svg'
import { TabHeaders } from './components/wide-card/tab-header'

export const longTermFeatureLookup: FeatureLookupProps[] = [
	{
		id: 'long-term-feature-1',
		title: 'TRL Readiness Indicators',
		description: 'Key indicators mapped from your paper.',
		icon: <Initiative />,
	},
	{
		id: 'long-term-feature-2',
		title: 'Research Gap Analysis',
		description: 'Identify gaps between research and market needs.',
		icon: <CrossTerm />,
	},
	{
		id: 'long-term-feature-3',
		title: 'IRL Milestones',
		description: 'Investment readiness milestones and checkpoints.',
		icon: <Milestone />,
	},
	{
		id: 'long-term-feature-4',
		title: 'Scoring Insights',
		description: 'Detailed breakdown of TRL and IRL scores over time.',
		icon: <Insight />,
	},
]

export const tabHeaders: TabHeaders[] = [
	{
		id: 'tab-header-1',
		title: 'Paper analysis reports',
	},
	{
		id: 'tab-header-2',
		title: 'Scoring annotations',
	},
	{
		id: 'tab-header-3',
		title: 'Feedback loop — hallucination check',
	},
]
