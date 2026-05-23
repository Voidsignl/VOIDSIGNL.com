import Image from 'next/image'
import Link from 'next/link'

interface ClanWarCardProps {
  war: {
    id: string
    status: string
    challenger_score: number
    challenged_score: number
    ends_at?: string | null
    challenger: { id: string; name: string; slug: string; avatar_url?: string | null }
    challenged: { id: string; name: string; slug: string; avatar_url?: string | null }
  }
  myClanId: string
}

export default function ClanWarCard({ war, myClanId }: ClanWarCardProps) {
  const isChallenger = war.challenger.id === myClanId
  const myClan = isChallenger ? war.challenger : war.challenged
  const enemyClan = isChallenger ? war.challenged : war.challenger
  const myScore = isChallenger ? war.challenger_score : war.challenged_score
  const enemyScore = isChallenger ? war.challenged_score : war.challenger_score

  const endsAt = war.ends_at ? new Date(war.ends_at) : null
  const daysLeft = endsAt
    ? Math.ceil((endsAt.getTime() - Date.now()) / 86400000)
    : null
  const isWinning = myScore > enemyScore
  const isTied = myScore === enemyScore

  return (
    <div
      className={`rounded-xl border p-5 ${
        isWinning
          ? 'bg-purple/8 border-purple/40'
          : 'bg-surface border-border'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase">Clan War</p>
        {daysLeft !== null && (
          <span className="font-mono text-[10px] text-text-dim">
            {daysLeft > 0 ? `${daysLeft} dagen resterend` : 'Afgelopen'}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Eigen clan */}
        <div className="text-center flex-1">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-2 mx-auto mb-2">
            {myClan.avatar_url ? (
              <Image
                src={myClan.avatar_url}
                alt={myClan.name}
                width={48}
                height={48}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-purple/20">
                <span className="font-mono text-lg text-purple">
                  {myClan.name[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <p className="font-mono text-xs font-bold text-text truncate">{myClan.name}</p>
          <p
            className="font-mono text-2xl font-bold mt-1"
            style={{ color: isWinning ? '#22c55e' : isTied ? '#9998aa' : '#ef4444' }}
          >
            {myScore}
          </p>
        </div>

        {/* VS */}
        <div className="text-center flex-shrink-0">
          <p className="font-mono text-sm text-text-dim/60 font-bold">VS</p>
        </div>

        {/* Tegenstander */}
        <div className="text-center flex-1">
          <Link href={`/clans/${enemyClan.slug}`}>
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-2 mx-auto mb-2">
              {enemyClan.avatar_url ? (
                <Image
                  src={enemyClan.avatar_url}
                  alt={enemyClan.name}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface-2">
                  <span className="font-mono text-lg text-text-dim">
                    {enemyClan.name[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </Link>
          <p className="font-mono text-xs font-bold text-text-dim truncate">{enemyClan.name}</p>
          <p className="font-mono text-2xl font-bold text-text-dim mt-1">{enemyScore}</p>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p
          className={`font-mono text-xs ${
            isWinning ? 'text-success' : isTied ? 'text-text-dim' : 'text-danger'
          }`}
        >
          {isWinning ? '↑ Jullie leiden' : isTied ? 'Gelijkspel' : '↓ Achterstand'}
        </p>
      </div>
    </div>
  )
}
