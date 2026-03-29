import type { ReactNode } from 'react'

import { LegalStackSvg } from '@/components/page-visuals'
import PremiumPageShell from '@/components/premium-page-shell'
import styles from '@/components/premium-page-shell/styles.module.css'

type LegalFact = {
	label: string
	value: string
}

type LegalSection = {
	title: string
	body: ReactNode[]
	bullets?: string[]
}

type LegalPageTemplateProps = {
	badgeText: string
	heading: string
	description: ReactNode
	facts: LegalFact[]
	sections: LegalSection[]
}

const LegalPageTemplate = ({
	badgeText,
	heading,
	description,
	facts,
	sections,
}: LegalPageTemplateProps) => {
	return (
		<PremiumPageShell
			badgeText={badgeText}
			heading={heading}
			description={description}
			visual={<LegalStackSvg />}>
			<section className={styles.section}>
				<div className={`${styles.grid} ${styles.grid__three}`}>
					{facts.map((fact) => (
						<div key={fact.label} className={styles.card}>
							<div className={styles.card__label}>{fact.label}</div>
							<h2 className={styles.card__title}>{fact.value}</h2>
						</div>
					))}
				</div>
			</section>

			<section className={styles.section}>
				<div className={styles.panel}>
					{sections.map((section) => (
						<div key={section.title} className={styles.doc__section}>
							<h2 className={styles.doc__section__title}>{section.title}</h2>
							<div className={styles.doc__section__body}>
								{section.body.map((paragraph, index) => (
									<p key={`${section.title}-${index}`}>{paragraph}</p>
								))}
								{section.bullets ? (
									<ul>
										{section.bullets.map((bullet) => (
											<li key={bullet}>{bullet}</li>
										))}
									</ul>
								) : null}
							</div>
						</div>
					))}
				</div>
			</section>
		</PremiumPageShell>
	)
}

export default LegalPageTemplate
