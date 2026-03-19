import { type FC } from 'react'
import SectionHeading from '@/components/sectionHeading'
import DefinitionList from './components/definitionList'
import FeatureList from './components/featureList'
import { foundationList } from '@/lib/constant'
import UnderTheHood from '@/assets/underToHood.svg'
import styles from './styles.module.css'
import LayoutWrapper from '@/components/layout-wrapper'

const Foundation: FC = () => {
	return (
		<section className={styles.foundation}>
			<LayoutWrapper>
				<div className={styles.inner__container}>
					<div className={styles.heading__container}>
						<SectionHeading
							badgeText='Built for research you haven&apos;t published yet'
							heading='Your data is as protected as your ideas'
						/>

						<p>
							{' '}
							Lemma is so simple to use, it’s easy to overlook the wealth of
							complex technologies packed under the hood that keep Lemma
							robust, safe, and blazing fast.{' '}
						</p>
					</div>

					<div className={styles.list__container}>
						<div className={styles.seperator} />

						<DefinitionList data={foundationList} />
					</div>

					<div className={styles.feature__list__container}>
						<div className={styles.seperator} />
						<FeatureList />
					</div>
				</div>

				<div className={styles.under__the__hood}>
					<UnderTheHood />
				</div>
			</LayoutWrapper>
		</section>
	)
}

export default Foundation
