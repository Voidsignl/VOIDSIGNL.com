'use client'

/**
 * /market/orders — buyer + seller tabs.
 * Buyer tab: own purchases.
 * Seller tab: incoming orders for own seller record.
 */
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import type { MarketOrder, MarketSeller } from '@/types'
import { Lock, Receipt, Inbox } from 'lucide-react'
import { ScopeSpinner } from '@/components/ui/loader'
import { EmptyState } from '@/components/ui/empty-state'
import { OrderCard } from '@/components/market/OrderCard'

type OrderTab = 'buyer' | 'seller'

export default function OrdersPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<OrderTab>('buyer')
  const [authed, setAuthed] = useState<string | null>(null)
  const [seller, setSeller] = useState<MarketSeller | null>(null)
  const [buyerOrders, setBuyerOrders] = useState<MarketOrder[]>([])
  const [sellerOrders, setSellerOrders] = useState<MarketOrder[]>([])

  useEffect(() => { void init() }, [])

  async function init() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setAuthed(user.id)

      const { data: sRow } = await supabase
        .from('market_sellers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      const sellerRow = (sRow as MarketSeller | null)
      setSeller(sellerRow)

      // Buyer orders
      const { data: bo } = await supabase
        .from('market_orders')
        .select('*, listing:market_listings(*, game:games(id,name))')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)
      setBuyerOrders((bo || []) as unknown as MarketOrder[])

      // Seller orders (only if user is a verified seller)
      if (sellerRow?.id && sellerRow.verified_at) {
        const { data: so } = await supabase
          .from('market_orders')
          .select('*, listing:market_listings(*, game:games(id,name)), buyer:profiles!buyer_id(id, username, display_name, avatar_url)')
          .eq('seller_id', sellerRow.id)
          .order('created_at', { ascending: false })
          .limit(100)
        setSellerOrders((so || []) as unknown as MarketOrder[])
      }
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
          title="Sign in to see your orders"
          cta={{ label: 'Sign in', href: '/login' }}
        />
      </div>
    )
  }

  const isVerifiedSeller = !!seller?.verified_at
  const orders = tab === 'buyer' ? buyerOrders : sellerOrders

  // Quick aggregations
  const totalSpent = buyerOrders.reduce((s, o) => o.status === 'confirmed' ? s + Number(o.amount) : s, 0)
  const totalEarned = sellerOrders.reduce((s, o) => o.status === 'confirmed' ? s + Number(o.seller_payout) : s, 0)

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="vs-counter text-[11px] tabular-nums">ORDERS</p>
          <h1 className="text-2xl font-semibold mt-1 tracking-wide">Your transactions</h1>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="vs-card vs-lit">
          <p className="vs-label">SPENT</p>
          <p className="text-2xl font-semibold text-cyan tabular-nums mt-1">€{totalSpent.toFixed(2)}</p>
          <p className="vs-counter text-[10px] text-text-dim mt-0.5 tabular-nums">
            {String(buyerOrders.length).padStart(2, '0')} ORDERS
          </p>
        </div>
        <div className="vs-card vs-lit">
          <p className="vs-label">EARNED</p>
          <p className="text-2xl font-semibold text-success tabular-nums mt-1">€{totalEarned.toFixed(2)}</p>
          <p className="vs-counter text-[10px] text-text-dim mt-0.5 tabular-nums">
            {String(sellerOrders.length).padStart(2, '0')} SALES
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 mb-4">
        <button
          onClick={() => setTab('buyer')}
          data-active={tab === 'buyer'}
          className="vs-tab"
        >
          <Receipt size={13} /> As buyer
          {buyerOrders.length > 0 && <span className="text-[10px] opacity-60 tabular-nums">({buyerOrders.length})</span>}
        </button>
        {isVerifiedSeller && (
          <button
            onClick={() => setTab('seller')}
            data-active={tab === 'seller'}
            className="vs-tab"
          >
            <Inbox size={13} /> As seller
            {sellerOrders.length > 0 && <span className="text-[10px] opacity-60 tabular-nums">({sellerOrders.length})</span>}
          </button>
        )}
      </div>

      {/* List */}
      {orders.length === 0 ? (
        <EmptyState
          icon={tab === 'buyer' ? Receipt : Inbox}
          title={tab === 'buyer' ? 'No purchases yet' : 'No incoming orders yet'}
          description={tab === 'buyer'
            ? 'Browse the market and you\'ll see your orders here.'
            : 'When members buy from you they\'ll appear here.'}
          cta={tab === 'buyer' ? { label: 'Open market', href: '/market' } : undefined}
        />
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <OrderCard
              key={o.id}
              order={o}
              perspective={tab}
              onConfirmed={() => {
                if (authed) void init()
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
