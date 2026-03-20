import { type FC } from 'react'
import LayoutWrapper from '@/components/layout-wrapper'
import SectionHeading from '@/components/sectionHeading'
import styles from './styles.module.css'

const domains = [
	'Biotechnology & Life Sciences',
	'Medical Devices & Diagnostics',
	'Pharmaceuticals & Drug Discovery',
	'Materials Science & Nanotechnology',
	'Clean Energy & Sustainability',
	'Agricultural Technology',
	'Hardware & Electronics',
	'Semiconductors & Photonics',
	'Software & AI/ML',
	'Robotics & Automation',
	'Aerospace & Defence',
	'Chemical Engineering',
	'Quantum Computing',
	'Neuroscience & Brain-Computer Interfaces',
]

const PipelineSvg: FC = () => (
	<svg viewBox='0 0 1120 300' width='100%' height='100%' role='img' aria-label='Domain classification pipeline'>
		<defs>
			<linearGradient id='strokeA' x1='0' y1='0' x2='1' y2='0'>
				<stop offset='0%' stopColor='rgba(255,255,255,0.25)' />
				<stop offset='100%' stopColor='rgba(255,255,255,0.08)' />
			</linearGradient>
		</defs>
		<rect x='0' y='0' width='1120' height='300' fill='transparent' />
		<rect x='20' y='70' width='220' height='160' rx='14' fill='rgba(255,255,255,0.03)' stroke='url(#strokeA)' />
		<text x='40' y='118' fill='rgba(255,255,255,0.9)' fontSize='20' fontWeight='600'>Paper Upload</text>
		<text x='40' y='150' fill='rgba(255,255,255,0.65)' fontSize='14'>
			<tspan x='40' dy='0'>Abstract · Method ·</tspan>
			<tspan x='40' dy='18'>Conclusion</tspan>
		</text>
		<path d='M240 150 L320 150' stroke='rgba(255,255,255,0.35)' strokeWidth='2' />
		<rect x='320' y='70' width='220' height='160' rx='14' fill='rgba(255,255,255,0.03)' stroke='url(#strokeA)' />
		<text x='340' y='118' fill='rgba(255,255,255,0.9)' fontSize='20' fontWeight='600'>Claude Pass</text>
		<text x='340' y='150' fill='rgba(255,255,255,0.65)' fontSize='14'>
			<tspan x='340' dy='0'>Zero-shot domain</tspan>
			<tspan x='340' dy='18'>classification</tspan>
		</text>
		<path d='M540 150 L620 150' stroke='rgba(255,255,255,0.35)' strokeWidth='2' />
		<rect x='620' y='70' width='220' height='160' rx='14' fill='rgba(255,255,255,0.03)' stroke='url(#strokeA)' />
		<text x='640' y='118' fill='rgba(255,255,255,0.9)' fontSize='20' fontWeight='600'>Taxonomy Match</text>
		<text x='640' y='150' fill='rgba(255,255,255,0.65)' fontSize='14'>
			<tspan x='640' dy='0'>40+ domains</tspan>
			<tspan x='640' dy='18'>primary + secondary</tspan>
		</text>
		<path d='M840 150 L920 150' stroke='rgba(255,255,255,0.35)' strokeWidth='2' />
		<rect x='920' y='70' width='180' height='160' rx='14' fill='rgba(255,255,255,0.03)' stroke='url(#strokeA)' />
		<text x='940' y='118' fill='rgba(255,255,255,0.9)' fontSize='20' fontWeight='600'>Pipeline</text>
		<text x='940' y='150' fill='rgba(255,255,255,0.65)' fontSize='14'>
			<tspan x='940' dy='0'>Market · TRL</tspan>
			<tspan x='940' dy='18'>Investor fit</tspan>
		</text>
	</svg>
)

