import Image from 'next/image'
import Link from 'next/link'

interface RankingRowProps {
  rank: number
  user: {
    id: string
    username: string
    display_name?: string | null
    avatar_url?: string | null
    xp?: number
    level?: number
    level_name?: string
    is_verified?: boolean
    is_founding_member?: boolean
    accent_color?: string | null
    clip_count?: number
    cotw_wins?: number
    clip_score?: number
    total_likes?: number
    coaching_score?: number
    avg_rating?: number
    total_sessions?: number
  }
  tab: 'global' | 'clips' | 'coaching' | 'clans'
  isOwn?: boolean
}

const MAX_XP_FOR_BAR = 12000

export default function RankingRow({ rank, user, tab, isOwn }: RankingRowProps) {
  const accentColor = user.accent_color ?? '#6B3FE0'
  const xpPct = Math.min(100, Math.round(((user.xp ?? 0) / MAX_XP_FOR_BAR) * 100))

  const rankColor =
    rank === 1 ? '#00C8F0' :
    rank === 2 ? '#9998aa' :
    rank === 3 ? '#6B3FE0' : 'rgba(255,255,255,0.25)'

  return (
    <Link href={`/profile/${user.username}`}>
      <div className={`flex items-center gap-4 px-5 py-4 rounded-xl border transition-colors duration-200 cursor-pointer ${
        isOwn
          ? 'bg-purple/8 border-purple/40'
          : 'bg-surface border-border hover:border-purple'
      }`}>

        {/* Rank */}
        <div className="w-8 text-right flex-shrink-0">
          <span className="font-mono text-sm font-bold" style={{ color: rankColor }}>
            #{rank}
          </span>
        </div>

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className="relative w-10 h-10 rounded-full overflow-hidden bg-surface-2 border-2"
            style={{ borderColor: isOwn ? accentColor : '#3a3a48' }}
          >
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.username}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-mono text-xs text-text-dim">
                  {user.username?.[0]?.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Naam + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className="font-mono text-sm font-bold uppercase tracking-wide truncate"
              style={{ color: isOwn ? accentColor : '#ffffff' }}
            >
              {user.display_name ?? user.username}
            </span>
            {user.is_founding_member && (
              <span className="font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-cyan/10 border border-cyan/25 text-cyan flex-shrink-0">
                Founding
              </span>
            )}
            {user.is_verified && (
              <span className="text-cyan text-xs flex-shrink-0">✓</span>
            )}
          </div>

          {tab === 'global' && (
            <div className="flex items-center gap-3">
              <div className="flex-1 max-w-[120px] h-1.5 bg-void rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-colors duration-200"
                  style={{ width: `${xpPct}%`, background: accentColor }}
                />
              </div>
              <span className="font-mono text-[10px] text-text-dim">
                {user.level_name}
              </span>
              {(user.clip_count ?? 0) > 0 && (
                <span className="font-mono text-[10px] text-text-dim/60">
                  {user.clip_count} clips
                </span>
              )}
              {(user.cotw_wins ?? 0) > 0 && (
                <span className="font-mono text-[10px] text-purple">
                  {user.cotw_wins}× CotW
                </span>
              )}
            </div>
          )}

          {tab === 'clips' && (
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-text-dim">
                {user.total_likes?.toLocaleString()} likes
              </span>
              {(user.cotw_wins ?? 0) > 0 && (
                <span className="font-mono text-[10px] text-purple">
                  {user.cotw_wins}× CotW
                </span>
              )}
            </div>
          )}

          {tab === 'coaching' && (
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-text-dim">
                ★ {user.avg_rating?.toFixed(1)}
              </span>
              <span className="font-mono text-[10px] text-text-dim/60">
                {user.total_sessions} sessies
              </span>
            </div>
          )}
        </div>

        {/* Score */}
        <div className="text-right flex-shrink-0">
          {tab === 'global' && (
            <span className="font-mono text-sm font-bold text-text">
              {(user.xp ?? 0).toLocaleString()}
              <span className="text-text-dim/60 text-[10px] ml-1">XP</span>
            </span>
          )}
          {tab === 'clips' && (
            <span className="font-mono text-sm font-bold text-text">
              {(user.clip_score ?? 0).toLocaleString()}
            </span>
          )}
          {tab === 'coaching' && (
            <span className="font-mono text-sm font-bold text-text">
              {user.coaching_score?.toFixed(0)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
