import Link from 'next/link'

import { LegalStackSvg } from '@/components/page-visuals'
import PremiumPageShell from '@/components/premium-page-shell'
import styles from '@/components/premium-page-shell/styles.module.css'

const documents = [
	{
		title: 'MSA',
		description:
			'The commercial agreement layer for teams using Lemma in a managed or institutional setting.',
		href: '/legal/msa',
		cta: 'Read MSA',
	},
	{
		title: 'Product Terms',
		description:
			'Product-specific expectations around account use, AI-generated outputs, and deployment boundaries.',
		href: '/legal/product-terms',
		cta: 'Read product terms',
	},
	{
		title: 'Privacy Notice',
		description:
			'How Lemma handles account data, uploaded research material, and service telemetry.',
		href: '/legal/privacy-notice',
		cta: 'Read privacy notice',
	},
	{
		title: 'Cookie Notice',
		description:
			'The cookie and browser-storage categories used to keep the product secure and reliable.',
		href: '/legal/cookie-notice',
		cta: 'Read cookie notice',
	},
]

export default function LegalHubPage() {
	return (
		<PremiumPageShell
			badgeText='Legal and trust'
			heading='The policy layer should feel as considered as the product layer.'
			description={
				<>
					<p>
						Lemma handles unpublished research, institution-sensitive workflows, and outputs that may shape funding conversations. The legal surface area should communicate that same level of care.
					</p>
					<p>
						Use this hub to navigate the core legal pages connected to the product experience.
					</p>
				</>
			}
			visual={<LegalStackSvg />}>
			<section className={styles.section}>
				<div className={`${styles.grid} ${styles.grid__two}`}>
					{documents.map((document) => (
						<Link key={document.title} href={document.href} className={styles.link__card}>
							<div className={styles.card__label}>Document</div>
							<h2 className={styles.link__card__title}>{document.title}</h2>
							<p className={styles.link__card__body}>{document.description}</p>
							<span className={styles.link__card__cta}>{document.cta}</span>
						</Link>
					))}
				</div>
			</section>
		</PremiumPageShell>
	)
}
