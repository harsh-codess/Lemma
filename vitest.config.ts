import path from 'node:path'
import { defineConfig } from 'vitest/config'

// Mirrors the tsconfig "@/*" alias so route tests can import app code.
export default defineConfig({
	resolve: {
		alias: {
			'@': path.resolve(__dirname),
		},
	},
	test: {
		environment: 'node',
	},
})
