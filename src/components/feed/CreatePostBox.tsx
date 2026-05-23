'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { ImageIcon, X } from 'lucide-react'
import type { FeedPost } from './PostCard'

interface CreatePostBoxProps {
  user: {
    avatar_url?: string | null
    username: string
    accent_color?: string | null
  }
  onPost: (post: FeedPost) => void
}

export default function CreatePostBox({ user, onPost }: CreatePostBoxProps) {
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const accentColor = user.accent_color ?? '#6B3FE0'

  async function handleImageUpload(files: FileList) {
    if (images.length + files.length > 4) {
      alert('Maximaal 4 afbeeldingen per post.')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach(f => formData.append('files', f))
      const res = await fetch('/api/feed/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (json.urls) setImages(prev => [...prev, ...json.urls])
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() && images.length === 0) return
    setLoading(true)
    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, images }),
      })
      const json = await res.json()
      if (json.data) {
        onPost(json.data)
        setContent('')
        setImages([])
        setExpanded(false)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-surface-2 border-2 flex-shrink-0"
          style={{ borderColor: accentColor }}>
          {user.avatar_url ? (
            <Image src={user.avatar_url} alt={user.username} fill sizes="40px" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-mono text-sm text-text-dim">
                {user.username?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            onFocus={() => setExpanded(true)}
            placeholder="Wat speelde je vandaag?"
            rows={expanded ? 3 : 1}
            maxLength={2000}
            className="w-full bg-void border border-border rounded-lg px-4 py-3 text-text text-sm font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors duration-200 resize-none"
          />

          {images.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden">
                  <Image src={img} alt="" fill sizes="64px" className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-void/80 rounded-full flex items-center justify-center text-white"
                  >
                    <X size={8} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {expanded && (
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={e => e.target.files && handleImageUpload(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading || images.length >= 4}
                  className="flex items-center gap-1 font-mono text-xs text-text-dim hover:text-text transition-colors disabled:opacity-40"
                >
                  <ImageIcon size={12} /> {uploading ? 'Uploaden...' : `${images.length}/4`}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setExpanded(false); setContent(''); setImages([]) }}
                  className="px-3 py-1.5 font-mono text-xs text-text-dim hover:text-text transition-colors"
                >
                  Annuleer
                </button>
                <button
                  type="submit"
                  disabled={loading || (!content.trim() && images.length === 0)}
                  className="px-4 py-1.5 bg-purple text-white font-mono text-xs rounded-lg hover:bg-purple/85 transition-colors disabled:opacity-40"
                >
                  {loading ? '...' : 'Posten'}
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
