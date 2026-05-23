'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MoreHorizontal } from 'lucide-react'

export interface ReplyCardData {
  id: string
  body: string
  is_solution: boolean
  like_count: number
  is_liked: boolean
  created_at: string
  author: {
    id: string
    username: string
    display_name?: string | null
    avatar_url?: string | null
    accent_color?: string | null
    is_verified?: boolean
    is_founding_member?: boolean
    level_name?: string
    post_count?: number
  }
}

interface ReplyCardProps {
  reply: ReplyCardData
  threadAuthorId?: string
  currentUserId?: string
  isMod?: boolean
  onDelete?: (replyId: string) => void
  onMarkSolution?: (replyId: string) => void
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'nu'
  if (mins < 60) return `${mins}m geleden`
  if (mins < 1440) return `${Math.floor(mins / 60)}u geleden`
  return new Date(date).toLocaleDateString('nl-NL')
}

export default function ReplyCard({
  reply, threadAuthorId, currentUserId, isMod, onDelete, onMarkSolution,
}: ReplyCardProps) {
  const [liked, setLiked] = useState(reply.is_liked)
  const [likeCount, setLikeCount] = useState(reply.like_count)
  const [showMenu, setShowMenu] = useState(false)

  const accentColor = reply.author.accent_color ?? '#6B3FE0'
  const isOwn = currentUserId === reply.author.id
  const canModerate = isMod || isOwn

  async function handleLike() {
    setLiked(!liked)
    setLikeCount(c => liked ? c - 1 : c + 1)
    const res = await fetch(`/api/forums/replies/${reply.id}/like`, { method: 'POST' })
    if (!res.ok) {
      setLiked(reply.is_liked)
      setLikeCount(reply.like_count)
    }
  }

  async function handleDelete() {
    if (!confirm('Reply verwijderen?')) return
    await fetch('/api/forums/mod', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', reply_id: reply.id }),
    })
    onDelete?.(reply.id)
  }

  return (
    <div className={`flex gap-4 py-5 px-5 border-b border-border last:border-b-0 ${
      reply.is_solution ? 'bg-success/5' : ''
    }`}>
      <div className="flex-shrink-0 w-16 text-center">
        <Link href={`/profile/${reply.author.username}`}>
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-surface-2 border-2 mx-auto mb-1"
            style={{ borderColor: accentColor }}>
            {reply.author.avatar_url ? (
              <Image src={reply.author.avatar_url} alt={reply.author.username}
                fill sizes="40px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-mono text-sm text-text-dim">
                  {reply.author.username?.[0]?.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </Link>
        <Link href={`/profile/${reply.author.username}`}>
          <p className="font-mono text-[9px] text-text hover:text-purple transition-colors truncate">
            {reply.author.display_name ?? reply.author.username}
          </p>
        </Link>
        <p className="font-mono text-[8px] text-text-dim/60 mt-0.5">
          {reply.author.level_name}
        </p>
        {reply.author.is_verified && (
          <p className="font-mono text-[8px] text-cyan">✓</p>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-text-dim/60">
              {timeAgo(reply.created_at)}
            </span>
            {reply.is_solution && (
              <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-success/15 text-success">
                ✓ Oplossing
              </span>
            )}
          </div>

          {canModerate && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-text-dim/60 hover:text-text-dim transition-colors p-1"
              >
                <MoreHorizontal size={14} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-7 bg-surface-2 border border-border rounded-lg overflow-hidden z-10 min-w-[140px]">
                  {(isMod || currentUserId === threadAuthorId) && !reply.is_solution && (
                    <button
                      onClick={() => { onMarkSolution?.(reply.id); setShowMenu(false) }}
                      className="w-full text-left px-4 py-2.5 font-mono text-xs text-success hover:bg-surface transition-colors"
                    >
                      ✓ Oplossing
                    </button>
                  )}
                  {(isOwn || isMod) && (
                    <button
                      onClick={() => { handleDelete(); setShowMenu(false) }}
                      className="w-full text-left px-4 py-2.5 font-mono text-xs text-danger hover:bg-surface transition-colors"
                    >
                      Verwijderen
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-text text-sm leading-relaxed whitespace-pre-wrap mb-3">
          {reply.body}
        </p>

        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 font-mono text-xs transition-colors ${
            liked ? 'text-purple' : 'text-text-dim hover:text-purple'
          }`}
        >
          <Heart size={12} fill={liked ? 'currentColor' : 'none'} /> {likeCount > 0 ? likeCount : ''}
        </button>
      </div>
    </div>
  )
}
