'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import ClipPlayer from './ClipPlayer'
import { X, Heart, MessageCircle, Send } from 'lucide-react'

export interface ClipUser {
  id: string
  username: string
  display_name?: string | null
  avatar_url?: string | null
  accent_color?: string | null
  is_verified?: boolean
}

export interface ClipData {
  id: string
  title: string
  description?: string | null
  video_url: string
  thumbnail_url?: string | null
  source_type: string
  like_count: number
  view_count: number
  comment_count: number
  is_cotw: boolean
  created_at: string
  game?: { id: string; name: string } | null
  user?: ClipUser | null
}

interface ClipComment {
  id: string
  content: string
  like_count: number
  created_at: string
  user?: ClipUser | null
}

interface ClipModalProps {
  clip: ClipData
  onClose: () => void
}

export default function ClipModal({ clip, onClose }: ClipModalProps) {
  const [comments, setComments] = useState<ClipComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(clip.like_count)

  useEffect(() => {
    fetchComments()
    fetch(`/api/clips/${clip.id}/view`, { method: 'POST' }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip.id])

  async function fetchComments() {
    const res = await fetch(`/api/clips/${clip.id}/comments`)
    const json = await res.json()
    setComments(json.data ?? [])
  }

  async function handleLike() {
    const res = await fetch(`/api/clips/${clip.id}/like`, { method: 'POST' })
    if (!res.ok) return
    const json = await res.json()
    setLiked(json.liked)
    setLikeCount(prev => json.liked ? prev + 1 : Math.max(0, prev - 1))
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/clips/${clip.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      })
      const json = await res.json()
      if (json.data) {
        setComments(prev => [...prev, json.data])
        setNewComment('')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-void/95" onClick={onClose} />

      <div className="relative z-10 w-full max-w-4xl bg-surface border border-border rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {clip.user?.avatar_url && (
              <Image src={clip.user.avatar_url} alt={clip.user.username}
                width={32} height={32} className="rounded-full object-cover" />
            )}
            <div>
              <p className="font-mono text-sm font-bold text-text">{clip.title}</p>
              <p className="font-mono text-[10px] text-text-dim">
                {clip.user?.display_name ?? clip.user?.username}
                {clip.game && ` · ${clip.game.name}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-text transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="p-5 pb-0">
            <ClipPlayer videoUrl={clip.video_url} sourceType={clip.source_type} title={clip.title} />
          </div>

          {clip.description && (
            <p className="px-5 pt-3 text-text-dim text-sm leading-relaxed">{clip.description}</p>
          )}

          <div className="flex items-center gap-4 px-5 py-3 border-b border-border">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 font-mono text-sm transition-colors ${
                liked ? 'text-purple' : 'text-text-dim hover:text-purple'
              }`}
            >
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} /> {likeCount.toLocaleString()}
            </button>
            <span className="font-mono text-sm text-text-dim flex items-center gap-2">
              <MessageCircle size={14} /> {comments.length}
            </span>
            {clip.is_cotw && (
              <span className="font-mono text-xs text-cyan ml-auto">
                ★ Clip of the Week
              </span>
            )}
          </div>

          <div className="px-5 py-4 space-y-4">
            {comments.map(comment => (
              <div key={comment.id} className="flex gap-3">
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-surface-2 flex-shrink-0">
                  {comment.user?.avatar_url ? (
                    <Image src={comment.user.avatar_url} alt={comment.user.username}
                      fill sizes="32px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-[10px] text-text-dim">
                        {comment.user?.username?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-text">
                      {comment.user?.display_name ?? comment.user?.username}
                    </span>
                    <span className="font-mono text-[10px] text-text-dim/60">
                      {new Date(comment.created_at).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                  <p className="text-text-dim text-sm leading-relaxed">{comment.content}</p>
                  {comment.like_count > 0 && (
                    <p className="font-mono text-[10px] text-purple mt-1">
                      ♥ {comment.like_count}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <p className="text-center text-text-dim/60 font-mono text-xs py-4">
                Nog geen reacties.
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleComment} className="px-5 py-4 border-t border-border flex gap-3">
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Reactie plaatsen..."
            maxLength={1000}
            className="flex-1 bg-void border border-border rounded-lg px-4 py-2.5 text-text text-sm font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="px-4 py-2.5 bg-purple text-white font-mono text-xs rounded-lg hover:bg-purple/85 transition-colors disabled:opacity-40"
          >
            {loading ? '...' : <Send size={14} />}
          </button>
        </form>
      </div>
    </div>
  )
}
