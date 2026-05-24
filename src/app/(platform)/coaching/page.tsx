'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import CoachCard, { type CoachCardData } from '@/components/coaching/CoachCard'
import CoachShareButton from '@/components/invites/CoachShareButton'
import { BrandSelect } from '@/components/ui/BrandSelect'

interface Game { id: string; name: string }

export default function CoachingPage() {
  const [coaches, setCoaches] = useState<CoachCardData[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [gameFilter, setGameFilter] = useState('')
  const [language, setLanguage] = useState('')
  const [sort, setSort] = useState('rating')

  const fetchCoaches = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        sort,
        ...(gameFilter ? { game_id: gameFilter } : {}),
        ...(language ? { language } : {}),
      })
      const res = await fetch(`/api/coaching?${params}`)
      const json = await res.json()
      setCoaches(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [sort, gameFilter, language])

  useEffect(() => {
    fetchCoaches()
    fetch('/api/games?sort=name').then(r => r.json()).then(j => {
      if (j.data) setGames(j.data)
    }).catch(() => {})
  }, [fetchCoaches])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-1">
            Coaching
          </p>
          <h1 className="font-mono text-3xl font-bold text-text mb-1">Coaches</h1>
          <p className="text-text-dim text-sm">Word beter met hulp van de beste spelers.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <CoachShareButton />
          <Link
            href="/coaching/apply"
            className="px-5 py-2.5 border border-border text-text-dim font-mono text-xs uppercase tracking-wider rounded-lg hover:border-purple hover:text-text transition-colors duration-200"
          >
            Word coach
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="min-w-[180px]">
          <BrandSelect
            value={gameFilter}
            onChange={setGameFilter}
            placeholder="Alle games"
            options={[
              { value: '', label: 'Alle games' },
              ...games.map(g => ({ value: g.id, label: g.name })),
            ]}
          />
        </div>

        <div className="min-w-[180px]">
          <BrandSelect
            value={language}
            onChange={setLanguage}
            placeholder="Alle talen"
            options={[
              { value: '', label: 'Alle talen' },
              { value: 'nl', label: 'Nederlands' },
              { value: 'en', label: 'English' },
            ]}
          />
        </div>

        <div className="flex gap-1 bg-surface border border-border rounded-lg p-1">
          {[
            { key: 'rating', label: 'Rating' },
            { key: 'sessions', label: 'Sessies' },
            { key: 'newest', label: 'Nieuw' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`px-3 py-1.5 rounded-md font-mono text-[10px] uppercase tracking-wider transition-colors duration-200 ${
                sort === s.key ? 'bg-purple text-white' : 'text-text-dim hover:text-text'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-surface rounded-xl h-64" />
          ))}
        </div>
      ) : coaches.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-mono text-[10px] tracking-[0.2em] text-text-dim/60 uppercase mb-3">
            Leeg
          </p>
          <p className="text-text-dim text-sm mb-6">Nog geen coaches beschikbaar.</p>
          <Link
            href="/coaching/apply"
            className="px-5 py-2.5 bg-purple text-white font-mono text-sm rounded-lg hover:bg-purple/85 transition-colors"
          >
            Word de eerste coach
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coaches.map(coach => <CoachCard key={coach.id} coach={coach} />)}
        </div>
      )}
    </div>
  )
}
