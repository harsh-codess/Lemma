import { type FC } from 'react'
import Link from 'next/link'
import { footerSections } from '@/lib/constant'
import LemmaLogo from '@/components/lemma-logo'
import FooterSection from './footerSection'
import styles from './styles.module.css'

const Footer: FC = () => {
	return (
		<footer className={styles.container}>
			<div className={styles.inner__container}>
				<div className={styles.left__container}>
					<Link className={styles.logo__link} href='/'>
						<LemmaLogo
							iconClassName={styles.logo}
							wordmarkClassName={styles.logo__wordmark}
						/>
						<span className={styles.hide__mobile}> - From paper to pitch, in minutes. </span>
					</Link>
				</div>

				{footerSections.map((section, idx) => (
					<FooterSection key={idx} {...section} />
				))}
			</div>
		</footer>
	)
}

export default Footer
