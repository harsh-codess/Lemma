import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { SignUpPage as SignUpFlowPage } from '@/components/ui/sign-in-flow-1'

export default function SignUpPage() {
	const { userId } = auth()

	if (userId) {
		redirect('/app')
	}

	return <SignUpFlowPage afterAuthUrl='/app' />
}
