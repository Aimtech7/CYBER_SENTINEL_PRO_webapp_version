import { NextRequest, NextResponse } from 'next/server'
import dns from 'dns/promises'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { domain } = await req.json()
  if (!domain) return NextResponse.json({ error: 'missing domain' }, { status: 400 })
  try {
    const a = await dns.resolve(domain).catch(()=>[])
    const mx = await dns.resolveMx(domain).catch(()=>[])
    const txt = await dns.resolveTxt(domain).catch(()=>[])
    return NextResponse.json({ a, mx, txt })
  } catch (e) {
    return NextResponse.json({ error: 'dns error' }, { status: 500 })
  }
}
