import Image from 'next/image'
import Link from 'next/link'

export interface GameCardData {
  id: string
  name: string
  slug: string
  cover_url?: string | null
  genre?: string[] | null
  platforms?: string[] | null
  player_count: number
  rank_set?: string | null
}

interface GameCardProps {
  game: GameCardData
  userRank?: string | null
  isInLibrary?: boolean
}

export default function GameCard({ game, userRank, isInLibrary }: GameCardProps) {
  return (
    <Link href={`/games/${game.slug}`}>
      <div className="relative bg-surface border border-border rounded-xl overflow-hidden hover:border-purple transition-colors duration-200 group">
        <div className="aspect-[3/4] bg-void relative overflow-hidden">
          {game.cover_url ? (
            <Image
              src={game.cover_url}
              alt={game.name}
              fill
              sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-mono text-4xl text-text-dim/60">⬡</span>
            </div>
          )}

          {isInLibrary && (
            <div className="absolute top-2 right-2">
              <div className="w-6 h-6 rounded-full bg-purple flex items-center justify-center">
                <span className="text-white text-[10px]">✓</span>
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-transparent opacity-80" />

          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="font-mono text-xs font-bold text-text truncate mb-1">
              {game.name}
            </p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] text-text-dim">
                {game.player_count.toLocaleString()} spelers
              </span>
              {userRank && (
                <span className="font-mono text-[9px] text-purple">
                  {userRank}
                </span>
              )}
            </div>
          </div>
        </div>

        {game.genre && game.genre.length > 0 && (
          <div className="px-3 py-2 flex flex-wrap gap-1">
            {game.genre.slice(0, 2).map(g => (
              <span key={g}
                className="font-mono text-[8px] px-1.5 py-0.5 rounded-full bg-surface-2 text-text-dim/60">
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
