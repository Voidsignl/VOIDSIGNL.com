'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Users, Trophy, Hexagon, MessageSquare } from 'lucide-react'

interface PlayerLite {
  id: string
  username: string
  display_name?: string | null
  avatar_url?: string | null
  accent_color?: string | null
  is_verified?: boolean
  is_inner_circle?: boolean
  level_name?: string
  xp?: number
  rank?: string | null
  last_seen_at?: string | null
}

interface ClanLite {
  id: string
  name: string
  slug: string
  avatar_url?: string | null
  member_count?: number
  xp_total?: number
}

interface PostLite {
  id: string
  content: string
  created_at: string
  user: {
    id: string
    username: string
    display_name?: string | null
    avatar_url?: string | null
    accent_color?: string | null
  } | null
}

interface ForumCategoryLite {
  id: string
  name: string
  slug: string
  thread_count: number
}

interface Props {
  gameId: string
  gameName: string
  topPlayers: PlayerLite[]
  lfgPlayers: PlayerLite[]
  clans: ClanLite[]
  recentPosts: PostLite[]
  forumCategory: ForumCategoryLite | null
  onTabChange: (tab: 'players' | 'clips' | 'forum' | 'coaches') => void
}

function isOnline(lastSeen?: string | null): boolean {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < 90_000
}

