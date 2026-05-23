'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-browser'
import { Gamepad2, Check, Plus, Loader2, Star } from 'lucide-react'
import { ScopeSpinner } from '@/components/ui/loader'
import { EmptyState } from '@/components/ui/empty-state'

type Game = {
  id: string
  name: string
  slug: string
  cover_url?: string | null
}

export default function GamesPage() {
  const supabase = createClient()
  const [games, setGames] = useState<Game[]>([])
  const [userGameIds, setUserGameIds] = useState<Set<string>>(new Set())
  const [mainGameId, setMainGameId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const [allGames, userGames] = await Promise.all([
      supabase.from('games').select('id, name, slug, cover_url').eq('is_approved', true).order('name'),
      supabase.from('user_games').select('game_id, is_main').eq('user_id', user.id),
    ])

    if (allGames.data) setGames(allGames.data as Game[])
    if (userGames.data) {
      setUserGameIds(new Set(userGames.data.map((ug) => ug.game_id)))
      const main = userGames.data.find((ug: { game_id: string; is_main: boolean }) => ug.is_main)
      setMainGameId(main?.game_id ?? null)
    }
    setLoading(false)
  }

  async function toggleGame(gameId: string) {
    if (!userId) return
    setSavingId(gameId)
    if (userGameIds.has(gameId)) {
      await supabase.from('user_games').delete().eq('user_id', userId).eq('game_id', gameId)
      const next = new Set(userGameIds)
      next.delete(gameId)
      setUserGameIds(next)
      if (mainGameId === gameId) setMainGameId(null)
    } else {
      const isFirst = userGameIds.size === 0
      await supabase.from('user_games').insert({ user_id: userId, game_id: gameId, is_main: isFirst })
      const next = new Set(userGameIds)
      next.add(gameId)
      setUserGameIds(next)
      if (isFirst) setMainGameId(gameId)
    }
    setSavingId(null)
  }

  async function setAsMain(gameId: string) {
    if (!userId || !userGameIds.has(gameId)) return
    setSavingId(gameId)
    await supabase.from('user_games').update({ is_main: false }).eq('user_id', userId)
    await supabase.from('user_games').update({ is_main: true }).eq('user_id', userId).eq('game_id', gameId)
    setMainGameId(gameId)
    setSavingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ScopeSpinner size={28} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Gamepad2 size={20} className="text-purple" />
          <h1 className="text-xl font-medium">Games</h1>
          {games.length > 0 && (
            <span className="vs-counter text-[10px] text-text-dim tabular-nums ml-1">
              {String(userGameIds.size).padStart(2, '0')} / {String(games.length).padStart(2, '0')}
            </span>
          )}
        </div>
        <p className="text-sm text-text-dim">
          Pick the games you play. Your main game gets pinned to your profile and feed.
        </p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className="vs-counter text-[10px] text-text-dim tabular-nums">
          {String(userGameIds.size).padStart(2, '0')} SELECTED
        </span>
        <span className="vs-counter text-[10px] text-text-dim tabular-nums">
          {String(games.length).padStart(2, '0')} AVAILABLE
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {games.map((game) => {
          const isAdded = userGameIds.has(game.id)
          const isMain = mainGameId === game.id
          const busy = savingId === game.id
          return (
            <div
              key={game.id}
              className={`vs-brackets relative bg-surface border rounded-xl p-4 transition-all ${
                isAdded
                  ? `vs-lit border-purple/30 bg-purple/[0.04] ${isMain ? 'shadow-[0_0_16px_rgba(107,63,224,0.18)]' : ''}`
                  : 'border-border hover:border-border-hover'
              }`}
            >
              {isMain && (
                <span className="vs-counter absolute -top-2 left-3 inline-flex items-center gap-1 text-[9px] tabular-nums bg-purple text-white px-2 py-0.5 rounded-full">
                  <Star size={9} fill="currentColor" /> MAIN
                </span>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-purple/20 to-cyan/20 border border-border flex items-center justify-center overflow-hidden shrink-0">
                  {game.cover_url ? (
                    <Image src={game.cover_url} alt="" fill sizes="40px" className="object-cover" />
                  ) : (
                    <Gamepad2 size={16} className="text-text-dim" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{game.name}</p>
                  <p className="text-[10px] text-text-dim">{game.slug}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleGame(game.id)}
                  disabled={busy}
                  className={`flex-1 vs-btn text-xs ${
                    isAdded ? 'vs-btn-ghost' : 'vs-btn-primary'
                  }`}
                >
                  {busy ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : isAdded ? (
                    <><Check size={12} /> Added</>
                  ) : (
                    <><Plus size={12} /> Add</>
                  )}
                </button>
                {isAdded && !isMain && (
                  <button
                    onClick={() => setAsMain(game.id)}
                    disabled={busy}
                    className="vs-btn vs-btn-ghost text-xs"
                    title="Set as main game"
                  >
                    <Star size={12} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {games.length === 0 && (
        <EmptyState
          icon={Gamepad2}
          title="No games available yet"
          description="Admins haven't added games to the catalog yet."
        />
      )}
    </div>
  )
}
