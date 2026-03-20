import { type FC } from 'react'
import styles from './styles.module.css'
import BentoCardHeading from '@/components/bento-grid/components/bento-card-heading'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import Image from 'next/image'

const WideCard: FC = () => {
	return (
		<div className={styles.wide__card}>
			<div className={styles.heading__wrapper}>
				<div className={styles.head__container}>
					<BentoCardHeading
						title='Domain classification — Biotech, hardware, software, and more'
						description='Automatic classification of your research domain to match relevant markets and investor theses.'
					/>

					<Link href='/learn-more/domain-classification' className={styles.link}>
						<span> Learn more </span>
						<ChevronRight className='w-4 h-4' />
					</Link>
				</div>
			</div>

			<div className={styles.img__container}>
				<Image src='/dashboard.svg' width={1740} height={930} alt='' />
			</div>
		</div>
	)
}

export default WideCard
