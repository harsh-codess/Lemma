'use client'
import { type FC } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Menu } from 'lucide-react'
import styles from './styles.module.css'
import {
	SignInButton,
	SignUpButton,
	SignedIn,
	SignedOut,
	UserButton,
} from '@clerk/nextjs'

const Header: FC = () => {
	return (
		<div className={styles.header}>
			<div className={styles.header__blur__mask}></div>
			<div className={styles.header__overlay}></div>
			<header className={styles.header__wrapper}>
				<nav className={styles.header__root}>
					<div className='relative'>
						<ul className={styles.header__list}>
							<li className={cn(styles.header__logo, styles.header__item)}>
								<Link href='/' className={styles.header__logo__link} style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
									<svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
										<rect width="28" height="28" rx="7" fill="white"/>
										<path d="M7 8 L11 8 L21 21" stroke="#0a0a0a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
										<path d="M15 14 L9 21" stroke="#0a0a0a" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
									</svg>
									<span style={{ fontWeight: 700, fontSize: '16px', color: 'white', letterSpacing: '-0.3px' }}>Lemma</span>
								</Link>
							</li>

							<li className={cn(styles.hide__mobile, styles.header__trigger)}>
								<Link className={styles.header__link} href='#'>
									{' '}
									Features{' '}
								</Link>
							</li>

							<li className={cn(styles.hide__laptop, styles.header__item)}>
								<Link className={styles.header__link} href='#'>
									{' '}
									Method{' '}
								</Link>
							</li>

							<li className={cn(styles.hide__laptop, styles.header__item)}>
								<Link className={styles.header__link} href='#'>
									{' '}
									Customers{' '}
								</Link>
							</li>

							<li className={cn(styles.hide__tablet, styles.header__item)}>
								<Link className={styles.header__link} href='#'>
									{' '}
									Changelog{' '}
								</Link>
							</li>

							<li className={cn(styles.hide__mobile, styles.header__item)}>
								<Link className={styles.header__link} href='#'>
									{' '}
									Pricing{' '}
								</Link>
							</li>

							<li className={cn(styles.hide__mobile, styles.header__trigger)}>
								<Link className={styles.header__link} href='#'>
									{' '}
									Company{' '}
								</Link>
							</li>

							<li className={cn(styles.hide__tablet, styles.header__item)}>
								<Link className={styles.header__link} href='#'>
									{' '}
									Contact{' '}
								</Link>
							</li>

							<li
								className={cn(
									styles.header__item,
									styles.header__button,
									styles.header__login,
								)}>
								<SignedOut>
									<SignInButton mode='redirect'>
										<button className={cn(styles.header__link, styles.button__login)}>
											Log in <kbd className={styles.header__kbd}>L</kbd>
										</button>
									</SignInButton>
								</SignedOut>
								<SignedIn>
									<UserButton afterSignOutUrl='/' />
								</SignedIn>
							</li>

							<li
								className={cn(
									styles.header__item,
									styles.header__button,
									styles.header__signup,
								)}>
								<SignedOut>
									<SignUpButton mode='redirect'>
										<button className={cn(styles.header__link, styles.button__signup)}>
											Sign up
										</button>
									</SignUpButton>
								</SignedOut>
							</li>

							<li
								className={cn(
									styles.header__item,
									styles.header__button,
									styles.header__menu,
								)}>
								<button>
									<Menu />
								</button>
							</li>
						</ul>
					</div>
				</nav>
			</header>
		</div>
	)
}

export default Header
