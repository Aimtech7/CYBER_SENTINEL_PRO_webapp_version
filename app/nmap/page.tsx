"use client"
import Sidebar from '@/components/Sidebar'
import { useEffect, useState } from 'react'
import { mitreFromPorts } from '@/lib/mitre'
import { downloadCsv } from '@/lib/csv'
import { useToast } from '@/components/Toast'

export default function NmapPage() {
  const [paired, setPaired] = useState(false)
  const [target, setTarget] = useState('')
  const [out, setOut] = useState<any>(null)
  const [tags, setTags] = useState<{ id: string; name: string }[]>([])
  const [severity, setSeverity] = useState<'info'|'warning'|'danger'>('info')
  const [busy, setBusy] = useState(false)
  const { show } = useToast()
  const [devices, setDevices] = useState<Array<{ ip: string; mac: string; type: string }>>([])
  useEffect(() => { (async () => {
    const r = await fetch('/api/settings/agent')
    const j = await r.json()
    setPaired(j.paired)
  })() }, [])
  const run = async () => {
    if (busy) return
    setBusy(true)
    try {
      const r = await fetch('/api/agent/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: '/nmap/scan', method: 'POST', body: { target } }) })
      const j = await r.json()
      setOut(j)
      const ports = Array.isArray(j?.ports) ? j.ports : []
      const t = mitreFromPorts(ports)
      setTags(t)
      const sev = ports.length > 10 ? 'danger' : ports.length > 0 ? 'warning' : 'info'
      setSeverity(sev)
      try {
        await fetch('/api/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'nmap_scan', severity: sev, message: `target=${target} ports=${ports.join(',')}`, mitre_tags: t.map(x=>x.id) }) })
      } catch {}
      show('Scan completed', 'success')
    } finally {
      setBusy(false)
    }
  }
  const exportCsv = () => {
    const rows = Array.isArray(out?.ports) ? out.ports.map((p:number)=>({ port: p })) : []
    downloadCsv('nmap.csv', rows)
  }
  const discover = async () => {
    const r = await fetch('/api/agent/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: '/network/scan', method: 'GET' }) })
    const j = await r.json()
    const list = Array.isArray(j?.devices) ? j.devices : []
    setDevices(list)
    show('LAN discovery complete', 'success')
  }
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6 space-y-4 pb-16 md:pb-6">
        <div className="text-2xl font-bold">Network Mapper</div>
        {!paired && <div className="text-danger">Connect Agent in Settings</div>}
        <div className="flex gap-2">
          <input className="bg-slate-900 px-3 py-2" value={target} onChange={e=>setTarget(e.target.value)} placeholder="192.168.1.1" />
          <button className="bg-slate-800 px-3 py-2" onClick={run} disabled={!paired || busy}>Scan</button>
          <button className="bg-slate-800 px-3 py-2" onClick={discover} disabled={!paired}>Discover LAN</button>
        </div>
        <div className="bg-slate-900 p-3">
          <div className="font-semibold">Result</div>
          <div className={`text-sm mb-2 ${severity==='danger'?'text-danger':severity==='warning'?'text-warning':'text-info'}`}>Severity: {severity}</div>
          <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(out, null, 2)}</pre>
          <button className="bg-slate-800 px-3 py-2 mt-3" onClick={exportCsv} disabled={!out}>Export CSV</button>
          <div className="mt-3 text-sm">
            <div className="font-semibold">MITRE</div>
            <div className="flex flex-wrap gap-2 mt-1">
              {tags.map(t => (<div key={t.id} className="px-2 py-1 bg-slate-800 text-xs">{t.id}:{t.name}</div>))}
            </div>
          </div>
        </div>
        <div className="bg-[#0f192a] border border-[#112136] rounded p-4">
          <div className="font-semibold">LAN Devices</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
            {devices.map(d => (
              <div key={d.ip + d.mac} className="bg-[#0f192a] border border-[#112136] rounded p-3 text-sm">
                <div className="text-slate-200">{d.ip}</div>
                <div className="text-slate-400">{d.mac}</div>
                <div className="text-xs text-slate-500">{d.type}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
