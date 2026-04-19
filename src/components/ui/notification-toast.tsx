'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import {
  Bell, Heart, MessageCircle, UserPlus, Trophy, Film, Star,
  Award, Users, Swords, X
} from 'lucide-react'

interface Toast {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
}

const ICON_MAP: Record<string, any> = {
  like: Heart, comment: MessageCircle, follow: UserPlus,
  buddy_request: Users, buddy_accepted: Users, message: MessageCircle,
  clip_like: Film, tournament: Trophy, tournament_start: Swords,
  achievement: Award, xp: Star, level_up: Star, system: Bell,
  welcome: Star, cotw: Trophy, lfg_response: Users,
}

const COLOR_MAP: Record<string, string> = {
  like: 'text-danger', comment: 'text-cyan', follow: 'text-purple',
  buddy_request: 'text-cyan', buddy_accepted: 'text-success', message: 'text-purple',
  clip_like: 'text-danger', tournament: 'text-warning', achievement: 'text-yellow-400',
}

export function NotificationToast({ userId }: { userId: string }) {
  const supabase = createClient()
  const [toasts, setToasts] = useState<Toast[]>([])
  const lastCheck = useRef<string>(new Date().toISOString())

  useEffect(() => {
    const interval = setInterval(checkNewNotifications, 10_000) // Check every 10s
    return () => clearInterval(interval)
  }, [userId])

  async function checkNewNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('id, type, title, body, link')
      .eq('user_id', userId)
      .eq('is_read', false)
      .gt('created_at', lastCheck.current)
      .order('created_at', { ascending: false })
      .limit(3)

    lastCheck.current = new Date().toISOString()

    if (data && data.length > 0) {
      setToasts(prev => [...data as Toast[], ...prev].slice(0, 5))

      // Auto-dismiss after 5 seconds
      data.forEach((d: any) => {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== d.id))
        }, 5000)
      })
    }
  }

  function dismiss(id: string) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-16 right-4 z-[60] space-y-2 w-80">
      {toasts.map(toast => {
        const Icon = ICON_MAP[toast.type] || Bell
        const color = COLOR_MAP[toast.type] || 'text-text-dim'

        const content = (
          <div className="bg-surface border border-border rounded-xl p-3.5 shadow-xl shadow-black/30 flex items-start gap-3 animate-slide-up">
            <div className={`w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium leading-snug">{toast.title}</p>
              {toast.body && <p className="text-[10px] text-text-dim mt-0.5 line-clamp-1">{toast.body}</p>}
            </div>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismiss(toast.id) }}
              className="text-text-dim hover:text-text shrink-0 mt-0.5">
              <X size={13} />
            </button>
          </div>
        )

        if (toast.link) {
          return (
            <Link key={toast.id} href={toast.link} onClick={() => dismiss(toast.id)}>
              {content}
            </Link>
          )
        }
        return <div key={toast.id}>{content}</div>
      })}
    </div>
  )
}
