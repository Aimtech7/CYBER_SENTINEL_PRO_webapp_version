export type WifiAudit = {
  gateway: string
  encryption: string
  cipher: string
  wps_enabled: boolean
  admin_over_http: boolean
  basic_auth_challenge: boolean
  firmware_header: string
  password_entropy_bits: number
  devices: Array<{ ip: string; mac: string; type: string; open_ports: number[]; hostname?: string | null; factory_default?: boolean }>
  score: number
  grade: 'A+'|'B'|'C'|'D'|'F'
}

export function gradeColor(g: WifiAudit['grade']) {
  if (g === 'A+') return 'text-teal-300'
  if (g === 'B') return 'text-teal-200'
  if (g === 'C') return 'text-warning'
  if (g === 'D') return 'text-warning'
  return 'text-danger'
}

export function summarize(a: WifiAudit) {
  const lines: string[] = []
  lines.push(`Gateway: ${a.gateway}`)
  lines.push(`Encryption: ${a.encryption} (${a.cipher})`)
  lines.push(`WPS Enabled: ${a.wps_enabled ? 'Yes' : 'No'}`)
  lines.push(`Admin over HTTP: ${a.admin_over_http ? 'Yes' : 'No'}`)
  lines.push(`Basic Auth Challenge: ${a.basic_auth_challenge ? 'Yes' : 'No'}`)
  lines.push(`Password entropy bits: ${Math.round(a.password_entropy_bits)}`)
  const exposed = a.devices.filter(d => (d.open_ports||[]).length)
  lines.push(`Devices: ${a.devices.length}, exposed: ${exposed.length}`)
  return lines.join('\n')
}
