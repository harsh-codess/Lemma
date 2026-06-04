import PptxGenJS from 'pptxgenjs'
import type { RenderDeck, RenderSlide } from './render-model'
import { type ExportTheme, lightExportTheme, hex6 } from './theme'

/**
 * ─── PPTX Renderer ───────────────────────────────────────────────────────────
 *
 * pptxgenjs, fully local (no keys). Echoes the HTML template layout: left accent
 * bar, eyebrow label, title, bulleted body, italic narrative, and a Sources
 * footer for any sourceUrl-bearing claim — so the projector deck shows the same
 * grounding the PDF does.
 */

// 16:9 widescreen, in inches.
const W = 13.33
const H = 7.5
const MARGIN_X = 0.85
const CONTENT_W = W - MARGIN_X - 0.7

function addAccentBar(slide: PptxGenJS.Slide, accent: string) {
	slide.addShape('rect', { x: 0, y: 0, w: 0.16, h: H, fill: { color: hex6(accent) } })
}

function addSources(slide: PptxGenJS.Slide, s: RenderSlide, theme: ExportTheme, y: number) {
	// No external source → no footer (internal provenance is not shown to readers).
	if (s.citations.length === 0) return
	// "Sources" label + one line per citation: ref → domain (url)
	const runs: PptxGenJS.TextProps[] = [
		{ text: 'SOURCES   ', options: { bold: true, fontSize: 9, color: hex6(theme.inkFaint) } },
	]
	s.citations.forEach((c, i) => {
		runs.push({ text: `${c.ref}: `, options: { fontSize: 10, color: hex6(theme.inkFaint), fontFace: theme.docFontSans } })
		runs.push({
			text: c.domain + (i < s.citations.length - 1 ? '    ' : ''),
			options: { fontSize: 10, color: hex6(s.accent), fontFace: theme.docFontSans, hyperlink: { url: c.url } },
		})
	})
	slide.addText(runs, { x: MARGIN_X, y, w: CONTENT_W, h: 0.5, valign: 'top' })
	// thin rule above the sources
	slide.addShape('line', { x: MARGIN_X, y: y - 0.08, w: CONTENT_W, h: 0, line: { color: hex6(theme.rule), width: 0.75 } })
}

function renderCover(slide: PptxGenJS.Slide, s: RenderSlide, theme: ExportTheme) {
	slide.background = { color: hex6(theme.slideBg) }
	addAccentBar(slide, s.accent)
	slide.addText(s.label.toUpperCase(), {
		x: MARGIN_X, y: 2.4, w: CONTENT_W, h: 0.4, fontSize: 14, bold: true, charSpacing: 3,
		color: hex6(s.accent), fontFace: theme.docFontSans,
	})
	slide.addText(s.title, {
		x: MARGIN_X, y: 2.85, w: CONTENT_W, h: 1.8, fontSize: 40, bold: true,
		color: hex6(theme.ink), fontFace: theme.docFontSans, valign: 'top',
	})
	if (s.subtitle) {
		slide.addText(s.subtitle, {
			x: MARGIN_X, y: 4.6, w: CONTENT_W, h: 0.6, fontSize: 16,
			color: hex6(theme.inkMuted), fontFace: theme.docFontSans,
		})
	}
	slide.addShape('rect', { x: MARGIN_X, y: 5.4, w: 1.25, h: 0.07, fill: { color: hex6(s.accent) } })
}

function renderContent(slide: PptxGenJS.Slide, s: RenderSlide, theme: ExportTheme) {
	slide.background = { color: hex6(theme.slideBg) }
	addAccentBar(slide, s.accent)

	// Eyebrow + slide number
	slide.addText(s.label.toUpperCase(), {
		x: MARGIN_X, y: 0.5, w: CONTENT_W - 1, h: 0.35, fontSize: 13, bold: true, charSpacing: 3,
		color: hex6(s.accent), fontFace: theme.docFontSans,
	})
	slide.addText(String(s.order), {
		x: W - 1.3, y: 0.5, w: 0.6, h: 0.35, fontSize: 12, align: 'right',
		color: hex6(theme.inkFaint), fontFace: theme.docFontSans,
	})

	// Title
	slide.addText(s.title, {
		x: MARGIN_X, y: 0.95, w: CONTENT_W, h: 1.2, fontSize: s.layout === 'statement' ? 30 : 27, bold: true,
		color: hex6(theme.ink), fontFace: theme.docFontSans, valign: 'top',
	})

	// Bullets — fit:'shrink' so dense slides scale down rather than overflow.
	let bodyBottom = 2.15
	if (s.bullets.length > 0) {
		slide.addText(
			s.bullets.map((b) => ({
				text: b,
				options: { bullet: { code: '2022', indent: 18 }, fontSize: 15, color: hex6(theme.ink), paraSpaceAfter: 8, fontFace: theme.docFontSans },
			})),
			{ x: MARGIN_X, y: 2.15, w: CONTENT_W, h: 3.3, valign: 'top', fit: 'shrink' },
		)
		bodyBottom = 5.55
	}

	// Narrative (italic, muted) — bounded box + fit:'shrink' so it never spills
	// into the sources footer; the box ends above the sources band.
	if (s.narrative.trim()) {
		slide.addText(s.narrative, {
			x: MARGIN_X, y: bodyBottom, w: CONTENT_W, h: 1.0, fontSize: 12, italic: true,
			color: hex6(theme.inkMuted), fontFace: theme.docFontSans, valign: 'top', fit: 'shrink',
		})
	}

	// Sources footer (grounding visible)
	addSources(slide, s, theme, 6.85)
}

export async function renderDeckPptx(
	deck: RenderDeck,
	theme: ExportTheme = lightExportTheme,
): Promise<Buffer> {
	const pptx = new PptxGenJS()
	pptx.defineLayout({ name: 'LEMMA_WIDE', width: W, height: H })
	pptx.layout = 'LEMMA_WIDE'
	pptx.author = 'Lemma'
	pptx.company = 'Lemma'
	pptx.title = deck.meta.title

	for (const s of deck.slides) {
		const slide = pptx.addSlide()
		if (s.layout === 'cover') renderCover(slide, s, theme)
		else renderContent(slide, s, theme)
	}

	const out = (await pptx.write({ outputType: 'nodebuffer' })) as unknown as Buffer
	return out
}
