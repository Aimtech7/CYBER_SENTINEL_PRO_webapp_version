"use client"
import Sidebar from '@/components/Sidebar'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export default function ToolsPage() {
  const [host, setHost] = useState('')
  const [dns, setDns] = useState('')
  const [cert, setCert] = useState('')
  const [out, setOut] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const { show } = useToast()
  const ping = async () => {
    try {
      setBusy(true)
      const r = await fetch('/api/tools/ping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ host }) })
      setOut(await r.json())
      show('Ping complete', 'success')
    } catch { show('Ping failed', 'error') } finally { setBusy(false) }
  }
  const dnsCheck = async () => {
    try {
      setBusy(true)
      const r = await fetch('/api/tools/dns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain: dns }) })
      setOut(await r.json())
      show('DNS check complete', 'success')
    } catch { show('DNS failed', 'error') } finally { setBusy(false) }
  }
  const certCheck = async () => {
    try {
      setBusy(true)
      const r = await fetch('/api/tools/cert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hostport: cert }) })
      setOut(await r.json())
      show('Cert check complete', 'success')
    } catch { show('Cert failed', 'error') } finally { setBusy(false) }
  }
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6 space-y-4">
        <div className="text-2xl font-bold">Network Tools</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-[#0f192a] border border-[#112136] rounded p-4 space-y-2">
            <div className="font-semibold">Ping</div>
            <input className="bg-slate-800 px-3 py-2" value={host} onChange={e=>setHost(e.target.value)} placeholder="8.8.8.8" />
            <button className="bg-slate-700 px-3 py-2" onClick={ping}>Run</button>
            {busy && (<div className="animate-pulse"><div className="mt-2 h-3 bg-slate-700 rounded w-32" /><div className="mt-1 h-3 bg-slate-700 rounded w-24" /></div>)}
          </div>
          <div className="bg-[#0f192a] border border-[#112136] rounded p-4 space-y-2">
            <div className="font-semibold">DNS Health</div>
            <input className="bg-slate-800 px-3 py-2" value={dns} onChange={e=>setDns(e.target.value)} placeholder="example.com" />
            <button className="bg-slate-700 px-3 py-2" onClick={dnsCheck}>Run</button>
            {busy && (<div className="animate-pulse"><div className="mt-2 h-3 bg-slate-700 rounded w-32" /><div className="mt-1 h-3 bg-slate-700 rounded w-24" /></div>)}
          </div>
          <div className="bg-[#0f192a] border border-[#112136] rounded p-4 space-y-2">
            <div className="font-semibold">Certificate</div>
            <input className="bg-slate-800 px-3 py-2" value={cert} onChange={e=>setCert(e.target.value)} placeholder="example.com:443" />
            <button className="bg-slate-700 px-3 py-2" onClick={certCheck}>Run</button>
            {busy && (<div className="animate-pulse"><div className="mt-2 h-3 bg-slate-700 rounded w-32" /><div className="mt-1 h-3 bg-slate-700 rounded w-24" /></div>)}
          </div>
        </div>
        <div className="bg-[#0f192a] border border-[#112136] rounded p-4">
          <div className="font-semibold">Output</div>
          <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(out, null, 2)}</pre>
        </div>
      </main>
    </div>
  )
}
