/**
 * Seller verified badge + rep score sterren.
 * Compact (in card) of expanded (in detail page).
 */
import { Shield, Star } from 'lucide-react'
import type { MarketSeller } from '@/types'

interface SellerBadgeProps {
  seller?: MarketSeller & { profile?: { username?: string; display_name?: string | null } }
  variant?: 'compact' | 'expanded'
  showSales?: boolean
}

export function SellerBadge({ seller, variant = 'compact', showSales = false }: SellerBadgeProps) {
  if (!seller) return null
  const isVerified = !!seller.verified_at
  const username = seller.profile?.display_name || seller.profile?.username || 'Unknown'
  const rep = Number(seller.rep_score) || 0

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-text-dim min-w-0">
        <span className="truncate">@{seller.profile?.username || 'unknown'}</span>
        {isVerified && <Shield size={9} className="text-cyan shrink-0" />}
        {rep > 0 && (
          <span className="flex items-center gap-0.5 tabular-nums shrink-0">
            <Star size={9} fill="currentColor" className="text-warning" />
            {rep.toFixed(1)}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-medium text-text">{username}</span>
      {isVerified && (
        <span className="vs-badge vs-badge-cyan text-[9px]">
          <Shield size={9} /> Verified Seller
        </span>
      )}
      {rep > 0 && (
        <span className="flex items-center gap-1 text-warning text-xs tabular-nums">
          <Star size={11} fill="currentColor" />
          {rep.toFixed(2)}
        </span>
      )}
      {showSales && seller.total_sales > 0 && (
        <span className="vs-counter text-[10px] text-text-dim tabular-nums">
          {String(seller.total_sales).padStart(3, '0')} SALES
        </span>
      )}
    </div>
  )
}
