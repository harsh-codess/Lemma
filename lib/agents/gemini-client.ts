import {
	GoogleGenerativeAI,
	GoogleGenerativeAIFetchError,
} from '@google/generative-ai'

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_MAX_ATTEMPTS = 3
const GEMINI_RETRY_DELAYS_MS = [1200, 3000]

/**
 * Returns a configured Gemini model instance.
 * Lazy initialization — reads the API key at call time, not module load time.
 * This ensures dotenv has already loaded .env.local before the key is read.
 */
export function getGeminiModel() {
	const apiKey = process.env.GEMINI_API_KEY
	if (!apiKey) throw new Error('GEMINI_API_KEY is not set')
	const genAI = new GoogleGenerativeAI(apiKey)
	return genAI.getGenerativeModel({
		model: GEMINI_MODEL,
		generationConfig: {
			responseMimeType: 'application/json',
			temperature: 0.3,
		},
	})
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableGeminiError(error: unknown) {
	if (error instanceof GoogleGenerativeAIFetchError) {
		return [429, 500, 502, 503, 504].includes(error.status ?? 0)
	}

	if (error instanceof Error) {
		return error.message.toLowerCase().includes('fetch failed')
	}

	return false
}

function formatGeminiError(error: unknown) {
	if (error instanceof GoogleGenerativeAIFetchError) {
		const detailText =
			error.errorDetails && error.errorDetails.length > 0
				? ` Details: ${JSON.stringify(error.errorDetails)}`
				: ''
		return `Gemini API error (${error.status ?? 'unknown'} ${error.statusText ?? 'Unknown'}): ${error.message}${detailText}`
	}

	if (error instanceof Error) {
		return `Gemini request failed: ${error.message}`
	}

	return 'Gemini request failed with an unknown error.'
}

async function generateContentWithRetry(
	...args: Parameters<ReturnType<typeof getGeminiModel>['generateContent']>
) {
	let lastError: unknown

	for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt += 1) {
		try {
			return await getGeminiModel().generateContent(...args)
		} catch (error) {
			lastError = error
			const shouldRetry =
				isRetryableGeminiError(error) && attempt < GEMINI_MAX_ATTEMPTS

			if (!shouldRetry) {
				throw new Error(formatGeminiError(error), { cause: error })
			}

			await sleep(
				GEMINI_RETRY_DELAYS_MS[attempt - 1] ??
					GEMINI_RETRY_DELAYS_MS[GEMINI_RETRY_DELAYS_MS.length - 1],
			)
		}
	}

	throw new Error(
		`Gemini request failed after ${GEMINI_MAX_ATTEMPTS} attempts. ${formatGeminiError(lastError)}`,
		{ cause: lastError instanceof Error ? lastError : undefined },
	)
}

/**
 * Backwards-compatible export — agents that call gemini.generateContent()
 * should switch to getGeminiModel().generateContent() but this proxy works too.
 */
export const gemini = {
	generateContent: (...args: Parameters<ReturnType<typeof getGeminiModel>['generateContent']>) =>
		generateContentWithRetry(...args),
}
