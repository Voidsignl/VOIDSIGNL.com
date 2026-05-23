'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Heart, Send, X } from 'lucide-react'

export interface FeedComment {
  id: string
  content: string
  like_count: number
  parent_id: string | null
  created_at: string
  user: {
    id: string
    username: string
    display_name?: string | null
    avatar_url?: string | null
    accent_color?: string | null
  } | null
  replies?: FeedComment[]
}

export default function PostComments({ postId }: { postId: string }) {
  const [comments, setComments] = useState<FeedComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchComments = useCallback(async () => {
    const res = await fetch(`/api/feed/${postId}/comments`)
    const json = await res.json()
    setComments(json.data ?? [])
  }, [postId])

  useEffect(() => { fetchComments() }, [fetchComments])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/feed/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          parent_id: replyTo?.id ?? null,
        }),
      })
      const json = await res.json()
      if (json.data) {
        if (replyTo) {
          setComments(prev => prev.map(c =>
            c.id === replyTo.id
              ? { ...c, replies: [...(c.replies ?? []), json.data] }
              : c
          ))
        } else {
          setComments(prev => [...prev, { ...json.data, replies: [] }])
        }
        setNewComment('')
        setReplyTo(null)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleLikeComment(commentId: string) {
    const res = await fetch(`/api/feed/comments/${commentId}/like`, { method: 'POST' })
    if (!res.ok) return
    const json = await res.json()
    setComments(prev => prev.map(c => {
      if (c.id === commentId) return { ...c, like_count: c.like_count + (json.liked ? 1 : -1) }
      const replies = c.replies?.map(r =>
        r.id === commentId ? { ...r, like_count: r.like_count + (json.liked ? 1 : -1) } : r
      )
      return { ...c, replies }
    }))
  }

  function CommentItem({ comment, isReply = false }: { comment: FeedComment; isReply?: boolean }) {
    if (!comment.user) return null
    const accentColor = comment.user.accent_color ?? '#6B3FE0'

    return (
      <div className={`flex gap-3 ${isReply ? 'ml-10 mt-2' : ''}`}>
        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-surface-2 flex-shrink-0 border"
          style={{ borderColor: accentColor }}>
          {comment.user.avatar_url ? (
            <Image src={comment.user.avatar_url} alt={comment.user.username}
              fill sizes="32px" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[9px] text-text-dim">
                {comment.user.username?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="bg-surface-2 rounded-xl px-3 py-2">
            <span className="font-mono text-xs font-bold text-text mr-2">
              {comment.user.display_name ?? comment.user.username}
            </span>
            <span className="text-text-dim text-sm">{comment.content}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 ml-1">
            <button
              onClick={() => handleLikeComment(comment.id)}
              className="flex items-center gap-1 font-mono text-[10px] text-text-dim hover:text-purple transition-colors"
            >
              <Heart size={10} /> {comment.like_count > 0 ? comment.like_count : ''}
            </button>
            {!isReply && (
              <button
                onClick={() => setReplyTo({ id: comment.id, username: comment.user?.username ?? '' })}
                className="font-mono text-[10px] text-text-dim hover:text-text transition-colors"
              >
                Reageer
              </button>
            )}
          </div>

          {comment.replies?.map(reply => (
            <CommentItem key={reply.id} comment={reply} isReply />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {comments.map(comment => (
        <CommentItem key={comment.id} comment={comment} />
      ))}

      {comments.length === 0 && (
        <p className="text-center text-text-dim/60 font-mono text-xs py-2">
          Nog geen reacties.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1">
          {replyTo && (
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] text-purple">
                Reageer op @{replyTo.username}
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-text-dim/60 hover:text-text-dim"
              >
                <X size={10} />
              </button>
            </div>
          )}
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder={replyTo ? `@${replyTo.username} ...` : 'Reageer...'}
            maxLength={1000}
            className="w-full bg-void border border-border rounded-lg px-3 py-2 text-text text-sm font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !newComment.trim()}
          className="px-3 py-2 bg-purple text-white font-mono text-xs rounded-lg hover:bg-purple/85 transition-colors disabled:opacity-40"
        >
          {loading ? '...' : <Send size={12} />}
        </button>
      </form>
    </div>
  )
}
