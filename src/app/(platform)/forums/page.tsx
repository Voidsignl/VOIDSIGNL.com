'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CategoryCard, { type CategoryCardData } from '@/components/forums/CategoryCard'

interface SearchResult {
  id: string
  title: string
  reply_count: number
  category?: { name: string; slug: string } | null
}

export default function ForumsPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<CategoryCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])

  useEffect(() => {
    fetch('/api/forums')
      .then(r => r.json())
      .then(j => setCategories(j.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!search.trim() || search.length < 2) {
      setSearchResults([])
      return
    }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/forums/search?q=${encodeURIComponent(search)}`)
        const json = await res.json()
        setSearchResults(json.data ?? [])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-1">
          Community
        </p>
        <h1 className="font-mono text-3xl font-bold text-text mb-1">Forums</h1>
        <p className="text-text-dim text-sm">Discussieer met de community.</p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Zoek in forums..."
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text text-sm font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors"
        />
      </div>

      {search.length >= 2 && (
        <div className="mb-6">
          {searching ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-surface rounded-xl h-16" />
              ))}
            </div>
          ) : searchResults.length === 0 ? (
            <p className="text-text-dim font-mono text-sm text-center py-6">
              Geen resultaten voor &ldquo;{search}&rdquo;
            </p>
          ) : (
            <div className="space-y-2">
              <p className="font-mono text-[10px] text-text-dim uppercase tracking-wider mb-3">
                {searchResults.length} resultaten
              </p>
              {searchResults.map(thread => (
                <button
                  key={thread.id}
                  onClick={() => router.push(`/forums/${thread.category?.slug}/${thread.id}`)}
                  className="w-full text-left bg-surface border border-border rounded-xl px-4 py-3 hover:border-purple transition-all"
                >
                  <p className="font-mono text-sm font-bold text-text mb-0.5 truncate">
                    {thread.title}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-purple">
                      {thread.category?.name}
                    </span>
                    <span className="font-mono text-[10px] text-text-dim/60">
                      {thread.reply_count} replies
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!search && (
        loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-surface rounded-xl h-24" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map(cat => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        )
      )}
    </div>
  )
}
