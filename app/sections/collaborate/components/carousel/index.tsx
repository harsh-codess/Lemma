'use client'

import { type FC, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import styles from './styles.module.css'
import CarouselCard from '../carouselCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

// Shared base styles for the mini text-UI blocks inside each card
const row = {
	display: 'flex', alignItems: 'center', gap: '8px',
	padding: '7px 10px', borderRadius: '8px',
	background: 'rgba(255,255,255,0.05)', marginBottom: '6px',
	fontSize: '12px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.4,
}
const label = (color: string) => ({
	display: 'inline-block', width: 8, height: 8,
	borderRadius: '50%', background: color, flexShrink: 0,
})
const tag = (bg: string, text: string) => (
	<span style={{ background: bg, color: '#fff', fontSize: '10px', padding: '2px 7px', borderRadius: '99px', fontWeight: 600 }}>{text}</span>
)

const CardContent1 = () => (
	<div style={{ width: '100%' }}>
		<div style={{ ...row, background: 'rgba(255,255,255,0.08)', marginBottom: '10px' }}>
			<span style={label('#6ee7b7')} /> <span style={{ fontWeight: 600 }}>Feasibility Report</span>
		</div>
		{[['Team size', '4–6 people'], ['Domain expertise', 'Biotech / ML'], ['Timeline', '18 months'], ['Capital need', '₹1.2 Cr seed']].map(([k, v]) => (
			<div key={k} style={{ ...row }}>
				<span style={{ color: 'rgba(255,255,255,0.45)', minWidth: 110 }}>{k}</span>
				<span style={{ fontWeight: 500 }}>{v}</span>
			</div>
		))}
	</div>
)

const CardContent2 = () => (
	<div style={{ width: '100%' }}>
		<div style={{ ...row, background: 'rgba(255,255,255,0.08)', marginBottom: '10px' }}>
			<span style={label('#fbbf24')} /> <span style={{ fontWeight: 600 }}>Funding Estimate</span>
		</div>
		{[['Pre-seed', '₹40L', '#6ee7b7'], ['Seed', '₹1.2 Cr', '#fbbf24'], ['Series A target', '₹8 Cr', '#818cf8']].map(([stage, amt, c]) => (
			<div key={stage} style={{ ...row, justifyContent: 'space-between' }}>
				<span style={{ color: 'rgba(255,255,255,0.5)' }}>{stage}</span>
				<span style={{ fontWeight: 700, color: c as string }}>{amt}</span>
			</div>
		))}
		<div style={{ ...row, background: 'rgba(99,102,241,0.15)', marginTop: 4 }}>
			<span style={{ color: 'rgba(255,255,255,0.45)' }}>Suggested grant</span>
			<span style={{ fontWeight: 600, marginLeft: 'auto' }}>DST SBIRI</span>
		</div>
	</div>
)

const CardContent3 = () => (
	<div style={{ width: '100%' }}>
		<div style={{ ...row, background: 'rgba(255,255,255,0.08)', marginBottom: '10px' }}>
			<span style={label('#818cf8')} /> <span style={{ fontWeight: 600 }}>Pitch Deck · 12 slides</span>
		</div>
		{['Problem & Opportunity', 'Technology (TRL 5)', 'Market Size — $4.2B', 'Business Model', 'Team & Advisors', 'The Ask — ₹2 Cr'].map((slide, i) => (
			<div key={slide} style={{ ...row }}>
				<span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, minWidth: 18 }}>{i + 1}.</span>
				<span>{slide}</span>
			</div>
		))}
	</div>
)

const CardContent4 = () => (
	<div style={{ width: '100%' }}>
		<div style={{ ...row, background: 'rgba(255,255,255,0.08)', marginBottom: '10px' }}>
			<span style={label('#34d399')} /> <span style={{ fontWeight: 600 }}>Readiness Scores</span>
		</div>
		{[['TRL Score', '5 / 9', '#6ee7b7'], ['IRL Score', '6.2 / 10', '#fbbf24'], ['Commercial fit', '7.8 / 10', '#818cf8'], ['Patent risk', 'Low', '#34d399']].map(([k, v, c]) => (
			<div key={k} style={{ ...row, justifyContent: 'space-between' }}>
				<span style={{ color: 'rgba(255,255,255,0.5)' }}>{k}</span>
				<span style={{ fontWeight: 700, color: c as string }}>{v}</span>
			</div>
		))}
	</div>
)

