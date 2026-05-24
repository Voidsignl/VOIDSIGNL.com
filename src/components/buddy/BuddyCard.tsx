'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

export interface BuddyCardUser {
  id: string
  username: string
  display_name?: string | null
  avatar_url?: string | null
  level_name?: string
  level?: number
  is_verified?: boolean
  is_founding_member?: boolean
  accent_color?: string | null
  platforms?: string[] | null
  buddy_playtimes?: string[] | null
  preferred_language?: string | null
  last_seen_at?: string | null
  compatibility?: number
  is_buddy?: boolean
  request_status?: string | null
  request_direction?: 'sent' | 'received' | null
  request_id?: string | null
}

interface BuddyCardProps {
  user: BuddyCardUser
  onRequest?: (userId: string, message: string) => Promise<void>
  onAccept?: (requestId: string) => Promise<void>
  onDecline?: (requestId: string) => Promise<void>
}

const COMPATIBILITY_LABEL = (score: number) =>
  score >= 7 ? { label: 'Perfect match', color: '#22c55e' } :
  score >= 4 ? { label: 'Goede match',   color: '#00C8F0' } :
  score >= 2 ? { label: 'Match',         color: '#6B3FE0' } :
               { label: 'Weinig overlap', color: '#9998aa' }

const isOnline = (lastSeen?: string | null) => {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < 90000
}

export default function BuddyCard({ user, onRequest, onAccept, onDecline }: BuddyCardProps) {
  const [showMessageInput, setShowMessageInput] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [respondLoading, setRespondLoading] = useState<'accept' | 'decline' | null>(null)

  const accentColor = user.accent_color ?? '#6B3FE0'
  const online = isOnline(user.last_seen_at)
  const compat = user.compatibility !== undefined
    ? COMPATIBILITY_LABEL(user.compatibility)
    : null

  async function handleRequest() {
    if (!onRequest) return
    setLoading(true)
    try {
      await onRequest(user.id, message)
      setSent(true)
      setShowMessageInput(false)
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept() {
    if (!onAccept || !user.request_id) return
    setRespondLoading('accept')
    try { await onAccept(user.request_id) } finally { setRespondLoading(null) }
  }

  async function handleDecline() {
    if (!onDecline || !user.request_id) return
    setRespondLoading('decline')
    try { await onDecline(user.request_id) } finally { setRespondLoading(null) }
  }

  const pendingFromMe = user.request_status === 'pending' && user.request_direction === 'sent'
  const pendingForMe = user.request_status === 'pending' && user.request_direction === 'received'

  return (
    <div className="bg-surface border border-border rounded-xl p-5 hover:border-purple transition-colors duration-200">
      {/* Top */}
      <div className="flex items-start gap-3 mb-4">
        <Link href={`/profile/${user.username}`} className="relative flex-shrink-0">
          <div
            className="relative w-12 h-12 rounded-full overflow-hidden bg-surface-2 border-2"
            style={{ borderColor: accentColor }}
          >
            {user.avatar_url ? (
              <Image src={user.avatar_url} alt={user.username} fill sizes="48px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-mono text-sm text-text-dim">
                  {user.username?.[0]?.toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface ${
              online ? 'bg-success' : 'bg-border'
            }`}
          />
        </Link>

        <div className="flex-1 min-w-0">
          <Link href={`/profile/${user.username}`}>
            <p className="font-mono text-sm font-bold text-text truncate hover:text-purple transition-colors">
              {user.display_name ?? user.username}
            </p>
          </Link>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="font-mono text-[10px] text-text-dim">
              {user.level_name}
            </span>
            {user.is_founding_member && (
              <span className="font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-cyan/10 border border-cyan/20 text-cyan">
                Founding
              </span>
            )}
          </div>
        </div>

        {compat && user.compatibility !== undefined && (
          <div className="text-right flex-shrink-0">
            <p className="font-mono text-lg font-bold" style={{ color: compat.color }}>
              {user.compatibility}/9
            </p>
            <p className="font-mono text-[8px]" style={{ color: compat.color }}>
              {compat.label}
            </p>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {user.platforms?.map(p => (
          <span key={p} className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-surface-2 text-text-dim">
            {p}
          </span>
        ))}
        {user.buddy_playtimes?.map(t => (
          <span key={t} className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-surface-2 text-text-dim">
            {t}
          </span>
        ))}
        {user.preferred_language && (
          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-surface-2 text-text-dim">
            {user.preferred_language.toUpperCase()}
          </span>
        )}
      </div>

      {/* Actie */}
      {user.is_buddy ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 py-2 rounded-lg border border-success/30 bg-success/5 text-center">
            <span className="font-mono text-xs text-success">✓ Buddy</span>
          </div>
          <Link
            href={`/messages?to=${user.username}`}
            className="px-3 py-2 rounded-lg border border-border font-mono text-xs text-text-dim hover:border-purple hover:text-text transition-colors duration-200"
          >
            DM
          </Link>
        </div>
      ) : pendingForMe ? (
        <div className="space-y-2">
          <p className="font-mono text-[10px] text-text-dim text-center">
            Buddy request van {user.display_name ?? user.username}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              disabled={respondLoading !== null}
              className="flex-1 py-2 bg-purple text-white font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-purple/85 transition-colors duration-200 disabled:opacity-40"
            >
              {respondLoading === 'accept' ? '...' : 'Accepteren'}
            </button>
            <button
              onClick={handleDecline}
              disabled={respondLoading !== null}
              className="px-3 py-2 border border-border text-text-dim font-mono text-xs uppercase tracking-wider rounded-lg hover:border-danger hover:text-danger transition-colors duration-200 disabled:opacity-40"
            >
              {respondLoading === 'decline' ? '...' : 'Weigeren'}
            </button>
          </div>
        </div>
      ) : pendingFromMe ? (
        <div className="py-2 rounded-lg border border-border text-center">
          <span className="font-mono text-xs text-text-dim">Request verstuurd</span>
        </div>
      ) : sent ? (
        <div className="py-2 rounded-lg border border-purple/30 bg-purple/5 text-center">
          <span className="font-mono text-xs text-purple">✓ Request verstuurd</span>
        </div>
      ) : showMessageInput ? (
        <div className="space-y-2">
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Kort berichtje (optioneel)..."
            maxLength={200}
            className="w-full bg-void border border-border rounded-lg px-3 py-2 text-text text-xs font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors"
          />
          <div className="flex gap-2">
            <button
              onClick={handleRequest}
              disabled={loading}
              className="flex-1 py-2 bg-purple text-white font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-purple/85 transition-colors duration-200 disabled:opacity-40"
            >
              {loading ? '...' : 'Verstuur'}
            </button>
            <button
              onClick={() => setShowMessageInput(false)}
              className="px-3 py-2 border border-border text-text-dim font-mono text-xs uppercase tracking-wider rounded-lg hover:border-purple hover:text-text transition-colors duration-200"
            >
              Annuleer
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowMessageInput(true)}
          className="w-full py-2.5 border border-border text-text-dim font-mono text-xs uppercase tracking-wider rounded-lg hover:border-purple hover:text-text transition-colors duration-200"
        >
          + Buddy request
        </button>
      )}
    </div>
  )
}
