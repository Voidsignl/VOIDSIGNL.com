'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'

interface IGDBResult {
  igdb_id: number
  name: string
  cover_url: string | null
  description: string | null
  genre: string[]
  platforms: string[]
  release_year: number | null
}

interface GameSearchModalProps {
  onSelect: (game: { id: string } & IGDBResult) => void
  onClose: () => void
}

export default function GameSearchModal({ onSelect, onClose }: GameSearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<IGDBResult[]>([])
  const [loading, setLoading] = useState(false)
  const [requesting, setRequesting] = useState<number | string | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualDesc, setManualDesc] = useState('')
  const [manualYear, setManualYear] = useState('')
  const [manualError, setManualError] = useState('')

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/games/search?q=${encodeURIComponent(query)}`)
        const json = await res.json()
        setResults(json.data ?? [])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  async function handleRequest(game: IGDBResult) {
    setRequesting(game.igdb_id)
    try {
      const res = await fetch('/api/games/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(game),
      })
      const json = await res.json()

      if (res.status === 409 && json.game_id) {
        onSelect({ id: json.game_id, ...game })
        onClose()
      } else if (res.ok) {
        alert(`${game.name} aangevraagd. Een admin keurt dit goed.`)
        onClose()
      } else {
        alert(json.error ?? 'Aanvraag mislukt')
      }
    } finally {
      setRequesting(null)
    }
  }

  async function handleManualRequest() {
    setManualError('')
    if (manualName.trim().length < 2) {
      setManualError('Naam moet minstens 2 tekens zijn.')
      return
    }
    setRequesting('manual')
    try {
      const yearNum = manualYear ? parseInt(manualYear, 10) : null
      const payload = {
        name: manualName.trim(),
        description: manualDesc.trim() || null,
        release_year: yearNum && yearNum >= 1970 && yearNum <= 2030 ? yearNum : null,
        genre: [],
        platforms: [],
        cover_url: null,
      }
      const res = await fetch('/api/games/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (res.ok) {
        alert(`${payload.name} aangevraagd. Een admin keurt dit goed.`)
        onClose()
      } else {
        setManualError(json.error ?? 'Aanvraag mislukt')
      }
    } finally {
      setRequesting(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-void/95" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-0.5">Games</p>
            <h2 className="font-mono text-lg font-bold text-text">Game toevoegen</h2>
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-text transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-border">
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setManualOpen(false) }}
            placeholder="Zoek een game... (bijv. Valorant, CS2)"
            autoFocus
            className="w-full bg-void border border-border rounded-lg px-4 py-3 text-text text-sm font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors"
          />
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-12 h-16 bg-surface-2 rounded" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 w-32 bg-surface-2 rounded" />
                    <div className="h-2 w-20 bg-surface-2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {results.map(game => (
                <div key={game.igdb_id}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-surface-2 transition-colors border-b border-border last:border-0">
                  <div className="relative w-12 h-16 rounded overflow-hidden bg-void flex-shrink-0">
                    {game.cover_url ? (
                      <Image src={game.cover_url} alt={game.name}
                        fill sizes="48px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-text-dim/60 text-xl">⬡</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-bold text-text truncate mb-0.5">
                      {game.name}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {game.release_year && (
                        <span className="font-mono text-[10px] text-text-dim">{game.release_year}</span>
                      )}
                      {game.genre?.slice(0, 2).map(g => (
                        <span key={g} className="font-mono text-[9px] text-text-dim/60">{g}</span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRequest(game)}
                    disabled={requesting === game.igdb_id}
                    className="px-3 py-1.5 bg-purple text-white font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-purple/85 transition-colors duration-200 disabled:opacity-40 flex-shrink-0"
                  >
                    {requesting === game.igdb_id ? '...' : '+ Aanvragen'}
                  </button>
                </div>
              ))}

              {results.length === 0 && query.length >= 2 && !loading && (
                <div className="p-6 text-center">
                  <p className="text-text-dim font-mono text-xs mb-3">
                    Geen IGDB-resultaten voor &ldquo;{query}&rdquo;
                  </p>
                </div>
              )}

              {query.length === 0 && !manualOpen && (
                <div className="p-6 text-center">
                  <p className="text-text-dim/60 font-mono text-xs">
                    Typ een game naam om te zoeken via IGDB
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Manual aanvraag flow */}
        <div className="border-t border-border">
          {!manualOpen ? (
            <button
              onClick={() => {
                setManualOpen(true)
                if (query && !manualName) setManualName(query)
              }}
              className="w-full px-5 py-3 text-left font-mono text-xs text-text-dim hover:text-text hover:bg-surface-2 transition-colors duration-200 flex items-center justify-between"
            >
              <span>Game niet gevonden? Vraag handmatig aan.</span>
              <span className="text-purple">→</span>
            </button>
          ) : (
            <div className="p-5 space-y-3 bg-surface-2/50">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-purple">
                  Handmatige aanvraag
                </p>
                <button
                  onClick={() => setManualOpen(false)}
                  className="text-text-dim hover:text-text transition-colors font-mono text-xs"
                >
                  Annuleer
                </button>
              </div>

              <input
                type="text"
                value={manualName}
                onChange={e => setManualName(e.target.value)}
                placeholder="Game naam *"
                maxLength={100}
                required
                className="w-full bg-void border border-border rounded-lg px-3 py-2.5 text-text text-sm font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors"
              />

              <textarea
                value={manualDesc}
                onChange={e => setManualDesc(e.target.value)}
                placeholder="Korte beschrijving (optioneel)"
                rows={2}
                maxLength={2000}
                className="w-full bg-void border border-border rounded-lg px-3 py-2.5 text-text text-sm font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors resize-none"
              />

              <input
                type="number"
                value={manualYear}
                onChange={e => setManualYear(e.target.value)}
                placeholder="Releasejaar (optioneel)"
                min={1970}
                max={2030}
                className="w-full bg-void border border-border rounded-lg px-3 py-2.5 text-text text-sm font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors"
              />

              {manualError && (
                <p className="font-mono text-xs text-danger">{manualError}</p>
              )}

              <button
                onClick={handleManualRequest}
                disabled={requesting === 'manual'}
                className="w-full py-2.5 bg-purple text-white font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-purple/85 transition-colors duration-200 disabled:opacity-40"
              >
                {requesting === 'manual' ? 'Bezig...' : '+ Aanvraag indienen'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
