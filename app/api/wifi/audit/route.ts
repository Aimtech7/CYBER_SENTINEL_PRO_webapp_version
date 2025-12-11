import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const b = await req.json()
  try {
    const savedUrl = await getConfig('agent_url')
    const savedToken = await getConfig('agent_token')
    const url = savedUrl || process.env.AGENT_URL || ''
    const token = savedToken || process.env.AGENT_TOKEN || ''
    if (!url || !token) return NextResponse.json({ error: 'not paired' }, { status: 400 })
    const r = await fetch(url + '/wifi/audit', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(b) })
    const j = await r.json()
    return NextResponse.json(j)
  } catch (e) {
    return NextResponse.json({ error: 'audit_failed' }, { status: 500 })
  }
}
