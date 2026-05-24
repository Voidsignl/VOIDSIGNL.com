'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface PhaseStats {
  total_members: number
  inner_circle_count: number
  active_phase: number
  phase_limit: number
  phase_claimed: number
  phase_remaining: number | null
}

interface PhaseRow {
  phase: number
  name: string
  description: string
  limit_count: number
  is_active: boolean
}

interface PlayerRow {
  username: string
  display_name?: string | null
  avatar_url?: string | null
  accent_color?: string | null
  level_name: string
  xp: number
  is_inner_circle: boolean
  is_verified: boolean
}

interface InnerCircleRow {
  username: string
  display_name?: string | null
  avatar_url?: string | null
  accent_color?: string | null
  xp: number
  level_name: string
}

interface HomeData {
  phaseStats: PhaseStats | null
  phases: PhaseRow[]
  topPlayers: PlayerRow[]
  innerCircle: InnerCircleRow[]
  totalClans: number
  totalClips: number
}

const FEATURES = [
  {
    tag: 'Community',
    name: 'The Feed',
    desc: 'Posts, clips, achievements. Alles van je squad op één plek. Jouw content, jouw ruimte.',
    icon: '〇',
    color: '#6B3FE0',
  },
  {
    tag: 'Competitief',
    name: 'Clan Wars',
    desc: 'Daag andere clans uit. 7 dagen. Eén winnaar. Clan XP voor iedereen die bijdraagt.',
    icon: '⚔',
    color: '#ef4444',
  },
  {
    tag: 'Rankings',
    name: 'The Ranking',
    desc: 'Merit-based. XP verdien je door te doen. Recruit tot Legend — niemand koopt zijn weg naar boven.',
    icon: '↗',
    color: '#00C8F0',
  },
  {
    tag: 'Social',
    name: 'Find Your Squad',
    desc: 'Buddy matching op game, rank, platform en speeltijden. Stop met solo queuen.',
    icon: '⬡',
    color: '#22c55e',
  },
  {
    tag: 'Content',
    name: 'Clip of the Week',
    desc: 'Upload je beste plays. De community kiest. Clip of the Week wint exposure en XP.',
    icon: '▶',
    color: '#f59e0b',
  },
  {
    tag: 'Connect',
    name: 'The Signal',
    desc: 'Directe berichten. Geen algoritme, geen noise. Alleen de mensen die er toe doen.',
    icon: '⚡',
    color: '#6B3FE0',
  },
]

