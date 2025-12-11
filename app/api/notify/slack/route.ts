import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) return NextResponse.json({ error: 'missing webhook' }, { status: 400 })
  const { text } = await req.json()
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
    return NextResponse.json({ ok: true }, { status: r.ok ? 200 : 500 })
  } catch (e) {
    return NextResponse.json({ error: 'notify error' }, { status: 500 })
  }
}
