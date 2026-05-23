'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import {
  LayoutDashboard, Newspaper, Trophy, BarChart3,
  Film, MessageCircle, User, ChevronLeft, ChevronRight, Shield, Award,
  Menu, LogOut, Gamepad2, Users,
} from 'lucide-react'

interface SidebarProps {
  /** Live unread DM count, drives badge on Messages icon (mobile + desktop). */
  unreadDms?: number
  /** Live unread notif count, drives Inbox-style badge on More-menu. */
  unreadNotifs?: number
}

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/feed', icon: Newspaper, label: 'Feed' },
  { href: '/buddies', icon: Users, label: 'Buddies' },
  { href: '/tournaments', icon: Trophy, label: 'Tournaments' },
  { href: '/ranking', icon: BarChart3, label: 'Ranking' },
  { divider: true },
  { href: '/clips', icon: Film, label: 'Clips' },
  { href: '/achievements', icon: Award, label: 'Achievements' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/games', icon: Gamepad2, label: 'Games' },
  { divider: true },
  { href: '/admin', icon: Shield, label: 'Admin' },
] as const

// Bottom nav: 5 most-used. Center "Home" sits raised on mobile for thumb-reach.
const MOBILE_NAV = [
  { href: '/feed', icon: Newspaper, label: 'Feed' },
  { href: '/clips', icon: Film, label: 'Clips' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home', center: true },
  { href: '/messages', icon: MessageCircle, label: 'DMs' },
  { href: '/ranking', icon: BarChart3, label: 'Ranking' },
] as const

export function Sidebar({ unreadDms = 0, unreadNotifs = 0 }: SidebarProps = {}) {
  const [collapsed, setCollapsed] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <aside className={`hidden md:flex bg-surface-2 border-r border-border flex-col shrink-0 transition-all duration-200 ${
        collapsed ? 'w-[56px]' : 'w-[200px]'
      }`}>
        <div className="flex flex-col items-center py-3 gap-1 flex-1">
          {NAV_ITEMS.map((item, i) => {
            if ('divider' in item) {
              return <div key={i} className="w-6 h-px bg-border my-2" />
            }

            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const showDmBadge = item.href === '/messages' && unreadDms > 0

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center rounded-lg transition-all ${
                  collapsed ? 'w-10 h-10 justify-center' : 'w-full px-4 h-10 gap-3'
                } ${
                  isActive
                    ? 'bg-purple/15 text-purple'
                    : 'text-text-dim hover:bg-white/5 hover:text-text-muted'
                }`}
              >
                {/* Active indicator — left bar accent */}
                {isActive && (
                  <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-purple rounded-r-full shadow-[0_0_8px_rgba(107,63,224,0.6)]" />
                )}
                <span className="relative">
                  <Icon size={18} />
                  {showDmBadge && (
                    <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-1 bg-danger rounded-full text-[8px] flex items-center justify-center text-white font-medium tabular-nums border border-surface-2">
                      {unreadDms > 9 ? '9+' : unreadDms}
                    </span>
                  )}
                </span>
                {collapsed ? (
                  <span className="absolute left-[52px] bg-surface-2 text-text text-[11px] px-3 py-1.5 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-border">
                    {item.label}
                    {showDmBadge && <span className="ml-1.5 text-[9px] text-danger tabular-nums">{unreadDms > 9 ? '9+' : unreadDms}</span>}
                  </span>
                ) : (
                  <span className="text-sm flex-1 flex items-center justify-between">
                    <span>{item.label}</span>
                    {showDmBadge && (
                      <span className="min-w-[18px] h-[18px] px-1.5 bg-danger rounded-full text-[10px] flex items-center justify-center text-white font-medium tabular-nums">
                        {unreadDms > 9 ? '9+' : unreadDms}
                      </span>
                    )}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Sign out + collapse */}
        <button
          onClick={handleSignOut}
          className={`group relative flex items-center rounded-lg transition-all mb-1 ${
            collapsed ? 'w-10 h-10 justify-center mx-auto' : 'mx-3 px-4 h-10 gap-3'
          } text-text-dim hover:bg-danger/10 hover:text-danger`}
          title="Sign out"
        >
          <LogOut size={18} />
          {collapsed ? (
            <span className="absolute left-[52px] bg-surface-2 text-text text-[11px] px-3 py-1.5 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-border">
              Sign out
            </span>
          ) : (
            <span className="text-sm">Sign out</span>
          )}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-3 flex items-center justify-center text-text-dim hover:text-text-muted transition-colors border-t border-border"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* Mobile bottom nav — cyber-premium with raised center button */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-2/95 backdrop-blur-md border-t border-border"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Subtle gradient top-edge for cyber feel */}
        <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-purple/40 to-transparent pointer-events-none" />

        <div className="flex items-stretch justify-around h-16 px-1 relative">
          {MOBILE_NAV.map(item => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const isCenter = 'center' in item && item.center
            const showDmBadge = item.href === '/messages' && unreadDms > 0

            if (isCenter) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col items-center justify-end gap-0.5 px-2 pt-1 pb-1.5 min-w-[64px] active:scale-95 transition-transform"
                >
                  {/* Raised center pill */}
                  <span
                    className={`flex items-center justify-center w-12 h-12 rounded-2xl -translate-y-3 transition-all ${
                      isActive
                        ? 'bg-gradient-to-br from-purple to-purple-light text-white shadow-[0_0_20px_rgba(107,63,224,0.5)]'
                        : 'bg-surface border border-border text-text-muted shadow-md'
                    }`}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                  </span>
                  <span className={`text-[9px] tracking-wide -mt-2 transition-colors ${
                    isActive ? 'text-purple-light' : 'text-text-dim'
                  }`}>
                    {item.label}
                  </span>
                </Link>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-0.5 px-2 min-w-[64px] active:scale-95 transition-all ${
                  isActive ? 'text-purple-light' : 'text-text-dim'
                }`}
              >
                {/* Active dot indicator above icon */}
                {isActive && (
                  <span className="absolute top-1 w-1 h-1 rounded-full bg-purple shadow-[0_0_4px_rgba(107,63,224,0.8)]" />
                )}
                <span className="relative">
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                  {showDmBadge && (
                    <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-1 bg-danger rounded-full text-[8px] flex items-center justify-center text-white font-medium tabular-nums border border-surface-2">
                      {unreadDms > 9 ? '9+' : unreadDms}
                    </span>
                  )}
                </span>
                <span className="text-[9px] tracking-wide">{item.label}</span>
              </Link>
            )
          })}
          {/* More menu trigger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`relative flex flex-col items-center justify-center gap-0.5 px-2 min-w-[64px] active:scale-95 transition-all ${
              mobileOpen ? 'text-purple-light' : 'text-text-dim'
            }`}
          >
            {mobileOpen && (
              <span className="absolute top-1 w-1 h-1 rounded-full bg-purple shadow-[0_0_4px_rgba(107,63,224,0.8)]" />
            )}
            <span className="relative">
              <Menu size={20} strokeWidth={mobileOpen ? 2.2 : 1.8} />
              {unreadNotifs > 0 && !mobileOpen && (
                <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-1 bg-danger rounded-full text-[8px] flex items-center justify-center text-white font-medium tabular-nums border border-surface-2">
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </span>
            <span className="text-[9px] tracking-wide">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile "More" overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-surface-2 border-t border-border rounded-t-2xl p-4 animate-slide-up vs-lit"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-border mx-auto mb-3" />
            <div className="flex items-center justify-between mb-3">
              <p className="vs-counter text-[10px] text-text-dim tabular-nums">MORE</p>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-text-dim p-1 active:scale-90 transition-transform"
                aria-label="Close menu"
              >
                <ChevronLeft size={16} className="rotate-90" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {NAV_ITEMS.filter(item => !('divider' in item) && !MOBILE_NAV.find(m => m.href === item.href)).map(item => {
                if ('divider' in item) return null
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl transition-all active:scale-95 ${
                      isActive ? 'bg-purple/15 text-purple-light shadow-[0_0_12px_rgba(107,63,224,0.2)]' : 'text-text-dim hover:bg-surface'
                    }`}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                    <span className="text-[10px] tracking-wide">{item.label}</span>
                  </Link>
                )
              })}
              {/* Sign out tile */}
              <button
                onClick={() => { setMobileOpen(false); handleSignOut() }}
                className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl text-danger/80 hover:bg-danger/10 active:scale-95 transition-all"
              >
                <LogOut size={20} strokeWidth={1.8} />
                <span className="text-[10px] tracking-wide">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
