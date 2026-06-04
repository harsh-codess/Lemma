/**
 * ─── Render a stored deck to PDF / PPTX / DOCX ───────────────────────────────
 *
 * Reads a project's validated DeckData.slides from the DB and renders all three
 * deterministic formats to scripts/out/. No LLM, no API keys.
 *
 *   npx tsx scripts/render-deck.ts <projectId>
 */
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync, writeFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

async function main() {
	const projectId = process.argv[2]
	if (!projectId) {
		console.error('Usage: npx tsx scripts/render-deck.ts <projectId>')
		process.exit(1)
	}

	const { prisma } = await import('../lib/prisma')
	const { buildRenderDeck, renderDeck, FORMAT_META, EXPORT_FORMATS } = await import('../lib/deck-render')
	type PitchSlide = import('../lib/agents/types').PitchSlide

	const project = await prisma.project.findUnique({
		where: { id: projectId },
		select: { title: true, domain: true, deck: { select: { slides: true } } },
	})
	if (!project) throw new Error(`Project ${projectId} not found`)
	if (!project.deck?.slides) throw new Error(`Project ${projectId} has no deck`)

	const slides = project.deck.slides as unknown as PitchSlide[]
	const deckModel = buildRenderDeck(slides, {
		title: project.title,
		subtitle: project.domain ? `Commercialization brief · ${project.domain}` : undefined,
	})

	const outDir = resolve(__dirname, 'out')
	mkdirSync(outDir, { recursive: true })

	console.log(`Rendering "${project.title}" — ${slides.length} slides (+ cover) → ${deckModel.slides.length} pages\n`)

	for (const format of EXPORT_FORMATS) {
		const buf = await renderDeck(deckModel, format)
		const path = resolve(outDir, `lemma-deck.${FORMAT_META[format].ext}`)
		writeFileSync(path, new Uint8Array(buf))
		console.log(`  ✅ ${format.toUpperCase().padEnd(4)} ${(buf.byteLength / 1024).toFixed(1).padStart(7)} KB  →  ${path}`)
	}

	await prisma.$disconnect()
}

main().catch((e) => {
	console.error('\n❌ Render failed:', e.message)
	process.exit(1)
})
