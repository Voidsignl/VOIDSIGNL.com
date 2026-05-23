'use client'

import Image from 'next/image'
import { useState } from 'react'
import ClipModal, { type ClipData } from './ClipModal'
import { Heart, Play } from 'lucide-react'

interface ClipCardProps {
  clip: ClipData
  isLiked?: boolean
}

export default function ClipCard({ clip, isLiked: initialLiked = false }: ClipCardProps) {
  const [showModal, setShowModal] = useState(false)
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(clip.like_count)

  async function handleLike(e: React.MouseEvent) {
    e.stopPropagation()
    const res = await fetch(`/api/clips/${clip.id}/like`, { method: 'POST' })
    if (!res.ok) return
    const json = await res.json()
    setLiked(json.liked)
    setLikeCount(prev => json.liked ? prev + 1 : Math.max(0, prev - 1))
  }

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="group relative bg-surface border border-border rounded-xl overflow-hidden cursor-pointer hover:border-purple transition-colors duration-200"
      >
        <div className="aspect-video bg-void relative overflow-hidden">
          {clip.thumbnail_url ? (
            <Image
              src={clip.thumbnail_url}
              alt={clip.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play size={32} className="text-text-dim/60" />
            </div>
          )}

          {clip.is_cotw && (
            <div className="absolute top-2 left-2">
              <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-1 rounded-full bg-cyan text-void font-bold">
                Clip of the Week
              </span>
            </div>
          )}

          <div className="absolute top-2 right-2">
            <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-1 rounded-full bg-void/80 text-text-dim">
              {clip.source_type === 'youtube' ? 'YT' : clip.source_type === 'twitch' ? 'TV' : '↑'}
            </span>
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-void/40">
            <div className="w-12 h-12 rounded-full bg-purple/90 flex items-center justify-center">
              <Play size={18} fill="white" className="text-white ml-0.5" />
            </div>
          </div>
        </div>

        <div className="p-3">
          <p className="font-mono text-sm text-text font-bold truncate mb-1">{clip.title}</p>

          {clip.user && (
            <div className="flex items-center gap-2 mb-2">
              <div className="relative w-5 h-5 rounded-full overflow-hidden bg-surface-2">
                {clip.user.avatar_url ? (
                  <Image src={clip.user.avatar_url} alt={clip.user.username} fill sizes="20px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[8px] text-text-dim">{clip.user.username?.[0]?.toUpperCase()}</span>
                  </div>
                )}
              </div>
              <span className="font-mono text-[10px] text-text-dim truncate">
                {clip.user.display_name ?? clip.user.username}
              </span>
              {clip.game && (
                <span className="font-mono text-[9px] text-text-dim/60 ml-auto">
                  {clip.game.name}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-text-dim">
                {clip.view_count.toLocaleString()} views
              </span>
              <span className="font-mono text-[10px] text-text-dim">
                {clip.comment_count} reacties
              </span>
            </div>
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 font-mono text-xs transition-colors ${
                liked ? 'text-purple' : 'text-text-dim hover:text-purple'
              }`}
            >
              <Heart size={12} fill={liked ? 'currentColor' : 'none'} /> {likeCount.toLocaleString()}
            </button>
          </div>
        </div>
      </div>

      {showModal && <ClipModal clip={clip} onClose={() => setShowModal(false)} />}
    </>
  )
}
