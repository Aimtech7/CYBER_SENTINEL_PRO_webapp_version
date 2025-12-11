"use client"
import Sidebar from '@/components/Sidebar'
import { useEffect, useRef, useState } from 'react'
import { useToast } from '@/components/Toast'

type Msg = { role: 'user'|'assistant'; text: string; ts: number }

export default function ChatbotPage() {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [context, setContext] = useState('')
  const [busy, setBusy] = useState(false)
  const [system, setSystem] = useState('You are a cybersecurity assistant.')
  const ctrl = useRef<AbortController | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)
  const { show } = useToast()
  const lastSend = useRef<number>(0)
  const send = async (qArg?: string) => {
    const q = (qArg ?? input).trim()
    if (!q || busy) return
    const now = Date.now()
    if (now - (lastSend.current||0) < 1000) return
    lastSend.current = now
    setBusy(true)
    setMsgs(prev => [...prev, { role: 'user', text: q, ts: Date.now() }, { role: 'assistant', text: '', ts: Date.now() }])
    setInput('')
    try {
      ctrl.current = new AbortController()
      const r = await fetch('/api/ai/chat/stream', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [...msgs, { role: 'user', text: q }], query: q, data: context, system }), signal: ctrl.current.signal })
      const reader = r.body?.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      if (reader) {
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          acc += chunk
          setMsgs(prev => {
            const copy = [...prev]
            const last = copy[copy.length - 1]
            if (last && last.role === 'assistant') last.text += chunk
            return copy
          })
        }
      }
      try { await fetch('/api/ai/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q, a: acc }) }) } catch {}
      show('AI responded', 'success')
    } catch { show('AI not configured or rate limited', 'error') }
    setBusy(false)
  }
  const stop = () => { try { ctrl.current?.abort() } catch {}; setBusy(false) }
  const clearAll = () => { if (busy) return; setMsgs([]) }
  const regenerate = () => {
    const lastUser = [...msgs].reverse().find(m=>m.role==='user')
    if (!lastUser || busy) return
    setInput(lastUser.text)
    send(lastUser.text)
  }
  useEffect(() => { (async () => {
    try {
      const r = await fetch('/api/ai/history')
      const j = await r.json()
      const list = Array.isArray(j.list) ? j.list : []
      const restored: Msg[] = []
      for (const it of list.reverse()) {
        const q = String(it.q||'')
        const a = String(it.a||'')
        if (q) restored.push({ role: 'user', text: q, ts: Number(it.ts||Date.now()) })
        if (a) restored.push({ role: 'assistant', text: a, ts: Number(it.ts||Date.now()) })
      }
      if (restored.length) setMsgs(restored)
    } catch {}
  })() }, [])
  useEffect(() => { try { endRef.current?.scrollIntoView({ behavior: 'smooth' }) } catch {} }, [msgs, busy])
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6 space-y-4 pb-16 md:pb-6">
        <div className="text-2xl font-bold">Chatbot{(() => { const first = msgs.find(m=>m.role==='user'); return first ? ` — ${first.text.split(/\s+/).slice(0,6).join(' ')}` : '' })()}</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-[#0f192a] border border-[#112136] rounded p-4">
            <div className="space-y-3 max-h-[60vh] overflow-auto">
              {msgs.map((m,i)=> (
                <div key={i} className={(m.role==='user' ? 'flex justify-end' : 'flex justify-start')}>
                  <div className={(m.role==='user' ? 'bg-teal-500/10 text-teal-200' : 'bg-slate-800 text-slate-300') + ' px-3 py-2 rounded max-w-[70%] whitespace-pre-wrap'}>
                    <div>{m.text}</div>
                    <div className="text-[10px] opacity-60 mt-1">{new Date(m.ts).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
              {busy && (<div className="animate-pulse"><div className="h-3 bg-slate-700 rounded w-48" /><div className="mt-1 h-3 bg-slate-700 rounded w-24" /></div>)}
              <div ref={endRef} />
            </div>
          </div>
          <div className="bg-[#0f192a] border border-[#112136] rounded p-4 space-y-2">
            <div className="font-semibold">Ask</div>
            <textarea className="input w-full h-24" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder="Type your question..." />
            <div className="font-semibold">Context (optional)</div>
            <textarea className="input w-full h-24" value={context} onChange={e=>setContext(e.target.value)} placeholder="Logs, indicators, findings..." />
            <div className="font-semibold">System Prompt</div>
            <textarea className="input w-full h-20" value={system} onChange={e=>setSystem(e.target.value)} placeholder="Customize assistant behavior" />
            <div className="flex gap-2">
              <button className="bg-slate-800 px-3 py-2" onClick={()=>send()} disabled={busy}>Send</button>
              <button className="bg-slate-800 px-3 py-2" onClick={stop} disabled={!busy}>Stop</button>
              <button className="bg-slate-800 px-3 py-2" onClick={regenerate} disabled={busy || !msgs.length}>Regenerate</button>
              <button className="bg-slate-800 px-3 py-2" onClick={clearAll} disabled={busy || !msgs.length}>Clear</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
