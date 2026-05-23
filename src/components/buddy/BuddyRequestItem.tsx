'use client'

import Image from 'next/image'
import { useState } from 'react'

export interface BuddyRequestItemData {
  id: string
  message?: string | null
  created_at: string
  sender: {
    id: string
    username: string
    display_name?: string | null
    avatar_url?: string | null
    level_name?: string
    accent_color?: string | null
  }
}

interface BuddyRequestItemProps {
  request: BuddyRequestItemData
  onAccept: (id: string) => Promise<void>
  onDecline: (id: string) => Promise<void>
}

export default function BuddyRequestItem({ request, onAccept, onDecline }: BuddyRequestItemProps) {
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null)
  const [done, setDone] = useState(false)

  if (done) return null

  async function handle(action: 'accept' | 'decline') {
    setLoading(action)
    try {
      if (action === 'accept') await onAccept(request.id)
      else await onDecline(request.id)
      setDone(true)
    } finally {
      setLoading(null)
    }
  }

  const sender = request.sender
  const accentColor = sender.accent_color ?? '#6B3FE0'

  return (
    <div className="flex items-start gap-4 bg-surface border border-border rounded-xl p-4">
      <div
        className="relative w-10 h-10 rounded-full overflow-hidden bg-surface-2 border-2 flex-shrink-0"
        style={{ borderColor: accentColor }}
      >
        {sender.avatar_url ? (
          <Image src={sender.avatar_url} alt={sender.username} fill sizes="40px" className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-mono text-xs text-text-dim">
              {sender.username?.[0]?.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-sm font-bold text-text">
            {sender.display_name ?? sender.username}
          </span>
          <span className="font-mono text-[10px] text-text-dim">
            {sender.level_name}
          </span>
        </div>
        {request.message && (
          <p className="text-text-dim text-xs mb-2 italic">
            &ldquo;{request.message}&rdquo;
          </p>
        )}
        <p className="text-text-dim/60 font-mono text-[10px]">
          {new Date(request.created_at).toLocaleDateString('nl-NL')}
        </p>
      </div>

      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => handle('accept')}
          disabled={loading !== null}
          className="px-3 py-1.5 bg-purple text-white font-mono text-xs rounded-lg hover:bg-purple/85 transition-colors disabled:opacity-40"
        >
          {loading === 'accept' ? '...' : '✓'}
        </button>
        <button
          onClick={() => handle('decline')}
          disabled={loading !== null}
          className="px-3 py-1.5 border border-border text-text-dim font-mono text-xs rounded-lg hover:border-danger hover:text-danger transition-all disabled:opacity-40"
        >
          {loading === 'decline' ? '...' : '✕'}
        </button>
      </div>
    </div>
  )
}
