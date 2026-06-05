import { NextResponse } from 'next/server'

/**
 * Public liveness probe — excluded from the auth middleware. Deliberately
 * touches no dependencies (DB, R2, Inngest) so it answers even when a
 * downstream service is degraded; it reports "the app is up", nothing more.
 */
export async function GET() {
	return NextResponse.json({ status: 'ok' })
}