const FALLBACK_PHASES: PhaseRow[] = [
  {
    phase: 1,
    name: 'Inner Circle',
    description: 'De eerste 25. Permanent Inner Circle status.',
    limit_count: 25,
    is_active: false,
  },
  {
    phase: 2,
    name: 'Early Access',
    description: 'Exclusieve early access. Beperkte plekken.',
    limit_count: 75,
    is_active: true,
  },
  {
    phase: 3,
    name: 'Open Beta',
    description: 'Onbeperkte toegang. Binnenkort beschikbaar.',
    limit_count: 0,
    is_active: false,
  },
]

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/home')
      .then((r) => r.json())
      .then((json) => {
        setData(json as HomeData)
      })
      .catch(() => {
        setData(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const ps = data?.phaseStats ?? null
  const phases = data?.phases?.length ? data.phases : FALLBACK_PHASES
  const activePhaseLabel =
    phases.find((p) => p.is_active)?.name ?? 'Early Access'

  return (
    <div className="min-h-screen bg-void text-text">
      {/* ── NAV ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          background: 'rgba(14,14,18,0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(107,63,224,0.15)',
        }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <svg width="24" height="24" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" stroke="#6B3FE0" strokeWidth="1.5" opacity="0.6" />
            <circle cx="40" cy="40" r="10" stroke="#6B3FE0" strokeWidth="1.5" />
            <line x1="40" y1="2" x2="40" y2="18" stroke="white" strokeWidth="1.5" />
            <circle cx="40" cy="40" r="2.5" fill="#00C8F0" />
          </svg>
          <span className="font-mono text-sm font-bold tracking-wider text-text">
            VOID<span className="text-purple">SIGNL</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'Features', href: '#features' },
            { label: 'Inner Circle', href: '#inner-circle' },
            { label: 'Rankings', href: '#rankings' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="font-mono text-xs text-text-muted hover:text-text transition-colors duration-200 uppercase tracking-wider"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="font-mono text-xs text-text-muted hover:text-text transition-colors duration-200 uppercase tracking-wider hidden md:block"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 bg-purple text-white font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-purple/85 transition-colors duration-200"
          >
            Request access
          </Link>
        </div>
      </nav>

      {/* ── 1. HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden pt-20">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(107,63,224,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(107,63,224,0.06) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(107,63,224,0.12) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto">
          {!loading && ps && (
            <div
              className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border"
              style={{
                background: 'rgba(107,63,224,0.08)',
                borderColor: 'rgba(107,63,224,0.3)',
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full bg-success"
                style={{ animation: 'home-pulse 2s ease-in-out infinite' }}
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
                {activePhaseLabel}
              </span>
              <span className="font-mono text-[10px] text-purple">·</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-purple font-bold">
                {ps.phase_remaining !== null
                  ? `${ps.phase_remaining} plekken over`
                  : 'Actief'}
              </span>
            </div>
          )}

          <svg
            width="72"
            height="72"
            viewBox="0 0 80 80"
            fill="none"
            className="mx-auto mb-10"
          >
            <circle cx="40" cy="40" r="36" stroke="#6B3FE0" strokeWidth="1.5" opacity="0.4" />
            <circle cx="40" cy="40" r="27" stroke="#6B3FE0" strokeWidth="1" opacity="0.25" />
            <circle cx="40" cy="40" r="18" stroke="#6B3FE0" strokeWidth="1" opacity="0.15" />
            <circle cx="40" cy="40" r="10" stroke="#6B3FE0" strokeWidth="1.5" />
            <line x1="40" y1="2" x2="40" y2="18" stroke="white" strokeWidth="1.5" />
            <line x1="40" y1="62" x2="40" y2="78" stroke="white" strokeWidth="1.5" opacity="0.3" />
            <line x1="2" y1="40" x2="18" y2="40" stroke="white" strokeWidth="1.5" opacity="0.3" />
            <line x1="62" y1="40" x2="78" y2="40" stroke="white" strokeWidth="1.5" opacity="0.3" />
            <circle cx="40" cy="40" r="2.5" fill="#00C8F0" />
            <line x1="40" y1="40" x2="40" y2="5" stroke="#00C8F0" strokeWidth="1.5" opacity="0.6" />
          </svg>

          <h1
            className="font-mono font-bold text-text leading-none mb-6"
            style={{
              fontSize: 'clamp(48px, 8vw, 96px)',
              letterSpacing: '0.15em',
            }}
          >
            VOID<span className="text-purple">SIGNL</span>
          </h1>

          <p className="font-mono text-sm tracking-[0.25em] text-text-muted mb-12 uppercase">
            Not for everyone · For those who know
          </p>

          <div className="flex flex-col items-center gap-3">
            <Link
              href="/register"
              className="px-10 py-4 bg-purple text-white font-mono text-sm uppercase tracking-[0.2em] rounded-xl hover:bg-purple/85 transition-colors duration-200 flex items-center gap-3"
            >
              Enter the void
              <span className="text-white/50">→</span>
            </Link>
            {!loading && ps && ps.phase_remaining !== null && (
              <p className="font-mono text-[10px] text-text-dim uppercase tracking-wider">
                {ps.phase_claimed} van {ps.phase_limit} {activePhaseLabel} plekken bezet
              </p>
            )}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="font-mono text-[9px] text-text-dim uppercase tracking-[0.3em]">
            Scroll
          </span>
          <div className="w-px h-8 bg-gradient-to-b from-border to-transparent" />
        </div>
      </section>

      {/* ── 2. PHASE STATUS ── */}
      <section className="px-4 py-24 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-purple mb-3">
            Access
          </p>
          <h2 className="font-mono text-3xl font-bold text-text mb-4">
            Beperkte toegang.
          </h2>
          <p className="text-text-muted text-sm max-w-sm mx-auto leading-relaxed">
            VOIDSIGNL opent in fases. Hoe eerder je erin bent, hoe meer je krijgt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {phases.map((phase) => {
            const isFull = phase.phase === 1
            const isActive = phase.is_active
            const isFuture = !isFull && !isActive

            const claimed =
              phase.phase === 1
                ? (ps?.inner_circle_count ?? 0)
                : phase.phase === 2
                  ? (ps?.phase_claimed ?? 0)
                  : 0

            const phasePct =
              phase.limit_count > 0
                ? Math.max(
                    4,
                    Math.round((claimed / phase.limit_count) * 100),
                  )
                : 0

            return (
              <div
                key={phase.phase}
                className="relative rounded-2xl border p-6 overflow-hidden"
                style={{
                  background: isActive ? 'rgba(107,63,224,0.08)' : '#1a1a22',
                  borderColor: isActive
                    ? '#6B3FE0'
                    : isFull
                      ? 'rgba(255,255,255,0.08)'
                      : '#3a3a48',
                  opacity: isFuture ? 0.55 : 1,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-dim">
                    Fase {phase.phase}
                  </span>
                  {isFull && (
                    <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-1 rounded-full border bg-text-muted/10 border-border text-text-muted">
                      Vol
                    </span>
                  )}
                  {isActive && (
                    <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-1 rounded-full border bg-success/10 border-success/25 text-success flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-success inline-block" />
                      Actief
                    </span>
                  )}
                  {isFuture && (
                    <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-1 rounded-full border border-border text-text-dim">
                      Binnenkort
                    </span>
                  )}
                </div>

                <h3 className="font-mono text-base font-bold text-text mb-2">
                  {phase.name}
                </h3>
                <p className="text-text-muted text-xs leading-relaxed mb-5">
                  {phase.description}
                </p>

                {phase.limit_count > 0 && (
                  <>
                    <div className="w-full h-1 bg-void rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${phasePct}%`,
                          background: isActive
                            ? '#6B3FE0'
                            : isFull
                              ? '#9998aa'
                              : '#3a3a48',
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-text-dim">
                        {isFull
                          ? `${phase.limit_count}/${phase.limit_count}`
                          : isActive
                            ? `${claimed}/${phase.limit_count}`
                            : `0/${phase.limit_count}`}
                      </span>
                      {isActive && ps?.phase_remaining !== null && ps?.phase_remaining !== undefined && (
                        <span className="font-mono text-[10px] font-bold text-purple">
                          nog {ps.phase_remaining} over
                        </span>
                      )}
                    </div>
                  </>
                )}

                {isActive && (
                  <div
                    className="absolute inset-0 pointer-events-none rounded-2xl"
                    style={{ boxShadow: 'inset 0 0 40px rgba(107,63,224,0.08)' }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {!loading &&
          ps?.phase_remaining !== null &&
          ps?.phase_remaining !== undefined &&
          ps.phase_remaining <= 20 && (
            <div
              className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl border"
              style={{
                background: 'rgba(239,68,68,0.05)',
                borderColor: 'rgba(239,68,68,0.2)',
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full bg-danger"
                style={{ animation: 'home-pulse 1s ease-in-out infinite' }}
              />
              <p className="font-mono text-xs text-danger uppercase tracking-wider">
                Nog {ps.phase_remaining} plekken beschikbaar in {activePhaseLabel}
              </p>
            </div>
          )}
      </section>

      {/* ── 3. RANKINGS ── */}
      <section id="rankings" className="px-4 py-24 max-w-4xl mx-auto">
        <div className="mb-10">
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-purple mb-3">
            Leaderboard
          </p>
          <h2 className="font-mono text-3xl font-bold text-text mb-2">
            The Ranking
          </h2>
          <p className="text-text-muted text-sm">
            Merit-based. XP verdien je door te doen.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {/* Top 3 zichtbaar */}
          {(data?.topPlayers ?? []).slice(0, 3).map((player, i) => {
            const accent = player.accent_color ?? '#6B3FE0'
            const rankColor =
              i === 0 ? '#00C8F0' : i === 1 ? '#9998aa' : '#6B3FE0'

            return (
              <div
                key={player.username}
                className={`flex items-center gap-4 px-6 py-4 border-b border-border ${
                  i === 0 ? 'bg-purple/4' : ''
                }`}
              >
                <span
                  className="font-mono text-sm font-bold w-6 text-right shrink-0"
                  style={{ color: rankColor }}
                >
                  #{i + 1}
                </span>
                <div
                  className="w-10 h-10 rounded-full overflow-hidden bg-surface-2 border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: accent }}
                >
                  {player.avatar_url ? (
                    <Image
                      src={player.avatar_url}
                      alt={player.username}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span
                      className="font-mono text-sm font-bold"
                      style={{ color: accent }}
                    >
                      {player.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-mono text-sm font-bold text-text">
                      {(player.display_name ?? player.username).toUpperCase()}
                    </span>
                    {player.is_inner_circle && (
                      <span className="font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border bg-cyan/10 border-cyan/25 text-cyan">
                        Inner Circle
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-text-muted">
                    {player.level_name}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-sm font-bold text-text">
                    {player.xp.toLocaleString()}
                  </p>
                  <p className="font-mono text-[9px] text-text-dim uppercase">XP</p>
                </div>
              </div>
            )
          })}

          {/* #4 en #5 — geblurred */}
          {(data?.topPlayers ?? []).slice(3, 5).map((player, i) => (
            <div
              key={player.username}
              className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-0 relative overflow-hidden"
            >
              <div
                className="absolute inset-0 backdrop-blur-sm z-10"
                style={{ background: 'rgba(14,14,18,0.4)' }}
              />
              <span className="font-mono text-sm font-bold w-6 text-right shrink-0 text-white/20">
                #{i + 4}
              </span>
              <div className="w-10 h-10 rounded-full bg-surface-2 shrink-0" />
              <div className="flex-1">
                <div className="h-3 w-24 bg-surface-2 rounded mb-1.5" />
                <div className="h-2 w-16 bg-surface-2 rounded" />
              </div>
              <div className="h-4 w-16 bg-surface-2 rounded" />
            </div>
          ))}

          {/* Skeleton wanneer geen data */}
          {!loading &&
            (data?.topPlayers ?? []).length === 0 &&
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={`skel-${i}`}
                className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-0"
              >
                <span className="font-mono text-sm font-bold w-6 text-right shrink-0 text-text-dim">
                  #{i + 1}
                </span>
                <div className="w-10 h-10 rounded-full bg-surface-2 shrink-0" />
                <div className="flex-1">
                  <div className="h-3 w-24 bg-surface-2 rounded mb-1.5" />
                  <div className="h-2 w-16 bg-surface-2 rounded" />
                </div>
              </div>
            ))}

          <div className="px-6 py-5 flex items-center justify-between border-t border-border flex-wrap gap-3">
            <p className="text-text-muted text-sm">
              Log in om de volledige ranking te zien.
            </p>
            <Link
              href="/login"
              className="px-5 py-2.5 bg-purple text-white font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-purple/85 transition-colors duration-200"
            >
              Sign in →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. INNER CIRCLE ── */}
      <section id="inner-circle" className="px-4 py-24 max-w-4xl mx-auto">
        <div className="mb-10">
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-cyan mb-3">
            Inner Circle
          </p>
          <h2 className="font-mono text-3xl font-bold text-text mb-2">
            De eerste 25.
          </h2>
          <p className="text-text-muted text-sm max-w-md leading-relaxed">
            Permanent Inner Circle status. Als eerste binnen — altijd zichtbaar,
            altijd erkend.
          </p>
        </div>

        {data?.innerCircle && data.innerCircle.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {data.innerCircle.map((member, i) => {
              const accent = member.accent_color ?? '#6B3FE0'
              return (
                <div
                  key={member.username}
                  className="relative bg-surface border border-border rounded-2xl p-5 text-center hover:border-cyan/40 transition-colors duration-200"
                >
                  <span className="font-mono text-[9px] text-text-dim absolute top-3 right-3">
                    #{String(i + 1).padStart(2, '0')}
                  </span>

                  <div
                    className="w-14 h-14 rounded-full overflow-hidden bg-surface-2 border-2 mx-auto mb-3 flex items-center justify-center"
                    style={{ borderColor: accent }}
                  >
                    {member.avatar_url ? (
                      <Image
                        src={member.avatar_url}
                        alt={member.username}
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span
                        className="font-mono text-xl font-bold"
                        style={{ color: accent }}
                      >
                        {member.username[0].toUpperCase()}
                      </span>
                    )}
                  </div>

                  <p className="font-mono text-xs font-bold text-text truncate mb-1">
                    {member.display_name ?? member.username}
                  </p>
                  <p className="font-mono text-[10px] text-text-muted truncate mb-3">
                    @{member.username}
                  </p>

                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full border bg-cyan/8 border-cyan/20">
                    <span className="text-cyan text-[9px]">★</span>
                    <span className="font-mono text-[8px] uppercase tracking-widest text-cyan">
                      Inner Circle
                    </span>
                  </div>
                </div>
              )
            })}

            {Array.from({
              length: Math.max(0, 5 - data.innerCircle.length),
            }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="bg-surface border border-dashed border-border rounded-2xl p-5 text-center opacity-30"
              >
                <div className="w-14 h-14 rounded-full bg-surface-2 mx-auto mb-3" />
                <p className="font-mono text-[10px] text-text-dim uppercase tracking-wider">
                  Beschikbaar
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface border border-dashed border-border rounded-2xl p-5 text-center opacity-30"
              >
                <div className="w-14 h-14 rounded-full bg-surface-2 mx-auto mb-3" />
                <p className="font-mono text-[10px] text-text-dim uppercase tracking-wider">
                  Beschikbaar
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 5. FEATURES ── */}
      <section id="features" className="px-4 py-24 max-w-4xl mx-auto">
        <div className="mb-12">
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-purple mb-3">
            Platform
          </p>
          <h2 className="font-mono text-3xl font-bold text-text mb-2">
            Alles wat een gaming community nodig heeft.
          </h2>
          <p className="text-text-muted text-sm">
            Gebouwd voor alle games, alle platforms, alle niveaus.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.name}
              className="bg-surface border border-border rounded-2xl p-6 hover:border-purple/40 transition-colors duration-200 group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{
                  background: `${feature.color}18`,
                  color: feature.color,
                }}
              >
                <span className="font-mono text-lg">{feature.icon}</span>
              </div>

              <p
                className="font-mono text-[9px] uppercase tracking-[0.2em] mb-2"
                style={{ color: feature.color }}
              >
                {feature.tag}
              </p>

              <h3 className="font-mono text-base font-bold text-text mb-3 group-hover:text-purple transition-colors duration-200">
                {feature.name}
              </h3>

              <p className="text-text-muted text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. FINAL CTA ── */}
      <section className="px-4 py-32 text-center max-w-2xl mx-auto">
        {!loading && data && (
          <div className="flex items-center justify-center gap-8 mb-16 flex-wrap">
            {[
              { num: data.phaseStats?.total_members ?? 0, label: 'Members' },
              { num: data.totalClans, label: 'Clans' },
              { num: data.totalClips, label: 'Clips' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-mono text-3xl font-bold text-text leading-none mb-1">
                  {stat.num.toLocaleString()}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        )}

        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-purple mb-4">
          Join the signal
        </p>
        <h2 className="font-mono text-4xl font-bold text-text mb-4 leading-tight">
          De void wacht.
        </h2>
        <p className="text-text-muted text-sm mb-10 leading-relaxed">
          Inner circle · Priority access · Permanent status
        </p>

        <Link
          href="/register"
          className="inline-block px-12 py-5 bg-purple text-white font-mono text-sm uppercase tracking-[0.2em] rounded-xl hover:bg-purple/85 transition-colors duration-200 mb-4"
        >
          Request access →
        </Link>

        {!loading &&
          ps?.phase_remaining !== null &&
          ps?.phase_remaining !== undefined && (
            <p className="font-mono text-[10px] text-text-dim uppercase tracking-wider">
              Nog {ps.phase_remaining} {activePhaseLabel} plekken beschikbaar
            </p>
          )}
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-purple/15 px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <svg width="18" height="18" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" stroke="#6B3FE0" strokeWidth="1.5" opacity="0.5" />
            <circle cx="40" cy="40" r="10" stroke="#6B3FE0" strokeWidth="1.5" />
            <circle cx="40" cy="40" r="2.5" fill="#00C8F0" />
          </svg>
          <span className="font-mono text-xs font-bold text-text tracking-wider">
            VOID<span className="text-purple">SIGNL</span>
          </span>
        </div>
        <p className="font-mono text-[10px] text-text-dim uppercase tracking-[0.2em]">
          Not for everyone · For those who know · {new Date().getFullYear()}
        </p>
      </footer>

      <style jsx global>{`
        @keyframes home-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
