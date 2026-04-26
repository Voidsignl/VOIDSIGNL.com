'use client'

import { Loader2, ArrowDown } from 'lucide-react'

interface PullIndicatorProps {
  pull: number
  ready: boolean
  refreshing: boolean
  threshold?: number
}

/**
 * Visual indicator for pull-to-refresh. Renders inside the scrollable
 * container, anchored at top with translateY based on pull distance.
 */
export function PullIndicator({ pull, ready, refreshing, threshold = 70 }: PullIndicatorProps) {
  if (pull === 0 && !refreshing) return null

  const visible = pull > 0 || refreshing
  const arrowRotate = ready ? 180 : 0

  return (
    <div
      className="relative w-full pointer-events-none flex items-center justify-center transition-opacity"
      style={{
        height: refreshing ? threshold : pull,
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        className={`flex flex-col items-center gap-1 transition-transform ${
          ready || refreshing ? 'text-purple-light' : 'text-text-dim'
        }`}
      >
        {refreshing ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <ArrowDown
            size={18}
            style={{ transform: `rotate(${arrowRotate}deg)`, transition: 'transform 0.15s' }}
          />
        )}
        <span className="vs-counter text-[9px] tabular-nums">
          {refreshing ? 'REFRESHING' : ready ? 'RELEASE' : 'PULL'}
        </span>
      </div>
    </div>
  )
}
