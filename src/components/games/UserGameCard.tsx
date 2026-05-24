'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { X } from 'lucide-react'
import { BrandSelect } from '@/components/ui/BrandSelect'

const RANK_SETS: Record<string, string[]> = {
  valorant: ['Iron 1','Iron 2','Iron 3','Bronze 1','Bronze 2','Bronze 3','Silver 1','Silver 2','Silver 3','Gold 1','Gold 2','Gold 3','Platinum 1','Platinum 2','Platinum 3','Diamond 1','Diamond 2','Diamond 3','Ascendant 1','Ascendant 2','Ascendant 3','Immortal 1','Immortal 2','Immortal 3','Radiant'],
  cs2: ['Silver I','Silver II','Silver III','Silver IV','Silver Elite','Silver Elite Master','Gold Nova I','Gold Nova II','Gold Nova III','Gold Nova Master','Master Guardian I','Master Guardian II','Master Guardian Elite','Distinguished Master Guardian','Legendary Eagle','Legendary Eagle Master','Supreme Master First Class','The Global Elite'],
  fortnite: ['Bronze I','Bronze II','Bronze III','Silver I','Silver II','Silver III','Gold I','Gold II','Gold III','Platinum I','Platinum II','Platinum III','Diamond I','Diamond II','Diamond III','Elite','Champion','Unreal'],
  apex: ['Bronze IV','Bronze III','Bronze II','Bronze I','Silver IV','Silver III','Silver II','Silver I','Gold IV','Gold III','Gold II','Gold I','Platinum IV','Platinum III','Platinum II','Platinum I','Diamond IV','Diamond III','Diamond II','Diamond I','Master','Predator'],
  lol: ['Iron IV','Iron III','Iron II','Iron I','Bronze IV','Bronze III','Bronze II','Bronze I','Silver IV','Silver III','Silver II','Silver I','Gold IV','Gold III','Gold II','Gold I','Platinum IV','Platinum III','Platinum II','Platinum I','Emerald IV','Emerald III','Emerald II','Emerald I','Diamond IV','Diamond III','Diamond II','Diamond I','Master','Grandmaster','Challenger'],
  rocket_league: ['Bronze I','Bronze II','Bronze III','Silver I','Silver II','Silver III','Gold I','Gold II','Gold III','Platinum I','Platinum II','Platinum III','Diamond I','Diamond II','Diamond III','Champion I','Champion II','Champion III','Grand Champion I','Grand Champion II','Grand Champion III','Supersonic Legend'],
}

export interface UserGameCardData {
  id: string
  rank?: string | null
  is_main: boolean
  hours_played?: number | null
  game: {
    id: string
    name: string
    slug: string
    cover_url?: string | null
    rank_set?: string | null
    custom_ranks?: string[] | null
  }
}

interface UserGameCardProps {
  userGame: UserGameCardData
  onRemove?: (gameId: string) => void
  onUpdateRank?: (gameId: string, rank: string) => void
  isOwnProfile?: boolean
}

export default function UserGameCard({ userGame, onRemove, onUpdateRank, isOwnProfile }: UserGameCardProps) {
  const [editing, setEditing] = useState(false)
  const [rank, setRank] = useState(userGame.rank ?? '')
  const { game } = userGame

  const rankOptions = game.rank_set && game.rank_set !== 'none'
    ? (game.rank_set === 'custom'
        ? (game.custom_ranks ?? [])
        : (RANK_SETS[game.rank_set] ?? []))
    : []

  function handleRankSave() {
    onUpdateRank?.(game.id, rank)
    setEditing(false)
  }

  return (
    <div className={`relative bg-surface border rounded-xl overflow-hidden transition-colors duration-200 ${
      userGame.is_main ? 'border-purple' : 'border-border hover:border-purple/40'
    }`}>
      {userGame.is_main && (
        <div className="absolute top-2 left-2 z-10">
          <span className="font-mono text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-purple text-white">
            Main
          </span>
        </div>
      )}

      <Link href={`/games/${game.slug}`}>
        <div className="aspect-[3/4] bg-void relative overflow-hidden">
          {game.cover_url ? (
            <Image src={game.cover_url} alt={game.name}
              fill sizes="(max-width: 640px) 33vw, 25vw" className="object-cover hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-text-dim/60 text-4xl">⬡</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-transparent opacity-80" />
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <p className="font-mono text-xs font-bold text-text truncate">{game.name}</p>
          </div>
        </div>
      </Link>

      <div className="p-3">
        {editing && rankOptions.length > 0 ? (
          <div className="space-y-2">
            <BrandSelect
              value={rank}
              onChange={setRank}
              size="sm"
              placeholder="Rank selecteren"
              options={[
                { value: '', label: 'Rank selecteren' },
                ...rankOptions.map(r => ({ value: r, label: r })),
              ]}
            />
            <div className="flex gap-1">
              <button onClick={handleRankSave}
                className="flex-1 py-1 bg-purple text-white font-mono text-[10px] rounded hover:bg-purple/85 transition-colors">
                ✓
              </button>
              <button onClick={() => setEditing(false)}
                className="flex-1 py-1 border border-border text-text-dim font-mono text-[10px] rounded hover:border-purple transition-colors duration-200">
                ✕
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <button
              onClick={() => isOwnProfile && setEditing(true)}
              className={`font-mono text-xs transition-colors ${
                userGame.rank
                  ? 'text-purple hover:text-text'
                  : 'text-text-dim/60 hover:text-text-dim'
              } ${isOwnProfile ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {userGame.rank ?? (isOwnProfile ? '+ Rank' : '—')}
            </button>
            {isOwnProfile && (
              <button
                onClick={() => onRemove?.(game.id)}
                className="text-text-dim/60 hover:text-danger transition-colors"
              >
                <X size={11} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
