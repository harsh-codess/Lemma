import { type FC } from 'react'
import styles from './styles.module.css'
import CarouselCard from '../carouselCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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

const Carousel: FC = () => {
	return (
		<div>
			<div className={styles.carousel__container}>
				<div className={styles.carousel__inner__container}>
					<CarouselCard title='Feasibility matrix' description='Team size and expertise required' content={<CardContent1 />} />
					<CarouselCard title='Capital estimate' description='Rough funding requirement' content={<CardContent2 />} />
					<CarouselCard title='Pitch deck' description='PDF, PowerPoint, and Word' content={<CardContent3 />} />
					<CarouselCard title='TRL/IRL scorecard' description='Full scoring report' content={<CardContent4 />} />
					<CarouselCard title='Market brief' description='Competitor and signal summary' content={<CardContent5 />} />
					<CarouselCard title='Investor matches' description='Ranked by thesis fit' content={<CardContent6 />} />
				</div>
			</div>

			<div className={styles.card__controls__container}>
				<button className={styles.icon__button}>
					<ChevronLeft size={16} />
				</button>
				<button className={styles.icon__button}>
					<ChevronRight size={16} />
				</button>
			</div>
		</div>
	)
}

export default Carousel
