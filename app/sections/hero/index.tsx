import { type FC } from 'react'
import dynamic from 'next/dynamic'
import styles from './styles.module.css'
import LayoutWrapper from '@/components/layout-wrapper'
import { cn } from '@/lib/utils'
import BlurPopUp from '@/components/blur-pop-up'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import Sidebar from './components/sidebar'
import WorkspacePanel from './components/workspace-panel'

const AnimatedTextCycle = dynamic(() => import('@/components/ui/animated-text-cycle'), {
	ssr: false,
	loading: () => <span className={styles.heading__cycle}>startup</span>,
})

const Hero: FC = () => {
	return (
		<section className={styles.hero}>
			<LayoutWrapper>
				<BlurPopUp delay={0.2}>
					<h1 className={cn(styles.heading, styles.hide__mobile)}>
						<span className={styles.heading__line}>Lemma turns your research</span>
						<span className={styles.heading__line}>
							into a fundable{' '}
							<AnimatedTextCycle
								words={['startup', 'spinout', 'venture', 'company']}
								interval={2600}
								className={styles.heading__cycle}
							/>
						</span>
					</h1>
				</BlurPopUp>

				<BlurPopUp delay={0.2}>
					<h1 className={cn(styles.heading, styles.show__mobile, 'text-center')}>
						<span className={styles.heading__line}>Turn your research</span>
						<span className={styles.heading__line}>
							into a{' '}
							<AnimatedTextCycle
								words={['startup', 'spinout', 'venture', 'company']}
								interval={2600}
								className={styles.heading__cycle}
							/>
						</span>
					</h1>
				</BlurPopUp>

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
						<Link className={styles.start__link} href='/sign-in'>
							{' '}
							Analyze my paper{' '}
						</Link>
					</BlurPopUp>

					<BlurPopUp delay={1.15}>
						<Link className={styles.intoducing__link} href='/method'>
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
									<div className={styles.hero__illustration__inbox}>
										<WorkspacePanel />
									</div>
								</div>
							</div>
						</div>
				</div>
			</LayoutWrapper>
		</section>
	)
}

export default Hero
