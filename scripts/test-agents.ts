/**
 * ─── Agent 1 + Agent 2 Pipeline Test ─────────────────────────────────────────
 *
 * Standalone test script that runs Agent 1 (Paper Analysis) and Agent 2
 * (TRL/IRL Scoring) sequentially, printing results to the console.
 *
 * Usage:
 *   1. Create a .env.local file with: GEMINI_API_KEY=your_key_here
 *   2. Place a test PDF at: scripts/test-paper.pdf (or pass a URL as arg)
 *   3. Run: npx tsx scripts/test-agents.ts [optional-pdf-url]
 *
 * This does NOT require the database, Inngest, or Next.js to be running.
 */

import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env.local (Next.js convention)
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

// ── Verify API key ──────────────────────────────────────────────────────────
if (!process.env.GEMINI_API_KEY) {
	console.error('❌ GEMINI_API_KEY is not set in .env.local')
	process.exit(1)
}

// ── Import agents (after env is loaded) ─────────────────────────────────────
import { runPaperAgent } from '../lib/agents/paper-agent'
import { runTrlIrlAgent } from '../lib/agents/trl-irl-agent'

const TEST_PROJECT_ID = 'test-' + Date.now()

async function main() {
	const pdfArg = process.argv[2]
	let pdfBase64: string

	if (pdfArg && pdfArg.startsWith('http')) {
		// ── Fetch PDF from URL ───────────────────────────────────────────
		console.log(`📄 Fetching PDF from URL: ${pdfArg}`)
		const response = await fetch(pdfArg)
		if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`)
		const buffer = await response.arrayBuffer()
		pdfBase64 = Buffer.from(buffer).toString('base64')
		console.log(`   PDF size: ${(buffer.byteLength / 1024).toFixed(0)} KB\n`)
	} else {
		// ── Read PDF from local file ─────────────────────────────────────
		const pdfPath = pdfArg
			? resolve(pdfArg)
			: resolve(import.meta.dirname, 'test-paper.pdf')

		try {
			const pdfBuffer = readFileSync(pdfPath)
			pdfBase64 = pdfBuffer.toString('base64')
			console.log(`📄 Loaded PDF: ${pdfPath}`)
			console.log(`   PDF size: ${(pdfBuffer.byteLength / 1024).toFixed(0)} KB\n`)
		} catch {
			console.error(`❌ Could not read PDF at: ${pdfPath}`)
			console.error('   Pass a URL instead: npx tsx scripts/test-agents.ts https://arxiv.org/pdf/1706.03762')
			process.exit(1)
		}
	}

	// ── Run Agent 1: Paper Analysis ──────────────────────────────────────
	console.log('━'.repeat(70))
	console.log('🔬 AGENT 1: Paper Analysis')
	console.log('━'.repeat(70))

	const agent1Start = Date.now()
	const paperResult = await runPaperAgent(pdfBase64, TEST_PROJECT_ID)
	const agent1Duration = ((Date.now() - agent1Start) / 1000).toFixed(1)

	console.log(`\n✅ Agent 1 complete in ${agent1Duration}s\n`)
	console.log('Domain:', paperResult.domain)
	console.log('Classification:', paperResult.domainClassification)
	console.log('Readiness:', `${paperResult.initialReadinessEstimate}/100`)
	console.log('\nAbstract Summary:')
	console.log(`  ${paperResult.abstractSummary}`)
	console.log('\nNovelty Summary:')
	console.log(`  ${paperResult.noveltySummary}`)
	console.log('\nMethodology Strength:', paperResult.methodologyStrength ?? 'N/A')
	console.log('Institution Context:', paperResult.institutionContext ?? 'N/A')

	console.log('\nKey Claims with Confidence:')
	paperResult.keyClaims.forEach((claim, i) => {
		const conf = paperResult.claimConfidence?.[i]
		const tag = conf ? ` [${conf.confidence}]` : ''
		console.log(`  ${i + 1}. ${claim}${tag}`)
		if (conf?.reasoning) console.log(`     → ${conf.reasoning}`)
	})

	if (paperResult.commercializationBarriers?.length) {
		console.log('\nCommercialization Barriers:')
		paperResult.commercializationBarriers.forEach((b, i) => {
			console.log(`  ${i + 1}. ${b}`)
		})
	}

	// ── Run Agent 2: TRL/IRL Scoring ─────────────────────────────────────
	console.log('\n' + '━'.repeat(70))
	console.log('📊 AGENT 2: TRL/IRL Scoring')
	console.log('━'.repeat(70))

	const agent2Start = Date.now()
	const trlIrlResult = await runTrlIrlAgent(paperResult, TEST_PROJECT_ID)
	const agent2Duration = ((Date.now() - agent2Start) / 1000).toFixed(1)

	console.log(`\n✅ Agent 2 complete in ${agent2Duration}s\n`)
	console.log('TRL Score:', trlIrlResult.trlScore)
	console.log('IRL Score:', trlIrlResult.irlScore)
	console.log('Confidence:', trlIrlResult.confidence)
	console.log('\nRationale:')
	trlIrlResult.rationale.forEach((r, i) => {
		console.log(`  ${i + 1}. ${r}`)
	})
	console.log('\nRisk Flags:')
	trlIrlResult.riskFlags.forEach((r, i) => {
		console.log(`  ⚠️  ${i + 1}. ${r}`)
	})
	if (trlIrlResult.evidence.length > 0) {
		console.log('\nEvidence:')
		trlIrlResult.evidence.forEach((e, i) => {
			console.log(`  ${i + 1}. [${e.confidence}] ${e.claim}`)
			console.log(`     Source: ${e.sourceTitle}`)
			console.log(`     ${e.summary}`)
		})
	}

	if (trlIrlResult.commercializationPathway) {
		console.log('\nCommercialization Pathway:', trlIrlResult.commercializationPathway)
		if (trlIrlResult.pathwayRationale)
			console.log('  Rationale:', trlIrlResult.pathwayRationale)
	}
	if (trlIrlResult.timeToMarket)
		console.log('\nTime to Market:', trlIrlResult.timeToMarket)
	if (trlIrlResult.domainRubricApplied)
		console.log('Domain Rubric Applied:', trlIrlResult.domainRubricApplied)
	if (trlIrlResult.recommendedGrants?.length) {
		console.log('\nRecommended Grants:')
		trlIrlResult.recommendedGrants.forEach((g, i) => console.log(`  ${i + 1}. ${g}`))
	}

	// ── Summary ──────────────────────────────────────────────────────────
	const totalDuration = ((Date.now() - agent1Start) / 1000).toFixed(1)
	console.log('\n' + '━'.repeat(70))
	console.log('📋 PIPELINE SUMMARY')
	console.log('━'.repeat(70))
	console.log(`Project ID:       ${TEST_PROJECT_ID}`)
	console.log(`Domain:           ${paperResult.domain}`)
	console.log(`Readiness:        ${paperResult.initialReadinessEstimate}/100`)
	console.log(`Methodology:      ${paperResult.methodologyStrength ?? 'N/A'}`)
	console.log(`TRL:              ${trlIrlResult.trlScore}`)
	console.log(`IRL:              ${trlIrlResult.irlScore}`)
	console.log(`Pathway:          ${trlIrlResult.commercializationPathway ?? 'N/A'}`)
	console.log(`Time to Market:   ${trlIrlResult.timeToMarket ?? 'N/A'}`)
	console.log(`Grants:           ${trlIrlResult.recommendedGrants?.length ?? 0} recommended`)
	console.log(`Risk Flags:       ${trlIrlResult.riskFlags.length}`)
	console.log(`Evidence:         ${trlIrlResult.evidence.length} items`)
	console.log(`Total time:       ${totalDuration}s`)
	console.log('━'.repeat(70))
}

main().catch((err) => {
	console.error('\n❌ Pipeline failed:', err.message)
	if (err.cause) console.error('   Cause:', err.cause)
	process.exit(1)
})
