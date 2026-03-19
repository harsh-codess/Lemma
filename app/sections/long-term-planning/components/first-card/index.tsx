import { type FC } from 'react'
import styles from './styles.module.css'
import Progress from '@/assets/progress.svg'
import Person from '@/assets/person.svg'
import Image from 'next/image'
import Figma from '@/assets/figma.svg'
import Funnal from '@/assets/funnal.svg'
import BlueDiamond from '@/assets/blue-diamond.svg'
import YellowDiamond from '@/assets/yellow-diamond.svg'

const FirstCard: FC = () => {
	return (
		<div className={styles.project__overview__card}>
			<div className={styles.outter__container}>
				<div className={styles.inner__container}>
					<h4 className={styles.heading}> Paper Overview </h4>

					<dl className={styles.definition__list}>
						<div className={styles.list__item__container}>
							<dt className={styles.list__label}> TRL Analysis </dt>
							<dd className={styles.list__data}>
								<div className={styles.first__data__row}>
									<div className={styles.item}>
										<Progress />
										<span className={styles.item__text}> TRL 4 </span>
									</div>

									<div className={styles.item}>
										<Person />
										<span className={styles.item__text}> Research </span>
									</div>

									<div className={styles.item}>
										<div className={styles.item__group}>
											<div className={styles.profile}>
												<Image
													src='/user-4.jpg'
													alt=''
													width={18}
													height={18}
												/>
											</div>

											<div className={styles.profile}>
												<Image
													src='/user-5.png'
													alt=''
													width={18}
													height={18}
												/>
											</div>

											<div className={styles.profile}>
												<Image
													src='/user-6.jpg'
													alt=''
													width={18}
													height={18}
												/>
											</div>

											<div className={styles.profile}>
												<Image
													src='/user-7.jpg'
													alt=''
													width={18}
													height={18}
												/>
											</div>
										</div>
									</div>
								</div>
							</dd>
						</div>

						<div className={styles.list__item__container}>
							<dt className={styles.list__label}> References </dt>
							<dd>
								<div className={styles.first__data__row}>
									<div className={styles.data__button}>
										<Figma />

										<span className={styles.item__text}> Paper PDF </span>
									</div>

									<div className={styles.data__button}>
										<Funnal />

										<span className={styles.item__text}> Patent Search </span>
									</div>
								</div>
							</dd>
						</div>

						<div className={styles.list__item__container}>
							<dt className={styles.list__label}> IRL Milestones </dt>
							<dd className={styles.list__data}>
								<div className={styles.list__data__rows}>
									<div className={styles.list__item__row}>
										<BlueDiamond />
										<span className={styles.item__text}>
											Scoring Complete
											<span className={styles.inner}> 100%</span>
										</span>
									</div>

									<div className={styles.list__item__row}>
										<BlueDiamond />
										<span className={styles.item__text}>
											Market Validation
											<span className={styles.inner}>100% of 10</span>
										</span>
									</div>

									<div className={styles.list__item__row}>
										<YellowDiamond />
										<span className={styles.item__text}>
											Pitch Deck Draft
											<span className={styles.inner}> 25% of 53</span>
										</span>
									</div>
								</div>
							</dd>
						</div>
					</dl>
				</div>
			</div>
		</div>
	)
}

export default FirstCard
