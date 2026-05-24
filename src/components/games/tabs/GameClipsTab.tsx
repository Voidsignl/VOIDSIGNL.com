'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Play, Heart, Eye, Star } from 'lucide-react'

interface ClipRow {
  id: string
  title: string
  thumbnail_url: string | null
  source_type: string
  like_count: number
  view_count: number
  is_cotw: boolean
  created_at: string
  user: {
    id: string
    username: string
    display_name?: string | null
    avatar_url?: string | null
    accent_color?: string | null
  } | null
}

interface Pagination {
  page: number
  total: number
  pageSize: number
}

interface Props {
  clips: ClipRow[]
  pagination: Pagination
  onPageChange: (page: number) => void
}

export default function GameClipsTab({ clips, pagination, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize))

  if (clips.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <p className="font-mono text-sm text-text-dim">
          Nog geen clips voor dit game.
        </p>
        <Link
          href="/clips"
          className="inline-block mt-3 font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg border border-purple/40 text-purple hover:bg-purple/10 transition-colors duration-200"
        >
          Upload de eerste clip
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-[11px] tracking-[0.18em] uppercase text-purple">
          Top clips
        </h2>
        <span className="font-mono text-[10px] text-text-muted">
          {pagination.total.toLocaleString()} totaal
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {clips.map((clip) => {
          const accent = clip.user?.accent_color ?? '#6B3FE0'
          return (
            <Link
              key={clip.id}
              href={`/clips?clip=${clip.id}`}
              className="group bg-surface border border-border rounded-xl overflow-hidden hover:border-purple/40 transition-colors duration-200"
            >
              <div className="relative aspect-video bg-void overflow-hidden">
                {clip.thumbnail_url ? (
                  <Image
                    src={clip.thumbnail_url}
                    alt={clip.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play size={24} className="text-text-dim/60" />
                  </div>
                )}

                {clip.is_cotw && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan/20 border border-cyan/40 backdrop-blur-sm">
                    <Star size={9} className="text-cyan" />
                    <span className="font-mono text-[9px] uppercase tracking-widest text-cyan">
                      CotW
                    </span>
                  </div>
                )}

                <div className="absolute bottom-2 right-2 flex items-center gap-2 px-2 py-0.5 rounded-full bg-void/80 border border-border backdrop-blur-sm">
                  <span className="flex items-center gap-1 font-mono text-[9px] text-text">
                    <Heart size={9} /> {clip.like_count}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[9px] text-text-muted">
                    <Eye size={9} /> {clip.view_count}
                  </span>
                </div>
              </div>

              <div className="p-3">
                <p className="font-mono text-xs text-text line-clamp-2 mb-2 min-h-[2.5em]">
                  {clip.title}
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full overflow-hidden bg-surface-2 border flex items-center justify-center shrink-0"
                    style={{ borderColor: accent }}
                  >
                    {clip.user?.avatar_url ? (
                      <Image
                        src={clip.user.avatar_url}
                        alt={clip.user.username}
                        width={20}
                        height={20}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="font-mono text-[9px]" style={{ color: accent }}>
                        {clip.user?.username[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-text-muted truncate">
                    {clip.user?.display_name ?? clip.user?.username}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            disabled={pagination.page === 1}
            className="font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text hover:border-purple/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
          >
            ← Vorige
          </button>
          <span className="font-mono text-[10px] text-text-dim">
            {pagination.page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, pagination.page + 1))}
            disabled={pagination.page === totalPages}
            className="font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text hover:border-purple/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Volgende →
          </button>
        </div>
      )}
    </div>
  )
}
