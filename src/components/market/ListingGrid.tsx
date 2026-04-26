'use client'

/**
 * Grid van ListingCards met losse loading-state.
 * Empty + loading worden hier afgehandeld; pagination ligt buiten.
 */
import { ShoppingBag } from 'lucide-react'
import type { MarketListing } from '@/types'
import { ListingCard } from './ListingCard'
import { ScopeSpinner } from '@/components/ui/loader'
import { EmptyState } from '@/components/ui/empty-state'

interface ListingGridProps {
  listings: MarketListing[]
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyCta?: { label: string; href?: string; onClick?: () => void }
  /** Set of listing-IDs that the current user has saved. */
  savedIds?: Set<string>
  showSaveHearts?: boolean
}

export function ListingGrid({
  listings,
  loading,
  emptyTitle = 'No listings yet',
  emptyDescription = 'Check back soon — drops happen daily.',
  emptyCta,
  savedIds,
  showSaveHearts = false,
}: ListingGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <ScopeSpinner size={28} />
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title={emptyTitle}
        description={emptyDescription}
        cta={emptyCta}
      />
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {listings.map(l => (
        <ListingCard
          key={l.id}
          listing={l}
          savable={showSaveHearts}
          saved={savedIds?.has(l.id) ?? false}
        />
      ))}
    </div>
  )
}

/**
 * Horizontal scroll variant for "Recent drops" / "Related listings" rows.
 */
export function ListingRow({
  listings,
  loading,
}: { listings: MarketListing[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <ScopeSpinner size={24} />
      </div>
    )
  }
  if (listings.length === 0) return null
  return (
    <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1">
      {listings.map(l => (
        <ListingCard key={l.id} listing={l} size="compact" />
      ))}
    </div>
  )
}
