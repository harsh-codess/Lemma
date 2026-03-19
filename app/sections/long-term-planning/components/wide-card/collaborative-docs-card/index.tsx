import { type FC } from 'react'
import People from '@/assets/people.svg'
import Placeholder from '@/assets/placeholder-1.svg'
import styles from './styles.module.css'

const CollaborativeDocsCard: FC = () => {
	return (
		<div className={styles.collaborative__docs}>
			<div className={styles.icons__container}>
				<People />
			</div>
			<span className={styles.heading}>
				<span className={styles.editor__remote__selection}>
					{' '}
					Annotate your
				</span>
				<span className={styles.remote__selection__cursor}>
					<span className={styles.editor__remote__label}>
						<span className={styles.editor__remote__name}>Arya</span>
					</span>
				</span>
				{'    '}
				paper
			</span>

			<span className={styles.paragraph}>
				Add TRL evidence and highlight key findings in realtime,
				collaborative research
				<span className={styles.remote__cursor}>
					<span className={styles.remote__label}>
						<span className={styles.remote__name}> Rohan </span>
					</span>
				</span>
				documents. Add <span className={styles.hightlight}>**</span>citations
				<span className={styles.hightlight}>**</span> and{' '}
				<span className={styles.hightlight}>##</span>
				structure your findings with rich-text formatting.
			</span>
			<Placeholder />
		</div>
	)
}

export default CollaborativeDocsCard
