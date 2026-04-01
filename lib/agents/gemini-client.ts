import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

/**
 * Shared Gemini model instance.
 * Each agent uses this to make its own focused call.
 * Using gemini-1.5-flash for speed + cost. It natively reads PDFs.
 */
export const gemini = genAI.getGenerativeModel({
	model: 'gemini-1.5-flash',
	generationConfig: {
		responseMimeType: 'application/json',
		temperature: 0.3, // Low temperature for deterministic, structured output
	},
})
