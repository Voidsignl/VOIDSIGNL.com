'use client'

/**
 * Next-tournament countdown widget — shows the soonest-upcoming tournament
 * with a live counter that ticks once a minute.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { Trophy, Calendar, Users } from 'lucide-react'

interface Tournament {
  id: string
  name: string
  starts_at: string
  game?: { name: string } | null
  registration_open: boolean
}

function timeUntil(iso: string): { text: string; live: boolean; soon: boolean } {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return { text: 'Live now', live: true, soon: false }
  const min = Math.floor(ms / 60_000)
  const hours = Math.floor(min / 60)
  const days = Math.floor(hours / 24)
  let text = ''
  if (days > 0) text = `in ${days}d ${hours % 24}h`
  else if (hours > 0) text = `in ${hours}h ${min % 60}m`
  else text = `in ${min}m`
  return { text, live: false, soon: hours < 1 }
}

export function TournamentWidget() {
  const supabase = createClient()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data } = await supabase
        .from('tournaments')
        .select('id, name, starts_at, registration_open, game:games(name)')
        .in('status', ['upcoming', 'registration', 'in_progress'])
        .order('starts_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      if (!cancelled) {
        setTournament((data as unknown as Tournament) ?? null)
        setLoading(false)
      }
    }
    load()

    const interval = setInterval(() => setTick(t => t + 1), 60_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  if (loading) {
    return (
      <div className="vs-card vs-lit animate-pulse">
        <div className="h-2.5 bg-surface-2 rounded w-20 mb-3" />
        <div className="h-3.5 bg-surface-2 rounded w-3/4 mb-2" />
        <div className="h-2.5 bg-surface-2 rounded w-1/2" />
      </div>
    )
  }

  if (!tournament) return null

  const { text, live, soon } = timeUntil(tournament.starts_at)
  // tick state used to force re-render; reference it to satisfy lint
  void tick

  return (
    <Link href="/tournaments" className="block vs-card vs-lit hover:border-purple/30 transition-colors group">
      <div className="flex items-center justify-between mb-2">
        <p className="vs-label flex items-center gap-1.5">
          <Trophy size={11} className="text-warning" /> NEXT TOURNAMENT
        </p>
        {live && (
          <span className="flex items-center gap-1 text-[9px] text-danger">
            <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
            LIVE
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-text leading-tight line-clamp-2 group-hover:text-purple-light transition-colors">
        {tournament.name}
      </p>
      {tournament.game?.name && (
        <p className="vs-counter text-[10px] text-text-dim mt-1 tabular-nums">
          {tournament.game.name.toUpperCase()}
        </p>
      )}
      <div className={`flex items-center gap-2 text-xs mt-2 ${live ? 'text-danger' : soon ? 'text-warning' : 'text-cyan'}`}>
        <Calendar size={11} />
        <span className="tabular-nums">{text}</span>
        {tournament.registration_open && !live && (
          <span className="ml-auto vs-badge vs-badge-success text-[8px]">
            <Users size={8} /> OPEN
          </span>
        )}
      </div>
    </Link>
  )
}
