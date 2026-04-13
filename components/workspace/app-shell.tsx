'use client'

import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

import { LemmaSidebar } from '@/components/ui/sidebar'

const WorkspaceAppShell = ({ children }: { children: React.ReactNode }) => {
	const pathname = usePathname()
	const isNewProjectRoute = pathname === '/app/projects/new'

	return (
		<div className='min-h-screen bg-[#040405] text-white'>
			{/* Collapsible sidebar — hidden on mobile, hover-to-expand on desktop */}
			<div className='hidden lg:block'>
				<LemmaSidebar />
			</div>

			<div className='flex min-h-screen w-full'>
				{/* Left spacer matching collapsed sidebar width on desktop */}
				<div className='hidden lg:block lg:w-[3.05rem] lg:shrink-0' />

				<div className='flex min-h-screen min-w-0 flex-1 flex-col'>
					<main
						className={
							isNewProjectRoute
								? 'flex-1 overflow-hidden px-4 py-5 sm:px-6 lg:px-8 lg:py-6'
								: 'flex-1 px-4 py-10 sm:px-6 lg:px-8 lg:py-12'
						}>
						<AnimatePresence mode='wait' initial={false}>
							<motion.div
								key={pathname}
								className={isNewProjectRoute ? 'h-full' : undefined}
								initial={{ opacity: 0, y: 6 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -4 }}
								transition={{ duration: 0.18, ease: 'easeOut' }}>
								{children}
							</motion.div>
						</AnimatePresence>
					</main>
				</div>
			</div>
		</div>
	)
}

export default WorkspaceAppShell
