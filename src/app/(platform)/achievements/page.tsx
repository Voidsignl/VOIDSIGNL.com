'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import {
  Award, Zap, CheckCircle, Star, Flame, Newspaper, MessageCircle,
  Heart, Users, UserPlus, Film, Trophy, Swords, Crown, Shield,
  Lock, Sparkles
} from 'lucide-react'

interface Achievement {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  category: string
  xp_reward: number
  rarity: string
  sort_order: number
  unlocked_at?: string | null
}

type CategoryFilter = 'all' | 'social' | 'competitive' | 'content' | 'milestone' | 'special'

const ICON_MAP: Record<string, any> = {
  'zap': Zap, 'check-circle': CheckCircle, 'star': Star, 'flame': Flame,
  'newspaper': Newspaper, 'message-circle': MessageCircle, 'heart': Heart,
  'users': Users, 'user-plus': UserPlus, 'film': Film, 'trophy': Trophy,
  'swords': Swords, 'crown': Crown, 'shield': Shield,
}

const RARITY_STYLES: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  common:    { bg: 'bg-text-dim/10', border: 'border-text-dim/20', text: 'text-text-dim', glow: '' },
  uncommon:  { bg: 'bg-success/10', border: 'border-success/20', text: 'text-success', glow: '' },
  rare:      { bg: 'bg-cyan/10', border: 'border-cyan/20', text: 'text-cyan', glow: '' },
  epic:      { bg: 'bg-purple/10', border: 'border-purple/20', text: 'text-purple', glow: 'shadow-[0_0_12px_rgba(107,63,224,0.15)]' },
  legendary: { bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', text: 'text-yellow-400', glow: 'shadow-[0_0_16px_rgba(250,204,21,0.12)]' },
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  all:         { label: 'All', color: 'text-text' },
  milestone:   { label: 'Milestones', color: 'text-warning' },
  social:      { label: 'Social', color: 'text-cyan' },
  content:     { label: 'Content', color: 'text-purple' },
  competitive: { label: 'Competitive', color: 'text-danger' },
  special:     { label: 'Special', color: 'text-yellow-400' },
}

