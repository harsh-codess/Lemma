import { type FC } from 'react'
import styles from './styles.module.css'
import { GradientText } from '@/components/ui/gradient-text'

const SectionHeading: FC = () => {
	return (
		<div className={styles.top__container}>
				<div className={styles.heading}>
					<h2>
						Made for researchers who mean{' '}
						<GradientText className='bg-transparent text-white dark:bg-transparent'>
							business
						</GradientText>
					</h2>
				</div>

			<div className={styles.description}>
				<p>
					Lemma is shaped by the practices and principles that distinguish
					world-class research teams from the rest: relentless focus, fast
					execution, and a commitment to the quality of craft.
				</p>
			</div>
		</div>
	)
}

export default SectionHeading
