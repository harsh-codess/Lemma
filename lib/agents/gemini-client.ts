import { GoogleGenerativeAI } from '@google/generative-ai'

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
		model: 'gemini-2.5-flash',
		generationConfig: {
			responseMimeType: 'application/json',
			temperature: 0.3,
		},
	})
}

/**
 * Backwards-compatible export — agents that call gemini.generateContent()
 * should switch to getGeminiModel().generateContent() but this proxy works too.
 */
export const gemini = {
	generateContent: (...args: Parameters<ReturnType<typeof getGeminiModel>['generateContent']>) =>
		getGeminiModel().generateContent(...args),
}
