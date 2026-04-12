'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import {
	User,
	Building2,
	Shield,
	LogOut,
	ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
	const { user, isLoaded } = useUser()
	const { signOut, openUserProfile } = useClerk()

	const displayName = user?.fullName ?? 'User'
	const displayEmail = user?.emailAddresses?.[0]?.emailAddress ?? ''
	const initials =
		user?.firstName?.[0]?.toUpperCase() ??
		displayEmail[0]?.toUpperCase() ??
		'U'

	return (
		<section className='mx-auto max-w-2xl space-y-8'>
			{/* Header */}
			<div>
				<p className='text-[0.7rem] uppercase tracking-[0.24em] text-[#e7c35a]'>
					Settings
				</p>
				<h1 className='mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl'>
					Account & preferences
				</h1>
				<p className='mt-3 max-w-lg text-sm leading-7 text-white/50'>
					Manage your profile, organization settings, and Lemma workspace preferences.
				</p>
			</div>

			{/* Profile card */}
			<div className='overflow-hidden rounded-[22px] border border-white/[0.04] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))]'>
				<div className='border-b border-white/[0.04] px-6 py-4'>
					<h2 className='flex items-center gap-2 text-sm font-semibold text-white'>
						<User className='h-4 w-4 text-white/40' />
						Profile
					</h2>
				</div>
				<div className='p-6'>
					{isLoaded ? (
						<div className='flex items-center gap-4'>
							<div className='flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#e7c35a]/10 text-lg font-semibold text-[#e7c35a]'>
								{initials}
							</div>
							<div className='min-w-0 flex-1'>
								<p className='text-base font-semibold text-white'>
									{displayName}
								</p>
								<p className='mt-0.5 text-sm text-white/40'>{displayEmail}</p>
							</div>
							<Button
								type='button'
								variant='outline'
								size='sm'
								onClick={() => openUserProfile()}
								className='h-9 rounded-full border-white/[0.08] bg-white/[0.04] px-4 text-xs text-white/60 hover:bg-white/[0.07] hover:text-white'>
								Edit profile
								<ExternalLink className='ml-2 h-3.5 w-3.5' />
							</Button>
						</div>
					) : (
						<div className='h-14 animate-pulse rounded-2xl bg-white/[0.04]' />
					)}
				</div>
			</div>

			{/* Organization */}
			<div className='overflow-hidden rounded-[22px] border border-white/[0.04] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))]'>
				<div className='border-b border-white/[0.04] px-6 py-4'>
					<h2 className='flex items-center gap-2 text-sm font-semibold text-white'>
						<Building2 className='h-4 w-4 text-white/40' />
						Organization
					</h2>
				</div>
				<div className='p-6'>
					<p className='text-sm text-white/45'>
						Your institution and team settings are determined by your account. Contact your TTO administrator to update organization-level preferences.
					</p>
				</div>
			</div>

			{/* Security */}
			<div className='overflow-hidden rounded-[22px] border border-white/[0.04] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))]'>
				<div className='border-b border-white/[0.04] px-6 py-4'>
					<h2 className='flex items-center gap-2 text-sm font-semibold text-white'>
						<Shield className='h-4 w-4 text-white/40' />
						Security
					</h2>
				</div>
				<div className='space-y-4 p-6'>
					<div className='flex items-center justify-between'>
						<div>
							<p className='text-sm font-medium text-white'>Password & 2FA</p>
							<p className='mt-0.5 text-xs text-white/35'>
								Managed through your Clerk authentication provider.
							</p>
						</div>
						<Button
							type='button'
							variant='outline'
							size='sm'
							onClick={() => openUserProfile()}
							className='h-9 rounded-full border-white/[0.08] bg-white/[0.04] px-4 text-xs text-white/60 hover:bg-white/[0.07] hover:text-white'>
							Manage
							<ExternalLink className='ml-2 h-3.5 w-3.5' />
						</Button>
					</div>
				</div>
			</div>

			{/* Sign out */}
			<div className='pb-8'>
				<Button
					type='button'
					variant='outline'
					onClick={() => signOut({ redirectUrl: '/' })}
					className='h-11 rounded-full border-red-500/20 bg-red-500/5 px-5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300'>
					<LogOut className='mr-2 h-4 w-4' />
					Sign out
				</Button>
			</div>
		</section>
	)
}
