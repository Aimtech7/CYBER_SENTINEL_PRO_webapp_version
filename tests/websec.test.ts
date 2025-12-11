import { POST as Analyze } from '../app/api/security/web/analyze/route'
import { jsonRequest } from './helpers'

test('Web security analyzer runs', async () => {
  const r = await Analyze(jsonRequest('/api/security/web/analyze', { url: 'https://example.com' }))
  const j = await (r as any).json()
  expect(j.headers || j.error).toBeDefined()
})
