import {
	Document,
	Packer,
	Paragraph,
	TextRun,
	ExternalHyperlink,
	PageBreak,
	BorderStyle,
	AlignmentType,
	convertInchesToTwip,
} from 'docx'
import type { RenderDeck, RenderSlide } from './render-model'
import { type ExportTheme, lightExportTheme, hex6 } from './theme'

/**
 * ─── DOCX Renderer ───────────────────────────────────────────────────────────
 *
 * docx, fully local (no keys). One landscape page per slide, echoing the slide
 * layout: accent eyebrow label, title, bulleted body, italic narrative, and a
 * Sources block (ref → clickable domain) for any sourceUrl-bearing claim — the
 * same grounding the PDF and PPTX show.
 */

function eyebrow(s: RenderSlide, theme: ExportTheme): Paragraph {
	return new Paragraph({
		spacing: { after: 80 },
		children: [
			new TextRun({ text: s.label.toUpperCase(), bold: true, size: 20, color: hex6(s.accent), font: theme.docFontSans, characterSpacing: 30 }),
			new TextRun({ text: `    ${s.order > 0 ? `· ${s.order}` : ''}`, size: 18, color: hex6(theme.inkFaint), font: theme.docFontSans }),
		],
	})
}

function title(s: RenderSlide, theme: ExportTheme): Paragraph {
	return new Paragraph({
		spacing: { after: 200 },
		border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: hex6(theme.rule) } },
		children: [new TextRun({ text: s.title, bold: true, size: s.layout === 'cover' ? 56 : 40, color: hex6(theme.ink), font: theme.docFontSans })],
	})
}

function bullets(s: RenderSlide, theme: ExportTheme): Paragraph[] {
	return s.bullets.map(
		(b) =>
			new Paragraph({
				bullet: { level: 0 },
				spacing: { after: 120 },
				children: [new TextRun({ text: b, size: 24, color: hex6(theme.ink), font: theme.docFontSans })],
			}),
	)
}

function narrative(s: RenderSlide, theme: ExportTheme): Paragraph[] {
	if (!s.narrative.trim()) return []
	return [
		new Paragraph({
			spacing: { before: 160, after: 120 },
			children: [new TextRun({ text: s.narrative, italics: true, size: 22, color: hex6(theme.inkMuted), font: theme.docFontSans })],
		}),
	]
}

function sources(s: RenderSlide, theme: ExportTheme): Paragraph[] {
	// No external source → no footer (internal provenance is not shown to readers).
	if (s.citations.length === 0) return []
	const label = new Paragraph({
		spacing: { before: 240, after: 60 },
		border: { top: { style: BorderStyle.SINGLE, size: 4, color: hex6(theme.rule) } },
		children: [new TextRun({ text: 'SOURCES', bold: true, size: 16, color: hex6(theme.inkFaint), font: theme.docFontSans, characterSpacing: 20 })],
	})
	const lines = s.citations.map(
		(c) =>
			new Paragraph({
				spacing: { after: 40 },
				children: [
					new TextRun({ text: `${c.ref}:  `, size: 18, color: hex6(theme.inkFaint), font: theme.docFontSans }),
					new ExternalHyperlink({
						link: c.url,
						children: [new TextRun({ text: c.domain, size: 18, color: hex6(s.accent), font: theme.docFontSans, underline: {} })],
					}),
					new TextRun({ text: `   (${c.url})`, size: 14, color: hex6(theme.inkFaint), font: theme.docFontSans }),
				],
			}),
	)
	return [label, ...lines]
}

function subtitle(s: RenderSlide, theme: ExportTheme): Paragraph[] {
	if (!s.subtitle) return []
	return [
		new Paragraph({
			spacing: { before: 120 },
			children: [new TextRun({ text: s.subtitle, size: 28, color: hex6(theme.inkMuted), font: theme.docFontSans })],
		}),
	]
}

function slideParagraphs(s: RenderSlide, theme: ExportTheme, isLast: boolean): Paragraph[] {
	const out: Paragraph[] = [
		eyebrow(s, theme),
		title(s, theme),
		...subtitle(s, theme),
		...bullets(s, theme),
		...narrative(s, theme),
		...sources(s, theme),
	]
	if (!isLast) out.push(new Paragraph({ children: [new PageBreak()] }))
	return out
}

export async function renderDeckDocx(
	deck: RenderDeck,
	theme: ExportTheme = lightExportTheme,
): Promise<Buffer> {
	const children: Paragraph[] = []
	deck.slides.forEach((s, i) => {
		children.push(...slideParagraphs(s, theme, i === deck.slides.length - 1))
	})

	const doc = new Document({
		creator: 'Lemma',
		title: deck.meta.title,
		sections: [
			{
				properties: {
					page: {
						size: { orientation: 'landscape', width: convertInchesToTwip(11), height: convertInchesToTwip(8.5) },
						margin: { top: convertInchesToTwip(0.8), bottom: convertInchesToTwip(0.8), left: convertInchesToTwip(1), right: convertInchesToTwip(1) },
					},
				},
				children,
			},
		],
	})

	return Packer.toBuffer(doc)
}

// Re-exported for callers that want a default alignment constant, etc.
export { AlignmentType }
