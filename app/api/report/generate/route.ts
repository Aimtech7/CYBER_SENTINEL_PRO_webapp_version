import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { wifi, nids, devices, web, summary } = await req.json()
  const lines: string[] = []
  lines.push(`# Cyber Sentinel Pro - Security Report`)
  lines.push(`\n## Summary\n${summary || ''}`)
  if (wifi) lines.push(`\n## Wi-Fi Audit\nScore: ${wifi.score} (${wifi.grade})\nEncryption: ${wifi.encryption} (${wifi.cipher})\nWPS: ${wifi.wps_enabled}\nAdmin HTTP: ${wifi.admin_over_http}\nDevices: ${(wifi.devices||[]).length}`)
  if (nids) lines.push(`\n## NIDS Alerts\n${JSON.stringify(nids)}`)
  if (devices) lines.push(`\n## Devices\n${JSON.stringify(devices)}`)
  if (web) lines.push(`\n## Web Security\n${JSON.stringify(web)}`)
  const md = lines.join('\n')
  return NextResponse.json({ markdown: md })
}