const CardContent5 = () => (
	<div style={{ width: '100%' }}>
		<div style={{ ...row, background: 'rgba(255,255,255,0.08)', marginBottom: '10px' }}>
			<span style={label('#f472b6')} /> <span style={{ fontWeight: 600 }}>Market Brief</span>
		</div>
		{[
			['TAM', '$4.2B', '#6ee7b7'],
			['CAGR', '18% YoY', '#fbbf24'],
			['Patents filed', '147 (2024)', '#818cf8'],
			['Funding raised', '$890M', '#f472b6'],
		].map(([k, v, c]) => (
			<div key={k} style={{ ...row, justifyContent: 'space-between' }}>
				<span style={{ color: 'rgba(255,255,255,0.5)' }}>{k}</span>
				<span style={{ fontWeight: 700, color: c as string }}>{v}</span>
			</div>
		))}
	</div>
)

const CardContent6 = () => (
	<div style={{ width: '100%' }}>
		<div style={{ ...row, background: 'rgba(255,255,255,0.08)', marginBottom: '10px' }}>
			<span style={label('#60a5fa')} /> <span style={{ fontWeight: 600 }}>Investor Matches</span>
		</div>
		{[
			['Kalaari Capital', 'Deep Tech', '#6ee7b7'],
			['Blume Ventures', 'Biotech', '#fbbf24'],
			['DST SBIRI Grant', 'Gov. Fund', '#818cf8'],
			['IAN Fund', 'IP-led', '#f472b6'],
		].map(([name, thesis, c]) => (
			<div key={name} style={{ ...row, justifyContent: 'space-between' }}>
				<span>{name}</span>
				{tag(c as string, thesis as string)}
			</div>
		))}
	</div>
)

type CardItem = {
	title: string
	description: string
	content: ReactNode
	eyebrow: string
	detailHeading: string
	detailBody: string
}

