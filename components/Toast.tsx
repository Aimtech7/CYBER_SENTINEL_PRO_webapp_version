"use client"
import { createContext, useContext, useEffect, useState } from 'react'

type Toast = { id: number; text: string; type: 'success'|'error'|'info' }
const C = createContext<{ show: (text: string, type?: 'success'|'error'|'info') => void } | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([])
  const show = (text: string, type: 'success'|'error'|'info' = 'info') => {
    const id = Date.now() + Math.random()
    setList(l => [...l, { id, text, type }])
    setTimeout(() => setList(l => l.filter(x => x.id !== id)), 3000)
  }
  return (
    <C.Provider value={{ show }}>
      {children}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {list.map(t => (
          <div key={t.id} className={"px-3 py-2 rounded border text-sm shadow " + (t.type==='success'?'border-teal-500 text-teal-300':t.type==='error'?'border-red-500 text-red-400':'border-slate-600 text-slate-300')}>{t.text}</div>
        ))}
      </div>
    </C.Provider>
  )
}

export function useToast() {
  const ctx = useContext(C)
  if (!ctx) return { show: (_: string) => {} }
  return ctx
}
