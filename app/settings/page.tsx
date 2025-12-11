"use client"
import Sidebar from '@/components/Sidebar'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'

export default function SettingsPage() {
  const [url, setUrl] = useState('')
  const [token, setToken] = useState('')
  const [paired, setPaired] = useState(false)
  const [msg, setMsg] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [theme, setTheme] = useState<'dark'|'light'>('dark')
  const [aiModel, setAiModel] = useState('')
  const [aiHasKey, setAiHasKey] = useState(false)
  const [aiKey, setAiKey] = useState('')
  const { show } = useToast()
  useEffect(() => { (async () => {
    const r = await fetch('/api/settings/agent')
    const j = await r.json()
    setPaired(j.paired)
    setUrl(j.url || '')
    const rt = await fetch('/api/settings/theme')
    const jt = await rt.json()
    setTheme((jt.theme || 'dark') as 'dark'|'light')
    const ra = await fetch('/api/settings/ai')
    const ja = await ra.json()
    setAiHasKey(Boolean(ja.hasKey))
    setAiModel(String(ja.model || ''))
  })() }, [])
  const save = async () => {
    const r = await fetch('/api/settings/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, token }) })
    const j = await r.json()
    setPaired(Boolean(j.ok))
    try {
      await fetch('/api/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'agent_pairing', severity: j.ok ? 'info' : 'warning', message: `paired=${Boolean(j.ok)} url=${url}`, mitre_tags: [] }) })
    } catch {}
    show(j.ok ? 'Agent paired' : 'Pairing failed', j.ok ? 'success' : 'error')
  }
  const test = async () => {
    const start = Date.now()
    const r = await fetch('/api/agent/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: '/health', method: 'GET' }) })
    const j = await r.json()
    setLat(Date.now() - start)
    setMsg(JSON.stringify(j))
    show('Agent health queried', 'success')
  }
  const saveTheme = async () => {
    await fetch('/api/settings/theme', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ theme }) })
    document.documentElement.classList.toggle('dark', theme === 'dark')
    show('Theme saved', 'success')
  }
  const saveAi = async () => {
    try {
      const r = await fetch('/api/settings/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: aiKey, model: aiModel }) })
      const j = await r.json()
      if (j.ok) { setAiHasKey(Boolean(aiKey)); show('AI settings saved', 'success') } else show('Save failed', 'error')
    } catch { show('Save failed', 'error') }
  }
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6 space-y-4 pb-16 md:pb-6">
        <div className="text-2xl font-bold">Settings</div>
        <div className="bg-[#0f192a] border border-[#112136] rounded p-4 space-y-2">
          <div className="font-semibold">Agent Pairing</div>
          <input className="bg-slate-800 px-3 py-2 w-full" value={url} onChange={e=>setUrl(e.target.value)} placeholder="http://localhost:8787" />
          <input className="bg-slate-800 px-3 py-2 w-full" value={token} onChange={e=>setToken(e.target.value)} placeholder="JWT token" />
          <div className="flex gap-2">
            <button className="bg-slate-800 px-3 py-2" onClick={save}>Save</button>
            <button className="bg-slate-800 px-3 py-2" onClick={test}>Test</button>
          </div>
          <div className={`text-sm ${paired ? 'text-info' : 'text-danger'}`}>{paired ? 'Paired' : 'Not Paired'}</div>
          <div className="text-xs">{lat !== null ? `Agent latency: ${lat} ms` : ''}</div>
          <pre className="text-xs overflow-auto max-h-32">{msg}</pre>
        </div>
        <div className="bg-[#0f192a] border border-[#112136] rounded p-4 space-y-2">
          <div className="font-semibold">Appearance</div>
          <select className="bg-slate-800 px-3 py-2 w-full" value={theme} onChange={e=>setTheme(e.target.value as 'dark'|'light')}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
          <button className="bg-slate-800 px-3 py-2" onClick={saveTheme}>Save Theme</button>
        </div>
        <div className="bg-[#0f192a] border border-[#112136] rounded p-4 space-y-2">
          <div className="font-semibold">AI Settings</div>
          <div className="text-xs text-slate-400">OpenAI API Key {aiHasKey ? '(configured)' : '(missing)'}</div>
          <div className="flex gap-2">
            <input className="bg-slate-800 px-3 py-2 w-full" value={aiKey} onChange={e=>setAiKey(e.target.value)} placeholder="sk-..." />
            <input className="bg-slate-800 px-3 py-2" value={aiModel} onChange={e=>setAiModel(e.target.value)} placeholder="gpt-4o-mini" />
            <button className="bg-slate-800 px-3 py-2" onClick={saveAi}>Save</button>
          </div>
        </div>
      </main>
    </div>
  )
}
