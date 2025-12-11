import { supabaseServer } from './supabase'

let memConfig: Record<string, string> = {}
let memAudit: Array<{ type: string; severity: string; message: string; mitre_tags: string[] }> = []
let memHistory: Array<{ q: string; a: string; ts: number }> = []

function trySupabase() {
  try {
    return supabaseServer()
  } catch {
    return null
  }
}

export async function ensureSchema() {}

export async function writeAudit(entry: { type: string; severity: string; message: string; mitre_tags: string[] }) {
  const s = trySupabase()
  if (s) {
    const { type, severity, message, mitre_tags } = entry
    await s.from('audit_logs').insert({ type, severity, message, mitre_tags: mitre_tags.join(',') })
    return
  }
  memAudit.push(entry)
}

export async function setConfig(key: string, value: string) {
  const s = trySupabase()
  if (s) {
    await s.from('app_config').upsert({ k: key, v: value }, { onConflict: 'k' })
    return
  }
  memConfig[key] = value
}

export async function getConfig(key: string) {
  const s = trySupabase()
  if (s) {
    const r = await s.from('app_config').select('v').eq('k', key).limit(1).maybeSingle()
    const dbv = (r.data as any)?.v
    if (dbv) return dbv
  }
  const v = memConfig[key]
  if (v) return v
  if (key === 'agent_url') return process.env.AGENT_URL || ''
  if (key === 'agent_token') return process.env.AGENT_TOKEN || ''
  return ''
}

export async function writeChatHistory(q: string, a: string) {
  const s = trySupabase()
  if (s) {
    await s.from('ai_history').insert({ q, a, ts: Date.now() })
    return
  }
  memHistory.push({ q, a, ts: Date.now() })
}

export async function listChatHistory(limit = 10) {
  const s = trySupabase()
  if (s) {
    const r = await s.from('ai_history').select('q,a,ts').order('ts', { ascending: false }).limit(limit)
    return (r.data as any[]) || []
  }
  return memHistory.slice().sort((a,b)=>b.ts-a.ts).slice(0, limit)
}
