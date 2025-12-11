import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'

async function vt(path: string) {
  const key = process.env.VT_API_KEY
  if (!key) return { error: 'missing_key' }
  const r = await fetch(`https://www.virustotal.com/api/v3${path}`, { headers: { 'x-apikey': key } })
  const j = await r.json()
  return j
}

export async function POST(req: NextRequest) {
  const b = await req.json()
  const items: Array<{ type: string; value: string }> = Array.isArray(b.items) ? b.items : []
  const out: any[] = []
  for (const it of items) {
    const type = String(it.type || 'domain')
    const value = String(it.value || '')
    if (!value) continue
    let path = ''
    if (type === 'domain') path = `/domains/${value}`
    else if (type === 'ip') path = `/ip_addresses/${value}`
    else if (type === 'hash') path = `/files/${value}`
    else path = `/domains/${value}`
    const res = await vt(path)
    out.push({ type, value, res })
  }
  return NextResponse.json({ out })
}
