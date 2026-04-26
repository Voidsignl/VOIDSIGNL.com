'use client'

/**
 * Order summary card. Shows status badge, listing snapshot, and the
 * "Confirm receipt" button when buyer side is in delivered/paid state.
 */
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import {
  CheckCircle2, Clock, Truck, AlertOctagon, Undo2, Lock, Star, X,
  type LucideIcon,
} from 'lucide-react'
import type { MarketOrder, OrderStatus } from '@/types'
import { formatPrice, categoryAccent, CATEGORY_ICONS } from '@/lib/market-utils'
import { createClient } from '@/lib/supabase-browser'
import { Sheet } from '@/components/ui/sheet'

interface OrderCardProps {
  order: MarketOrder
  perspective: 'buyer' | 'seller'
  onConfirmed?: () => void
}

const STATUS_CFG: Record<OrderStatus, { icon: LucideIcon; tone: string; label: string }> = {
  pending:   { icon: Clock,        tone: 'vs-badge-warning', label: 'Pending payment' },
  paid:      { icon: Lock,         tone: 'vs-badge-cyan',    label: 'Paid · in escrow' },
  delivered: { icon: Truck,        tone: 'vs-badge-cyan',    label: 'Delivered' },
  confirmed: { icon: CheckCircle2, tone: 'vs-badge-success', label: 'Confirmed' },
  disputed:  { icon: AlertOctagon, tone: 'vs-badge-danger',  label: 'Disputed' },
  refunded:  { icon: Undo2,        tone: 'vs-badge-danger',  label: 'Refunded' },
}

