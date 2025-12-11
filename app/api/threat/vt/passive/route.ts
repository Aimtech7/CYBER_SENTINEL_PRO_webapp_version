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
  const type = String(b.type || 'domain')
  const value = String(b.value || '')
  if (!value) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  let path = ''
  if (type === 'domain') path = `/domains/${value}/resolutions`
  else if (type === 'ip') path = `/ip_addresses/${value}/resolutions`
  else path = `/domains/${value}/resolutions`
  const res = await vt(path)
  return NextResponse.json(res)
}
