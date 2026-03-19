import { type FC } from 'react'
import styles from './styles.module.css'

const SectionHeading: FC = () => {
	return (
		<div className={styles.top__container}>
			<div className={styles.heading}>
				<h2>Made for researchers who mean business</h2>
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
