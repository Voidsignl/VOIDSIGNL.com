'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import {
  LayoutDashboard, Newspaper, Trophy, Users, BarChart3,
  Film, MessageCircle, User, ChevronLeft, ChevronRight, Shield, Award,
  Menu, LogOut, Gamepad2
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/feed', icon: Newspaper, label: 'Feed' },
  { href: '/tournaments', icon: Trophy, label: 'Tournaments' },
  { href: '/lfg', icon: Users, label: 'LFG' },
  { href: '/rankings', icon: BarChart3, label: 'Rankings' },
  { divider: true },
  { href: '/clips', icon: Film, label: 'Clips' },
  { href: '/achievements', icon: Award, label: 'Achievements' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/games', icon: Gamepad2, label: 'Games' },
  { divider: true },
  { href: '/admin', icon: Shield, label: 'Admin' },
] as const

// Bottom nav shows only the 5 most important items on mobile
const MOBILE_NAV = [
  { href: '/feed', icon: Newspaper, label: 'Feed' },
  { href: '/clips', icon: Film, label: 'Clips' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/messages', icon: MessageCircle, label: 'DMs' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function Sidebar() {
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
      <aside className={`hidden md:flex bg-[#12121a] border-r border-border flex-col shrink-0 transition-all duration-200 ${
        collapsed ? 'w-[56px]' : 'w-[200px]'
      }`}>
        <div className="flex flex-col items-center py-3 gap-1 flex-1">
          {NAV_ITEMS.map((item, i) => {
            if ('divider' in item) {
              return <div key={i} className="w-6 h-px bg-border my-2" />
            }

            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

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
                <Icon size={18} />
                {collapsed ? (
                  <span className="absolute left-[52px] bg-surface-2 text-text text-[11px] px-3 py-1.5 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-border">
                    {item.label}
                  </span>
                ) : (
                  <span className="text-sm">{item.label}</span>
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

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#12121a] border-t border-border">
        <div className="flex items-center justify-around h-14 px-2">
          {MOBILE_NAV.map(item => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors ${
                  isActive ? 'text-purple' : 'text-text-dim'
                }`}
              >
                <Icon size={20} />
                <span className="text-[9px]">{item.label}</span>
              </Link>
            )
          })}
          {/* More menu */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors ${mobileOpen ? 'text-purple' : 'text-text-dim'}`}
          >
            <Menu size={20} />
            <span className="text-[9px]">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile "More" overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="absolute bottom-14 left-0 right-0 bg-[#12121a] border-t border-border rounded-t-2xl p-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4" />
            <div className="grid grid-cols-4 gap-3">
              {NAV_ITEMS.filter(item => !('divider' in item) && !MOBILE_NAV.find(m => m.href === item.href)).map(item => {
                if ('divider' in item) return null
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl transition-colors ${
                      isActive ? 'bg-purple/15 text-purple' : 'text-text-dim hover:bg-surface'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-[10px]">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