const PipelineSvgMobile: FC = () => (
	<svg viewBox='0 0 360 620' width='100%' height='100%' role='img' aria-label='Domain classification pipeline mobile'>
		<defs>
			<linearGradient id='pipelineMobileStroke' x1='0' y1='0' x2='1' y2='1'>
				<stop offset='0%' stopColor='rgba(255,255,255,0.28)' />
				<stop offset='100%' stopColor='rgba(255,255,255,0.08)' />
			</linearGradient>
		</defs>
		<rect x='16' y='16' width='328' height='120' rx='14' fill='rgba(255,255,255,0.03)' stroke='url(#pipelineMobileStroke)' />
		<text x='34' y='48' fill='rgba(255,255,255,0.9)' fontSize='15' fontWeight='600'>Paper Upload</text>
		<text x='34' y='72' fill='rgba(255,255,255,0.65)' fontSize='11.5'>Abstract · Method · Conclusion</text>

		<path d='M180 136 L180 164' stroke='rgba(255,255,255,0.35)' strokeWidth='2' />
		<path d='M174 156 L180 164 L186 156' fill='none' stroke='rgba(255,255,255,0.35)' strokeWidth='2' />

		<rect x='16' y='174' width='328' height='120' rx='14' fill='rgba(255,255,255,0.03)' stroke='url(#pipelineMobileStroke)' />
		<text x='34' y='206' fill='rgba(255,255,255,0.9)' fontSize='15' fontWeight='600'>Claude Pass</text>
		<text x='34' y='230' fill='rgba(255,255,255,0.65)' fontSize='11.5'>Zero-shot domain classification</text>

		<path d='M180 294 L180 322' stroke='rgba(255,255,255,0.35)' strokeWidth='2' />
		<path d='M174 314 L180 322 L186 314' fill='none' stroke='rgba(255,255,255,0.35)' strokeWidth='2' />

		<rect x='16' y='332' width='328' height='120' rx='14' fill='rgba(255,255,255,0.03)' stroke='url(#pipelineMobileStroke)' />
		<text x='34' y='364' fill='rgba(255,255,255,0.9)' fontSize='15' fontWeight='600'>Taxonomy Match</text>
		<text x='34' y='388' fill='rgba(255,255,255,0.65)' fontSize='11.5'>40+ domains · primary + secondary</text>

		<path d='M180 452 L180 480' stroke='rgba(255,255,255,0.35)' strokeWidth='2' />
		<path d='M174 472 L180 480 L186 472' fill='none' stroke='rgba(255,255,255,0.35)' strokeWidth='2' />

		<rect x='16' y='490' width='328' height='114' rx='14' fill='rgba(255,255,255,0.03)' stroke='url(#pipelineMobileStroke)' />
		<text x='34' y='520' fill='rgba(255,255,255,0.9)' fontSize='15' fontWeight='600'>Pipeline Outputs</text>
		<text x='34' y='543' fill='rgba(255,255,255,0.65)' fontSize='11.5'>Market analysis · TRL scoring</text>
		<text x='34' y='560' fill='rgba(255,255,255,0.65)' fontSize='11.5'>Investor matching · pitch framing</text>
	</svg>
)

