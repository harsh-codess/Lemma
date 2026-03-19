import { type FC } from 'react'
import styles from './styles.module.css'
import CarouselCard from '../carouselCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const Carousel: FC = () => {
	return (
		<div className={styles.container}>
			<div>
				<div className={styles.carousel__container}>
					<div className={styles.carousel__inner__container}>
						<CarouselCard title='Feasibility matrix' description='Team size and expertise required' />
						<CarouselCard title='Capital estimate' description='Rough funding requirement' />
						<CarouselCard title='Pitch deck' description='PDF, PowerPoint, and Word' />
						<CarouselCard title='TRL/IRL scorecard' description='Full scoring report' />
						<CarouselCard title='Market brief' description='Competitor and signal summary' />
						<CarouselCard title='Investor matches' description='Ranked by thesis fit' />
					</div>
				</div>

				<div className={styles.card__controls__container}>
					<button className={styles.icon__button}>
						<ChevronLeft />
					</button>
					<button className={styles.icon__button}>
						<ChevronRight />
					</button>
				</div>
			</div>
		</div>
	)
}

export default Carousel
