import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { SignInPage as SignInFlowPage } from '@/components/ui/sign-in-flow-1'

export default function SignInPage() {
	const { userId } = auth()

	if (userId) {
		redirect('/onboarding')
	}

	return <SignInFlowPage afterAuthUrl='/onboarding' />
}
