'use client'

import { useState } from 'react'
import { VoidsignlLogo } from '@/components/ui/logo'
import { Search, Bell, Globe } from 'lucide-react'
import Link from 'next/link'
import type { Profile } from '@/types'
import { useLang } from '@/lib/lang-context'

interface TopnavProps {
  profile: Profile | null
  notificationCount?: number
}

export function Topnav({ profile, notificationCount = 0 }: TopnavProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { lang, setLang, t } = useLang()

  function toggleLang() {
    setLang(lang === 'en' ? 'nl' : 'en')
  }

  return (
    <nav className="h-[52px] bg-surface border-b border-border flex items-center justify-between px-5 shrink-0 z-50">
      <Link href={profile ? '/dashboard' : '/'} className="flex items-center gap-3">
        <VoidsignlLogo size={24} className="text-text" />
        <span className="text-sm font-bold tracking-[3px]" style={{ fontFamily: 'var(--font-display)' }}>
          VOIDSIGNL
        </span>
      </Link>

      <div className="flex items-center bg-void/50 border border-border rounded-lg px-3 py-1.5 w-[320px] gap-2">
        <Search size={14} className="text-text-dim shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={profile ? t('nav.search') : 'Search...'}
          className="bg-transparent text-sm text-text placeholder-text-dim outline-none w-full"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 text-xs text-text-dim hover:text-text-muted transition-colors"
        >
          <Globe size={13} />
          {lang === 'en' ? 'EN' : 'NL'}
        </button>

        {profile ? (
          <>
            <Link href="/notifications" className="relative">
              <Bell size={18} className="text-text-muted hover:text-text transition-colors" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-[9px] flex items-center justify-center text-white border-2 border-surface">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Link>
            <Link href={`/profile/${profile.username}`} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-purple flex items-center justify-center text-[11px] font-medium text-white">
                {profile.display_name?.[0]?.toUpperCase() || profile.username[0].toUpperCase()}
              </div>
            </Link>
          </>
        ) : (
          <Link href="/login" className="text-sm text-cyan hover:text-cyan/80 transition-colors">
            Enter
          </Link>
        )}
      </div>
    </nav>
  )
}
