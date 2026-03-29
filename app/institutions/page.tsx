import Link from 'next/link'

import { InstitutionsConstellationSvg } from '@/components/page-visuals'
import PremiumPageShell from '@/components/premium-page-shell'
import styles from '@/components/premium-page-shell/styles.module.css'

const institutions = [
	{
		name: 'Indian Institute of Technology Delhi',
		focus: 'Deep tech labs, translational engineering, startup-ready prototypes.',
	},
	{
		name: 'Indian Institute of Science Bengaluru',
		focus: 'Frontier science, interdisciplinary research, and venture-scale IP.',
	},
	{
		name: 'Indian Institute of Technology Bombay',
		focus: 'Materials, medtech, and systems research with commercialization potential.',
	},
	{
		name: 'Indian Institute of Technology Madras',
		focus: 'Incubation-heavy programs with strong founder and TTO alignment.',
	},
	{
		name: 'Indian Institute of Technology Kanpur',
		focus: 'Applied research teams evaluating market fit before spinning out.',
	},
	{
		name: 'Indian Institute of Technology Kharagpur',
		focus: 'Large institutional research depth across hardware, biotech, and energy.',
	},
]

const proofPoints = [
	{
		label: 'Built for',
		title: 'Principal investigators and lab teams',
		body: 'Lemma helps researchers move from paper insight to a coherent commercial story without first becoming full-time startup operators.',
	},
	{
		label: 'Also for',
		title: 'TTOs and incubation cells',
		body: 'Institution teams can standardize how research opportunities are screened, scored, and presented across programs.',
	},
	{
		label: 'Outcome',
		title: 'Research that is easier to evaluate',
		body: 'Every output is structured for review: TRL, market context, feasibility assumptions, and a deck you can take into the room.',
	},
]

const workflow = [
	{
		title: 'Research intake',
		body: 'Upload a paper, deck, or early draft and let Lemma classify the domain and surface the commercial shape of the work.',
	},
	{
		title: 'Commercial review',
		body: 'Market Scout and feasibility agents turn technical context into investor-readable framing without flattening the science.',
	},
	{
		title: 'Institution-ready output',
		body: 'Share a consistent package with the PI, TTO, incubator, or external reviewer in minutes instead of weeks.',
	},
]

export default function InstitutionsPage() {
	return (
		<PremiumPageShell
			badgeText='Institution network'
			heading='Built for the places where deep-tech startups actually begin.'
			description={
				<>
					<p>
						Lemma is shaped around research teams inside institutions, not generic startup templates.
						The experience is tuned for unpublished work, technical ambiguity, and the kinds of review loops that happen between labs, TTOs, and incubators.
					</p>
					<p>
						That is why the product feels opinionated about trust, evidence, and pacing. It is built to meet researchers where they are.
					</p>
				</>
			}
			visual={<InstitutionsConstellationSvg />}>
			<section className={styles.section}>
				<div className={`${styles.grid} ${styles.grid__three}`}>
					{proofPoints.map((point) => (
						<article key={point.title} className={styles.card}>
							<div className={styles.card__label}>{point.label}</div>
							<h2 className={styles.card__title}>{point.title}</h2>
							<p className={styles.card__body}>{point.body}</p>
						</article>
					))}
				</div>
			</section>

			<section className={styles.section}>
				<div className={styles.section__header}>
					<p className={styles.section__eyebrow}>Selected institutions</p>
					<h2 className={styles.section__title}>
						Where we expect the product to feel immediately native.
					</h2>
					<p className={styles.section__body}>
						These are the kinds of environments Lemma is already structured around:
						technical depth, grant pathways, and teams deciding whether a research thread can turn into a venture.
					</p>
				</div>

				<div className={`${styles.grid} ${styles.grid__two}`}>
					{institutions.map((institution) => (
						<article key={institution.name} className={styles.card}>
							<div className={styles.card__label}>Institution</div>
							<h2 className={styles.card__title}>{institution.name}</h2>
							<p className={styles.card__body}>{institution.focus}</p>
						</article>
					))}
				</div>
			</section>

			<section className={styles.section}>
				<div className={styles.panel}>
					<div className={styles.section__header}>
						<p className={styles.section__eyebrow}>How teams use it</p>
						<h2 className={styles.section__title}>
							One workflow for researchers, incubators, and review committees.
						</h2>
					</div>

					<div className={styles.list}>
						{workflow.map((item) => (
							<div key={item.title} className={styles.list__item}>
								<h3 className={styles.list__item__title}>{item.title}</h3>
								<p className={styles.list__item__body}>{item.body}</p>
							</div>
						))}
					</div>

					<div className={styles.metric__row} style={{ marginTop: '18px' }}>
						<span className={styles.metric}>Unpublished research friendly</span>
						<span className={styles.metric}>Institution-safe outputs</span>
						<span className={styles.metric}>Investor-readable framing</span>
					</div>
				</div>
			</section>

			<section className={styles.section}>
				<Link href='/sign-in' className={styles.link__card}>
					<div className={styles.card__label}>Next step</div>
					<h2 className={styles.link__card__title}>
						Analyze a paper and see how Lemma frames it for venture review.
					</h2>
					<p className={styles.link__card__body}>
						Start with the same flow your researchers would use and see the output quality end to end.
					</p>
					<span className={styles.link__card__cta}>Analyze my paper</span>
				</Link>
			</section>
		</PremiumPageShell>
	)
}
