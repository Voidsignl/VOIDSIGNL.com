'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import {
  Bell, Heart, MessageCircle, UserPlus, Trophy, Film, Star,
  Award, Users, Swords, Check, CheckCheck, Trash2, Filter,
  Settings, X, BellOff
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { ScopeSpinner } from '@/components/ui/loader'

interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  is_read: boolean
  link: string | null
  created_at: string
}

type NotifFilter = 'all' | 'unread' | 'social' | 'competitive' | 'system'

const TYPE_CONFIG: Record<string, { icon: any; color: string; category: string }> = {
  like:            { icon: Heart, color: 'text-danger', category: 'social' },
  comment:         { icon: MessageCircle, color: 'text-cyan', category: 'social' },
  follow:          { icon: UserPlus, color: 'text-purple', category: 'social' },
  buddy_request:   { icon: Users, color: 'text-cyan', category: 'social' },
  buddy_accepted:  { icon: Users, color: 'text-success', category: 'social' },
  message:         { icon: MessageCircle, color: 'text-purple', category: 'social' },
  clip_like:       { icon: Film, color: 'text-danger', category: 'social' },
  tournament:      { icon: Trophy, color: 'text-warning', category: 'competitive' },
  tournament_start:{ icon: Swords, color: 'text-danger', category: 'competitive' },
  lfg_response:    { icon: Users, color: 'text-cyan', category: 'competitive' },
  achievement:     { icon: Award, color: 'text-yellow-400', category: 'system' },
  xp:              { icon: Star, color: 'text-purple', category: 'system' },
  level_up:        { icon: Star, color: 'text-cyan', category: 'system' },
  system:          { icon: Bell, color: 'text-text-dim', category: 'system' },
  welcome:         { icon: Star, color: 'text-purple', category: 'system' },
  cotw:            { icon: Trophy, color: 'text-yellow-400', category: 'competitive' },
}

export default function NotificationsPage() {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<NotifFilter>('all')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    loadNotifications(user.id)
  }

  async function loadNotifications(uid: string) {
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(100)
    if (data) setNotifications(data as Notification[])
    setLoading(false)
  }

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllRead() {
    if (!userId) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  function getConfig(type: string) {
    return TYPE_CONFIG[type] || TYPE_CONFIG.system
  }

  function timeAgo(date: string) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    if (s < 604800) return `${Math.floor(s / 86400)}d ago`
    return new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })
  }

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read
    if (filter === 'all') return true
    return getConfig(n.type).category === filter
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ScopeSpinner size={28} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-wide flex items-center gap-2">
            <Bell size={20} className="text-purple" />
            Notifications
            {unreadCount > 0 && (
              <span className="vs-counter px-1.5 h-[18px] min-w-[20px] rounded-full bg-danger text-white text-[10px] flex items-center justify-center font-medium tabular-nums">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </h1>
          <p className="vs-counter text-[11px] text-text-dim mt-1 tabular-nums">
            {String(notifications.length).padStart(2, '0')} TOTAL · {String(unreadCount).padStart(2, '0')} UNREAD
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="vs-btn vs-btn-ghost text-xs">
            <CheckCheck size={13} /> Mark all read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1">
        {[
          { id: 'all' as NotifFilter, label: 'All', count: notifications.length },
          { id: 'unread' as NotifFilter, label: 'Unread', count: unreadCount },
          { id: 'social' as NotifFilter, label: 'Social', count: notifications.filter(n => getConfig(n.type).category === 'social').length },
          { id: 'competitive' as NotifFilter, label: 'Competitive', count: notifications.filter(n => getConfig(n.type).category === 'competitive').length },
          { id: 'system' as NotifFilter, label: 'System', count: notifications.filter(n => getConfig(n.type).category === 'system').length },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            data-active={filter === f.id}
            className="vs-tab shrink-0"
          >
            {f.label}
            {f.count > 0 && <span className="text-[10px] opacity-60 tabular-nums">({f.count})</span>}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title={filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
          description={filter === 'unread' ? 'Geen ongelezen meldingen.' : 'Updates verschijnen hier zodra ze binnenkomen.'}
        />
      ) : (
        <div className="space-y-1">
          {filtered.map(notif => {
            const config = getConfig(notif.type)
            const Icon = config.icon

            const content = (
              <div className={`relative flex items-start gap-3.5 px-4 py-3.5 rounded-xl transition-all ${
                notif.is_read
                  ? 'hover:bg-surface/50'
                  : 'bg-surface border border-border hover:border-border-hover'
              }`}>
                {/* Unread left-edge accent */}
                {!notif.is_read && (
                  <span className="absolute left-0 top-3 bottom-3 w-[2px] rounded-r bg-gradient-to-b from-purple to-cyan" />
                )}
                {/* Icon */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  notif.is_read ? 'bg-surface-2' : 'bg-surface-2 ring-1 ring-border'
                }`}>
                  <Icon size={16} className={notif.is_read ? 'text-text-dim' : config.color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${notif.is_read ? 'text-text-muted' : 'text-text font-medium'}`}>
                    {notif.title}
                  </p>
                  {notif.body && (
                    <p className="text-xs text-text-dim mt-0.5 line-clamp-2">{notif.body}</p>
                  )}
                  <p className="vs-counter text-[10px] text-text-dim mt-1 tabular-nums">{timeAgo(notif.created_at)}</p>
                </div>

                {/* Unread dot */}
                {!notif.is_read && (
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); markAsRead(notif.id) }}
                    className="w-2.5 h-2.5 rounded-full bg-purple shrink-0 mt-2 hover:bg-purple-light transition-colors"
                    title="Mark as read" />
                )}
              </div>
            )

            if (notif.link) {
              return (
                <Link key={notif.id} href={notif.link} onClick={() => !notif.is_read && markAsRead(notif.id)}>
                  {content}
                </Link>
              )
            }
            return <div key={notif.id} onClick={() => !notif.is_read && markAsRead(notif.id)} className="cursor-pointer">{content}</div>
          })}
        </div>
      )}
    </div>
  )
}
