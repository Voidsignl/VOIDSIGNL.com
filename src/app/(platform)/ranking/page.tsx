'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import RankingRow, { type RankingRowUser } from '@/components/ranking/RankingRow'
import RankingTabs from '@/components/ranking/RankingTabs'
import MyPositionBar from '@/components/ranking/MyPositionBar'
import RankingSidebar, {
  type RankingSidebarStats,
  type RankingSidebarTopClip,
  type RankingSidebarTopClan,
} from '@/components/ranking/RankingSidebar'
import GuestBlur from '@/components/ranking/GuestBlur'

const PAGE_SIZE = 50

type Tab = 'global' | 'clips' | 'coaching' | 'clans'

interface CurrentUser {
  id: string
  username: string
  xp: number
  level_name: string
}

interface SidebarData {
  topClip: RankingSidebarTopClip | null
  topClan: RankingSidebarTopClan | null
  stats: RankingSidebarStats
}

export default function RankingPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('global')
  const [rows, setRows] = useState<RankingRowUser[]>([])
  const [sidebar, setSidebar] = useState<SidebarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [isGuest, setIsGuest] = useState(false)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, xp, level_name')
        .eq('id', data.user.id)
        .maybeSingle()
      if (profile) setCurrentUser(profile as CurrentUser)
    })
  }, [supabase])

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

      setRows((json.data ?? []) as RankingRowUser[])
      setSidebar((json.sidebar as SidebarData | null) ?? null)
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

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const maxXp = rows[0]?.xp ?? 1

  // Eigen positie + naar-volgende-rank info
  const myRowIdx = currentUser
    ? rows.findIndex((r) => r.id === currentUser.id)
    : -1
  const myRank = myRowIdx >= 0 ? (page - 1) * PAGE_SIZE + myRowIdx + 1 : null
  const myRow = myRowIdx >= 0 ? rows[myRowIdx] : null
  const nextRankXp =
    myRank && myRank > 1 ? (rows[myRowIdx - 1]?.xp ?? null) : null

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header — full width zodat tabs + sidebar exact aligned starten */}
      <div className="mb-6">
        <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-1">
          Leaderboard
        </p>
        <h1 className="font-mono text-3xl font-bold text-text mb-1">Ranking</h1>
        <p className="text-text-dim text-sm">
          {total > 0 ? `${total.toLocaleString()} members` : ''}
        </p>
      </div>

      <div className="flex gap-5">
        {/* LEFT — Ranking */}
        <div className="flex-1 min-w-0">
          <div className="mb-4">
          <RankingTabs
            active={tab}
            onChange={(t) => {
              setTab(t as Tab)
              setPage(1)
              setSearch('')
              setSearchInput('')
            }}
          />
        </div>

        {!isGuest && tab === 'global' && (
          <input
            type="text"
            placeholder="Zoek een speler..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-void border border-border rounded-xl px-4 py-3 text-text text-sm font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-[border-color] duration-200 mb-4"
          />
        )}

        {isGuest && (
          <>
            <div className="bg-surface border border-border rounded-xl overflow-hidden mb-2">
              {rows.map((u) => (
                <RankingRow
                  key={u.id}
                  rank={u.rank ?? 0}
                  user={u}
                  maxXp={maxXp}
                />
              ))}
            </div>
            <GuestBlur />
          </>
        )}

        {!isGuest && (
          <>
            {loading ? (
              <div className="bg-surface border border-border rounded-xl overflow-hidden mb-3">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 border-b border-border animate-pulse"
                  >
                    <div className="w-7 h-3 bg-surface-2 rounded" />
                    <div className="w-9 h-9 rounded-full bg-surface-2" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-32 bg-surface-2 rounded" />
                      <div className="h-2 w-48 bg-surface-2 rounded" />
                    </div>
                    <div className="h-4 w-12 bg-surface-2 rounded" />
                  </div>
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="bg-surface border border-border rounded-xl flex flex-col items-center justify-center py-16 text-center">
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-dim mb-2">
                  Geen resultaten
                </p>
                <p className="text-text-dim text-sm">
                  {search ? `Geen spelers gevonden voor "${search}"` : 'Nog niemand hier.'}
                </p>
              </div>
            ) : (
              <div className="bg-surface border border-border rounded-xl overflow-hidden mb-3">
                {rows.map((u, idx) => {
                  const absoluteRank = search
                    ? idx + 1
                    : u.rank ?? (page - 1) * PAGE_SIZE + idx + 1
                  return (
                    <RankingRow
                      key={u.id}
                      rank={absoluteRank}
                      user={u}
                      isOwn={u.id === currentUser?.id}
                      maxXp={maxXp}
                    />
                  )
                })}
              </div>
            )}

            {totalPages > 1 && !search && (
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-border text-text-dim font-mono text-xs rounded-lg hover:border-purple hover:text-text transition-[border-color,color] duration-200 disabled:opacity-30"
                >
                  ← Vorige
                </button>
                <span className="font-mono text-xs text-text-dim">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-border text-text-dim font-mono text-xs rounded-lg hover:border-purple hover:text-text transition-[border-color,color] duration-200 disabled:opacity-30"
                >
                  Volgende →
                </button>
              </div>
            )}
          </>
        )}

          {/* Mijn positie balk */}
          {currentUser && myRank && myRow && (
            <MyPositionBar
              rank={myRank}
              totalRanks={total}
              user={{
                username: currentUser.username,
                level_name: myRow.level_name ?? currentUser.level_name,
                xp: myRow.xp ?? currentUser.xp,
                achievement_count: myRow.achievement_count,
              }}
              nextRankXp={nextRankXp}
            />
          )}
        </div>

        {/* RIGHT — Sidebar (alleen desktop) */}
        {!isGuest && sidebar && (
          <aside className="hidden lg:block w-64 shrink-0">
            <RankingSidebar
              stats={sidebar.stats}
              topClip={sidebar.topClip}
              topClan={sidebar.topClan}
              currentUserLevelName={currentUser?.level_name}
              currentUserXp={currentUser?.xp}
            />
          </aside>
        )}
      </div>
    </div>
  )
}
