'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface MetricsResponse {
  errors_1h?: number
  db_stats?: {
    pending_coaches?: number
    pending_games?: number
  }
}

export default function SystemAlertBanner() {
  const [alerts, setAlerts] = useState<string[]>([])
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    async function checkAlerts() {
      try {
        const res = await fetch('/api/admin/metrics')
        if (!res.ok) return
        const json = (await res.json()) as MetricsResponse

        const next: string[] = []
        if ((json.errors_1h ?? 0) > 50) {
          next.push(`${json.errors_1h} API errors laatste uur`)
        }
        if ((json.db_stats?.pending_coaches ?? 0) > 10) {
          next.push(`${json.db_stats?.pending_coaches} coach aanvragen wachten`)
        }
        if ((json.db_stats?.pending_games ?? 0) > 20) {
          next.push(`${json.db_stats?.pending_games} game aanvragen wachten`)
        }
        setAlerts(next)
      } catch {
        /* stille fail */
      }
    }

    checkAlerts()
    const interval = setInterval(checkAlerts, 60_000)
    return () => clearInterval(interval)
  }, [])

  if (!alerts.length || dismissed) return null

  return (
    <div className="bg-danger/8 border-b border-danger/20 px-4 py-2.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-2 h-2 rounded-full bg-danger shrink-0 animate-pulse" />
        <p className="font-mono text-xs text-danger truncate">
          {alerts[0]}
          {alerts.length > 1 && ` +${alerts.length - 1} meer`}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/admin/system"
          className="font-mono text-[10px] text-danger hover:text-text transition-colors duration-200 underline"
        >
          Bekijk
        </Link>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Sluiten"
          className="font-mono text-[10px] text-text-dim hover:text-text-muted transition-colors duration-200"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
