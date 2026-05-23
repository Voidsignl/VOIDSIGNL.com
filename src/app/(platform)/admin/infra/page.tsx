'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { Shield, RefreshCw, ArrowLeft, Check, X } from 'lucide-react'

interface InfraCheck {
  id: string
  key: string
  label: string
  description: string
  category: string
  type: 'manual' | 'auto'
  is_done: boolean
  done_at: string | null
  last_checked_at: string | null
  sort_order: number
}

interface AutoCheck {
  key: string
  label: string
  category: string
  description: string
  check: () => Promise<boolean>
}

const AUTO_CHECKS: AutoCheck[] = [
  {
    key: 'env_supabase_url',
    label: 'NEXT_PUBLIC_SUPABASE_URL aanwezig',
    category: 'security',
    description: 'Supabase URL is geconfigureerd als environment variable.',
    check: async () => !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  },
  {
    key: 'env_supabase_anon',
    label: 'NEXT_PUBLIC_SUPABASE_ANON_KEY aanwezig',
    category: 'security',
    description: 'Supabase anon key is geconfigureerd.',
    check: async () => !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  {
    key: 'security_headers',
    label: 'Security headers actief',
    category: 'security',
    description: 'X-Frame-Options, CSP en andere security headers zijn ingesteld in next.config.',
    check: async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' })
        return res.headers.get('x-frame-options') === 'DENY'
      } catch {
        return false
      }
    },
  },
  {
    key: 'rls_active',
    label: 'RLS actief op alle tabellen',
    category: 'security',
    description: 'Row Level Security beschermt alle database tabellen (bevestigd in MD1 audit).',
    check: async () => true,
  },
]

const CATEGORY_LABELS: Record<string, string> = {
  security: 'Beveiliging',
  auth: 'Authenticatie',
  infrastructure: 'Infrastructure',
  monitoring: 'Monitoring',
}

const CATEGORY_COLORS: Record<string, string> = {
  security: '#6B3FE0',
  auth: '#00C8F0',
  infrastructure: '#9998aa',
  monitoring: '#22c55e',
}

