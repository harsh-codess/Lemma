import { type FC } from 'react'
import Image from 'next/image'
import SectionHeading from '@/components/sectionHeading'
import {
	BentoGrid,
	BentoGridFeatureLookupWrapper,
	BentoGridSeperator,
	BentoGridTopLayer,
	BentoGridWideCardWrapper,
} from '@/components/bento-grid'
import styles from './styles.module.css'
import BentoCardLeft from '@/components/bento-grid/components/bento-grid-card-left'
import BentoGridCardRight from '@/components/bento-grid/components/bento-grid-card-right'
import FirstCard from './components/first-card'
import SecondCard from './components/second-card'
import WideCard from './components/wide-card'
import BentoGridFeatureLookUpCard from '@/components/bento-grid/components/bento-grid-feature-lookup-card'
import { issueTrackingFeatureLookup } from './feature-lookup-data'
import LayoutWrapper from '@/components/layout-wrapper'
import { GradientText } from '@/components/ui/gradient-text'

const IssueTracking: FC = () => {
	return (
		<section className={styles.issue__tracking}>
			<LayoutWrapper>
				<div className={styles.heading__container}>
					<div className={styles.heading__inner__container}>
							<SectionHeading
								heading={
									<>
										Know your{' '}
										<GradientText className='bg-transparent text-white dark:bg-transparent'>
											market
										</GradientText>{' '}
										before the investor asks
									</>
								}
								badgeText='Market intelligence'
								badgeStyle='bg-[#D4B144] border-none'
							/>

						<div>
							<p>
								Lemma’s Market Scout agent searches the web in real time — finding competitors,
								market size estimates, recent industry signals, and patent
								filings in your domain. No stale reports, no guesswork.
							</p>
						</div>
					</div>
				</div>
			</LayoutWrapper>

			<div className={styles.hero__img__wrapper}>
					<Image
						src='/issue-tracking-hero.svg'
						alt='Angled market intelligence dashboard showing competitor landscape, funding signals, patents, and evidence-backed insights'
						width={3200}
						height={1620}
					/>
			</div>

			<LayoutWrapper>
				<BentoGrid>
					<BentoGridTopLayer>
						<BentoCardLeft
							title='Competitor mapping — Who&apos;s already in the space'
							description='Detailed analysis of existing competitors and their positioning in your research domain.'>
							<FirstCard />
						</BentoCardLeft>
						<BentoGridCardRight
							title='Market signals — Recent funding, news, patents'
							description='Real-time monitoring of funding rounds, patent filings, and industry news in your space.'>
							<SecondCard />
						</BentoGridCardRight>
					</BentoGridTopLayer>

					<BentoGridWideCardWrapper>
						<WideCard />
					</BentoGridWideCardWrapper>

					<BentoGridSeperator />

					<BentoGridFeatureLookupWrapper>
						{issueTrackingFeatureLookup.map((featureLookup) => (
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

export default IssueTracking
