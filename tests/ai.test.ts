import { POST as Chat } from '../app/api/ai/chat/route'
import { POST as Summary } from '../app/api/ai/summary/route'
import { jsonRequest } from './helpers'

test('AI chat returns text even without key', async () => {
  const r = await Chat(jsonRequest('/api/ai/chat', { query: 'Explain event', data: 'Port scan' }))
  const j = await (r as any).json()
  expect(typeof j.text).toBe('string')
  expect(j.text.length).toBeGreaterThan(0)
})

test('AI summary returns text even without key', async () => {
  const r = await Summary(jsonRequest('/api/ai/summary', { title: 'Network', content: 'Scanning detected' }))
  const j = await (r as any).json()
  expect(typeof j.text).toBe('string')
  expect(j.text.length).toBeGreaterThan(0)
})
