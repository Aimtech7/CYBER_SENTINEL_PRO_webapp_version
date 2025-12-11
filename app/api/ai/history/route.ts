import { NextRequest, NextResponse } from 'next/server'
import { listChatHistory, writeChatHistory } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const list = await listChatHistory(20)
  return NextResponse.json({ list })
}

export async function POST(req: NextRequest) {
  const b = await req.json()
  const q = String(b.q || '')
  const a = String(b.a || '')
  await writeChatHistory(q, a)
  return NextResponse.json({ ok: true })
}
