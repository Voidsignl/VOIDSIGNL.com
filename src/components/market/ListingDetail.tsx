'use client'

/**
 * Listing detail block + buy flow + reviews.
 * Buy is currently a placeholder (Stripe coming soon) but creates a pending order
 * via RPC `create_market_order` so flow is testable end-to-end.
 */
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import {
  ShieldCheck, AlertTriangle, Lock, Star, ChevronLeft, ChevronRight,
  ShoppingBag, Cpu, Wrench, Box, KeyRound, Info, X, ExternalLink
} from 'lucide-react'
import type { MarketListing, MarketReview, Profile } from '@/types'
import { MARKET_CATEGORIES } from '@/types'
import { categoryAccent, formatPrice } from '@/lib/market-utils'
import { Avatar } from '@/components/ui/avatar'
import { SellerBadge } from './SellerBadge'

const CATEGORY_ICON_MAP = { digital: Cpu, services: Wrench, gear: Box, vault: KeyRound }

interface ListingDetailProps {
  listing: MarketListing
  reviews: (MarketReview & { reviewer?: Profile })[]
  related: MarketListing[]
  currentUserId: string | null
  isOwnListing: boolean
}

export function ListingDetail({ listing, reviews, related, currentUserId, isOwnListing }: ListingDetailProps) {
  const router = useRouter()
  const supabase = createClient()
  const [galleryIdx, setGalleryIdx] = useState(0)
  const [buyOpen, setBuyOpen] = useState(false)
  const [buying, setBuying] = useState(false)
  const [buyError, setBuyError] = useState<string | null>(null)

  const cat = MARKET_CATEGORIES[listing.category]
  const accent = categoryAccent(listing.category)
  const Icon = CATEGORY_ICON_MAP[listing.category]
  const images = listing.images?.filter(Boolean) || []
  const hasMultiple = images.length > 1

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  }, [reviews])

  const escrowed = listing.category === 'gear' || listing.category === 'vault'

  async function handleBuy() {
    if (!currentUserId) {
      router.push('/login')
      return
    }
    setBuying(true)
    setBuyError(null)
    try {
      const { data: orderId, error } = await supabase.rpc('create_market_order', {
        p_listing_id: listing.id,
      })
      if (error) {
        setBuyError(error.message || 'Could not create order')
        return
      }
      if (orderId) {
        // Stripe placeholder — for now, show success and redirect to orders.
        router.push('/market/orders')
      }
    } catch (e) {
      setBuyError(e instanceof Error ? e.message : 'Order failed')
    } finally {
      setBuying(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 animate-fade-in">
      {/* LEFT — gallery + description */}
      <div className="space-y-4">
        {/* Gallery */}
        <div className="vs-card vs-lit overflow-hidden p-0">
          <div className="relative aspect-[16/10] bg-surface-2">
            {images[galleryIdx] ? (
              <Image
                src={images[galleryIdx]}
                alt={listing.title}
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${accent.bg}`}>
                <Icon size={64} className={`${accent.text} opacity-50`} />
              </div>
            )}
            {hasMultiple && (
              <>
                <button
                  onClick={() => setGalleryIdx((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-void/70 backdrop-blur flex items-center justify-center text-white hover:bg-void/90 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setGalleryIdx((i) => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-void/70 backdrop-blur flex items-center justify-center text-white hover:bg-void/90 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
                <span className="absolute bottom-3 right-3 vs-counter text-[10px] text-white bg-void/70 px-2 py-1 rounded tabular-nums">
                  {String(galleryIdx + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
                </span>
              </>
            )}
          </div>
          {hasMultiple && (
            <div className="flex gap-2 overflow-x-auto p-3 scrollbar-hide">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  onClick={() => setGalleryIdx(i)}
                  className={`relative w-16 h-12 rounded-md overflow-hidden border-2 shrink-0 transition-all ${
                    i === galleryIdx ? 'border-purple-light' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image src={src} alt="" fill className="object-cover" sizes="64px" unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="vs-card">
          <p className="vs-label mb-2">DESCRIPTION</p>
          {listing.description ? (
            <p className="text-sm text-text/85 whitespace-pre-wrap leading-relaxed">{listing.description}</p>
          ) : (
            <p className="text-sm text-text-dim italic">No description provided.</p>
          )}
          {listing.tags && listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {listing.tags.map(tag => (
                <span key={tag} className="vs-badge text-[10px] bg-surface-2 text-text-muted border border-border">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="vs-card vs-lit">
          <div className="flex items-center justify-between mb-4">
            <p className="vs-label">REVIEWS</p>
            {avgRating > 0 && (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-warning text-sm tabular-nums">
                  <Star size={14} fill="currentColor" /> {avgRating.toFixed(2)}
                </span>
                <span className="vs-counter text-[10px] text-text-dim tabular-nums">
                  {String(reviews.length).padStart(2, '0')} REVIEWS
                </span>
              </div>
            )}
          </div>
          {reviews.length === 0 ? (
            <p className="text-xs text-text-dim italic">No reviews yet — be the first after purchase.</p>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 8).map(r => (
                <div key={r.id} className="flex gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                  <Avatar
                    url={r.reviewer?.avatar_url}
                    name={r.reviewer?.display_name || r.reviewer?.username}
                    size="sm"
                    variant="gradient"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">{r.reviewer?.display_name || r.reviewer?.username || 'Member'}</span>
                      <span className="flex items-center gap-0.5 text-warning text-[11px] tabular-nums">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} size={10} fill="currentColor" />
                        ))}
                      </span>
                      <span className="vs-counter text-[9px] text-text-dim ml-auto tabular-nums">
                        {new Date(r.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    {r.body && <p className="text-xs text-text/80 leading-relaxed">{r.body}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div>
            <p className="vs-label mb-3">RELATED</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {related.map(r => (
                <Link key={r.id} href={`/market/listing/${r.id}`}
                  className="vs-card p-2 hover:border-purple/40 transition-colors">
                  <div className="aspect-[4/3] rounded bg-surface-2 mb-2 overflow-hidden relative">
                    {r.images?.[0] ? (
                      <Image src={r.images[0]} alt={r.title} fill sizes="200px" className="object-cover" unoptimized />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${categoryAccent(r.category).bg}`}>
                        <ShoppingBag size={20} className={categoryAccent(r.category).text} />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium truncate">{r.title}</p>
                  <p className="text-xs text-cyan tabular-nums mt-0.5">{formatPrice(r.price, r.currency)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT — buy panel */}
      <aside className="space-y-3 lg:sticky lg:top-4 self-start">
        <div className="vs-card vs-lit">
          {/* Top row */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`vs-badge text-[9px] ${accent.bg} ${accent.text} border ${accent.border}`}>
              {cat.tag}
            </span>
            {listing.void_verified && (
              <span className="vs-badge vs-badge-purple text-[9px]">
                <ShieldCheck size={9} /> VOID VERIFIED
              </span>
            )}
            {cat.highRisk && (
              <span className="vs-badge text-[9px] bg-danger/20 text-danger border border-danger/40">
                <AlertTriangle size={9} /> HIGH RISK
              </span>
            )}
          </div>

          <h1 className="text-xl md:text-2xl font-semibold tracking-wide leading-snug mb-2">{listing.title}</h1>

          {listing.game?.name && (
            <p className="vs-counter text-[10px] text-text-dim mb-3 tabular-nums">
              {listing.game.name.toUpperCase()}
            </p>
          )}

          <div className="flex items-end justify-between mb-4">
            <p className="text-3xl font-bold text-cyan tabular-nums">{formatPrice(listing.price, listing.currency)}</p>
            {listing.stock > 0 && listing.stock <= 9 && (
              <span className="vs-counter text-[10px] text-warning tabular-nums">
                {String(listing.stock).padStart(2, '0')} IN STOCK
              </span>
            )}
          </div>

          {/* Action */}
          {isOwnListing ? (
            <button
              disabled
              className="w-full vs-btn vs-btn-ghost text-sm cursor-not-allowed opacity-60"
            >
              <Info size={14} /> This is your listing
            </button>
          ) : listing.stock <= 0 || listing.status !== 'active' ? (
            <button disabled className="w-full vs-btn vs-btn-ghost text-sm cursor-not-allowed opacity-60">
              Sold out
            </button>
          ) : (
            <button
              onClick={() => setBuyOpen(true)}
              className="w-full vs-btn vs-btn-primary text-sm"
            >
              <Lock size={14} /> BUY NOW
            </button>
          )}

          {/* Escrow note for gear/vault */}
          {escrowed && (
            <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/25 flex gap-2">
              <Lock size={14} className="text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-medium text-warning">ESCROW PROTECTED</p>
                <p className="text-[11px] text-text-muted leading-relaxed mt-1">
                  VOIDSIGNL holds your payment until you confirm receipt. Released only to seller after your confirmation.
                </p>
              </div>
            </div>
          )}
          {listing.category === 'digital' && (
            <p className="mt-3 text-[10px] text-text-dim leading-relaxed">
              Instant download available after payment confirmation.
            </p>
          )}
        </div>

        {/* Seller card */}
        <div className="vs-card">
          <p className="vs-label mb-3">SELLER</p>
          <div className="flex items-center gap-3">
            <Avatar
              url={(listing.seller?.profile as any)?.avatar_url}
              name={listing.seller?.profile?.display_name || listing.seller?.profile?.username}
              href={listing.seller?.profile?.username ? `/profile/${listing.seller.profile.username}` : undefined}
              size="md"
              variant="gradient"
              showInnerRing={!!(listing.seller?.profile as any)?.is_founding_member}
            />
            <div className="flex-1 min-w-0">
              {listing.seller?.profile?.username ? (
                <Link href={`/profile/${listing.seller.profile.username}`} className="text-sm font-medium hover:text-purple-light transition-colors">
                  {listing.seller.profile.display_name || listing.seller.profile.username}
                </Link>
              ) : (
                <p className="text-sm font-medium">Unknown seller</p>
              )}
              <SellerBadge seller={listing.seller} variant="expanded" showSales />
            </div>
          </div>
          {listing.seller?.profile?.username && (
            <Link
              href={`/profile/${listing.seller.profile.username}`}
              className="mt-3 block text-center vs-btn vs-btn-ghost text-xs"
            >
              <ExternalLink size={12} /> View profile
            </Link>
          )}
        </div>
      </aside>

      {/* Buy modal */}
      {buyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => !buying && setBuyOpen(false)}
        >
          <div
            className="vs-card vs-lit max-w-md w-full max-h-[90vh] overflow-y-auto animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="vs-label">CONFIRM PURCHASE</p>
              {!buying && (
                <button onClick={() => setBuyOpen(false)} className="text-text-dim hover:text-text">
                  <X size={16} />
                </button>
              )}
            </div>

            <h3 className="text-lg font-semibold mb-1 line-clamp-2">{listing.title}</h3>
            <p className="text-2xl font-bold text-cyan tabular-nums mb-4">{formatPrice(listing.price, listing.currency)}</p>

            <div className="space-y-2 text-xs text-text-muted leading-relaxed mb-4 p-3 rounded-lg bg-surface-2 border border-border">
              <div className="flex items-start gap-2">
                <Lock size={12} className="text-purple-light shrink-0 mt-0.5" />
                <p>Stripe payment integration is being finalized — your order is created in <span className="text-warning font-medium">pending</span> state and saved to your Orders page.</p>
              </div>
              {escrowed && (
                <p className="text-[11px]">Funds release to seller only after you confirm receipt.</p>
              )}
            </div>

            {buyError && (
              <p className="text-xs text-danger mb-3 p-2 bg-danger-dim rounded">{buyError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setBuyOpen(false)}
                disabled={buying}
                className="flex-1 vs-btn vs-btn-ghost text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleBuy}
                disabled={buying}
                className="flex-1 vs-btn vs-btn-primary text-sm"
              >
                {buying ? 'Processing...' : 'Place order'}
              </button>
            </div>

            <p className="vs-counter text-[9px] text-text-dim text-center mt-3 tabular-nums">
              STRIPE · COMING SOON
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
