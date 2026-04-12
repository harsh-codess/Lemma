import { FileText, Sparkles, Zap } from 'lucide-react'

import { ButtonWithIcon } from '@/components/ui/button-witn-icon'

const ResearchPortfolioEmptyState = () => {
	return (
		<section className='flex min-h-[calc(100dvh-120px)] w-full items-center justify-center bg-transparent px-4 py-10'>
			<div className='flex w-full max-w-[620px] flex-col items-center rounded-[32px] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))] px-6 py-14 text-center sm:px-10'>
				<div className='relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e7c35a]/10 text-[#e7c35a]'>
					<FileText className='h-7 w-7 stroke-[1.5]' />
					<Zap className='absolute right-3 top-3 h-3.5 w-3.5 fill-[#e7c35a] stroke-[#e7c35a]' />
				</div>

				

				<h1 className='mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl'>
					Your research portfolio is empty
				</h1>

				<p className='mt-4 max-w-[460px] text-[15px] leading-7 text-white/52'>
					Upload your first paper and Lemma will analyze it, score its commercial
					potential, and generate an investor-ready pitch deck.
				</p>

				<div className='mt-8 flex items-center justify-center'>
					<ButtonWithIcon
						href='/app/projects/new'
						className='bg-white text-black hover:bg-white/92'
						iconClassName='bg-[#040405] text-white'>
						Create your first project
					</ButtonWithIcon>
				</div>

				<div className='mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[12px] text-white/28'>
					<span>TRL &amp; IRL scoring</span>
					<span className='h-3 w-px bg-white/10' aria-hidden='true' />
					<span>Market intelligence</span>
					<span className='h-3 w-px bg-white/10' aria-hidden='true' />
					<span>Investor pitch deck</span>
				</div>
			</div>
		</section>
	)
}

export default ResearchPortfolioEmptyState
