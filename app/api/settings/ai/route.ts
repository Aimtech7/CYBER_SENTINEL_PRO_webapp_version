import { NextRequest, NextResponse } from 'next/server'
import { ensureSchema, getConfig, setConfig } from '@/lib/db'
export const runtime = 'nodejs'

export async function GET() {
  await ensureSchema()
  const hasKey = Boolean(await getConfig('openai_key') || process.env.OPENAI_API_KEY)
  const model = (await getConfig('openai_model')) || ''
  return NextResponse.json({ hasKey, model })
}

export async function POST(req: NextRequest) {
  await ensureSchema()
  const { key, model } = await req.json()
  if (key) await setConfig('openai_key', key)
  if (typeof model === 'string') await setConfig('openai_model', model)
  return NextResponse.json({ ok: true })
}
