import { NextRequest, NextResponse } from 'next/server'
import tls from 'tls'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { hostport } = await req.json()
  if (!hostport) return NextResponse.json({ error: 'missing hostport' }, { status: 400 })
  const [host, portStr] = String(hostport).split(':')
  const port = Number(portStr || '443')
  const data = await new Promise<any>((resolve) => {
    const s = tls.connect({ host, port, servername: host })
    let done = false
    const finish = (d: any) => {
      if (done) return
      done = true
      try { s.destroy() } catch {}
      resolve(d)
    }
    s.on('secureConnect', () => {
      const cert = s.getPeerCertificate(true)
      finish({ subject: cert.subject, issuer: cert.issuer, valid_from: cert.valid_from, valid_to: cert.valid_to, altname: cert.subjectaltname })
    })
    s.on('error', (e: any) => finish({ error: e?.message || 'cert error' }))
    s.setTimeout(7000, () => finish({ error: 'timeout' }))
  })
  return NextResponse.json(data)
}
