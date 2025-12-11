import { POST as Proxy } from '../app/api/agent/proxy/route'

function req(body: any) {
  return new Request('http://localhost/api/agent/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) as any
}

test('Proxy returns not paired when missing config', async () => {
  const r = await Proxy(req({ path: '/health', method: 'GET' }))
  const j = await (r as any).json()
  expect(j.error).toBeDefined()
})
