"use client"
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import Card from '@/components/Card'
import RingGauge from '@/components/RingGauge'
import Sparkline from '@/components/Sparkline'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const [paired, setPaired] = useState(false)
  const [health, setHealth] = useState<{ ok: boolean; safe_mode?: boolean } | null>(null)
  const [procCount, setProcCount] = useState<number | null>(null)
  const [aiQuery, setAiQuery] = useState('')
  const [aiOut, setAiOut] = useState('')
  const [risk, setRisk] = useState(55)
  const [summary, setSummary] = useState<string>('')
  const [logs, setLogs] = useState<number[]>([10,14,19,26,47,33,22,18,14])
  const [blockIp, setBlockIp] = useState('')
  const [agentDegraded, setAgentDegraded] = useState(false)
  const block = async () => {
    if (!blockIp) return
    await fetch('/api/agent/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: '/firewall/block', method: 'POST', body: { ip: blockIp } }) })
  }
  const unblock = async () => {
    if (!blockIp) return
    await fetch('/api/agent/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: '/firewall/unblock', method: 'POST', body: { ip: blockIp } }) })
  }
  const refresh = async () => {
    try {
      const r1 = await fetch('/api/settings/agent')
      const j1 = await r1.json()
      setPaired(Boolean(j1.paired))
      setAgentDegraded(Boolean((j1.fail_count||0) >= 3))
      if (j1.paired) {
        const h = await fetch('/api/agent/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: '/health', method: 'GET' }) })
        const hj = await h.json()
        setHealth(hj)
        const p = await fetch('/api/agent/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: '/endpoint/processes', method: 'GET' }) })
        const pj = await p.json()
        setProcCount(Number(pj?.count ?? 0))
        const failBadge = document.getElementById('agent-badge')
        if (failBadge && j1.fail_count >= 3) failBadge.textContent = 'Degraded'
      } else {
        setHealth(null)
        setProcCount(null)
      }
    } catch {
      setHealth(null)
    }
  }
  const sendAi = async () => {
    try {
      const r = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: aiQuery, data: 'Detected port scanning on the network. Src: 192.168.1.10 Dest: 103.20.46.1' }) })
      const j = await r.json()
      setAiOut(j.error ? 'AI request failed' : (j.text || ''))
    } catch {
      setAiOut('AI not configured')
    }
  }
  const runSummary = async () => {
    try {
      const r = await fetch('/api/ai/summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Network Event', content: 'Detected port scanning on the network. Src IP: 192.168.1.10 Dest IP: 103.20.46.1' }) })
      const j = await r.json()
      setSummary(j.text || 'Detected port scanning on the network\nSrc IP: 192.168.1.10\nDest IP: 103.20.46.1')
    } catch {
      setSummary('Detected port scanning on the network\nSrc IP: 192.168.1.10\nDest IP: 103.20.46.1')
    }
  }
  useEffect(() => { refresh(); runSummary() }, [])
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="Ask the AI" right={<button className="btn" onClick={sendAi}>➤</button>}>
              <input className="input" placeholder="Type your query here..." value={aiQuery} onChange={e=>setAiQuery(e.target.value)} />
              {aiOut && <div className="mt-3 text-xs text-slate-300 whitespace-pre-wrap">{aiOut}</div>}
            </Card>
            <Card title="AI Summary">
              <div className="text-sm whitespace-pre-wrap">
                {summary ? summary : (
                  <div className="space-y-2">
                    <div className="h-3 w-3/4 skeleton-bar" />
                    <div className="h-3 w-2/3 skeleton-bar" />
                    <div className="h-3 w-1/2 skeleton-bar" />
                  </div>
                )}
              </div>
            </Card>
            <Card title="Logs (Last 24 Hours)">
              <Sparkline points={logs} />
            </Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Threat Explanation" right={<div className="text-xs bg-[#0f192a] px-2 py-1 rounded">Medium</div>}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-lg font-semibold">Potential Port Scanning Detected</div>
                  <div className="text-sm mt-2">Port scanning activity detected on your network. This could be an indication of a reconnaissance attempt by an attacker.</div>
                </div>
                <div className="flex items-center justify-center"><RingGauge value={risk} label="Threat Level" /></div>
              </div>
            </Card>
            <Card title="AI Recommendations">
              <div className="flex gap-3 items-center">
                <input className="input" placeholder="Enter IP to block" value={blockIp} onChange={e=>setBlockIp(e.target.value)} />
                <button className="btn" onClick={block} disabled={!paired}>Block IP</button>
                <button className="btn" onClick={unblock} disabled={!paired}>Unblock</button>
              </div>
            </Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="Agent">
              <div className={(paired ? 'text-teal-300' : 'text-danger') + ' text-lg font-semibold'}>{paired ? 'Paired' : 'Not Paired'} {agentDegraded && (<span className="ml-2 text-xs px-2 py-1 rounded bg-warning/20 text-warning">Degraded</span>)}</div>
              <button className="btn mt-3" onClick={refresh}>Refresh</button>
            </Card>
            <Card title="Mode">
              <div className={(health?.safe_mode ? 'text-warning' : 'text-teal-300') + ' text-lg font-semibold'}>{health?.safe_mode ? 'Safe' : 'Active'}</div>
              <div className="text-xs mt-1">Health: {health?.ok ? 'OK' : 'Unknown'}</div>
            </Card>
            <Card title="Processes">
              <div className="text-lg font-semibold">{procCount !== null ? procCount : (<div className="h-4 w-16 skeleton-bar" />)}</div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
