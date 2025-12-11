import { NextRequest, NextResponse } from 'next/server'
import tls from 'tls'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  try {
    const r = await fetch(url, { method: 'GET' })
    const headers: Record<string, string> = {}
    r.headers.forEach((v, k) => { headers[k.toLowerCase()] = v })
    const out: any = { headers, risks: [] as string[] }
    if (!headers['strict-transport-security']) out.risks.push('Missing HSTS')
    if (!headers['content-security-policy']) out.risks.push('Missing CSP')
    if (!headers['x-frame-options']) out.risks.push('Missing X-Frame-Options')
    if (!headers['x-content-type-options']) out.risks.push('Missing X-Content-Type-Options')
    // TLS check
    try {
      const { hostname } = new URL(url)
      const data = await new Promise<any>((resolve) => {
        const s = tls.connect({ host: hostname, port: 443, servername: hostname })
        s.on('secureConnect', () => {
          const cert = s.getPeerCertificate(true)
          resolve({ valid_from: cert.valid_from, valid_to: cert.valid_to, subject: cert.subject, issuer: cert.issuer })
          s.destroy()
        })
        s.on('error', () => resolve({}))
        s.setTimeout(5000, () => resolve({}))
      })
      out.cert = data
    } catch {}
    return NextResponse.json(out)
  } catch (e) {
    return NextResponse.json({ error: 'analyze_failed' }, { status: 500 })
  }
}
