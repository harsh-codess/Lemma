'use client'
import { useState, type FC } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Menu, X } from 'lucide-react'
import styles from './styles.module.css'
import {
	SignInButton,
	SignUpButton,
	SignedIn,
	SignedOut,
	UserButton,
} from '@clerk/nextjs'

const Header: FC = () => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

	const closeMobileMenu = () => setIsMobileMenuOpen(false)

	return (
		<div className={styles.header}>
			{isMobileMenuOpen && (
				<div className={styles.mobile__menu__backdrop} onClick={closeMobileMenu} />
			)}
			<div className={styles.header__blur__mask}></div>
			<div className={styles.header__overlay}></div>
			<header
				className={cn(
					styles.header__wrapper,
					isMobileMenuOpen && styles.header__wrapper__open,
				)}>
				<nav className={styles.header__root}>
					<div className='relative'>
						<ul className={styles.header__list}>
							<li className={cn(styles.header__logo, styles.header__item)}>
								<Link
									href='/'
									onClick={closeMobileMenu}
									className={styles.header__logo__link}
									style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
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
									styles.hide__mobile,
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
									styles.hide__mobile,
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
								<button
									className={styles.mobile__menu__button}
									type='button'
									aria-label='Toggle mobile menu'
									aria-expanded={isMobileMenuOpen}
									onClick={() => setIsMobileMenuOpen((prev) => !prev)}>
									{isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
								</button>
							</li>
						</ul>

						{isMobileMenuOpen && (
							<>
								<div className={styles.mobile__menu}>
									<div className={styles.mobile__menu__title}>Menu</div>
									<Link className={styles.mobile__menu__link} href='#' onClick={closeMobileMenu}>
										Features
									</Link>
									<Link className={styles.mobile__menu__link} href='#' onClick={closeMobileMenu}>
										Method
									</Link>
									<Link className={styles.mobile__menu__link} href='#' onClick={closeMobileMenu}>
										Customers
									</Link>
									<Link className={styles.mobile__menu__link} href='#' onClick={closeMobileMenu}>
										Changelog
									</Link>
									<Link className={styles.mobile__menu__link} href='#' onClick={closeMobileMenu}>
										Pricing
									</Link>
									<Link className={styles.mobile__menu__link} href='#' onClick={closeMobileMenu}>
										Company
									</Link>
									<Link className={styles.mobile__menu__link} href='#' onClick={closeMobileMenu}>
										Contact
									</Link>
									<div className={styles.mobile__menu__actions}>
										<SignedOut>
											<SignInButton mode='redirect'>
												<button
													onClick={closeMobileMenu}
													className={cn(styles.mobile__action__button, styles.mobile__action__secondary)}>
													Log in
												</button>
											</SignInButton>
											<SignUpButton mode='redirect'>
												<button
													onClick={closeMobileMenu}
													className={cn(styles.mobile__action__button, styles.mobile__action__primary)}>
													Sign up
												</button>
											</SignUpButton>
										</SignedOut>
										<SignedIn>
											<div className={styles.mobile__user__button}>
												<UserButton afterSignOutUrl='/' />
											</div>
										</SignedIn>
									</div>
								</div>
							</>
						)}
					</div>
				</nav>
			</header>
		</div>
	)
}

export default Header
