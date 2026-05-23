'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import PostComments from './PostComments'
import { Heart, MessageCircle, Repeat2, MoreHorizontal, Link2 } from 'lucide-react'

export interface FeedPost {
  id: string
  content: string
  images?: string[]
  image_url?: string | null
  post_type: string
  like_count: number
  comment_count: number
  repost_count: number
  is_liked: boolean
  is_auto_post: boolean
  created_at: string
  user: {
    id: string
    username: string
    display_name?: string | null
    avatar_url?: string | null
    accent_color?: string | null
    is_verified?: boolean
    is_founding_member?: boolean
    level_name?: string
  } | null
  game?: { id: string; name: string } | null
  repost?: FeedPost | null
}

interface PostCardProps {
  post: FeedPost
  currentUserId?: string
  onRepost?: (postId: string) => void
  onDelete?: (postId: string) => void
}

const POST_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  achievement: { label: '🏆 Achievement', color: '#f59e0b' },
  clip: { label: '🎬 Clip', color: '#00C8F0' },
  buddy: { label: '🤝 Buddy', color: '#22c55e' },
  repost: { label: '↩ Gedeeld', color: '#9998aa' },
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'nu'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}u`
  return `${Math.floor(hrs / 24)}d`
}

export default function PostCard({ post, currentUserId, onRepost, onDelete }: PostCardProps) {
  const [liked, setLiked] = useState(post.is_liked)
  const [likeCount, setLikeCount] = useState(post.like_count)
  const [showComments, setShowComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  if (!post.user) return null
  const accentColor = post.user.accent_color ?? '#6B3FE0'
  const typeLabel = POST_TYPE_LABELS[post.post_type]

  const allImages = [
    ...(post.images ?? []),
    ...(post.image_url ? [post.image_url] : []),
  ].filter(Boolean) as string[]

  async function handleLike() {
    setLiked(!liked)
    setLikeCount(c => liked ? c - 1 : c + 1)
    const res = await fetch(`/api/feed/${post.id}/like`, { method: 'POST' })
    if (!res.ok) {
      setLiked(post.is_liked)
      setLikeCount(post.like_count)
    }
  }

  async function handleDelete() {
    if (!confirm('Post verwijderen?')) return
    await fetch(`/api/feed/${post.id}`, { method: 'DELETE' })
    onDelete?.(post.id)
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.origin + '/feed/' + post.id)
    setShowMenu(false)
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden hover:border-purple/30 transition-colors duration-200">
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.user.username}`} className="relative flex-shrink-0">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-surface-2 border-2"
              style={{ borderColor: accentColor }}>
              {post.user.avatar_url ? (
                <Image src={post.user.avatar_url} alt={post.user.username}
                  fill sizes="40px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-mono text-sm text-text-dim">
                    {post.user.username?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <Link href={`/profile/${post.user.username}`}>
                <span className="font-mono text-sm font-bold text-text hover:text-purple transition-colors">
                  {post.user.display_name ?? post.user.username}
                </span>
              </Link>
              {post.user.is_verified && <span className="text-cyan text-xs">✓</span>}
              {post.user.is_founding_member && (
                <span className="font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-cyan/10 border border-cyan/20 text-cyan">
                  Founding
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-text-dim">{post.user.level_name}</span>
              {post.game && (
                <span className="font-mono text-[10px] text-text-dim/60">· {post.game.name}</span>
              )}
              <span className="font-mono text-[10px] text-text-dim/60">· {timeAgo(post.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {typeLabel && (
            <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-surface-2"
              style={{ color: typeLabel.color }}>
              {typeLabel.label}
            </span>
          )}

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-text-dim/60 hover:text-text-dim transition-colors p-1"
            >
              <MoreHorizontal size={14} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-7 bg-surface-2 border border-border rounded-lg overflow-hidden z-10 min-w-[140px]">
                {currentUserId === post.user.id && (
                  <button
                    onClick={() => { handleDelete(); setShowMenu(false) }}
                    className="w-full text-left px-4 py-2.5 font-mono text-xs text-danger hover:bg-surface transition-colors"
                  >
                    Verwijderen
                  </button>
                )}
                <button
                  onClick={handleCopyLink}
                  className="w-full text-left px-4 py-2.5 font-mono text-xs text-text-dim hover:bg-surface transition-colors flex items-center gap-2"
                >
                  <Link2 size={11} /> Link kopiëren
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {post.repost && post.repost.user && (
        <div className="mx-4 mb-3 p-3 border border-border rounded-lg bg-void">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[10px] text-text-dim">
              {post.repost.user.display_name ?? post.repost.user.username}
            </span>
          </div>
          <p className="text-text-dim text-sm leading-relaxed line-clamp-3">{post.repost.content}</p>
        </div>
      )}

      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-text text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>
      )}

      {allImages.length > 0 && (
        <div className={`px-4 pb-3 grid gap-2 ${
          allImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
        }`}>
          {allImages.slice(0, 4).map((img, i) => (
            <div key={i} className={`relative overflow-hidden rounded-lg bg-void ${
              allImages.length === 1 ? 'aspect-video' : 'aspect-square'
            } ${i === 2 && allImages.length === 3 ? 'col-span-2' : ''}`}>
              <Image src={img} alt={`Post afbeelding ${i + 1}`} fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" />
              {i === 3 && allImages.length > 4 && (
                <div className="absolute inset-0 bg-void/70 flex items-center justify-center">
                  <span className="font-mono text-text text-lg font-bold">+{allImages.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 px-4 pb-3 border-t border-border pt-3">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs transition-colors duration-200 ${
            liked ? 'bg-purple/15 text-purple' : 'text-text-dim hover:bg-surface-2 hover:text-text'
          }`}
        >
          <Heart size={12} fill={liked ? 'currentColor' : 'none'} />
          {likeCount > 0 ? likeCount.toLocaleString() : ''}
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs transition-colors duration-200 ${
            showComments ? 'bg-surface-2 text-text' : 'text-text-dim hover:bg-surface-2 hover:text-text'
          }`}
        >
          <MessageCircle size={12} /> {post.comment_count > 0 ? post.comment_count : ''}
        </button>

        <button
          onClick={() => onRepost?.(post.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs text-text-dim hover:bg-surface-2 hover:text-text transition-colors duration-200"
        >
          <Repeat2 size={12} /> {post.repost_count > 0 ? post.repost_count : ''}
        </button>
      </div>

      {showComments && (
        <div className="border-t border-border">
          <PostComments postId={post.id} />
        </div>
      )}
    </div>
  )
}
