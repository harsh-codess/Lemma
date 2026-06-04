/**
 * ─── Agent 1 + Critique + Agent 2 + Agent 3 Pipeline Test ────────────────────
 *
 * Standalone test script that runs Agent 1 (Paper Analysis), the Skeptical
 * Review critique pass (with one regeneration if issues are found), Agent 2
 * (TRL/IRL Scoring), and Agent 3 (Market Scout: web retrieval + grounded
 * synthesis) sequentially, printing results to the console.
 *
 * Usage:
 *   1. Create a .env.local file with: GEMINI_API_KEY=your_key_here
 *      (and TAVILY_API_KEY=... for the Agent 3 Market Scout stage)
 *   2. Place a test PDF at: scripts/test-paper.pdf (or pass a URL as arg)
 *   3. Run: npx tsx scripts/test-agents.ts [optional-pdf-url]
 *
 * This does NOT require the database, Inngest, or Next.js to be running.
 * If TAVILY_API_KEY is missing, the Market Scout stage is skipped.
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
import { runPaperCritique, buildRevisionContext } from '../lib/agents/critique-agent'
import { runTrlIrlAgent } from '../lib/agents/trl-irl-agent'
import { runMarketRetrieval, runMarketSynthesis } from '../lib/agents/market-scout-agent'
import { runFeasibilityAgent } from '../lib/agents/feasibility-agent'
import { runPitchBuilder } from '../lib/agents/pitch-builder-agent'
import {
	runFeasibilityCritique,
	buildFeasibilityRevisionContext,
	runPitchCritique,
	buildPitchRevisionContext,
} from '../lib/agents/critique-agent'
import type { FeasibilityScoutOutput, PaperAgentOutput, PitchBuilderOutput, SourcedFigure } from '../lib/agents/types'

function printDeck(deck: PitchBuilderOutput) {
	deck.slides.forEach((s) => {
		console.log(`\n  ── Slide ${s.order}: [${s.slideType}] ${s.title}`)
		s.bullets.forEach((b) => console.log(`     • ${b}`))
		if (s.narrative.trim()) console.log(`     ~ ${s.narrative}`)
		if (s.factRefs.length > 0) {
			console.log(`     factRefs: ${s.factRefs.map((f) => f.ref + (f.sourceUrl ? ` → ${f.sourceUrl}` : '')).join(', ')}`)
		} else {
			console.log(`     factRefs: (none — pure narrative)`)
		}
	})
}

/** Pretty ₹ ranges for console output */
function formatINR(amount: number): string {
	if (amount >= 1_00_00_000) {
		const cr = amount / 1_00_00_000
		return `₹${cr % 1 === 0 ? cr : cr.toFixed(1)} Cr`
	}
	const lakh = amount / 1_00_000
	return `₹${lakh % 1 === 0 ? lakh : lakh.toFixed(1)} L`
}

function printFeasibility(label: string, f: FeasibilityScoutOutput) {
	console.log(`\n┌─ ${label} ${'─'.repeat(Math.max(0, 66 - label.length))}`)
	console.log(`│ Timeline:  ${f.estimatedTimeline.minMonths}–${f.estimatedTimeline.maxMonths} months [${f.estimatedTimeline.confidence}]`)
	console.log(`│   ${f.estimatedTimeline.reasoning}`)
	console.log(`│ Capital:   ${formatINR(f.capitalEstimate.minINR)}–${formatINR(f.capitalEstimate.maxINR)} [${f.capitalEstimate.confidence}]`)
	console.log(`│   ${f.capitalEstimate.reasoning}`)
	console.log(`│   Cost drivers: ${f.capitalEstimate.majorCostDrivers.join(' | ')}`)
	console.log('│ Team:')
	f.teamMatrix.forEach((r) => {
		console.log(`│   • ${r.role} — ${r.domainExpertise} (${r.seniority})`)
		console.log(`│     ${r.rationale}`)
	})
	console.log('│ Key Risks:')
	f.keyRisks.forEach((r, i) => console.log(`│   ${i + 1}. ${r}`))
	console.log(`│ Overall Confidence: ${f.overallConfidence.level.toUpperCase()}`)
	console.log(`│   ${f.overallConfidence.reasoning}`)
	console.log('└' + '─'.repeat(69))
}

const TEST_PROJECT_ID = 'test-' + Date.now()

