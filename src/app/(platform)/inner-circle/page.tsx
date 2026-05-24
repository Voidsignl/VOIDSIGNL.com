'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

const MOD_LEVEL_LABELS = [
  '',
  'Content Mod',
  'Gebruikersbeheer',
  'Clan Mod',
  'Platform Decisions',
  'Admin',
]

const MOD_LEVEL_COLORS = ['', '#9998aa', '#6B3FE0', '#00C8F0', '#f59e0b', '#ef4444']

type Tab = 'overview' | 'members' | 'votes' | 'modlog'

interface MemberRow {
  id: string
  username: string
  display_name?: string | null
  avatar_url?: string | null
  accent_color?: string | null
  mod_level: number
  mod_actions_count: number
  level_name: string
  xp: number
  last_seen_at?: string | null
}

interface VoteCreator {
  id: string
  username: string
  display_name?: string | null
  avatar_url?: string | null
}

interface ActiveVote {
  id: string
  title: string
  description: string
  vote_type: 'simple' | 'upgrade_request' | 'platform_decision'
  status: string
  closes_at: string
  quorum_pct: number
  creator: VoteCreator | null
  my_vote: 'for' | 'against' | 'abstain' | null
  vote_count: number
}

interface ClosedVote {
  id: string
  title: string
  vote_type: 'simple' | 'upgrade_request' | 'platform_decision'
  status: string
  result: 'approved' | 'rejected' | null
  closes_at: string
}

interface ModAction {
  id: string
  target_type: string
  action: string
  reason: string | null
  created_at: string
  mod: {
    username: string
    avatar_url?: string | null
    mod_level: number
  } | null
}

interface IcData {
  profile: {
    id: string
    username: string
    mod_level: number
    mod_actions_count: number
    inner_circle_joined_at: string | null
  }
  members: MemberRow[]
  icClan: {
    id: string
    name: string
    slug: string
    avatar_url?: string | null
    xp_total: number
    member_count: number
    description?: string | null
  } | null
  activeVotes: ActiveVote[]
  closedVotes: ClosedVote[]
  recentModActions: ModAction[]
  stats: { total: number; level1: number; level2: number; level3p: number }
}

function timeLeft(date: string) {
  const diff = new Date(date).getTime() - Date.now()
  if (diff <= 0) return 'Gesloten'
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  if (days > 0) return `${days}d ${hours}u`
  return `${hours}u`
}

function isOnline(last?: string | null): boolean {
  if (!last) return false
  return Date.now() - new Date(last).getTime() < 90_000
}

