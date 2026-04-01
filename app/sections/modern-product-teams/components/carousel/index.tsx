'use client'

import { type FC, useMemo, useState } from 'react'
import styles from './styles.module.css'
import CarouselCard from '../carousel-card'
import { modernProductCards } from '@/lib/constant'
import Image from 'next/image'
import Link from 'next/link'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

const Carousel: FC = () => {
	const [activeCardId, setActiveCardId] = useState<string | null>(null)

	const activeCard = useMemo(
		() => modernProductCards.find((card) => card.id === activeCardId) ?? null,
		[activeCardId]
	)

	return (
		<>
			<div>
				<div className={styles.carousel__container}>
					<div className={styles.carousel__inner__container}>
						{modernProductCards.map((card) => (
							<CarouselCard
								key={card.id}
								{...card}
								onOpen={() => setActiveCardId(card.id)}
							/>
						))}
					</div>
				</div>
			</div>

			<Dialog
				open={activeCardId !== null}
				onOpenChange={(open) => {
					if (!open) {
						setActiveCardId(null)
					}
				}}>
				<DialogContent className='max-h-[calc(100dvh-1rem)] max-w-5xl overflow-y-auto overflow-x-hidden border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)] p-0 text-[var(--color-text-primary)] shadow-[var(--shadow-high)] sm:max-h-[calc(100dvh-2rem)] sm:rounded-[28px]'>
					{activeCard && (
						<div className='grid gap-0 md:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]'>
							<div className='relative min-h-[220px] overflow-hidden border-b border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] sm:min-h-[300px] md:min-h-[560px] md:border-b-0 md:border-r'>
								<Image
									src={activeCard.img}
									alt={activeCard.title}
									fill
									className='object-cover opacity-[0.85]'
									sizes='(max-width: 768px) 100vw, 50vw'
								/>
								<div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.64))]' />
								<div className='absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4 sm:gap-4 sm:p-6 md:p-8'>
									<span className='w-fit rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-quaternary)] backdrop-blur-sm'>
										{activeCard.eyebrow}
									</span>
									<div className='rounded-[20px] border border-white/10 bg-black/35 p-4 backdrop-blur-md sm:rounded-[24px] sm:p-5'>
										<p className='text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-quaternary)]'>
											Why it matters
										</p>
										<p className='mt-2 text-[15px] font-medium leading-[1.45] text-[var(--color-text-primary)] sm:mt-3 sm:text-[17px] sm:leading-[1.5]'>
											{activeCard.detailHeading}
										</p>
									</div>
								</div>
							</div>

							<div className='flex flex-col justify-between gap-6 p-4 sm:p-6 md:gap-8 md:p-8'>
								<div className='space-y-6 md:space-y-8'>
									<DialogHeader className='space-y-4 text-left'>
										<DialogTitle className='pr-8 text-[24px] font-medium leading-[1.04] tracking-[-0.03em] text-[var(--color-text-primary)] sm:text-[28px] md:text-[32px]'>
											{activeCard.title}
										</DialogTitle>
										<DialogDescription className='text-[15px] font-medium leading-[1.6] text-[var(--color-text-tertiary)] sm:text-[16px] md:text-[17px]'>
											{activeCard.description}
										</DialogDescription>
									</DialogHeader>

									<p className='text-[14px] leading-[1.7] text-[var(--color-text-secondary)] sm:text-[15px] sm:leading-[1.75]'>
										{activeCard.detailBody}
									</p>

									<div className='space-y-3'>
										<p className='text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-quaternary)]'>
											Key outcomes
										</p>
										<div className='space-y-3'>
											{activeCard.highlights.map((highlight) => (
												<div
													key={highlight}
													className='flex items-start gap-3 rounded-[18px] border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] px-4 py-3'>
													<span className='mt-[7px] h-2 w-2 flex-shrink-0 rounded-full bg-white/70' />
													<p className='text-[14px] leading-[1.6] text-[var(--color-text-secondary)]'>
														{highlight}
													</p>
												</div>
											))}
										</div>
									</div>
								</div>

								<div className='flex flex-col gap-3 sm:flex-row'>
									<Link
										href='/app'
										className='inline-flex h-11 items-center justify-center rounded-[12px] bg-[#e6e6e6] px-4 text-[15px] font-medium text-[var(--color-bg-primary)] shadow-[var(--shadow-stack-low)] transition-colors hover:bg-white'>
										Analyze my paper
									</Link>
									<Link
										href='/method'
										className='inline-flex h-11 items-center justify-center rounded-[12px] bg-[var(--color-bg-quaternary)] px-4 text-[15px] font-medium text-[var(--color-text-primary)] transition-colors hover:brightness-110'>
										View method
									</Link>
								</div>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	)
}

export default Carousel
