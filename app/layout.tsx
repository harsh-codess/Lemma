import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import SiteShell from '@/components/site-shell'
import './globals.css'

export const metadata: Metadata = {
	title: 'Lemma — Turn Research Papers into Investor-Ready Pitch Decks',
	description: 'Lemma is an AI SaaS that turns research papers into investor-ready pitch decks. Five AI agents analyze your paper, score its commercial potential, and generate a complete pitch deck — in minutes.',
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<ClerkProvider>
			<html lang='en'>
				<body>
					<SiteShell>{children}</SiteShell>
				</body>
			</html>
		</ClerkProvider>
	)
}