export function OrderCard({ order, perspective, onConfirmed }: OrderCardProps) {
  const supabase = createClient()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewBody, setReviewBody] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)

  const cfg = STATUS_CFG[order.status]
  const StatusIcon = cfg.icon
  const listing = order.listing
  const accent = listing ? categoryAccent(listing.category) : null
  const Icon = listing ? CATEGORY_ICONS[listing.category] : null

  const canConfirm =
    perspective === 'buyer' && (order.status === 'paid' || order.status === 'delivered')

  async function handleConfirm() {
    setConfirming(true)
    setError(null)
    try {
      const { error: e } = await supabase.rpc('confirm_market_order', { p_order_id: order.id })
      if (e) throw e
      onConfirmed?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not confirm')
    } finally {
      setConfirming(false)
    }
  }

  async function submitReview() {
    setReviewSubmitting(true)
    try {
      const direction = perspective === 'buyer' ? 'buyer_to_seller' : 'seller_to_buyer'
      const { error: e } = await supabase.from('market_reviews').insert({
        order_id: order.id,
        reviewer_id: order.buyer_id, // server enforces auth.uid via RLS, but for buyer this matches
        seller_id: order.seller_id,
        buyer_id: order.buyer_id,
        rating: reviewRating,
        body: reviewBody.trim() || null,
        direction,
      })
      // RLS will reject if reviewer_id != auth.uid for cross-perspective; we
      // need to actually use the current user's id. Use an RPC-less workaround:
      if (e) {
        // Re-fetch user and retry once with correct reviewer_id
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { error: e2 } = await supabase.from('market_reviews').insert({
            order_id: order.id,
            reviewer_id: user.id,
            seller_id: order.seller_id,
            buyer_id: order.buyer_id,
            rating: reviewRating,
            body: reviewBody.trim() || null,
            direction,
          })
          if (e2) throw e2
        } else {
          throw e
        }
      }
      setHasReviewed(true)
      setTimeout(() => setReviewOpen(false), 1200)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Review failed')
    } finally {
      setReviewSubmitting(false)
    }
  }

  const canReview = order.status === 'confirmed' && !hasReviewed

  return (
    <div className="vs-card flex gap-3 sm:gap-4 items-stretch">
      {/* Thumb */}
      {listing && (
        <Link
          href={`/market/listing/${listing.id}`}
          className="relative w-20 sm:w-28 aspect-[4/3] rounded-lg overflow-hidden bg-surface-2 shrink-0"
        >
          {listing.images?.[0] ? (
            <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" sizes="120px" unoptimized />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${accent?.bg ?? ''}`}>
              {Icon && <Icon size={20} className={accent?.text} />}
            </div>
          )}
        </Link>
      )}

      {/* Body */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            {listing ? (
              <Link
                href={`/market/listing/${listing.id}`}
                className="text-sm font-medium hover:text-purple-light transition-colors line-clamp-1"
              >
                {listing.title}
              </Link>
            ) : (
              <p className="text-sm font-medium">Unknown listing</p>
            )}
            <span className={`vs-badge text-[9px] shrink-0 ${cfg.tone}`}>
              <StatusIcon size={9} /> {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-text-dim flex-wrap">
            <span className="vs-counter tabular-nums">
              ORDER · {order.id.slice(0, 8).toUpperCase()}
            </span>
            <span className="vs-counter tabular-nums">
              {new Date(order.created_at).toLocaleDateString('en', {
                month: 'short', day: 'numeric', year: 'numeric',
              }).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between mt-2 gap-2">
          <div className="text-xs">
            <p className="text-text-muted tabular-nums">
              Amount: <span className="text-text font-medium">{formatPrice(order.amount)}</span>
            </p>
            {perspective === 'seller' && order.status === 'confirmed' && (
              <p className="text-success text-[11px] tabular-nums mt-0.5">
                Payout: {formatPrice(order.seller_payout)}
              </p>
            )}
            {perspective === 'seller' && order.status !== 'confirmed' && (
              <p className="text-text-dim text-[10px] tabular-nums mt-0.5">
                Net payout: {formatPrice(order.seller_payout)} (fee {formatPrice(order.commission)})
              </p>
            )}
          </div>
          {canConfirm && (
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="vs-btn vs-btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
            >
              {confirming ? 'Confirming...' : <><CheckCircle2 size={13} /> CONFIRM RECEIPT</>}
            </button>
          )}
          {canReview && (
            <button
              onClick={() => setReviewOpen(true)}
              className="vs-btn vs-btn-ghost text-xs px-3 py-1.5"
            >
              <Star size={13} /> {perspective === 'buyer' ? 'Review seller' : 'Review buyer'}
            </button>
          )}
        </div>
        {error && <p className="text-[11px] text-danger mt-1">{error}</p>}
      </div>

      {/* Review sheet */}
      <Sheet
        open={reviewOpen}
        onClose={() => !reviewSubmitting && setReviewOpen(false)}
        maxWidth="max-w-sm"
        title={
          <span className="flex items-center gap-2">
            <Star size={16} className="text-warning" />
            {perspective === 'buyer' ? 'Review seller' : 'Review buyer'}
          </span>
        }
      >
        <div className="p-4 space-y-4">
          {hasReviewed ? (
            <div className="text-center py-6">
              <CheckCircle2 size={28} className="text-success mx-auto mb-2" />
              <p className="text-sm font-medium">Review submitted</p>
            </div>
          ) : (
            <>
              <div>
                <label className="vs-label block mb-2">RATING</label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setReviewRating(n)}
                      className="active:scale-90 transition-transform"
                      aria-label={`${n} stars`}
                    >
                      <Star
                        size={28}
                        fill={n <= reviewRating ? '#FBBF24' : 'none'}
                        className={n <= reviewRating ? 'text-yellow-400' : 'text-text-dim'}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="vs-label block mb-1">COMMENT (OPTIONAL)</label>
                <textarea
                  value={reviewBody}
                  onChange={e => setReviewBody(e.target.value)}
                  placeholder={perspective === 'buyer' ? 'How was the seller?' : 'How was the buyer?'}
                  maxLength={2000}
                  className="vs-input text-sm resize-none min-h-[80px]"
                />
              </div>
              <button
                onClick={submitReview}
                disabled={reviewSubmitting}
                className="vs-btn vs-btn-primary text-sm w-full disabled:opacity-50"
              >
                {reviewSubmitting ? 'Submitting...' : 'Submit review'}
              </button>
            </>
          )}
        </div>
      </Sheet>
    </div>
  )
}
