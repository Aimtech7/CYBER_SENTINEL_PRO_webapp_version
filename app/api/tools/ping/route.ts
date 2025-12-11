import { NextRequest, NextResponse } from 'next/server'
import net from 'net'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { host } = await req.json()
  if (!host) return NextResponse.json({ error: 'missing host' }, { status: 400 })
  const start = Date.now()
  const result = await new Promise<{ reachable: boolean; ms: number; error?: string }>((resolve) => {
    const socket = net.createConnection(80, host)
    let done = false
    const finish = (ok: boolean, err?: string) => {
      if (done) return
      done = true
      socket.destroy()
      const ms = Date.now() - start
      resolve({ reachable: ok, ms, error: err })
    }
    socket.on('connect', () => finish(true))
    socket.on('error', (e: any) => finish(false, e?.message || 'error'))
    socket.setTimeout(5000, () => finish(false, 'timeout'))
  })
  return NextResponse.json(result)
}
