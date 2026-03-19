import { type FC } from 'react'
import styles from './styles.module.css'
import Image from 'next/image'
import { Plus } from 'lucide-react'
type CarouselCardProps = {
	title?: string
	description?: string
}
const CarouselCard: FC<CarouselCardProps> = ({ title = 'Feasibility matrix', description = 'Team size and expertise required' }) => {
	return (
		<div className={styles.card}>
			<div className={styles.img__container}>
				<div className={styles.img__wrapper}>
					<Image src='/collaborate-img1.avif' alt='' width={336} height={469} />
				</div>
			</div>

			<div className={styles.content__container}>
				<div className={styles.card__heading__container}>
					<h3> {title} </h3>
					<p> {description} </p>
				</div>

				<button className={styles.icon__button}>
					<Plus />
				</button>
			</div>
		</div>
	)
}

export default CarouselCard