export default function GameOverviewTab({
  gameId,
  gameName,
  topPlayers,
  lfgPlayers,
  clans,
  recentPosts,
  forumCategory,
  onTabChange,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Linker kolom — Top players + LFG */}
      <div className="lg:col-span-2 space-y-6">
        {/* Top spelers */}
        <section className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-purple" />
              <h2 className="font-mono text-[11px] tracking-[0.18em] uppercase text-purple">
                Top spelers in {gameName}
              </h2>
            </div>
            <button
              onClick={() => onTabChange('players')}
              className="font-mono text-[10px] uppercase tracking-widest text-text-muted hover:text-text transition-colors duration-200"
            >
              Bekijk alles →
            </button>
          </div>

          {topPlayers.length === 0 ? (
            <p className="font-mono text-xs text-text-dim py-6 text-center">
              Nog geen spelers — voeg dit game toe aan je bibliotheek.
            </p>
          ) : (
            <div className="space-y-1.5">
              {topPlayers.map((p, i) => {
                const accent = p.accent_color ?? '#6B3FE0'
                return (
                  <Link
                    key={p.id}
                    href={`/profile/${p.username}`}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-2 transition-colors duration-200"
                  >
                    <span
                      className="font-mono text-xs font-bold w-6 text-right shrink-0"
                      style={{
                        color:
                          i === 0
                            ? '#00C8F0'
                            : i === 1
                              ? '#9998aa'
                              : i === 2
                                ? '#6B3FE0'
                                : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      #{i + 1}
                    </span>
                    <div className="relative shrink-0">
                      <div
                        className="w-9 h-9 rounded-full overflow-hidden bg-surface-2 border-2 flex items-center justify-center"
                        style={{ borderColor: accent }}
                      >
                        {p.avatar_url ? (
                          <Image
                            src={p.avatar_url}
                            alt={p.username}
                            width={36}
                            height={36}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <span className="font-mono text-sm font-bold" style={{ color: accent }}>
                            {p.username[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      {isOnline(p.last_seen_at) && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-surface" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-text truncate">
                          {(p.display_name ?? p.username).toUpperCase()}
                        </span>
                        {p.is_verified && <span className="text-cyan text-[10px]">✓</span>}
                      </div>
                      <p className="font-mono text-[10px] text-text-muted">
                        {p.level_name} · {p.xp?.toLocaleString()} XP
                      </p>
                    </div>
                    {p.rank && (
                      <span className="font-mono text-[10px] uppercase tracking-widest text-purple shrink-0 px-2 py-0.5 rounded-full bg-purple/10 border border-purple/25">
                        {p.rank}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Recente posts */}
        {recentPosts.length > 0 && (
          <section className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-purple" />
                <h2 className="font-mono text-[11px] tracking-[0.18em] uppercase text-purple">
                  Recente posts
                </h2>
              </div>
              <Link
                href="/feed"
                className="font-mono text-[10px] uppercase tracking-widest text-text-muted hover:text-text transition-colors duration-200"
              >
                Feed →
              </Link>
            </div>
            <div className="space-y-3">
              {recentPosts.map((post) => {
                const accent = post.user?.accent_color ?? '#6B3FE0'
                return (
                  <Link
                    key={post.id}
                    href={`/feed?post=${post.id}`}
                    className="block bg-void border border-border rounded-lg p-3 hover:border-purple/40 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-6 h-6 rounded-full overflow-hidden bg-surface-2 border flex items-center justify-center shrink-0"
                        style={{ borderColor: accent }}
                      >
                        {post.user?.avatar_url ? (
                          <Image
                            src={post.user.avatar_url}
                            alt={post.user.username}
                            width={24}
                            height={24}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <span className="font-mono text-[10px]" style={{ color: accent }}>
                            {post.user?.username[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] font-bold text-text">
                        {post.user?.display_name ?? post.user?.username}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {/* Rechter kolom — LFG + Clans + Forum quick link */}
      <div className="space-y-6">
        {/* LFG */}
        <section className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-success" />
              <h2 className="font-mono text-[11px] tracking-[0.18em] uppercase text-success">
                Looking for group
              </h2>
            </div>
            <Link
              href={`/buddies?game=${gameId}`}
              className="font-mono text-[10px] uppercase tracking-widest text-text-muted hover:text-text transition-colors duration-200"
            >
              Alle →
            </Link>
          </div>

          {lfgPlayers.length === 0 ? (
            <p className="font-mono text-xs text-text-dim py-4 text-center">
              Niemand online nu.
            </p>
          ) : (
            <div className="space-y-2">
              {lfgPlayers.map((p) => {
                const accent = p.accent_color ?? '#6B3FE0'
                return (
                  <Link
                    key={p.id}
                    href={`/profile/${p.username}`}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-surface-2 transition-colors duration-200"
                  >
                    <div className="relative shrink-0">
                      <div
                        className="w-7 h-7 rounded-full overflow-hidden bg-surface-2 border flex items-center justify-center"
                        style={{ borderColor: accent }}
                      >
                        {p.avatar_url ? (
                          <Image
                            src={p.avatar_url}
                            alt={p.username}
                            width={28}
                            height={28}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <span className="font-mono text-[10px] font-bold" style={{ color: accent }}>
                            {p.username[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-success border border-surface" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[11px] font-bold text-text truncate">
                        {p.display_name ?? p.username}
                      </p>
                      {p.rank && (
                        <p className="font-mono text-[9px] text-text-muted truncate">{p.rank}</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Top Clans */}
        {clans.length > 0 && (
          <section className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Hexagon size={14} className="text-purple" />
                <h2 className="font-mono text-[11px] tracking-[0.18em] uppercase text-purple">
                  Actieve clans
                </h2>
              </div>
              <Link
                href="/clans"
                className="font-mono text-[10px] uppercase tracking-widest text-text-muted hover:text-text transition-colors duration-200"
              >
                Alle →
              </Link>
            </div>
            <div className="space-y-2">
              {clans.map((clan) => (
                <Link
                  key={clan.id}
                  href={`/clans/${clan.slug}`}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-2 transition-colors duration-200"
                >
                  <div className="w-9 h-9 rounded-lg bg-purple/15 border border-purple/30 flex items-center justify-center overflow-hidden shrink-0">
                    {clan.avatar_url ? (
                      <Image
                        src={clan.avatar_url}
                        alt={clan.name}
                        width={36}
                        height={36}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="font-mono text-sm text-purple">
                        {clan.name[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs font-bold text-text truncate">{clan.name}</p>
                    <p className="font-mono text-[10px] text-text-muted">
                      {clan.member_count ?? 0} leden
                    </p>
                  </div>
                  <p className="font-mono text-xs font-bold text-purple shrink-0">
                    {(clan.xp_total ?? 0).toLocaleString()}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Forum quick link */}
        {forumCategory && (
          <button
            onClick={() => onTabChange('forum')}
            className="w-full text-left bg-surface border border-border rounded-xl p-5 hover:border-purple/40 transition-colors duration-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={14} className="text-cyan" />
              <h2 className="font-mono text-[11px] tracking-[0.18em] uppercase text-cyan">
                Forum
              </h2>
            </div>
            <p className="font-mono text-sm font-bold text-text mb-1">{forumCategory.name}</p>
            <p className="font-mono text-[10px] text-text-muted">
              {forumCategory.thread_count} threads — klik om te bekijken
            </p>
          </button>
        )}
      </div>
    </div>
  )
}
