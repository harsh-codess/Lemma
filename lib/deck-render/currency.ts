/**
 * ─── Currency Formatting ─────────────────────────────────────────────────────
 *
 * The agents store capital as raw rupee integers (feasibility.capitalEstimate),
 * which leak into deck text as "₹120000000-350000000"; the LLM also sometimes
 * writes mixed forms like "₹120M to ₹350M". This helper rewrites any ₹ amount
 * into the Indian crore convention ("₹12–35 Cr") for display. Value unchanged —
 * display only.
 *
 * Used once in render-model.ts so PDF, PPTX, and DOCX all show the same string.
 *
 * Safe by construction:
 *   - Only matches numbers anchored to a ₹ sign (so years, TRL levels, BLEU
 *     scores, and $-denominated market sizes are never touched).
 *   - A bare ₹ number with no unit is only converted when it's a large raw
 *     amount (≥ ₹10 lakh) — small bare figures like "₹5 / token" are left.
 *   - Idempotent: re-running on "₹12–35 Cr" yields "₹12–35 Cr".
 */

const CRORE = 10_000_000
const MIN_RAW = 1_000_000 // only convert *unit-less* amounts ≥ ₹10 lakh

// unit (longest-first so "crore" wins over "Cr", "million" over "M"). The
// whitespace is folded INSIDE the optional unit group so a unit-less amount
// never swallows its trailing space ("₹12–35 Cr (medium)" keeps the space).
// The trailing (?![A-Za-z]) stops a unit letter from matching inside a
// following word — so "₹120 Marketing" never reads "M" as millions.
const UNIT = '(?:\\s*(crores?|crore|Cr|CR|cr|lakhs?|lakh|L|million|Million|M|mn|billion|Billion|bn|B))?'
const NUM = '([\\d,]+(?:\\.\\d+)?)'
const SEP = '(?:-|–|—|to\\b)'
const NB = '(?![A-Za-z])'
const RUPEE_RE = new RegExp(`₹\\s*${NUM}${UNIT}${NB}(?:\\s*${SEP}\\s*₹?\\s*${NUM}${UNIT}${NB})?`, 'g')

function toNumber(raw: string): number {
	return parseFloat(raw.replace(/,/g, ''))
}

function unitMultiplier(unit: string | undefined): number | null {
	if (!unit) return null
	const u = unit.toLowerCase()
	if (u.startsWith('cr')) return CRORE
	if (u.startsWith('lakh') || u === 'l') return 100_000
	if (u.startsWith('million') || u === 'm' || u === 'mn') return 1_000_000
	if (u.startsWith('billion') || u === 'b' || u === 'bn') return 1_000_000_000
	return null
}

/** Rupees → crore display, integer when whole, else one decimal. */
function toCrore(rupees: number): string {
	const v = rupees / CRORE
	const rounded = Math.round(v * 10) / 10
	return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

export function formatCurrencyInText(text: string): string {
	return text.replace(RUPEE_RE, (match, numA: string, unitA: string | undefined, numB: string | undefined, unitB: string | undefined) => {
		const isRange = numB !== undefined
		// In a range, a unit on one side applies to both ("₹12–35 Cr", "₹120M-350M").
		const ua = unitA ?? (isRange ? unitB : undefined)
		const ub = unitB ?? unitA

		const multA = unitMultiplier(ua)
		// Leave unit-less small figures alone (only matters when nothing has a unit).
		if (multA === null && !isRange) {
			const an = toNumber(numA)
			if (!Number.isFinite(an) || an < MIN_RAW) return match
		}

		const rupeesA = toNumber(numA) * (multA ?? 1)
		if (!Number.isFinite(rupeesA)) return match

		if (isRange) {
			const multB = unitMultiplier(ub)
			// If neither side has a unit, both are raw; require at least one large.
			if (multA === null && multB === null) {
				const an = toNumber(numA)
				const bn = toNumber(numB as string)
				if (an < MIN_RAW && bn < MIN_RAW) return match
			}
			const rupeesB = toNumber(numB as string) * (multB ?? 1)
			if (!Number.isFinite(rupeesB)) return `₹${toCrore(rupeesA)} Cr`
			return `₹${toCrore(rupeesA)}–${toCrore(rupeesB)} Cr`
		}

		return `₹${toCrore(rupeesA)} Cr`
	})
}
