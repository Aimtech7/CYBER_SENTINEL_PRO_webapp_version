import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const ip = (body.ip ?? body.value) as string
  const key = process.env.SHODAN_API_KEY
  if (!key) return NextResponse.json({ error: 'missing key' }, { status: 400 })
  try {
    const r = await fetch(`https://api.shodan.io/shodan/host/${ip}?key=${key}`)
    const j = await r.json()
    const ports = Array.isArray(j?.ports) ? j.ports : []
    return NextResponse.json({ ports, data: j })
  } catch (e) {
    return NextResponse.json({ error: 'shodan error' }, { status: 500 })
  }
}