const Carousel: FC = () => {
	const scrollRef = useRef<HTMLDivElement>(null)
	const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null)
	const [canScrollPrev, setCanScrollPrev] = useState(false)
	const [canScrollNext, setCanScrollNext] = useState(true)

	const cards: CardItem[] = [
		{
			title: 'Feasibility matrix',
			description: 'Team size and expertise required',
			content: <CardContent1 />,
			eyebrow: 'Execution planning',
			detailHeading: 'See the operating requirements before you build.',
			detailBody:
				'Lemma translates the paper and market readout into a practical execution plan, so founders can understand what team mix, timeline, and operating scope the startup actually needs.',
		},
		{
			title: 'Capital estimate',
			description: 'Rough funding requirement',
			content: <CardContent2 />,
			eyebrow: 'Funding readiness',
			detailHeading: 'Estimate the capital path from grant to venture.',
			detailBody:
				'This view turns technical ambition into a financing path, from pre-seed assumptions and grant opportunities through the larger raise needed to reach commercialization milestones.',
		},
		{
			title: 'Pitch deck',
			description: 'PDF, PowerPoint, and Word',
			content: <CardContent3 />,
			eyebrow: 'Investor materials',
			detailHeading: 'Generate a deck that matches the research story.',
			detailBody:
				'Lemma packages the research, market signals, and funding ask into a clean investor narrative with the core slides already structured for conversations with grants, angels, and venture funds.',
		},
		{
			title: 'TRL/IRL scorecard',
			description: 'Full scoring report',
			content: <CardContent4 />,
			eyebrow: 'Readiness scoring',
			detailHeading: 'Review the full commercialization scorecard.',
			detailBody:
				'Each readiness output stays grounded in evidence, giving researchers a way to inspect the logic behind the score instead of trusting a black-box recommendation.',
		},
		{
			title: 'Market brief',
			description: 'Competitor and signal summary',
			content: <CardContent5 />,
			eyebrow: 'Market intelligence',
			detailHeading: 'Condense noisy market data into a clean brief.',
			detailBody:
				'The market brief summarizes competitor density, growth signals, patent activity, and funding momentum into a format that can directly support the startup thesis.',
		},
		{
			title: 'Investor matches',
			description: 'Ranked by thesis fit',
			content: <CardContent6 />,
			eyebrow: 'Fundraising fit',
			detailHeading: 'Match the startup thesis to the right capital sources.',
			detailBody:
				'Instead of a generic investor list, Lemma can frame likely matches by thesis, sector comfort, and funding style so outreach starts from relevance.',
		},
	]

	const updateScrollState = useCallback(() => {
		const node = scrollRef.current

		if (!node) {
			return
		}

		setCanScrollPrev(node.scrollLeft > 8)
		setCanScrollNext(node.scrollLeft + node.clientWidth < node.scrollWidth - 8)
	}, [])

	useEffect(() => {
		const node = scrollRef.current

		if (!node) {
			return
		}

		updateScrollState()

		node.addEventListener('scroll', updateScrollState, { passive: true })
		window.addEventListener('resize', updateScrollState)

		return () => {
			node.removeEventListener('scroll', updateScrollState)
			window.removeEventListener('resize', updateScrollState)
		}
	}, [updateScrollState])

	const scrollByCard = useCallback((direction: -1 | 1) => {
		const node = scrollRef.current

		if (!node) {
			return
		}

		const firstCard = node.querySelector<HTMLElement>('[data-carousel-card]')
		const cardWidth = firstCard?.getBoundingClientRect().width ?? 336
		const gap = 8

		node.scrollBy({
			left: direction * (cardWidth + gap),
			behavior: 'smooth',
		})
	}, [])

	const activeCard = activeCardIndex === null ? null : cards[activeCardIndex]

	return (
		<>
			<div>
				<div className={styles.carousel__container} ref={scrollRef}>
					<div className={styles.carousel__inner__container}>
						{cards.map((card, index) => (
							<CarouselCard
								key={card.title}
								title={card.title}
								description={card.description}
								content={card.content}
								onOpen={() => setActiveCardIndex(index)}
							/>
						))}
					</div>
				</div>

				<div className={styles.card__controls__container}>
					<button
						type='button'
						className={styles.icon__button}
						onClick={() => scrollByCard(-1)}
						disabled={!canScrollPrev}
						aria-label='Scroll carousel left'>
						<ChevronLeft size={16} />
					</button>
					<button
						type='button'
						className={styles.icon__button}
						onClick={() => scrollByCard(1)}
						disabled={!canScrollNext}
						aria-label='Scroll carousel right'>
						<ChevronRight size={16} />
					</button>
				</div>
			</div>

			<Dialog
				open={activeCardIndex !== null}
				onOpenChange={(open) => {
					if (!open) {
						setActiveCardIndex(null)
					}
				}}>
				<DialogContent className='max-w-4xl overflow-hidden border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)] p-0 text-[var(--color-text-primary)] shadow-[var(--shadow-high)] sm:rounded-[28px]'>
					{activeCard && (
						<div className='grid gap-0 md:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]'>
							<div className='border-b border-[var(--color-border-primary)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 md:border-b-0 md:border-r md:p-8'>
								<div className='rounded-[24px] border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-6'>
									{activeCard.content}
								</div>
							</div>

							<div className='flex flex-col justify-between gap-8 p-6 md:p-8'>
								<DialogHeader className='space-y-4 text-left'>
									<span className='text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-quaternary)]'>
										{activeCard.eyebrow}
									</span>
									<DialogTitle className='text-[28px] font-medium leading-[1.05] tracking-[-0.025em] text-[var(--color-text-primary)]'>
										{activeCard.title}
									</DialogTitle>
									<DialogDescription className='text-[16px] font-medium leading-[1.6] text-[var(--color-text-tertiary)]'>
										{activeCard.description}
									</DialogDescription>
								</DialogHeader>

								<div className='space-y-4'>
									<p className='text-[20px] font-medium leading-[1.25] tracking-[-0.02em] text-[var(--color-text-primary)]'>
										{activeCard.detailHeading}
									</p>
									<p className='text-[15px] leading-[1.7] text-[var(--color-text-secondary)]'>
										{activeCard.detailBody}
									</p>
								</div>

								<div className='flex flex-col gap-3 sm:flex-row'>
									<Link
										href='/sign-in'
										className='inline-flex h-11 items-center justify-center rounded-[12px] bg-[#e6e6e6] px-4 text-[15px] font-medium text-[var(--color-bg-primary)] shadow-[var(--shadow-stack-low)] transition-colors hover:bg-white'>
										Analyze my paper
									</Link>
									<Link
										href='/method'
										className='inline-flex h-11 items-center justify-center rounded-[12px] bg-[var(--color-bg-quaternary)] px-4 text-[15px] font-medium text-[var(--color-text-primary)] transition-colors hover:brightness-110'>
										View method
									</Link>
								</div>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	)
}

export default Carousel
