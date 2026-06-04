/**
 * ─── Search Client ───────────────────────────────────────────────────────────
 *
 * Swappable web-search wrapper for retrieval stages (currently Tavily).
 * Agents depend only on the SearchClient interface and getSearchClient() —
 * to swap providers, implement SearchClient and change the factory below.
 *
 * The API key is read lazily from process.env.TAVILY_API_KEY at call time
 * (same convention as gemini-client.ts), never at module load.
 */

export interface SearchHit {
	title: string
	url: string
	snippet: string
	publishedDate: string | null
}

export interface SearchOptions {
	maxResults?: number
	/** Tavily topic — 'news' surfaces dated articles (funding rounds etc.) */
	topic?: 'general' | 'news'
}

export interface SearchClient {
	search(query: string, options?: SearchOptions): Promise<SearchHit[]>
}

const TAVILY_API_URL = 'https://api.tavily.com/search'
const TAVILY_MAX_ATTEMPTS = 2
const TAVILY_RETRY_DELAY_MS = 1500
const DEFAULT_MAX_RESULTS = 5
const MAX_SNIPPET_LENGTH = 600

class TavilySearchClient implements SearchClient {
	async search(query: string, options?: SearchOptions): Promise<SearchHit[]> {
		const apiKey = process.env.TAVILY_API_KEY
		if (!apiKey) throw new Error('TAVILY_API_KEY is not set')

		let lastError: unknown

		for (let attempt = 1; attempt <= TAVILY_MAX_ATTEMPTS; attempt += 1) {
			try {
				const response = await fetch(TAVILY_API_URL, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${apiKey}`,
					},
					body: JSON.stringify({
						query,
						max_results: options?.maxResults ?? DEFAULT_MAX_RESULTS,
						topic: options?.topic ?? 'general',
						search_depth: 'basic',
						include_answer: false,
						include_raw_content: false,
					}),
				})

				if (!response.ok) {
					const body = await response.text().catch(() => '')
					const retryable = [429, 500, 502, 503, 504].includes(response.status)
					const error = new Error(
						`Tavily API error (${response.status} ${response.statusText}): ${body.slice(0, 300)}`
					)
					if (retryable && attempt < TAVILY_MAX_ATTEMPTS) {
						lastError = error
						await new Promise((resolve) => setTimeout(resolve, TAVILY_RETRY_DELAY_MS))
						continue
					}
					throw error
				}

				const data = (await response.json()) as {
					results?: Array<{
						title?: string
						url?: string
						content?: string
						published_date?: string
					}>
				}

				return (data.results ?? [])
					.filter((r) => r.url && r.title)
					.map((r) => ({
						title: r.title!,
						url: r.url!,
						snippet: (r.content ?? '').slice(0, MAX_SNIPPET_LENGTH),
						publishedDate: r.published_date ?? null,
					}))
			} catch (error) {
				lastError = error
				if (attempt >= TAVILY_MAX_ATTEMPTS) break
				await new Promise((resolve) => setTimeout(resolve, TAVILY_RETRY_DELAY_MS))
			}
		}

		throw lastError instanceof Error
			? lastError
			: new Error('Tavily search failed with an unknown error')
	}
}

let _client: SearchClient | null = null

/** Returns the configured search client (Tavily). Swap implementations here. */
export function getSearchClient(): SearchClient {
	if (!_client) _client = new TavilySearchClient()
	return _client
}
