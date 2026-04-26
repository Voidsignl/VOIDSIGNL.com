'use client'

/**
 * Single-elimination bracket visualization.
 * Renders rounds as columns, matches as cards. Score-entry sheet for organizer
 * or match participants.
 */
import { useState } from 'react'
import Link from 'next/link'
import { Trophy, Crown, Minus } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { Avatar } from '@/components/ui/avatar'
import { Sheet } from '@/components/ui/sheet'
import { EmptyState } from '@/components/ui/empty-state'

interface Match {
  id: string
  tournament_id: string
  round: number
  slot: number
  entrant_a: string | null
  entrant_b: string | null
  score_a: number | null
  score_b: number | null
  winner: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'bye'
  profile_a?: { id: string; username: string; display_name: string | null; avatar_url: string | null }
  profile_b?: { id: string; username: string; display_name: string | null; avatar_url: string | null }
}

interface BracketProps {
  matches: Match[]
  currentUserId: string | null
  organizerId: string
  onChanged: () => void
}

export function Bracket({ matches, currentUserId, organizerId, onChanged }: BracketProps) {
  const supabase = createClient()
  const [reporting, setReporting] = useState<Match | null>(null)
  const [scoreA, setScoreA] = useState<string>('')
  const [scoreB, setScoreB] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (matches.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="No bracket yet"
        description="The organizer will generate the bracket when registration closes."
      />
    )
  }

  // Group by round
  const roundsMap = new Map<number, Match[]>()
  for (const m of matches) {
    if (!roundsMap.has(m.round)) roundsMap.set(m.round, [])
    roundsMap.get(m.round)!.push(m)
  }
  const rounds = [...roundsMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([round, ms]) => [round, ms.sort((a, b) => a.slot - b.slot)] as const)
  const totalRounds = rounds.length
  const isFinal = (round: number) => round === totalRounds

  function canReport(m: Match): boolean {
    if (!currentUserId) return false
    if (m.status === 'completed' || m.status === 'bye') return false
    if (!m.entrant_a || !m.entrant_b) return false
    return currentUserId === organizerId ||
           currentUserId === m.entrant_a ||
           currentUserId === m.entrant_b
  }

  function openReport(m: Match) {
    setReporting(m)
    setScoreA(String(m.score_a ?? ''))
    setScoreB(String(m.score_b ?? ''))
    setError(null)
  }

  async function submit() {
    if (!reporting) return
    setSubmitting(true)
    setError(null)
    try {
      const a = Number(scoreA)
      const b = Number(scoreB)
      if (!Number.isFinite(a) || !Number.isFinite(b)) {
        setError('Enter both scores')
        return
      }
      if (a === b) {
        setError('Tie not allowed in single-elimination')
        return
      }
      const { error: e } = await supabase.rpc('report_match_result', {
        p_match_id: reporting.id,
        p_score_a: a,
        p_score_b: b,
      })
      if (e) throw e
      setReporting(null)
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save result')
    } finally {
      setSubmitting(false)
    }
  }

  function roundLabel(round: number): string {
    if (totalRounds === 1) return 'Final'
    if (round === totalRounds) return 'Final'
    if (round === totalRounds - 1) return 'Semifinal'
    if (round === totalRounds - 2) return 'Quarterfinal'
    return `Round ${round}`
  }

  return (
    <>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max">
          {rounds.map(([round, ms]) => (
            <div key={round} className="flex flex-col gap-3 min-w-[220px]">
              <p className="vs-counter text-[10px] tabular-nums text-text-dim text-center">
                {roundLabel(round).toUpperCase()} · {String(ms.length).padStart(2, '0')}
              </p>
              <div
                className="flex flex-col"
                style={{ gap: `${(round - 1) * 20 + 12}px` }}
              >
                {ms.map(m => {
                  const reportable = canReport(m)
                  const final = isFinal(round)
                  return (
                    <div
                      key={m.id}
                      className={`vs-card p-3 transition-colors ${
                        m.status === 'completed' && final ? 'border-yellow-400/30 vs-lit' :
                        reportable ? 'hover:border-purple/30 cursor-pointer' :
                        ''
                      }`}
                      onClick={reportable ? () => openReport(m) : undefined}
                    >
                      <Slot
                        profile={m.profile_a}
                        score={m.score_a}
                        isWinner={m.winner !== null && m.winner === m.entrant_a}
                        isLoser={m.winner !== null && m.winner !== m.entrant_a && !!m.entrant_a}
                      />
                      <div className="my-1.5 h-px bg-border" />
                      <Slot
                        profile={m.profile_b}
                        score={m.score_b}
                        isWinner={m.winner !== null && m.winner === m.entrant_b}
                        isLoser={m.winner !== null && m.winner !== m.entrant_b && !!m.entrant_b}
                      />
                      {m.status === 'bye' && (
                        <p className="vs-counter text-[9px] text-text-dim text-center mt-2 tabular-nums">BYE</p>
                      )}
                      {reportable && (
                        <p className="vs-counter text-[9px] text-purple-light text-center mt-2 tabular-nums">
                          TAP TO REPORT
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Sheet
        open={!!reporting}
        onClose={() => !submitting && setReporting(null)}
        maxWidth="max-w-sm"
        title={
          <span className="flex items-center gap-2">
            <Trophy size={16} className="text-warning" /> Report match
          </span>
        }
      >
        {reporting && (
          <div className="p-4 space-y-4">
            <ScoreRow profile={reporting.profile_a} value={scoreA} onChange={setScoreA} />
            <ScoreRow profile={reporting.profile_b} value={scoreB} onChange={setScoreB} />
            {error && <p className="text-xs text-danger p-2 bg-danger-dim rounded">{error}</p>}
            <button
              onClick={submit}
              disabled={submitting}
              className="vs-btn vs-btn-primary text-sm w-full disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Submit result'}
            </button>
            <p className="vs-counter text-[9px] text-text-dim text-center tabular-nums">
              WINNER ADVANCES AUTOMATICALLY
            </p>
          </div>
        )}
      </Sheet>
    </>
  )
}

function Slot({
  profile, score, isWinner, isLoser,
}: {
  profile?: Match['profile_a']
  score: number | null
  isWinner: boolean
  isLoser: boolean
}) {
  if (!profile) {
    return (
      <div className="flex items-center gap-2 text-text-dim">
        <Minus size={14} />
        <span className="text-xs italic">TBD</span>
      </div>
    )
  }
  return (
    <div className={`flex items-center gap-2 ${isLoser ? 'opacity-40' : ''}`}>
      <Avatar
        url={profile.avatar_url}
        name={profile.display_name || profile.username}
        size="xs"
        variant="gradient"
      />
      <Link
        href={`/profile/${profile.username}`}
        onClick={e => e.stopPropagation()}
        className="text-xs font-medium truncate flex-1 hover:text-purple-light transition-colors"
      >
        {profile.display_name || profile.username}
      </Link>
      {isWinner && <Crown size={11} className="text-yellow-400 shrink-0" />}
      <span className={`vs-counter text-xs tabular-nums shrink-0 w-6 text-right ${
        isWinner ? 'text-cyan' : 'text-text-dim'
      }`}>
        {score ?? '–'}
      </span>
    </div>
  )
}

function ScoreRow({
  profile, value, onChange,
}: {
  profile?: Match['profile_a']
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <Avatar
        url={profile?.avatar_url}
        name={profile?.display_name || profile?.username}
        size="sm"
        variant="gradient"
      />
      <span className="text-sm font-medium flex-1 truncate">
        {profile?.display_name || profile?.username}
      </span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="0"
        className="vs-input text-center w-20 tabular-nums"
        inputMode="numeric"
      />
    </div>
  )
}
