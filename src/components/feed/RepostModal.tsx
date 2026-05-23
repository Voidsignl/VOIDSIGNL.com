'use client'

import { useState } from 'react'
import { Repeat2 } from 'lucide-react'

interface RepostModalProps {
  postId: string
  onClose: () => void
  onSuccess: () => void
}

export default function RepostModal({ postId, onClose, onSuccess }: RepostModalProps) {
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRepost() {
    setLoading(true)
    try {
      await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: comment || ' ',
          repost_id: postId,
          post_type: 'repost',
        }),
      })
      onSuccess()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-void/90" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-surface border border-border rounded-xl p-5">
        <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-1">Delen</p>
        <h3 className="font-mono text-base font-bold text-text mb-4">Post delen</h3>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Voeg een reactie toe... (optioneel)"
          rows={3}
          maxLength={500}
          className="w-full bg-void border border-border rounded-lg px-4 py-3 text-text text-sm font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors resize-none mb-4"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-border text-text-dim font-mono text-xs rounded-lg hover:border-purple transition-colors duration-200"
          >
            Annuleer
          </button>
          <button
            onClick={handleRepost}
            disabled={loading}
            className="flex-1 py-2.5 bg-purple text-white font-mono text-xs rounded-lg hover:bg-purple/85 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            {loading ? '...' : <><Repeat2 size={12} /> Delen</>}
          </button>
        </div>
      </div>
    </div>
  )
}
