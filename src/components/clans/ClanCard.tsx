import Image from 'next/image'
import Link from 'next/link'

interface ClanCardProps {
  clan: {
    id: string
    name: string
    slug: string
    description?: string | null
    avatar_url?: string | null
    banner_url?: string | null
    is_open: boolean
    member_count: number
    max_members: number
    xp_total: number
    owner?: { username: string; avatar_url?: string | null } | null
  }
  rank?: number
  isMember?: boolean
}

export default function ClanCard({ clan, rank, isMember }: ClanCardProps) {
  return (
    <Link href={`/clans/${clan.slug}`}>
      <div className="relative bg-surface border border-border rounded-xl overflow-hidden hover:border-purple transition-colors duration-200 group">
        {/* Banner */}
        <div className="h-20 bg-void relative overflow-hidden">
          {clan.banner_url ? (
            <Image
              src={clan.banner_url}
              alt={clan.name}
              fill
              sizes="(max-width: 640px) 100vw, 400px"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: 'linear-gradient(135deg, #0e0e12 0%, rgba(107,63,224,0.2) 100%)' }}
            />
          )}

          {rank && (
            <div className="absolute top-2 left-2">
              <span
                className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-void/80"
                style={{
                  color:
                    rank === 1
                      ? '#00C8F0'
                      : rank === 2
                        ? '#9998aa'
                        : rank === 3
                          ? '#6B3FE0'
                          : '#3a3a48',
                }}
              >
                #{rank}
              </span>
            </div>
          )}

          {isMember && (
            <div className="absolute top-2 right-2">
              <span className="font-mono text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-purple/90 text-white">
                Lid
              </span>
            </div>
          )}
        </div>

        {/* Avatar + info */}
        <div className="px-4 pb-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-2 border-2 border-surface -mt-6 mb-3">
            {clan.avatar_url ? (
              <Image
                src={clan.avatar_url}
                alt={clan.name}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-purple/20">
                <span className="font-mono text-lg text-purple">
                  {clan.name[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <p className="font-mono text-sm font-bold text-text truncate mb-0.5 group-hover:text-purple transition-colors">
            {clan.name}
          </p>
          {clan.description && (
            <p className="text-text-dim text-xs line-clamp-2 mb-3">{clan.description}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-text-dim">
                {clan.member_count}/{clan.max_members}
              </span>
              <span
                className={`font-mono text-[9px] px-1.5 py-0.5 rounded-full ${
                  clan.is_open
                    ? 'bg-success/10 text-success'
                    : 'bg-surface-2 text-text-dim/60'
                }`}
              >
                {clan.is_open ? 'Open' : 'Gesloten'}
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-purple">
              {clan.xp_total.toLocaleString()} XP
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
