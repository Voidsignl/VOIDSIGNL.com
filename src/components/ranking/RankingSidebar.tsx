import Link from 'next/link'
import Image from 'next/image'
import { LEVELS } from '@/lib/levels'

export interface RankingSidebarStats {
  totalMembers: number
  totalClips: number
  totalPosts: number
  totalClans: number
  activeToday: number
  achievementsToday: number
}

export interface RankingSidebarTopClip {
  title: string
  like_count: number
  user?: { username: string; display_name?: string | null } | null
  game?: { name: string } | null
}

export interface RankingSidebarTopClan {
  name: string
  slug: string
  avatar_url?: string | null
  xp_total: number
  member_count: number
}

interface RankingSidebarProps {
  stats: RankingSidebarStats
  topClip?: RankingSidebarTopClip | null
  topClan?: RankingSidebarTopClan | null
  currentUserLevelName?: string
  currentUserXp?: number
}

export default function RankingSidebar({
  stats,
  topClip,
  topClan,
  currentUserLevelName,
  currentUserXp,
}: RankingSidebarProps) {
  const currentLevelIdx = LEVELS.findIndex((l) => l.name === currentUserLevelName)

  return (
    <div className="flex flex-col gap-4">
      {/* Void Pulse */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-purple">
            Void Pulse
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-void-pulse" />
            <span className="font-mono text-[9px] text-success">Live</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            {
              num: stats.totalMembers,
              label: 'Members',
              sub: `${stats.activeToday} actief vandaag`,
              color: '#fff',
            },
            {
              num: stats.totalClips,
              label: 'Clips',
              sub: `${stats.totalPosts} posts totaal`,
              color: '#6B3FE0',
            },
            {
              num: stats.totalClans,
              label: 'Clans',
              sub: 'Actief',
              color: '#00C8F0',
            },
            {
              num: stats.achievementsToday,
              label: 'Badges',
              sub: 'Vandaag unlocked',
              color: '#22c55e',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-void border border-border rounded-lg p-3"
            >
              <p
                className="font-mono text-xl font-bold leading-none mb-1"
                style={{ color: item.color }}
              >
                {item.num.toLocaleString()}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted">
                {item.label}
              </p>
              <p className="text-[10px] text-text-dim mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Clip */}
      {topClip && (
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-purple">
              Top Clip
            </p>
            <Link
              href="/clips"
              className="font-mono text-[9px] text-text-muted hover:text-text transition-colors duration-200"
            >
              Alle clips →
            </Link>
          </div>

          <Link href="/clips" className="block">
            <div className="bg-void border border-cyan/20 rounded-lg p-3 hover:border-cyan/40 transition-[border-color] duration-200">
              <p className="font-mono text-[9px] uppercase tracking-widest text-cyan mb-2">
                ★ Meeste likes
              </p>
              <p className="font-mono text-xs text-text leading-relaxed mb-3 line-clamp-2">
                {topClip.title}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-text-muted">
                  {topClip.user?.display_name ?? topClip.user?.username}
                </span>
                <span className="font-mono text-xs text-purple font-bold">
                  ♥ {topClip.like_count.toLocaleString()}
                </span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Top Clan */}
      {topClan && (
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-purple">
              Top Clan
            </p>
            <Link
              href="/clans"
              className="font-mono text-[9px] text-text-muted hover:text-text transition-colors duration-200"
            >
              Alle clans →
            </Link>
          </div>

          <Link href={`/clans/${topClan.slug}`} className="block">
            <div className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200">
              <div className="w-10 h-10 rounded-xl bg-purple/20 border border-purple/30 flex items-center justify-center shrink-0 overflow-hidden">
                {topClan.avatar_url ? (
                  <Image
                    src={topClan.avatar_url}
                    alt={topClan.name}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="font-mono text-lg text-purple">
                    {topClan.name[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs font-bold text-text truncate">
                  {topClan.name}
                </p>
                <p className="font-mono text-[10px] text-text-muted">
                  {topClan.member_count} leden
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-sm font-bold text-purple">
                  {topClan.xp_total.toLocaleString()}
                </p>
                <p className="font-mono text-[9px] text-text-dim uppercase">
                  Clan XP
                </p>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Level Gids */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-purple mb-3">
          Level Gids
        </p>
        <div className="space-y-0">
          {LEVELS.map((level, idx) => {
            const isCurrent = level.name === currentUserLevelName
            const isNext = idx === currentLevelIdx + 1
            const isPast = idx < currentLevelIdx
            const xpToNext =
              isNext && currentUserXp !== undefined
                ? Math.max(0, level.minXp - currentUserXp)
                : null

            return (
              <div
                key={level.name}
                className="flex items-center gap-2.5 py-1.5 border-b border-border last:border-0"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    background: isCurrent
                      ? '#6B3FE0'
                      : isPast
                        ? '#22c55e'
                        : isNext
                          ? 'rgba(107,63,224,0.4)'
                          : '#3a3a48',
                  }}
                />
                <span
                  className="font-mono text-[10px] flex-1"
                  style={{
                    color: isCurrent
                      ? '#6B3FE0'
                      : isPast
                        ? '#9998aa'
                        : '#3a3a48',
                  }}
                >
                  {level.name}
                  {isCurrent && (
                    <span className="ml-1.5 text-[8px] opacity-60">← jij</span>
                  )}
                  {isNext && xpToNext !== null && (
                    <span className="ml-1.5 text-[8px] text-purple/50">
                      nog {xpToNext.toLocaleString()} XP
                    </span>
                  )}
                </span>
                <span
                  className="font-mono text-[9px] shrink-0"
                  style={{ color: isCurrent ? '#6B3FE0' : '#3a3a48' }}
                >
                  {level.minXp.toLocaleString()}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Achievements banner */}
      {stats.achievementsToday > 0 && (
        <div className="flex items-center gap-3 bg-success/5 border border-success/20 rounded-xl p-3">
          <div className="w-8 h-8 rounded-full bg-success/15 flex items-center justify-center shrink-0 font-mono text-sm text-success">
            ⬡
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold text-success">
              {stats.achievementsToday} badge{stats.achievementsToday > 1 ? 's' : ''} vandaag unlocked
            </p>
            <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
              Unlock badges via posts, clips, volgers en meer.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
