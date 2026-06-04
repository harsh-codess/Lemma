import type { FactRef, PitchSlide, PitchSlideType } from '../agents/types'
import { SLIDE_ACCENTS } from './theme'
import { formatCurrencyInText } from './currency'

/**
 * ─── Render Model ────────────────────────────────────────────────────────────
 *
 * The neutral intermediate that ALL three exporters (PDF/PPTX/DOCX) consume.
 * The validated deck JSON (DeckData.slides) is normalized once into a RenderDeck;
 * every format renders from the same RenderSlide objects, so they cannot disagree
 * on content, ordering, or which claims show a source.
 */

export type LayoutKind = 'cover' | 'statement' | 'detail' | 'market' | 'team' | 'ask'

/** A visible source for a grounded claim — derived from a factRef's sourceUrl. */
export interface RenderCitation {
	ref: string // upstream origin, e.g. "market.tam"
	url: string
	domain: string
}

export interface RenderSlide {
	order: number
	type: PitchSlideType | 'COVER'
	layout: LayoutKind
	label: string // eyebrow label, e.g. "MARKET"
	accent: string // hex with '#'
	title: string
	subtitle?: string // cover only
	bullets: string[]
	narrative: string // '' if none
	citations: RenderCitation[] // sourceUrl-bearing refs — MUST be shown on the artifact
	upstreamRefCount: number // total factRefs (provenance signal)
}

export interface RenderDeckMeta {
	title: string
	subtitle?: string
}

export interface RenderDeck {
	meta: RenderDeckMeta
	slides: RenderSlide[]
}

const LAYOUT_BY_TYPE: Record<PitchSlideType, LayoutKind> = {
	PROBLEM: 'statement',
	SOLUTION: 'statement',
	TECHNOLOGY: 'detail',
	MARKET: 'market',
	READINESS: 'detail',
	FEASIBILITY: 'team',
	TEAM: 'team',
	ASK: 'ask',
}

const LABEL_BY_TYPE: Record<PitchSlideType, string> = {
	PROBLEM: 'The Problem',
	SOLUTION: 'The Solution',
	TECHNOLOGY: 'Technology',
	MARKET: 'Market Opportunity',
	READINESS: 'Readiness',
	FEASIBILITY: 'Feasibility',
	TEAM: 'Team',
	ASK: 'The Ask',
}

export function domainOf(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, '')
	} catch {
		return url.replace(/^https?:\/\//, '').split('/')[0]
	}
}

/**
 * The grounding that MUST appear on the artifact: every factRef carrying a
 * sourceUrl (market figures / competitor / signal claims), deduped by URL.
 * Empty-factRef slides and refs without a sourceUrl produce no citation.
 */
export function citationsForSlide(factRefs: FactRef[]): RenderCitation[] {
	const seen = new Set<string>()
	const out: RenderCitation[] = []
	for (const fr of factRefs) {
		const url = (fr.sourceUrl ?? '').trim()
		if (!url) continue
		if (seen.has(url)) continue
		seen.add(url)
		out.push({ ref: fr.ref, url, domain: domainOf(url) })
	}
	return out
}

function toRenderSlide(slide: PitchSlide, order: number): RenderSlide {
	return {
		order,
		type: slide.slideType,
		layout: LAYOUT_BY_TYPE[slide.slideType],
		label: LABEL_BY_TYPE[slide.slideType],
		accent: SLIDE_ACCENTS[slide.slideType],
		title: formatCurrencyInText(slide.title),
		// Raw rupee figures → crore display, applied once here so every format agrees.
		bullets: slide.bullets.map(formatCurrencyInText),
		narrative: formatCurrencyInText(slide.narrative ?? ''),
		citations: citationsForSlide(slide.factRefs ?? []),
		upstreamRefCount: (slide.factRefs ?? []).length,
	}
}

/**
 * Normalize validated deck slides into a RenderDeck. Prepends a generated
 * cover (the "title" layout) from project metadata, then maps each pitch
 * slide in order. Pure — no I/O.
 */
export function buildRenderDeck(slides: PitchSlide[], meta: RenderDeckMeta): RenderDeck {
	const ordered = [...slides].sort((a, b) => a.order - b.order)

	const cover: RenderSlide = {
		order: 0,
		type: 'COVER',
		layout: 'cover',
		label: 'Commercialization Brief',
		accent: SLIDE_ACCENTS.COVER,
		title: meta.title,
		subtitle: meta.subtitle,
		bullets: [],
		narrative: '',
		citations: [],
		upstreamRefCount: 0,
	}

	return {
		meta,
		slides: [cover, ...ordered.map((s, i) => toRenderSlide(s, i + 1))],
	}
}
