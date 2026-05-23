'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ClanForm {
  name: string
  slug: string
  description: string
  is_open: boolean
  max_members: number
}

export default function NewClanPage() {
  const router = useRouter()
  const [form, setForm] = useState<ClanForm>({
    name: '',
    slug: '',
    description: '',
    is_open: true,
    max_members: 50,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleNameChange(name: string) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    setForm((f) => ({ ...f, name, slug }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        description: form.description || undefined,
      }
      const res = await fetch('/api/clans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Aanmaken mislukt')
      router.push(`/clans/${json.data.slug}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Er ging iets mis.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-8">
        <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-1">Clans</p>
        <h1 className="font-mono text-2xl font-bold text-text mb-1">Clan aanmaken</h1>
        <p className="text-text-dim text-sm">Kost 500 XP om aan te maken.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="font-mono text-xs text-text-dim uppercase tracking-widest block mb-2">
            Naam *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Clan naam"
            maxLength={50}
            required
            className="w-full bg-void border border-border rounded-xl px-4 py-3 text-text text-sm font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors"
          />
        </div>

        <div>
          <label className="font-mono text-xs text-text-dim uppercase tracking-widest block mb-2">
            Slug *
          </label>
          <div className="flex items-center bg-void border border-border rounded-xl px-4 py-3 focus-within:border-purple transition-colors">
            <span className="font-mono text-xs text-text-dim/60 mr-1">/clans/</span>
            <input
              type="text"
              value={form.slug}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                }))
              }
              placeholder="clan-slug"
              maxLength={50}
              required
              className="flex-1 bg-transparent text-text text-sm font-mono placeholder-text-dim/60 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="font-mono text-xs text-text-dim uppercase tracking-widest block mb-2">
            Beschrijving
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Waar staat jullie clan voor?"
            rows={3}
            maxLength={500}
            className="w-full bg-void border border-border rounded-xl px-4 py-3 text-text text-sm font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors resize-none"
          />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, is_open: !f.is_open }))}
              className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${
                form.is_open ? 'bg-purple' : 'bg-border'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-colors duration-200 ${
                  form.is_open ? 'right-1' : 'left-1'
                }`}
              />
            </button>
            <span className="font-mono text-xs text-text-dim">Open clan</span>
          </label>

          <div className="flex items-center gap-2">
            <label className="font-mono text-xs text-text-dim">Max leden:</label>
            <input
              type="number"
              value={form.max_members}
              min={5}
              max={500}
              onChange={(e) =>
                setForm((f) => ({ ...f, max_members: parseInt(e.target.value) || 50 }))
              }
              className="w-20 bg-void border border-border rounded-lg px-3 py-1.5 text-text text-xs font-mono focus:outline-none focus:border-purple transition-colors"
            />
          </div>
        </div>

        {error && <p className="font-mono text-xs text-danger">{error}</p>}

        <div className="bg-purple/8 border border-purple/20 rounded-xl px-4 py-3">
          <p className="font-mono text-xs text-purple">⚠ Aanmaken kost 500 XP</p>
          <p className="text-text-dim text-xs mt-0.5">
            Deze XP wordt afgetrokken van jouw account.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-purple text-white font-mono text-sm rounded-xl hover:bg-purple/85 transition-colors disabled:opacity-40"
        >
          {loading ? 'Bezig...' : 'Clan aanmaken (−500 XP)'}
        </button>
      </form>
    </div>
  )
}
