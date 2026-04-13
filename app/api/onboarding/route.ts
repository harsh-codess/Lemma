import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { OnboardingGoal, UserRole } from '@prisma/client'
import { z } from 'zod'

import {
	getOnboardingDestination,
	ONBOARDING_GOALS,
	ONBOARDING_ROLES,
	RESEARCH_FOCUS_OPTIONS,
} from '@/lib/onboarding-config'
import { getOnboardingState } from '@/lib/onboarding'
import { prisma } from '@/lib/prisma'

const onboardingSchema = z.object({
	primaryGoal: z.enum(ONBOARDING_GOALS),
	role: z.enum(ONBOARDING_ROLES),
	institution: z.string().trim().min(2, 'Institution is required'),
	labName: z.string().trim().max(120).optional().or(z.literal('')),
	researchFocus: z
		.enum(RESEARCH_FOCUS_OPTIONS)
		.or(z.string().trim().min(2, 'Research focus is required')),
})

export async function GET() {
	const { userId } = await auth()
	if (!userId) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const state = await getOnboardingState(userId)
	return NextResponse.json(state)
}

export async function POST(request: Request) {
	const { userId } = await auth()
	if (!userId) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const body = await request.json()
	const parsed = onboardingSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(
			{ error: parsed.error.flatten() },
			{ status: 400 },
		)
	}

	const { primaryGoal, role, institution, labName, researchFocus } = parsed.data
	const clerkUser = await currentUser()
	const realEmail =
		clerkUser?.emailAddresses?.[0]?.emailAddress ?? `${userId}@unknown`
	const realName = clerkUser?.firstName
		? `${clerkUser.firstName}${clerkUser.lastName ? ` ${clerkUser.lastName}` : ''}`
		: clerkUser?.fullName ?? null

	const institutionRecord = await prisma.institution.upsert({
		where: { name: institution },
		update: {},
		create: { name: institution },
	})

	await prisma.user.upsert({
		where: { id: userId },
		update: {
			email: realEmail,
			...(realName ? { name: realName } : {}),
			role: role as UserRole,
			primaryGoal: primaryGoal as OnboardingGoal,
			labName: labName || null,
			researchFocus,
			institutionId: institutionRecord.id,
			onboardingCompleted: true,
			onboardingCompletedAt: new Date(),
		},
		create: {
			id: userId,
			email: realEmail,
			name: realName,
			role: role as UserRole,
			primaryGoal: primaryGoal as OnboardingGoal,
			labName: labName || null,
			researchFocus,
			institutionId: institutionRecord.id,
			onboardingCompleted: true,
			onboardingCompletedAt: new Date(),
		},
	})

	return NextResponse.json({
		ok: true,
		nextRoute: getOnboardingDestination(primaryGoal),
	})
}
