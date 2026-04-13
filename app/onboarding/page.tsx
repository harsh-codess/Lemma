import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

import LemmaOnboardingFlow from '@/components/onboarding/lemma-onboarding-flow'
import { getOnboardingState } from '@/lib/onboarding'

export default async function OnboardingPage() {
	const { userId, redirectToSignIn } = await auth()

	if (!userId) {
		return redirectToSignIn()
	}

	const state = await getOnboardingState(userId)

	if (state.onboardingCompleted) {
		redirect('/app')
	}

	return <LemmaOnboardingFlow initialState={state} />
}
