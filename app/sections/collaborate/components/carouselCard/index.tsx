import { type FC, ReactNode } from 'react'
import styles from './styles.module.css'
import { Plus } from 'lucide-react'

type CarouselCardProps = {
	title?: string
	description?: string
	content?: ReactNode
	onOpen?: () => void
}

const CarouselCard: FC<CarouselCardProps> = ({
	title = 'Feasibility matrix',
	description = 'Team size and expertise required',
	content,
	onOpen,
}) => {
	return (
		<div className={styles.card} data-carousel-card>
			{/* Background text-UI layer replacing image */}
			<div className={styles.img__container}>
				<div className={styles.img__wrapper} style={{ height: '100%', alignItems: 'flex-start', padding: '1.5rem 1.25rem' }}>
					{content}
				</div>
			</div>

			<div className={styles.content__container}>
				<div className={styles.card__heading__container}>
					<h3> {title} </h3>
					<p> {description} </p>
				</div>

					<button
						type='button'
						className={styles.icon__button}
						onClick={onOpen}
						aria-label={`Open details for ${title}`}>
						<Plus />
					</button>
				</div>
			</div>
	)
}

export default CarouselCard
