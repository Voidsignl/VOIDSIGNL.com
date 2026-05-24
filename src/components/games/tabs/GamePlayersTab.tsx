'use client'

import Link from 'next/link'
import Image from 'next/image'

interface PlayerRow {
  id: string
  username: string
  display_name?: string | null
  avatar_url?: string | null
  accent_color?: string | null
  is_verified?: boolean
  is_founding_member?: boolean
  level_name?: string
  xp?: number
  rank?: string | null
  is_main?: boolean
  hours_played?: number | null
  last_seen_at?: string | null
  clan_name?: string | null
  clan_slug?: string | null
}

interface Pagination {
  page: number
  total: number
  pageSize: number
}

interface Props {
  players: PlayerRow[]
  pagination: Pagination
  onPageChange: (page: number) => void
}

function isOnline(lastSeen?: string | null): boolean {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < 90_000
}

export default function GamePlayersTab({ players, pagination, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize))

  if (players.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <p className="font-mono text-sm text-text-dim">
          Nog geen spelers voor dit game.
        </p>
        <p className="font-mono text-xs text-text-muted mt-2">
          Voeg dit game toe aan je bibliotheek om hier te verschijnen.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="font-mono text-[11px] tracking-[0.18em] uppercase text-purple">
          Alle spelers
        </h2>
        <span className="font-mono text-[10px] text-text-muted">
          {pagination.total.toLocaleString()} totaal
        </span>
      </div>

      <div className="divide-y divide-border">
        {players.map((p) => {
          const accent = p.accent_color ?? '#6B3FE0'
          return (
            <Link
              key={p.id}
              href={`/profile/${p.username}`}
              className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2 transition-colors duration-200"
            >
              <div className="relative shrink-0">
                <div
                  className="w-10 h-10 rounded-full overflow-hidden bg-surface-2 border-2 flex items-center justify-center"
                  style={{ borderColor: accent }}
                >
                  {p.avatar_url ? (
                    <Image
                      src={p.avatar_url}
                      alt={p.username}
                      width={40}
                      height={40}
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
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  <span className="font-mono text-xs font-bold text-text truncate">
                    {(p.display_name ?? p.username).toUpperCase()}
                  </span>
                  {p.is_verified && <span className="text-cyan text-[10px]">✓</span>}
                  {p.is_main && (
                    <span className="font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border bg-purple/10 border-purple/25 text-purple">
                      Main
                    </span>
                  )}
                  {p.is_founding_member && (
                    <span className="font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border bg-cyan/10 border-cyan/25 text-cyan">
                      Founding
                    </span>
                  )}
                  {p.clan_name && (
                    <span className="font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border bg-purple/10 border-purple/25 text-purple">
                      ⬡ {p.clan_name}
                    </span>
                  )}
                </div>
                <p className="font-mono text-[10px] text-text-muted">
                  {p.level_name} · {p.xp?.toLocaleString()} XP
                  {p.hours_played && p.hours_played > 0
                    ? ` · ${p.hours_played}h gespeeld`
                    : ''}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 px-5 py-4 border-t border-border">
          <button
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            disabled={pagination.page === 1}
            className="font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text hover:border-purple/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
          >
            ← Vorige
          </button>
          <span className="font-mono text-[10px] text-text-dim">
            {pagination.page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, pagination.page + 1))}
            disabled={pagination.page === totalPages}
            className="font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text hover:border-purple/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Volgende →
          </button>
        </div>
      )}
    </div>
  )
}
