'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import ClanCard from '@/components/clans/ClanCard'

interface ClanRow {
  id: string
  name: string
  slug: string
  description?: string | null
  avatar_url?: string | null
  banner_url?: string | null
  is_open: boolean
  member_count: number
  max_members: number
  xp_total: number
  owner?: { username: string; avatar_url?: string | null } | null
}

const PAGE_SIZE = 20

export default function ClansPage() {
  const supabase = createClient()
  const [clans, setClans] = useState<ClanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<'xp' | 'members' | 'newest'>('xp')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [myClanId, setMyClanId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('clan_id')
        .eq('id', data.user.id)
        .maybeSingle()
      setMyClanId(profile?.clan_id ?? null)
    })
  }, [supabase])

  const fetchClans = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/clans?sort=${sort}&page=${page}`)
      const json = await res.json()
      setClans((json.data ?? []) as ClanRow[])
      setTotal(json.pagination?.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [sort, page])

  useEffect(() => {
    fetchClans()
  }, [fetchClans])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-1">
            Community
          </p>
          <h1 className="font-mono text-3xl font-bold text-text mb-1">Clans</h1>
          <p className="text-text-dim text-sm">{total.toLocaleString()} clans</p>
        </div>
        {!myClanId && (
          <Link
            href="/clans/new"
            className="px-5 py-2.5 bg-purple text-white font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-purple/85 transition-colors"
          >
            + Clan aanmaken
          </Link>
        )}
      </div>

      <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 mb-6 max-w-xs">
        {(['xp', 'members', 'newest'] as const).map((key) => (
          <button
            key={key}
            onClick={() => {
              setSort(key)
              setPage(1)
            }}
            className={`flex-1 py-2 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all ${
              sort === key
                ? 'bg-purple text-white'
                : 'text-text-dim hover:text-text'
            }`}
          >
            {key === 'xp' ? 'XP' : key === 'members' ? 'Leden' : 'Nieuwste'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-surface rounded-xl h-52" />
          ))}
        </div>
      ) : clans.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-mono text-[10px] tracking-[0.2em] text-text-dim/60 uppercase mb-3">
            Leeg
          </p>
          <p className="text-text-dim text-sm mb-6">Nog geen clans. Maak de eerste aan.</p>
          <Link
            href="/clans/new"
            className="px-5 py-2.5 bg-purple text-white font-mono text-sm rounded-lg hover:bg-purple/85 transition-colors"
          >
            + Clan aanmaken
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clans.map((clan, i) => (
            <ClanCard
              key={clan.id}
              clan={clan}
              rank={sort === 'xp' ? (page - 1) * PAGE_SIZE + i + 1 : undefined}
              isMember={clan.id === myClanId}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-border text-text-dim font-mono text-xs rounded-lg hover:border-purple hover:text-text transition-all disabled:opacity-30"
          >
            ← Vorige
          </button>
          <span className="font-mono text-xs text-text-dim">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-border text-text-dim font-mono text-xs rounded-lg hover:border-purple hover:text-text transition-all disabled:opacity-30"
          >
            Volgende →
          </button>
        </div>
      )}
    </div>
  )
}
