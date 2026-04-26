'use client'

/**
 * Daily login streak widget. Reads from profile.streak_count / streak_best
 * which are kept in sync server-side by the check_in_streak RPC.
 *
 * Shows flame icon + current streak + best, hours until midnight to maintain.
 */
import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'
import { useLang } from '@/lib/lang-context'

interface StreakWidgetProps {
  current: number
  best: number
  /** ISO date of last check-in. Used to compute "hours left today". */
  lastDate: string | null | undefined
}

function hoursUntilMidnight() {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  const diffH = (midnight.getTime() - now.getTime()) / 3_600_000
  return Math.max(0, Math.ceil(diffH))
}

export function StreakWidget({ current, best, lastDate }: StreakWidgetProps) {
  const [hoursLeft, setHoursLeft] = useState(hoursUntilMidnight())
  const { t } = useLang()

  useEffect(() => {
    const interval = setInterval(() => setHoursLeft(hoursUntilMidnight()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10)
  const checkedInToday = lastDate === today
  const aboutToBreak = !checkedInToday && lastDate === yesterday && current > 0

  const flameTone =
    current >= 30 ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' :
    current >= 7 ? 'text-warning drop-shadow-[0_0_8px_rgba(239,159,39,0.4)]' :
    current > 0 ? 'text-warning' :
    'text-text-dim'

  return (
    <div className="vs-card vs-lit flex items-center gap-3">
      <div className="relative">
        <Flame size={36} className={flameTone} fill={current > 0 ? 'currentColor' : 'none'} strokeWidth={1.5} />
        {current > 0 && (
          <span className="absolute inset-0 flex items-center justify-center vs-counter text-[10px] font-bold tabular-nums text-void">
            {current}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="vs-counter text-[10px] tabular-nums text-text-dim">
          {t('streak.label')} · {String(current).padStart(2, '0')} {current === 1 ? t('streak.day') : t('streak.days')}
        </p>
        {current === 0 ? (
          <p className="text-xs text-text-muted mt-1">{t('streak.startNow')}</p>
        ) : aboutToBreak ? (
          <p className="text-xs text-warning mt-1 leading-tight">
            <span className="tabular-nums">{hoursLeft}h</span> {t('streak.aboutToBreak')}
          </p>
        ) : (
          <p className="text-xs text-text-muted mt-1 leading-tight">
            {t('streak.best')}: <span className="tabular-nums text-purple-light">{best}</span>
            {checkedInToday && current >= 7 && current % 7 === 0 && (
              <span className="ml-2 text-cyan">+{current * 5} XP bonus!</span>
            )}
          </p>
        )}
      </div>
    </div>
  )
}
