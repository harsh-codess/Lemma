import { type FC } from 'react'
import styles from './styles.module.css'
import LayoutWrapper from '@/components/layout-wrapper'
import SectionHeading from '@/components/sectionHeading'
import Link from 'next/link'
import RoadmapTimeline from '@/assets/roadmap-timeline.svg'
import {
	BentoGrid,
	BentoGridFeatureLookupWrapper,
	BentoGridSeperator,
	BentoGridTopLayer,
	BentoGridWideCardWrapper,
} from '@/components/bento-grid'
import BentoCardLeft from '@/components/bento-grid/components/bento-grid-card-left'
import BentoGridCardRight from '@/components/bento-grid/components/bento-grid-card-right'
import BentoGridFeatureLookUpCard from '@/components/bento-grid/components/bento-grid-feature-lookup-card'
import { longTermFeatureLookup } from './feature-lookup-data'
import FirstCard from './components/first-card'
import SecondCard from './components/second-card'
import WideCard from './components/wide-card'
import { GradientText } from '@/components/ui/gradient-text'

const LongTermPlanning: FC = () => {
	return (
		<section className={styles.long__term__planning}>
			<LayoutWrapper>
				<div className={styles.heading__container}>
					<div className={styles.heading__inner__container}>
						<Link href='/'>
								<SectionHeading
									heading={
										<>
											Know exactly where your research{' '}
											<GradientText className='bg-transparent text-white dark:bg-transparent'>
												stands
											</GradientText>
										</>
									}
									badgeText='Paper analysis and TRL scoring'
									badgeStyle='bg-[#68CC58] border-none'
								/>
						</Link>
					</div>
					<div className={styles.description__container}>
						<p>
							<span>Lemma&apos;s Paper Reader agent reads your full paper and scores it using Technology Readiness Level (TRL 1–9) and Investment Readiness Level indicators</span>{' '}
							— giving you a clear picture of how close your research is to becoming a real product.
						</p>
					</div>
				</div>
			</LayoutWrapper>

			<div className={styles.hero__img__wrapper}>
				<RoadmapTimeline />
			</div>

			<LayoutWrapper>
				<BentoGrid>
					<BentoGridTopLayer>
						<BentoCardLeft
							title='TRL Score — Rated 1 to 9 with detailed justification'
							description='Comprehensive Technology Readiness Level assessment based on your full paper analysis.'>
							<FirstCard />
						</BentoCardLeft>
						<BentoGridCardRight
							title='IRL Score — Investment readiness with gap analysis'
							description='Investment Readiness Level scoring with detailed gap analysis and recommendations.'>
							<SecondCard />
						</BentoGridCardRight>
					</BentoGridTopLayer>

					<div className='h-6'></div>

					<BentoGridWideCardWrapper>
						<WideCard />
					</BentoGridWideCardWrapper>

					<BentoGridSeperator />

					<BentoGridFeatureLookupWrapper>
						{longTermFeatureLookup.map((featureLookup) => (
							<BentoGridFeatureLookUpCard
								key={featureLookup.id}
								{...featureLookup}
							/>
						))}
					</BentoGridFeatureLookupWrapper>
				</BentoGrid>
			</LayoutWrapper>
		</section>
	)
}

export default LongTermPlanning
