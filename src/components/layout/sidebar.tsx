'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

interface SidebarProps {
  unreadDms?: number
  unreadNotifs?: number
}

interface ProfileSummary {
  username: string
  avatar_url: string | null
  accent_color: string | null
  level_name: string | null
  role: string | null
}

const NAV_ICONS = {
  feed: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  ),
  ranking: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
      <polyline points="17,6 23,6 23,12" />
    </svg>
  ),
  clips: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="23,7 16,12 23,17 23,7" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  ),
  clans: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  buddies: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  ),
  coaching: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  forums: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
  games: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="6" y1="12" x2="10" y2="12" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <line x1="15" y1="13" x2="15.01" y2="13" />
      <line x1="18" y1="11" x2="18.01" y2="11" />
      <rect x="2" y="6" width="20" height="12" rx="2" />
    </svg>
  ),
  messages: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
  more: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  ),
  signOut: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  admin: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2l9 4v6c0 5-3.5 9.5-9 10-5.5-.5-9-5-9-10V6l9-4z" />
    </svg>
  ),
} as const

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

const PRIMARY_NAV: NavItem[] = [
  { href: '/feed',    label: 'Feed',    icon: NAV_ICONS.feed    },
  { href: '/ranking', label: 'Ranking', icon: NAV_ICONS.ranking },
  { href: '/clips',   label: 'Clips',   icon: NAV_ICONS.clips   },
  { href: '/clans',   label: 'Clans',   icon: NAV_ICONS.clans   },
]

const NAV_ITEMS: NavItem[] = [
  { href: '/feed',     label: 'Feed',      icon: NAV_ICONS.feed     },
  { href: '/ranking',  label: 'Ranking',   icon: NAV_ICONS.ranking  },
  { href: '/clips',    label: 'Clips',     icon: NAV_ICONS.clips    },
  { href: '/clans',    label: 'Clans',     icon: NAV_ICONS.clans    },
  { href: '/buddies',  label: 'Buddies',   icon: NAV_ICONS.buddies  },
  { href: '/coaching', label: 'Coaching',  icon: NAV_ICONS.coaching },
  { href: '/forums',   label: 'Forums',    icon: NAV_ICONS.forums   },
  { href: '/games',    label: 'Games',     icon: NAV_ICONS.games    },
  { href: '/messages', label: 'Berichten', icon: NAV_ICONS.messages },
]

const SECONDARY_NAV: NavItem[] = [
  { href: '/buddies',  label: 'Buddies',   icon: NAV_ICONS.buddies  },
  { href: '/coaching', label: 'Coaching',  icon: NAV_ICONS.coaching },
  { href: '/forums',   label: 'Forums',    icon: NAV_ICONS.forums   },
  { href: '/games',    label: 'Games',     icon: NAV_ICONS.games    },
  { href: '/messages', label: 'Berichten', icon: NAV_ICONS.messages },
]

