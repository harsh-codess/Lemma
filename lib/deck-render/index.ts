import type { PitchSlide } from '../agents/types'
import { buildRenderDeck, type RenderDeck, type RenderDeckMeta } from './render-model'
import { renderDeckPdf } from './render-pdf'
import { renderDeckPptx } from './render-pptx'
import { renderDeckDocx } from './render-docx'
import { type ExportTheme, lightExportTheme } from './theme'

/**
 * ─── Deck Render Orchestrator ────────────────────────────────────────────────
 *
 * Deterministic plumbing: validated deck JSON (DeckData.slides) → PDF / PPTX /
 * DOCX. No LLM, no API keys. All three formats render from the SAME RenderDeck
 * built by buildRenderDeck, so they cannot disagree on content or grounding.
 */

export type ExportFormat = 'pdf' | 'pptx' | 'docx'

export const EXPORT_FORMATS: ExportFormat[] = ['pdf', 'pptx', 'docx']

export const FORMAT_META: Record<ExportFormat, { ext: string; contentType: string }> = {
	pdf: { ext: 'pdf', contentType: 'application/pdf' },
	pptx: { ext: 'pptx', contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
	docx: { ext: 'docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
}

export function isExportFormat(value: string): value is ExportFormat {
	return (EXPORT_FORMATS as string[]).includes(value)
}

/** Render one RenderDeck to a given format buffer. */
export function renderDeck(
	deck: RenderDeck,
	format: ExportFormat,
	theme: ExportTheme = lightExportTheme,
): Promise<Buffer> {
	switch (format) {
		case 'pdf':
			return renderDeckPdf(deck, theme)
		case 'pptx':
			return renderDeckPptx(deck, theme)
		case 'docx':
			return renderDeckDocx(deck, theme)
	}
}

/** Convenience: validated slides + meta → a format buffer in one call. */
export function renderSlidesToFormat(
	slides: PitchSlide[],
	meta: RenderDeckMeta,
	format: ExportFormat,
	theme: ExportTheme = lightExportTheme,
): Promise<Buffer> {
	return renderDeck(buildRenderDeck(slides, meta), format, theme)
}

export { buildRenderDeck } from './render-model'
export type { RenderDeck, RenderDeckMeta, RenderSlide, RenderCitation } from './render-model'
export { lightExportTheme } from './theme'
export type { ExportTheme } from './theme'
export { renderDeckHtml } from './deck-html'
