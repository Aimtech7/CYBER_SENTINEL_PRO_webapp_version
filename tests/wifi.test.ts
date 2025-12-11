import { gradeColor, summarize, type WifiAudit } from '../lib/wifiAudit'

test('gradeColor maps correctly', () => {
  expect(gradeColor('A+')).toBeDefined()
  expect(gradeColor('F')).toBeDefined()
})

test('summarize produces lines', () => {
  const a: WifiAudit = {
    gateway: '192.168.1.1', encryption: 'WPA2-Personal', cipher: 'CCMP', wps_enabled: false, admin_over_http: false, basic_auth_challenge: false, firmware_header: 'Server: RouterOS', password_entropy_bits: 80, devices: [], score: 85, grade: 'B'
  }
  const s = summarize(a)
  expect(s.includes('Gateway')).toBe(true)
})
