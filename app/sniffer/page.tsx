"use client"
import Sidebar from '@/components/Sidebar'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'
import { mitreFromText } from '@/lib/mitre'
import { downloadCsv } from '@/lib/csv'

export default function SnifferPage() {
  const [paired, setPaired] = useState(false)
  const [out, setOut] = useState<any>(null)
  const [tags, setTags] = useState<{ id: string; name: string }[]>([])
  const [severity, setSeverity] = useState<'info'|'warning'|'danger'>('info')
  const [busy, setBusy] = useState(false)
  const { show } = useToast()
  useEffect(() => { (async () => {
    const r = await fetch('/api/settings/agent')
    const j = await r.json()
    setPaired(j.paired)
  })() }, [])
  const start = async () => {
    setBusy(true)
    const r = await fetch('/api/agent/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: '/sniffer/start', method: 'POST' }) })
    const j = await r.json()
    setOut(j)
    setTags(mitreFromText(JSON.stringify(j)))
    setSeverity('warning')
    show('Sniffer started', 'success')
    setBusy(false)
  }
  const stop = async () => {
    const r = await fetch('/api/agent/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: '/sniffer/stop', method: 'POST' }) })
    const j = await r.json()
    setOut(j)
    show('Sniffer stopped', 'success')
  }
  const exportCsv = () => {
    const rows = out ? [out] : []
    downloadCsv('sniffer.csv', rows)
  }
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6 space-y-4">
        <div className="text-2xl font-bold">Packet Sniffer</div>
        {!paired && <div className="text-danger">Connect Agent in Settings</div>}
        <div className="flex gap-2">
          <button className="bg-slate-800 px-3 py-2" onClick={start} disabled={!paired}>Start</button>
          <button className="bg-slate-800 px-3 py-2" onClick={stop} disabled={!paired}>Stop</button>
        </div>
        <div className="bg-[#0f192a] border border-[#112136] rounded p-4">
          <div className="font-semibold">Output</div>
          <div className={`text-sm mb-2 ${severity==='danger'?'text-danger':severity==='warning'?'text-warning':'text-info'}`}>Severity: {severity}</div>
          {busy && (<div className="animate-pulse"><div className="mt-2 h-3 bg-slate-700 rounded w-32" /><div className="mt-1 h-3 bg-slate-700 rounded w-24" /></div>)}
          <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(out, null, 2)}</pre>
          <button className="bg-slate-800 px-3 py-2 mt-3" onClick={exportCsv} disabled={!out}>Export CSV</button>
          <div className="mt-3 text-sm">
            <div className="font-semibold">MITRE</div>
            <div className="flex flex-wrap gap-2 mt-1">
              {tags.map(t => (<div key={t.id} className="px-2 py-1 bg-slate-800 text-xs">{t.id}:{t.name}</div>))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
