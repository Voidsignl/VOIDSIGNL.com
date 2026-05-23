'use client'

import { useEffect, useState } from 'react'

export interface AchievementPopupData {
  name: string
  description: string
  icon: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  xp_reward: number
}

interface AchievementPopupProps {
  achievement: AchievementPopupData | null
  onClose: () => void
}

const RARITY_COLORS: Record<string, { primary: string; glow: string; label: string }> = {
  common: { primary: '#9998aa', glow: 'rgba(153,152,170,0.3)', label: 'Common' },
  uncommon: { primary: '#22c55e', glow: 'rgba(34,197,94,0.3)', label: 'Uncommon' },
  rare: { primary: '#00C8F0', glow: 'rgba(0,200,240,0.3)', label: 'Rare' },
  epic: { primary: '#6B3FE0', glow: 'rgba(107,63,224,0.4)', label: 'Epic' },
  legendary: { primary: '#f59e0b', glow: 'rgba(245,158,11,0.4)', label: 'Legendary' },
}

export default function AchievementUnlockPopup({ achievement, onClose }: AchievementPopupProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!achievement) return
    const t1 = setTimeout(() => setVisible(true), 50)
    const t2 = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 400)
    }, 4000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [achievement, onClose])

  if (!achievement) return null

  const colors = RARITY_COLORS[achievement.rarity] ?? RARITY_COLORS.common

  return (
    <>
      <div
        className="fixed inset-0 z-50 transition-opacity duration-400"
        style={{
          background: 'rgba(14,14,18,0.85)',
          opacity: visible ? 1 : 0,
          backdropFilter: 'blur(4px)',
        }}
        onClick={() => { setVisible(false); setTimeout(onClose, 400) }}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto transition-all duration-400 mx-4"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(20px)',
          }}
        >
          <div
            className="relative rounded-2xl border-2 p-8 text-center max-w-sm w-full"
            style={{
              background: '#0e0e12',
              borderColor: colors.primary,
              boxShadow: `0 0 60px ${colors.glow}, 0 0 120px ${colors.glow}`,
            }}
          >
            <p
              className="font-mono text-[10px] uppercase tracking-[0.3em] mb-4"
              style={{ color: colors.primary }}
            >
              Achievement Unlocked
            </p>

            <div
              className="text-6xl mb-5 mx-auto w-24 h-24 flex items-center justify-center rounded-full"
              style={{
                background: colors.glow,
                border: `2px solid ${colors.primary}`,
                boxShadow: `0 0 30px ${colors.glow}`,
              }}
            >
              {achievement.icon}
            </div>

            <h2 className="font-mono text-2xl font-bold mb-2" style={{ color: colors.primary }}>
              {achievement.name}
            </h2>

            <p className="text-text-dim text-sm mb-5 leading-relaxed">
              {achievement.description}
            </p>

            <div className="flex items-center justify-center gap-4">
              <span
                className="font-mono text-xs uppercase tracking-widest px-3 py-1 rounded-full border"
                style={{ borderColor: colors.primary, color: colors.primary, background: colors.glow }}
              >
                {colors.label}
              </span>
              {achievement.xp_reward > 0 && (
                <span className="font-mono text-xs text-text">
                  +{achievement.xp_reward} XP
                </span>
              )}
            </div>

            <p className="text-text-dim/60 text-[10px] font-mono mt-5">
              Klik om te sluiten
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
