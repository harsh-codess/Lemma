import { type FC } from 'react'
import styles from './styles.module.css'
import SectionHeading from '@/components/sectionHeading'
import Carousel from './components/carousel'
import LayoutWrapper from '@/components/layout-wrapper'

const Collaborate: FC = () => {
	return (
		<section className={styles.collaborate}>
			<LayoutWrapper>
				<div className={styles.heading__container}>
					<div className={styles.heading__inner__container}>
						<SectionHeading
							heading='From analysis to a deck you can walk into a room with'
							badgeText='Feasibility and pitch generation'
							badgeStyle='bg-[#b59aff] border-none'
						/>
					</div>

					<div className={styles.heading__text__container}>
						<p>
							Lemma&apos;s final agents build a technical feasibility matrix — team size, domain expertise, capital estimate — and then synthesize everything into a pitch deck in PDF, PowerPoint, and Word.
						</p>
					</div>
				</div>
			</LayoutWrapper>

			<div className={styles.carousel__container}>
				<Carousel />
			</div>
		</section>
	)
}

export default Collaborate
