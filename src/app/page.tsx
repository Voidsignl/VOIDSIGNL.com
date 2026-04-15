'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { VoidsignlLogo } from '@/components/ui/logo'
import Link from 'next/link'
import {
  ArrowRight, Trophy, Film, Users, Newspaper,
  Star, Swords, MessageCircle, BarChart3,
  ChevronRight, Crown, Heart
} from 'lucide-react'

const FOUNDERS = [
  { name: 'Shadow-and-dust8', initial: 'S' },
  { name: 'Bigfish', initial: 'B' },
  { name: 'Gunner4002', initial: 'G' },
  { name: 'Warriorslife', initial: 'W' },
  { name: 'Bigiborntofight', initial: 'B' },
]

const FEATURES = [
  { icon: Newspaper, label: 'Community Feed', desc: 'Share moments, discuss strategies, connect with gamers' },
  { icon: Film, label: 'Clips & COTW', desc: 'Upload your best plays, compete for Clip of the Week' },
  { icon: Trophy, label: 'Tournaments', desc: 'Compete in organized brackets, climb the ranks' },
  { icon: Users, label: 'LFG & Squads', desc: 'Find teammates, build your squad, never play alone' },
  { icon: BarChart3, label: 'Rankings & XP', desc: 'Earn XP, level up from Recruit to Legend' },
  { icon: MessageCircle, label: 'Direct Messages', desc: 'Private conversations with your gaming buddies' },
]

interface TopPlayer {
  username: string
  display_name: string | null
  xp: number
  level_name: string
  is_founding_member: boolean
}

interface RecentTournament {
  id: string
  name: string
  status: string
  starts_at: string
  registered_count: number
  max_teams: number
  game_name: string | null
}

interface RecentClip {
  id: string
  title: string
  username: string
  like_count: number
  game_name: string | null
}

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (target === 0) return
    const duration = 1200
    const steps = 30
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, duration / steps)
    return () => clearInterval(timer)
  }, [target])
  return <>{count.toLocaleString()}{suffix}</>
}

