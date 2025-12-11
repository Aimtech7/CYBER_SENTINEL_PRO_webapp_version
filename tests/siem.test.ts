import { POST as Analyze } from '../app/api/siem/analyze/route'
import { jsonRequest } from './helpers'

test('SIEM analyzes failed logins', async () => {
  const r = await Analyze(jsonRequest('/api/siem/analyze', { logs: 'Failed login for user admin' }))
  const j = await (r as any).json()
  expect(Array.isArray(j.findings)).toBe(true)
})
