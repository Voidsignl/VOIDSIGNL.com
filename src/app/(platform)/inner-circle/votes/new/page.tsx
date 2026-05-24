'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BrandSelect } from '@/components/ui/BrandSelect'

type VoteType = 'simple' | 'upgrade_request' | 'platform_decision'

interface FormState {
  title: string
  description: string
  vote_type: VoteType
  target_user_id: string
  target_mod_level: number
  quorum_pct: number
  closes_at: string
}

function defaultClosesAt(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 16)
}

export default function NewVotePage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    vote_type: 'simple',
    target_user_id: '',
    target_mod_level: 2,
    quorum_pct: 60,
    closes_at: defaultClosesAt(),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        vote_type: form.vote_type,
        quorum_pct: form.quorum_pct,
        closes_at: new Date(form.closes_at).toISOString(),
      }
      if (form.vote_type === 'upgrade_request') {
        payload.target_user_id = form.target_user_id
        payload.target_mod_level = form.target_mod_level
      }

      const res = await fetch('/api/inner-circle/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Onbekende fout')
      router.push(`/inner-circle/votes/${json.data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-cyan mb-1">
          Inner Circle
        </p>
        <h1 className="font-mono text-2xl font-bold text-text">Nieuw voorstel</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-muted block mb-2">
            Type voorstel
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                {
                  id: 'simple' as VoteType,
                  label: 'Voorstel',
                  desc: 'Algemeen',
                },
                {
                  id: 'upgrade_request' as VoteType,
                  label: 'Upgrade',
                  desc: 'Niveau omhoog',
                },
                {
                  id: 'platform_decision' as VoteType,
                  label: 'Platform',
                  desc: 'Grote beslissing',
                },
              ]
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() =>
                  setForm((f) => ({ ...f, vote_type: t.id }))
                }
                className="p-3 rounded-xl border transition-colors duration-200 text-left"
                style={{
                  background:
                    form.vote_type === t.id
                      ? 'rgba(107,63,224,0.12)'
                      : '#1a1a22',
                  borderColor:
                    form.vote_type === t.id ? '#6B3FE0' : '#3a3a48',
                }}
              >
                <p className="font-mono text-xs font-bold text-text mb-0.5">
                  {t.label}
                </p>
                <p className="font-mono text-[9px] text-text-muted">
                  {t.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-muted block mb-2">
            Titel *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) =>
              setForm((f) => ({ ...f, title: e.target.value }))
            }
            placeholder="Korte, duidelijke titel"
            maxLength={200}
            minLength={5}
            required
            className="w-full bg-void border border-border rounded-xl px-4 py-3 text-text text-sm font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors duration-200"
          />
        </div>

        <div>
          <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-muted block mb-2">
            Beschrijving *
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Leg uit wat je wil bereiken en waarom..."
            rows={5}
            maxLength={2000}
            minLength={20}
            required
            className="w-full bg-void border border-border rounded-xl px-4 py-3 text-text text-sm font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors duration-200 resize-none"
          />
        </div>

        {form.vote_type === 'upgrade_request' && (
          <div className="space-y-4 p-4 bg-warning/5 border border-warning/20 rounded-xl">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-warning">
              Upgrade details
            </p>
            <div>
              <label className="font-mono text-[10px] text-text-muted block mb-2">
                User ID van te upgraden lid *
              </label>
              <input
                type="text"
                value={form.target_user_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, target_user_id: e.target.value }))
                }
                placeholder="UUID..."
                required={form.vote_type === 'upgrade_request'}
                className="w-full bg-void border border-border rounded-lg px-4 py-3 text-text text-sm font-mono placeholder-text-dim/60 focus:outline-none focus:border-warning transition-colors duration-200"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] text-text-muted block mb-2">
                Upgrade naar niveau
              </label>
              <BrandSelect
                value={String(form.target_mod_level)}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    target_mod_level: parseInt(v) || 2,
                  }))
                }
                options={[
                  { value: '2', label: 'Niveau 2 — Gebruikersbeheer' },
                  { value: '3', label: 'Niveau 3 — Clan Moderatie' },
                  { value: '4', label: 'Niveau 4 — Platform Decisions' },
                ]}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-muted block mb-2">
              Sluitdatum
            </label>
            <input
              type="datetime-local"
              value={form.closes_at}
              onChange={(e) =>
                setForm((f) => ({ ...f, closes_at: e.target.value }))
              }
              className="w-full bg-void border border-border rounded-xl px-4 py-3 text-text text-sm font-mono focus:outline-none focus:border-purple transition-colors duration-200"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-muted block mb-2">
              Quorum (% moet stemmen)
            </label>
            <input
              type="number"
              value={form.quorum_pct}
              min={50}
              max={100}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  quorum_pct: parseInt(e.target.value) || 60,
                }))
              }
              className="w-full bg-void border border-border rounded-xl px-4 py-3 text-text text-sm font-mono focus:outline-none focus:border-purple transition-colors duration-200"
            />
          </div>
        </div>

        {error && <p className="font-mono text-xs text-danger">{error}</p>}

        <div className="flex gap-3">
          <Link
            href="/inner-circle"
            className="flex-1 py-3 border border-border text-text-muted font-mono text-sm uppercase tracking-widest rounded-xl hover:border-purple/40 hover:text-text text-center transition-colors duration-200"
          >
            Annuleer
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-purple text-white font-mono text-sm uppercase tracking-widest rounded-xl hover:bg-purple/85 transition-colors duration-200 disabled:opacity-40"
          >
            {loading ? 'Bezig...' : 'Voorstel indienen'}
          </button>
        </div>
      </form>
    </div>
  )
}
