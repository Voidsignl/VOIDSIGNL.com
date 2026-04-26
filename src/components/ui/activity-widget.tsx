'use client'

/**
 * Recent activity widget — last 8 events targeted at the current user.
 * Reuses the notifications table since it's already a normalized event log.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import {
  Bell, Heart, MessageCircle, UserPlus, Trophy, Film, Star, Award,
  Users, Swords, type LucideIcon,
} from 'lucide-react'

interface Activity {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  created_at: string
}

const ICON_MAP: Record<string, LucideIcon> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  buddy_request: Users,
  buddy_accepted: Users,
  message: MessageCircle,
  clip_like: Film,
  tournament: Trophy,
  tournament_start: Swords,
  achievement: Award,
  xp: Star,
  level_up: Star,
  cotw: Trophy,
  lfg_response: Users,
  lfg_accepted: Users,
}

const COLOR_MAP: Record<string, string> = {
  like: 'text-danger',
  comment: 'text-cyan',
  follow: 'text-purple-light',
  buddy_request: 'text-cyan',
  buddy_accepted: 'text-success',
  message: 'text-purple-light',
  clip_like: 'text-danger',
  tournament: 'text-warning',
  achievement: 'text-yellow-400',
  xp: 'text-purple-light',
  level_up: 'text-cyan',
  cotw: 'text-yellow-400',
  lfg_response: 'text-cyan',
  lfg_accepted: 'text-success',
}

interface ActivityWidgetProps {
  userId: string
}

export function ActivityWidget({ userId }: ActivityWidgetProps) {
  const supabase = createClient()
  const [items, setItems] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data } = await supabase
        .from('notifications')
        .select('id, type, title, body, link, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(8)
      if (!cancelled) {
        setItems((data || []) as Activity[])
        setLoading(false)
      }
    }

    load()

    // Realtime: prepend new entries
    const chan = supabase
      .channel(`activity-widget:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as Activity
          setItems(prev => [row, ...prev].slice(0, 8))
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      void supabase.removeChannel(chan)
    }
  }, [userId])

  function timeAgo(date: string): string {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (s < 60) return 'now'
    if (s < 3600) return `${Math.floor(s / 60)}m`
    if (s < 86400) return `${Math.floor(s / 3600)}h`
    if (s < 604800) return `${Math.floor(s / 86400)}d`
    return new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="vs-card vs-lit">
      <div className="flex items-center justify-between mb-3">
        <p className="vs-label">RECENT ACTIVITY</p>
        <Link href="/notifications" className="text-[10px] text-cyan hover:text-cyan/80 transition-colors tracking-wide">
          See all →
        </Link>
      </div>
      {loading ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-start gap-2 animate-pulse">
              <div className="w-6 h-6 rounded-md bg-surface-2 shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-2.5 bg-surface-2 rounded w-3/4" />
                <div className="h-2 bg-surface-2 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-text-dim italic">Nothing yet — check back when others interact with you.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map(item => {
            const Icon = ICON_MAP[item.type] || Bell
            const color = COLOR_MAP[item.type] || 'text-text-dim'
            const inner = (
              <>
                <div className={`w-6 h-6 rounded-md bg-surface-2 flex items-center justify-center shrink-0 ${color}`}>
                  <Icon size={11} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-text/85 leading-tight line-clamp-2">{item.title}</p>
                  <p className="vs-counter text-[9px] text-text-dim mt-0.5 tabular-nums">{timeAgo(item.created_at)}</p>
                </div>
              </>
            )
            return (
              <li key={item.id}>
                {item.link ? (
                  <Link href={item.link} className="flex items-start gap-2 hover:opacity-80 transition-opacity">
                    {inner}
                  </Link>
                ) : (
                  <div className="flex items-start gap-2">{inner}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
