import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db'
export const runtime = 'nodejs'

const hits: Record<string, { c: number; ts: number }> = {}
const WINDOW_MS = 10000
const MAX_REQ = 10

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(()=>({})) as any
  const { path, method, body } = payload
  const now = Date.now()
  const k = String(path || '/')
  const h = hits[k]
  if (!h || now - h.ts > WINDOW_MS) hits[k] = { c: 1, ts: now }
  else {
    h.c += 1
    if (h.c > MAX_REQ) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }
  const savedUrl = await getConfig('agent_url')
  const savedToken = await getConfig('agent_token')
  const url = savedUrl || process.env.AGENT_URL || ''
  const token = savedToken || process.env.AGENT_TOKEN || ''
  if (!url || !token) return NextResponse.json({ error: 'not paired' }, { status: 400 })
  try {
    const r = await fetch(`${url}${path}`, {
      method: method || 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    })
    const j = await r.json().catch(()=>({ ok: true }))
    return NextResponse.json(j, { status: r.status })
  } catch (e) {
    return NextResponse.json({ error: 'agent error' }, { status: 500 })
  }
}
