import { config } from 'dotenv'
config({ path: '../.env.local' })

async function main() {
  const key = process.env.GEMINI_API_KEY
  if (!key) { console.error('GEMINI_API_KEY not set'); process.exit(1) }

  const ids: string[] = []
  let pageToken = ''
  do {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=1000${pageToken ? `&pageToken=${pageToken}` : ''}`
    const res = await fetch(url)
    if (!res.ok) { console.error(`List failed: ${res.status} ${res.statusText}`, (await res.text()).slice(0,300)); process.exit(1) }
    const data = await res.json() as { models?: any[], nextPageToken?: string }
    for (const m of data.models ?? []) {
      const id = (m.name ?? '').replace(/^models\//, '')
      const methods = (m.supportedGenerationMethods ?? []).join(',')
      if (methods.includes('generateContent')) ids.push(id)
    }
    pageToken = data.nextPageToken ?? ''
  } while (pageToken)

  ids.sort()
  console.log(`\n${ids.length} models support generateContent:\n`)
  for (const id of ids) console.log('  ' + id)

  console.log('\n── Models referenced by the task / config (presence check) ──')
  for (const want of ['gemini-3-pro','gemini-3.5-flash','gemini-3.1-flash-lite','gemini-2.5-flash','gemini-2.0-flash','gemini-2.0-pro']) {
    console.log(`  ${ids.includes(want) ? '✅' : '❌'} ${want}`)
  }
}
main().catch(e => { console.error(e); process.exit(1) })
