'use client'

/**
 * /market/sell — verified seller dashboard OR pending application form.
 * Verified: own listings table + create form.
 * Not yet seller: apply form.
 * Pending: waiting state.
 * Rejected: contact admin state.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import type { Game, MarketListing, MarketSeller } from '@/types'
import { MARKET_CATEGORIES } from '@/types'
import {
  ShieldCheck, Clock, AlertCircle, Plus, Trash2, EyeOff, Eye,
  Lock, ShoppingBag,
} from 'lucide-react'
import { ScopeSpinner } from '@/components/ui/loader'
import { EmptyState } from '@/components/ui/empty-state'
import { CreateListingForm } from '@/components/market/CreateListingForm'
import { formatPrice } from '@/lib/market-utils'

export default function SellPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState<string | null>(null)
  const [seller, setSeller] = useState<MarketSeller | null>(null)
  const [myListings, setMyListings] = useState<MarketListing[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [showForm, setShowForm] = useState(false)

  // Application state
  const [applicationNote, setApplicationNote] = useState('')
  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)

  useEffect(() => { void init() }, [])

  async function init() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      setAuthed(user.id)
      await loadSellerState(user.id)
    } finally {
      setLoading(false)
    }
  }

  async function loadSellerState(uid: string) {
    const { data: sellerRow } = await supabase
      .from('market_sellers')
      .select('*, profile:profiles(*)')
      .eq('user_id', uid)
      .maybeSingle()

    setSeller((sellerRow as MarketSeller) ?? null)

    if ((sellerRow as MarketSeller | null)?.verified_at) {
      const [{ data: listings }, { data: g }] = await Promise.all([
        supabase
          .from('market_listings')
          .select('*, game:games(id,name)')
          .eq('seller_id', (sellerRow as MarketSeller).id)
          .order('created_at', { ascending: false }),
        supabase.from('games').select('*').eq('is_approved', true).order('name'),
      ])
      setMyListings((listings || []) as unknown as MarketListing[])
      setGames((g || []) as Game[])
    }
  }

  async function applyAsSeller(e: React.FormEvent) {
    e.preventDefault()
    if (!authed) return
    setApplying(true)
    setApplyError(null)
    try {
      const trimmed = applicationNote.trim()
      if (trimmed.length < 30) {
        setApplyError('Tell us a bit more — at least 30 characters.')
        return
      }
      const { error } = await supabase
        .from('market_sellers')
        .insert({ user_id: authed, application_note: trimmed })
      if (error) {
        if (error.code === '23505') {
          setApplyError('You already have a seller application on file.')
        } else {
          setApplyError(error.message)
        }
        return
      }
      await loadSellerState(authed)
    } finally {
      setApplying(false)
    }
  }

  async function toggleListingStatus(listing: MarketListing) {
    const next = listing.status === 'active' ? 'pending' : 'active'
    await supabase.from('market_listings').update({ status: next }).eq('id', listing.id)
    setMyListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: next as MarketListing['status'] } : l))
  }

  async function deleteListing(id: string) {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    await supabase.from('market_listings').delete().eq('id', id)
    setMyListings(prev => prev.filter(l => l.id !== id))
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><ScopeSpinner size={28} /></div>
  }

  if (!authed) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <EmptyState
          icon={Lock}
          title="Members only"
          description="Sign in to apply as a seller."
          cta={{ label: 'Sign in', href: '/login' }}
        />
      </div>
    )
  }

  // ── Pending application ─────────────────────────────────────────────────────
  if (seller && !seller.verified_at && !seller.rejected_at) {
    return (
      <div className="max-w-xl mx-auto mt-8 animate-fade-in">
        <div className="vs-card vs-lit text-center">
          <div className="w-12 h-12 rounded-xl bg-warning/15 border border-warning/30 mx-auto flex items-center justify-center mb-3">
            <Clock size={22} className="text-warning" />
          </div>
          <p className="vs-counter text-[10px] text-warning tabular-nums">PENDING REVIEW</p>
          <h1 className="text-xl font-semibold mt-2">Application received</h1>
          <p className="text-sm text-text-muted mt-2 leading-relaxed">
            Our team is reviewing your seller application. You&apos;ll be notified when you&apos;re approved.
            Typical turnaround: 24–48 hours.
          </p>
          {seller.application_note && (
            <div className="mt-4 p-3 rounded-lg bg-surface-2 border border-border text-left">
              <p className="vs-label mb-1">YOUR NOTE</p>
              <p className="text-xs text-text/80 whitespace-pre-wrap">{seller.application_note}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Rejected ────────────────────────────────────────────────────────────────
  if (seller?.rejected_at) {
    return (
      <div className="max-w-xl mx-auto mt-8">
        <div className="vs-card text-center">
          <AlertCircle size={28} className="text-danger mx-auto mb-2" />
          <h1 className="text-xl font-semibold">Application not approved</h1>
          <p className="text-sm text-text-muted mt-2">Contact moderators if you believe this was a mistake.</p>
        </div>
      </div>
    )
  }

  // ── Apply form ──────────────────────────────────────────────────────────────
  if (!seller) {
    return (
      <div className="max-w-xl mx-auto animate-fade-in">
        <div className="vs-card vs-lit mb-4">
          <p className="vs-counter text-[11px] tabular-nums">APPLY · SELLER ACCESS</p>
          <h1 className="text-2xl font-semibold mt-2 tracking-wide">Sell on the VOID Market</h1>
          <p className="text-sm text-text-muted mt-2 leading-relaxed">
            VOIDSIGNL hand-screens every seller. Tell us what you&apos;d sell, your experience, and any links to your work.
          </p>
        </div>

        <form onSubmit={applyAsSeller} className="vs-card space-y-4">
          <div>
            <label className="vs-label block mb-1">WHY DO YOU WANT TO SELL? *</label>
            <textarea
              value={applicationNote}
              onChange={e => setApplicationNote(e.target.value)}
              placeholder="What you sell, links to portfolio/store, why you'd be a good fit..."
              maxLength={2000}
              minLength={30}
              className="vs-input text-sm resize-none min-h-[140px]"
              required
            />
            <p className="text-[10px] text-text-dim mt-1 tabular-nums">
              {applicationNote.length} / 2000 · min 30
            </p>
          </div>

          {applyError && <p className="text-xs text-danger p-2 bg-danger-dim rounded">{applyError}</p>}

          <button type="submit" disabled={applying} className="vs-btn vs-btn-primary text-sm w-full">
            {applying ? 'Submitting...' : 'Submit application'}
          </button>
          <p className="text-[10px] text-text-dim text-center">
            We review applications within 24–48 hours.
          </p>
        </form>
      </div>
    )
  }

  // ── Verified seller dashboard ───────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="vs-counter text-[11px] tabular-nums text-cyan flex items-center gap-1">
            <ShieldCheck size={12} /> VERIFIED SELLER
          </p>
          <h1 className="text-2xl font-semibold mt-1 tracking-wide">Your storefront</h1>
          <p className="text-xs text-text-dim mt-1 tabular-nums">
            <span className="vs-counter">{String(myListings.length).padStart(2, '0')}</span> LISTINGS · {' '}
            <span className="vs-counter">{String(seller.total_sales).padStart(3, '0')}</span> SALES · {' '}
            <span className="vs-counter">{seller.rep_score.toFixed(2)}★</span>
          </p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className={`vs-btn ${showForm ? 'vs-btn-ghost' : 'vs-btn-primary'} text-sm`}
        >
          {showForm ? 'Close' : <><Plus size={13} /> NEW LISTING</>}
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <CreateListingForm
            seller={seller}
            games={games}
            onCreated={() => {
              setShowForm(false)
              if (authed) void loadSellerState(authed)
            }}
          />
        </div>
      )}

      {/* Listings table */}
      {myListings.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No listings yet"
          description="Create your first listing — it goes live immediately for members."
          cta={{ label: 'Create listing', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="vs-card vs-lit p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 border-b border-border">
              <tr className="text-left vs-counter text-[10px] tabular-nums">
                <th className="px-4 py-2.5">TITLE</th>
                <th className="px-4 py-2.5">CATEGORY</th>
                <th className="px-4 py-2.5 text-right">PRICE</th>
                <th className="px-4 py-2.5">STATUS</th>
                <th className="px-4 py-2.5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {myListings.map(l => (
                <tr key={l.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-2.5">
                    <Link href={`/market/listing/${l.id}`} className="text-text hover:text-purple-light line-clamp-1">
                      {l.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="vs-badge text-[9px] bg-surface-2 text-text-muted border border-border">
                      {MARKET_CATEGORIES[l.category].tag}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums text-cyan">
                    {formatPrice(l.price, l.currency)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`vs-badge text-[9px] capitalize ${
                      l.status === 'active' ? 'vs-badge-success' :
                      l.status === 'sold' ? 'vs-badge-cyan' :
                      l.status === 'removed' ? 'vs-badge-danger' :
                      'vs-badge-warning'
                    }`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex gap-1">
                      <button
                        onClick={() => toggleListingStatus(l)}
                        className="p-1.5 rounded text-text-dim hover:text-text hover:bg-surface-2 transition-colors"
                        title={l.status === 'active' ? 'Pause' : 'Activate'}
                      >
                        {l.status === 'active' ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button
                        onClick={() => deleteListing(l.id)}
                        className="p-1.5 rounded text-text-dim hover:text-danger hover:bg-danger/10 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
