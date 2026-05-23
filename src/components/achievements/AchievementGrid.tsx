'use client'

import { useState } from 'react'
import AchievementCard, { type AchievementCardData } from './AchievementCard'

const CATEGORY_LABELS: Record<string, string> = {
  social: 'Sociaal',
  clips: 'Clips',
  progression: 'Progressie',
  special: 'Speciaal',
  tournaments: 'Tournaments',
}

const CATEGORY_ORDER = ['social', 'clips', 'progression', 'special', 'tournaments']

interface AchievementGridProps {
  grouped: Record<string, AchievementCardData[]>
  stats: {
    total: number
    unlocked: number
    xp_from_achievements: number
  }
}

export default function AchievementGrid({ grouped, stats }: AchievementGridProps) {
  const [openCategory, setOpenCategory] = useState<string | null>(null)

  const pct = stats.total > 0 ? Math.round((stats.unlocked / stats.total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Stats header */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-xs text-text-dim uppercase tracking-widest">
            Voortgang
          </span>
          <span className="font-mono text-sm text-text">
            {stats.unlocked}/{stats.total}
          </span>
        </div>
        <div className="w-full h-1.5 bg-void rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #6B3FE0, #00C8F0)',
            }}
          />
        </div>
        <div className="flex justify-between">
          <span className="font-mono text-[10px] text-text-dim">{pct}% behaald</span>
          {stats.xp_from_achievements > 0 && (
            <span className="font-mono text-[10px] text-purple">
              +{stats.xp_from_achievements.toLocaleString()} XP verdiend
            </span>
          )}
        </div>
      </div>

      {/* Per categorie */}
      {CATEGORY_ORDER.map(cat => {
        const items = grouped[cat]
        if (!items?.length) return null
        const unlockedInCat = items.filter(a => a.is_unlocked).length
        const isExplicitlyOpen = openCategory === cat
        const isCollapsedAll = openCategory !== null && openCategory !== cat

        return (
          <div key={cat}>
            <button
              onClick={() => setOpenCategory(isExplicitlyOpen ? null : cat)}
              className="w-full flex items-center justify-between mb-3 group"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase">
                  {CATEGORY_LABELS[cat] ?? cat}
                </span>
                <span className="font-mono text-[10px] text-text-dim/60">
                  {unlockedInCat}/{items.length}
                </span>
                {cat === 'tournaments' && (
                  <span className="font-mono text-[8px] tracking-widest text-text-dim/60 border border-border px-2 py-0.5 rounded-full">
                    SOON
                  </span>
                )}
              </div>
              <span className="text-text-dim/60 group-hover:text-text-dim transition-colors font-mono text-xs">
                {isExplicitlyOpen ? '↑' : '↓'}
              </span>
            </button>

            {!isCollapsedAll && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {items.map(achievement => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
