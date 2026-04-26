'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import {
  Award, Zap, CheckCircle, Star, Flame, Newspaper, MessageCircle,
  Heart, Users, UserPlus, Film, Trophy, Swords, Crown, Shield,
  Lock, Sparkles
} from 'lucide-react'
import { ScopeSpinner } from '@/components/ui/loader'
import { EmptyState } from '@/components/ui/empty-state'

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
        <ScopeSpinner size={28} />
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
            {achievements.length > 0 && (
              <span className="vs-counter text-[10px] text-text-dim tabular-nums ml-1">
                {String(totalUnlocked).padStart(2, '0')} / {String(achievements.length).padStart(2, '0')}
              </span>
            )}
          </h1>
          <p className="text-sm text-text-dim mt-0.5">Unlock badges, earn XP, show off your grind</p>
        </div>
      </div>

      {/* Progress card */}
      <div className="vs-card vs-lit mb-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          {/* Circular progress */}
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="#6B3FE0" strokeWidth="6"
                strokeLinecap="round" strokeDasharray={`${progressPct * 2.136} 213.6`}
                className="transition-all duration-1000"
                style={{ filter: 'drop-shadow(0 0 6px rgba(107,63,224,0.5))' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-purple tabular-nums">{progressPct}%</span>
            </div>
          </div>

          <div className="flex-1 w-full">
            <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-3">
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {totalUnlocked}
                  <span className="text-text-dim font-normal text-sm tabular-nums">/{achievements.length}</span>
                </p>
                <p className="vs-counter text-[10px] text-text-dim mt-0.5">UNLOCKED</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-2xl font-bold text-cyan tabular-nums">+{totalXP.toLocaleString()}</p>
                <p className="vs-counter text-[10px] text-text-dim mt-0.5">XP EARNED</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-2xl font-bold tabular-nums">{achievements.length - totalUnlocked}</p>
                <p className="vs-counter text-[10px] text-text-dim mt-0.5">REMAINING</p>
              </div>
            </div>
            <div className="h-2 bg-void rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple to-cyan rounded-full transition-all duration-1000"
                style={{ width: `${progressPct}%`, boxShadow: '0 0 8px rgba(107,63,224,0.6)' }}
              />
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
                  <p className={`text-sm font-bold tabular-nums ${style.text}`}>{unlocked}/{total}</p>
                  <p className="vs-counter text-[8px] text-text-dim mt-0.5">{r.toUpperCase()}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1">
        {(Object.entries(CATEGORY_LABELS) as [CategoryFilter, typeof CATEGORY_LABELS[string]][]).map(([key, val]) => {
          const count = key === 'all' ? achievements.length : achievements.filter(a => a.category === key).length
          return (
            <button
              key={key}
              onClick={() => setCategory(key)}
              data-active={category === key}
              className="vs-tab whitespace-nowrap shrink-0"
            >
              {val.label}
              {count > 0 && <span className="text-[10px] opacity-60 tabular-nums">({count})</span>}
            </button>
          )
        })}
      </div>

      {/* Empty filter state */}
      {filtered.length === 0 && achievements.length > 0 && (
        <EmptyState
          icon={Award}
          title="No achievements in this category"
          description="Try a different filter."
        />
      )}

      {/* Unlocked */}
      {unlockedFiltered.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="vs-label flex items-center gap-2">
              <Sparkles size={12} className="text-purple" /> UNLOCKED
            </p>
            <span className="vs-counter text-[10px] text-text-dim tabular-nums">
              {String(unlockedFiltered.length).padStart(2, '0')}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {unlockedFiltered.map(a => {
              const Icon = ICON_MAP[a.icon] || Award
              const style = RARITY_STYLES[a.rarity]
              const isHighRarity = a.rarity === 'epic' || a.rarity === 'legendary'
              return (
                <div
                  key={a.id}
                  className={`vs-card vs-brackets ${isHighRarity ? 'vs-lit' : ''} flex items-center gap-3.5 border ${style.border} ${style.glow} hover:border-opacity-40 transition-all`}
                >
                  <div className={`w-11 h-11 rounded-xl ${style.bg} border ${style.border} flex items-center justify-center shrink-0`}>
                    <Icon size={20} className={style.text} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{a.name}</p>
                      <span className={`vs-counter text-[8px] tabular-nums ${style.text}`}>{a.rarity.toUpperCase()}</span>
                    </div>
                    <p className="text-[11px] text-text-dim truncate">{a.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-purple tabular-nums">+{a.xp_reward} XP</span>
                      {a.unlocked_at && (
                        <span className="vs-counter text-[9px] text-text-dim tabular-nums">
                          · {timeAgo(a.unlocked_at)}
                        </span>
                      )}
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
          <div className="flex items-center justify-between mb-3">
            <p className="vs-label flex items-center gap-2">
              <Lock size={12} className="text-text-dim" /> LOCKED
            </p>
            <span className="vs-counter text-[10px] text-text-dim tabular-nums">
              {String(lockedFiltered.length).padStart(2, '0')}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lockedFiltered.map(a => {
              const Icon = ICON_MAP[a.icon] || Award
              const style = RARITY_STYLES[a.rarity]
              return (
                <div
                  key={a.id}
                  className="vs-card vs-brackets flex items-center gap-3.5 opacity-55 hover:opacity-80 transition-all border-dashed"
                  style={{ borderStyle: 'dashed' }}
                >
                  <div className="relative w-11 h-11 rounded-xl bg-surface-2 border border-border flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-text-dim" />
                    <div className="absolute inset-0 rounded-xl bg-void/40" />
                    <Lock size={11} className="absolute text-text-dim" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{a.name}</p>
                      <span className={`vs-counter text-[8px] tabular-nums ${style.text} opacity-60`}>
                        {a.rarity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-dim truncate">{a.description}</p>
                    <span className="text-[9px] text-purple opacity-60 tabular-nums">+{a.xp_reward} XP</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
