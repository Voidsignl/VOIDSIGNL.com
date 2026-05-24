'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star, Users, Globe } from 'lucide-react'

interface CoachRow {
  id: string
  username: string
  display_name?: string | null
  avatar_url?: string | null
  accent_color?: string | null
  is_verified?: boolean
  rank_info?: string | null
  avg_rating?: number
  total_sessions?: number
  price_basic?: number
  bio?: string | null
  languages?: string[] | null
}

interface Props {
  coaches: CoachRow[]
  gameName: string
}

export default function GameCoachesTab({ coaches, gameName }: Props) {
  if (coaches.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <p className="font-mono text-sm text-text-dim">
          Nog geen coaches voor {gameName}.
        </p>
        <Link
          href="/coaching"
          className="inline-block mt-3 font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg border border-purple/40 text-purple hover:bg-purple/10 transition-colors duration-200"
        >
          Word coach
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-[11px] tracking-[0.18em] uppercase text-purple">
          Coaches voor {gameName}
        </h2>
        <span className="font-mono text-[10px] text-text-muted">
          {coaches.length} {coaches.length === 1 ? 'coach' : 'coaches'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coaches.map((c) => {
          const accent = c.accent_color ?? '#6B3FE0'
          return (
            <Link
              key={c.id}
              href={`/coaching/${c.username}`}
              className="bg-surface border border-border rounded-xl p-5 hover:border-purple/40 transition-colors duration-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-full overflow-hidden bg-surface-2 border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: accent }}
                >
                  {c.avatar_url ? (
                    <Image
                      src={c.avatar_url}
                      alt={c.username}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="font-mono text-base font-bold" style={{ color: accent }}>
                      {c.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="font-mono text-sm font-bold text-text truncate">
                      {c.display_name ?? c.username}
                    </span>
                    {c.is_verified && <span className="text-cyan text-xs">✓</span>}
                  </div>
                  {c.rank_info && (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-purple">
                      {c.rank_info}
                    </span>
                  )}
                </div>
              </div>

              {c.bio && (
                <p className="text-xs text-text-muted line-clamp-2 mb-3 leading-relaxed">
                  {c.bio}
                </p>
              )}

              <div className="flex items-center gap-3 flex-wrap text-[10px] text-text-muted mb-3">
                {(c.avg_rating ?? 0) > 0 && (
                  <div className="flex items-center gap-1">
                    <Star size={10} className="text-warning fill-warning" />
                    <span className="font-mono">{c.avg_rating?.toFixed(1)}</span>
                  </div>
                )}
                {(c.total_sessions ?? 0) > 0 && (
                  <div className="flex items-center gap-1">
                    <Users size={10} />
                    <span className="font-mono">{c.total_sessions} sessies</span>
                  </div>
                )}
                {c.languages && c.languages.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Globe size={10} />
                    <span className="font-mono">{c.languages.join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="font-mono text-[10px] uppercase tracking-widest text-text-dim">
                  Vanaf
                </span>
                <span className="font-mono text-sm font-bold text-purple">
                  € {c.price_basic ?? 10}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
