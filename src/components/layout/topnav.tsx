'use client'

import { useState, useEffect, useRef } from 'react'
import { VoidsignlLogo } from '@/components/ui/logo'
import { Search, Bell, Globe, X, User, Gamepad2, Newspaper, Trophy, Film, Users, BarChart3, Award, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import type { Profile } from '@/types'
import { useLang } from '@/lib/lang-context'
import { Avatar } from '@/components/ui/avatar'

interface TopnavProps {
  profile: Profile | null
  notificationCount?: number
}

interface SearchResult {
  type: 'member' | 'game' | 'page'
  id: string
  title: string
  subtitle?: string
  link: string
  avatar?: string | null
}

const PAGES: SearchResult[] = [
  { type: 'page', id: 'feed', title: 'Feed', subtitle: 'Social feed', link: '/feed' },
  { type: 'page', id: 'clips', title: 'Clips', subtitle: 'Video clips', link: '/clips' },
  { type: 'page', id: 'tournaments', title: 'Tournaments', subtitle: 'Compete', link: '/tournaments' },
  { type: 'page', id: 'lfg', title: 'LFG', subtitle: 'Find teammates', link: '/lfg' },
  { type: 'page', id: 'rankings', title: 'Rankings', subtitle: 'Leaderboard', link: '/rankings' },
  { type: 'page', id: 'achievements', title: 'Achievements', subtitle: 'Badges & XP', link: '/achievements' },
  { type: 'page', id: 'messages', title: 'Messages', subtitle: 'Direct messages', link: '/messages' },
  { type: 'page', id: 'buddy-coach', title: 'Buddy & Coach', subtitle: 'Find buddy or coach', link: '/buddy-coach' },
  { type: 'page', id: 'notifications', title: 'Notifications', subtitle: 'Your notifications', link: '/notifications' },
  { type: 'page', id: 'admin', title: 'Admin', subtitle: 'Dashboard', link: '/admin' },
]

const PAGE_ICONS: Record<string, any> = {
  feed: Newspaper, clips: Film, tournaments: Trophy, lfg: Users,
  rankings: BarChart3, achievements: Award, messages: MessageCircle,
  'buddy-coach': Users, notifications: Bell, admin: Users,
}

export function Topnav({ profile, notificationCount = 0 }: TopnavProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()
  const { lang, setLang, t } = useLang()
  const debounceRef = useRef<NodeJS.Timeout>(null)

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(() => doSearch(value.trim()), 250)
  }

  async function doSearch(q: string) {
    setSearching(true)
    const lower = q.toLowerCase()
    const allResults: SearchResult[] = []

    // Search pages
    const matchedPages = PAGES.filter(p =>
      p.title.toLowerCase().includes(lower) || (p.subtitle || '').toLowerCase().includes(lower)
    )
    allResults.push(...matchedPages.slice(0, 3))

    // Search members
    const { data: members } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, level_name')
      .eq('is_onboarded', true)
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .limit(5)

    if (members) {
      allResults.push(...members.map(m => ({
        type: 'member' as const,
        id: m.id,
        title: m.display_name || m.username,
        subtitle: `@${m.username} · ${m.level_name}`,
        link: `/profile/${m.username}`,
        avatar: m.avatar_url,
      })))
    }

    // Search games
    const { data: games } = await supabase
      .from('games')
      .select('id, name, slug')
      .eq('is_approved', true)
      .ilike('name', `%${q}%`)
      .limit(5)

    if (games) {
      allResults.push(...games.map(g => ({
        type: 'game' as const,
        id: g.id,
        title: g.name,
        subtitle: 'Game',
        link: `/feed?game=${g.id}`,
      })))
    }

    setResults(allResults)
    setOpen(allResults.length > 0)
    setSearching(false)
  }

  function handleSelect(result: SearchResult) {
    setQuery('')
    setResults([])
    setOpen(false)
    setMobileSearchOpen(false)
    router.push(result.link)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setQuery('')
      setOpen(false)
      setMobileSearchOpen(false)
      inputRef.current?.blur()
    }
  }

  function toggleLang() {
    setLang(lang === 'en' ? 'nl' : 'en')
  }

  const typeLabel = { member: 'MEMBER', game: 'GAME', page: 'PAGE' }
  const typeColor = { member: 'text-purple', game: 'text-cyan', page: 'text-text-dim' }

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
      <div className="hidden md:block relative" ref={dropdownRef}>
        <div className="flex items-center bg-void/50 border border-border rounded-lg px-3 py-1.5 w-[320px] gap-2 focus-within:border-purple/40 transition-colors">
          <Search size={14} className="text-text-dim shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => { if (results.length > 0) setOpen(true) }}
            onKeyDown={handleKeyDown}
            placeholder={profile ? t('nav.search') : 'Search...'}
            className="bg-transparent text-sm text-text placeholder-text-dim outline-none w-full"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setOpen(false) }} className="text-text-dim hover:text-text">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-xl shadow-black/30 overflow-hidden z-50 max-h-[400px] overflow-y-auto">
            {results.map((r, i) => {
              const Icon = r.type === 'page' ? (PAGE_ICONS[r.id] || Newspaper) :
                           r.type === 'game' ? Gamepad2 : User
              return (
                <button key={`${r.type}-${r.id}`} onClick={() => handleSelect(r)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2 transition-colors text-left">
                  <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center shrink-0 overflow-hidden">
                    {r.type === 'member' && r.avatar ? (
                      <img src={r.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Icon size={14} className={typeColor[r.type]} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    {r.subtitle && <p className="text-[10px] text-text-dim truncate">{r.subtitle}</p>}
                  </div>
                  <span className={`text-[8px] tracking-wider ${typeColor[r.type]}`}>{typeLabel[r.type]}</span>
                </button>
              )
            })}
            {searching && (
              <div className="px-4 py-3 text-xs text-text-dim text-center">Searching...</div>
            )}
          </div>
        )}
      </div>

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-void">
          <div className="h-[52px] bg-surface border-b border-border flex items-center px-3 gap-2">
            <Search size={16} className="text-text-dim shrink-0" />
            <input
              ref={mobileInputRef}
              type="text"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('nav.search')}
              className="bg-transparent text-sm text-text placeholder-text-dim outline-none flex-1"
              autoFocus
            />
            <button onClick={() => { setMobileSearchOpen(false); setQuery(''); setResults([]); setOpen(false) }} className="text-text-dim p-1">
              <X size={18} />
            </button>
          </div>
          {/* Mobile results */}
          <div className="overflow-y-auto max-h-[calc(100vh-52px)]">
            {results.map(r => {
              const Icon = r.type === 'page' ? (PAGE_ICONS[r.id] || Newspaper) :
                           r.type === 'game' ? Gamepad2 : User
              return (
                <button key={`${r.type}-${r.id}`} onClick={() => handleSelect(r)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors text-left border-b border-border/50">
                  <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center shrink-0 overflow-hidden">
                    {r.type === 'member' && r.avatar ? (
                      <img src={r.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Icon size={15} className={typeColor[r.type]} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    {r.subtitle && <p className="text-[10px] text-text-dim truncate">{r.subtitle}</p>}
                  </div>
                  <span className={`text-[8px] tracking-wider ${typeColor[r.type]}`}>{typeLabel[r.type]}</span>
                </button>
              )
            })}
            {query && results.length === 0 && !searching && (
              <div className="text-center py-12 text-sm text-text-dim">No results for "{query}"</div>
            )}
            {searching && (
              <div className="text-center py-8 text-xs text-text-dim">Searching...</div>
            )}
          </div>
        </div>
      )}

      {/* Right side */}
      <div className="flex items-center gap-2 md:gap-4">
        <button onClick={() => setMobileSearchOpen(true)} className="md:hidden text-text-dim hover:text-text-muted p-1">
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
            <Avatar
              url={profile.avatar_url}
              name={profile.display_name || profile.username}
              href={`/profile/${profile.username}`}
              size="sm"
              variant="gradient"
            />
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