const ProductViewSvg: FC = () => (
	<svg viewBox='0 0 1120 420' width='100%' height='100%' role='img' aria-label='What you see in product'>
		<defs>
			<linearGradient id='panelStroke' x1='0' y1='0' x2='1' y2='1'>
				<stop offset='0%' stopColor='rgba(255,255,255,0.28)' />
				<stop offset='100%' stopColor='rgba(255,255,255,0.08)' />
			</linearGradient>
			<linearGradient id='chip' x1='0' y1='0' x2='1' y2='0'>
				<stop offset='0%' stopColor='rgba(94,106,210,0.55)' />
				<stop offset='100%' stopColor='rgba(78,167,252,0.45)' />
			</linearGradient>
		</defs>

		<rect x='0' y='0' width='1120' height='420' fill='transparent' />

		<rect x='24' y='28' width='700' height='360' rx='16' fill='rgba(255,255,255,0.03)' stroke='url(#panelStroke)' />
		<text x='54' y='70' fill='rgba(255,255,255,0.88)' fontSize='22' fontWeight='600'>TRL Scorecard</text>

		<rect x='54' y='92' width='248' height='34' rx='17' fill='url(#chip)' stroke='rgba(255,255,255,0.25)' />
		<text x='76' y='114' fill='white' fontSize='14' fontWeight='600'>Primary: Pharmaceuticals</text>

		<rect x='314' y='92' width='180' height='34' rx='17' fill='rgba(255,255,255,0.06)' stroke='rgba(255,255,255,0.18)' />
		<text x='336' y='114' fill='rgba(255,255,255,0.9)' fontSize='14'>Secondary: AI/ML</text>

		<rect x='54' y='148' width='640' height='12' rx='6' fill='rgba(255,255,255,0.08)' />
		<rect x='54' y='148' width='448' height='12' rx='6' fill='rgba(94,106,210,0.75)' />
		<text x='54' y='182' fill='rgba(255,255,255,0.68)' fontSize='13'>Technology Readiness Level: 7 / 10</text>

		<rect x='54' y='204' width='640' height='64' rx='10' fill='rgba(255,255,255,0.02)' stroke='rgba(255,255,255,0.08)' />
		<text x='74' y='232' fill='rgba(255,255,255,0.86)' fontSize='15' fontWeight='600'>Suggested fit</text>
		<text x='74' y='254' fill='rgba(255,255,255,0.63)' fontSize='13'>Life sciences market comps • BIRAC/DBT grant signals • Medtech investor theses</text>

		<rect x='54' y='286' width='174' height='34' rx='8' fill='rgba(255,255,255,0.09)' stroke='rgba(255,255,255,0.18)' />
		<text x='77' y='308' fill='white' fontSize='14' fontWeight='600'>Override domain</text>

		<rect x='740' y='70' width='356' height='126' rx='14' fill='rgba(255,255,255,0.03)' stroke='url(#panelStroke)' />
		<text x='764' y='108' fill='rgba(255,255,255,0.9)' fontSize='19' fontWeight='600'>One-click correction</text>
		<text x='764' y='136' fill='rgba(255,255,255,0.65)' fontSize='14'>Wrong tag? Pick the right domain</text>
		<text x='764' y='156' fill='rgba(255,255,255,0.65)' fontSize='14'>before the pipeline proceeds.</text>

		<rect x='740' y='220' width='356' height='146' rx='14' fill='rgba(255,255,255,0.03)' stroke='url(#panelStroke)' />
		<text x='764' y='258' fill='rgba(255,255,255,0.9)' fontSize='19' fontWeight='600'>Feedback loop</text>
		<text x='764' y='286' fill='rgba(255,255,255,0.65)' fontSize='14'>Your correction is logged as signal</text>
		<text x='764' y='306' fill='rgba(255,255,255,0.65)' fontSize='14'>to improve future classifications.</text>

		<path d='M700 304 C760 304, 740 304, 740 304' stroke='rgba(255,255,255,0.35)' strokeWidth='2' />
		<path d='M732 298 L740 304 L732 310' fill='none' stroke='rgba(255,255,255,0.35)' strokeWidth='2' />
		<path d='M920 194 C920 208, 920 220, 920 220' stroke='rgba(255,255,255,0.35)' strokeWidth='2' />
		<path d='M914 212 L920 220 L926 212' fill='none' stroke='rgba(255,255,255,0.35)' strokeWidth='2' />
	</svg>
)

