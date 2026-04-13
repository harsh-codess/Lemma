'use client'

import * as React from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

type AnalyzePaperButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	loading?: boolean
	loadingLabel?: string
}

const AnalyzePaperButton = React.forwardRef<
	HTMLButtonElement,
	AnalyzePaperButtonProps
>(({ className, loading = false, loadingLabel, disabled, children, ...props }, ref) => {
	const isDisabled = Boolean(disabled || loading)

	return (
		<button
			ref={ref}
			type='button'
			className={cn(
				'group relative inline-flex h-12 w-full items-center overflow-hidden rounded-2xl border px-4 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#040405]',
				isDisabled
					? 'border-white/10 bg-white/85 text-black/45 shadow-[0_10px_32px_rgba(255,255,255,0.06)]'
					: 'border-white/10 bg-white text-black shadow-[0_14px_50px_rgba(59,130,246,0.14)] hover:-translate-y-0.5 hover:bg-white/95 hover:shadow-[0_22px_60px_rgba(59,130,246,0.22)]',
				className,
			)}
			disabled={isDisabled}
			{...props}>
			{!isDisabled ? (
				<span className='pointer-events-none absolute inset-y-0 left-[-25%] w-24 -skew-x-[20deg] bg-white/60 opacity-0 blur-xl transition-all duration-300 group-hover:left-[105%] group-hover:opacity-70' />
			) : null}
			<span className='relative z-10 flex w-full items-center'>
				{loading ? (
					<span className='flex w-full items-center justify-center gap-3'>
						<Loader2 className='h-4 w-4 animate-spin' />
						{loadingLabel || 'Processing...'}
					</span>
				) : (
					<>
						<span className='flex-1 text-center'>{children}</span>
						<span
							className={cn(
								'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-200',
								isDisabled
									? 'bg-black/80 text-white/75'
									: 'bg-black text-white group-hover:translate-x-0.5',
							)}>
							<ArrowRight className='h-3.5 w-3.5' />
						</span>
					</>
				)}
			</span>
		</button>
	)
})

AnalyzePaperButton.displayName = 'AnalyzePaperButton'

export default AnalyzePaperButton
