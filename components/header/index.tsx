'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import styles from './styles.module.css'
import {
	SecondaryNavbar,
	SimpleNavbar,
} from '@/components/ui/core-header-navbar'
import { siteNavItems } from '@/lib/constant'
import { cn } from '@/lib/utils'

const getPageTitle = (pathname: string | null) => {
	if (!pathname || pathname === '/') {
		return 'Home'
	}

	if (pathname.startsWith('/sign-in')) {
		return 'Sign In'
	}

	if (pathname.startsWith('/sign-up')) {
		return 'Sign Up'
	}

	if (pathname.startsWith('/institutions')) {
		return 'Institutions'
	}

	if (pathname.startsWith('/learn-more/domain-classification')) {
		return 'Domain Classification'
	}

	if (pathname.startsWith('/method')) {
		return 'Method'
	}

	if (pathname.startsWith('/legal/msa')) {
		return 'MSA'
	}

	if (pathname.startsWith('/legal/product-terms')) {
		return 'Product Terms'
	}

	if (pathname.startsWith('/legal/privacy-notice')) {
		return 'Privacy Notice'
	}

	if (pathname.startsWith('/legal/cookie-notice')) {
		return 'Cookie Notice'
	}

	if (pathname.startsWith('/legal')) {
		return 'Legal Hub'
	}

	return 'Lemma'
}

const getActiveNavHref = (pathname: string | null) => {
	if (!pathname) {
		return '/'
	}

	if (pathname === '/') {
		return '/'
	}

	if (pathname.startsWith('/institutions')) {
		return '/institutions'
	}

	if (
		pathname.startsWith('/method') ||
		pathname.startsWith('/learn-more/domain-classification')
	) {
		return '/method'
	}

	if (pathname.startsWith('/legal/msa')) {
		return '/legal/msa'
	}

	if (pathname.startsWith('/legal/product-terms')) {
		return '/legal/product-terms'
	}

	if (pathname.startsWith('/legal/privacy-notice')) {
		return '/legal/privacy-notice'
	}

	if (pathname.startsWith('/legal/cookie-notice')) {
		return '/legal/cookie-notice'
	}

	if (pathname.startsWith('/legal')) {
		return '/legal'
	}

	return ''
}

const Header = () => {
	const pathname = usePathname()
	const { user } = useUser()
	const [isHeaderHidden, setIsHeaderHidden] = useState(false)
	const lastScrollYRef = useRef(0)

	const isHomePage = pathname === '/'
	const isSignInRoute = pathname?.startsWith('/sign-in')
	const isSignUpRoute = pathname?.startsWith('/sign-up')
	const pageTitle = getPageTitle(pathname)
	const activeNavHref = getActiveNavHref(pathname)
	const userLabel =
		user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || 'Lemma'

	useEffect(() => {
		setIsHeaderHidden(false)

		if (!isHomePage) {
			lastScrollYRef.current = 0
			return
		}

		const initialScrollY = window.scrollY
		lastScrollYRef.current = initialScrollY

		const handleScroll = () => {
			const currentScrollY = window.scrollY
			const scrollDelta = currentScrollY - lastScrollYRef.current

			if (currentScrollY <= 24) {
				setIsHeaderHidden(false)
				lastScrollYRef.current = currentScrollY
				return
			}

			if (Math.abs(scrollDelta) < 10) {
				lastScrollYRef.current = currentScrollY
				return
			}

			if (scrollDelta > 0 && currentScrollY > 140) {
				setIsHeaderHidden(true)
			}

			if (scrollDelta < 0) {
				setIsHeaderHidden(false)
			}

			lastScrollYRef.current = currentScrollY
		}

		window.addEventListener('scroll', handleScroll, { passive: true })

		return () => {
			window.removeEventListener('scroll', handleScroll)
		}
	}, [isHomePage])

	return (
		<div className={styles.header}>
			<div
				className={cn(
					styles.header__blur__mask,
					isHeaderHidden && styles.header__blur__mask__hidden,
				)}></div>
			<header
				className={cn(
					styles.header__wrapper,
					isHeaderHidden && styles.header__wrapper__hidden,
				)}>
				<SimpleNavbar
					title={pageTitle}
					trailingContent={
						<>
							<SignedOut>
								<div className='flex items-center gap-2'>
									{!isSignInRoute ? (
										<Link
											href='/sign-in'
											className={styles.secondary__action}>
											Log in
										</Link>
									) : null}

									{!isSignUpRoute ? (
										<Link
											href='/sign-up'
											className={styles.primary__action}>
											Sign up
										</Link>
									) : null}
								</div>
							</SignedOut>

							<SignedIn>
								<div className='flex items-center gap-3'>
									<div className='hidden sm:flex flex-col items-end'>
										<span className={styles.user__label}>{userLabel}</span>
										<span className={styles.user__status}>Authenticated</span>
									</div>
									<div className={styles.user__button}>
										<UserButton afterSignOutUrl='/' />
									</div>
								</div>
							</SignedIn>
						</>
					}
				/>

				<SecondaryNavbar
					currentType={activeNavHref}
					links={siteNavItems.map((item) => ({
						name: item.label,
						href: item.href,
					}))}
				/>
			</header>
		</div>
	)
}

export default Header
