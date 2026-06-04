import type { PitchSlideType } from '../agents/types'

/**
 * ─── Export Theme ────────────────────────────────────────────────────────────
 *
 * The dark Lemma theme (globals.css, #08090a) is for the on-screen web review.
 * Exported files (PDF/PPTX/DOCX) are projector- and print-legible: dark ink on
 * a light slide, high contrast, echoing the Lemma brand accent (indigo #5e6ad2).
 *
 * Colors are stored WITH the leading '#'. PPTX/DOCX want bare hex — use hex6().
 */

export interface ExportTheme {
	pageBg: string
	slideBg: string
	ink: string
	inkMuted: string
	inkFaint: string
	rule: string
	accentFallback: string
	fontSans: string
	fontMono: string
	/** PPTX/DOCX use installed fonts; Inter isn't guaranteed there. */
	docFontSans: string
}

export const lightExportTheme: ExportTheme = {
	pageBg: '#F4F5F8',
	slideBg: '#FFFFFF',
	ink: '#0D0E12',
	inkMuted: '#4A4D57',
	inkFaint: '#8A8D98',
	rule: '#E2E4EA',
	accentFallback: '#5E6AD2',
	fontSans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
	fontMono: "'SFMono-Regular', 'Menlo', monospace",
	docFontSans: 'Arial',
}

/** Per-slide-type accent. Each is dark enough to print legibly on white. */
export const SLIDE_ACCENTS: Record<PitchSlideType | 'COVER', string> = {
	COVER: '#5E6AD2', // brand indigo
	PROBLEM: '#C0392B', // deep red — the pain
	SOLUTION: '#5E6AD2', // brand indigo
	TECHNOLOGY: '#2F6FDB', // blue
	MARKET: '#1F8A5B', // green — market/money
	READINESS: '#9A6A00', // amber — status/readiness
	FEASIBILITY: '#6B4FB8', // purple
	TEAM: '#2F6FDB', // blue
	ASK: '#5E6AD2', // brand indigo
}

/** Strip the leading '#' for libraries (pptxgenjs, docx) that want bare hex. */
export function hex6(color: string): string {
	return color.replace(/^#/, '').toUpperCase()
}
