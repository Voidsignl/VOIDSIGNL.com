'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface Phase {
  id: string
  phase: number
  name: string
  description: string | null
  limit_count: number
  is_active: boolean
  is_visible: boolean
}

interface PhaseStats {
  total_members: number
  inner_circle_count: number
  active_phase: number
  phase_limit: number
  phase_claimed: number
  phase_remaining: number | null
}

export default function AdminPhasesPage() {
  const supabase = createClient()
  const [phases, setPhases] = useState<Phase[]>([])
  const [stats, setStats] = useState<PhaseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState<number | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: p }, { data: s }] = await Promise.all([
        supabase
          .from('access_phases')
          .select('*')
          .order('phase'),
        supabase.rpc('get_phase_stats'),
      ])
      setPhases((p as Phase[] | null) ?? [])
      setStats((s as PhaseStats | null) ?? null)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  async function activatePhase(phaseNum: number) {
    if (
      !confirm(
        `Fase ${phaseNum} activeren? Dit deactiveert de huidige actieve fase.`,
      )
    )
      return
    setActivating(phaseNum)
    try {
      await supabase
        .from('access_phases')
        .update({ is_active: false })
        .neq('phase', 0)
      await supabase
        .from('access_phases')
        .update({ is_active: true })
        .eq('phase', phaseNum)
      await fetchAll()
    } finally {
      setActivating(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 flex items-center justify-center">
        <Loader2 size={20} className="text-purple animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-text-muted hover:text-text transition-colors duration-200"
      >
        <ArrowLeft size={12} />
        Admin
      </Link>

      <div>
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-purple mb-1">
          Admin
        </p>
        <h1 className="font-mono text-2xl font-bold text-text">
          Phase beheer
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Activeer welke fase open is voor nieuwe gebruikers.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Totaal members', value: stats.total_members },
            { label: 'Inner Circle', value: stats.inner_circle_count },
            {
              label: 'Resterend',
              value:
                stats.phase_remaining === null
                  ? '∞'
                  : stats.phase_remaining.toLocaleString(),
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-surface border border-border rounded-xl p-4"
            >
              <p className="font-mono text-2xl font-bold text-text">
                {s.value}
              </p>
              <p className="font-mono text-[10px] text-text-muted uppercase tracking-wider mt-1">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {phases.map((phase) => (
          <div
            key={phase.id}
            className={`bg-surface border rounded-xl p-5 ${
              phase.is_active ? 'border-purple' : 'border-border'
            }`}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <p className="font-mono text-sm font-bold text-text">
                    Fase {phase.phase}: {phase.name}
                  </p>
                  {phase.is_active && (
                    <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded-full bg-success/10 border border-success/25 text-success">
                      Actief
                    </span>
                  )}
                </div>
                {phase.description && (
                  <p className="text-text-muted text-xs leading-relaxed">
                    {phase.description}
                  </p>
                )}
                <p className="font-mono text-[10px] text-text-dim mt-1">
                  Limiet:{' '}
                  {phase.limit_count === 0
                    ? 'Onbeperkt'
                    : phase.limit_count.toLocaleString()}
                </p>
              </div>
              {!phase.is_active && (
                <button
                  onClick={() => activatePhase(phase.phase)}
                  disabled={activating !== null}
                  className="px-4 py-2 border border-border text-text-muted font-mono text-xs uppercase tracking-widest rounded-lg hover:border-purple/40 hover:text-text transition-colors duration-200 disabled:opacity-50"
                >
                  {activating === phase.phase ? '...' : 'Activeren'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
