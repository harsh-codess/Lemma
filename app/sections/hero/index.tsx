import { type FC } from 'react'
import styles from './styles.module.css'
import LayoutWrapper from '@/components/layout-wrapper'
import BlurPopUpByWord from '@/components/blur-pop-up-by-words'
import { cn } from '@/lib/utils'
import BlurPopUp from '@/components/blur-pop-up'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import Inbox from '@/assets/inbox.svg'
import Sidebar from './components/sidebar'
import IllustrateAnimate from '@/components/illustrate-animate'

const Hero: FC = () => {
	return (
		<section className={styles.hero}>
			<LayoutWrapper>
				<h1 className={cn(styles.heading, styles.hide__mobile)}>
					<BlurPopUpByWord text='Lemma turns your research into a fundable startup' />
				</h1>

				<h1 className={cn(styles.heading, styles.show__mobile, 'text-center')}>
					<BlurPopUpByWord text='Turn your research into a startup' />
				</h1>

				<BlurPopUp delay={1}>
					<h2 className={cn(styles.sub__heading, styles.hide__mobile)}>
						Five AI agents read your paper, score its commercial potential,
						analyze the market, and generate an investor-ready pitch deck — in minutes.
					</h2>
					<h2 className={cn(styles.sub__heading, styles.show__mobile)}>
						Lemma turns your research into a fundable startup.
						Five AI agents analyze your paper and generate a pitch deck — in minutes.
					</h2>
				</BlurPopUp>

				<div className={cn(styles.button__container)}>
					<BlurPopUp delay={1.1}>
						<Link className={styles.start__link} href='#'>
							{' '}
							Analyze my paper{' '}
						</Link>
					</BlurPopUp>

					<BlurPopUp delay={1.15}>
						<Link className={styles.intoducing__link} href='#'>
							<span>See how it works →</span>
							<ChevronRight />
						</Link>
					</BlurPopUp>
				</div>

				<div className={styles.hero__img__container}>
					<div className={styles.hero__illustration__container}>
						<div className={styles.hero__illustration__perspective}>
							<div className={styles.hero__illustration__base}>
								<div className={styles.hero__illustration__sidebar}>
									<Sidebar />
								</div>
								<IllustrateAnimate
									delay={2}
									duration={1.4}
									className={styles.hero__illustration__inbox}>
									<Inbox />
								</IllustrateAnimate>
							</div>
						</div>
					</div>
				</div>
			</LayoutWrapper>
		</section>
	)
}

export default Hero
