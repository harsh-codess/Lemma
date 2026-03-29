import { type FC } from 'react'
import styles from './styles.module.css'
import Link from 'next/link'
import LayoutWrapper from '@/components/layout-wrapper'
import { GradientText } from '@/components/ui/gradient-text'

const PreFooter: FC = () => {
	return (
		<section className={styles.prefooter}>
			<LayoutWrapper>
				<div className={styles.grid__container}>
						<div className=''>
							<h3 className={styles.heading}>
								Your paper is the lemma.
								<br />
								The startup is the{' '}
								<GradientText className='bg-transparent text-white dark:bg-transparent'>
									theorem
								</GradientText>
								.
							</h3>
						</div>

					<div className={styles.links__outter__container}>
						<div className={styles.links__inner__container}>
							<Link className={styles.get__started__link} href='/sign-in'>
								{' '}
								Analyze my paper{' '}
							</Link>
							<Link className={styles.talk__to__sales} href='/'>
								{' '}
								Talk to us{' '}
							</Link>
						</div>
					</div>
				</div>
			</LayoutWrapper>
		</section>
	)
}

export default PreFooter
