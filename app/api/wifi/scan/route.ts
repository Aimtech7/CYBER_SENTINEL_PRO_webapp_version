import { NextResponse } from 'next/server'
import { ensureSchema, getConfig, setConfig } from '@/lib/db'
import os from 'os'
import { promisify } from 'util'
import { exec as _exec } from 'child_process'
const exec = promisify(_exec)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await ensureSchema()
    const savedUrl = await getConfig('agent_url')
    const savedToken = await getConfig('agent_token')
    const envUrl = process.env.AGENT_URL || ''
    const envToken = process.env.AGENT_TOKEN || ''
    const url = String(savedUrl || envUrl || '')
    const token = String(savedToken || envToken || '')
    const failCountRaw = await getConfig('agent_fail_count')
    const failTsRaw = await getConfig('agent_last_fail_ts')
    const failCount = parseInt(String(failCountRaw||'0')) || 0
    const failTs = parseInt(String(failTsRaw||'0')) || 0
    const now = Date.now()
    const breakerOpen = url && token && failCount >= 3 && (now - failTs) < 120000
    if (url && token && !breakerOpen) {
      try {
        const ctrl = new AbortController()
        const to = setTimeout(() => { try { ctrl.abort() } catch {} }, 5000)
        const r = await fetch(url + '/wifi/scan?t=' + Date.now(), { headers: { 'Authorization': `Bearer ${token}` }, signal: ctrl.signal })
        clearTimeout(to)
        if (r.ok) {
          const j = await r.json()
          const agentNets = Array.isArray(j?.networks) ? j.networks : []
          if (agentNets.length > 0) {
            await setConfig('agent_fail_count', '0')
            await setConfig('agent_last_fail_ts', String(now))
            return NextResponse.json({ ok: true, source: 'agent', ts: Date.now(), networks: agentNets }, { headers: { 'Cache-Control': 'no-store' } })
          }
        }
        await setConfig('agent_fail_count', String(failCount + 1))
        await setConfig('agent_last_fail_ts', String(now))
      } catch {}
    }
    const local = await scanLocal()
    if (local.length > 0) {
      return NextResponse.json({ ok: true, source: url && token ? 'agent+local' : 'local', ts: Date.now(), networks: local }, { headers: { 'Cache-Control': 'no-store' } })
    }
    return NextResponse.json({ error: breakerOpen ? 'agent_degraded' : (url && token ? 'agent_unreachable' : 'not paired') }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ error: 'scan_failed' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}

async function scanLocal(): Promise<Array<{ ssid: string; bssid: string; signal: string; channel?: number; security?: string }>> {
  const platform = os.platform()
  if (platform === 'win32') {
    try {
      const { stdout } = await exec('netsh wlan show networks mode=bssid')
      const lines = stdout.split(/\r?\n/)
      const out: Array<{ ssid: string; bssid: string; signal: string; channel?: number; security?: string }> = []
      let ssid = ''
      let auth = ''
      let enc = ''
      for (const raw of lines) {
        const line = raw.trim()
        const mSsid = line.match(/^SSID\s+\d+\s*:\s*(.+)$/i)
        if (mSsid) { ssid = mSsid[1].trim(); auth = ''; enc = ''; continue }
        const mAuth = line.match(/^Authentication\s*:\s*(.+)$/i)
        if (mAuth) { auth = mAuth[1].trim(); continue }
        const mEnc = line.match(/^Encryption\s*:\s*(.+)$/i)
        if (mEnc) { enc = mEnc[1].trim(); continue }
        const mBssid = line.match(/^BSSID\s+\d+\s*:\s*([0-9A-Fa-f:]{17})$/)
        if (mBssid) {
          out.push({ ssid, bssid: mBssid[1].toUpperCase(), signal: '0%' })
          continue
        }
        const mSig = line.match(/^Signal\s*:\s*(\d+)%$/i)
        if (mSig && out.length) { out[out.length - 1].signal = `${mSig[1]}%`; continue }
        const mChan = line.match(/^Channel\s*:\s*(\d+)$/i)
        if (mChan && out.length) { out[out.length - 1].channel = parseInt(mChan[1]); continue }
        if (line.startsWith('SSID') || line === '') continue
        if (out.length && (auth || enc)) out[out.length - 1].security = [auth, enc].filter(Boolean).join(' ')
      }
      return out
    } catch {
      return []
    }
  }
  if (platform === 'linux') {
    try {
      const { stdout } = await exec("nmcli -f SSID,BSSID,SIGNAL,CHAN,SECURITY device wifi list || iwlist scan 2>/dev/null")
      const lines = stdout.split(/\r?\n/).filter(l=>l.trim())
      const out: Array<{ ssid: string; bssid: string; signal: string; channel?: number; security?: string }> = []
      for (const line of lines.slice(1)) {
        const parts = line.trim().split(/\s{2,}/)
        if (parts.length >= 5) {
          const [ssid,bssid,signal,chan,sec] = parts
          out.push({ ssid: ssid || 'Unknown', bssid: (bssid||'').toUpperCase(), signal: `${signal}%`, channel: parseInt(chan)||undefined, security: sec })
        }
      }
      return out
    } catch { return [] }
  }
  if (platform === 'darwin') {
    try {
      const { stdout } = await exec('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -s')
      const lines = stdout.split(/\r?\n/).filter(l=>l.trim())
      const out: Array<{ ssid: string; bssid: string; signal: string; channel?: number; security?: string }> = []
      for (const line of lines.slice(1)) {
        const parts = line.trim().split(/\s+/)
        const ssid = parts[0]
        const bssid = (parts[1]||'').toUpperCase()
        const rssi = parseInt(parts[2]||'0')
        const channel = parseInt(parts[3]||'0')
        const security = parts.slice(6).join(' ')
        const pct = Math.max(0, Math.min(100, 2*(rssi+100)))
        out.push({ ssid, bssid, signal: `${pct}%`, channel, security })
      }
      return out
    } catch { return [] }
  }
  return []
}
