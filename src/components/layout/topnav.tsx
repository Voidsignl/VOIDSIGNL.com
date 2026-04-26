'use client'

import { useState, useEffect, useRef } from 'react'
import { VoidsignlLogo, VoidsignlMonogram } from '@/components/ui/logo'
import {
  Search, Bell, Globe, X, User, Gamepad2, Newspaper, Trophy, Film, Users,
  BarChart3, Award, MessageCircle, CheckCheck, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import type { Profile } from '@/types'
import { useLang } from '@/lib/lang-context'
import { Avatar } from '@/components/ui/avatar'

interface NotifPreview {
  id: string
  type: string
  title: string
  body: string | null
  is_read: boolean
  link: string | null
  created_at: string
}

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
  const [recentQueries, setRecentQueries] = useState<string[]>([])

  // Load recent searches on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('voidsignl:recent-searches')
      if (raw) setRecentQueries(JSON.parse(raw) as string[])
    } catch { /* ignore */ }
  }, [])

  function pushRecent(q: string) {
    if (!q.trim() || q.length < 2) return
    setRecentQueries(prev => {
      const next = [q, ...prev.filter(x => x.toLowerCase() !== q.toLowerCase())].slice(0, 6)
      try { localStorage.setItem('voidsignl:recent-searches', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  function clearRecent() {
    setRecentQueries([])
    try { localStorage.removeItem('voidsignl:recent-searches') } catch { /* ignore */ }
  }
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState<NotifPreview[]>([])
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
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
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Realtime: keep notif dropdown list fresh when new notifs arrive
  useEffect(() => {
    if (!profile?.id) return
    const chan = supabase
      .channel(`notif-dropdown:${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        async (payload) => {
          const newRow = payload.new as NotifPreview
          setNotifs(prev => {
            // Avoid dupes
            if (prev.some(n => n.id === newRow.id)) return prev
            return [newRow, ...prev].slice(0, 8)
          })
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          const upd = payload.new as NotifPreview
          setNotifs(prev => prev.map(n => n.id === upd.id ? upd : n))
        },
      )
      .subscribe()
    return () => { void supabase.removeChannel(chan) }
  }, [profile?.id])

  async function openNotifs() {
    setNotifOpen(prev => !prev)
    if (!notifOpen && notifs.length === 0) {
      setLoadingNotifs(true)
      const { data } = await supabase
        .from('notifications')
        .select('id, type, title, body, is_read, link, created_at')
        .order('created_at', { ascending: false })
        .limit(8)
      if (data) setNotifs(data as NotifPreview[])
      setLoadingNotifs(false)
    }
  }

  async function handleNotifClick(n: NotifPreview) {
    setNotifOpen(false)
    if (!n.is_read) {
      void supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x))
    }
    if (n.link) router.push(n.link)
  }

  async function markAllRead() {
    const unreadIds = notifs.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
  }

  function notifTimeAgo(date: string): string {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (s < 60) return 'now'
    if (s < 3600) return `${Math.floor(s / 60)}m`
    if (s < 86400) return `${Math.floor(s / 3600)}h`
    if (s < 604800) return `${Math.floor(s / 86400)}d`
    return new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })
  }

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
    pushRecent(query)
    setQuery('')
    setResults([])
    setOpen(false)
    setMobileSearchOpen(false)
    router.push(result.link)
  }

  function handleRecentClick(q: string) {
    setQuery(q)
    handleChange(q)
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
      {/* Logo — monogram in compact topnav, full wordmark op desktop */}
      <Link href={profile ? '/dashboard' : '/'} className="flex items-center gap-2 md:gap-3 shrink-0">
        <VoidsignlMonogram size={26} className="text-text sm:hidden" />
        <VoidsignlLogo size={24} variant="icon" className="text-text hidden sm:block" />
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
            onFocus={() => { if (results.length > 0 || recentQueries.length > 0) setOpen(true) }}
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
            {/* Recent searches when query is empty */}
            {!query.trim() && recentQueries.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                  <span className="vs-counter text-[9px] text-text-dim tabular-nums">RECENT</span>
                  <button
                    onClick={clearRecent}
                    className="text-[10px] text-text-dim hover:text-danger transition-colors"
                  >
                    Clear
                  </button>
                </div>
                {recentQueries.map(q => (
                  <button
                    key={q}
                    onClick={() => handleRecentClick(q)}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-2 transition-colors text-left"
                  >
                    <Search size={11} className="text-text-dim shrink-0" />
                    <span className="text-xs text-text-muted truncate">{q}</span>
                  </button>
                ))}
              </div>
            )}
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
            <div ref={notifRef} className="relative">
              <button
                onClick={openNotifs}
                className="relative p-1.5 -m-1.5 active:scale-90 transition-transform"
                aria-label="Notifications"
              >
                <Bell
                  size={17}
                  className={`transition-colors ${notifOpen ? 'text-purple-light' : 'text-text-muted hover:text-text'}`}
                />
                {notificationCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-danger rounded-full text-[9px] flex items-center justify-center text-white font-medium tabular-nums border-2 border-surface">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute top-full right-0 mt-2 w-[340px] max-w-[calc(100vw-1.5rem)] bg-surface border border-border rounded-xl shadow-xl shadow-black/40 overflow-hidden z-50 animate-slide-up vs-lit">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <p className="vs-counter text-[10px] tabular-nums">
                      NOTIFICATIONS{notificationCount > 0 ? ` · ${String(notificationCount).padStart(2, '0')}` : ''}
                    </p>
                    {notificationCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[10px] text-cyan hover:text-cyan/80 transition-colors flex items-center gap-1"
                      >
                        <CheckCheck size={10} /> Mark all
                      </button>
                    )}
                  </div>

                  <div className="max-h-[400px] overflow-y-auto">
                    {loadingNotifs ? (
                      <div className="py-8 text-center text-xs text-text-dim">Loading...</div>
                    ) : notifs.length === 0 ? (
                      <div className="py-12 text-center">
                        <Bell size={24} className="mx-auto text-text-dim opacity-40 mb-2" />
                        <p className="text-xs text-text-dim">No notifications yet</p>
                      </div>
                    ) : (
                      notifs.map(n => (
                        <button
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          className={`relative w-full flex items-start gap-3 px-4 py-3 text-left border-b border-border/50 transition-colors hover:bg-surface-2 ${
                            !n.is_read ? 'bg-purple/[0.04]' : ''
                          }`}
                        >
                          {!n.is_read && (
                            <span className="absolute left-0 top-3 bottom-3 w-[2px] rounded-r bg-gradient-to-b from-purple to-cyan" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-snug line-clamp-2 ${!n.is_read ? 'text-text font-medium' : 'text-text-muted'}`}>
                              {n.title}
                            </p>
                            {n.body && (
                              <p className="text-[10px] text-text-dim mt-0.5 line-clamp-1">{n.body}</p>
                            )}
                            <p className="vs-counter text-[9px] text-text-dim mt-1 tabular-nums">
                              {notifTimeAgo(n.created_at)}
                            </p>
                          </div>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-purple shrink-0 mt-1.5" />
                          )}
                        </button>
                      ))
                    )}
                  </div>

                  <Link
                    href="/notifications"
                    onClick={() => setNotifOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-[11px] text-text-muted hover:text-text bg-surface-2 transition-colors"
                  >
                    See all <ArrowRight size={11} />
                  </Link>
                </div>
              )}
            </div>
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
