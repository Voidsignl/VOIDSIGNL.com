'use client'

/**
 * Order summary card. Shows status badge, listing snapshot, and the
 * "Confirm receipt" button when buyer side is in delivered/paid state.
 */
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import {
  CheckCircle2, Clock, Truck, AlertOctagon, Undo2, Lock,
  type LucideIcon,
} from 'lucide-react'
import type { MarketOrder, OrderStatus } from '@/types'
import { formatPrice, categoryAccent, CATEGORY_ICONS } from '@/lib/market-utils'
import { createClient } from '@/lib/supabase-browser'

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
        </div>
        {error && <p className="text-[11px] text-danger mt-1">{error}</p>}
      </div>
    </div>
  )
}
