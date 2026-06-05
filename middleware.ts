import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

/**
 * Auth gate. `clerkMiddleware()` alone protects NOTHING — it only makes auth
 * available — so protected paths are matched explicitly here:
 *
 *   Pages:  /app/*, /projects/*, /onboarding/*  → redirect to sign-in
 *   APIs:   /api/* EXCEPT /api/health (public liveness probe) and
 *           /api/inngest (webhook — authenticated by Inngest signature,
 *           INNGEST_SIGNING_KEY, not by a user session) → 401 JSON
 *
 * Server components (app/app/layout.tsx, app/onboarding/page.tsx) and every
 * API route re-check auth() themselves — middleware is the first gate, not
 * the only one.
 */

const isProtectedApi = createRouteMatcher(['/api/((?!inngest|health).*)'])
const isProtectedPage = createRouteMatcher([
	'/app(.*)',
	'/projects(.*)',
	'/onboarding(.*)',
])

export default clerkMiddleware((auth, req) => {
	const { userId, redirectToSignIn } = auth()
	if (userId) return

	if (isProtectedApi(req)) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}
	if (isProtectedPage(req)) {
		return redirectToSignIn({ returnBackUrl: req.url })
	}
})

export const config = {
	matcher: [
		'/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
		'/(api|trpc)(.*)',
	],
}
