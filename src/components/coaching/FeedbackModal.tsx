'use client'

import { useState } from 'react'

interface FeedbackModalProps {
  session: {
    id: string
    coach_id: string
    coach: {
      username: string
      display_name?: string | null
      avatar_url?: string | null
    }
  }
  onClose: () => void
  onSubmit: () => void
}

const RATING_LABELS = ['', 'Slecht', 'Matig', 'Goed', 'Heel goed', 'Uitstekend']

export default function FeedbackModal({ session, onClose, onSubmit }: FeedbackModalProps) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setError('Geef een beoordeling.'); return }
    if (content.length < 10) { setError('Schrijf minimaal 10 tekens.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/coaching/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          coach_id: session.coach_id,
          rating,
          content,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Indienen mislukt')
      onSubmit()
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Er ging iets mis.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-void/95" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-border">
          <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-0.5">
            Sessie afgerond
          </p>
          <h2 className="font-mono text-lg font-bold text-text">Hoe was je sessie?</h2>
          <p className="text-text-dim text-xs mt-1">
            Met {session.coach.display_name ?? session.coach.username}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="text-center">
            <p className="font-mono text-xs text-text-dim mb-3">Beoordeling</p>
            <div className="flex justify-center gap-3">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="text-3xl transition-transform hover:scale-110"
                  style={{ color: star <= (hovered || rating) ? '#f59e0b' : '#3a3a48' }}
                >
                  ★
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="font-mono text-xs text-text-dim mt-2">
                {RATING_LABELS[rating]}
              </p>
            )}
          </div>

          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Vertel over je ervaring... (minimaal 10 tekens)"
            rows={4}
            maxLength={1000}
            className="w-full bg-void border border-border rounded-lg px-4 py-3 text-text text-sm font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors resize-none"
          />

          {error && <p className="font-mono text-xs text-danger">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border text-text-dim font-mono text-xs uppercase tracking-wider rounded-lg hover:border-purple hover:text-text transition-colors duration-200"
            >
              Later
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-purple text-white font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-purple/85 transition-colors duration-200 disabled:opacity-40"
            >
              {loading ? '...' : 'Review plaatsen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
