"use client"
import Sidebar from '@/components/Sidebar'
import { useEffect, useState } from 'react'
import { downloadCsv } from '@/lib/csv'

export default function EndpointPage() {
  const [paired, setPaired] = useState(false)
  const [out, setOut] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { (async () => {
    const r = await fetch('/api/settings/agent')
    const j = await r.json()
    setPaired(j.paired)
  })() }, [])
  const list = async () => {
    setBusy(true)
    const r = await fetch('/api/agent/proxy', { method: 'POST', body: JSON.stringify({ path: '/endpoint/processes', method: 'GET' }) })
    const j = await r.json()
    setOut(j)
    setBusy(false)
  }
  const exportCsv = () => {
    const rows = Array.isArray(out?.processes) ? out.processes : []
    downloadCsv('processes.csv', rows)
  }
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6 space-y-4 pb-16 md:pb-6">
        <div className="text-2xl font-bold">Endpoint Forensics</div>
        {!paired && <div className="text-danger">Connect Agent in Settings</div>}
        <div className="flex gap-2">
          <button className="bg-slate-800 px-3 py-2" onClick={list} disabled={!paired}>List Processes</button>
          <button className="bg-slate-800 px-3 py-2" onClick={exportCsv} disabled={!paired || !out}>Export CSV</button>
        </div>
        <div className="bg-[#0f192a] border border-[#112136] rounded p-4">
          <div className="font-semibold">Output</div>
          {busy && (<div className="animate-pulse"><div className="mt-2 h-3 bg-slate-700 rounded w-32" /><div className="mt-1 h-3 bg-slate-700 rounded w-24" /></div>)}
          <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(out, null, 2)}</pre>
        </div>
      </main>
    </div>
  )
}
