'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ThreadRow, { type ThreadRowData } from '@/components/forums/ThreadRow'

const PAGE_SIZE = 20

interface CategoryData {
  id: string
  name: string
  slug: string
  description: string | null
}

export default function CategoryPage() {
  const params = useParams()
  const router = useRouter()
  const slug = (params?.categorySlug as string) ?? ''

  const [category, setCategory] = useState<CategoryData | null>(null)
  const [pinned, setPinned] = useState<ThreadRowData[]>([])
  const [threads, setThreads] = useState<ThreadRowData[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchThreads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/forums/${slug}?page=${page}`)
      const json = await res.json()
      if (json.error) { router.push('/forums'); return }
      setCategory(json.category)
      setPinned(json.pinned ?? [])
      setThreads(json.threads ?? [])
      setTotal(json.pagination?.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [slug, page, router])

  useEffect(() => { fetchThreads() }, [fetchThreads])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/forums" className="font-mono text-xs text-text-dim hover:text-text transition-colors">
          Forums
        </Link>
        <span className="text-text-dim/60 font-mono text-xs">→</span>
        <span className="font-mono text-xs text-text">{category?.name ?? '...'}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-mono text-2xl font-bold text-text mb-1">{category?.name}</h1>
          {category?.description && (
            <p className="text-text-dim text-sm">{category.description}</p>
          )}
        </div>
        <Link
          href={`/forums/${slug}/new`}
          className="px-5 py-2.5 bg-purple text-white font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-purple/85 transition-colors flex-shrink-0"
        >
          + Nieuwe thread
        </Link>
      </div>

      {loading ? (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse flex gap-4 px-5 py-4 border-b border-border">
              <div className="w-9 h-9 rounded-full bg-surface-2" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-48 bg-surface-2 rounded" />
                <div className="h-2 w-24 bg-surface-2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : threads.length === 0 && pinned.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl text-center py-16">
          <p className="font-mono text-[10px] tracking-[0.2em] text-text-dim/60 uppercase mb-3">Leeg</p>
          <p className="text-text-dim text-sm mb-6">Nog geen threads. Start de discussie.</p>
          <Link
            href={`/forums/${slug}/new`}
            className="px-5 py-2.5 bg-purple text-white font-mono text-sm rounded-lg hover:bg-purple/85 transition-colors"
          >
            + Nieuwe thread
          </Link>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {pinned.map(thread => (
            <ThreadRow key={thread.id} thread={thread} categorySlug={slug} />
          ))}
          {threads.map(thread => (
            <ThreadRow key={thread.id} thread={thread} categorySlug={slug} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-border text-text-dim font-mono text-xs rounded-lg hover:border-purple hover:text-text transition-colors duration-200 disabled:opacity-30"
          >
            ← Vorige
          </button>
          <span className="font-mono text-xs text-text-dim">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-border text-text-dim font-mono text-xs rounded-lg hover:border-purple hover:text-text transition-colors duration-200 disabled:opacity-30"
          >
            Volgende →
          </button>
        </div>
      )}
    </div>
  )
}
