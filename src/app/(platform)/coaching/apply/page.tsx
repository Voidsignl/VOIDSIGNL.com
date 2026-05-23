'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const SPECIALIZATIONS = [
  'Aim training', 'Game sense', 'Rank climb', 'Mental coaching',
  'Team play', 'VOD review', 'Mechanics', 'Strategy', 'Communication',
]

interface Game { id: string; name: string }

export default function CoachApplyPage() {
  const router = useRouter()
  const [games, setGames] = useState<Game[]>([])
  const [bio, setBio] = useState('')
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([])
  const [selectedGames, setSelectedGames] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>(['nl'])
  const [discordHandle, setDiscordHandle] = useState('')
  const [tier, setTier] = useState('standard')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/buddy/search').then(r => r.json()).then(j => {
      if (j.games) setGames(j.games)
    }).catch(() => {})
  }, [])

  function toggleItem(arr: string[], setArr: (v: string[]) => void, item: string) {
    setArr(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (bio.length < 50) { setError('Bio moet minimaal 50 tekens zijn.'); return }
    if (selectedSpecs.length === 0) { setError('Kies minimaal 1 specialisatie.'); return }
    if (selectedGames.length === 0) { setError('Kies minimaal 1 game.'); return }
    if (!discordHandle.trim()) { setError('Discord handle is verplicht.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/coaching/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio,
          specializations: selectedSpecs,
          languages,
          discord_handle: discordHandle,
          hourly_tier: tier,
          game_ids: selectedGames,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Indienen mislukt')
      setSuccess(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Er ging iets mis.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.2em] text-success uppercase mb-4">
          Aanvraag ingediend
        </p>
        <h1 className="font-mono text-2xl font-bold text-text mb-3">
          We nemen je aanvraag door.
        </h1>
        <p className="text-text-dim text-sm mb-8 leading-relaxed">
          Een admin beoordeelt je aanvraag. Je krijgt een notificatie zodra je goedgekeurd bent.
        </p>
        <button
          onClick={() => router.push('/coaching')}
          className="px-6 py-3 bg-purple text-white font-mono text-sm rounded-lg hover:bg-purple/85 transition-colors"
        >
          Terug naar coaches
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-1">
          Coaching
        </p>
        <h1 className="font-mono text-3xl font-bold text-text mb-1">Word coach</h1>
        <p className="text-text-dim text-sm">Deel je kennis. Help andere spelers beter worden.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="font-mono text-xs text-text-dim uppercase tracking-widest block mb-2">
            Over jezelf *
          </label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Vertel over je ervaring, speelstijl en wat je studenten kunt leren... (min. 50 tekens)"
            rows={5}
            maxLength={1000}
            className="w-full bg-void border border-border rounded-lg px-4 py-3 text-text text-sm font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors resize-none"
          />
          <p className="font-mono text-[10px] text-text-dim/60 mt-1 text-right">
            {bio.length}/1000
          </p>
        </div>

        <div>
          <label className="font-mono text-xs text-text-dim uppercase tracking-widest block mb-2">
            Discord handle *
          </label>
          <input
            type="text"
            value={discordHandle}
            onChange={e => setDiscordHandle(e.target.value)}
            placeholder="username#0000 of username"
            className="w-full bg-void border border-border rounded-lg px-4 py-3 text-text text-sm font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors"
          />
        </div>

        <div>
          <label className="font-mono text-xs text-text-dim uppercase tracking-widest block mb-3">
            Games die je coacht *
          </label>
          <div className="flex flex-wrap gap-2">
            {games.map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleItem(selectedGames, setSelectedGames, g.id)}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-colors duration-200 ${
                  selectedGames.includes(g.id)
                    ? 'bg-purple text-white border border-purple'
                    : 'bg-void text-text-dim border border-border hover:border-purple'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-mono text-xs text-text-dim uppercase tracking-widest block mb-3">
            Specialisaties *
          </label>
          <div className="flex flex-wrap gap-2">
            {SPECIALIZATIONS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => toggleItem(selectedSpecs, setSelectedSpecs, s)}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-colors duration-200 ${
                  selectedSpecs.includes(s)
                    ? 'bg-purple text-white border border-purple'
                    : 'bg-void text-text-dim border border-border hover:border-purple'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-mono text-xs text-text-dim uppercase tracking-widest block mb-3">
            Talen
          </label>
          <div className="flex gap-3">
            {['nl', 'en'].map(lang => (
              <button
                key={lang}
                type="button"
                onClick={() => toggleItem(languages, setLanguages, lang)}
                className={`px-4 py-2 rounded-lg font-mono text-xs uppercase transition-colors duration-200 ${
                  languages.includes(lang)
                    ? 'bg-purple text-white border border-purple'
                    : 'bg-void text-text-dim border border-border hover:border-purple'
                }`}
              >
                {lang === 'nl' ? 'Nederlands' : 'English'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-mono text-xs text-text-dim uppercase tracking-widest block mb-3">
            Sessie tier
          </label>
          <div className="flex gap-3">
            {[
              { key: 'basic', label: 'Basic (€10)' },
              { key: 'standard', label: 'Standard (€25)' },
              { key: 'premium', label: 'Premium (€50)' },
            ].map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTier(t.key)}
                className={`flex-1 py-2 rounded-lg font-mono text-xs transition-colors duration-200 ${
                  tier === t.key
                    ? 'bg-purple text-white border border-purple'
                    : 'bg-void text-text-dim border border-border hover:border-purple'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="font-mono text-xs text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-purple text-white font-mono text-sm uppercase tracking-wider rounded-lg hover:bg-purple/85 transition-colors duration-200 disabled:opacity-40"
        >
          {loading ? 'Bezig...' : 'Aanvraag indienen'}
        </button>
      </form>
    </div>
  )
}
