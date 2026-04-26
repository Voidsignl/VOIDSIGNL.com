'use client'

/**
 * /market/saved — wishlist of the current user.
 */
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import type { MarketListing } from '@/types'
import { Heart, Lock, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { ScopeSpinner } from '@/components/ui/loader'
import { EmptyState } from '@/components/ui/empty-state'
import { ListingGrid } from '@/components/market/ListingGrid'

export default function SavedListingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<MarketListing[]>([])
  const [authed, setAuthed] = useState<string | null>(null)

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setAuthed(user.id)

      const { data } = await supabase
        .from('market_wishlists')
        .select(`
          listing:market_listings(
            *,
            seller:market_sellers(*, profile:profiles(username, display_name)),
            game:games(id,name,slug)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const rows = (data || [])
        .map((r: { listing: unknown }) => r.listing)
        .filter(Boolean) as unknown as MarketListing[]
      setListings(rows)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><ScopeSpinner size={28} /></div>
  }

  if (!authed) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <EmptyState
          icon={Lock}
          title="Sign in to view saved listings"
          cta={{ label: 'Sign in', href: '/login' }}
        />
      </div>
    )
  }

  const savedIds = new Set(listings.map(l => l.id))

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-fade-in">
      <Link
        href="/market"
        className="inline-flex items-center gap-1 text-xs text-text-dim hover:text-text-muted transition-colors mb-3"
      >
        <ChevronLeft size={14} /> Back to market
      </Link>

      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="vs-counter text-[11px] tabular-nums">SAVED LISTINGS</p>
          <h1 className="text-2xl font-semibold mt-1 tracking-wide flex items-center gap-2">
            <Heart size={20} className="text-danger" fill="currentColor" />
            Wishlist
            {listings.length > 0 && (
              <span className="vs-counter text-[11px] text-text-dim tabular-nums ml-1">
                {String(listings.length).padStart(2, '0')}
              </span>
            )}
          </h1>
        </div>
      </div>

      <ListingGrid
        listings={listings}
        showSaveHearts
        savedIds={savedIds}
        emptyTitle="No saved listings yet"
        emptyDescription="Tap the heart on any listing to save it for later."
        emptyCta={{ label: 'Browse market', href: '/market' }}
      />
    </div>
  )
}
