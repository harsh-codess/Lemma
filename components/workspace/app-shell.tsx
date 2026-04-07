'use client'

import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { ArrowRight, Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { LemmaSidebar } from '@/components/ui/sidebar'

const WorkspaceAppShell = ({ children }: { children: React.ReactNode }) => {
	const pathname = usePathname()
	const pageTitle =
		pathname === '/app'
			? 'Projects'
			: pathname === '/app/projects/new'
				? 'New project'
				: pathname.startsWith('/app/projects/')
					? 'Workspace'
					: 'App'

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
					<header className='sticky top-0 z-30 bg-[#040405]/92 backdrop-blur-2xl'>
						<div className='flex items-center gap-3 px-4 py-4 sm:px-6 lg:px-8'>
							{/* Mobile menu trigger */}
							<Dialog>
								<DialogTrigger asChild>
									<Button
										type='button'
										variant='outline'
										size='icon'
										className='h-11 w-11 rounded-2xl bg-white/[0.05] text-white hover:bg-white/[0.08] lg:hidden'>
										<Menu className='h-5 w-5' />
										<span className='sr-only'>Open workspace menu</span>
									</Button>
								</DialogTrigger>
								<DialogContent className='!left-0 !top-0 !h-dvh !max-h-dvh !w-[min(320px,90vw)] !max-w-none !translate-x-0 !translate-y-0 rounded-none bg-[#050608] p-0 text-white'>
									<DialogHeader className='sr-only'>
										<DialogTitle>Workspace navigation</DialogTitle>
										<DialogDescription>
											Move between projects, project creation, and the active workspace.
										</DialogDescription>
									</DialogHeader>
									<div className='h-full p-3'>
										<LemmaSidebar />
									</div>
								</DialogContent>
							</Dialog>

							<div className='min-w-0 flex-1 overflow-hidden'>
								<div className='min-w-0'>
									<p className='text-xs uppercase tracking-[0.22em] text-white/34'>
										Lemma workspace
									</p>
									<h1 className='mt-1 truncate text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl'>
										{pageTitle}
									</h1>
								</div>
							</div>

							<Button
								asChild
								className='h-11 rounded-full bg-white px-5 text-sm font-semibold text-black hover:bg-white/90'>
								<Link href='/app/projects/new'>
									New project
									<ArrowRight className='ml-2 h-4 w-4' />
								</Link>
							</Button>

							<div className='flex h-11 items-center rounded-full bg-white/[0.05] px-1.5'>
								<UserButton
									afterSignOutUrl='/'
									appearance={{
										elements: {
											userButtonAvatarBox: 'h-8 w-8',
											userButtonPopoverCard:
												'bg-[#111214] text-white shadow-2xl',
											userButtonPopoverActionButton:
												'text-white hover:bg-white/8',
										},
									}}
								/>
							</div>
						</div>
					</header>

					<main className='flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
						{children}
					</main>
				</div>
			</div>
		</div>
	)
}

export default WorkspaceAppShell
