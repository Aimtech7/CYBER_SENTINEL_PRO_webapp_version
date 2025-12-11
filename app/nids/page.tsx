"use client"
import Sidebar from '@/components/Sidebar'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'

export default function NidsPage() {
  const [paired, setPaired] = useState(false)
  const [out, setOut] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const { show } = useToast()
  useEffect(() => { (async () => {
    const r = await fetch('/api/settings/agent')
    const j = await r.json()
    setPaired(j.paired)
  })() }, [])
  const run = async () => {
    try {
      setBusy(true)
      const r = await fetch('/api/nids/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const j = await r.json()
      setOut(j)
      show('NIDS run complete', 'success')
    } catch { show('NIDS failed', 'error') } finally { setBusy(false) }
  }
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6 space-y-4 pb-16 md:pb-6">
        <div className="text-2xl font-bold">Network IDS</div>
        {!paired && <div className="text-danger">Connect Agent in Settings</div>}
        <div className="bg-[#0f192a] border border-[#112136] rounded p-4 space-y-2">
          <div className="font-semibold">Run</div>
          <button className="bg-slate-800 px-3 py-2" onClick={run} disabled={!paired}>Run NIDS</button>
          {busy && (<div className="animate-pulse"><div className="mt-2 h-3 bg-slate-700 rounded w-32" /><div className="mt-1 h-3 bg-slate-700 rounded w-24" /></div>)}
        </div>
        <div className="bg-[#0f192a] border border-[#112136] rounded p-4 whitespace-pre-wrap text-xs">{JSON.stringify(out, null, 2)}</div>
      </main>
    </div>
  )
}
