import { NextRequest, NextResponse } from 'next/server'
import { mitreFromText } from '@/lib/mitre'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { logs } = await req.json()
  const lines = String(logs || '').split(/\r?\n/).filter(Boolean)
  const findings: Array<{ type: string; line: string }> = []
  for (const l of lines) {
    const s = l.toLowerCase()
    if (s.includes('failed login') || s.includes('authentication failed')) findings.push({ type: 'failed_login', line: l })
    if (s.includes('port scan') || s.includes('nmap')) findings.push({ type: 'port_scan', line: l })
    if (s.includes('suspicious') || s.includes('malware')) findings.push({ type: 'suspicious', line: l })
  }
  const tags = mitreFromText(logs || '')
  return NextResponse.json({ findings, mitre: tags })
}
