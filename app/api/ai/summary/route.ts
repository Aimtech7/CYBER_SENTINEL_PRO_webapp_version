import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getConfig } from '@/lib/db'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const key = process.env.OPENAI_API_KEY || await getConfig('openai_key')
  const body = await req.json()
  const title = body.title as string
  const content = body.content as string
  if (!key) {
    const text = `Summary (${title}): Potential suspicious network activity detected. Validate source and destination IPs, review recent connections, and consider blocking if malicious.`
    return NextResponse.json({ text })
  }
  try {
    const client = new OpenAI({ apiKey: key })
    const model = (await getConfig('openai_model')) || 'gpt-4o-mini'
    const prompt = `Summarize security-relevant findings for ${title}. Keep concise and actionable.\n\n` + content
    const r = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a cybersecurity assistant.' },
        { role: 'user', content: prompt }
      ]
    })
    const text = r.choices?.[0]?.message?.content || ''
    return NextResponse.json({ text })
  } catch (e) {
    return NextResponse.json({ error: 'ai error' }, { status: 500 })
  }
}
