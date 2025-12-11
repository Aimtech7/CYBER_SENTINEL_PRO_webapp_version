"use client"
import Sidebar from '@/components/Sidebar'
import { useEffect, useState } from 'react'
import { mitreFromText } from '@/lib/mitre'
import { downloadCsv } from '@/lib/csv'
import { useToast } from '@/components/Toast'
import RingGauge from '@/components/RingGauge'
import type { WifiAudit } from '@/lib/wifiAudit'
import { gradeColor, summarize } from '@/lib/wifiAudit'

export default function WifiPage() {
  const [paired, setPaired] = useState(false)
  const [out, setOut] = useState<any>(null)
  const [tags, setTags] = useState<{ id: string; name: string }[]>([])
  const [busy, setBusy] = useState(false)
  const { show } = useToast()
  const [audit, setAudit] = useState<WifiAudit | null>(null)
  const [auditBusy, setAuditBusy] = useState(false)
  const [aiText, setAiText] = useState('')
  const [pwHint, setPwHint] = useState('')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<'signal'|'ssid'>('signal')
  const [secureOnly, setSecureOnly] = useState(false)
  const [bandFilter, setBandFilter] = useState<'all'|'2.4'|'5'>('all')
  const [autoRefresh, setAutoRefresh] = useState(false)
  useEffect(() => { (async () => {
    const r = await fetch('/api/settings/agent')
    const j = await r.json()
    setPaired(j.paired)
  })() }, [])
  const scan = async () => {
    if (busy) return
    setBusy(true)
    try {
      const t0 = performance.now()
      setOut(null)
      setTags([])
      const r = await fetch('/api/wifi/scan?t=' + Date.now(), { method: 'GET', cache: 'no-store' })
      const j = await r.json()
      if (j?.error) { setOut(null); const map: Record<string,string> = { agent_unreachable: 'Agent unreachable; using local scan', agent_degraded: 'Agent degraded; using local scan', 'not paired': 'Pair the Agent in Settings' }; show(map[String(j.error)] || String(j.error || 'scan_error'), 'error'); return }
      setOut(j)
      const t = mitreFromText(JSON.stringify(j))
      setTags(t)
      const count = Array.isArray(j?.networks) ? j.networks.length : 0
      const ms = Math.round(performance.now() - t0)
      try {
        await fetch('/api/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'wifi_scan', severity: 'info', message: `networks=${count} source=${String(j?.source||'')} ms=${ms}`, mitre_tags: t.map(x=>x.id) }) })
      } catch {}
      show('WiFi scan completed', 'success')
    } finally {
      setBusy(false)
    }
  }
  const exportCsv = () => {
    const rows = Array.isArray(out?.networks) ? out.networks : []
    downloadCsv('wifi.csv', rows)
  }
  useEffect(() => {
    if (autoRefresh) {
      const id = setInterval(() => { scan() }, 10000)
      return () => clearInterval(id)
    }
  }, [autoRefresh])
  const runAudit = async () => {
    if (!paired || auditBusy) return
    setAuditBusy(true)
    try {
      const r = await fetch('/api/wifi/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wifi_password_hint: pwHint }) })
      const j = await r.json()
      if (j?.error) { const map: Record<string,string> = { agent_unreachable: 'Agent unreachable; audit requires Agent', 'not paired': 'Pair the Agent in Settings' }; show(map[String(j.error)] || String(j.error), 'error'); return }
      setAudit(j)
      show('WiFi security audit complete', 'success')
      try {
        const text = summarize(j)
        await fetch('/api/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'wifi_audit', severity: j.grade === 'F' || j.grade === 'D' ? 'danger' : j.grade === 'C' ? 'warning' : 'info', message: text, mitre_tags: [] }) })
      } catch {}
    } finally {
      setAuditBusy(false)
    }
  }
  const explain = async () => {
    if (!audit) return
    const text = summarize(audit)
    const r = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: 'Explain WiFi audit and fixes', data: text }) })
    const j = await r.json()
    show('AI explanation ready', 'success')
    setAiText(j.text || '')
  }
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6 space-y-4 pb-16 md:pb-6">
        <div className="text-2xl font-bold">WiFi Analyzer</div>
        {!paired && <div className="text-danger">Connect Agent in Settings</div>}
        <div className="flex gap-2">
          <button className="bg-slate-800 px-3 py-2" onClick={scan} disabled={busy}>Scan</button>
          <button className="bg-slate-800 px-3 py-2" onClick={exportCsv} disabled={!paired || !out}>Export CSV</button>
          <input className="bg-slate-900 px-3 py-2" value={pwHint} onChange={e=>setPwHint(e.target.value)} placeholder="WiFi password (optional for entropy)" />
          <button className="bg-slate-800 px-3 py-2" onClick={runAudit} disabled={!paired || auditBusy}>Run Audit</button>
          <button className="bg-slate-800 px-3 py-2" onClick={explain} disabled={!audit}>Explain with AI</button>
          <input className="bg-slate-900 px-3 py-2" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search SSID" />
          <select className="bg-slate-900 px-3 py-2" value={sortBy} onChange={e=>setSortBy(e.target.value as any)}>
            <option value="signal">Sort by Signal</option>
            <option value="ssid">Sort by SSID</option>
          </select>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input type="checkbox" checked={secureOnly} onChange={e=>setSecureOnly(e.target.checked)} /> Secure only
          </label>
          <select className="bg-slate-900 px-3 py-2" value={bandFilter} onChange={e=>setBandFilter(e.target.value as any)}>
            <option value="all">All bands</option>
            <option value="2.4">2.4 GHz</option>
            <option value="5">5 GHz</option>
          </select>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input type="checkbox" checked={autoRefresh} onChange={e=>setAutoRefresh(e.target.checked)} /> Auto-refresh
          </label>
        </div>
        <div className="bg-slate-900 p-3">
          <div className="font-semibold flex items-center gap-2">Networks {out?.source && (<span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300">Source: {String(out.source)}</span>)}</div>
          {busy && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-[#0f192a] border border-[#112136] rounded p-3 skeleton-card">
                  <div className="h-4 w-32 skeleton-bar" />
                  <div className="mt-2 h-3 w-24 skeleton-bar" />
                  <div className="mt-3 h-2 w-full skeleton-bar" />
                </div>
              ))}
            </div>
          )}
          {!busy && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              {(Array.isArray(out?.networks)?out.networks:[])
                .filter((n:any)=>String(n.ssid||'').toLowerCase().includes(query.toLowerCase()))
                .filter((n:any)=> secureOnly ? !String(n.security||'').toLowerCase().includes('open') : true)
                .filter((n:any)=> {
                  const ch = parseInt(String(n.channel||'').replace(/[^0-9]/g,'')) || 0
                  if (bandFilter === 'all') return true
                  if (bandFilter === '2.4') return ch > 0 && ch <= 14
                  return ch >= 36
                })
                .sort((a:any,b:any)=>{
                  if (sortBy === 'ssid') return String(a.ssid||'').localeCompare(String(b.ssid||''))
                  const pa = Math.max(0, Math.min(100, parseInt(String(a.signal||'0').replace('%',''))||0))
                  const pb = Math.max(0, Math.min(100, parseInt(String(b.signal||'0').replace('%',''))||0))
                  return pb - pa
                })
                .map((n:any,idx:number)=>{
                const pct = Math.max(0, Math.min(100, parseInt(String(n.signal||'0').replace('%',''))||0))
                const open = String(n.security||'').toLowerCase().includes('open')
                const secure = !open
                const vendor = (()=>{ const mac = String(n.bssid||'').toUpperCase(); const oui = mac.split(':').slice(0,3).join(':'); const map: Record<string,string> = { '00:1A:2B':'TP-Link','00:19:E0':'D-Link','C0:25:E9':'Ubiquiti','10:6F:3F':'Netgear','F8:1A:67':'Huawei','FC:64:BA':'Xiaomi','00:1B:2F':'Cisco' }; return map[oui] || '' })()
                const ch = parseInt(String(n.channel||'').replace(/[^0-9]/g,'')) || 0
                const band = ch && ch <= 14 ? '2.4 GHz' : (ch >= 36 ? '5 GHz' : '')
                const secLower = String(n.security||'').toLowerCase()
                const weak = secLower.includes('wep') || (secLower.includes('wpa') && !secLower.includes('wpa2') && !secLower.includes('wpa3'))
                return (
                  <div key={idx} className="relative rounded-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-cyan-500/10" />
                    <div className="relative bg-[#0f192a] border border-[#112136] rounded-xl p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="text-slate-200 text-base tracking-wide">{n.ssid || 'Unknown SSID'}</div>
                        <div className="flex items-center gap-2">
                          <button className="px-2 py-1 rounded bg-slate-800 text-xs" onClick={()=>navigator.clipboard.writeText(String(n.ssid||''))}>Copy</button>
                          <div className={"px-2 py-1 rounded text-xs " + (secure ? 'bg-teal-500/20 text-teal-300' : 'bg-danger/20 text-danger')}>{secure ? 'Secure' : 'Open'}</div>
                          {weak && <div className="px-2 py-1 rounded text-xs bg-danger/20 text-danger">Weak</div>}
                          <div className="p-1 rounded bg-slate-800">
                            {secure ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" className="text-teal-300" fill="none"><path d="M6 10V8a6 6 0 1 1 12 0v2" stroke="currentColor" strokeWidth="2"/><rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/></svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" className="text-danger" fill="none"><path d="M6 10V8a6 6 0 1 1 12 0v2" stroke="currentColor" strokeWidth="2"/><rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M9 13h6" stroke="currentColor" strokeWidth="2"/></svg>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-slate-400 mt-1">{n.bssid || '00:00:00:00:00:00'}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-2 flex-1 bg-slate-800 rounded">
                          <div className="h-2 rounded bg-gradient-to-r from-teal-400 to-cyan-400" style={{ width: pct + '%' }} />
                        </div>
                        <div className="text-xs text-slate-300 w-10 text-right">{pct}%</div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300">{n.security || '—'}</div>
                        {vendor && <div className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300">{vendor}</div>}
                        {n.channel && <div className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300">Ch {n.channel}</div>}
                        {band && <div className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300">{band}</div>}
                        <button className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300" onClick={()=>navigator.clipboard.writeText(String(n.bssid||''))}>Copy BSSID</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {!busy && (!Array.isArray(out?.networks) || out.networks.length === 0) && (
            <div className="mt-4 text-xs text-slate-400">No networks found. Ensure the Agent is paired and running with required permissions.</div>
          )}
          <div className="mt-3 text-sm">
            <div className="font-semibold">MITRE</div>
            <div className="flex flex-wrap gap-2 mt-1">
              {tags.map(t => (<div key={t.id} className="px-2 py-1 bg-slate-800 text-xs">{t.id}:{t.name}</div>))}
            </div>
          </div>
        </div>
        {audit && (
          <div className="bg-slate-900 p-3 mt-4">
            <div className="font-semibold">Security Score</div>
            <div className="flex items-center gap-6 mt-3">
              <RingGauge value={Math.max(0, Math.min(100, audit.score))} label={audit.grade} />
              <div className={"text-lg font-semibold " + gradeColor(audit.grade)}>Grade: {audit.grade}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div className="bg-slate-800 rounded p-3 text-sm">
                <div>Encryption: {audit.encryption} ({audit.cipher})</div>
                <div>WPS Enabled: {audit.wps_enabled ? 'Yes' : 'No'}</div>
                <div>Admin over HTTP: {audit.admin_over_http ? 'Yes' : 'No'}</div>
                <div>Basic Auth Challenge: {audit.basic_auth_challenge ? 'Yes' : 'No'}</div>
                <div>Firmware Header: {audit.firmware_header}</div>
                <div>Password Entropy: {Math.round(audit.password_entropy_bits)} bits</div>
              </div>
              <div className="bg-slate-800 rounded p-3 text-sm">
                <div className="font-semibold mb-2">Devices</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(Array.isArray(audit?.devices)?audit!.devices:[]).map((d,i)=>(
                    <div key={i} className="bg-slate-700 rounded p-2">
                      <div>{d.ip}</div>
                      <div className="text-xs">{d.mac}</div>
                      <div className="text-xs">{(d.hostname||'')}</div>
                      <div className="text-xs">Ports: {(d.open_ports||[]).join(', ') || 'None'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {aiText && (
          <div className="bg-[#0f192a] border border-[#112136] rounded p-4 mt-4 whitespace-pre-wrap text-sm">{aiText}</div>
        )}
      </main>
    </div>
  )
}
