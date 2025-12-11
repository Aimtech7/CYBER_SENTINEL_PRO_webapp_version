import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { getConfig, writeChatHistory } from '@/lib/db'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const key = process.env.OPENAI_API_KEY || await getConfig('openai_key')
  const { query, data, messages, system } = await req.json().catch(()=>({}))
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  let full = ''
  const flushText = async (text: string) => {
    for (let i = 0; i < text.length; i += 80) {
      const chunk = text.slice(i, i + 80)
      full += chunk
      await writer.write(encoder.encode(chunk))
    }
  }
  try {
    if (!key) {
      const text = `No AI key configured. Heuristic summary based on context.\n${data || ''}`
      await flushText(text)
      await writer.close()
      return new Response(stream.readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }
    const client = new OpenAI({ apiKey: key })
    const model = (await getConfig('openai_model')) || 'gpt-4o-mini'
    const chatMsgs = Array.isArray(messages) && messages.length
      ? [{ role: 'system', content: String((typeof system === 'string' && system) || 'You are a cybersecurity assistant.') }, ...messages.map((m:any)=>({ role: m.role, content: String(m.text||m.content||'') }))]
      : [
          { role: 'system', content: String((typeof system === 'string' && system) || 'You are a cybersecurity assistant.') },
          { role: 'user', content: `Question: ${String(query||'')}\\nContext:\\n${String(data||'')}` }
        ]
    const s = await client.chat.completions.create({ model, stream: true, messages: chatMsgs as any })
    for await (const part of s) {
      const chunk = part?.choices?.[0]?.delta?.content || ''
      if (chunk) {
        full += chunk
        await writer.write(encoder.encode(chunk))
      }
    }
    await writer.close()
    try { await writeChatHistory(String(query||''), full) } catch {}
    return new Response(stream.readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (e) {
    await writer.write(encoder.encode('AI error'))
    await writer.close()
    return new Response(stream.readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' }, status: 500 })
  }
}
