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
    loadProfile()
    loadCounts()
    // Refresh counts every 15 seconds
    const interval = setInterval(loadCounts, 15_000)
    return () => clearInterval(interval)
  }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (data) setProfile(data as Profile)
    }
  }

  async function loadCounts() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [notifRes, dmRes] = await Promise.all([
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false),
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', user.id),
    ])
    setNotifCount(notifRes.count || 0)
    setDmCount(dmRes.count || 0)
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
