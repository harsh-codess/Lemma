import { type UserCardProps } from '@/app/sections/issue-tracking/components/user-card'
import { CarouselCardProps } from '@/app/sections/modern-product-teams/components/carousel-card'

export type SiteNavItem = {
	href: string
	label: string
}

export const siteNavItems: SiteNavItem[] = [
	{
		href: '/',
		label: 'Home',
	},
	{
		href: '/institutions',
		label: 'Institutions',
	},
	{
		href: '/method',
		label: 'Method',
	},
	{
		href: '/legal',
		label: 'Legal Hub',
	},
	{
		href: '/legal/msa',
		label: 'MSA',
	},
	{
		href: '/legal/product-terms',
		label: 'Product Terms',
	},
	{
		href: '/legal/privacy-notice',
		label: 'Privacy Notice',
	},
	{
		href: '/legal/cookie-notice',
		label: 'Cookie Notice',
	},
]

type FooterListItem = {
	id: string | number
	link: string
	item: string
}
export type FooterSection = {
	title: string
	items: FooterListItem[]
}

export const footerSections: FooterSection[] = [
	{
		title: 'Pages',
		items: [
			{
				id: 'footer-section-11',
				link: '/',
				item: 'Home',
			},
			{
				id: 'footer-section-12',
				link: '/institutions',
				item: 'Institutions',
			},
			{
				id: 'footer-section-13',
				link: '/method',
				item: 'Method',
			},
			{
				id: 'footer-section-14',
				link: '/learn-more/domain-classification',
				item: 'Domain Classification',
			},
			{
				id: 'footer-section-16',
				link: '/sign-in',
				item: 'Sign In',
			},
			{
				id: 'footer-section-15',
				link: '/sign-up',
				item: 'Sign Up',
			},
		],
	},
	{
		title: 'Legal',
		items: [
			{
				id: 'footer-section-21',
				link: '/legal',
				item: 'Legal Hub',
			},
			{
				id: 'footer-section-22',
				link: '/legal/msa',
				item: 'MSA',
			},
			{
				id: 'footer-section-23',
				link: '/legal/product-terms',
				item: 'Product Terms',
			},
			{
				id: 'footer-section-24',
				link: '/legal/privacy-notice',
				item: 'Privacy Notice',
			},
			{
				id: 'footer-section-25',
				link: '/legal/cookie-notice',
				item: 'Cookie Notice',
			},
		],
	},
]

export type FoundationListItem = {
	id: string | number
	label: string
	value: string
}

export type FoundationList = FoundationListItem[]

export const foundationList: FoundationList = [
	{
		id: 'foundation-1',
		label: 'End-to-end encryption',
		value:
			'Your unpublished research never leaves our secure pipeline unprotected.',
	},
	{
		id: 'foundation-2',
		label: 'No data retention',
		value:
			'We don\'t train on your papers. Delete anytime.',
	},
	{
		id: 'foundation-3',
		label: 'Institutional grade',
		value:
			'Built to meet the trust requirements of TTOs and incubation cells.',
	},
]

export const userCards: UserCardProps[] = [
	{
		id: 'user-card-1',
		title: 'Biotech TAM growing 18% YoY — 3 new unicorns in Q3',
		img: '/user-1.png',
		name: 'Market Scout',
	},
	{
		id: 'user-card-2',
		title: 'Patent filing surge detected in graphene supercapacitors',
		img: '/user-2.jpg',
		name: 'Patent Agent',
	},
	{
		id: 'user-card-3',
		title: 'DST SBIRI grant window opens — deadline in 14 days',
		img: '/user-3.jpg',
		name: 'Grant Tracker',
	},
]

export const modernProductCards: CarouselCardProps[] = [
	{
		id: 'modern-carousel-card-1',
		img: '/product-development.jpeg',
		title: 'Built around scientific credibility',
		eyebrow: 'Scientific credibility',
		description: 'Ground every commercialization decision in inspectable evidence.',
		detailHeading: 'Keep the venture story tied to the underlying science.',
		detailBody:
			'Lemma keeps the chain from paper to claim to market thesis visible, so researchers and institutions can understand why a startup recommendation exists before it is shared externally.',
		highlights: [
			'Paper claims stay linked to source evidence and readiness scoring.',
			'Novelty, patent overlap, and market assumptions stay reviewable.',
			'Institution-safe outputs support internal diligence before outreach.',
		],
	},
	{
		id: 'modern-carousel-card-2',
		img: '/fast-moving.avif',
		title: 'Designed to move at startup speed',
		eyebrow: 'Execution speed',
		description: 'Move from paper upload to commercialization plan in one flow.',
		detailHeading: 'Compress weeks of startup prep into a single workspace.',
		detailBody:
			'Instead of stitching together market research, grant research, and deck writing manually, Lemma sequences the work so the next decision is ready as soon as the last one is complete.',
		highlights: [
			'Market scans, competitor mapping, and patent signals update automatically.',
			'Feasibility and funding requirements appear in the same project context.',
			'Outputs are structured for quick iteration instead of one-off reports.',
		],
	},
	{
		id: 'modern-carousel-card-3',
		img: '/perfection.avif',
		title: 'Crafted for investor conversations',
		eyebrow: 'Investor readiness',
		description: 'Turn technical depth into a narrative investors can fund.',
		detailHeading: 'Frame the startup clearly without flattening the science.',
		detailBody:
			'Lemma translates research into investor-facing material that preserves the real moat, clarifies the opportunity, and makes the funding ask legible to grants, angels, and venture funds.',
		highlights: [
			'Commercial milestones and the capital path are structured clearly.',
			'Deck outputs stay aligned with the underlying paper and market brief.',
			'The final narrative is built for real fundraising conversations, not demos.',
		],
	},
]
