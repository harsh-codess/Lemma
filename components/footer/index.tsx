import { type FC } from 'react'
import Link from 'next/link'
import { FaXTwitter } from 'react-icons/fa6'
import { FaGithub, FaSlack, FaYoutube } from 'react-icons/fa'
import Logo from './logo.svg'
import { footerSections } from '@/lib/constant'
import FooterSection from './footerSection'
import styles from './styles.module.css'

const Footer: FC = () => {
	return (
		<footer className={styles.container}>
			<div className={styles.inner__container}>
				<div className={styles.left__container}>
					<Link className={styles.logo__link} href='/'>
						<span className={styles.logo}>
							<svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
								<rect width="28" height="28" rx="7" fill="white"/>
								<path d="M7 8 L11 8 L21 21" stroke="#0a0a0a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
								<path d="M15 14 L9 21" stroke="#0a0a0a" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
							</svg>
						</span>
						<span> Lemma </span>
						<span className={styles.hide__mobile}> - From paper to pitch, in minutes. </span>
					</Link>

					<div className={styles.social__icons}>
						<Link href='#'>
							<FaXTwitter />
						</Link>
						<Link href='#'>
							<FaGithub />
						</Link>

						<Link href='#'>
							<FaSlack />
						</Link>

						<Link href='#'>
							<FaYoutube />
						</Link>
					</div>
				</div>

				{footerSections.map((section, idx) => (
					<FooterSection key={idx} {...section} />
				))}
			</div>
		</footer>
	)
}

export default Footer
