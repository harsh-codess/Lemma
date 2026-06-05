/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		// @sparticuz/chromium ships its Chromium binary in bin/ and resolves it
		// relative to its own module path at runtime. Bundling relocates the JS
		// and strips bin/ ("input directory .../chromium/bin does not exist" on
		// Vercel) — keep it external so the whole package, binary included, is
		// file-traced into the function as-is. puppeteer-core likewise.
		serverComponentsExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
		outputFileTracingIncludes: {
			'/api/projects/[id]/export': ['./node_modules/@sparticuz/chromium/bin/**'],
		},
	},
	webpack(config) {
		// Grab the existing rule that handles SVG imports
		const fileLoaderRule = config.module.rules.find((rule) =>
			rule.test?.test?.('.svg'),
		)

		config.module.rules.push(
			// Reapply the existing rule, but only for svg imports ending in ?url
			{
				...fileLoaderRule,
				test: /\.svg$/i,
				resourceQuery: /url/, // *.svg?url
			},
			// Convert all other *.svg imports to React components
			{
				test: /\.svg$/i,
				issuer: fileLoaderRule.issuer,
				resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] },
				use: ['@svgr/webpack'],
			},
		)

		// Modify the file loader rule to ignore *.svg, since we have it handled now.
		fileLoaderRule.exclude = /\.svg$/i

		return config
	},
}

export default nextConfig
