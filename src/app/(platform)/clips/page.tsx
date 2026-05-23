'use client'

import { useState, useEffect, useCallback } from 'react'
import ClipCard from '@/components/clips/ClipCard'
import ClipUploadModal from '@/components/clips/ClipUploadModal'
import ClipPlayer from '@/components/clips/ClipPlayer'
import type { ClipData } from '@/components/clips/ClipModal'

type SortOption = 'newest' | 'likes' | 'views'

interface Game { id: string; name: string }

const PAGE_SIZE = 20

export default function ClipsPage() {
  const [clips, setClips] = useState<ClipData[]>([])
  const [cotw, setCotw] = useState<ClipData | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [gameFilter, setGameFilter] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchClips = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        sort,
        page: String(page),
        ...(gameFilter ? { game_id: gameFilter } : {}),
      })
      const res = await fetch(`/api/clips?${params}`)
      const json = await res.json()
      setClips(json.data ?? [])
      setCotw(json.cotw ?? null)
      if (json.games) setGames(json.games)
      setTotal(json.pagination?.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [sort, page, gameFilter])

  useEffect(() => { fetchClips() }, [fetchClips])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-1">Community</p>
          <h1 className="font-mono text-3xl font-bold text-text mb-1">Clips</h1>
          <p className="text-text-dim text-sm">{total > 0 ? `${total.toLocaleString()} clips` : ''}</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="px-5 py-2.5 bg-purple text-white font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-purple/85 transition-colors"
        >
          + Clip
        </button>
      </div>

      {cotw && (
        <div className="mb-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-cyan uppercase mb-3">
            ★ Clip of the Week
          </p>
          <div className="bg-surface border border-cyan/30 rounded-2xl overflow-hidden">
            <div className="p-5">
              <ClipPlayer videoUrl={cotw.video_url} sourceType={cotw.source_type} title={cotw.title} />
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="font-mono text-base font-bold text-text mb-1">{cotw.title}</p>
                  <p className="font-mono text-xs text-text-dim">
                    {cotw.user?.display_name ?? cotw.user?.username}
                    {cotw.game && ` · ${cotw.game.name}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-cyan font-bold">♥ {cotw.like_count?.toLocaleString()}</p>
                  <p className="font-mono text-[10px] text-text-dim">{cotw.view_count?.toLocaleString()} views</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={gameFilter}
          onChange={e => { setGameFilter(e.target.value); setPage(1) }}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-text text-xs font-mono focus:outline-none focus:border-purple transition-colors"
        >
          <option value="">Alle games</option>
          {games.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
        </select>

        <div className="flex gap-1 bg-surface border border-border rounded-lg p-1">
          {(['newest', 'likes', 'views'] as SortOption[]).map(s => (
            <button
              key={s}
              onClick={() => { setSort(s); setPage(1) }}
              className={`px-3 py-1.5 rounded-md font-mono text-[10px] uppercase tracking-wider transition-colors duration-200 ${
                sort === s ? 'bg-purple text-white' : 'text-text-dim hover:text-text'
              }`}
            >
              {s === 'newest' ? 'Nieuwste' : s === 'likes' ? 'Likes' : 'Views'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-surface rounded-xl aspect-video" />
          ))}
        </div>
      ) : clips.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-mono text-[10px] tracking-[0.2em] text-text-dim/60 uppercase mb-3">Leeg</p>
          <p className="text-text-dim text-sm mb-6">Nog geen clips. Wees de eerste.</p>
          <button
            onClick={() => setShowUpload(true)}
            className="px-5 py-2.5 bg-purple text-white font-mono text-sm rounded-lg hover:bg-purple/85 transition-colors"
          >
            + Clip toevoegen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clips.map(clip => (<ClipCard key={clip.id} clip={clip} />))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-border text-text-dim font-mono text-xs rounded-lg hover:border-purple hover:text-text transition-colors duration-200 disabled:opacity-30"
          >
            ← Vorige
          </button>
          <span className="font-mono text-xs text-text-dim">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-border text-text-dim font-mono text-xs rounded-lg hover:border-purple hover:text-text transition-colors duration-200 disabled:opacity-30"
          >
            Volgende →
          </button>
        </div>
      )}

      {showUpload && (
        <ClipUploadModal
          games={games}
          onClose={() => setShowUpload(false)}
          onSuccess={fetchClips}
        />
      )}
    </div>
  )
}
