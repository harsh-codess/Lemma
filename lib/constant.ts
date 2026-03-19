import { type ReactNode } from 'react'
import { type UserCardProps } from '@/app/sections/issue-tracking/components/user-card'
import { CarouselCardProps } from '@/app/sections/modern-product-teams/components/carousel-card'

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
		title: 'Features',
		items: [
			{
				id: 'footer-section-11',
				link: '#',
				item: 'TRL Scoring',
			},
			{
				id: 'footer-section-12',
				link: '#',
				item: 'Market Analysis',
			},
			{
				id: 'footer-section-13',
				link: '#',
				item: 'Feasibility Report',
			},
			{
				id: 'footer-section-14',
				link: '#',
				item: 'Investor Matching',
			},
			{
				id: 'footer-section-15',
				link: '#',
				item: 'Pitch Deck',
			},
		],
	},
	{
		title: 'Company',
		items: [
			{
				id: 'footer-section-21',
				link: '#',
				item: 'About',
			},
			{
				id: 'footer-section-22',
				link: '#',
				item: 'Blog',
			},
			{
				id: 'footer-section-23',
				link: '#',
				item: 'Careers',
			},
			{
				id: 'footer-section-24',
				link: '#',
				item: 'Institutions',
			},
			{
				id: 'footer-section-25',
				link: '#',
				item: 'Brand',
			},
		],
	},
	{
		title: 'Resources',
		items: [
			{
				id: 'footer-section-31',
				link: '#',
				item: 'DST Grant Guide',
			},
			{
				id: 'footer-section-32',
				link: '#',
				item: 'Research Commercialization',
			},
			{
				id: 'footer-section-33',
				link: '#',
				item: 'Contact',
			},
			{
				id: 'footer-section-34',
				link: '#',
				item: 'Privacy Policy',
			},
			{
				id: 'footer-section-35',
				link: '#',
				item: 'Terms of Service',
			},
		],
	},
	{
		title: 'Developers',
		items: [
			{
				id: 'footer-section-41',
				link: '#',
				item: 'API',
			},
			{
				id: 'footer-section-42',
				link: '#',
				item: 'Status',
			},
			{
				id: 'footer-section-43',
				link: '#',
				item: 'GitHub',
			},
			{
				id: 'footer-section-44',
				link: '#',
				item: 'Documentation',
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
		title: 'Users report unexpected rate limiting',
		img: '/user-1.png',
		name: 'Tom',
	},
	{
		id: 'user-card-2',
		title: 'RangeError: Index 0 out of range',
		img: '/user-2.jpg',
		name: 'Romain',
	},
	{
		id: 'user-card-3',
		title:
			'Pressing "Enter" quickly when logging in via email generates multiple emails',
		img: '/user-3.jpg',
		name: 'Tuomas',
	},
]

export const modernProductCards: CarouselCardProps[] = [
	{
		id: 'modern-carousel-card-1',
		img: '/product-development.jpeg',
		title: 'Built around scientific credibility',
	},
	{
		id: 'modern-carousel-card-2',
		img: '/fast-moving.avif',
		title: 'Designed to move at startup speed',
	},
	{
		id: 'modern-carousel-card-3',
		img: '/perfection.avif',
		title: 'Crafted for investor conversations',
	},
]
