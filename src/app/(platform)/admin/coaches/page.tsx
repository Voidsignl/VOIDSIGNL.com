'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-browser'
import { ArrowLeft, Shield, Check, X } from 'lucide-react'

interface CoachRow {
  id: string
  bio: string
  specializations: string[]
  languages: string[]
  hourly_tier: string
  is_approved: boolean
  applied_at: string | null
  rejection_reason: string | null
  user: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
    level_name: string | null
    xp: number
  } | null
  games: { game: { id: string; name: string } }[]
}

export default function AdminCoachesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [pending, setPending] = useState<CoachRow[]>([])
  const [approved, setApproved] = useState<CoachRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'approved'>('pending')

  useEffect(() => { checkAccess() }, [])

  async function checkAccess() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (!profile || profile.role !== 'admin') {
      router.push('/admin')
      return
    }
    setAuthorized(true)
    fetchCoaches()
  }

  async function fetchCoaches() {
    setLoading(true)
    const { data } = await supabase
      .from('coach_profiles')
      .select(`
        id, bio, specializations, languages, hourly_tier,
        is_approved, applied_at, rejection_reason,
        user:profiles!coach_profiles_user_id_fkey(
          id, username, display_name, avatar_url, level_name, xp
        ),
        games:coach_games(game:games(id, name))
      `)
      .order('applied_at', { ascending: true })

    const list = (data ?? []) as unknown as CoachRow[]
    setPending(list.filter(c => !c.is_approved))
    setApproved(list.filter(c => c.is_approved))
    setLoading(false)
  }

  async function handleApprove(coachId: string) {
    await supabase
      .from('coach_profiles')
      .update({ is_approved: true, is_active: true })
      .eq('id', coachId)
    fetchCoaches()
  }

  async function handleReject(coachId: string) {
    const reason = prompt('Reden voor afwijzing:')
    if (!reason) return
    await supabase
      .from('coach_profiles')
      .update({ is_approved: false, rejection_reason: reason })
      .eq('id', coachId)
    fetchCoaches()
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-dim text-sm animate-pulse">Checking access...</div>
      </div>
    )
  }

  const list = tab === 'pending' ? pending : approved

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-text-dim hover:text-text mb-3">
          <ArrowLeft size={12} /> Terug naar Admin
        </Link>
        <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-1">Admin</p>
        <h1 className="text-xl font-semibold tracking-wide flex items-center gap-2">
          <Shield size={20} className="text-purple" /> Coach aanvragen
        </h1>
      </div>

      <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 max-w-xs">
        {[
          { key: 'pending', label: `Wachtend (${pending.length})` },
          { key: 'approved', label: `Actief (${approved.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as 'pending' | 'approved')}
            className={`flex-1 py-2 rounded-lg font-mono text-xs transition-colors duration-200 ${
              tab === t.key ? 'bg-purple text-white' : 'text-text-dim hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-surface rounded-xl h-32" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-dim font-mono text-sm">Geen aanvragen.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map(coach => (
            <div key={coach.id} className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-surface-2 flex-shrink-0">
                  {coach.user?.avatar_url ? (
                    <Image src={coach.user.avatar_url} alt={coach.user.username}
                      fill sizes="48px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-mono text-sm text-text-dim">
                        {coach.user?.username?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-sm font-bold text-text">
                      {coach.user?.display_name ?? coach.user?.username}
                    </span>
                    <span className="font-mono text-[10px] text-text-dim">
                      {coach.user?.level_name} · {coach.user?.xp?.toLocaleString()} XP
                    </span>
                  </div>

                  <p className="text-text-dim text-xs leading-relaxed mb-3 line-clamp-3">
                    {coach.bio}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {coach.games?.map((cg, idx) => (
                      <span key={cg.game?.id ?? idx}
                        className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-surface-2 text-text-dim">
                        {cg.game?.name}
                      </span>
                    ))}
                    {coach.specializations?.map(s => (
                      <span key={s}
                        className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-purple/10 border border-purple/20 text-purple">
                        {s}
                      </span>
                    ))}
                  </div>

                  <p className="font-mono text-[10px] text-text-dim/60">
                    Aangemeld: {coach.applied_at ? new Date(coach.applied_at).toLocaleDateString('nl-NL') : '—'}
                    {coach.rejection_reason && ` · Afgewezen: ${coach.rejection_reason}`}
                  </p>
                </div>

                {!coach.is_approved && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApprove(coach.id)}
                      className="px-4 py-2 bg-success text-white font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-success/85 transition-colors duration-200 flex items-center gap-1.5"
                    >
                      <Check size={12} /> Goedkeuren
                    </button>
                    <button
                      onClick={() => handleReject(coach.id)}
                      className="px-4 py-2 border border-danger text-danger font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-danger/10 transition-colors duration-200 flex items-center gap-1.5"
                    >
                      <X size={12} /> Afwijzen
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
