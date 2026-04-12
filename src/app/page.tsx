'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { VoidsignlLogo } from '@/components/ui/logo'
import Link from 'next/link'
import { ArrowRight, Globe } from 'lucide-react'

const FOUNDERS = [
  { name: 'Shadow-and-dust8', initial: 'S' },
  { name: 'Bigfish', initial: 'B' },
  { name: 'Gunner4002', initial: 'G' },
  { name: 'Warriorslife', initial: 'W' },
  { name: 'Bigiborntofight', initial: 'B' },
]

export default function HomePage() {
  const [memberCount, setMemberCount] = useState(0)
  const [postCount, setPostCount] = useState(0)
  const [logoVisible, setLogoVisible] = useState(false)
  const [contentVisible, setContentVisible] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setTimeout(() => setLogoVisible(true), 200)
    setTimeout(() => setContentVisible(true), 800)
    loadStats()
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      window.location.href = '/dashboard'
    }
  }

  async function loadStats() {
    const { count: members } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    const { count: posts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
    setMemberCount(members || 0)
    setPostCount(posts || 0)
  }

  return (
    <div className="min-h-screen">
      <nav className="h-[52px] bg-surface border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <VoidsignlLogo size={22} className="text-text" />
          <span className="text-sm font-bold tracking-[3px]" style={{ fontFamily: 'var(--font-display)' }}>
            VOIDSIGNL
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-void/50 border border-border rounded-lg px-3 py-1.5 w-[200px] gap-2">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
              <circle cx="7" cy="7" r="5"/><path d="M11 11l3.5 3.5"/>
            </svg>
            <span className="text-xs text-text-dim">Search...</span>
          </div>
          <button className="flex items-center gap-1.5 text-xs text-text-dim">
            <Globe size={13} /> EN
          </button>
          <Link href="/login" className="text-sm text-cyan hover:text-cyan/80 transition-colors">
            Enter
          </Link>
        </div>
      </nav>

      <section className="text-center py-20 px-6">
        <div className={`transition-all duration-1000 ${logoVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <VoidsignlLogo size={72} className="mx-auto mb-8 text-text" />
        </div>
        <div className={`transition-all duration-700 delay-300 ${logoVisible ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-[12px] tracking-[4px] text-text-dim mb-3">
            NOT FOR EVERYONE · FOR THOSE WHO KNOW
          </p>
          <h1 className="text-4xl tracking-[6px] font-bold mb-8" style={{ fontFamily: 'var(--font-display)' }}>
            VOIDSIGNL
          </h1>
        </div>
        <div className={`transition-all duration-700 delay-700 ${contentVisible ? 'opacity-100' : 'opacity-0'}`}>
          <Link
            href="/register"
            className="inline-flex items-center gap-3 text-text-dim hover:text-cyan text-[13px] tracking-[2px] transition-colors group"
          >
            Enter the void
            <ArrowRight size={16} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </section>

      <div className={`max-w-4xl mx-auto px-6 pb-20 transition-all duration-700 delay-1000 ${contentVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="text-center py-5 bg-surface rounded-lg border border-border">
            <p className="text-2xl font-medium text-cyan">{memberCount || '—'}</p>
            <p className="text-[10px] text-text-dim tracking-[1px] mt-1">MEMBERS</p>
          </div>
          <div className="text-center py-5 bg-surface rounded-lg border border-border">
            <p className="text-2xl font-medium text-cyan">0</p>
            <p className="text-[10px] text-text-dim tracking-[1px] mt-1">ONLINE</p>
          </div>
          <div className="text-center py-5 bg-surface rounded-lg border border-border">
            <p className="text-2xl font-medium text-cyan">{postCount || '—'}</p>
            <p className="text-[10px] text-text-dim tracking-[1px] mt-1">POSTS</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="vs-card">
            <p className="vs-label mb-4">UPCOMING TOURNAMENTS</p>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <div>
                <p className="text-sm">Void Cup #1</p>
                <p className="text-xs text-text-dim">Coming soon</p>
              </div>
              <span className="vs-badge vs-badge-purple">Soon</span>
            </div>
            <p className="text-xs text-text-dim text-center py-4">Tournaments launching soon</p>
          </div>

          <div className="vs-card">
            <p className="vs-label mb-4">LEADERBOARD</p>
            <div className="space-y-2">
              {FOUNDERS.map((f, i) => (
                <div key={f.name} className="flex items-center gap-3 py-1.5">
                  <span className="text-sm font-medium text-cyan w-5">{i + 1}</span>
                  <div className="w-6 h-6 rounded-full bg-purple flex items-center justify-center text-[10px] font-medium text-white">
                    {f.initial}
                  </div>
                  <span className="text-sm flex-1">{f.name}</span>
                  <span className="text-xs text-text-dim">0 pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="vs-card mb-8">
          <p className="vs-label mb-4">FOUNDING MEMBERS</p>
          <div className="flex flex-wrap gap-3">
            {FOUNDERS.map(f => (
              <div key={f.name} className="flex items-center gap-2 bg-purple/10 border border-purple/20 rounded-full px-3 py-1.5">
                <div className="w-6 h-6 rounded-full bg-purple flex items-center justify-center text-[10px] font-medium text-white">
                  {f.initial}
                </div>
                <span className="text-sm">{f.name}</span>
                <span className="text-purple text-xs">★</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm text-text-dim">
            <span className="w-2 h-2 rounded-full bg-cyan" />
            {memberCount || 0} members
          </div>
        </div>
      </div>
    </div>
  )
}
