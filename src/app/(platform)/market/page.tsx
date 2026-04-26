'use client'

/**
 * THE VOID MARKET — homepage.
 * Hero · CategoryGrid (with live counts) · "Recent Drops" row · "VOID Verified"
 * row · sticky SELL CTA (verified sellers only).
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import type { MarketListing, MarketCategory, MarketSeller } from '@/types'
import { Plus, Sparkles, ShieldCheck } from 'lucide-react'
import { MarketHero } from '@/components/market/MarketHero'
import { CategoryGrid } from '@/components/market/CategoryGrid'
import { ListingRow } from '@/components/market/ListingGrid'
import { ScopeSpinner } from '@/components/ui/loader'

export default function MarketHomePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [recent, setRecent] = useState<MarketListing[]>([])
  const [verified, setVerified] = useState<MarketListing[]>([])
  const [counts, setCounts] = useState<Partial<Record<MarketCategory, number>>>({})
  const [mySeller, setMySeller] = useState<MarketSeller | null>(null)
  const [totalActive, setTotalActive] = useState(0)

  useEffect(() => { init() }, [])

  async function init() {
    try {
      const [{ data: { user } }, recentRes, verifiedRes, countsRes] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('market_listings')
          .select('*, seller:market_sellers(*, profile:profiles(username, display_name)), game:games(id,name,slug)')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(8),
        supabase
          .from('market_listings')
          .select('*, seller:market_sellers(*, profile:profiles(username, display_name)), game:games(id,name,slug)')
          .eq('status', 'active')
          .eq('void_verified', true)
          .order('created_at', { ascending: false })
          .limit(8),
        supabase
          .from('market_listings')
          .select('category', { count: 'exact', head: false })
          .eq('status', 'active'),
      ])

      if (user) {
        const { data: sellerRow } = await supabase
          .from('market_sellers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        setMySeller(sellerRow as MarketSeller | null)
      }

      setRecent((recentRes.data || []) as unknown as MarketListing[])
      setVerified((verifiedRes.data || []) as unknown as MarketListing[])

      // Build category counts client-side (cheap; one query)
      const tally: Partial<Record<MarketCategory, number>> = {}
      ;(countsRes.data || []).forEach((row: { category: MarketCategory }) => {
        tally[row.category] = (tally[row.category] ?? 0) + 1
      })
      setCounts(tally)
      setTotalActive(countsRes.data?.length ?? 0)
    } catch (e) {
      console.error('Failed to load market homepage', e)
    } finally {
      setLoading(false)
    }
  }

  const isVerifiedSeller = !!mySeller?.verified_at

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-20">
      <MarketHero />

      {/* Section: Categories */}
      <div className="mb-8">
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="vs-counter text-[11px] tabular-nums">01 / CATEGORIES</h2>
            <p className="text-lg font-medium tracking-wide mt-1">Browse the vault</p>
          </div>
          <p className="vs-counter text-[10px] text-text-dim tabular-nums">
            {String(totalActive).padStart(3, '0')} ACTIVE
          </p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <ScopeSpinner size={28} />
          </div>
        ) : (
          <CategoryGrid counts={counts} />
        )}
      </div>

      {/* Section: Recent drops */}
      <div className="mb-8">
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="vs-counter text-[11px] tabular-nums">02 / RECENT DROPS</h2>
            <p className="text-lg font-medium tracking-wide mt-1 flex items-center gap-2">
              <Sparkles size={16} className="text-cyan" /> Newest listings
            </p>
          </div>
          <Link href="/market/digital" className="text-xs text-text-dim hover:text-text-muted">View all →</Link>
        </div>
        <ListingRow listings={recent} loading={loading} />
      </div>

      {/* Section: VOID verified */}
      {!loading && verified.length > 0 && (
        <div className="mb-8">
          <div className="flex items-end justify-between mb-3">
            <div>
              <h2 className="vs-counter text-[11px] tabular-nums text-purple">03 / VOID VERIFIED</h2>
              <p className="text-lg font-medium tracking-wide mt-1 flex items-center gap-2">
                <ShieldCheck size={16} className="text-purple-light" /> Curated by VOIDSIGNL
              </p>
            </div>
          </div>
          <ListingRow listings={verified} />
        </div>
      )}

      {/* Sticky sell CTA — verified sellers only */}
      {isVerifiedSeller && (
        <Link
          href="/market/sell"
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 vs-btn vs-btn-primary text-sm shadow-[0_0_24px_rgba(107,63,224,0.4)] animate-slide-up"
        >
          <Plus size={14} /> SELL ON VOID
        </Link>
      )}
      {/* Non-verified members: smaller link */}
      {!isVerifiedSeller && (
        <div className="mt-6 text-center">
          <Link href="/market/sell" className="text-xs text-text-dim hover:text-purple-light transition-colors">
            Want to sell on VOID? <span className="underline">Apply for seller access</span>
          </Link>
        </div>
      )}
    </div>
  )
}
