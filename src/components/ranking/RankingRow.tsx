import Link from 'next/link'
import Image from 'next/image'

export interface RankingRowUser {
  id: string
  username: string
  display_name?: string | null
  avatar_url?: string | null
  accent_color?: string | null
  xp: number
  level_name: string
  rank?: number
  is_verified?: boolean
  is_founding_member?: boolean
  follower_count?: number
  clip_count?: number
  post_count?: number
  last_seen_at?: string | null
  clan_name?: string | null
  clan_slug?: string | null
  achievement_count?: number
  cotw_count?: number
}

interface RankingRowProps {
  rank: number
  user: RankingRowUser
  isOwn?: boolean
  /** XP van #1 — voor relatieve progressie-bar breedte. */
  maxXp?: number
}

function rankColor(rank: number) {
  if (rank === 1) return '#00C8F0'
  if (rank === 2) return '#9998aa'
  if (rank === 3) return '#6B3FE0'
  return 'rgba(255,255,255,0.25)'
}

export default function RankingRow({ rank, user, isOwn, maxXp = 1 }: RankingRowProps) {
  const accent = user.accent_color ?? '#6B3FE0'
  const barPct = Math.max(2, Math.round((user.xp / maxXp) * 100))
  const isOnline = user.last_seen_at
    ? Date.now() - new Date(user.last_seen_at).getTime() < 90_000
    : false

  return (
    <Link href={`/profile/${user.username}`} className="block">
      <div
        className={`flex items-center gap-3 px-4 py-3 border-b border-border transition-colors duration-200 hover:bg-surface-2 cursor-pointer ${
          isOwn ? 'bg-purple/8' : ''
        }`}
        style={isOwn ? { borderLeft: '3px solid #6B3FE0' } : undefined}
      >
        {/* Rank */}
        <div
          className="font-mono text-sm font-bold w-7 text-right shrink-0"
          style={{ color: rankColor(rank) }}
        >
          #{rank}
        </div>

        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className="w-9 h-9 rounded-full overflow-hidden bg-surface-2 border-2 flex items-center justify-center"
            style={{ borderColor: accent }}
          >
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.username}
                width={36}
                height={36}
                className="object-cover w-full h-full"
              />
            ) : (
              <span
                className="font-mono text-sm font-bold"
                style={{ color: accent }}
              >
                {user.username?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
          {isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-surface" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Naam + badges */}
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span
              className="font-mono text-xs font-bold tracking-wide"
              style={{ color: isOwn ? accent : '#fff' }}
            >
              {(user.display_name ?? user.username).toUpperCase()}
            </span>

            {isOwn && (
              <span className="font-mono text-[9px] opacity-50" style={{ color: accent }}>
                ← jij
              </span>
            )}

            {user.is_verified && <span className="text-cyan text-xs">✓</span>}

            {user.is_founding_member && (
              <span className="font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border bg-cyan/10 border-cyan/25 text-cyan">
                Founding
              </span>
            )}

            {(user.cotw_count ?? 0) > 0 && (
              <span className="font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border bg-cyan/10 border-cyan/25 text-cyan">
                ★ CotW
              </span>
            )}

            {user.clan_name && (
              <span className="font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border bg-purple/10 border-purple/25 text-purple">
                ⬡ {user.clan_name}
              </span>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-[10px] text-text-muted">
              {user.level_name}
            </span>

            {(user.clip_count ?? 0) > 0 && (
              <span className="text-[10px] text-text-dim">
                {user.clip_count} {user.clip_count === 1 ? 'clip' : 'clips'}
              </span>
            )}

            {(user.follower_count ?? 0) > 0 && (
              <span className="text-[10px] text-text-dim">
                {user.follower_count} volgers
              </span>
            )}

            {(user.achievement_count ?? 0) > 0 && (
              <span className="text-[10px] text-purple">
                {user.achievement_count} badges
              </span>
            )}

            {/* XP progress bar */}
            <div className="w-20 h-0.5 bg-void rounded-full overflow-hidden shrink-0 ml-auto">
              <div
                className="h-full rounded-full"
                style={{ width: `${barPct}%`, background: accent }}
              />
            </div>
          </div>
        </div>

        {/* XP */}
        <div className="text-right shrink-0 min-w-[56px]">
          <div
            className="font-mono text-sm font-bold"
            style={{ color: isOwn ? accent : '#fff' }}
          >
            {user.xp.toLocaleString()}
          </div>
          <div className="font-mono text-[9px] text-text-dim uppercase">XP</div>
        </div>
      </div>
    </Link>
  )
}
