'use client'

/**
 * /market/[category]/page.tsx — single-category browse with full filter bar.
 * URL category locks the cat filter; FilterBar still allows game/price/sort/search.
 */
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import type { MarketCategory, MarketListing, Game } from '@/types'
import { MARKET_CATEGORIES } from '@/types'
import { MarketHero } from '@/components/market/MarketHero'
import { FilterBar, type MarketFilters } from '@/components/market/FilterBar'
import { ListingGrid } from '@/components/market/ListingGrid'
import { CATEGORY_FALLBACK_ICON } from '@/lib/market-utils'

const VALID: readonly MarketCategory[] = ['digital', 'services', 'gear', 'vault']

export default function MarketCategoryPage() {
  const params = useParams<{ category: string }>()
  const router = useRouter()
  const supabase = createClient()
  const cat = (params.category || '') as MarketCategory

  const [games, setGames] = useState<Game[]>([])
  const [listings, setListings] = useState<MarketListing[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<MarketFilters>({ search: '', sort: 'newest' })
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [authed, setAuthed] = useState(false)

  // Validate category early
  useEffect(() => {
    if (!VALID.includes(cat)) {
      router.replace('/market')
    }
  }, [cat, router])

  useEffect(() => {
    if (!VALID.includes(cat)) return
    void loadGames()
    void loadSaved()
  }, [])

  async function loadSaved() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setAuthed(true)
    const { data } = await supabase
      .from('market_wishlists')
      .select('listing_id')
      .eq('user_id', user.id)
    if (data) setSavedIds(new Set(data.map(r => r.listing_id)))
  }

  useEffect(() => {
    if (!VALID.includes(cat)) return
    void loadListings()
  }, [cat, filters.game_id, filters.sort, filters.min, filters.max])

  // Debounce search input only
  useEffect(() => {
    if (!VALID.includes(cat)) return
    const t = setTimeout(() => { void loadListings() }, 250)
    return () => clearTimeout(t)
  }, [filters.search])

  async function loadGames() {
    const { data } = await supabase.from('games').select('*').eq('is_approved', true).order('name')
    if (data) setGames(data as Game[])
  }

  async function loadListings() {
    setLoading(true)
    try {
      let q = supabase
        .from('market_listings')
        .select('*, seller:market_sellers(*, profile:profiles(username, display_name)), game:games(id,name,slug)')
        .eq('status', 'active')
        .eq('category', cat)

      if (filters.game_id) q = q.eq('game_id', filters.game_id)
      if (filters.min !== undefined) q = q.gte('price', filters.min)
      if (filters.max !== undefined) q = q.lte('price', filters.max)
      if (filters.search.trim()) {
        const s = filters.search.trim().replace(/[%]/g, '')
        q = q.or(`title.ilike.%${s}%,description.ilike.%${s}%`)
      }

      switch (filters.sort) {
        case 'price_asc':
          q = q.order('price', { ascending: true })
          break
        case 'price_desc':
          q = q.order('price', { ascending: false })
          break
        case 'rep':
          // Sort by created_at as proxy; rep is on related table — we sort client-side
          q = q.order('created_at', { ascending: false })
          break
        default:
          q = q.order('created_at', { ascending: false })
      }

      const { data } = await q.limit(60)
      let rows = (data || []) as unknown as MarketListing[]
      if (filters.sort === 'rep') {
        rows = [...rows].sort((a, b) => Number(b.seller?.rep_score || 0) - Number(a.seller?.rep_score || 0))
      }
      setListings(rows)
    } catch (e) {
      console.error('Failed to load listings', e)
    } finally {
      setLoading(false)
    }
  }

  const meta = useMemo(() => MARKET_CATEGORIES[cat], [cat])
  if (!meta) return null

  const Icon = CATEGORY_FALLBACK_ICON

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-12">
      <MarketHero
        title={meta.label.toUpperCase()}
        subtitle={meta.blurb}
        compact
      />

      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="vs-counter text-[11px] tabular-nums">BROWSE / {meta.tag}</h2>
          <p className="text-lg font-medium tracking-wide mt-1 flex items-center gap-2">
            <Icon size={16} className="text-text-muted" /> {listings.length} listing{listings.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <FilterBar
        filters={{ ...filters, category: cat }}
        onChange={(next) => {
          // Lock category to URL — clicking another chip navigates instead
          if (next.category && next.category !== cat) {
            router.push(next.category === 'all' ? '/market' : `/market/${next.category}`)
            return
          }
          setFilters(next)
        }}
        games={games}
      />

      <ListingGrid
        listings={listings}
        loading={loading}
        showSaveHearts={authed}
        savedIds={savedIds}
        emptyTitle="No matching listings"
        emptyDescription="Try clearing filters or check back when sellers post."
      />
    </div>
  )
}
