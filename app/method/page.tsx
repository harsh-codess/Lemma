import Link from 'next/link'

import { MethodArchitectureSvg } from '@/components/page-visuals'
import PremiumPageShell from '@/components/premium-page-shell'
import styles from '@/components/premium-page-shell/styles.module.css'

const stages = [
	{
		label: 'Stage one',
		title: 'Read the science with context',
		body: 'Lemma starts by understanding the paper itself: what domain it belongs to, how mature the work is, and where the technical edge actually sits.',
	},
	{
		label: 'Stage two',
		title: 'Translate into market reality',
		body: 'The product then gathers live signals around competitors, funding, patents, and market structure so the idea is framed in the world it must enter.',
	},
	{
		label: 'Stage three',
		title: 'Package for venture conversation',
		body: 'Finally, Lemma builds a feasibility view and a pitch narrative that is usable by researchers, incubators, and investors without losing the original technical nuance.',
	},
]

const principles = [
	{
		title: 'Evidence over decoration',
		body: 'Every major output should point back to an assumption, signal, or document trail that a researcher can inspect.',
	},
	{
		title: 'Editable judgments',
		body: 'Classification and framing are not locked. Researchers can override the system when domain edge cases or interdisciplinary work require human correction.',
	},
	{
		title: 'Outputs for real review loops',
		body: 'The format is intentionally institution-friendly: enough structure for TTOs and incubators, enough clarity for investor conversations.',
	},
]

export default function MethodPage() {
	return (
		<PremiumPageShell
			badgeText='Product method'
			heading='A research-to-startup workflow built in the same order your decisions actually happen.'
			description={
				<>
					<p>
						Lemma is not a single model with a generic prompt. It is a staged system that first understands the paper, then evaluates the market around it, and only then generates venture-facing material.
					</p>
					<p>
						That sequence matters. It keeps the output grounded in the science before the product starts making claims about commercialization.
					</p>
				</>
			}
			visual={<MethodArchitectureSvg />}>
			<section className={styles.section}>
				<div className={`${styles.grid} ${styles.grid__three}`}>
					{stages.map((stage) => (
						<article key={stage.title} className={styles.card}>
							<div className={styles.card__label}>{stage.label}</div>
							<h2 className={styles.card__title}>{stage.title}</h2>
							<p className={styles.card__body}>{stage.body}</p>
						</article>
					))}
				</div>
			</section>

			<section className={styles.section}>
				<div className={styles.panel}>
					<div className={styles.section__header}>
						<p className={styles.section__eyebrow}>Core principles</p>
						<h2 className={styles.section__title}>
							Why the outputs feel more like product thinking than content generation.
						</h2>
					</div>

					<div className={styles.list}>
						{principles.map((principle) => (
							<div key={principle.title} className={styles.list__item}>
								<h3 className={styles.list__item__title}>{principle.title}</h3>
								<p className={styles.list__item__body}>{principle.body}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className={styles.section}>
				<div className={`${styles.grid} ${styles.grid__two}`}>
					<Link href='/learn-more/domain-classification' className={styles.link__card}>
						<div className={styles.card__label}>Deep dive</div>
						<h2 className={styles.link__card__title}>Domain classification engine</h2>
						<p className={styles.link__card__body}>
							See the more detailed breakdown of how Lemma classifies research domains before the rest of the pipeline runs.
						</p>
						<span className={styles.link__card__cta}>Open technical explainer</span>
					</Link>

					<Link href='/sign-in' className={styles.link__card}>
						<div className={styles.card__label}>Experience it</div>
						<h2 className={styles.link__card__title}>Run the workflow on your own paper</h2>
						<p className={styles.link__card__body}>
							Start with the paper upload flow and inspect how the product builds the story from research to deck.
						</p>
						<span className={styles.link__card__cta}>Analyze my paper</span>
					</Link>
				</div>
			</section>
		</PremiumPageShell>
	)
}
