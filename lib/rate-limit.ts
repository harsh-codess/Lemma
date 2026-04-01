import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * ─── Rate Limiting ───────────────────────────────────────────────────────────
 *
 * Prevents a single user from burning the entire Gemini API quota.
 *
 * Limits:
 *   - analyze:  5 analyses per user per hour (each costs ~$0.01 in Gemini tokens)
 *   - upload:   20 uploads per user per hour
 *   - api:      100 general API calls per user per minute
 *
 * Uses Upstash Redis (serverless, works on Vercel edge).
 * Free tier: 10,000 commands/day — more than enough.
 */

// Only initialize if credentials are present (allows local dev without Redis)
const redis = process.env.UPSTASH_REDIS_REST_URL
	? new Redis({
			url: process.env.UPSTASH_REDIS_REST_URL,
			token: process.env.UPSTASH_REDIS_REST_TOKEN!,
		})
	: null

/**
 * Rate limiter for AI analysis — the expensive operation.
 * 5 analyses per user per hour.
 */
export const analyzeRateLimiter = redis
	? new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(5, '1 h'),
			prefix: 'lemma:ratelimit:analyze',
			analytics: true,
		})
	: null

/**
 * Rate limiter for file uploads.
 * 20 uploads per user per hour.
 */
export const uploadRateLimiter = redis
	? new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(20, '1 h'),
			prefix: 'lemma:ratelimit:upload',
			analytics: true,
		})
	: null

/**
 * General API rate limiter.
 * 100 requests per user per minute.
 */
export const apiRateLimiter = redis
	? new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(100, '1 m'),
			prefix: 'lemma:ratelimit:api',
			analytics: true,
		})
	: null

/**
 * Check rate limit for a given identifier (usually userId).
 * Returns { allowed: boolean, remaining: number, resetAt: Date }
 *
 * If Redis is not configured (local dev), always allows.
 */
export async function checkRateLimit(
	limiter: Ratelimit | null,
	identifier: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
	if (!limiter) {
		// No Redis configured — allow everything (local dev)
		return { allowed: true, remaining: 999, resetAt: new Date() }
	}

	const result = await limiter.limit(identifier)
	return {
		allowed: result.success,
		remaining: result.remaining,
		resetAt: new Date(result.reset),
	}
}
