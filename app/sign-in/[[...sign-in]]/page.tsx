import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'

export default function SignInPage() {
	return (
		<div
			style={{
				minHeight: '100vh',
				backgroundColor: '#09090b',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				padding: '24px',
				position: 'relative',
				overflow: 'hidden',
				fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
			}}>
			{/* Radial glow — matches hero section */}
			<div
				style={{
					position: 'fixed',
					inset: 0,
					background:
						'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(160,160,160,0.12) 0%, transparent 70%)',
					pointerEvents: 'none',
				}}
			/>
			{/* Subtle grid noise */}
			<div
				style={{
					position: 'fixed',
					inset: 0,
					backgroundImage:
						'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
					backgroundSize: '64px 64px',
					pointerEvents: 'none',
					maskImage:
						'radial-gradient(ellipse 80% 60% at 50% 50%, black 0%, transparent 100%)',
				}}
			/>

			{/* Logo */}
			<Link
				href='/'
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '10px',
					textDecoration: 'none',
					marginBottom: '36px',
					zIndex: 1,
				}}>
				<svg
					width='28'
					height='28'
					viewBox='0 0 28 28'
					fill='none'
					xmlns='http://www.w3.org/2000/svg'>
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
				<span
					style={{
						fontWeight: 700,
						fontSize: '18px',
						color: 'white',
						letterSpacing: '-0.3px',
					}}>
					Lemma
				</span>
			</Link>

			{/* Clerk card */}
			<div style={{ zIndex: 1, width: '100%', maxWidth: '420px' }}>
				<SignIn
					appearance={{
						variables: {
							colorPrimary: '#ffffff',
							colorBackground: '#111113',
							colorText: '#ffffff',
							colorTextSecondary: '#a1a1aa',
							colorInputBackground: '#18181b',
							colorInputText: '#ffffff',
							colorNeutral: '#52525b',
							borderRadius: '12px',
							fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
							fontSize: '14px',
						},
						elements: {
							card: {
								backgroundColor: '#111113',
								border: '1px solid rgba(255,255,255,0.08)',
								boxShadow:
									'0 0 0 1px rgba(255,255,255,0.04), 0 24px 48px -12px rgba(0,0,0,0.8)',
								borderRadius: '16px',
								padding: '32px',
							},
							headerTitle: {
								color: '#ffffff',
								fontSize: '20px',
								fontWeight: '600',
								letterSpacing: '-0.3px',
							},
							headerSubtitle: {
								color: '#71717a',
								fontSize: '14px',
							},
							socialButtonsBlockButton: {
								backgroundColor: '#18181b',
								border: '1px solid rgba(255,255,255,0.10)',
								color: '#ffffff',
								borderRadius: '10px',
							},
							socialButtonsBlockButtonText: {
								color: '#d4d4d8',
								fontWeight: '500',
							},
							dividerLine: {
								backgroundColor: 'rgba(255,255,255,0.08)',
							},
							dividerText: {
								color: '#52525b',
							},
							formFieldLabel: {
								color: '#a1a1aa',
								fontSize: '13px',
								fontWeight: '500',
							},
							formFieldInput: {
								backgroundColor: '#18181b',
								borderColor: 'rgba(255,255,255,0.10)',
								color: '#ffffff',
								borderRadius: '10px',
							},
							formButtonPrimary: {
								backgroundColor: '#ffffff',
								color: '#09090b',
								fontWeight: '600',
								borderRadius: '10px',
								fontSize: '14px',
							},
							footerActionLink: {
								color: '#a1a1aa',
							},
							footerActionText: {
								color: '#52525b',
							},
							identityPreviewText: {
								color: '#a1a1aa',
							},
							alternativeMethodsBlockButton: {
								backgroundColor: '#18181b',
								border: '1px solid rgba(255,255,255,0.08)',
								color: '#d4d4d8',
								borderRadius: '10px',
							},
						},
					}}
				/>
			</div>

			{/* Footer */}
			<p
				style={{
					marginTop: '32px',
					color: '#3f3f46',
					fontSize: '12px',
					zIndex: 1,
				}}>
				© 2025 Lemma. All rights reserved.
			</p>
		</div>
	)
}
