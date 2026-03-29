import { type FC } from 'react'
import styles from './styles.module.css'
import IllustrateAnimate from '@/components/illustrate-animate'

const workflowSteps = [
	{ label: 'Paper Reader', meta: 'TRL + domain', active: true, delay: 2.55 },
	{ label: 'Market Scout', meta: 'signals + patents', delay: 2.35 },
	{ label: 'Feasibility', meta: 'team + capital', delay: 2.15 },
	{ label: 'Deck Builder', meta: 'investor outputs', delay: 1.95 },
]

const Sidebar: FC = () => {
	return (
		<div className={styles.sidebar}>
			<IllustrateAnimate delay={2.9} className={styles.top__container}>
				<div className={styles.dot__container}>
					<div />
					<div />
					<div />
				</div>

				<div className={styles.top__badge}>Lemma OS</div>
			</IllustrateAnimate>

			<IllustrateAnimate delay={2.72} className={styles.sidebar__header__container}>
				<p className={styles.eyebrow}>Commercialization workflow</p>
				<h3 className={styles.title}>From paper to venture</h3>
				<p className={styles.subtitle}>
					Five agents convert research into a startup-ready narrative.
				</p>
			</IllustrateAnimate>

			<div className={styles.sidebar__dropdown__outter__container}>
				{workflowSteps.map((step) => (
					<IllustrateAnimate
						key={step.label}
						delay={step.delay}
						className={step.active ? styles.navItemActive : styles.navItem}>
						<div className={styles.navItem__left}>
							<span className={styles.navItem__indicator} />
							<div>
								<p className={styles.navItem__label}>{step.label}</p>
								<p className={styles.navItem__meta}>{step.meta}</p>
							</div>
						</div>

						<span className={styles.navItem__status}>
							{step.active ? 'Live' : 'Queued'}
						</span>
					</IllustrateAnimate>
				))}
			</div>

			<div className={styles.bottom__container}>
				<IllustrateAnimate delay={1.72} className={styles.infoCard}>
					<p className={styles.infoCard__label}>Evidence stack</p>
					<div className={styles.metricRow}>
						<span>papers parsed</span>
						<strong>14</strong>
					</div>
					<div className={styles.metricRow}>
						<span>sources linked</span>
						<strong>37</strong>
					</div>
					<div className={styles.metricRow}>
						<span>confidence</span>
						<strong className={styles.metricAccent}>82%</strong>
					</div>
				</IllustrateAnimate>

				<IllustrateAnimate delay={1.48} className={styles.chipCard}>
					<span>traceable</span>
					<span>source-backed</span>
					<span>fundable</span>
				</IllustrateAnimate>
			</div>
		</div>
	)
}

export default Sidebar
