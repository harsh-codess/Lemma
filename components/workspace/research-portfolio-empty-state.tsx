import { FileText, Sparkles, Zap } from 'lucide-react'

import { ButtonWithIcon } from '@/components/ui/button-witn-icon'

const ResearchPortfolioEmptyState = () => {
	return (
		<section className='flex min-h-[calc(100dvh-120px)] w-full items-center justify-center bg-transparent px-4 py-10'>
			<div className='w-full max-w-[640px] text-center'>
				<p className='text-[0.7rem] uppercase tracking-[0.26em] text-[#e7c35a]'>
					Projects
				</p>
				<h1 className='mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl'>
					Your research portfolio is empty
				</h1>
				<p className='mx-auto mt-4 max-w-[500px] text-[15px] leading-7 text-white/48'>
					Upload your first paper and Lemma will analyze it, score its commercial
					potential, and generate an investor-ready pitch deck.
				</p>

				<div className='relative mx-auto mt-10 w-full max-w-[430px] rounded-[30px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-6 py-7 shadow-[0_28px_70px_rgba(0,0,0,0.34)]'>
					<div className='pointer-events-none absolute inset-x-10 top-0 h-28 rounded-b-[28px] bg-[linear-gradient(180deg,rgba(208,255,97,0.9),rgba(109,255,122,0.72))] opacity-95 blur-[22px]' />
					<div className='pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_42%)]' />

					<div className='relative mx-auto w-full max-w-[250px]'>
						<div className='rounded-[22px] border border-white/[0.06] bg-[#111214] px-4 py-4 shadow-[0_14px_40px_rgba(0,0,0,0.28)]'>
							<div className='flex items-center justify-between'>
								<div className='flex gap-1.5'>
									<span className='h-1.5 w-1.5 rounded-full bg-white/35' />
									<span className='h-1.5 w-1.5 rounded-full bg-white/18' />
								</div>
								<div className='h-1.5 w-12 rounded-full bg-white/10' />
							</div>

							<div className='mt-5 space-y-3'>
								{[0, 1, 2].map((row) => (
									<div key={row} className='flex items-center gap-3'>
										<div className='flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.05]'>
											{row === 1 ? (
												<FileText className='h-3.5 w-3.5 text-[#e7c35a]' />
											) : (
												<span className='h-2.5 w-2.5 rounded-full bg-white/16' />
											)}
										</div>
										<div className='flex-1'>
											<div className='h-2 rounded-full bg-white/12' />
											<div className='mt-1.5 h-2 w-2/3 rounded-full bg-white/[0.07]' />
										</div>
										<div className='h-5 w-10 rounded-full bg-white/[0.05]' />
									</div>
								))}
							</div>
						</div>

						<div className='relative z-10 mx-auto mt-[-14px] flex h-12 w-12 items-center justify-center rounded-[18px] border border-[#e7c35a]/14 bg-[#1b1912] text-[#e7c35a] shadow-[0_10px_30px_rgba(0,0,0,0.3)]'>
							<div className='relative'>
								<FileText className='h-5 w-5 stroke-[1.7]' />
								<Zap className='absolute -right-1 -top-1 h-3 w-3 fill-[#e7c35a] stroke-[#e7c35a]' />
							</div>
						</div>
					</div>

					<div className='relative mt-5'>
						<p className='text-lg font-semibold tracking-[-0.04em] text-white'>
							Ready for your first paper
						</p>
						<p className='mx-auto mt-2 max-w-[280px] text-sm leading-6 text-white/42'>
							Start building your commercialization portfolio by creating your first project below.
						</p>
					</div>
				</div>

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
