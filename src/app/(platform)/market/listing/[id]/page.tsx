'use client'

/**
 * /market/listing/[id]/page.tsx
 * Loads listing + seller profile + reviews + 4 related listings.
 */
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import type { MarketListing, MarketReview, Profile } from '@/types'
import { ScopeSpinner } from '@/components/ui/loader'
import { EmptyState } from '@/components/ui/empty-state'
import { ListingDetail } from '@/components/market/ListingDetail'
import { ChevronLeft, ShoppingBag } from 'lucide-react'

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [listing, setListing] = useState<MarketListing | null>(null)
  const [reviews, setReviews] = useState<(MarketReview & { reviewer?: Profile })[]>([])
  const [related, setRelated] = useState<MarketListing[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isOwn, setIsOwn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => { void load() }, [params.id])

  async function load() {
    setLoading(true)
    setNotFound(false)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id ?? null)

      const { data: l } = await supabase
        .from('market_listings')
        .select(`
          *,
          seller:market_sellers(*, profile:profiles(*)),
          game:games(id,name,slug)
        `)
        .eq('id', params.id)
        .maybeSingle()

      if (!l) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const listing = l as unknown as MarketListing
      setListing(listing)
      const ownsIt = !!user && listing.seller?.user_id === user.id
      setIsOwn(ownsIt)

      // Reviews + related in parallel
      const [{ data: revs }, { data: rel }] = await Promise.all([
        supabase
          .from('market_reviews')
          .select('*, reviewer:profiles(id, username, display_name, avatar_url)')
          .eq('seller_id', listing.seller_id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('market_listings')
          .select('*, seller:market_sellers(*, profile:profiles(username, display_name)), game:games(id,name,slug)')
          .eq('status', 'active')
          .eq('category', listing.category)
          .neq('id', listing.id)
          .order('created_at', { ascending: false })
          .limit(4),
      ])
      setReviews((revs || []) as unknown as (MarketReview & { reviewer?: Profile })[])
      setRelated((rel || []) as unknown as MarketListing[])
    } catch (e) {
      console.error('Failed to load listing', e)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ScopeSpinner size={28} />
      </div>
    )
  }

  if (notFound || !listing) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <EmptyState
          icon={ShoppingBag}
          title="Listing not found"
          description="It may have been removed or sold."
          cta={{ label: 'Back to market', href: '/market' }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-fade-in">
      <Link
        href="/market"
        className="inline-flex items-center gap-1 text-xs text-text-dim hover:text-text-muted transition-colors mb-3"
      >
        <ChevronLeft size={14} /> Back to market
      </Link>
      <ListingDetail
        listing={listing}
        reviews={reviews}
        related={related}
        currentUserId={currentUserId}
        isOwnListing={isOwn}
      />
    </div>
  )
}
