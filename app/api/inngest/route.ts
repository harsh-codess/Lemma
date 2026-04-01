import { serve } from 'inngest/next'
import { inngest, analyzePaper } from '@/lib/inngest'

export const { GET, POST, PUT } = serve({
	client: inngest,
	functions: [analyzePaper],
})
