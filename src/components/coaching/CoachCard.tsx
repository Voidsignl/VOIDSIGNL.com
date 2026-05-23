import Image from 'next/image'
import Link from 'next/link'

const TIER_LABELS: Record<string, { label: string; price: string }> = {
  basic: { label: 'Basic', price: '€10' },
  standard: { label: 'Standard', price: '€25' },
  premium: { label: 'Premium', price: '€50' },
}

export interface CoachCardData {
  id: string
  bio: string
  specializations: string[]
  languages: string[]
  hourly_tier: string
  avg_rating: number
  review_count: number
  total_sessions: number
  user: {
    id: string
    username: string
    display_name?: string | null
    avatar_url?: string | null
    accent_color?: string | null
    is_verified?: boolean
    level_name?: string
  } | null
  games: { game: { id: string; name: string } }[]
}

export default function CoachCard({ coach }: { coach: CoachCardData }) {
  if (!coach.user) return null

  const accentColor = coach.user.accent_color ?? '#6B3FE0'
  const tier = TIER_LABELS[coach.hourly_tier] ?? TIER_LABELS.basic

  return (
    <Link href={`/coaching/${coach.user.username}`}>
      <div className="bg-surface border border-border rounded-xl overflow-hidden hover:border-purple transition-colors duration-200 group">
        <div className="h-1.5 w-full" style={{ background: accentColor }} />

        <div className="p-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="relative w-14 h-14 rounded-full overflow-hidden bg-surface-2 border-2 flex-shrink-0"
              style={{ borderColor: accentColor }}>
              {coach.user.avatar_url ? (
                <Image src={coach.user.avatar_url} alt={coach.user.username} fill sizes="56px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-mono text-lg text-text-dim">
                    {coach.user.username?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-mono text-sm font-bold text-text truncate group-hover:text-purple transition-colors">
                  {coach.user.display_name ?? coach.user.username}
                </p>
                {coach.user.is_verified && <span className="text-cyan text-xs flex-shrink-0">✓</span>}
              </div>
              <p className="font-mono text-[10px] text-text-dim">{coach.user.level_name}</p>

              <div className="flex items-center gap-2 mt-1">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <span key={i} className="text-xs"
                      style={{ color: i <= Math.round(coach.avg_rating ?? 0) ? '#f59e0b' : '#3a3a48' }}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="font-mono text-[10px] text-text-dim">
                  {coach.avg_rating > 0 ? coach.avg_rating.toFixed(1) : 'Nieuw'}
                  {coach.review_count > 0 && ` (${coach.review_count})`}
                </span>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="font-mono text-lg font-bold" style={{ color: accentColor }}>
                {tier.price}
              </p>
              <p className="font-mono text-[9px] text-text-dim">{tier.label}</p>
            </div>
          </div>

          <p className="text-text-dim text-xs leading-relaxed mb-4 line-clamp-2">{coach.bio}</p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {coach.games?.slice(0, 3).map((cg, idx) => (
              <span key={cg.game?.id ?? idx}
                className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-surface-2 text-text-dim">
                {cg.game?.name}
              </span>
            ))}
            {coach.games?.length > 3 && (
              <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-surface-2 text-text-dim/60">
                +{coach.games.length - 3}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              {coach.languages?.map(l => (
                <span key={l} className="font-mono text-[9px] text-text-dim/60 uppercase">{l}</span>
              ))}
            </div>
            <span className="font-mono text-[10px] text-text-dim">
              {coach.total_sessions} sessies
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
