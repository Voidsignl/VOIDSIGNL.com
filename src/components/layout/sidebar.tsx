'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Newspaper, Trophy, Users, BarChart3,
  Film, MessageCircle, User, ChevronLeft, ChevronRight, Shield, Award
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
  { divider: true },
  { href: '/admin', icon: Shield, label: 'Admin' },
] as const

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(true)
  const pathname = usePathname()

  return (
    <aside className={`bg-[#12121a] border-r border-border flex flex-col shrink-0 transition-all duration-200 ${
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

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 flex items-center justify-center text-text-dim hover:text-text-muted transition-colors border-t border-border"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  )
}
