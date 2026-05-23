'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Topnav } from '@/components/layout/topnav'
import { Sidebar } from '@/components/layout/sidebar'
import { NotificationToast } from '@/components/ui/notification-toast'
import { useHeartbeat } from '@/hooks/use-heartbeat'
import type { Profile } from '@/types'

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [notifCount, setNotifCount] = useState(0)
  const [dmCount, setDmCount] = useState(0)
  const supabase = createClient()

  // Keep online status alive
  useHeartbeat()

  useEffect(() => {
    let cancelled = false
    let userId: string | null = null
    let notifChan: ReturnType<typeof supabase.channel> | null = null
    let msgChan: ReturnType<typeof supabase.channel> | null = null

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      userId = user.id

      // Daily streak check-in (no-op if already done today)
      void supabase.rpc('check_in_streak')

      // Initial load
      await Promise.all([loadProfile(user.id), loadCounts(user.id)])

      // Subscribe to notif inserts/updates → recompute count
      notifChan = supabase
        .channel(`notifs:${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          () => { if (userId) loadNotifCount(userId) },
        )
        .subscribe()

      // Subscribe to incoming messages → recompute DM count
      msgChan = supabase
        .channel(`dms:${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages' },
          (payload) => {
            const row = (payload.new as { sender_id?: string } | null) || (payload.old as { sender_id?: string } | null)
            // Only re-count if this message wasn't sent by us
            if (row && row.sender_id !== userId && userId) {
              loadDmCount(userId)
            }
          },
        )
        .subscribe()
    }

    init()
    return () => {
      cancelled = true
      if (notifChan) supabase.removeChannel(notifChan)
      if (msgChan) supabase.removeChannel(msgChan)
    }
  }, [])

  async function loadProfile(uid: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
    if (data) setProfile(data as Profile)
  }

  async function loadCounts(uid: string) {
    await Promise.all([loadNotifCount(uid), loadDmCount(uid)])
  }

  async function loadNotifCount(uid: string) {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid)
      .eq('is_read', false)
    setNotifCount(count || 0)
  }

  async function loadDmCount(uid: string) {
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)
      .neq('sender_id', uid)
    setDmCount(count || 0)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Topnav
        profile={profile}
        notificationCount={notifCount}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar unreadDms={dmCount} unreadNotifs={notifCount} />
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6 md:pb-6"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}
        >
          {children}
        </main>
      </div>
      {/* Notification popups */}
      {profile && <NotificationToast userId={profile.id} />}
    </div>
  )
}
