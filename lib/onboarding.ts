import { currentUser } from '@clerk/nextjs/server'

import { prisma } from '@/lib/prisma'
import { getOnboardingDestination } from '@/lib/onboarding-config'

export async function getOnboardingState(userId: string) {
	const [dbUser, clerkUser] = await Promise.all([
		prisma.user.findUnique({
			where: { id: userId },
			select: {
				name: true,
				email: true,
				role: true,
				primaryGoal: true,
				labName: true,
				researchFocus: true,
				onboardingCompleted: true,
				institution: { select: { name: true } },
			},
		}),
		currentUser(),
	])

	const displayName =
		dbUser?.name ??
		clerkUser?.fullName ??
		clerkUser?.firstName ??
		clerkUser?.emailAddresses?.[0]?.emailAddress ??
		'there'

	const email =
		dbUser?.email ??
		clerkUser?.emailAddresses?.[0]?.emailAddress ??
		''

	return {
		displayName,
		email,
		role: dbUser?.role ?? 'RESEARCHER',
		primaryGoal: dbUser?.primaryGoal ?? null,
		institution: dbUser?.institution?.name ?? '',
		labName: dbUser?.labName ?? '',
		researchFocus: dbUser?.researchFocus ?? '',
		onboardingCompleted: dbUser?.onboardingCompleted ?? false,
		nextRoute: getOnboardingDestination(dbUser?.primaryGoal ?? null),
	}
}
