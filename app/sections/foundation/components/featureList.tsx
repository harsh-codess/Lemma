import type { FC, ReactNode } from 'react'
import Secure from '@/assets/secure.svg'
import Complaints from '@/assets/complaints.svg'
import Support from '@/assets/support.svg'
import Control from '@/assets/control.svg'
import styles from '../styles.module.css'

const FeatureList: FC = () => {
	return (
		<div className={styles.feature__list}>
			<FeatureCard title='SOC 2 and GDPR aligned'>
				<Secure />
			</FeatureCard>
			<FeatureCard title='Institution-ready compliance posture'>
				<Complaints />
			</FeatureCard>
			<FeatureCard title='Multi-region secure infrastructure'>
				<Support />
			</FeatureCard>
			<FeatureCard title='Access and backup controls'>
				<Control />
			</FeatureCard>
		</div>
	)
}

type Props = {
	children: ReactNode
	title: string
}

const FeatureCard: FC<Props> = ({ title, children }) => {
	return (
		<div className={styles.feature__card}>
			{children}
			<span className={styles.feature__card__title}> {title} </span>
		</div>
	)
}

export default FeatureList
