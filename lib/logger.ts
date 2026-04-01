/**
 * ─── Structured Logger ───────────────────────────────────────────────────────
 *
 * Every log line is a JSON object with consistent structure.
 * In production this feeds into Vercel Logs / Datadog / whatever.
 * In dev it prints readable output to the console.
 *
 * Why not console.log? Because when Agent 3 hallucinates a $50B TAM at 3am
 * on a Saturday, you need to search logs by projectId + agentName + level
 * and find exactly what happened in under 30 seconds.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogContext {
	projectId?: string
	agent?: string
	agentNumber?: number
	stage?: string
	durationMs?: number
	[key: string]: unknown
}

function log(level: LogLevel, message: string, context: LogContext = {}) {
	const entry = {
		timestamp: new Date().toISOString(),
		level,
		message,
		service: 'lemma',
		...context,
	}

	if (process.env.NODE_ENV === 'production') {
		// In production: structured JSON, one line per log (Vercel, Datadog, etc.)
		console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
			JSON.stringify(entry)
		)
	} else {
		// In dev: readable format
		const prefix = {
			info: '🟢',
			warn: '🟡',
			error: '🔴',
			debug: '🔵',
		}[level]

		const agentLabel = context.agent ? ` [${context.agent}]` : ''
		const projectLabel = context.projectId ? ` (${context.projectId.slice(0, 8)}...)` : ''
		const duration = context.durationMs ? ` ${context.durationMs}ms` : ''

		console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
			`${prefix}${agentLabel}${projectLabel} ${message}${duration}`
		)

		if (level === 'error' && context.error) {
			console.error(context.error)
		}
	}
}

/**
 * Creates a scoped logger for a specific agent run.
 * All logs from this logger automatically include projectId and agent context.
 */
export function createAgentLogger(agentName: string, agentNumber: number, projectId: string) {
	const ctx: LogContext = { agent: agentName, agentNumber, projectId }

	return {
		info: (message: string, extra?: LogContext) => log('info', message, { ...ctx, ...extra }),
		warn: (message: string, extra?: LogContext) => log('warn', message, { ...ctx, ...extra }),
		error: (message: string, extra?: LogContext) => log('error', message, { ...ctx, ...extra }),
		debug: (message: string, extra?: LogContext) => log('debug', message, { ...ctx, ...extra }),

		/** Log the start of an agent run */
		start: () => log('info', `Agent ${agentNumber} starting: ${agentName}`, ctx),

		/** Log the completion of an agent run with duration */
		complete: (durationMs: number) =>
			log('info', `Agent ${agentNumber} complete: ${agentName}`, { ...ctx, durationMs }),

		/** Log a validation failure */
		validationFailed: (errors: unknown) =>
			log('error', `Agent ${agentNumber} output validation failed`, {
				...ctx,
				validationErrors: errors,
			}),

		/** Log a retry */
		retry: (attempt: number, error: string) =>
			log('warn', `Agent ${agentNumber} retrying (attempt ${attempt})`, {
				...ctx,
				attempt,
				error,
			}),
	}
}

/**
 * Creates a scoped logger for API routes.
 */
export function createRouteLogger(route: string) {
	return {
		info: (message: string, extra?: LogContext) => log('info', message, { route, ...extra }),
		warn: (message: string, extra?: LogContext) => log('warn', message, { route, ...extra }),
		error: (message: string, extra?: LogContext) => log('error', message, { route, ...extra }),
	}
}

export const logger = {
	info: (message: string, context?: LogContext) => log('info', message, context),
	warn: (message: string, context?: LogContext) => log('warn', message, context),
	error: (message: string, context?: LogContext) => log('error', message, context),
	debug: (message: string, context?: LogContext) => log('debug', message, context),
}