export default function InnerCirclePage() {
  const router = useRouter()
  const [data, setData] = useState<IcData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/inner-circle')
      if (res.status === 403) {
        router.push('/dashboard')
        return
      }
      if (!res.ok) return
      setData((await res.json()) as IcData)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void load()
  }, [load])

  if (loading && !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-32 bg-surface rounded-2xl" />
        <div className="h-12 bg-surface rounded-xl" />
      </div>
    )
  }
  if (!data) return null

  const {
    profile,
    members,
    activeVotes,
    closedVotes,
    recentModActions,
    stats,
    icClan,
  } = data

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Hero */}
      <div
        className="relative rounded-2xl overflow-hidden mb-6 border border-cyan/30"
        style={{
          background: 'linear-gradient(135deg, rgba(0,200,240,0.06) 0%, #0e0e12 60%)',
        }}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
            <div>
              <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-cyan mb-2">
                Inner Circle
              </p>
              <h1 className="font-mono text-3xl font-bold text-text mb-1">
                The Inner Circle
              </h1>
              <p className="text-text-muted text-sm">
                {stats.total} leden · Governance & Moderatie
              </p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-cyan/8 border-cyan/20">
                <span className="text-cyan text-sm">★</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-cyan">
                  Inner Circle
                </span>
              </div>
              <p className="font-mono text-xs text-text-muted mt-2">
                Jouw niveau:{' '}
                <span style={{ color: MOD_LEVEL_COLORS[profile.mod_level] }}>
                  {MOD_LEVEL_LABELS[profile.mod_level]}
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { num: stats.total, label: 'Leden', color: '#fff' },
              { num: stats.level1, label: 'Level 1', color: '#9998aa' },
              { num: stats.level2, label: 'Level 2', color: '#6B3FE0' },
              { num: stats.level3p, label: 'Level 3+', color: '#00C8F0' },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-black/30 rounded-xl p-3 text-center"
              >
                <p
                  className="font-mono text-xl font-bold leading-none mb-1"
                  style={{ color: s.color }}
                >
                  {s.num}
                </p>
                <p className="font-mono text-[9px] text-text-muted uppercase tracking-wider">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-surface border border-border rounded-xl p-1 mb-6">
        {[
          { key: 'overview' as Tab, label: 'Overview' },
          { key: 'members' as Tab, label: 'Leden' },
          {
            key: 'votes' as Tab,
            label: `Votes${activeVotes.length > 0 ? ` (${activeVotes.length})` : ''}`,
          },
          { key: 'modlog' as Tab, label: 'Mod Log' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-colors duration-200 ${
              tab === t.key
                ? 'bg-purple text-white'
                : 'text-text-muted hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {activeVotes.length > 0 && (
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-purple">
                    Actieve votes
                  </p>
                  <Link
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setTab('votes')
                    }}
                    className="font-mono text-[9px] text-text-muted hover:text-text transition-colors"
                  >
                    Alle →
                  </Link>
                </div>
                {activeVotes.slice(0, 3).map((vote) => (
                  <Link
                    key={vote.id}
                    href={`/inner-circle/votes/${vote.id}`}
                    className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-surface-2 transition-colors duration-200"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-bold text-text truncate mb-0.5">
                        {vote.title}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-text-muted">
                          {vote.creator?.username}
                        </span>
                        <span className="font-mono text-[10px] text-text-dim">
                          {vote.vote_count} stemmen
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {vote.my_vote ? (
                        <span
                          className={`font-mono text-[9px] uppercase tracking-widest px-2 py-1 rounded-full border ${
                            vote.my_vote === 'for'
                              ? 'bg-success/10 border-success/20 text-success'
                              : vote.my_vote === 'against'
                                ? 'bg-danger/10 border-danger/20 text-danger'
                                : 'bg-surface-2 border-border text-text-muted'
                          }`}
                        >
                          {vote.my_vote === 'for'
                            ? 'Voor'
                            : vote.my_vote === 'against'
                              ? 'Tegen'
                              : 'Onthouding'}
                        </span>
                      ) : (
                        <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-1 rounded-full border bg-purple/10 border-purple/25 text-purple">
                          Stem nu
                        </span>
                      )}
                      <p className="font-mono text-[10px] text-text-dim mt-1">
                        {timeLeft(vote.closes_at)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {icClan && (
              <div className="bg-surface border border-cyan/20 rounded-xl p-5">
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-cyan mb-3">
                  The Inner Circle Clan
                </p>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center">
                      <span className="font-mono text-xl text-cyan">IC</span>
                    </div>
                    <div>
                      <p className="font-mono text-sm font-bold text-text">
                        {icClan.name}
                      </p>
                      <p className="font-mono text-[10px] text-text-muted">
                        {icClan.member_count} leden · Exclusief
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/clans/${icClan.slug}`}
                    className="px-4 py-2 bg-cyan/10 border border-cyan/20 text-cyan font-mono text-xs uppercase tracking-widest rounded-lg hover:bg-cyan/15 transition-colors duration-200"
                  >
                    Bekijk →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-purple mb-3">
                Jouw status
              </p>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((level) => {
                  const isUnlocked = profile.mod_level >= level
                  const isCurrent = profile.mod_level === level
                  return (
                    <div
                      key={level}
                      className={`flex items-center gap-3 p-2.5 rounded-lg ${
                        isCurrent
                          ? 'bg-purple/10 border border-purple/20'
                          : ''
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          background: isUnlocked
                            ? MOD_LEVEL_COLORS[level]
                            : '#3a3a48',
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs text-text">
                          N{level} — {MOD_LEVEL_LABELS[level]}
                        </p>
                        <p className="font-mono text-[9px] text-text-dim">
                          {level === 1
                            ? 'Automatisch bij IC'
                            : level === 2
                              ? '30d + 50 acties'
                              : 'Via IC vote'}
                        </p>
                      </div>
                      {isCurrent && (
                        <span className="font-mono text-[8px] text-purple uppercase tracking-widest">
                          Actief
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <Link
              href="/inner-circle/votes/new"
              className="flex items-center justify-center gap-2 w-full py-3 bg-purple text-white font-mono text-xs uppercase tracking-wider rounded-xl hover:bg-purple/85 transition-colors duration-200"
            >
              + Nieuw voorstel
            </Link>
          </div>
        </div>
      )}

      {/* LEDEN TAB */}
      {tab === 'members' && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {members.map((member, i) => (
            <div
              key={member.id}
              className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0"
            >
              <span className="font-mono text-xs text-text-dim w-6 text-right shrink-0">
                #{String(i + 1).padStart(2, '0')}
              </span>
              <div className="relative shrink-0">
                <div
                  className="w-10 h-10 rounded-full overflow-hidden bg-surface-2 border-2 flex items-center justify-center"
                  style={{ borderColor: member.accent_color ?? '#00C8F0' }}
                >
                  {member.avatar_url ? (
                    <Image
                      src={member.avatar_url}
                      alt={member.username}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span
                      className="font-mono text-sm font-bold"
                      style={{ color: member.accent_color ?? '#00C8F0' }}
                    >
                      {member.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
                {isOnline(member.last_seen_at) && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-surface" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <Link
                    href={`/profile/${member.username}`}
                    className="font-mono text-sm font-bold text-text hover:text-purple transition-colors duration-200"
                  >
                    {member.display_name ?? member.username}
                  </Link>
                  <span className="font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border bg-cyan/8 border-cyan/20 text-cyan">
                    Inner Circle
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-[10px] text-text-muted">
                    {member.level_name}
                  </span>
                  <span
                    className="font-mono text-[10px]"
                    style={{ color: MOD_LEVEL_COLORS[member.mod_level] }}
                  >
                    {MOD_LEVEL_LABELS[member.mod_level]}
                  </span>
                  <span className="font-mono text-[10px] text-text-dim">
                    {member.mod_actions_count} acties
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-sm font-bold text-text">
                  {(member.xp ?? 0).toLocaleString()}
                </p>
                <p className="font-mono text-[9px] text-text-dim uppercase">
                  XP
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VOTES TAB */}
      {tab === 'votes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
            <p className="text-text-muted text-sm">
              {activeVotes.length} actief · {closedVotes.length} gesloten
            </p>
            <Link
              href="/inner-circle/votes/new"
              className="px-5 py-2.5 bg-purple text-white font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-purple/85 transition-colors duration-200"
            >
              + Nieuw voorstel
            </Link>
          </div>

          {activeVotes.length === 0 && closedVotes.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-mono text-[10px] uppercase text-text-dim mb-2">
                Geen votes
              </p>
              <p className="text-text-muted text-sm mb-6">
                Dien een voorstel in.
              </p>
            </div>
          ) : (
            <>
              {activeVotes.map((vote) => (
                <Link
                  key={vote.id}
                  href={`/inner-circle/votes/${vote.id}`}
                  className="block bg-surface border border-purple/30 rounded-xl p-5 hover:border-purple transition-colors duration-200"
                >
                  <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-mono text-sm font-bold text-text">
                          {vote.title}
                        </p>
                        <span
                          className={`font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${
                            vote.vote_type === 'upgrade_request'
                              ? 'bg-warning/10 border-warning/20 text-warning'
                              : vote.vote_type === 'platform_decision'
                                ? 'bg-cyan/10 border-cyan/20 text-cyan'
                                : 'bg-purple/10 border-purple/25 text-purple'
                          }`}
                        >
                          {vote.vote_type === 'upgrade_request'
                            ? 'Upgrade'
                            : vote.vote_type === 'platform_decision'
                              ? 'Platform'
                              : 'Voorstel'}
                        </span>
                      </div>
                      <p className="text-text-muted text-xs line-clamp-2">
                        {vote.description}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {vote.my_vote ? (
                        <span
                          className={`font-mono text-[9px] uppercase tracking-widest px-2 py-1 rounded-full border block mb-1 ${
                            vote.my_vote === 'for'
                              ? 'bg-success/10 border-success/20 text-success'
                              : vote.my_vote === 'against'
                                ? 'bg-danger/10 border-danger/20 text-danger'
                                : 'bg-surface-2 border-border text-text-muted'
                          }`}
                        >
                          Gestemd
                        </span>
                      ) : (
                        <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-1 rounded-full border bg-purple/15 border-purple text-purple block mb-1">
                          Stem nu
                        </span>
                      )}
                      <p className="font-mono text-[10px] text-text-dim">
                        {timeLeft(vote.closes_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-[10px] text-text-muted">
                      {vote.creator?.username}
                    </span>
                    <span className="font-mono text-[10px] text-text-dim">
                      {vote.vote_count} / {stats.total} stemmen
                    </span>
                  </div>
                </Link>
              ))}

              {closedVotes.length > 0 && (
                <div className="pt-2">
                  <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-dim mb-3">
                    Gesloten
                  </p>
                  {closedVotes.map((vote) => (
                    <Link
                      key={vote.id}
                      href={`/inner-circle/votes/${vote.id}`}
                      className="flex items-center gap-4 bg-surface border border-border rounded-xl px-5 py-4 mb-2 hover:border-purple/30 transition-colors duration-200 opacity-60"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm font-bold text-text truncate">
                          {vote.title}
                        </p>
                      </div>
                      <span
                        className={`font-mono text-[9px] uppercase tracking-widest px-2 py-1 rounded-full border shrink-0 ${
                          vote.result === 'approved'
                            ? 'bg-success/10 border-success/20 text-success'
                            : 'bg-danger/8 border-danger/20 text-danger'
                        }`}
                      >
                        {vote.result === 'approved'
                          ? 'Goedgekeurd'
                          : 'Afgewezen'}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* MOD LOG TAB */}
      {tab === 'modlog' && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {recentModActions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-text-muted text-sm">
                Nog geen moderatie acties.
              </p>
            </div>
          ) : (
            recentModActions.map((action) => (
              <div
                key={action.id}
                className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0"
              >
                <div className="w-8 h-8 rounded-lg bg-purple/10 flex items-center justify-center shrink-0">
                  <span className="font-mono text-xs text-purple">
                    {action.action === 'delete'
                      ? '✕'
                      : action.action === 'pin'
                        ? '↑'
                        : action.action === 'lock'
                          ? '⬡'
                          : action.action === 'warn'
                            ? '!'
                            : action.action === 'mute'
                              ? '〇'
                              : '→'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-text">
                    <span
                      style={{
                        color: MOD_LEVEL_COLORS[action.mod?.mod_level ?? 1],
                      }}
                    >
                      {action.mod?.username}
                    </span>{' '}
                    <span className="text-text-muted">
                      {action.action === 'delete'
                        ? 'verwijderde'
                        : action.action === 'pin'
                          ? 'pinned'
                          : action.action === 'lock'
                            ? 'sloot'
                            : action.action === 'warn'
                              ? 'waarschuwde'
                              : action.action === 'mute'
                                ? 'mutete'
                                : 'actie op'}{' '}
                      een {action.target_type.replace('_', ' ')}
                    </span>
                  </p>
                  {action.reason && (
                    <p className="text-text-dim text-[10px] mt-0.5">
                      {action.reason}
                    </p>
                  )}
                </div>
                <span className="font-mono text-[10px] text-text-dim shrink-0">
                  {new Date(action.created_at).toLocaleTimeString('nl-NL', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