/** Compact snapshot of the critique-relevant fields of a paper analysis */
function printAnalysisSnapshot(label: string, r: PaperAgentOutput) {
	console.log(`\n┌─ ${label} ${'─'.repeat(Math.max(0, 66 - label.length))}`)
	console.log(`│ Readiness:   ${r.initialReadinessEstimate}/100`)
	console.log(`│ Methodology: ${r.methodologyStrength}`)
	console.log('│ Key Claims:')
	r.keyClaims.forEach((claim, i) => {
		const conf = r.claimConfidence?.[i]
		console.log(`│   ${i + 1}. [${conf?.confidence ?? '—'}] ${claim}`)
	})
	console.log('└' + '─'.repeat(69))
}

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

	// ── Run Critique: Skeptical Review ───────────────────────────────────
	console.log('\n' + '━'.repeat(70))
	console.log('🕵️  CRITIQUE: Skeptical Review')
	console.log('━'.repeat(70))

	const critiqueStart = Date.now()
	const critique = await runPaperCritique(pdfBase64, paperResult, TEST_PROJECT_ID)
	const critiqueDuration = ((Date.now() - critiqueStart) / 1000).toFixed(1)

	console.log(`\n✅ Critique complete in ${critiqueDuration}s\n`)
	console.log('Verdict:', critique.verdict)
	console.log('Summary:', critique.summary)
	if (critique.issues.length > 0) {
		console.log('\nIssues:')
		critique.issues.forEach((issue, i) => {
			console.log(`  ${i + 1}. [${issue.severity}] ${issue.field}`)
			console.log(`     Flagged: "${issue.quote}"`)
			console.log(`     Problem: ${issue.issue}`)
		})
	}

	let finalPaperResult = paperResult
	if (critique.verdict === 'NEEDS_REVISION') {
		console.log('\n🔁 Regenerating Agent 1 with critique context (one pass)...')
		printAnalysisSnapshot('BEFORE critique', paperResult)

		const regenStart = Date.now()
		finalPaperResult = await runPaperAgent(
			pdfBase64,
			TEST_PROJECT_ID,
			buildRevisionContext(critique)
		)
		const regenDuration = ((Date.now() - regenStart) / 1000).toFixed(1)

		printAnalysisSnapshot('AFTER critique', finalPaperResult)
		console.log(`\n✅ Regeneration complete in ${regenDuration}s`)
	} else {
		console.log('\n✓ Analysis is grounded — no regeneration needed.')
	}

	// ── Run Agent 2: TRL/IRL Scoring ─────────────────────────────────────
	console.log('\n' + '━'.repeat(70))
	console.log('📊 AGENT 2: TRL/IRL Scoring')
	console.log('━'.repeat(70))

	const agent2Start = Date.now()
	const trlIrlResult = await runTrlIrlAgent(finalPaperResult, TEST_PROJECT_ID)
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

	// ── Run Agent 3: Market Scout ────────────────────────────────────────
	console.log('\n' + '━'.repeat(70))
	console.log('🌐 AGENT 3: Market Scout')
	console.log('━'.repeat(70))

	let marketResult: Awaited<ReturnType<typeof runMarketSynthesis>> | null = null
	let marketSourceCount = 0

	if (!process.env.TAVILY_API_KEY) {
		console.log('\n⏭️  TAVILY_API_KEY not set — skipping Market Scout stage.')
	} else {
		// Stage 1: retrieval
		const retrievalStart = Date.now()
		const sources = await runMarketRetrieval(finalPaperResult, TEST_PROJECT_ID)
		marketSourceCount = sources.length
		const retrievalDuration = ((Date.now() - retrievalStart) / 1000).toFixed(1)

		console.log(`\n✅ Stage 1 (retrieval) complete in ${retrievalDuration}s — ${sources.length} unique sources\n`)
		const byCategory = sources.reduce<Record<string, number>>((acc, s) => {
			acc[s.category] = (acc[s.category] ?? 0) + 1
			return acc
		}, {})
		Object.entries(byCategory).forEach(([cat, n]) => console.log(`  ${cat}: ${n} sources`))

		// Stage 2: grounded synthesis
		const synthesisStart = Date.now()
		marketResult = await runMarketSynthesis(finalPaperResult, sources, TEST_PROJECT_ID)
		const synthesisDuration = ((Date.now() - synthesisStart) / 1000).toFixed(1)

		console.log(`\n✅ Stage 2 (synthesis) complete in ${synthesisDuration}s\n`)

		const printFigure = (label: string, fig: SourcedFigure | null) => {
			if (!fig) {
				console.log(`${label}:  — (no grounded source; correctly returned null)`)
				return
			}
			console.log(`${label}:  ${fig.value}`)
			console.log(`      basis:  ${fig.basis}`)
			console.log(`      source: ${fig.sourceTitle}`)
			console.log(`              ${fig.sourceUrl}`)
		}
		printFigure('TAM', marketResult.tam)
		printFigure('SAM', marketResult.sam)
		printFigure('SOM', marketResult.som)

		console.log('\nMarket Summary:')
		console.log(`  ${marketResult.summary}`)

		if (marketResult.competitors.length > 0) {
			console.log('\nCompetitors:')
			marketResult.competitors.forEach((c, i) => {
				console.log(`  ${i + 1}. ${c.name} (${c.stage})`)
				console.log(`     ${c.positioning}`)
				console.log(`     Signal: ${c.signal}`)
				console.log(`     Source: ${c.sourceUrl}`)
			})
		}

		if (marketResult.signals.length > 0) {
			console.log('\nMarket Signals:')
			marketResult.signals.forEach((s, i) => {
				console.log(`  ${i + 1}. [${s.type}/${s.impact}] ${s.title}`)
				console.log(`     ${s.summary}`)
				console.log(`     Source: ${s.sourceUrl}`)
			})
		}
	}

	// ── Run Agent 4: Feasibility ─────────────────────────────────────────
	console.log('\n' + '━'.repeat(70))
	console.log('🏗️  AGENT 4: Feasibility')
	console.log('━'.repeat(70))

	const agent4Start = Date.now()
	const feasibilityDraft = await runFeasibilityAgent(
		finalPaperResult,
		trlIrlResult,
		marketResult,
		TEST_PROJECT_ID
	)
	const agent4Duration = ((Date.now() - agent4Start) / 1000).toFixed(1)
	console.log(`\n✅ Agent 4 complete in ${agent4Duration}s`)

	// ── Critique: Skeptical Review of Feasibility ────────────────────────
	console.log('\n' + '━'.repeat(70))
	console.log('🕵️  CRITIQUE: Skeptical Review (Feasibility)')
	console.log('━'.repeat(70))

	const feasCritiqueStart = Date.now()
	const feasCritique = await runFeasibilityCritique(
		finalPaperResult,
		trlIrlResult,
		marketResult,
		feasibilityDraft,
		TEST_PROJECT_ID
	)
	console.log(`\n✅ Critique complete in ${((Date.now() - feasCritiqueStart) / 1000).toFixed(1)}s\n`)
	console.log('Verdict:', feasCritique.verdict)
	console.log('Summary:', feasCritique.summary)
	if (feasCritique.issues.length > 0) {
		console.log('\nIssues:')
		feasCritique.issues.forEach((issue, i) => {
			console.log(`  ${i + 1}. [${issue.severity}] ${issue.field}`)
			console.log(`     Flagged: "${issue.quote}"`)
			console.log(`     Problem: ${issue.issue}`)
		})
	}

	let feasibilityResult = feasibilityDraft
	if (feasCritique.verdict === 'NEEDS_REVISION') {
		console.log('\n🔁 Regenerating Agent 4 with critique context (one pass)...')
		printFeasibility('BEFORE critique', feasibilityDraft)
		feasibilityResult = await runFeasibilityAgent(
			finalPaperResult,
			trlIrlResult,
			marketResult,
			TEST_PROJECT_ID,
			buildFeasibilityRevisionContext(feasCritique)
		)
		printFeasibility('AFTER critique', feasibilityResult)
	} else {
		console.log('\n✓ Assessment traces to inputs — no regeneration needed.')
		printFeasibility('FEASIBILITY ASSESSMENT', feasibilityResult)
	}

	// ── Run Agent 5: Pitch Builder ───────────────────────────────────────
	console.log('\n' + '━'.repeat(70))
	console.log('📑 AGENT 5: Pitch Builder')
	console.log('━'.repeat(70))

	const agent5Start = Date.now()
	const deckDraft = await runPitchBuilder(
		finalPaperResult,
		trlIrlResult,
		marketResult,
		feasibilityResult,
		TEST_PROJECT_ID
	)
	console.log(`\n✅ Agent 5 complete in ${((Date.now() - agent5Start) / 1000).toFixed(1)}s`)

	// ── Critique: Traceability Review of the deck ────────────────────────
	console.log('\n' + '━'.repeat(70))
	console.log('🕵️  CRITIQUE: Traceability Review (Pitch)')
	console.log('━'.repeat(70))

	const pitchCritiqueStart = Date.now()
	const pitchCritique = await runPitchCritique(
		finalPaperResult,
		trlIrlResult,
		marketResult,
		feasibilityResult,
		deckDraft,
		TEST_PROJECT_ID
	)
	console.log(`\n✅ Critique complete in ${((Date.now() - pitchCritiqueStart) / 1000).toFixed(1)}s\n`)
	console.log('Verdict:', pitchCritique.verdict)
	console.log('Summary:', pitchCritique.summary)
	if (pitchCritique.issues.length > 0) {
		console.log('\nIssues:')
		pitchCritique.issues.forEach((issue, i) => {
			console.log(`  ${i + 1}. [${issue.severity}] ${issue.field}`)
			console.log(`     Flagged: "${issue.quote}"`)
			console.log(`     Problem: ${issue.issue}`)
		})
	}

	let deckResult = deckDraft
	if (pitchCritique.verdict === 'NEEDS_REVISION') {
		console.log('\n🔁 Regenerating Agent 5 with critique context (one pass)...')
		deckResult = await runPitchBuilder(
			finalPaperResult,
			trlIrlResult,
			marketResult,
			feasibilityResult,
			TEST_PROJECT_ID,
			buildPitchRevisionContext(pitchCritique)
		)
		console.log('✅ Regeneration complete.')
	} else {
		console.log('\n✓ Every factual claim traces upstream — no regeneration needed.')
	}

	console.log('\n── DECK CONTENT (with factRefs) ' + '─'.repeat(38))
	printDeck(deckResult)

	// ── Summary ──────────────────────────────────────────────────────────
	const totalDuration = ((Date.now() - agent1Start) / 1000).toFixed(1)
	console.log('\n' + '━'.repeat(70))
	console.log('📋 PIPELINE SUMMARY')
	console.log('━'.repeat(70))
	console.log(`Project ID:       ${TEST_PROJECT_ID}`)
	console.log(`Domain:           ${finalPaperResult.domain}`)
	console.log(`Readiness:        ${finalPaperResult.initialReadinessEstimate}/100`)
	console.log(`Methodology:      ${finalPaperResult.methodologyStrength ?? 'N/A'}`)
	console.log(`Critique:         ${critique.verdict} (${critique.issues.length} issues${critique.verdict === 'NEEDS_REVISION' ? ', regenerated once' : ''})`)
	console.log(`TRL:              ${trlIrlResult.trlScore}`)
	console.log(`IRL:              ${trlIrlResult.irlScore}`)
	console.log(`Pathway:          ${trlIrlResult.commercializationPathway ?? 'N/A'}`)
	console.log(`Time to Market:   ${trlIrlResult.timeToMarket ?? 'N/A'}`)
	console.log(`Grants:           ${trlIrlResult.recommendedGrants?.length ?? 0} recommended`)
	console.log(`Risk Flags:       ${trlIrlResult.riskFlags.length}`)
	console.log(`Evidence:         ${trlIrlResult.evidence.length} items`)
	if (marketResult) {
		console.log(`Market Sources:   ${marketSourceCount} retrieved`)
		console.log(`TAM:              ${marketResult.tam?.value ?? 'not established (no grounded source)'}`)
		console.log(`Competitors:      ${marketResult.competitors.length} (all source-linked)`)
		console.log(`Signals:          ${marketResult.signals.length} (all source-linked)`)
	} else {
		console.log(`Market Scout:     skipped (no TAVILY_API_KEY)`)
	}
	console.log(`Timeline:         ${feasibilityResult.estimatedTimeline.minMonths}–${feasibilityResult.estimatedTimeline.maxMonths} months (${feasibilityResult.estimatedTimeline.confidence})`)
	console.log(`Capital:          ${formatINR(feasibilityResult.capitalEstimate.minINR)}–${formatINR(feasibilityResult.capitalEstimate.maxINR)} (${feasibilityResult.capitalEstimate.confidence})`)
	console.log(`Feas. Confidence: ${feasibilityResult.overallConfidence.level} | Critique: ${feasCritique.verdict} (${feasCritique.issues.length} issues${feasCritique.verdict === 'NEEDS_REVISION' ? ', regenerated once' : ''})`)
	const deckFactRefs = deckResult.slides.reduce((n, s) => n + s.factRefs.length, 0)
	console.log(`Deck:             ${deckResult.slides.length} slides, ${deckFactRefs} factRefs | Critique: ${pitchCritique.verdict} (${pitchCritique.issues.length} issues${pitchCritique.verdict === 'NEEDS_REVISION' ? ', regenerated once' : ''})`)
	console.log(`Total time:       ${totalDuration}s`)
	console.log('━'.repeat(70))
}

main().catch((err) => {
	console.error('\n❌ Pipeline failed:', err.message)
	if (err.cause) console.error('   Cause:', err.cause)
	process.exit(1)
})
