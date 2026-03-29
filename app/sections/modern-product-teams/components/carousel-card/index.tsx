'use client'

import { type FC } from 'react'
import Image from 'next/image'
import styles from './styles.module.css'
import { Plus } from 'lucide-react'

export type CarouselCardProps = {
	id: string
	img: string
	title: string
	eyebrow: string
	description: string
	detailHeading: string
	detailBody: string
	highlights: string[]
	onOpen?: () => void
}

const CarouselCard: FC<CarouselCardProps> = ({ img, title, onOpen }) => {
	return (
		<div className={styles.carousel__card}>
			<button
				type='button'
				className={styles.outter__container}
				onClick={onOpen}
				aria-label={`Open details for ${title}`}>
				<div className={styles.img__container}>
					<Image src={img} alt='' width={960} height={914} />
				</div>
				<div className={styles.text__container}>
					<div className={styles.title}>
						<span> {title} </span>
					</div>

					<div className={styles.icon__container}>
						<Plus />
					</div>
				</div>
			</button>
		</div>
	)
}

export default CarouselCard
