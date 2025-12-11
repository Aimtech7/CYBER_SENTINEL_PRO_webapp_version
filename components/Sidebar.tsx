"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/', label: 'Dashboard' },
  { href: '/threat', label: 'Threat Intelligence' },
  { href: '/siem', label: 'SIEM Analyzer' },
  { href: '/nids', label: 'NIDS' },
  { href: '/websec', label: 'Web Security' },
  { href: '/tools', label: 'Network Tools' },
  { href: '/ai', label: 'AI Threat Assistant' },
  { href: '/chat', label: 'Chatbot' },
  { href: '/settings', label: 'Settings' },
  { href: '/wifi', label: 'WiFi Analyzer' },
  { href: '/sniffer', label: 'Packet Sniffer' },
  { href: '/nmap', label: 'Network Mapper' },
  { href: '/endpoint', label: 'Endpoint Forensics' },
  { href: '/malware', label: 'Malware Sandbox' },
  { href: '/honeypot', label: 'Honeypot' },
  { href: '/report', label: 'Report Builder' },
  { href: '/scheduler', label: 'Scheduler' }
]

export default function Sidebar() {
  const path = usePathname()
  const icon = (key: string) => {
    if (key === '/') return (<svg width="16" height="16" viewBox="0 0 24 24" className="text-slate-300" fill="none"><path d="M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-9Z" stroke="currentColor" strokeWidth="2"/></svg>)
    if (key.includes('threat')) return (<svg width="16" height="16" viewBox="0 0 24 24" className="text-slate-300" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2"/></svg>)
    if (key.includes('siem')) return (<svg width="16" height="16" viewBox="0 0 24 24" className="text-slate-300" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2"/></svg>)
    if (key.includes('tools')) return (<svg width="16" height="16" viewBox="0 0 24 24" className="text-slate-300" fill="none"><path d="M7 7h10v10H7z" stroke="currentColor" strokeWidth="2"/></svg>)
    if (key.includes('ai')) return (<svg width="16" height="16" viewBox="0 0 24 24" className="text-slate-300" fill="none"><path d="M12 3a9 9 0 1 0 9 9" stroke="currentColor" strokeWidth="2"/><path d="M9 10h6M9 14h4" stroke="currentColor" strokeWidth="2"/></svg>)
    if (key.includes('settings')) return (<svg width="16" height="16" viewBox="0 0 24 24" className="text-slate-300" fill="none"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.07a2 2 0 1 1-2.83 2.83l-.07-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.1a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.07.06a2 2 0 1 1-2.83-2.83l.06-.07A1.65 1.65 0 0 0 5 15" stroke="currentColor" strokeWidth="2"/></svg>)
    if (key.includes('wifi')) return (<svg width="16" height="16" viewBox="0 0 24 24" className="text-slate-300" fill="none"><path d="M2 9c5-5 15-5 20 0M6 13c3-3 9-3 12 0M10 17c1-1 3-1 4 0" stroke="currentColor" strokeWidth="2"/></svg>)
    if (key.includes('sniffer')) return (<svg width="16" height="16" viewBox="0 0 24 24" className="text-slate-300" fill="none"><path d="M4 5h16v4H4zM4 15h16v4H4z" stroke="currentColor" strokeWidth="2"/></svg>)
    if (key.includes('nmap')) return (<svg width="16" height="16" viewBox="0 0 24 24" className="text-slate-300" fill="none"><path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="2"/></svg>)
    if (key.includes('endpoint')) return (<svg width="16" height="16" viewBox="0 0 24 24" className="text-slate-300" fill="none"><path d="M4 6h8v12H4zM14 10h6v8h-6z" stroke="currentColor" strokeWidth="2"/></svg>)
    if (key.includes('malware')) return (<svg width="16" height="16" viewBox="0 0 24 24" className="text-slate-300" fill="none"><path d="M12 3l3 6-3 12-3-12 3-6Z" stroke="currentColor" strokeWidth="2"/></svg>)
    if (key.includes('honeypot')) return (<svg width="16" height="16" viewBox="0 0 24 24" className="text-slate-300" fill="none"><path d="M12 3l9 5-9 5-9-5 9-5Zm0 10l9 5-9 5-9-5 9-5Z" stroke="currentColor" strokeWidth="2"/></svg>)
    if (key.includes('report')) return (<svg width="16" height="16" viewBox="0 0 24 24" className="text-slate-300" fill="none"><path d="M6 4h9l3 3v13H6z" stroke="currentColor" strokeWidth="2"/></svg>)
    if (key.includes('scheduler')) return (<svg width="16" height="16" viewBox="0 0 24 24" className="text-slate-300" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="2"/></svg>)
    return (<div className="w-5 h-5 rounded-md bg-[#0f192a] border border-[#112136]"></div>)
  }
  return (
    <>
      <aside className="hidden md:block w-64 shrink-0 bg-[#0b1220] border-r border-[#112136]">
        <div className="h-14 flex items-center px-4">
          <div className="w-2 h-2 rounded-full bg-teal-400 mr-2"></div>
          <div className="text-slate-300 font-semibold">AI Assistant</div>
        </div>
        <nav className="flex flex-col">
          {items.map(i => {
            const active = path === i.href
            return (
              <Link prefetch={false} key={i.href} href={i.href} title={i.label} className={"px-4 py-3 flex items-center gap-3 border-l-4 " + (active ? 'border-teal-400 bg-[#0f192a]' : 'border-transparent hover:bg-[#0f192a]') }>
                {icon(i.href)}
                <div className={"text-sm " + (active ? 'text-teal-300' : 'text-slate-300')}>{i.label}</div>
              </Link>
            )
          })}
        </nav>
      </aside>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0b1220] border-t border-[#112136]">
        <div className="px-2 py-2 flex items-center gap-3 overflow-x-auto">
          {items.map(i => {
            const active = path === i.href
            return (
              <Link prefetch={false} key={i.href} href={i.href} title={i.label} className={(active ? 'bg-[#0f192a] text-teal-300' : 'text-slate-300') + ' flex items-center gap-1 px-2 py-1 rounded flex-shrink-0'}>
                {icon(i.href)}
                <div className="text-[10px]">{i.label}</div>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
