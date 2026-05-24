'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  Users,
  Trophy,
  Video,
  MessageSquare,
  GraduationCap,
  Plus,
  Check,
  Loader2,
} from 'lucide-react'
import { BrandSelect } from '@/components/ui/BrandSelect'
import GameOverviewTab from '@/components/games/tabs/GameOverviewTab'
import GamePlayersTab from '@/components/games/tabs/GamePlayersTab'
import GameClipsTab from '@/components/games/tabs/GameClipsTab'
import GameForumTab from '@/components/games/tabs/GameForumTab'
import GameCoachesTab from '@/components/games/tabs/GameCoachesTab'

type Tab = 'overview' | 'players' | 'clips' | 'forum' | 'coaches'

interface GameRow {
  id: string
  name: string
  slug: string
  cover_url: string | null
  description: string | null
  genre: string[] | null
  platforms: string[] | null
  release_year: number | null
  player_count: number
  rank_set: string | null
}

interface UserGame {
  id: string
  rank: string | null
  is_main: boolean
  hours_played: number | null
}

interface Stats {
  players: number
  clips: number
  coaches: number
  threads: number
}

interface ApiResponse {
  game: GameRow
  userGame: UserGame | null
  stats: Stats
  forumCategory: { id: string; name: string; slug: string; thread_count: number } | null
  tab: Tab
  topPlayers?: unknown[]
  lfgPlayers?: unknown[]
  clans?: unknown[]
  recentPosts?: unknown[]
  players?: unknown[]
  clips?: unknown[]
  threads?: unknown[]
  coaches?: unknown[]
  category?: { id: string; name: string; slug: string; thread_count: number } | null
  pagination?: { page: number; total: number; pageSize: number }
}

const RANK_SETS: Record<string, string[]> = {
  valorant: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'],
  league: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'],
  cs2: ['Silver', 'Gold Nova', 'Master Guardian', 'DMG', 'LE', 'LEM', 'Supreme', 'Global Elite'],
  overwatch: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Top 500'],
  apex: ['Rookie', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Predator'],
  rocketleague: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Champion', 'Grand Champion', 'Supersonic Legend'],
  fortnite: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite', 'Champion', 'Unreal'],
}

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'overview', label: 'Overzicht', icon: Trophy },
  { id: 'players', label: 'Spelers', icon: Users },
  { id: 'clips', label: 'Clips', icon: Video },
  { id: 'forum', label: 'Forum', icon: MessageSquare },
  { id: 'coaches', label: 'Coaches', icon: GraduationCap },
]

