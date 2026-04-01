import { auth } from '@clerk/nextjs/server'

import WorkspaceAppShell from '@/components/workspace/app-shell'

export default function AppLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const { userId, redirectToSignIn } = auth()

	if (!userId) {
		return redirectToSignIn()
	}

	return <WorkspaceAppShell>{children}</WorkspaceAppShell>
}
