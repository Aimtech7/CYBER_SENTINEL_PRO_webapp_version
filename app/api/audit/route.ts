import { NextRequest, NextResponse } from 'next/server'
import { ensureSchema, writeAudit } from '@/lib/db'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  await ensureSchema()
  const b = await req.json()
  const { type, severity, message, mitre_tags } = b
  try {
    await writeAudit({ type, severity, message, mitre_tags: Array.isArray(mitre_tags) ? mitre_tags : [] })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'audit error' }, { status: 500 })
  }
}
