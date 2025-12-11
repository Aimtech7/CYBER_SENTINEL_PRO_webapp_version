import { mitreFromText, mitreFromPorts } from '../lib/mitre'

test('mitreFromText returns tags for port scan text', () => {
  const tags = mitreFromText('Port scan detected on 192.168.1.10')
  expect(Array.isArray(tags)).toBe(true)
})

test('mitreFromPorts yields tags', () => {
  const tags = mitreFromPorts([22, 80, 443])
  expect(Array.isArray(tags)).toBe(true)
})
