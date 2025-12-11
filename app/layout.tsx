"use client"
import './globals.css'
import { ToastProvider } from '@/components/Toast'
import { ReactNode, useEffect } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  useEffect(() => { (async () => {
    try {
      const r = await fetch('/api/settings/theme')
      const j = await r.json()
      const t = j.theme || 'dark'
      document.documentElement.classList.toggle('dark', t === 'dark')
    } catch {}
  })() }, [])
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
