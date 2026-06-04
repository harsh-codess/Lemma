import { prisma } from '../prisma'
import { uploadBuffer, getPublicUrl } from '../r2'
import { createRouteLogger } from '../logger'
import type { PitchSlide } from '../agents/types'
import { buildRenderDeck } from './render-model'
import { renderDeck, FORMAT_META, EXPORT_FORMATS, type ExportFormat } from './index'

/**
 * Renders the project's validated deck (DeckData.slides) into the requested
 * formats, uploads each to R2, and upserts a DeckExport row so the frontend
 * can offer downloads. Server-only (touches DB + R2); the render layer itself
 * stays pure. Reusable from an API route or an Inngest step.
 */

export interface StoredExport {
	format: ExportFormat
	url: string
	key: string
	fileName: string
	byteSize: number
}

function slugify(s: string): string {
	return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'deck'
}

export async function generateAndStoreExports(
	projectId: string,
	formats: ExportFormat[] = EXPORT_FORMATS,
): Promise<StoredExport[]> {
	const log = createRouteLogger('deck-export')

	const project = await prisma.project.findUnique({
		where: { id: projectId },
		select: { title: true, domain: true, deck: { select: { slides: true } } },
	})
	if (!project) throw new Error(`Project ${projectId} not found`)
	if (!project.deck?.slides) throw new Error(`Project ${projectId} has no deck to export — run the pipeline through the deck stage first`)

	const slides = project.deck.slides as unknown as PitchSlide[]
	const deck = buildRenderDeck(slides, {
		title: project.title,
		subtitle: project.domain ? `Commercialization brief · ${project.domain}` : undefined,
	})

	const slug = slugify(project.title)
	const results: StoredExport[] = []

	for (const format of formats) {
		const { ext, contentType } = FORMAT_META[format]
		const buffer = await renderDeck(deck, format)
		const fileName = `${slug}-deck.${ext}`
		const key = `exports/${projectId}/${fileName}`

		await uploadBuffer(key, buffer, contentType)
		const url = getPublicUrl(key)

		await prisma.deckExport.upsert({
			where: { projectId_format: { projectId, format } },
			create: { projectId, format, key, url, fileName, byteSize: buffer.byteLength },
			update: { key, url, fileName, byteSize: buffer.byteLength },
		})

		log.info('Deck export stored', { projectId, format, key, byteSize: buffer.byteLength })
		results.push({ format, url, key, fileName, byteSize: buffer.byteLength })
	}

	return results
}
