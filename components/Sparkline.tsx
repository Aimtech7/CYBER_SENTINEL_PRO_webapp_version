"use client"
import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'

export default function Sparkline({ points }: { points: number[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const chart = new Chart(ref.current, {
      type: 'line',
      data: { labels: points.map((_, i) => i + 1), datasets: [{ data: points, borderColor: '#2dd4bf', tension: 0.3, pointRadius: 0, fill: true, backgroundColor: 'rgba(45,212,191,0.08)' }] },
      options: { plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
    })
    return () => chart.destroy()
  }, [points])
  return <canvas ref={ref} height={120} />
}
