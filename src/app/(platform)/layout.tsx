'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Topnav } from '@/components/layout/topnav'
import { Sidebar } from '@/components/layout/sidebar'
import type { Profile } from '@/types'

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [lang, setLang] = useState<'en' | 'nl'>('en')
  const [notifCount, setNotifCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
    loadNotifications()
  }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (data) {
        setProfile(data as Profile)
        setLang((data.preferred_language as 'en' | 'nl') || 'en')
      }
    }
  }

  async function loadNotifications() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      setNotifCount(count || 0)
    }
  }

  async function toggleLang() {
    const newLang = lang === 'en' ? 'nl' : 'en'
    setLang(newLang)
    if (profile) {
      await supabase
        .from('profiles')
        .update({ preferred_language: newLang })
        .eq('id', profile.id)
    }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Topnav
        profile={profile}
        notificationCount={notifCount}
        lang={lang}
        onLangToggle={toggleLang}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
