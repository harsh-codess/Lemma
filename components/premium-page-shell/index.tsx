import type { ReactNode } from 'react'

import LayoutWrapper from '@/components/layout-wrapper'
import SectionHeading from '@/components/sectionHeading'
import { cn } from '@/lib/utils'

import styles from './styles.module.css'

type PremiumPageShellProps = {
	badgeText: string
	heading: string
	description: ReactNode
	visual?: ReactNode
	children: ReactNode
	className?: string
}

const PremiumPageShell = ({
	badgeText,
	heading,
	description,
	visual,
	children,
	className,
}: PremiumPageShellProps) => {
	return (
		<main className={cn(styles.page, className)}>
			<div className={styles.backdrop} aria-hidden='true' />
			<LayoutWrapper>
				<section className={styles.hero}>
					<div
						className={cn(
							styles.hero__grid,
							!visual && styles.hero__grid__single,
						)}>
						<div className={styles.hero__copy}>
							<SectionHeading badgeText={badgeText} heading={heading} />
							<div className={styles.hero__description}>{description}</div>
						</div>

						{visual ? (
							<div className={styles.hero__visual}>
								<div className={styles.hero__visual__inner}>{visual}</div>
							</div>
						) : null}
					</div>
				</section>

				<div className={styles.content}>{children}</div>
			</LayoutWrapper>
		</main>
	)
}

export default PremiumPageShell
