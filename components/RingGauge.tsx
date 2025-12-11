"use client"
import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'

export default function RingGauge({ value, label }: { value: number; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const ctx = ref.current.getContext('2d')
    if (!ctx) return
    const g = ctx.createLinearGradient(0, 0, 160, 160)
    g.addColorStop(0, '#2dd4bf')
    g.addColorStop(1, '#22d3ee')
    const chart = new Chart(ref.current, {
      type: 'doughnut',
      data: { labels: ['risk', 'rest'], datasets: [{ data: [value, 100 - value], backgroundColor: [g, '#0b1220'], borderWidth: 0 }] },
      options: { cutout: '70%', plugins: { legend: { display: false }, tooltip: { enabled: false } } }
    })
    return () => chart.destroy()
  }, [value])
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <canvas ref={ref} width={160} height={160} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-slate-300 text-sm">{label}</div>
        </div>
      </div>
    </div>
  )
}
