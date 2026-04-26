/**
 * Single market listing card. Hover = purple glow + brackets.
 * Truncate titel max 2 regels, prijs cyan-bold.
 */
import Link from 'next/link'
import Image from 'next/image'
import { ShieldCheck, AlertTriangle, Heart } from 'lucide-react'
import { useState } from 'react'
import type { MarketListing } from '@/types'
import { MARKET_CATEGORIES } from '@/types'
import { formatPrice, CATEGORY_ICONS, categoryAccent } from '@/lib/market-utils'
import { SellerBadge } from './SellerBadge'
import { createClient } from '@/lib/supabase-browser'

interface ListingCardProps {
  listing: MarketListing
  size?: 'default' | 'compact'
  /** When true, show heart toggle. Pass initial state via `saved`. */
  savable?: boolean
  saved?: boolean
}

export function ListingCard({ listing, size = 'default', savable = false, saved = false }: ListingCardProps) {
  const cat = MARKET_CATEGORIES[listing.category]
  const accent = categoryAccent(listing.category)
  const Icon = CATEGORY_ICONS[listing.category]
  const thumb = listing.images?.[0]
  const isCompact = size === 'compact'
  const supabase = createClient()
  const [isSaved, setIsSaved] = useState(saved)
  const [savePending, setSavePending] = useState(false)

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (savePending) return
    setSavePending(true)
    const next = !isSaved
    setIsSaved(next)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setIsSaved(saved); return }
      if (next) {
        await supabase.from('market_wishlists').insert({ user_id: user.id, listing_id: listing.id })
      } else {
        await supabase.from('market_wishlists').delete().eq('user_id', user.id).eq('listing_id', listing.id)
      }
    } catch {
      setIsSaved(saved)
    } finally {
      setSavePending(false)
    }
  }

  return (
    <Link
      href={`/market/listing/${listing.id}`}
      className={`vs-brackets group relative flex flex-col rounded-xl bg-surface border border-border overflow-hidden transition-all hover:border-purple/50 hover:shadow-[0_0_20px_rgba(107,63,224,0.18)] ${
        isCompact ? 'w-60 shrink-0' : ''
      }`}
    >
      {/* Thumbnail / fallback */}
      <div className="relative aspect-[4/3] bg-surface-2 overflow-hidden">
        {thumb ? (
          <Image
            src={thumb}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
            unoptimized
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${accent.bg}`}>
            <Icon size={36} className={`${accent.text} opacity-60`} />
          </div>
        )}

        {/* Top-left: category */}
        <span className={`absolute top-2 left-2 vs-badge text-[9px] ${accent.bg} ${accent.text} border ${accent.border}`}>
          {cat.tag}
        </span>

        {/* Top-right: badges + heart */}
        <div className="absolute top-2 right-2 flex gap-1 items-start">
          {listing.void_verified && (
            <span className="vs-badge vs-badge-purple text-[9px]">
              <ShieldCheck size={9} /> VOID
            </span>
          )}
          {cat.highRisk && (
            <span className="vs-badge text-[9px] bg-danger/20 text-danger border border-danger/40">
              <AlertTriangle size={9} /> HIGH RISK
            </span>
          )}
          {savable && (
            <button
              onClick={toggleSave}
              aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
              className={`w-7 h-7 rounded-full bg-void/70 backdrop-blur flex items-center justify-center transition-all active:scale-90 ${
                isSaved ? 'text-danger' : 'text-white/80 hover:text-danger'
              }`}
            >
              <Heart size={13} fill={isSaved ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>

        {/* Stock indicator (gear/vault) */}
        {listing.stock > 0 && listing.stock < 5 && (
          <span className="absolute bottom-2 right-2 vs-counter text-[9px] tabular-nums text-warning bg-void/70 px-1.5 py-0.5 rounded">
            {String(listing.stock).padStart(2, '0')} LEFT
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="text-sm font-medium text-text leading-snug line-clamp-2 min-h-[2.4em] group-hover:text-purple-light transition-colors">
          {listing.title}
        </h3>

        <div className="flex items-end justify-between gap-2 mt-auto">
          <SellerBadge seller={listing.seller} />
          <p className="text-base font-semibold text-cyan tabular-nums shrink-0">
            {formatPrice(listing.price, listing.currency)}
          </p>
        </div>

        {listing.game?.name && (
          <span className="vs-counter text-[9px] text-text-dim tabular-nums truncate">
            {listing.game.name.toUpperCase()}
          </span>
        )}
      </div>
    </Link>
  )
}
