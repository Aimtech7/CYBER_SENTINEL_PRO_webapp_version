import { NextRequest, NextResponse } from 'next/server'
import { ensureSchema, getConfig, setConfig } from '@/lib/db'
export const runtime = 'nodejs'

export async function GET() {
  await ensureSchema()
  const theme = await getConfig('theme')
  return NextResponse.json({ theme: theme || 'dark' })
}

export async function POST(req: NextRequest) {
  await ensureSchema()
  const { theme } = await req.json()
  await setConfig('theme', theme || 'dark')
  return NextResponse.json({ ok: true })
}
