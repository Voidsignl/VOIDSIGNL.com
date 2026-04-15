'use client'

import { useState } from 'react'
import { VoidsignlLogo } from '@/components/ui/logo'
import { Search, Bell, Globe, X } from 'lucide-react'
import Link from 'next/link'
import type { Profile } from '@/types'
import { useLang } from '@/lib/lang-context'

interface TopnavProps {
  profile: Profile | null
  notificationCount?: number
}

export function Topnav({ profile, notificationCount = 0 }: TopnavProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { lang, setLang, t } = useLang()

  function toggleLang() {
    setLang(lang === 'en' ? 'nl' : 'en')
  }

  return (
    <nav className="h-[52px] bg-surface border-b border-border flex items-center justify-between px-3 md:px-5 shrink-0 z-50">
      {/* Logo */}
      <Link href={profile ? '/dashboard' : '/'} className="flex items-center gap-2 md:gap-3 shrink-0">
        <VoidsignlLogo size={22} className="text-text" />
        <span className="text-xs md:text-sm font-bold tracking-[2px] md:tracking-[3px] hidden sm:block" style={{ fontFamily: 'var(--font-display)' }}>
          VOIDSIGNL
        </span>
      </Link>

      {/* Desktop search */}
      <div className="hidden md:flex items-center bg-void/50 border border-border rounded-lg px-3 py-1.5 w-[320px] gap-2">
        <Search size={14} className="text-text-dim shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={profile ? t('nav.search') : 'Search...'}
          className="bg-transparent text-sm text-text placeholder-text-dim outline-none w-full"
        />
      </div>

      {/* Mobile search overlay */}
      {searchOpen && (
        <div className="md:hidden absolute inset-0 h-[52px] bg-surface z-50 flex items-center px-3 gap-2">
          <Search size={16} className="text-text-dim shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('nav.search')}
            className="bg-transparent text-sm text-text placeholder-text-dim outline-none flex-1"
            autoFocus
          />
          <button onClick={() => { setSearchOpen(false); setSearchQuery('') }} className="text-text-dim">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Right side */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile search trigger */}
        <button onClick={() => setSearchOpen(true)} className="md:hidden text-text-dim hover:text-text-muted p-1">
          <Search size={18} />
        </button>

        <button
          onClick={toggleLang}
          className="flex items-center gap-1 text-[10px] md:text-xs text-text-dim hover:text-text-muted transition-colors"
        >
          <Globe size={12} />
          {lang === 'en' ? 'EN' : 'NL'}
        </button>

        {profile ? (
          <>
            <Link href="/notifications" className="relative">
              <Bell size={17} className="text-text-muted hover:text-text transition-colors" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-[9px] flex items-center justify-center text-white border-2 border-surface">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Link>
            <Link href={`/profile/${profile.username}`} className="flex items-center">
              <div className="w-7 h-7 rounded-full bg-purple flex items-center justify-center text-[11px] font-medium text-white overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  profile.display_name?.[0]?.toUpperCase() || profile.username[0].toUpperCase()
                )}
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