export default function AchievementsPage() {
  const supabase = createClient()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [userId, setUserId] = useState<string | null>(null)
  const [totalUnlocked, setTotalUnlocked] = useState(0)
  const [totalXP, setTotalXP] = useState(0)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()

    // Load all achievements
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*')
      .order('sort_order', { ascending: true })

    if (!allAchievements) { setLoading(false); return }

    if (user) {
      setUserId(user.id)
      // Load user's unlocked achievements
      const { data: unlocked } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user.id)

      const unlockedMap = new Map(
        (unlocked || []).map(u => [u.achievement_id, u.unlocked_at])
      )

      const merged = allAchievements.map(a => ({
        ...a,
        unlocked_at: unlockedMap.get(a.id) || null,
      }))

      setAchievements(merged)
      setTotalUnlocked(unlocked?.length || 0)
      setTotalXP(merged.filter(a => a.unlocked_at).reduce((sum, a) => sum + a.xp_reward, 0))
    } else {
      setAchievements(allAchievements.map(a => ({ ...a, unlocked_at: null })))
    }

    setLoading(false)
  }

  const filtered = category === 'all'
    ? achievements
    : achievements.filter(a => a.category === category)

  const unlockedFiltered = filtered.filter(a => a.unlocked_at)
  const lockedFiltered = filtered.filter(a => !a.unlocked_at)
  const progressPct = achievements.length > 0
    ? Math.round((totalUnlocked / achievements.length) * 100)
    : 0

  function timeAgo(date: string) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    if (s < 604800) return `${Math.floor(s / 86400)}d ago`
    return new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-dim text-sm animate-pulse">Loading achievements...</div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-wide flex items-center gap-2">
            <Award size={20} className="text-purple" /> Achievements
          </h1>
          <p className="text-sm text-text-dim mt-0.5">Unlock badges, earn XP, show off your grind</p>
        </div>
      </div>

      {/* Progress card */}
      <div className="vs-card mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple/40 to-transparent" />
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          {/* Circular progress */}
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="#6B3FE0" strokeWidth="6"
                strokeLinecap="round" strokeDasharray={`${progressPct * 2.136} 213.6`}
                className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-purple">{progressPct}%</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-3">
              <div>
                <p className="text-2xl font-bold">{totalUnlocked}<span className="text-text-dim font-normal text-sm">/{achievements.length}</span></p>
                <p className="text-[10px] text-text-dim tracking-wider">UNLOCKED</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-2xl font-bold text-cyan">+{totalXP}</p>
                <p className="text-[10px] text-text-dim tracking-wider">XP EARNED</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-2xl font-bold">{achievements.length - totalUnlocked}</p>
                <p className="text-[10px] text-text-dim tracking-wider">REMAINING</p>
              </div>
            </div>
            <div className="h-2 bg-void rounded-full overflow-hidden">
              <div className="h-full bg-purple rounded-full transition-all duration-1000" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {/* Rarity breakdown */}
          <div className="flex flex-wrap gap-3 shrink-0">
            {['common', 'uncommon', 'rare', 'epic', 'legendary'].map(r => {
              const total = achievements.filter(a => a.rarity === r).length
              const unlocked = achievements.filter(a => a.rarity === r && a.unlocked_at).length
              const style = RARITY_STYLES[r]
              return (
                <div key={r} className="text-center">
                  <p className={`text-sm font-bold ${style.text}`}>{unlocked}/{total}</p>
                  <p className="text-[8px] text-text-dim capitalize">{r}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
        {(Object.entries(CATEGORY_LABELS) as [CategoryFilter, typeof CATEGORY_LABELS[string]][]).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            data-active={category === key}
            className="vs-tab whitespace-nowrap"
          >
            {val.label}
            <span className="ml-1 text-[10px] opacity-50">
              ({key === 'all' ? achievements.length : achievements.filter(a => a.category === key).length})
            </span>
          </button>
        ))}
      </div>

      {/* Unlocked */}
      {unlockedFiltered.length > 0 && (
        <div className="mb-8">
          <p className="vs-label mb-3 flex items-center gap-2">
            <Sparkles size={12} className="text-purple" /> UNLOCKED ({unlockedFiltered.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {unlockedFiltered.map(a => {
              const Icon = ICON_MAP[a.icon] || Award
              const style = RARITY_STYLES[a.rarity]
              return (
                <div key={a.id} className={`vs-card flex items-center gap-3.5 border ${style.border} ${style.glow} hover:border-opacity-40 transition-all`}>
                  <div className={`w-11 h-11 rounded-xl ${style.bg} flex items-center justify-center shrink-0`}>
                    <Icon size={20} className={style.text} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{a.name}</p>
                      <span className={`text-[8px] uppercase tracking-wider ${style.text}`}>{a.rarity}</span>
                    </div>
                    <p className="text-[11px] text-text-dim truncate">{a.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-purple">+{a.xp_reward} XP</span>
                      {a.unlocked_at && <span className="text-[9px] text-text-dim">· {timeAgo(a.unlocked_at)}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Locked */}
      {lockedFiltered.length > 0 && (
        <div>
          <p className="vs-label mb-3 flex items-center gap-2">
            <Lock size={12} className="text-text-dim" /> LOCKED ({lockedFiltered.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lockedFiltered.map(a => {
              const Icon = ICON_MAP[a.icon] || Award
              const style = RARITY_STYLES[a.rarity]
              return (
                <div key={a.id} className="vs-card flex items-center gap-3.5 opacity-50 hover:opacity-70 transition-all">
                  <div className="w-11 h-11 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-text-dim" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{a.name}</p>
                      <span className={`text-[8px] uppercase tracking-wider ${style.text} opacity-60`}>{a.rarity}</span>
                    </div>
                    <p className="text-[11px] text-text-dim truncate">{a.description}</p>
                    <span className="text-[9px] text-purple opacity-60">+{a.xp_reward} XP</span>
                  </div>
                  <Lock size={13} className="text-text-dim shrink-0" />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
