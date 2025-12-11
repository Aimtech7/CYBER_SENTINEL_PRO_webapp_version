"use client"
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Topbar() {
  const [theme, setTheme] = useState<'dark'|'light'>('dark')
  useEffect(() => { (async () => {
    try {
      const r = await fetch('/api/settings/theme')
      const j = await r.json()
      const t = (j.theme || 'dark') as 'dark'|'light'
      setTheme(t)
      document.documentElement.classList.toggle('dark', t === 'dark')
    } catch {}
  })() }, [])
  const toggle = async () => {
    const next = theme === 'dark' ? 'light' : 'dark' as 'dark'|'light'
    setTheme(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    try { await fetch('/api/settings/theme', { method: 'POST', body: JSON.stringify({ theme: next }) }) } catch {}
  }
  return (
    <header className="h-14 px-6 flex items-center justify-between border-b border-[#112136] bg-[#0b1220]">
      <div className="text-sm tracking-widest text-slate-300">CYBER SENTINEL PRO</div>
      <div className="flex items-center gap-3">
        <Link href="/settings" className="p-2 rounded-lg bg-[#0f192a] border border-[#112136]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-slate-300"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.07a2 2 0 1 1-2.83 2.83l-.07-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.1a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.07.06a2 2 0 1 1-2.83-2.83l.06-.07A1.65 1.65 0 0 0 5 15a1.65 1.65 0 0 0-1.51-1 1.65 1.65 0 0 0-1.82.33l-.06.07a2 2 0 1 1-2.83-2.83l.07-.06A1.65 1.65 0 0 0 1 9a1.65 1.65 0 0 0-1-1.51V7a2 2 0 1 1 4 0v.1a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.07-.06a2 2 0 1 1 2.83-2.83l-.06.07A1.65 1.65 0 0 0 9 5c.79 0 1.48-.46 1.82-1.17l.08-.16A2 2 0 1 1 15 3.1l-.1.2c-.15.31-.12.68.08.96.2.28.53.45.88.44H16a2 2 0 1 1 0 4h-.1c-.35 0-.68.17-.88.44-.2.28-.23.65-.08.96l.1.2c.34.71 1.03 1.17 1.82 1.17.79 0 1.48-.46 1.82-1.17l.08-.16A2 2 0 1 1 23 9.1l-.1.2c-.15.31-.12.68.08.96.2.28.53.45.88.44H24a2 2 0 1 1 0 4h-.1c-.35 0-.68.17-.88.44-.2.28-.23.65-.08.96l.1.2Z"/></svg>
        </Link>
        <button onClick={toggle} className="p-2 rounded-lg bg-[#0f192a] border border-[#112136]">
          <div className={"w-9 h-5 rounded-full relative " + (theme === 'dark' ? 'bg-teal-500/30' : 'bg-slate-600')}>
            <div className={"w-5 h-5 bg-teal-300 rounded-full absolute transition-transform " + (theme === 'dark' ? 'translate-x-0' : 'translate-x-4')}></div>
          </div>
        </button>
        <div className="p-2 rounded-lg bg-[#0f192a] border border-[#112136]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-slate-300"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" stroke="currentColor" strokeWidth="2"/><path d="M4 21a8 8 0 1 1 16 0" stroke="currentColor" strokeWidth="2"/></svg>
        </div>
      </div>
    </header>
  )
}