const ProductViewSvgMobile: FC = () => (
	<svg viewBox='0 0 360 620' width='100%' height='100%' role='img' aria-label='What you see in product mobile'>
		<defs>
			<linearGradient id='mobilePanelStroke' x1='0' y1='0' x2='1' y2='1'>
				<stop offset='0%' stopColor='rgba(255,255,255,0.28)' />
				<stop offset='100%' stopColor='rgba(255,255,255,0.08)' />
			</linearGradient>
			<linearGradient id='mobileChip' x1='0' y1='0' x2='1' y2='0'>
				<stop offset='0%' stopColor='rgba(94,106,210,0.55)' />
				<stop offset='100%' stopColor='rgba(78,167,252,0.45)' />
			</linearGradient>
		</defs>

		<rect x='16' y='16' width='328' height='270' rx='14' fill='rgba(255,255,255,0.03)' stroke='url(#mobilePanelStroke)' />
		<text x='34' y='44' fill='rgba(255,255,255,0.9)' fontSize='16' fontWeight='600'>TRL Scorecard</text>
		<rect x='34' y='58' width='186' height='28' rx='14' fill='url(#mobileChip)' stroke='rgba(255,255,255,0.22)' />
		<text x='48' y='76' fill='white' fontSize='11.5' fontWeight='600'>Primary: Pharmaceuticals</text>
		<rect x='34' y='96' width='136' height='26' rx='13' fill='rgba(255,255,255,0.06)' stroke='rgba(255,255,255,0.16)' />
		<text x='46' y='113' fill='rgba(255,255,255,0.86)' fontSize='11'>Secondary: AI/ML</text>
		<rect x='34' y='136' width='292' height='10' rx='5' fill='rgba(255,255,255,0.08)' />
		<rect x='34' y='136' width='198' height='10' rx='5' fill='rgba(94,106,210,0.75)' />
		<text x='34' y='164' fill='rgba(255,255,255,0.64)' fontSize='11.5'>Technology Readiness Level: 7 / 10</text>
		<rect x='34' y='176' width='292' height='58' rx='9' fill='rgba(255,255,255,0.02)' stroke='rgba(255,255,255,0.08)' />
		<text x='46' y='198' fill='rgba(255,255,255,0.86)' fontSize='11.5' fontWeight='600'>Suggested fit</text>
		<text x='46' y='216' fill='rgba(255,255,255,0.62)' fontSize='10.5'>Life sciences comps • grant signals</text>
		<text x='46' y='231' fill='rgba(255,255,255,0.62)' fontSize='10.5'>investor theses</text>
		<rect x='34' y='246' width='132' height='28' rx='7' fill='rgba(255,255,255,0.09)' stroke='rgba(255,255,255,0.18)' />
		<text x='48' y='264' fill='white' fontSize='11.5' fontWeight='600'>Override domain</text>

		<path d='M180 286 L180 314' stroke='rgba(255,255,255,0.35)' strokeWidth='2' />
		<path d='M174 306 L180 314 L186 306' fill='none' stroke='rgba(255,255,255,0.35)' strokeWidth='2' />

		<rect x='16' y='324' width='328' height='116' rx='14' fill='rgba(255,255,255,0.03)' stroke='url(#mobilePanelStroke)' />
		<text x='34' y='352' fill='rgba(255,255,255,0.9)' fontSize='15' fontWeight='600'>One-click correction</text>
		<text x='34' y='374' fill='rgba(255,255,255,0.65)' fontSize='11.5'>Wrong tag? Pick the right domain</text>
		<text x='34' y='391' fill='rgba(255,255,255,0.65)' fontSize='11.5'>before the pipeline proceeds.</text>

		<path d='M180 440 L180 468' stroke='rgba(255,255,255,0.35)' strokeWidth='2' />
		<path d='M174 460 L180 468 L186 460' fill='none' stroke='rgba(255,255,255,0.35)' strokeWidth='2' />

		<rect x='16' y='478' width='328' height='126' rx='14' fill='rgba(255,255,255,0.03)' stroke='url(#mobilePanelStroke)' />
		<text x='34' y='506' fill='rgba(255,255,255,0.9)' fontSize='15' fontWeight='600'>Feedback loop</text>
		<text x='34' y='528' fill='rgba(255,255,255,0.65)' fontSize='11.5'>Your correction is logged as signal</text>
		<text x='34' y='545' fill='rgba(255,255,255,0.65)' fontSize='11.5'>to improve future classifications.</text>
	</svg>
)