export default function HomePage() {
  const [stats, setStats] = useState({ members: 0, posts: 0, clips: 0, tournaments: 0, games: 0 })
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([])
  const [recentTournaments, setRecentTournaments] = useState<RecentTournament[]>([])
  const [recentClips, setRecentClips] = useState<RecentClip[]>([])
  const [visible, setVisible] = useState({ logo: false, tagline: false, cta: false, stats: false, content: false })
  const supabase = createClient()

  useEffect(() => {
    setTimeout(() => setVisible(v => ({ ...v, logo: true })), 150)
    setTimeout(() => setVisible(v => ({ ...v, tagline: true })), 600)
    setTimeout(() => setVisible(v => ({ ...v, cta: true })), 1000)
    setTimeout(() => setVisible(v => ({ ...v, stats: true })), 1300)
    setTimeout(() => setVisible(v => ({ ...v, content: true })), 1600)
    loadData()
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) window.location.href = '/dashboard'
  }

  async function loadData() {
    const [members, posts, clips, tournaments, games] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_onboarded', true),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('clips').select('*', { count: 'exact', head: true }),
      supabase.from('tournaments').select('*', { count: 'exact', head: true }),
      supabase.from('games').select('*', { count: 'exact', head: true }).eq('is_approved', true),
    ])

    setStats({
      members: members.count || 0,
      posts: posts.count || 0,
      clips: clips.count || 0,
      tournaments: tournaments.count || 0,
      games: games.count || 0,
    })

    const { data: players } = await supabase
      .from('profiles')
      .select('username, display_name, xp, level_name, is_founding_member')
      .eq('is_onboarded', true)
      .order('xp', { ascending: false })
      .limit(5)
    if (players) setTopPlayers(players as TopPlayer[])

    const { data: tourns } = await supabase
      .from('tournaments')
      .select('id, name, status, starts_at, max_teams, game:games(name)')
      .in('status', ['registration', 'upcoming', 'in_progress'])
      .order('starts_at', { ascending: true })
      .limit(3)
    if (tourns) {
      const enriched = await Promise.all(tourns.map(async (t: any) => {
        const { count } = await supabase.from('tournament_registrations').select('*', { count: 'exact', head: true }).eq('tournament_id', t.id)
        return { id: t.id, name: t.name, status: t.status, starts_at: t.starts_at, registered_count: count || 0, max_teams: t.max_teams, game_name: t.game?.name || null }
      }))
      setRecentTournaments(enriched)
    }

    const { data: clipsData } = await supabase
      .from('clips')
      .select('id, title, like_count, profile:profiles(username), game:games(name)')
      .order('created_at', { ascending: false })
      .limit(4)
    if (clipsData) {
      setRecentClips(clipsData.map((c: any) => ({
        id: c.id, title: c.title, username: c.profile?.username || 'Unknown', like_count: c.like_count, game_name: c.game?.name || null,
      })))
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'registration': return <span className="text-[9px] bg-success/15 text-success px-1.5 py-0.5 rounded">Open</span>
      case 'upcoming': return <span className="text-[9px] bg-text-dim/15 text-text-dim px-1.5 py-0.5 rounded">Soon</span>
      case 'in_progress': return <span className="text-[9px] bg-warning/15 text-warning px-1.5 py-0.5 rounded">Live</span>
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-void">
      {/* Nav */}
      <nav className="h-[52px] bg-surface/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <VoidsignlLogo size={22} className="text-text" />
          <span className="text-sm font-bold tracking-[3px]" style={{ fontFamily: 'var(--font-display)' }}>VOIDSIGNL</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="vs-btn vs-btn-ghost text-xs px-4 py-1.5">Sign In</Link>
          <Link href="/register" className="vs-btn vs-btn-primary text-xs px-4 py-1.5">Join</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(107,63,224,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(107,63,224,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple/5 rounded-full blur-[120px]" />

        <div className="relative text-center pt-24 pb-16 px-6">
          <div className={`transition-all duration-1000 ease-out ${visible.logo ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <VoidsignlLogo size={80} className="mx-auto mb-6 text-text" />
          </div>
          <div className={`transition-all duration-700 ease-out ${visible.tagline ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <p className="text-[11px] tracking-[5px] text-text-dim mb-4 uppercase">Not for everyone · For those who know</p>
            <h1 className="text-5xl md:text-6xl tracking-[8px] font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              VOID<span className="text-purple">SIGNL</span>
            </h1>
            <p className="text-text-muted text-sm max-w-md mx-auto leading-relaxed mt-4">
              The multi-game community platform for competitive gamers. Tournaments, clips, rankings, and a crew that gets it.
            </p>
          </div>
          <div className={`mt-10 transition-all duration-700 ease-out ${visible.cta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <Link href="/register" className="inline-flex items-center gap-3 bg-purple hover:bg-purple-light text-white px-8 py-3 rounded-lg text-sm tracking-[2px] transition-all group">
              Enter the void <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-[11px] text-text-dim mt-4">Free to join · No credit card needed</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className={`transition-all duration-700 ease-out ${visible.stats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-4xl mx-auto px-6 -mt-2 mb-12">
          <div className="grid grid-cols-5 gap-3">
            {[
              { value: stats.members, label: 'MEMBERS', icon: Users },
              { value: stats.posts, label: 'POSTS', icon: Newspaper },
              { value: stats.clips, label: 'CLIPS', icon: Film },
              { value: stats.tournaments, label: 'TOURNAMENTS', icon: Trophy },
              { value: stats.games, label: 'GAMES', icon: Swords },
            ].map(s => (
              <div key={s.label} className="text-center py-4 bg-surface rounded-lg border border-border hover:border-border-hover transition-colors group">
                <s.icon size={14} className="mx-auto text-text-dim group-hover:text-purple transition-colors mb-1.5" />
                <p className="text-xl font-semibold text-cyan"><AnimatedCounter target={s.value} /></p>
                <p className="text-[9px] text-text-dim tracking-[1.5px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className={`transition-all duration-700 ease-out ${visible.content ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-4xl mx-auto px-6 mb-14">
          <p className="vs-label text-center mb-6">WHAT AWAITS YOU</p>
          <div className="grid grid-cols-3 gap-3">
            {FEATURES.map(f => (
              <div key={f.label} className="vs-card hover:border-purple/20 transition-all group py-5 text-center">
                <f.icon size={22} className="mx-auto text-text-dim group-hover:text-purple transition-colors mb-3" />
                <p className="text-sm font-medium mb-1">{f.label}</p>
                <p className="text-[11px] text-text-dim leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Live data columns */}
        <div className="max-w-4xl mx-auto px-6 mb-14">
          <div className="grid grid-cols-3 gap-4">
            {/* Leaderboard */}
            <div className="vs-card">
              <div className="flex items-center justify-between mb-4">
                <p className="vs-label">TOP PLAYERS</p>
                <Link href="/rankings" className="text-[10px] text-cyan hover:underline flex items-center gap-0.5">View all <ChevronRight size={10} /></Link>
              </div>
              {topPlayers.length === 0 ? (
                <p className="text-xs text-text-dim text-center py-4">Be the first to compete</p>
              ) : (
                <div className="space-y-2.5">
                  {topPlayers.map((p, i) => (
                    <div key={p.username} className="flex items-center gap-2.5">
                      <span className={`text-xs font-bold w-4 text-right ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-text-dim'}`}>{i + 1}</span>
                      <div className="w-7 h-7 rounded-lg bg-purple/20 flex items-center justify-center text-[10px] font-bold text-purple relative">
                        {(p.display_name || p.username)[0].toUpperCase()}
                        {p.is_founding_member && (
                          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-purple flex items-center justify-center">
                            <Star size={6} className="text-white" fill="white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{p.display_name || p.username}</p>
                        <p className="text-[9px] text-text-dim">{p.level_name}</p>
                      </div>
                      <span className="text-[10px] text-cyan font-medium">{p.xp.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tournaments */}
            <div className="vs-card">
              <div className="flex items-center justify-between mb-4">
                <p className="vs-label">TOURNAMENTS</p>
                <Link href="/tournaments" className="text-[10px] text-cyan hover:underline flex items-center gap-0.5">View all <ChevronRight size={10} /></Link>
              </div>
              {recentTournaments.length === 0 ? (
                <div className="text-center py-6">
                  <Trophy size={20} className="mx-auto text-text-dim opacity-40 mb-2" />
                  <p className="text-xs text-text-dim">Tournaments coming soon</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTournaments.map(t => (
                    <div key={t.id} className="py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-medium truncate flex-1">{t.name}</p>
                        {getStatusBadge(t.status)}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-text-dim">
                        {t.game_name && <span>{t.game_name}</span>}
                        <span>·</span>
                        <span>{t.registered_count}/{t.max_teams}</span>
                        <span>·</span>
                        <span>{new Date(t.starts_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clips */}
            <div className="vs-card">
              <div className="flex items-center justify-between mb-4">
                <p className="vs-label">LATEST CLIPS</p>
                <Link href="/clips" className="text-[10px] text-cyan hover:underline flex items-center gap-0.5">View all <ChevronRight size={10} /></Link>
              </div>
              {recentClips.length === 0 ? (
                <div className="text-center py-6">
                  <Film size={20} className="mx-auto text-text-dim opacity-40 mb-2" />
                  <p className="text-xs text-text-dim">No clips yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentClips.map(c => (
                    <div key={c.id} className="py-2 border-b border-border last:border-0">
                      <p className="text-xs font-medium truncate mb-0.5">{c.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-text-dim">
                        <span>@{c.username}</span>
                        {c.game_name && <><span>·</span><span>{c.game_name}</span></>}
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><Heart size={8} /> {c.like_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Founders */}
        <div className="max-w-4xl mx-auto px-6 mb-14">
          <div className="vs-card relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple/40 to-transparent" />
            <p className="vs-label mb-4 flex items-center gap-2"><Star size={12} className="text-purple" /> FOUNDING MEMBERS</p>
            <div className="flex flex-wrap gap-3">
              {FOUNDERS.map(f => (
                <div key={f.name} className="flex items-center gap-2.5 bg-purple/8 border border-purple/15 rounded-full px-4 py-2 hover:border-purple/30 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-purple/25 flex items-center justify-center text-[11px] font-bold text-purple">{f.initial}</div>
                  <span className="text-sm">{f.name}</span>
                  <Star size={11} className="text-purple" fill="currentColor" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center pb-20 px-6">
          <p className="text-text-muted text-sm mb-6">Ready to find your signal in the noise?</p>
          <Link href="/register" className="inline-flex items-center gap-3 text-text-dim hover:text-cyan text-[13px] tracking-[2px] transition-colors group">
            Enter the void <ArrowRight size={16} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Link>
          <div className="mt-8 flex items-center justify-center gap-4 text-[10px] text-text-dim">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              {stats.members} members
            </span>
            <span>·</span>
            <span>© 2026 VOIDSIGNL</span>
          </div>
        </div>
      </div>
    </div>
  )
}