export default function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [rankUpdating, setRankUpdating] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/games/${slug}?tab=${activeTab}&page=${page}`)
      if (res.status === 404) {
        setError('Game niet gevonden')
        return
      }
      if (!res.ok) {
        setError('Kon game niet laden')
        return
      }
      const json = (await res.json()) as ApiResponse
      setData(json)
    } catch {
      setError('Netwerkfout')
    } finally {
      setLoading(false)
    }
  }, [slug, activeTab, page])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    setPage(1)
  }

  const handleAddToLibrary = async () => {
    if (!data) return
    setLibraryLoading(true)
    try {
      const res = await fetch('/api/games/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: data.game.id }),
      })
      if (res.ok) await fetchData()
    } finally {
      setLibraryLoading(false)
    }
  }

  const handleRemoveFromLibrary = async () => {
    if (!data?.userGame) return
    setLibraryLoading(true)
    try {
      const res = await fetch(`/api/games/library?game_id=${data.game.id}`, {
        method: 'DELETE',
      })
      if (res.ok) await fetchData()
    } finally {
      setLibraryLoading(false)
    }
  }

  const handleRankChange = async (newRank: string) => {
    if (!data?.userGame) return
    setRankUpdating(true)
    try {
      const res = await fetch('/api/games/library', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: data.game.id, rank: newRank || null }),
      })
      if (res.ok) await fetchData()
    } finally {
      setRankUpdating(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="text-purple animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="font-mono text-sm text-danger">{error ?? 'Onbekende fout'}</p>
        <Link
          href="/games"
          className="inline-block mt-4 font-mono text-[10px] uppercase tracking-widest text-purple hover:underline"
        >
          ← Terug naar games
        </Link>
      </div>
    )
  }

  const { game, userGame, stats, forumCategory } = data
  const inLibrary = !!userGame
  const rankOptions = game.rank_set && RANK_SETS[game.rank_set] ? RANK_SETS[game.rank_set] : null

  const statBlocks = [
    { value: stats.players, label: 'Spelers', icon: Users },
    { value: stats.clips, label: 'Clips', icon: Video },
    { value: stats.threads, label: 'Threads', icon: MessageSquare },
    { value: stats.coaches, label: 'Coaches', icon: GraduationCap },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Back nav */}
      <button
        onClick={() => router.push('/games')}
        className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-text-muted hover:text-text transition-colors duration-200 mb-4"
      >
        <ArrowLeft size={12} />
        Alle games
      </button>

      {/* Hero met blurred cover */}
      <div className="relative bg-surface border border-border rounded-2xl overflow-hidden mb-6">
        {/* Blurred background */}
        {game.cover_url && (
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={game.cover_url}
              alt=""
              fill
              sizes="100vw"
              className="object-cover blur-3xl opacity-25 scale-110"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-surface/40 via-surface/70 to-surface" />
          </div>
        )}

        <div className="relative flex flex-col md:flex-row gap-6 p-6 md:p-8">
          {/* Cover */}
          <div className="relative w-40 h-56 md:w-44 md:h-60 rounded-xl overflow-hidden bg-void border border-border shrink-0 mx-auto md:mx-0">
            {game.cover_url ? (
              <Image
                src={game.cover_url}
                alt={game.name}
                fill
                sizes="(max-width: 768px) 160px, 176px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-text-dim/60 text-5xl">⬡</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-center md:text-left">
            {game.genre && game.genre.length > 0 && (
              <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-2">
                {game.genre.join(' · ')}
              </p>
            )}

            <h1 className="font-mono text-3xl md:text-4xl font-bold text-text mb-3 break-words">
              {game.name}
            </h1>

            <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start mb-3">
              <span className="font-mono text-xs text-text-muted">
                {game.player_count?.toLocaleString() ?? 0} spelers
              </span>
              {game.release_year && (
                <span className="font-mono text-xs text-text-dim">{game.release_year}</span>
              )}
            </div>

            {game.platforms && game.platforms.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center md:justify-start mb-4">
                {game.platforms.map((p) => (
                  <span
                    key={p}
                    className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-void/60 border border-border text-text-muted"
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}

            {game.description && (
              <p className="text-sm text-text-muted leading-relaxed line-clamp-3 mb-5 max-w-2xl">
                {game.description}
              </p>
            )}

            {/* Library + Rank */}
            <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
              {inLibrary ? (
                <>
                  <button
                    onClick={handleRemoveFromLibrary}
                    disabled={libraryLoading}
                    className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest px-4 py-2 rounded-lg bg-success/15 border border-success/30 text-success hover:bg-success/25 transition-colors duration-200 disabled:opacity-50"
                  >
                    {libraryLoading ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Check size={12} />
                    )}
                    In bibliotheek
                  </button>

                  {rankOptions && (
                    <div className="min-w-[180px]">
                      <BrandSelect
                        value={userGame?.rank ?? ''}
                        onChange={handleRankChange}
                        disabled={rankUpdating}
                        size="sm"
                        placeholder="Kies je rank"
                        options={[
                          { value: '', label: 'Geen rank' },
                          ...rankOptions.map((r) => ({ value: r, label: r })),
                        ]}
                      />
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={handleAddToLibrary}
                  disabled={libraryLoading}
                  className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest px-4 py-2 rounded-lg bg-purple text-white hover:bg-purple/90 transition-colors duration-200 disabled:opacity-50"
                >
                  {libraryLoading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Plus size={12} />
                  )}
                  Voeg toe aan bibliotheek
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
          {statBlocks.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.label}
                className="bg-surface px-4 py-3 flex items-center gap-3"
              >
                <Icon size={16} className="text-purple shrink-0" />
                <div>
                  <p className="font-mono text-lg font-bold text-text leading-none">
                    {s.value.toLocaleString()}
                  </p>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted mt-1">
                    {s.label}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tab nav */}
      <div className="border-b border-border mb-6 -mx-4 px-4 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => {
            const Icon = t.icon
            const isActive = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={`flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest px-4 py-3 border-b-2 transition-colors duration-200 ${
                  isActive
                    ? 'border-purple text-purple'
                    : 'border-transparent text-text-muted hover:text-text'
                }`}
              >
                <Icon size={12} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="text-purple animate-spin" />
          </div>
        )}

        {!loading && activeTab === 'overview' && (
          <GameOverviewTab
            gameId={game.id}
            gameName={game.name}
            topPlayers={(data.topPlayers as never) ?? []}
            lfgPlayers={(data.lfgPlayers as never) ?? []}
            clans={(data.clans as never) ?? []}
            recentPosts={(data.recentPosts as never) ?? []}
            forumCategory={forumCategory ?? null}
            onTabChange={handleTabChange}
          />
        )}

        {!loading && activeTab === 'players' && data.pagination && (
          <GamePlayersTab
            players={(data.players as never) ?? []}
            pagination={data.pagination}
            onPageChange={setPage}
          />
        )}

        {!loading && activeTab === 'clips' && data.pagination && (
          <GameClipsTab
            clips={(data.clips as never) ?? []}
            pagination={data.pagination}
            onPageChange={setPage}
          />
        )}

        {!loading && activeTab === 'forum' && data.pagination && (
          <GameForumTab
            category={data.category ?? null}
            threads={(data.threads as never) ?? []}
            pagination={data.pagination}
            onPageChange={setPage}
          />
        )}

        {!loading && activeTab === 'coaches' && (
          <GameCoachesTab
            coaches={(data.coaches as never) ?? []}
            gameName={game.name}
          />
        )}
      </div>
    </div>
  )
}
