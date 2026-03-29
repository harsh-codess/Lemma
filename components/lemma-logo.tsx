import { cn } from '@/lib/utils'

type LemmaLogoProps = {
	className?: string
	iconClassName?: string
	wordmarkClassName?: string
	showWordmark?: boolean
}

const LemmaLogo = ({
	className,
	iconClassName,
	wordmarkClassName,
	showWordmark = true,
}: LemmaLogoProps) => {
	return (
		<span className={cn('inline-flex items-center gap-3', className)}>
			<span
				className={cn(
					'inline-flex h-11 w-11 items-center justify-center rounded-[12px] bg-white text-black shadow-[var(--shadow-stack-low)]',
					iconClassName,
				)}>
				<svg
					width='24'
					height='24'
					viewBox='0 0 28 28'
					fill='none'
					xmlns='http://www.w3.org/2000/svg'
					aria-hidden='true'>
					<rect width='28' height='28' rx='7' fill='white' />
					<path
						d='M7 8 L11 8 L21 21'
						stroke='#0a0a0a'
						strokeWidth='2.2'
						strokeLinecap='round'
						strokeLinejoin='round'
						fill='none'
					/>
					<path
						d='M15 14 L9 21'
						stroke='#0a0a0a'
						strokeWidth='2.2'
						strokeLinecap='round'
						fill='none'
					/>
				</svg>
			</span>

			{showWordmark ? (
				<span
					className={cn(
						'text-[16px] font-bold tracking-[-0.3px] text-white',
						wordmarkClassName,
					)}>
					Lemma
				</span>
			) : null}
		</span>
	)
}

export default LemmaLogo
