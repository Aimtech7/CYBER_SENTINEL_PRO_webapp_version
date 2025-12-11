import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'

function headers(key: string | undefined) {
  if (!key) return undefined
  return { 'x-apikey': key }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const type = body.type as string
  const value = body.value as string
  const key = process.env.VT_API_KEY
  if (!key) return NextResponse.json({ error: 'missing key' }, { status: 400 })
  try {
    if (type === 'ip') {
      const r = await fetch(`https://www.virustotal.com/api/v3/ip_addresses/${value}`, { headers: headers(key) })
      const j = await r.json()
      const a = j?.data?.attributes || {}
      return NextResponse.json({ malicious: a?.last_analysis_stats?.malicious, data: j })
    }
    if (type === 'domain') {
      const r = await fetch(`https://www.virustotal.com/api/v3/domains/${value}`, { headers: headers(key) })
      const j = await r.json()
      const a = j?.data?.attributes || {}
      return NextResponse.json({ malicious: a?.last_analysis_stats?.malicious, data: j })
    }
    if (type === 'url') {
      const r = await fetch('https://www.virustotal.com/api/v3/urls', { method: 'POST', headers: { 'x-apikey': key }, body: new URLSearchParams({ url: value }) })
      const j = await r.json()
      const id = j?.data?.id
      if (!id) return NextResponse.json({ data: j })
      const r2 = await fetch(`https://www.virustotal.com/api/v3/analyses/${id}`, { headers: headers(key) })
      const j2 = await r2.json()
      const a = j2?.data?.attributes || {}
      return NextResponse.json({ malicious: a?.stats?.malicious, data: j2 })
    }
    if (type === 'file') {
      const r = await fetch(`https://www.virustotal.com/api/v3/files/${value}`, { headers: headers(key) })
      const j = await r.json()
      const a = j?.data?.attributes || {}
      return NextResponse.json({ malicious: a?.last_analysis_stats?.malicious, data: j })
    }
    return NextResponse.json({ error: 'bad type' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: 'vt error' }, { status: 500 })
  }
}
