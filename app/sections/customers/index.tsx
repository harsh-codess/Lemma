import { type FC } from 'react'
import styles from './styles.module.css'
import LayoutWrapper from '@/components/layout-wrapper'
import CustomerList from './components/customer-list'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import CustomerMarquee from './components/customer-marquee'
import { GradientText } from '@/components/ui/gradient-text'

const Customers: FC = () => {
	return (
		<section className={styles.customers}>
			<LayoutWrapper>
					<p className={styles.description__large__screen}>
						Built for researchers at India&rsquo;s{' '}
						<GradientText className={styles.highlight}>
							top institutions
						</GradientText>
						.
					</p>

					<p className={styles.description__small__screen}>
						Built for researchers at India&rsquo;s{' '}
						<GradientText className='bg-transparent text-white dark:bg-transparent'>
							top institutions
						</GradientText>
						.
					</p>

				<div className={styles.customer__list__container}>
					<CustomerList />

					<div className={styles.link__container}>
						<Link href='/institutions' className={styles.link}>
							<span className={styles.link__text}> View institutions → </span>
							<ChevronRight />
						</Link>
					</div>
				</div>
			</LayoutWrapper>
			<div className={styles.customer__marquee__container}>
				<CustomerMarquee />
			</div>
		</section>
	)
}

export default Customers