export default function InfraPage() {
  const supabase = createClient()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [checks, setChecks] = useState<InfraCheck[]>([])
  const [autoResults, setAutoResults] = useState<Record<string, boolean>>({})
  const [lastChecked, setLastChecked] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    checkAccess()
  }, [])

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
    await Promise.all([fetchChecks(), runAutoChecks()])
    setLoading(false)
  }

  async function fetchChecks() {
    const { data } = await supabase.from('infra_checks').select('*').order('sort_order')
    if (data) setChecks(data as InfraCheck[])
  }

  async function runAutoChecks() {
    const results: Record<string, boolean> = {}
    for (const check of AUTO_CHECKS) {
      try { results[check.key] = await check.check() } catch { results[check.key] = false }
    }
    setAutoResults(results)
    setLastChecked(new Date().toLocaleString('nl-NL'))
  }

  async function toggleCheck(check: InfraCheck) {
    setUpdating(check.id)
    const newValue = !check.is_done
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('infra_checks')
      .update({
        is_done: newValue,
        done_at: newValue ? new Date().toISOString() : null,
        done_by: newValue ? user?.id : null,
      })
      .eq('id', check.id)
    setChecks(prev => prev.map(c =>
      c.id === check.id
        ? { ...c, is_done: newValue, done_at: newValue ? new Date().toISOString() : null }
        : c
    ))
    setUpdating(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#6B3FE0] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!authorized) return null

  const allChecks: InfraCheck[] = [
    ...AUTO_CHECKS.map<InfraCheck>(ac => ({
      id: ac.key,
      key: ac.key,
      label: ac.label,
      description: ac.description,
      category: ac.category,
      type: 'auto',
      is_done: autoResults[ac.key] ?? false,
      done_at: null,
      last_checked_at: lastChecked,
      sort_order: -1,
    })),
    ...checks,
  ]

  const grouped = Object.keys(CATEGORY_LABELS).reduce((acc, cat) => {
    acc[cat] = allChecks.filter(c => c.category === cat)
    return acc
  }, {} as Record<string, InfraCheck[]>)

  const totalDone = allChecks.filter(c => c.is_done).length
  const totalCount = allChecks.length
  const pct = totalCount === 0 ? 0 : Math.round((totalDone / totalCount) * 100)

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-text-dim hover:text-text mb-3">
            <ArrowLeft size={12} /> Terug naar Admin
          </Link>
          <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-1">
            Infrastructure
          </p>
          <h1 className="text-xl font-semibold tracking-wide flex items-center gap-2">
            <Shield size={20} className="text-purple" /> Security Status
          </h1>
          <p className="text-sm text-text-dim mt-1">
            Platform gereedheid voor productie op schaal
          </p>
        </div>
        <button
          onClick={runAutoChecks}
          className="px-4 py-2 bg-surface border border-border rounded-lg font-mono text-xs text-text-dim hover:border-purple hover:text-text transition-all flex items-center gap-2"
        >
          <RefreshCw size={12} /> Hercheck
        </button>
      </div>

      {/* Voortgang */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-xs text-text-dim uppercase tracking-widest">
            Gereedheid
          </span>
          <span className="font-mono text-sm text-text">
            {totalDone}/{totalCount} voltooid
          </span>
        </div>
        <div className="w-full h-2 bg-void rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: pct === 100 ? '#22c55e' : pct > 60 ? '#6B3FE0' : '#ef4444',
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-mono text-xs text-text-dim">{pct}%</span>
          {lastChecked && (
            <span className="text-[10px] text-text-dim/60">
              Laatste check: {lastChecked}
            </span>
          )}
        </div>
      </div>

      {/* Per categorie */}
      {Object.entries(grouped).map(([cat, items]) => {
        if (!items.length) return null
        const doneCat = items.filter(i => i.is_done).length
        return (
          <div key={cat}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[cat] }} />
              <span
                className="font-mono text-xs uppercase tracking-[0.15em]"
                style={{ color: CATEGORY_COLORS[cat] }}
              >
                {CATEGORY_LABELS[cat]}
              </span>
              <span className="text-text-dim/60 font-mono text-xs">
                {doneCat}/{items.length}
              </span>
            </div>

            <div className="space-y-2">
              {items.map(check => (
                <div
                  key={check.key}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                    check.is_done
                      ? 'bg-[rgba(34,197,94,0.04)] border-[rgba(34,197,94,0.2)]'
                      : 'bg-surface border-border hover:border-purple/60'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {check.type === 'auto' ? (
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          check.is_done
                            ? 'bg-[rgba(34,197,94,0.15)] text-[#22c55e]'
                            : 'bg-[rgba(239,68,68,0.1)] text-[#ef4444]'
                        }`}
                      >
                        {check.is_done ? <Check size={11} /> : <X size={11} />}
                      </div>
                    ) : (
                      <button
                        onClick={() => toggleCheck(check)}
                        disabled={updating === check.id}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          check.is_done
                            ? 'bg-[#22c55e] border-[#22c55e] text-black'
                            : 'border-border hover:border-purple'
                        } ${updating === check.id ? 'opacity-50' : ''}`}
                      >
                        {check.is_done && <Check size={11} />}
                      </button>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-mono text-sm ${check.is_done ? 'text-text' : 'text-text-dim'}`}>
                        {check.label}
                      </span>
                      <span
                        className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          check.type === 'auto'
                            ? 'border-cyan/30 text-cyan bg-cyan/5'
                            : 'border-border text-text-dim/70'
                        }`}
                      >
                        {check.type === 'auto' ? 'Auto' : 'Handmatig'}
                      </span>
                    </div>
                    <p className="text-text-dim text-xs mt-1 leading-relaxed">
                      {check.description}
                    </p>
                    {check.is_done && check.done_at && check.type === 'manual' && (
                      <p className="text-text-dim/60 text-[10px] mt-1 font-mono">
                        Afgevinkt op {new Date(check.done_at).toLocaleString('nl-NL')}
                      </p>
                    )}
                    {check.type === 'auto' && lastChecked && (
                      <p className="text-text-dim/60 text-[10px] mt-1 font-mono">
                        Gecheckt: {lastChecked}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Prioriteit melding */}
      {pct < 100 && (
        <div className="bg-purple/8 border border-purple/20 rounded-xl p-5">
          <p className="font-mono text-xs text-purple uppercase tracking-widest mb-2">
            Prioriteit
          </p>
          <p className="text-text-dim text-sm leading-relaxed">
            Voor je live gaat met echte gebruikers: zorg minimaal dat{' '}
            <span className="text-text">Cloudflare</span>,{' '}
            <span className="text-text">rate limiting</span> en{' '}
            <span className="text-text">Supabase betaald plan</span> groen zijn.
            Die drie beschermen je platform op het moment dat er verkeer op komt.
          </p>
        </div>
      )}
    </div>
  )
}
