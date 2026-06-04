import { z } from 'zod'
import { SchemaType, type ResponseSchema } from '@google/generative-ai'

/**
 * ─── Zod → Gemini responseSchema converter ──────────────────────────────────
 *
 * Gemini's native structured output takes an OpenAPI 3.0 schema subset and
 * constrains generation to it — the model physically cannot return fenced
 * markdown or malformed JSON. Each agent passes its Zod validator through
 * this converter so the same schema drives both generation and validation.
 *
 * Gemini's subset does NOT support: minLength/maxLength, minimum/maximum,
 * minItems/maxItems, pattern, default, or unions (anyOf). Those constraints
 * are stripped here — they are still enforced by the Zod safeParse that runs
 * on every agent response, which stays as the source of truth.
 */
export function zodToGeminiSchema(schema: z.ZodType): ResponseSchema {
	const jsonSchema = z.toJSONSchema(schema, { io: 'output' }) as JsonSchemaNode
	return sanitize(jsonSchema) as unknown as ResponseSchema
}

type JsonSchemaNode = Record<string, unknown>

function sanitize(node: JsonSchemaNode): JsonSchemaNode {
	// Nullable union (e.g. z.string().nullable()) → Gemini's `nullable` flag.
	// Any other union: Gemini has no support — fall back to the first branch.
	if (Array.isArray(node.anyOf) && node.anyOf.length > 0) {
		const branches = node.anyOf as JsonSchemaNode[]
		const nonNull = branches.filter((b) => b.type !== 'null')
		const out = sanitize(nonNull[0] ?? { type: 'string' })
		if (nonNull.length < branches.length) out.nullable = true
		return out
	}

	// type: ['string', 'null'] form of nullability
	if (Array.isArray(node.type)) {
		const types = node.type as string[]
		const nonNull = types.filter((t) => t !== 'null')
		const out = sanitize({ ...node, type: nonNull[0] ?? 'string' })
		if (nonNull.length < types.length) out.nullable = true
		return out
	}

	const out: JsonSchemaNode = {}
	if (typeof node.description === 'string') out.description = node.description

	if (Array.isArray(node.enum)) {
		out.type = SchemaType.STRING
		out.enum = node.enum
		return out
	}

	switch (node.type) {
		case 'object': {
			out.type = SchemaType.OBJECT
			const properties = (node.properties ?? {}) as Record<string, JsonSchemaNode>
			out.properties = Object.fromEntries(
				Object.entries(properties).map(([key, value]) => [key, sanitize(value)]),
			)
			if (Array.isArray(node.required) && node.required.length > 0) {
				out.required = node.required
			}
			break
		}
		case 'array': {
			out.type = SchemaType.ARRAY
			if (node.items) out.items = sanitize(node.items as JsonSchemaNode)
			break
		}
		case 'integer':
			out.type = SchemaType.INTEGER
			break
		case 'number':
			out.type = SchemaType.NUMBER
			break
		case 'boolean':
			out.type = SchemaType.BOOLEAN
			break
		default:
			out.type = SchemaType.STRING
	}

	return out
}
