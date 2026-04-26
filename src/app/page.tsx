'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { VoidsignlLogo } from '@/components/ui/logo'
import Link from 'next/link'
import {
  ArrowRight, ArrowDown, Trophy, Film, Users, Newspaper, Star,
  Swords, MessageCircle, BarChart3, ChevronRight, Heart, Gamepad2,
  Shield, Zap, Crown
} from 'lucide-react'

const FOUNDERS = [
  { name: 'Shadow-and-dust8', tag: '@shadow-and-dust8', initial: 'SD' },
  { name: 'Bigfish', tag: '@bigfish', initial: 'BF' },
  { name: 'Gunner4002', tag: '@gunner4002', initial: 'GN' },
  { name: 'Warriorslife', tag: '@warriorslife', initial: 'WL' },
  { name: 'Bigiborntofight', tag: '@bigiborntofight', initial: 'BB' },
]

interface TopPlayer {
  username: string
  display_name: string | null
  xp: number
  level_name: string
  is_founding_member: boolean
}

function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (target === 0) return
    let current = 0
    const increment = target / 30
    const timer = setInterval(() => {
      current += increment
      if (current >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, 40)
    return () => clearInterval(timer)
  }, [target])
  return <>{count.toLocaleString()}</>
}

export default function HomePage() {
  const supabase = createClient()
  const [stats, setStats] = useState({ members: 0, posts: 0, clips: 0, tournaments: 0 })
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([])
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 700),
      setTimeout(() => setPhase(3), 1200),
      setTimeout(() => setPhase(4), 1800),
      setTimeout(() => setPhase(5), 2400),
    ]
    loadData()
    checkAuth()
    return () => timers.forEach(clearTimeout)
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) window.location.href = '/dashboard'
  }

  async function loadData() {
    const [members, posts, clips, tournaments] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_onboarded', true),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('clips').select('*', { count: 'exact', head: true }),
      supabase.from('tournaments').select('*', { count: 'exact', head: true }),
    ])
    setStats({ members: members.count || 0, posts: posts.count || 0, clips: clips.count || 0, tournaments: tournaments.count || 0 })

    const { data: players } = await supabase
      .from('profiles')
      .select('username, display_name, xp, level_name, is_founding_member')
      .eq('is_onboarded', true)
      .order('xp', { ascending: false })
      .limit(5)
    if (players) setTopPlayers(players as TopPlayer[])
  }

  return (
    <div className="min-h-screen bg-void text-text" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-[52px] bg-void/85 backdrop-blur-xl border-b border-white/[0.04] flex items-center justify-between px-4 md:px-8">
        <a href="#" className="flex items-center gap-2 md:gap-3">
          <VoidsignlLogo size={22} className="text-text" />
          <span className="text-xs md:text-sm font-semibold tracking-[2px] md:tracking-[3px] hidden sm:block" style={{ fontFamily: 'var(--font-display)' }}>VOIDSIGNL</span>
        </a>
        <div className="flex items-center gap-3 md:gap-6">
          <a href="#features" className="text-xs text-text-dim hover:text-text transition-colors tracking-wide hidden md:block">Features</a>
          <a href="#founders" className="text-xs text-text-dim hover:text-text transition-colors tracking-wide hidden md:block">Founders</a>
          <a href="#rankings" className="text-xs text-text-dim hover:text-text transition-colors tracking-wide hidden md:block">Rankings</a>
          <Link href="/login" className="text-xs text-text-dim hover:text-text transition-colors tracking-wide">Sign in</Link>
          <Link href="/register" className="text-[10px] md:text-xs bg-purple hover:bg-purple-light text-white px-3 md:px-5 py-2 rounded-lg transition-colors tracking-wide">
            Request access
          </Link>
        </div>
      </nav>

      {/* Hero — fullscreen */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple/[0.06] rounded-full blur-[150px]" />
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: 'linear-gradient(rgba(107,63,224,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(107,63,224,0.4) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }} />
        </div>

        <div className="relative z-10">
          {/* Logo */}
          <div className={`transition-all duration-1000 ease-out ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <VoidsignlLogo size={80} className="mx-auto mb-12 text-text" />
          </div>

          {/* Title */}
          <div className={`transition-all duration-1000 ease-out ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <h1 className="text-[clamp(48px,10vw,96px)] font-light tracking-[clamp(8px,3vw,28px)] mb-6" style={{ fontFamily: 'var(--font-display)' }}>
              <span className="text-text">VOID</span><span className="text-text-muted">SIGNL</span>
            </h1>
          </div>

          {/* Tagline */}
          <div className={`transition-all duration-700 ease-out ${phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <p className="text-[clamp(10px,1.5vw,13px)] tracking-[clamp(3px,1vw,8px)] text-text-dim font-light uppercase">
              Not for everyone &nbsp;·&nbsp; For those who know
            </p>
          </div>

          {/* CTA — primary purple glow */}
          <div className={`mt-12 transition-all duration-700 ease-out ${phase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <Link
              href="/register"
              className="relative inline-flex items-center gap-3 bg-gradient-to-br from-purple to-purple-light hover:from-purple-light hover:to-purple text-white px-6 md:px-10 py-3.5 rounded-lg text-sm tracking-[3px] uppercase font-medium transition-all group shadow-[0_0_40px_rgba(107,63,224,0.35)] hover:shadow-[0_0_60px_rgba(107,63,224,0.6)]"
            >
              <span className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              <span className="relative">Enter the void</span>
              <ArrowRight size={15} className="relative group-hover:translate-x-1 transition-all" />
            </Link>
            <p className="text-[11px] text-text-dim mt-4 tracking-wide">Founding membership · Now open</p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className={`absolute bottom-10 transition-all duration-700 ${phase >= 5 ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-[10px] text-text-dim tracking-[3px] block mb-2">SCROLL</span>
          <div className="w-px h-8 bg-gradient-to-b from-text-dim to-transparent mx-auto animate-pulse" />
        </div>
      </section>

      {/* Status banner — switcht van Founding Phase naar live stats zodra het platform groeit */}
      <section className="border-y border-white/[0.04] bg-surface/50 relative overflow-hidden">
        {/* Subtle scanning line accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple/40 to-transparent" />
        {stats.members < 10 ? (
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-7 flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-3">
              <div className="relative w-2 h-2">
                <div className="absolute inset-0 rounded-full bg-purple animate-ping" />
                <div className="absolute inset-0 rounded-full bg-purple" />
              </div>
              <div>
                <p className="text-[10px] tracking-[3px] uppercase text-purple font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                  Founding phase · Active
                </p>
                <p className="text-sm text-text-muted mt-0.5">Closed beta · Invite-only access</p>
              </div>
            </div>
            <div className="flex items-center gap-7 md:gap-10">
              <div className="text-center">
                <p className="text-2xl font-semibold text-text" style={{ fontFamily: 'var(--font-display)' }}>
                  {String(stats.members).padStart(2, '0')}
                </p>
                <p className="text-[10px] text-text-dim tracking-[1.5px] mt-1 uppercase">Claimed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-purple" style={{ fontFamily: 'var(--font-display)' }}>
                  {String(Math.max(0, 100 - stats.members)).padStart(2, '0')}
                </p>
                <p className="text-[10px] text-text-dim tracking-[1.5px] mt-1 uppercase">Remaining</p>
              </div>
              <div className="text-center hidden md:block">
                <p className="text-2xl font-semibold text-text" style={{ fontFamily: 'var(--font-display)' }}>01</p>
                <p className="text-[10px] text-text-dim tracking-[1.5px] mt-1 uppercase">Phase</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { value: stats.members, label: 'Members' },
              { value: stats.tournaments, label: 'Tournaments' },
              { value: stats.clips, label: 'Clips shared' },
              { value: stats.posts, label: 'Posts' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-semibold text-text" style={{ fontFamily: 'var(--font-display)' }}><AnimatedCounter target={s.value} /></p>
                <p className="text-[10px] text-text-dim tracking-[1.5px] mt-1 uppercase">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Features — inspired by brandguide section 05 */}
      <section className="py-16 md:py-24 px-4 md:px-8" id="features">
        <div className="max-w-5xl mx-auto">
          <span className="text-xs text-purple tracking-[3px]" style={{ fontFamily: 'var(--font-display)' }}>01</span>
          <h2 className="text-[clamp(28px,4vw,42px)] font-semibold tracking-tight mt-2 mb-4">Platform</h2>
          <div className="w-12 h-0.5 bg-purple rounded mb-8" />
          <p className="text-text-muted text-[15px] max-w-xl leading-relaxed mb-12">
            Everything a competitive gaming community needs. Built for all games, all platforms, all levels.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Newspaper, label: 'Community', title: 'Social Feed', desc: 'Posts, clips, game channels. Your crew, your content, your space.', color: 'purple' },
              { icon: Trophy, label: 'Competitive', title: 'Tournaments', desc: 'Organized brackets, registration, results. Clean competition.', color: 'cyan' },
              { icon: BarChart3, label: 'Rankings', title: 'XP & Leaderboard', desc: 'Earn XP, level up from Recruit to Legend. Merit-based ranking.', color: 'purple' },
              { icon: Users, label: 'Social', title: 'LFG & Squads', desc: 'Find teammates by game, rank, and region. Never solo queue again.', color: 'cyan' },
              { icon: Film, label: 'Content', title: 'Clips & COTW', desc: 'Upload plays, compete for Clip of the Week. Get seen.', color: 'purple' },
              { icon: MessageCircle, label: 'Connect', title: 'Direct Messages', desc: 'Private DMs with read receipts. Talk strategy, build bonds.', color: 'cyan' },
            ].map(f => (
              <div key={f.title} className="relative bg-surface border border-white/[0.04] rounded-xl p-7 hover:border-white/[0.12] hover:-translate-y-0.5 transition-all duration-300 group overflow-hidden">
                {/* Glow blob on hover */}
                <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${f.color === 'purple' ? 'bg-purple/30' : 'bg-cyan/25'}`} />
                <div className="relative">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 ${
                    f.color === 'purple'
                      ? 'bg-purple/10 text-purple group-hover:bg-purple/20 group-hover:shadow-[0_0_24px_rgba(107,63,224,0.45)]'
                      : 'bg-cyan/10 text-cyan group-hover:bg-cyan/20 group-hover:shadow-[0_0_24px_rgba(0,200,240,0.45)]'
                  }`}>
                    <f.icon size={18} />
                  </div>
                  <div className={`text-[10px] tracking-[2px] uppercase mb-2 font-medium ${f.color === 'purple' ? 'text-purple' : 'text-cyan'}`}>
                    {f.label}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founding Members */}
      <section className="py-16 md:py-24 px-4 md:px-8 border-t border-white/[0.04]" id="founders">
        <div className="max-w-5xl mx-auto">
          <span className="text-xs text-purple tracking-[3px]" style={{ fontFamily: 'var(--font-display)' }}>02</span>
          <h2 className="text-[clamp(28px,4vw,42px)] font-semibold tracking-tight mt-2 mb-4">Founding Members</h2>
          <div className="w-12 h-0.5 bg-purple rounded mb-4" />
          <p className="text-text-muted text-[15px] max-w-xl leading-relaxed mb-12">
            The first members receive permanent founder status. Listed first, recognized always.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {FOUNDERS.map((f, i) => (
              <div key={f.name} className="relative bg-gradient-to-b from-surface to-surface/30 border border-white/[0.04] rounded-xl p-5 text-center hover:border-purple/30 transition-all group overflow-hidden">
                {/* Hover glow */}
                <div className="absolute inset-0 bg-purple/0 group-hover:bg-purple/[0.04] transition-colors duration-300 pointer-events-none" />
                <div className="relative">
                  {/* Founder rank badge top-right */}
                  <div className="absolute -top-1 right-0 text-[10px] text-text-dim tracking-[1.5px]" style={{ fontFamily: 'var(--font-display)' }}>
                    #{String(i + 1).padStart(2, '0')}
                  </div>
                  {/* Gradient avatar with founder ring */}
                  <div className="relative w-16 h-16 mx-auto mb-3">
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-purple via-purple-light to-cyan opacity-50 group-hover:opacity-80 blur-md transition-opacity duration-300" />
                    <div className="relative w-full h-full rounded-full bg-gradient-to-br from-purple/30 to-cyan/20 border border-purple/40 flex items-center justify-center text-base font-bold text-text" style={{ fontFamily: 'var(--font-display)' }}>
                      {f.initial}
                    </div>
                  </div>
                  <p className="text-sm font-medium mb-0.5 truncate">{f.name}</p>
                  <p className="text-[10px] text-text-dim mb-3 truncate">{f.tag}</p>
                  <div className="inline-flex items-center gap-1.5 text-[10px] text-purple bg-purple/10 px-2.5 py-1 rounded-full border border-purple/20">
                    <Star size={9} fill="currentColor" /> Founding
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rankings */}
      <section className="py-16 md:py-24 px-4 md:px-8 border-t border-white/[0.04]" id="rankings">
        <div className="max-w-5xl mx-auto">
          <span className="text-xs text-purple tracking-[3px]" style={{ fontFamily: 'var(--font-display)' }}>03</span>
          <h2 className="text-[clamp(28px,4vw,42px)] font-semibold tracking-tight mt-2 mb-4">Global Rankings</h2>
          <div className="w-12 h-0.5 bg-purple rounded mb-8" />

          <div className="bg-[#16161c] border border-white/[0.04] rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[30px_1fr_60px] md:grid-cols-[60px_1fr_120px_100px] px-3 md:px-6 py-3 border-b border-white/[0.04] text-[10px] text-text-dim tracking-[1.5px] uppercase">
              <span>#</span>
              <span>Player</span>
              <span className="hidden md:block">Status</span>
              <span className="text-right">Score</span>
            </div>

            {/* Rows — show real players if available, otherwise founders.
                Top 3 krijgen podium-treatment: goud/zilver/brons accent + Trophy icon */}
            {(topPlayers.length > 0 ? topPlayers : FOUNDERS.map((f, i) => ({
              username: f.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
              display_name: f.name,
              xp: 0,
              level_name: 'Recruit',
              is_founding_member: true,
            }))).map((player, i) => {
              const podium = i === 0
                ? { hex: '#FFD700', label: 'gold', glow: 'shadow-[inset_3px_0_0_#FFD700]', tint: 'bg-gradient-to-r from-[#FFD700]/[0.06] to-transparent', avatarRing: 'border-[#FFD700]/40', avatarBg: 'bg-[#FFD700]/15 text-[#FFD700]' }
                : i === 1
                ? { hex: '#C0C0C0', label: 'silver', glow: 'shadow-[inset_3px_0_0_#C0C0C0]', tint: 'bg-gradient-to-r from-[#C0C0C0]/[0.05] to-transparent', avatarRing: 'border-[#C0C0C0]/40', avatarBg: 'bg-[#C0C0C0]/15 text-[#C0C0C0]' }
                : i === 2
                ? { hex: '#CD7F32', label: 'bronze', glow: 'shadow-[inset_3px_0_0_#CD7F32]', tint: 'bg-gradient-to-r from-[#CD7F32]/[0.05] to-transparent', avatarRing: 'border-[#CD7F32]/40', avatarBg: 'bg-[#CD7F32]/15 text-[#CD7F32]' }
                : null;
              return (
                <div
                  key={i}
                  className={`grid grid-cols-[30px_1fr_60px] md:grid-cols-[60px_1fr_120px_100px] px-3 md:px-6 py-3 md:py-4 border-b border-white/[0.03] items-center hover:bg-white/[0.02] transition-colors ${podium ? `${podium.tint} ${podium.glow}` : ''}`}
                >
                  <span className="text-xs flex items-center gap-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                    {podium ? (
                      <Trophy size={13} style={{ color: podium.hex }} fill={i === 0 ? podium.hex : 'none'} strokeWidth={2} />
                    ) : null}
                    <span className={podium ? 'text-text font-medium' : 'text-text-dim'}>
                      {String(i + 1).padStart(3, '0')}
                    </span>
                  </span>
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-[9px] md:text-[10px] font-bold shrink-0 border ${podium ? `${podium.avatarBg} ${podium.avatarRing}` : 'bg-purple/15 text-purple border-transparent'}`}>
                      {((player as any).display_name || (player as any).username || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-medium truncate">{(player as any).display_name || (player as any).username}</p>
                      <p className="text-[9px] md:text-[10px] text-text-dim truncate">@{(player as any).username}</p>
                    </div>
                  </div>
                  <span className={`hidden md:block text-[10px] ${(player as any).is_founding_member ? 'text-purple' : 'text-text-dim'}`}>
                    {(player as any).is_founding_member ? 'Founding' : (player as any).level_name}
                  </span>
                  <span className="text-xs md:text-sm text-right" style={{ fontFamily: 'var(--font-display)' }}>
                    {(player as any).xp > 0 ? (player as any).xp.toLocaleString() : '—'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-6">
            <Link href="/rankings" className="text-xs text-text-dim hover:text-cyan transition-colors tracking-wide">
              View full leaderboard →
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 md:py-24 px-4 md:px-8 border-t border-white/[0.04] text-center">
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl font-semibold tracking-tight mb-3">Join the signal.</h2>
          <p className="text-text-muted text-sm mb-8">Founding members · Priority access · Permanent status</p>
          <Link
            href="/register"
            className="relative inline-flex items-center gap-3 bg-gradient-to-br from-purple to-purple-light hover:from-purple-light hover:to-purple text-white px-6 md:px-10 py-3.5 rounded-lg text-sm tracking-[3px] uppercase font-medium transition-all group shadow-[0_0_40px_rgba(107,63,224,0.35)] hover:shadow-[0_0_60px_rgba(107,63,224,0.6)]"
          >
            <span className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <span className="relative">Request access</span>
            <ArrowRight size={15} className="relative group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-[11px] text-text-dim mt-4">No noise. No spam. Just the signal.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/[0.04] text-center">
        <VoidsignlLogo size={32} className="mx-auto mb-4 text-text opacity-30" />
        <p className="text-[11px] text-text-dim">VOIDSIGNL — Not for everyone · For those who know</p>
        <p className="text-[10px] text-text-dim mt-1">© 2026</p>
      </footer>
    </div>
  )
}
