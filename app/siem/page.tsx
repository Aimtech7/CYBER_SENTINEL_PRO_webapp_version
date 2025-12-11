"use client"
import Sidebar from '@/components/Sidebar'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export default function SIEMPage() {
  const [text, setText] = useState('')
  const [out, setOut] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const { show } = useToast()
  const run = async () => {
    try {
      setBusy(true)
      const r = await fetch('/api/siem/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logs: text }) })
      const j = await r.json()
      setOut(j)
      show('Logs analyzed', 'success')
    } catch { show('Analysis failed', 'error') } finally { setBusy(false) }
  }
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6 space-y-4 pb-16 md:pb-6">
        <div className="text-2xl font-bold">Mini-SIEM Log Analyzer</div>
        <div className="bg-[#0f192a] border border-[#112136] rounded p-4 space-y-2">
          <div className="font-semibold">Logs</div>
          <textarea className="input w-full h-64" value={text} onChange={e=>setText(e.target.value)} placeholder="Paste logs (JSON lines or text)" />
          <button className="bg-slate-800 px-3 py-2" onClick={run}>Analyze</button>
          {busy && (<div className="animate-pulse"><div className="mt-2 h-3 bg-slate-700 rounded w-32" /><div className="mt-1 h-3 bg-slate-700 rounded w-24" /></div>)}
        </div>
        <div className="bg-[#0f192a] border border-[#112136] rounded p-4 whitespace-pre-wrap text-xs">{JSON.stringify(out, null, 2)}</div>
      </main>
    </div>
  )
}
