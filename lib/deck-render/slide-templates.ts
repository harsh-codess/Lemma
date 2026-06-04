import type { RenderSlide } from './render-model'
import { type ExportTheme, lightExportTheme } from './theme'

/**
 * ─── HTML Slide Templates ────────────────────────────────────────────────────
 *
 * Pure slide → HTML. Theme-parameterized so the SAME templates can render the
 * print/PDF deck (light theme) and, later, the interactive web review view
 * (a dark theme) — no PDF/Puppeteer concerns leak in here. The PDF renderer
 * (render-pdf.ts) is the only glue that turns this HTML into a file.
 */

export function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
}

/** The grounding footer — sources MUST be visible for sourceUrl-bearing claims. */
function citationsHtml(slide: RenderSlide): string {
	// No external source → no footer. (Internal provenance counts are not shown
	// on the investor-facing deck.)
	if (slide.citations.length === 0) return ''
	const items = slide.citations
		.map(
			(c) =>
				`<li><span class="src-ref">${escapeHtml(c.ref)}</span><a href="${escapeHtml(c.url)}">${escapeHtml(c.domain)}</a></li>`,
		)
		.join('')
	return `<div class="sources"><div class="sources-label">Sources</div><ul>${items}</ul></div>`
}

function bulletsHtml(slide: RenderSlide): string {
	if (slide.bullets.length === 0) return ''
	const items = slide.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')
	return `<ul class="bullets">${items}</ul>`
}

function narrativeHtml(slide: RenderSlide): string {
	return slide.narrative.trim() ? `<p class="narrative">${escapeHtml(slide.narrative)}</p>` : ''
}

function coverSlide(slide: RenderSlide): string {
	return `
  <section class="slide slide--cover" style="--accent:${slide.accent}">
    <div class="cover-inner">
      <div class="eyebrow">${escapeHtml(slide.label)}</div>
      <h1 class="cover-title">${escapeHtml(slide.title)}</h1>
      ${slide.subtitle ? `<p class="cover-subtitle">${escapeHtml(slide.subtitle)}</p>` : ''}
      <div class="cover-rule"></div>
    </div>
  </section>`
}

function contentSlide(slide: RenderSlide): string {
	// Only reserve bottom space for the footer when this slide actually has sources.
	const sourced = slide.citations.length > 0 ? ' slide--sourced' : ''
	return `
  <section class="slide slide--${slide.layout}${sourced}" style="--accent:${slide.accent}">
    <div class="slide-head">
      <div class="eyebrow">${escapeHtml(slide.label)}</div>
      <div class="slide-no">${slide.order}</div>
    </div>
    <h2 class="slide-title">${escapeHtml(slide.title)}</h2>
    <div class="slide-body">
      ${bulletsHtml(slide)}
      ${narrativeHtml(slide)}
    </div>
    ${citationsHtml(slide)}
  </section>`
}

/** One slide → HTML. Reusable by the PDF deck and a future web review view. */
export function renderSlideHtml(slide: RenderSlide): string {
	return slide.layout === 'cover' ? coverSlide(slide) : contentSlide(slide)
}

/** The stylesheet for the slide templates, parameterized by theme. */
export function slideStylesheet(theme: ExportTheme = lightExportTheme): string {
	return `
  :root {
    --page-bg: ${theme.pageBg};
    --slide-bg: ${theme.slideBg};
    --ink: ${theme.ink};
    --ink-muted: ${theme.inkMuted};
    --ink-faint: ${theme.inkFaint};
    --rule: ${theme.rule};
    --font-sans: ${theme.fontSans};
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--page-bg); font-family: var(--font-sans); color: var(--ink); -webkit-font-smoothing: antialiased; }
  .slide {
    position: relative;
    width: 1280px;
    height: 720px;
    background: var(--slide-bg);
    padding: 72px 96px 60px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    page-break-after: always;
    border-left: 12px solid var(--accent);
  }
  /* sourced slides reserve bottom space for the pinned sources footer;
     unsourced slides keep that space for body content so nothing clips */
  .slide--sourced { padding-bottom: 128px; }
  .slide:last-child { page-break-after: auto; }
  .eyebrow {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .slide-head { display: flex; justify-content: space-between; align-items: baseline; }
  .slide-no { font-size: 17px; font-weight: 600; color: var(--ink-faint); }
  .slide-title { font-size: 42px; line-height: 1.07; font-weight: 800; margin: 16px 0 4px; letter-spacing: -0.015em; max-width: 32ch; }
  /* body flexes in the area ABOVE the reserved footer zone; clips if absurdly long so the footer is never pushed off */
  .slide-body { flex: 1 1 auto; min-height: 0; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-start; margin-top: 18px; }
  .bullets { list-style: none; display: flex; flex-direction: column; gap: 12px; }
  .bullets li {
    position: relative;
    padding-left: 30px;
    font-size: 21px;
    line-height: 1.28;
    color: var(--ink);
    max-width: 54ch;
  }
  .bullets li::before {
    content: ""; position: absolute; left: 0; top: 8px;
    width: 12px; height: 12px; border-radius: 3px; background: var(--accent);
  }
  /* narrative is clamped so it can never overflow into the sources footer,
     always ending cleanly with an ellipsis if longer. Sourced slides have
     less body height (footer reserve), so they clamp to 2 lines — keeping the
     ellipsis on a visible line — while unsourced slides allow 3. */
  .narrative {
    margin-top: 16px;
    font-size: 16px;
    line-height: 1.34;
    color: var(--ink-muted);
    font-style: italic;
    max-width: 70ch;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .slide--sourced .narrative { -webkit-line-clamp: 2; }
  /* statement layout: fewer, bigger bullets */
  .slide--statement .slide-title { font-size: 48px; }
  .slide--statement .bullets li { font-size: 24px; }
  /* team layout: tighter list for roles */
  .slide--team .bullets li { font-size: 20px; }
  .slide--team .bullets { gap: 10px; }
  /* ask layout: emphasized */
  .slide--ask .slide-title { color: var(--accent); }

  /* sources / grounding footer — pinned to the bottom so it is ALWAYS visible */
  .sources {
    position: absolute;
    left: 96px; right: 96px; bottom: 44px;
    padding-top: 14px;
    border-top: 1px solid var(--rule);
  }
  .sources-label { font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 7px; }
  .sources ul { list-style: none; display: flex; flex-wrap: wrap; gap: 6px 20px; }
  .sources li { font-size: 15px; color: var(--ink-muted); display: flex; align-items: baseline; gap: 7px; }
  .src-ref { font-family: ${theme.fontMono}; font-size: 12px; color: var(--ink-faint); background: var(--page-bg); padding: 2px 6px; border-radius: 4px; }
  .sources a { color: var(--accent); text-decoration: none; font-weight: 600; }

  /* cover */
  .slide--cover { justify-content: center; border-left-width: 12px; }
  .cover-inner { max-width: 40ch; }
  .cover-title { font-size: 72px; line-height: 1.05; font-weight: 800; letter-spacing: -0.02em; margin-top: 14px; }
  .cover-subtitle { font-size: 26px; color: var(--ink-muted); margin-top: 20px; }
  .cover-rule { width: 120px; height: 6px; background: var(--accent); margin-top: 36px; border-radius: 3px; }
  `
}
