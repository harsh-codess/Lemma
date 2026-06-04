import type { RenderDeck } from './render-model'
import { renderSlideHtml, slideStylesheet } from './slide-templates'
import { type ExportTheme, lightExportTheme } from './theme'

/**
 * Assembles a full standalone HTML document for the deck. Used by the PDF
 * renderer; the @page rule sizes pages to the 1280×720 slide so Chrome paginates
 * one slide per page. The slide markup itself comes from slide-templates.ts and
 * is shared with the (future) web review view.
 */
export function renderDeckHtml(deck: RenderDeck, theme: ExportTheme = lightExportTheme): string {
	const slides = deck.slides.map(renderSlideHtml).join('\n')
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeTitle(deck.meta.title)}</title>
<style>
${slideStylesheet(theme)}
@page { size: 1280px 720px; margin: 0; }
@media print { body { background: ${theme.slideBg}; } .slide { box-shadow: none; } }
</style>
</head>
<body>
${slides}
</body>
</html>`
}

function escapeTitle(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
