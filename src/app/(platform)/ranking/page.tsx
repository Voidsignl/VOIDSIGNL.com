'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import RankingRow from '@/components/ranking/RankingRow'
import RankingTabs from '@/components/ranking/RankingTabs'
import MyPositionBar from '@/components/ranking/MyPositionBar'
import GuestBlur from '@/components/ranking/GuestBlur'

const PAGE_SIZE = 50

type Tab = 'global' | 'clips' | 'coaching' | 'clans'

interface RankingUser {
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
  rank: number
}

interface MyPosition {
  rank: number
  xp: number
  level_name: string
  cotw_wins: number
}

export default function RankingPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('global')
  const [data, setData] = useState<RankingUser[]>([])
  const [myPosition, setMyPosition] = useState<MyPosition | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [isGuest, setIsGuest] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null)
    })
  }, [])

  const fetchRanking = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        tab,
        page: String(page),
        ...(search ? { q: search } : {}),
      })
      const res = await fetch(`/api/ranking?${params}`)
      const json = await res.json()

      setData(json.data ?? [])
      setMyPosition(json.myPosition ?? null)
      setIsGuest(json.isGuest ?? false)
      setTotal(json.pagination?.total ?? 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [tab, page, search])

  useEffect(() => {
    fetchRanking()
  }, [fetchRanking])

  // Debounce zoekfunctie
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-32">
      <div className="mb-8">
        <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-1">
          Leaderboard
        </p>
        <h1 className="font-mono text-3xl font-bold text-text mb-1">Ranking</h1>
        <p className="text-text-dim text-sm">
          {total > 0 ? `${total.toLocaleString()} members` : ''}
        </p>
      </div>

      <div className="mb-5">
        <RankingTabs active={tab} onChange={(t) => {
          setTab(t as Tab)
          setPage(1)
          setSearch('')
          setSearchInput('')
        }} />
      </div>

      {!isGuest && tab === 'global' && (
        <div className="mb-5">
          <input
            type="text"
            placeholder="Zoek een speler..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full bg-void border border-border rounded-lg px-4 py-3 text-text text-sm font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors"
          />
        </div>
      )}

      {isGuest && (
        <>
          <div className="space-y-2 mb-2">
            {data.map(user => (
              <RankingRow key={user.id} rank={user.rank} user={user} tab={tab} />
            ))}
          </div>
          <GuestBlur />
        </>
      )}

      {!isGuest && (
        <>
          {loading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="animate-pulse bg-surface rounded-xl h-20 w-full" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-mono text-[10px] tracking-[0.2em] text-text-dim/60 uppercase mb-3">
                Geen resultaten
              </p>
              <p className="text-text-dim text-sm">
                {search ? `Geen spelers gevonden voor "${search}"` : 'Nog niemand hier.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.map(user => (
                <RankingRow
                  key={user.id}
                  rank={user.rank}
                  user={user}
                  tab={tab}
                  isOwn={user.id === currentUserId}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && !search && (
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-border text-text-dim font-mono text-xs rounded-lg hover:border-purple hover:text-text transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Vorige
              </button>
              <span className="font-mono text-xs text-text-dim">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-border text-text-dim font-mono text-xs rounded-lg hover:border-purple hover:text-text transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Volgende →
              </button>
            </div>
          )}
        </>
      )}

      {myPosition && (
        <MyPositionBar
          rank={myPosition.rank}
          xp={myPosition.xp}
          levelName={myPosition.level_name}
          cotwWins={myPosition.cotw_wins}
        />
      )}
    </div>
  )
}
