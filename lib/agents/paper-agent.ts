import { gemini } from './gemini-client'
import { paperAgentSchema } from './validators'
import { createAgentLogger } from '../logger'
import type { PaperAgentOutput } from './types'

/**
 * ─── Agent 1: Paper Analysis ─────────────────────────────────────────────────
 *
 * Role: Read the raw research paper PDF and extract the foundational
 *       understanding that every downstream agent depends on.
 *
 * Input:  Raw PDF (as base64)
 * Output: PaperAgentOutput — abstract, novelty, domain, key claims
 *
 * This is the ONLY agent that touches the PDF directly.
 * All subsequent agents receive this agent's structured output as context.
 */

const PAPER_AGENT_PROMPT = `
You are Agent 1 in Lemma's 5-stage commercialization pipeline.

Your role: PAPER ANALYSIS AGENT.
You are a senior research analyst at a Technology Transfer Office (TTO).
Your job is to read a research paper and extract a structured commercial assessment.

You are the FIRST agent in the chain. Your output will be consumed by:
- Agent 2 (TRL/IRL Scorer) — needs your key claims and novelty assessment
- Agent 3 (Market Analyst) — needs your domain classification
- Agent 4 (Feasibility Assessor) — needs your claims and domain
- Agent 5 (Deck Writer) — needs everything

DO NOT try to score TRL, estimate markets, or write investor narratives.
That is NOT your job. Stay in your lane.

YOUR JOB IS TO EXTRACT:
1. A plain-English summary of the abstract (2-3 sentences, no jargon)
2. What makes this research novel (the technical moat, not generic praise)
3. Domain classification (Primary + Secondary)
4. The 3-5 strongest commercializable claims from the paper
5. A rough first-pass readiness estimate (0-100)

Return ONLY valid JSON matching this exact schema:

{
  "abstractSummary": "<2-3 sentence plain English summary. Write it so a non-scientist investor can understand what the research does and why it matters.>",
  "noveltySummary": "<What is technically novel here? Focus on what creates a defensible commercial advantage, not just scientific novelty. Be specific — name the mechanism, process, or discovery that is hard to replicate.>",
  "domainClassification": "<Primary: [main domain]. Secondary: [adjacent domain]. Choose from: Biotech / Materials, Medtech, Diagnostics, Energy / Advanced materials, Climate / Industrial, AI / Software, Agritech, Deeptech / Hardware, Other>",
  "keyClaims": [
    "<claim 1: most commercially significant finding>",
    "<claim 2: supporting technical evidence>",
    "<claim 3: translational or deployment implication>",
    "<claim 4 (if applicable)>",
    "<claim 5 (if applicable)>"
  ],
  "domain": "<short domain tag, e.g. 'Biotech / Materials'>",
  "initialReadinessEstimate": <integer 0-100. Be conservative. Most papers score 30-60. Only score above 70 if the paper shows validated results beyond lab conditions.>
}

RULES:
- If the paper is weak, say so. Do not inflate.
- If a claim is speculative rather than evidence-backed, flag it.
- Use Indian institutional context if the paper comes from an Indian institution.
- Write for a TTO analyst, not an academic reviewer.
`

export async function runPaperAgent(
	pdfBase64: string,
	projectId: string
): Promise<PaperAgentOutput> {
	const log = createAgentLogger('Paper Analysis', 1, projectId)
	const startTime = Date.now()

	log.start()

	const result = await gemini.generateContent([
		{
			inlineData: {
				data: pdfBase64,
				mimeType: 'application/pdf',
			},
		},
		{ text: PAPER_AGENT_PROMPT },
	])

	const text = result.response.text()
	log.debug('Raw Gemini response received', { responseLength: text.length })

	let rawOutput: unknown
	try {
		rawOutput = JSON.parse(text)
	} catch {
		log.error('Failed to parse Gemini JSON response', { rawText: text.slice(0, 500) })
		throw new Error('Agent 1 returned invalid JSON')
	}

	// ── Validate output with Zod ─────────────────────────────────────────
	const validation = paperAgentSchema.safeParse(rawOutput)

	if (!validation.success) {
		log.validationFailed(validation.error.flatten())
		throw new Error(
			`Agent 1 output validation failed: ${validation.error.issues.map((i) => i.message).join('; ')}`
		)
	}

	const output = validation.data
	const durationMs = Date.now() - startTime

	log.complete(durationMs)
	log.info('Output summary', {
		domain: output.domain,
		claimCount: output.keyClaims.length,
		readinessEstimate: output.initialReadinessEstimate,
	})

	return output
}
