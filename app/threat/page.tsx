"use client"
import Sidebar from '@/components/Sidebar'
import { useState } from 'react'
import { useToast } from '@/components/Toast'
import { mitreFromPorts, mitreFromText } from '@/lib/mitre'
import { downloadCsv } from '@/lib/csv'

export default function ThreatPage() {
  const [input, setInput] = useState('')
  const [res, setRes] = useState<any>(null)
  const [score, setScore] = useState(0)
  const [provider, setProvider] = useState<'vt' | 'shodan'>('vt')
  const [tags, setTags] = useState<{ id: string; name: string }[]>([])
  const [severity, setSeverity] = useState<'info'|'warning'|'danger'>('info')
  const [batch, setBatch] = useState('')
  const [passiveType, setPassiveType] = useState<'domain'|'ip'>('domain')
  const [passiveValue, setPassiveValue] = useState('')
  const { show } = useToast()
  const onCheck = async () => {
    const v = input.trim()
    if (!v) return
    if (provider === 'vt') {
      let type = 'domain'
      if (v.startsWith('http')) type = 'url'
      else if (v.split('.').length === 4 && v.split('.').every(x => /^\d+$/.test(x))) type = 'ip'
      else if ([32,40,64].includes(v.length)) type = 'file'
      const r = await fetch('/api/threat/vt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, value: v }) })
      const j = await r.json()
      setRes(j)
      const s = j.malicious ?? 0
      setScore(typeof s === 'number' ? s : 0)
      const text = JSON.stringify(j)
      setTags(mitreFromText(text))
      setSeverity((s||0) >= 10 ? 'danger' : (s||0) > 0 ? 'warning' : 'info')
      show('VT lookup complete', 'success')
      return
    }
    if (provider === 'shodan') {
      const isIp = v.split('.').length === 4 && v.split('.').every(x => /^\d+$/.test(x))
      if (!isIp) {
        setRes({ error: 'ip required' })
        setScore(0)
        return
      }
      const r = await fetch('/api/threat/shodan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ip: v }) })
      const j = await r.json()
      setRes(j)
      const portsCount = Array.isArray(j?.ports) ? j.ports.length : 0
      setScore(Math.min(100, portsCount * 5))
      setTags(mitreFromPorts(Array.isArray(j?.ports) ? j.ports : []))
      setSeverity(portsCount > 10 ? 'danger' : portsCount > 0 ? 'warning' : 'info')
      show('Shodan lookup complete', 'success')
      return
    }
  }
  const onPassive = async () => {
    const r = await fetch('/api/threat/vt/passive', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: passiveType, value: passiveValue }) })
    const j = await r.json()
    setRes(j)
    show('Passive DNS fetched', 'success')
  }
  const onBatch = async () => {
    const items = batch.split(/\s+/).filter(Boolean).map(v => {
      let type = 'domain'
      if (v.split('.').length === 4 && v.split('.').every(x => /^\d+$/.test(x))) type = 'ip'
      else if ([32,40,64].includes(v.length)) type = 'hash'
      return { type, value: v }
    })
    const r = await fetch('/api/threat/vt/batch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) })
    const j = await r.json()
    setRes(j)
    show('Batch lookup complete', 'success')
  }
  const onExport = () => {
    const rows = Array.isArray(res?.data?.data) ? res.data.data : [res]
    downloadCsv('threat.csv', rows)
  }
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6 space-y-4 pb-16 md:pb-6">
        <div className="text-2xl font-bold">Threat Intelligence</div>
        <div className="flex gap-2">
          <input className="bg-slate-900 px-3 py-2" value={input} onChange={e=>setInput(e.target.value)} placeholder="IP, domain, URL, hash" />
          <select className="bg-slate-900 px-3 py-2" value={provider} onChange={e=>setProvider(e.target.value as 'vt' | 'shodan')}>
            <option value="vt">VirusTotal</option>
            <option value="shodan">Shodan</option>
          </select>
          <button className="bg-slate-800 px-3 py-2" onClick={onCheck}>Check</button>
          <button className="bg-slate-800 px-3 py-2" onClick={onExport}>Export CSV</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0f192a] border border-[#112136] rounded p-4">
            <div className="font-semibold">Result</div>
            <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(res, null, 2)}</pre>
          </div>
          <div className="bg-[#0f192a] border border-[#112136] rounded p-4">
            <div className="font-semibold">Risk Score</div>
            <div className="h-6 bg-slate-800 mt-2">
              <div style={{ width: `${Math.min(100, score)}%`, background: '#4db5ff' }} className="h-6" />
            </div>
            <div className={`text-sm mt-2 ${severity==='danger'?'text-danger':severity==='warning'?'text-warning':'text-info'}`}>Severity: {severity}</div>
            <div className="mt-3 text-sm">
              <div className="font-semibold">MITRE</div>
              <div className="flex flex-wrap gap-2 mt-1">
                {tags.map(t => (<div key={t.id} className="px-2 py-1 bg-slate-800 text-xs">{t.id}:{t.name}</div>))}
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="font-semibold">Passive DNS</div>
              <div className="flex gap-2">
                <select className="bg-slate-900 px-3 py-2" value={passiveType} onChange={e=>setPassiveType(e.target.value as 'domain'|'ip')}>
                  <option value="domain">Domain</option>
                  <option value="ip">IP</option>
                </select>
                <input className="bg-slate-900 px-3 py-2" value={passiveValue} onChange={e=>setPassiveValue(e.target.value)} placeholder="example.com or 1.2.3.4" />
                <button className="bg-slate-800 px-3 py-2" onClick={onPassive}>Fetch</button>
              </div>
              <div className="font-semibold mt-4">Batch Lookup</div>
              <textarea className="bg-slate-900 w-full h-24 p-2" value={batch} onChange={e=>setBatch(e.target.value)} placeholder="Indicators separated by space or newline" />
              <button className="bg-slate-800 px-3 py-2" onClick={onBatch}>Run Batch</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
