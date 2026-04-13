import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

import WorkspaceAppShell from '@/components/workspace/app-shell'
import { prisma } from '@/lib/prisma'

export default async function AppLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const { userId, redirectToSignIn } = await auth()

	if (!userId) {
		return redirectToSignIn()
	}

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { onboardingCompleted: true },
	})

	if (!user?.onboardingCompleted) {
		redirect('/onboarding')
	}

	return <WorkspaceAppShell>{children}</WorkspaceAppShell>
}