const DomainClassificationPage: FC = () => {
	return (
		<main className={styles.page}>
			<LayoutWrapper>
				<section className={styles.hero}>
					<SectionHeading
						badgeText='Domain classification engine'
						heading="Lemma knows what kind of science you've done - before you have to explain it."
					/>
					<p className={styles.subheading}>
						When you upload a paper, Lemma&apos;s Paper Reader agent doesn&apos;t just read your content - it first identifies exactly what scientific domain your research belongs to.
						This classification isn&apos;t cosmetic. Every downstream step - market analysis, feasibility scoring, investor matching, and pitch framing - changes based on what domain your paper falls into.
					</p>
				</section>

				<section className={styles.card}>
					<h2 className={styles.cardTitle}>Domains Lemma classifies</h2>
					<div className={styles.domainGrid}>
						{domains.map((domain) => (
							<div key={domain} className={styles.domainTag}>
								{domain}
							</div>
						))}
					</div>
				</section>

				<section className={styles.card}>
					<h2 className={styles.cardTitle}>Why it matters - three concrete examples</h2>
					<div className={styles.examples}>
						<article className={styles.exampleCard}>
							<h3 className={styles.exampleTitle}>Biotech paper</h3>
							<p className={styles.exampleBody}>
								Routes to life sciences market data, BIRAC and DBT grant signals, pharma and medtech investor theses, and a pitch structure that leads with clinical validation and regulatory pathway.
							</p>
						</article>
						<article className={styles.exampleCard}>
							<h3 className={styles.exampleTitle}>Hardware paper</h3>
							<p className={styles.exampleBody}>
								Routes to manufacturing feasibility, deep tech VC theses, IP and patent landscape analysis, and a pitch structure that leads with unit economics and supply chain.
							</p>
						</article>
						<article className={styles.exampleCard}>
							<h3 className={styles.exampleTitle}>Software or AI paper</h3>
							<p className={styles.exampleBody}>
								Routes to SaaS market comparables, product-led growth framing, and a pitch structure that leads with traction potential and scalability.
							</p>
						</article>
					</div>
					<p className={styles.body} style={{ marginTop: '1rem' }}>
						Same pipeline, completely different output - because the domain drives everything.
					</p>
				</section>

				<section className={styles.section}>
					<h2 className={styles.sectionTitle}>How it works technically</h2>
					<p className={styles.subheading}>
						Lemma uses a two-step classification. First, the Claude API performs a zero-shot domain classification pass on your abstract, methodology, and conclusion sections.
						Second, it cross-references against a taxonomy of 40+ research domains and assigns both a primary domain and up to two secondary domains.
					</p>
					<p className={styles.subheading} style={{ marginTop: '0.75rem' }}>
						For example, a paper on AI-assisted drug discovery gets classified as Pharmaceuticals (primary) plus AI/ML (secondary). This dual classification ensures your market analysis
						and investor matching do not miss adjacent opportunities.
					</p>
					<div className={styles.svgWrap}>
						<div className={styles.desktopOnly}>
							<PipelineSvg />
						</div>
						<div className={styles.mobileOnly}>
							<PipelineSvgMobile />
						</div>
					</div>
				</section>

				<section className={styles.section}>
					<h2 className={styles.sectionTitle}>What you see in product</h2>
					<p className={styles.subheading}>
						A domain tag appears at the top of your TRL scorecard - visible, editable, and overridable.
					</p>
					<p className={styles.subheading} style={{ marginTop: '0.5rem' }}>
						If Lemma gets it wrong, you can correct it in one click before the rest of the pipeline runs.
					</p>
					<p className={styles.subheading} style={{ marginTop: '0.5rem' }}>
						Your correction feeds back into improving future classifications.
					</p>
					<div className={styles.svgWrap}>
						<div className={styles.desktopOnly}>
							<ProductViewSvg />
						</div>
						<div className={styles.mobileOnly}>
							<ProductViewSvgMobile />
						</div>
					</div>
				</section>
			</LayoutWrapper>
		</main>
	)
}

export default DomainClassificationPage
