'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Pin, Lock, MessageSquare, Eye, Plus } from 'lucide-react'

interface ThreadRow {
  id: string
  title: string
  body: string | null
  is_pinned: boolean
  is_locked: boolean
  reply_count: number
  view_count: number
  last_reply_at: string | null
  created_at: string
  author: {
    id: string
    username: string
    display_name?: string | null
    avatar_url?: string | null
    accent_color?: string | null
    level_name?: string
  } | null
}

interface ForumCategoryLite {
  id: string
  name: string
  slug: string
  thread_count: number
}

interface Pagination {
  page: number
  total: number
  pageSize: number
}

interface Props {
  category: ForumCategoryLite | null
  threads: ThreadRow[]
  pagination: Pagination
  onPageChange: (page: number) => void
}

function formatTime(iso: string | null): string {
  if (!iso) return 'onbekend'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'nu'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}u`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  const w = Math.floor(d / 7)
  return `${w}w`
}

export default function GameForumTab({ category, threads, pagination, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize))

  if (!category) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <MessageSquare size={32} className="text-text-dim/40 mx-auto mb-3" />
        <p className="font-mono text-sm text-text-dim">
          Geen forum categorie voor dit game.
        </p>
        <p className="font-mono text-xs text-text-muted mt-2">
          Een admin moet dit nog aanmaken.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-[11px] tracking-[0.18em] uppercase text-purple">
            {category.name}
          </h2>
          <p className="font-mono text-[10px] text-text-muted mt-0.5">
            {pagination.total.toLocaleString()} threads
          </p>
        </div>
        <Link
          href={`/forum/${category.slug}?new=1`}
          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg border border-purple/40 text-purple hover:bg-purple/10 transition-colors duration-200"
        >
          <Plus size={12} />
          Nieuwe thread
        </Link>
      </div>

      {threads.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="font-mono text-sm text-text-dim">
            Nog geen threads. Start de eerste discussie.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden divide-y divide-border">
          {threads.map((t) => {
            const accent = t.author?.accent_color ?? '#6B3FE0'
            return (
              <Link
                key={t.id}
                href={`/forum/${category.slug}/${t.id}`}
                className="flex items-start gap-3 px-5 py-4 hover:bg-surface-2 transition-colors duration-200"
              >
                <div
                  className="w-9 h-9 rounded-full overflow-hidden bg-surface-2 border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: accent }}
                >
                  {t.author?.avatar_url ? (
                    <Image
                      src={t.author.avatar_url}
                      alt={t.author.username}
                      width={36}
                      height={36}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="font-mono text-sm font-bold" style={{ color: accent }}>
                      {t.author?.username[0].toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    {t.is_pinned && <Pin size={10} className="text-cyan" />}
                    {t.is_locked && <Lock size={10} className="text-warning" />}
                    <span className="font-mono text-sm font-bold text-text line-clamp-1">
                      {t.title}
                    </span>
                  </div>
                  {t.body && (
                    <p className="text-xs text-text-muted line-clamp-1 mb-1.5">{t.body}</p>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-[10px] text-text-muted">
                      {t.author?.display_name ?? t.author?.username}
                    </span>
                    {t.author?.level_name && (
                      <span className="font-mono text-[9px] text-text-dim">
                        {t.author.level_name}
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-text-dim">
                      · {formatTime(t.created_at)} geleden
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 justify-end mb-1">
                    <MessageSquare size={10} className="text-text-dim" />
                    <span className="font-mono text-[11px] font-bold text-text">
                      {t.reply_count}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <Eye size={10} className="text-text-dim" />
                    <span className="font-mono text-[10px] text-text-muted">{t.view_count}</span>
                  </div>
                  {t.last_reply_at && (
                    <p className="font-mono text-[9px] text-text-dim mt-1">
                      {formatTime(t.last_reply_at)} geleden
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}

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
