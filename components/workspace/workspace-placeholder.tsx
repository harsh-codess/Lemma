import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

const WorkspacePlaceholder = ({
	eyebrow,
	title,
	description,
	points,
	ctaHref,
	ctaLabel,
	muted = false,
}: {
	eyebrow: string
	title: string
	description: string
	points: string[]
	ctaHref: string
	ctaLabel: string
	muted?: boolean
}) => {
	return (
		<section className='mx-auto max-w-5xl space-y-8'>
			<div className='rounded-[34px] border border-white/8 bg-[radial-gradient(circle_at_top_left,_rgba(231,195,90,0.08),_transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-6 py-10 sm:px-8 lg:px-10'>
				<p className='text-[0.7rem] uppercase tracking-[0.24em] text-[#e7c35a]'>
					{eyebrow}
				</p>
				<h1 className='mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl'>
					{title}
				</h1>
				<p className='mt-5 max-w-3xl text-sm leading-7 text-white/56 sm:text-base'>
					{description}
				</p>

				<div className='mt-8 grid gap-4 md:grid-cols-3'>
					{points.map((point) => (
						<div
							key={point}
							className='rounded-[28px] border border-white/8 bg-black/20 p-5'>
							<p className='text-sm leading-7 text-white/65'>{point}</p>
						</div>
					))}
				</div>

				<div className='mt-8'>
					<Button
						asChild
						className={
							muted
								? 'h-12 rounded-full border border-white/10 bg-white/[0.05] px-5 text-sm font-semibold text-white hover:bg-white/[0.08]'
								: 'h-12 rounded-full bg-white px-5 text-sm font-semibold text-black hover:bg-white/92'
						}>
						<Link href={ctaHref}>
							{ctaLabel}
							<ArrowRight className='ml-2 h-4 w-4' />
						</Link>
					</Button>
				</div>
			</div>
		</section>
	)
}

export default WorkspacePlaceholder
