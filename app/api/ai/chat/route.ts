import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { mitreFromText } from '@/lib/mitre'
import { writeChatHistory, getConfig } from '@/lib/db'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const key = process.env.OPENAI_API_KEY || await getConfig('openai_key')
  const body = await req.json()
  const query = String(body.query || '')
  const data = String(body.data || '')
  if (!key) {
    const tags = mitreFromText(data).map(t => t.name).join(', ') || 'General Network Activity'
    const text = `No AI key configured. Heuristic summary based on context:\n- Likely issue: ${tags}\n- Recommended actions: Review logs, validate source IP, consider blocking if malicious, and run focused port scan.`
    await writeChatHistory(query, text)
    return NextResponse.json({ text })
  }
  try {
    const client = new OpenAI({ apiKey: key })
    const model = (await getConfig('openai_model')) || 'gpt-4o-mini'
    const r = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a cybersecurity assistant.' },
        { role: 'user', content: `Question: ${query}\nContext:\n${data}` }
      ]
    })
    const text = r.choices?.[0]?.message?.content || ''
    await writeChatHistory(query, text)
    return NextResponse.json({ text })
  } catch (e) {
    return NextResponse.json({ error: 'ai error' }, { status: 500 })
  }
}
