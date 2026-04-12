import * as React from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { cn } from '@/lib/utils'

type ButtonWithIconProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	children: React.ReactNode
	href?: string
	icon?: React.ReactNode
	iconClassName?: string
}

const ButtonWithIcon = React.forwardRef<HTMLButtonElement, ButtonWithIconProps>(
	({ children, className, href, icon, iconClassName, ...props }, ref) => {
		const content = (
			<>
				<span className='relative z-10 transition-all duration-500'>
					{children}
				</span>
				<span
					className={cn(
						'absolute right-1 flex h-10 w-10 items-center justify-center rounded-full bg-background text-foreground transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45',
						iconClassName,
					)}>
					{icon ?? <ArrowUpRight size={16} />}
				</span>
			</>
		)

		const classes = cn(
			'group relative inline-flex h-12 w-fit cursor-pointer items-center justify-center overflow-hidden rounded-full p-1 pe-14 ps-6 text-sm font-semibold transition-all duration-500 hover:pe-6 hover:ps-14 disabled:pointer-events-none disabled:opacity-50',
			className,
		)

		if (href) {
			return (
				<Link href={href} className={classes}>
					{content}
				</Link>
			)
		}

		return (
			<button ref={ref} type='button' className={classes} {...props}>
				{content}
			</button>
		)
	},
)

ButtonWithIcon.displayName = 'ButtonWithIcon'

export { ButtonWithIcon }

export default ButtonWithIcon
