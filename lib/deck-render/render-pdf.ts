import puppeteer from 'puppeteer-core'
import type { RenderDeck } from './render-model'
import { renderDeckHtml } from './deck-html'
import { type ExportTheme, lightExportTheme } from './theme'

/**
 * ─── PDF Renderer ────────────────────────────────────────────────────────────
 *
 * HTML → PDF via puppeteer-core. Serverless-safe: in a Linux/serverless runtime
 * it uses the @sparticuz/chromium binary (small, Cloud-Run-friendly — NOT the
 * full puppeteer Chromium download). Locally it uses a system Chrome so the
 * Linux-only sparticuz binary isn't needed on macOS/Windows.
 *
 * Resolution order for the Chrome executable:
 *   1. CHROME_EXECUTABLE_PATH env (explicit override)
 *   2. on Linux: @sparticuz/chromium.executablePath()
 *   3. platform default (macOS / Windows local Chrome)
 *
 * This file is the ONLY Puppeteer glue; the slide markup lives in the template
 * layer and is reused by the web review view.
 */

const LOCAL_CHROME: Record<string, string[]> = {
	darwin: [
		'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
		'/Applications/Chromium.app/Contents/MacOS/Chromium',
		'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
	],
	win32: [
		'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
		'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
	],
	linux: ['/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium'],
}

interface LaunchConfig {
	executablePath: string
	args: string[]
	headless: boolean | 'shell'
}

async function resolveLaunchConfig(): Promise<LaunchConfig> {
	const override = process.env.CHROME_EXECUTABLE_PATH?.trim()
	const isLinux = process.platform === 'linux'

	// Serverless / Linux: use the bundled sparticuz Chromium.
	if (isLinux && !override) {
		const chromium = (await import('@sparticuz/chromium')).default
		return {
			executablePath: await chromium.executablePath(),
			args: chromium.args,
			headless: true,
		}
	}

	// Local dev / proof: explicit override, else first existing system Chrome.
	const { existsSync } = await import('fs')
	const candidates = override
		? [override]
		: LOCAL_CHROME[process.platform] ?? LOCAL_CHROME.linux
	const executablePath = candidates.find((p) => existsSync(p))
	if (!executablePath) {
		throw new Error(
			`No Chrome executable found for platform "${process.platform}". Set CHROME_EXECUTABLE_PATH or install Google Chrome.`,
		)
	}
	return {
		executablePath,
		args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
		headless: true,
	}
}

export async function renderDeckPdf(
	deck: RenderDeck,
	theme: ExportTheme = lightExportTheme,
): Promise<Buffer> {
	const html = renderDeckHtml(deck, theme)
	const cfg = await resolveLaunchConfig()

	const browser = await puppeteer.launch({
		executablePath: cfg.executablePath,
		args: cfg.args,
		headless: cfg.headless,
	})
	try {
		const page = await browser.newPage()
		// Inline HTML with system fonts only — no external resources to await.
		await page.setContent(html, { waitUntil: 'load' })
		const pdf = await page.pdf({
			width: '1280px',
			height: '720px',
			printBackground: true,
			preferCSSPageSize: true,
			// Tagged PDF emits link annotations for <a> tags, so the source
			// citations are clickable in the PDF as they are in PPTX/DOCX.
			tagged: true,
		})
		return Buffer.from(pdf)
	} finally {
		await browser.close()
	}
}
