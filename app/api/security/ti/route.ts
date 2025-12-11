import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { source, ip } = await req.json()
  try {
    if (source === 'otx') {
      const key = process.env.OTX_API_KEY
      if (!key) return NextResponse.json({ error: 'missing key' }, { status: 400 })
      const r = await fetch(`https://otx.alienvault.com/api/v1/indicators/IPv4/${ip}/general`, { headers: { 'X-OTX-API-KEY': key } })
      return NextResponse.json(await r.json())
    }
    if (source === 'abuseipdb') {
      const key = process.env.ABUSEIPDB_API_KEY
      if (!key) return NextResponse.json({ error: 'missing key' }, { status: 400 })
      const r = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}`, { headers: { Key: key, Accept: 'application/json' } })
      return NextResponse.json(await r.json())
    }
    if (source === 'greynoise') {
      const key = process.env.GREYNOISE_API_KEY
      if (!key) return NextResponse.json({ error: 'missing key' }, { status: 400 })
      const r = await fetch(`https://api.greynoise.io/v3/community/${ip}`, { headers: { 'key': key } })
      return NextResponse.json(await r.json())
    }
    return NextResponse.json({ error: 'bad source' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'ti error' }, { status: 500 })
  }
}
