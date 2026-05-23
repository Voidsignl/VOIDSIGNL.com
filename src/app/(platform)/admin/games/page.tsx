'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-browser'
import { ArrowLeft, Shield, Check, X } from 'lucide-react'

const RANK_SET_OPTIONS = [
  { value: 'none', label: 'Geen ranks' },
  { value: 'valorant', label: 'Valorant' },
  { value: 'cs2', label: 'CS2' },
  { value: 'fortnite', label: 'Fortnite' },
  { value: 'apex', label: 'Apex Legends' },
  { value: 'lol', label: 'League of Legends' },
  { value: 'overwatch2', label: 'Overwatch 2' },
  { value: 'rocket_league', label: 'Rocket League' },
  { value: 'custom', label: 'Aangepast' },
]

interface GameRequest {
  id: string
  igdb_id: number
  name: string
  cover_url: string | null
  description: string | null
  genre: string[] | null
  platforms: string[] | null
  release_year: number | null
  status: string
  admin_note: string | null
  created_at: string
  requester: { id: string; username: string; display_name: string | null } | null
}

export default function AdminGamesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [requests, setRequests] = useState<GameRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [rankSets, setRankSets] = useState<Record<string, string>>({})
  const [customRanks, setCustomRanks] = useState<Record<string, string>>({})
  const [approving, setApproving] = useState<string | null>(null)

  useEffect(() => { checkAccess() }, [])

  async function checkAccess() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (!profile || profile.role !== 'admin') { router.push('/admin'); return }
    setAuthorized(true)
    fetchRequests()
  }

  async function fetchRequests() {
    setLoading(true)
    const { data } = await supabase
      .from('game_requests')
      .select(`
        id, igdb_id, name, cover_url, description, genre, platforms,
        release_year, status, admin_note, created_at,
        requester:profiles!game_requests_requester_id_fkey(id, username, display_name)
      `)
      .order('created_at', { ascending: true })
    setRequests((data ?? []) as unknown as GameRequest[])
    setLoading(false)
  }

  async function handleApprove(request: GameRequest) {
    const rankSet = rankSets[request.id] ?? 'none'
    const custom = customRanks[request.id]
      ? customRanks[request.id].split('\n').map(s => s.trim()).filter(Boolean)
      : []

    setApproving(request.id)
    try {
      await supabase
        .from('game_requests')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', request.id)

      await supabase
        .from('games')
        .update({
          rank_set: rankSet,
          custom_ranks: rankSet === 'custom' ? custom : [],
        })
        .eq('igdb_id', request.igdb_id)

      fetchRequests()
    } finally {
      setApproving(null)
    }
  }

  async function handleReject(requestId: string) {
    const note = prompt('Reden voor afwijzing:')
    if (!note) return
    await supabase
      .from('game_requests')
      .update({
        status: 'rejected',
        admin_note: note,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId)
    fetchRequests()
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-dim text-sm animate-pulse">Checking access...</div>
      </div>
    )
  }

  const pending = requests.filter(r => r.status === 'pending')
  const reviewed = requests.filter(r => r.status !== 'pending')

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-text-dim hover:text-text mb-3">
          <ArrowLeft size={12} /> Terug naar Admin
        </Link>
        <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-1">Admin</p>
        <h1 className="text-xl font-semibold tracking-wide flex items-center gap-2">
          <Shield size={20} className="text-purple" /> Game aanvragen
        </h1>
        <p className="text-text-dim text-sm mt-1">
          {pending.length} wachtend · {reviewed.length} afgehandeld
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-surface rounded-xl h-24" />
          ))}
        </div>
      ) : pending.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-dim font-mono text-sm">Geen openstaande aanvragen.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map(req => (
            <div key={req.id} className="bg-surface border border-border rounded-xl p-5">
              <div className="flex gap-4">
                <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-void flex-shrink-0">
                  {req.cover_url ? (
                    <Image src={req.cover_url} alt={req.name} fill sizes="64px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-text-dim/60 text-xl">⬡</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-bold text-text mb-0.5">{req.name}</p>
                  <p className="font-mono text-[10px] text-text-dim">
                    Aangevraagd door {req.requester?.username ?? 'onbekend'} · {req.release_year ?? '—'}
                  </p>
                  {req.genre && req.genre.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {req.genre.slice(0, 3).map(g => (
                        <span key={g}
                          className="font-mono text-[9px] px-1.5 py-0.5 rounded-full bg-surface-2 text-text-dim">
                          {g}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 space-y-2">
                    <label className="font-mono text-[10px] text-text-dim uppercase tracking-wider">
                      Rank systeem
                    </label>
                    <select
                      value={rankSets[req.id] ?? 'none'}
                      onChange={e => setRankSets(prev => ({ ...prev, [req.id]: e.target.value }))}
                      className="w-full bg-void border border-border rounded-lg px-3 py-2 text-text text-xs font-mono focus:outline-none focus:border-purple transition-colors"
                    >
                      {RANK_SET_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>

                    {rankSets[req.id] === 'custom' && (
                      <textarea
                        value={customRanks[req.id] ?? ''}
                        onChange={e => setCustomRanks(prev => ({ ...prev, [req.id]: e.target.value }))}
                        placeholder="Één rank per regel..."
                        rows={4}
                        className="w-full bg-void border border-border rounded-lg px-3 py-2 text-text text-xs font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors resize-none"
                      />
                    )}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleApprove(req)}
                      disabled={approving === req.id}
                      className="px-4 py-2 bg-success text-white font-mono text-xs rounded-lg hover:bg-success/85 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                    >
                      <Check size={12} /> Goedkeuren
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="px-4 py-2 border border-danger text-danger font-mono text-xs rounded-lg hover:bg-danger/10 transition-colors flex items-center gap-1.5"
                    >
                      <X size={12} /> Afwijzen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
