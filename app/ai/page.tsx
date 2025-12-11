"use client"
import Sidebar from '@/components/Sidebar'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'

export default function AIPage() {
  const [query, setQuery] = useState('')
  const [data, setData] = useState('')
  const [out, setOut] = useState('')
  const [history, setHistory] = useState<Array<{ q: string; a: string; ts: number }>>([])
  const [busy, setBusy] = useState(false)
  const { show } = useToast()
  const ask = async () => {
    try {
      setBusy(true)
      const r = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, data }) })
      const j = await r.json()
      setOut(j.text || '')
      show('AI response received', 'success')
    } catch { show('AI request failed', 'error') } finally { setBusy(false) }
  }
  const save = async () => {
    if (!out) return
    await fetch('/api/ai/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q: query, a: out }) })
    show('Saved to history', 'success')
    await load()
  }
  const load = async () => {
    const r = await fetch('/api/ai/history')
    const j = await r.json()
    setHistory(j.list || [])
  }
  useEffect(() => { load() }, [])
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6 space-y-4">
        <div className="text-2xl font-bold">AI Threat Assistant</div>
        <div className="bg-[#0f192a] border border-[#112136] rounded p-4 space-y-2">
          <div className="font-semibold">Ask</div>
          <div className="flex gap-2">
            <input className="input flex-1" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Type your query here..." />
            <button className="bg-slate-800 px-3 py-2" onClick={ask}>Send</button>
          </div>
          {busy && (<div className="animate-pulse"><div className="mt-2 h-3 bg-slate-700 rounded w-32" /><div className="mt-1 h-3 bg-slate-700 rounded w-24" /></div>)}
        </div>
        <textarea className="input w-full h-40" value={data} onChange={e=>setData(e.target.value)} placeholder="Add context (logs, indicators, findings)" />
        <div className="bg-[#0f192a] border border-[#112136] p-4 rounded whitespace-pre-wrap">{out}</div>
        <div className="flex gap-2">
          <button className="btn" onClick={save} disabled={!out}>Save Recommendation</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0f192a] border border-[#112136] rounded p-4">
            <div className="title">Recent</div>
            <ul className="mt-2 space-y-2">
              {history.map(h => (
                <li key={h.ts} className="text-xs text-slate-300">
                  <div className="font-semibold">{new Date(h.ts).toLocaleString()}</div>
                  <div>{h.q}</div>
                  <div className="opacity-80">{h.a}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
