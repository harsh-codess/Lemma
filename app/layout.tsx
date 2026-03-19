import type { Metadata } from 'next'
import Header from '@/components/header'
import Footer from '@/components/footer'
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
		<html lang='en'>
			<body>
				<Header />
				{children}
				<Footer />
			</body>
		</html>
	)
}
