import { NextRequest, NextResponse } from 'next/server'
import { ensureSchema, getConfig, setConfig } from '@/lib/db'
export const runtime = 'nodejs'

export async function GET() {
  await ensureSchema()
  const savedUrl = await getConfig('agent_url')
  const savedToken = await getConfig('agent_token')
  const envUrl = process.env.AGENT_URL
  const envToken = process.env.AGENT_TOKEN
  const url = savedUrl || envUrl || ''
  const token = savedToken || envToken || ''
  const failCount = parseInt(String(await getConfig('agent_fail_count')||'0'))||0
  const lastFail = parseInt(String(await getConfig('agent_last_fail_ts')||'0'))||0
  return NextResponse.json({ url, paired: Boolean(url && token), fail_count: failCount, last_fail_ts: lastFail })
}

export async function POST(req: NextRequest) {
  await ensureSchema()
  const { url, token } = await req.json()
  if (!url || !token) return NextResponse.json({ error: 'missing' }, { status: 400 })
  await setConfig('agent_url', url)
  await setConfig('agent_token', token)
  return NextResponse.json({ ok: true })
}