export function Sidebar({ unreadDms = 0, unreadNotifs: _unreadNotifs = 0 }: SidebarProps = {}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [moreOpen, setMoreOpen] = useState(false)
  const [profile, setProfile] = useState<ProfileSummary | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: p } = await supabase
        .from('profiles')
        .select('username, avatar_url, accent_color, level_name, role')
        .eq('id', data.user.id)
        .maybeSingle()
      if (p) setProfile(p as ProfileSummary)
    })
  }, [supabase])

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function MessagesBadge({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
    if (unreadDms <= 0) return null
    const cls =
      size === 'lg'
        ? 'min-w-[18px] h-[18px] px-1.5 text-[10px]'
        : 'min-w-[16px] h-[16px] px-1 text-[9px]'
    return (
      <span
        className={`inline-flex items-center justify-center font-mono font-bold rounded-full bg-danger text-white tabular-nums ${cls}`}
      >
        {unreadDms > 9 ? '9+' : unreadDms}
      </span>
    )
  }

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col bg-void border-r border-border">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-3">
            <svg width="26" height="26" viewBox="0 0 80 80" fill="none" aria-hidden>
              <circle cx="40" cy="40" r="36" stroke="#6B3FE0" strokeWidth="1.5" opacity="0.5" />
              <circle cx="40" cy="40" r="27" stroke="#6B3FE0" strokeWidth="1" opacity="0.3" />
              <circle cx="40" cy="40" r="10" stroke="#6B3FE0" strokeWidth="1.5" />
              <line x1="40" y1="2" x2="40" y2="18" stroke="white" strokeWidth="1.5" />
              <line x1="40" y1="62" x2="40" y2="78" stroke="white" strokeWidth="1.5" opacity="0.4" />
              <line x1="2" y1="40" x2="18" y2="40" stroke="white" strokeWidth="1.5" opacity="0.4" />
              <line x1="62" y1="40" x2="78" y2="40" stroke="white" strokeWidth="1.5" opacity="0.4" />
              <circle cx="40" cy="40" r="2.5" fill="#00C8F0" />
              <line
                x1="40"
                y1="40"
                x2="40"
                y2="5"
                stroke="#00C8F0"
                strokeWidth="1.5"
                opacity="0.7"
                className="animate-sonar"
                style={{ transformOrigin: '40px 40px' }}
              />
            </svg>
            <span className="font-mono text-sm font-bold tracking-wider text-text">
              VOID<span className="text-purple">SIGNL</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href)
            const isMsg = item.href === '/messages'
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                  font-mono text-xs uppercase tracking-wider
                  transition-colors duration-200
                  ${active ? 'bg-purple/15 text-text' : 'text-text-muted hover:bg-surface hover:text-text'}
                `}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-purple rounded-full" />
                )}
                <span className={active ? 'text-purple' : ''}>{item.icon}</span>
                <span>{item.label}</span>
                {isMsg && <span className="ml-auto"><MessagesBadge /></span>}
              </Link>
            )
          })}

          {/* Admin link — alleen zichtbaar voor admins */}
          {profile?.role === 'admin' && (() => {
            const active = isActive('/admin')
            return (
              <Link
                href="/admin"
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 rounded-lg mt-2
                  font-mono text-xs uppercase tracking-wider
                  transition-colors duration-200
                  ${active ? 'bg-cyan/15 text-text' : 'text-text-muted hover:bg-surface hover:text-text'}
                `}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan rounded-full" />
                )}
                <span className={active ? 'text-cyan' : 'text-cyan/70'}>{NAV_ICONS.admin}</span>
                <span>Admin</span>
              </Link>
            )
          })()}
        </nav>

        {/* Profile + sign-out */}
        {profile && (
          <div className="px-3 py-4 border-t border-border space-y-1">
            <Link
              href={`/profile/${profile.username}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface transition-colors duration-200"
            >
              <div
                className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-surface-2 border-2"
                style={{ borderColor: profile.accent_color ?? '#6B3FE0' }}
              >
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.username}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-mono text-xs text-text-muted">
                      {profile.username?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs font-bold text-text truncate">
                  {profile.username}
                </p>
                <p className="font-mono text-[10px] text-text-muted truncate">
                  {profile.level_name}
                </p>
              </div>
            </Link>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-mono text-[10px] uppercase tracking-wider text-text-muted hover:text-danger hover:bg-danger/8 transition-colors duration-200"
            >
              <span>{NAV_ICONS.signOut}</span>
              <span>Uitloggen</span>
            </button>
          </div>
        )}
      </aside>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 flex items-center bg-void/98 backdrop-blur-xl border-t border-purple/20"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {PRIMARY_NAV.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-2 transition-colors duration-200 ${
                active ? 'text-purple' : 'text-text-muted'
              }`}
            >
              {item.icon}
              <span className="font-mono uppercase text-[8px] tracking-wider">{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={() => setMoreOpen((o) => !o)}
          className={`flex-1 flex flex-col items-center gap-1 py-2 transition-colors duration-200 ${
            moreOpen ? 'text-purple' : 'text-text-muted'
          }`}
        >
          {NAV_ICONS.more}
          <span className="font-mono uppercase text-[8px] tracking-wider">Meer</span>
        </button>
      </nav>

      {/* ── MEER OVERLAY (MOBILE) ── */}
      {moreOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-void/70 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="md:hidden fixed bottom-16 left-0 right-0 z-50 p-4 rounded-t-2xl bg-surface border-t border-border"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
          >
            <div className="grid grid-cols-3 gap-2">
              {SECONDARY_NAV.map((item) => {
                const active = isActive(item.href)
                const isMsg = item.href === '/messages'
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`
                      relative flex flex-col items-center gap-2 py-4 rounded-xl border
                      transition-colors duration-200
                      ${
                        active
                          ? 'bg-purple/15 border-purple/30 text-text'
                          : 'bg-surface-2 border-border text-text-muted'
                      }
                    `}
                  >
                    {item.icon}
                    <span className="font-mono uppercase text-center text-[9px] tracking-wider leading-tight">
                      {item.label}
                    </span>
                    {isMsg && unreadDms > 0 && (
                      <span className="absolute top-2 right-2">
                        <MessagesBadge />
                      </span>
                    )}
                  </Link>
                )
              })}

              {/* Admin tile — alleen voor admins */}
              {profile?.role === 'admin' && (
                <Link
                  href="/admin"
                  onClick={() => setMoreOpen(false)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition-colors duration-200 ${
                    isActive('/admin')
                      ? 'bg-cyan/15 border-cyan/30 text-text'
                      : 'bg-surface-2 border-border text-cyan'
                  }`}
                >
                  {NAV_ICONS.admin}
                  <span className="font-mono uppercase text-center text-[9px] tracking-wider leading-tight">
                    Admin
                  </span>
                </Link>
              )}

              {/* Sign-out tile */}
              <button
                onClick={() => {
                  setMoreOpen(false)
                  void handleSignOut()
                }}
                className="flex flex-col items-center gap-2 py-4 rounded-xl border bg-surface-2 border-border text-text-muted hover:text-danger hover:border-danger/40 transition-colors duration-200"
              >
                {NAV_ICONS.signOut}
                <span className="font-mono uppercase text-center text-[9px] tracking-wider leading-tight">
                  Uitloggen
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
