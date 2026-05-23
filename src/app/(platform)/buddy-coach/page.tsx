'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import type { Profile, Game } from '@/types'
import Link from 'next/link'
import {
  Users, UserPlus, GraduationCap, Star, Search, X, Check,
  Clock, Globe, Gamepad2, MessageCircle, ChevronRight,
  Mic, MapPin, Shield, Zap, Calendar, Send, Award
} from 'lucide-react'
import { ScopeSpinner } from '@/components/ui/loader'
import { EmptyState } from '@/components/ui/empty-state'
import { Avatar } from '@/components/ui/avatar'

type PageTab = 'buddy' | 'coaches' | 'my-sessions'

const TIERS = {
  basic: { label: 'Basic', price: '€10', cents: 1000 },
  standard: { label: 'Standard', price: '€25', cents: 2500 },
  premium: { label: 'Premium', price: '€50', cents: 5000 },
}

interface CoachProfile {
  id: string
  user_id: string
  bio: string | null
  specializations: string[]
  languages: string[]
  hourly_tier: string
  is_approved: boolean
  is_active: boolean
  total_sessions: number
  avg_rating: number
  review_count: number
  profile?: Profile
  games?: { game: Game; rank_info: string | null }[]
}

interface Session {
  id: string
  coach_id: string
  student_id: string
  game_id: string | null
  status: string
  tier: string
  price_cents: number
  notes: string | null
  scheduled_at: string | null
  completed_at: string | null
  created_at: string
  coach_profile?: { profile?: Profile }
  game?: Game
}

interface BuddyMatch {
  id: string
  username: string
  display_name: string | null
  level_name: string
  platforms: string[]
  buddy_playtimes: string[]
  xp: number
  shared_games: string[]
}

export default function BuddyCoachPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<PageTab>('buddy')
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Buddy
  const [buddyMatches, setBuddyMatches] = useState<BuddyMatch[]>([])
  const [isLookingForBuddy, setIsLookingForBuddy] = useState(false)

  // Coaches
  const [coaches, setCoaches] = useState<CoachProfile[]>([])
  const [coachGameFilter, setCoachGameFilter] = useState<string | null>(null)
  const [games, setGames] = useState<Game[]>([])

  // Booking
  const [bookingCoach, setBookingCoach] = useState<CoachProfile | null>(null)
  const [bookingTier, setBookingTier] = useState<string>('standard')
  const [bookingGame, setBookingGame] = useState<string>('')
  const [bookingNotes, setBookingNotes] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('20:00')
  const [booking, setBooking] = useState(false)

  // My sessions
  const [sessions, setSessions] = useState<Session[]>([])

  // Review
  const [reviewSession, setReviewSession] = useState<Session | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')

  useEffect(() => { init() }, [])
  useEffect(() => { loadTabData() }, [tab])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      if (data) {
        setProfile(data as Profile)
        setIsLookingForBuddy((data as any).buddy_looking || false)
      }
    }
    const { data: g } = await supabase.from('games').select('*').eq('is_approved', true).order('name')
    if (g) setGames(g)
    setLoading(false)
  }

  async function loadTabData() {
    if (tab === 'buddy') loadBuddyMatches()
    if (tab === 'coaches') loadCoaches()
    if (tab === 'my-sessions') loadSessions()
  }

  async function loadBuddyMatches() {
    if (!userId) return
    // Get current user's games
    const { data: myGames } = await supabase.from('user_games').select('game_id').eq('user_id', userId)
    const myGameIds = myGames?.map(g => g.game_id) || []

    // Find users looking for buddies who share games
    const { data: candidates } = await supabase
      .from('profiles')
      .select('id, username, display_name, level_name, platforms, buddy_playtimes, xp')
      .eq('buddy_looking', true)
      .eq('is_onboarded', true)
      .neq('id', userId)
      .limit(20)

    if (!candidates) return

    // Check shared games
    const matches: BuddyMatch[] = []
    for (const c of candidates) {
      const { data: theirGames } = await supabase.from('user_games').select('game:games(name)').eq('user_id', c.id)
      const theirGameNames = theirGames?.map((g: any) => g.game?.name).filter(Boolean) || []
      const { data: theirGameIds } = await supabase.from('user_games').select('game_id').eq('user_id', c.id)
      const shared = (theirGameIds || []).filter(g => myGameIds.includes(g.game_id))

      matches.push({
        ...c,
        buddy_playtimes: c.buddy_playtimes || [],
        shared_games: theirGameNames as string[],
      })
    }

    // Sort by shared games count
    matches.sort((a, b) => b.shared_games.length - a.shared_games.length)
    setBuddyMatches(matches)
  }

  async function toggleBuddyLooking() {
    if (!userId) return
    const newVal = !isLookingForBuddy
    await supabase.from('profiles').update({ buddy_looking: newVal }).eq('id', userId)
    setIsLookingForBuddy(newVal)
  }

  async function loadCoaches() {
    let query = supabase
      .from('coach_profiles')
      .select('*, profile:profiles(*)')
      .eq('is_approved', true)
      .eq('is_active', true)
      .order('avg_rating', { ascending: false })

    const { data } = await query
    if (!data) return

    // Load games for each coach
    const enriched = await Promise.all(data.map(async (c: any) => {
      const { data: cGames } = await supabase
        .from('coach_games')
        .select('*, game:games(*)')
        .eq('coach_id', c.id)
      return { ...c, games: cGames || [] }
    }))

    if (coachGameFilter) {
      setCoaches(enriched.filter(c => c.games.some((g: any) => g.game?.id === coachGameFilter)))
    } else {
      setCoaches(enriched as CoachProfile[])
    }
  }

  async function bookSession() {
    if (!userId || !bookingCoach) return
    setBooking(true)

    const tier = bookingTier as keyof typeof TIERS
    const scheduledAt = bookingDate && bookingTime
      ? new Date(`${bookingDate}T${bookingTime}:00`).toISOString()
      : null

    await supabase.from('coaching_sessions').insert({
      coach_id: bookingCoach.id,
      student_id: userId,
      game_id: bookingGame || null,
      tier: bookingTier,
      price_cents: TIERS[tier].cents,
      notes: bookingNotes.trim() || null,
      scheduled_at: scheduledAt,
      status: 'pending',
    })

    setBookingCoach(null)
    setBookingTier('standard')
    setBookingGame('')
    setBookingNotes('')
    setBookingDate('')
    setBookingTime('20:00')
    setBooking(false)
    if (tab === 'my-sessions') loadSessions()
  }

  async function loadSessions() {
    if (!userId) return
    const { data } = await supabase
      .from('coaching_sessions')
      .select('*, coach_profile:coach_profiles(profile:profiles(*)), game:games(*)')
      .or(`student_id.eq.${userId},coach_id.in.(select id from coach_profiles where user_id = '${userId}')`)
      .order('created_at', { ascending: false })
      .limit(30)
    if (data) setSessions(data as any)
  }

  async function updateSessionStatus(sessionId: string, status: string) {
    await supabase.from('coaching_sessions').update({ status, completed_at: status === 'completed' ? new Date().toISOString() : null }).eq('id', sessionId)
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status } : s))
  }

  async function submitReview() {
    if (!userId || !reviewSession) return
    const coachId = reviewSession.coach_id

    await supabase.from('coach_reviews').insert({
      session_id: reviewSession.id,
      reviewer_id: userId,
      coach_id: coachId,
      rating: reviewRating,
      content: reviewText.trim() || null,
    })

    setReviewSession(null)
    setReviewRating(5)
    setReviewText('')
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      pending: 'bg-warning/15 text-warning',
      confirmed: 'bg-cyan/15 text-cyan',
      completed: 'bg-success/15 text-success',
      cancelled: 'bg-danger/15 text-danger',
    }
    return <span className={`text-[9px] px-2 py-0.5 rounded ${styles[status] || 'bg-text-dim/15 text-text-dim'}`}>{status}</span>
  }

  if (loading) return <div className="flex items-center justify-center h-64"><ScopeSpinner size={28} /></div>

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-wide flex items-center gap-2">
          <Users size={20} className="text-purple" /> Buddy & Coach
        </h1>
        <p className="text-sm text-text-dim mt-0.5">Find a gaming buddy or level up with a coach</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1">
        {[
          { id: 'buddy' as PageTab, label: 'Find Buddy', icon: UserPlus, count: buddyMatches.length },
          { id: 'coaches' as PageTab, label: 'Coaches', icon: GraduationCap, count: coaches.length },
          { id: 'my-sessions' as PageTab, label: 'My Sessions', icon: Calendar, count: sessions.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            data-active={tab === t.id}
            className="vs-tab shrink-0"
          >
            <t.icon size={13} /> {t.label}
            {t.count > 0 && <span className="text-[10px] opacity-60 tabular-nums">({t.count})</span>}
          </button>
        ))}
      </div>

      {/* Buddy Tab */}
      {tab === 'buddy' && (
        <div>
          {/* Toggle */}
          <div className="vs-card mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Looking for a buddy?</p>
              <p className="text-xs text-text-dim mt-0.5">Toggle this on so others can find you</p>
            </div>
            <button onClick={toggleBuddyLooking}
              className={`w-12 h-6 rounded-full transition-colors relative ${isLookingForBuddy ? 'bg-cyan' : 'bg-surface-2'}`}>
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-colors duration-200 ${isLookingForBuddy ? 'left-[26px]' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Buddy matches */}
          {buddyMatches.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="No buddies looking right now"
              description={'Turn on "Looking for buddy" and check back later.'}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {buddyMatches.map(match => (
                <div key={match.id} className="vs-card hover:border-cyan/20 transition-colors duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar
                      url={(match as any).avatar_url}
                      name={match.display_name || match.username}
                      href={`/profile/${match.username}`}
                      size="md"
                      shape="rounded"
                      variant="gradient"
                      showInnerRing={(match as any).is_founding_member}
                    />
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${match.username}`} className="text-sm font-medium hover:text-cyan transition-colors">{match.display_name || match.username}</Link>
                      <p className="text-[10px] text-text-dim">@{match.username} · {match.level_name}</p>
                    </div>
                  </div>
                  {match.shared_games.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {match.shared_games.map(g => (
                        <span key={g} className="vs-badge vs-badge-cyan text-[8px]">{g}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-[10px] text-text-dim">
                    {match.platforms.length > 0 && <span>{match.platforms.join(', ')}</span>}
                    {match.buddy_playtimes.length > 0 && <span>{match.buddy_playtimes.join(', ')}</span>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Link href={`/messages`} className="vs-btn vs-btn-cyan text-[10px] px-3 py-1.5 flex-1 text-center">
                      <MessageCircle size={11} /> Message
                    </Link>
                    <Link href={`/profile/${match.username}`} className="vs-btn vs-btn-ghost text-[10px] px-3 py-1.5 flex-1 text-center">
                      Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Coaches Tab */}
      {tab === 'coaches' && (
        <div>
          {/* Game filter */}
          <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1">
            <button
              onClick={() => { setCoachGameFilter(null); setTimeout(loadCoaches, 0) }}
              data-active={!coachGameFilter}
              className="vs-tab shrink-0"
            >
              All Games
            </button>
            {games.slice(0, 6).map(g => (
              <button
                key={g.id}
                onClick={() => { setCoachGameFilter(g.id); setTimeout(loadCoaches, 0) }}
                data-active={coachGameFilter === g.id}
                className="vs-tab shrink-0"
              >
                {g.name.split(':')[0]}
              </button>
            ))}
          </div>

          {coaches.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No coaches available yet"
              description="Coaches need admin approval before they appear here."
            />
          ) : (
            <div className="space-y-3">
              {coaches.map(coach => {
                const p = coach.profile as any
                const tier = TIERS[coach.hourly_tier as keyof typeof TIERS] || TIERS.standard
                return (
                  <div key={coach.id} className="vs-card vs-lit hover:border-purple/30 transition-colors duration-200">
                    <div className="flex items-start gap-4">
                      <Avatar
                        url={p?.avatar_url}
                        name={p?.display_name || p?.username}
                        href={p?.username ? `/profile/${p.username}` : undefined}
                        size="lg"
                        shape="rounded"
                        variant="gradient"
                        showInnerRing={p?.is_founding_member}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link href={`/profile/${p?.username}`} className="text-sm font-semibold hover:text-purple transition-colors">{p?.display_name || p?.username}</Link>
                          <span className="vs-badge vs-badge-purple text-[8px]"><GraduationCap size={8} /> Coach</span>
                          {coach.avg_rating > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px] text-yellow-400 tabular-nums">
                              <Star size={10} fill="currentColor" /> {coach.avg_rating.toFixed(1)}
                              <span className="text-text-dim">({coach.review_count})</span>
                            </span>
                          )}
                        </div>
                        {coach.bio && <p className="text-xs text-text-muted mb-2 line-clamp-2">{coach.bio}</p>}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {coach.games?.map((cg: any) => (
                            <span key={cg.game?.id} className="vs-badge vs-badge-cyan text-[8px]">
                              {cg.game?.name} {cg.rank_info && `· ${cg.rank_info}`}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-text-dim">
                          <span className="tabular-nums">{coach.total_sessions} sessions</span>
                          {coach.languages.length > 0 && <span><Globe size={9} className="inline" /> {coach.languages.join(', ')}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-cyan tabular-nums">{tier.price}</p>
                        <p className="vs-counter text-[9px] text-text-dim">PER SESSION</p>
                        <button onClick={() => setBookingCoach(coach)}
                          className="vs-btn vs-btn-primary text-[10px] px-4 py-1.5 mt-2">
                          Book
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* My Sessions Tab */}
      {tab === 'my-sessions' && (
        <div>
          {sessions.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No sessions yet"
              description="Book a coach to get started."
              cta={{ label: 'Browse coaches', onClick: () => setTab('coaches') }}
            />
          ) : (
            <div className="space-y-3">
              {sessions.map(session => {
                const coachProfile = (session as any).coach_profile?.profile
                const isCoach = coachProfile?.id !== userId
                const tier = TIERS[session.tier as keyof typeof TIERS] || TIERS.standard

                return (
                  <div key={session.id} className="vs-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {isCoach ? `Coach: ${coachProfile?.display_name || coachProfile?.username}` : 'Your session'}
                        </span>
                        {getStatusBadge(session.status)}
                        {session.game && <span className="vs-badge vs-badge-purple text-[8px]">{(session.game as any)?.name}</span>}
                      </div>
                      <span className="text-sm font-bold text-cyan tabular-nums">{tier.price}</span>
                    </div>
                    {session.notes && <p className="text-xs text-text-muted mb-2">{session.notes}</p>}
                    <div className="flex items-center gap-3 text-[10px] text-text-dim">
                      <span>{tier.label} tier</span>
                      {session.scheduled_at && (
                        <span><Calendar size={9} className="inline" /> {new Date(session.scheduled_at).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                      <span>{new Date(session.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      {session.status === 'pending' && (
                        <>
                          <button onClick={() => updateSessionStatus(session.id, 'confirmed')} className="vs-btn vs-btn-cyan text-[10px] px-3 py-1.5"><Check size={11} /> Confirm</button>
                          <button onClick={() => updateSessionStatus(session.id, 'cancelled')} className="vs-btn vs-btn-ghost text-[10px] px-3 py-1.5"><X size={11} /> Cancel</button>
                        </>
                      )}
                      {session.status === 'confirmed' && (
                        <button onClick={() => updateSessionStatus(session.id, 'completed')} className="vs-btn vs-btn-primary text-[10px] px-3 py-1.5"><Check size={11} /> Mark Complete</button>
                      )}
                      {session.status === 'completed' && session.student_id === userId && (
                        <button onClick={() => setReviewSession(session)} className="vs-btn vs-btn-ghost text-[10px] px-3 py-1.5"><Star size={11} /> Leave Review</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      {bookingCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setBookingCoach(null)}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto animate-slide-up vs-lit" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-surface z-10">
              <h3 className="text-sm font-medium flex items-center gap-2"><GraduationCap size={16} className="text-purple" /> Book Session</h3>
              <button onClick={() => setBookingCoach(null)} className="text-text-dim hover:text-text"><X size={16} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <Avatar
                  url={(bookingCoach.profile as any)?.avatar_url}
                  name={(bookingCoach.profile as any)?.display_name || (bookingCoach.profile as any)?.username}
                  size="md"
                  shape="rounded"
                  variant="gradient"
                  showInnerRing={(bookingCoach.profile as any)?.is_founding_member}
                />
                <div>
                  <p className="text-sm font-medium">{(bookingCoach.profile as any)?.display_name || (bookingCoach.profile as any)?.username}</p>
                  {bookingCoach.avg_rating > 0 && (
                    <p className="text-[10px] text-yellow-400 tabular-nums">
                      <Star size={9} fill="currentColor" className="inline" /> {bookingCoach.avg_rating.toFixed(1)} ({bookingCoach.review_count} reviews)
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="vs-label block mb-2">SESSION TIER</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {Object.entries(TIERS).map(([key, val]) => (
                    <button key={key} onClick={() => setBookingTier(key)}
                      className={`py-3 rounded-lg text-center border transition-colors duration-200 ${bookingTier === key ? 'border-purple bg-purple/10 text-purple' : 'border-border bg-surface text-text-dim hover:border-border-hover'}`}>
                      <p className="text-lg font-bold">{val.price}</p>
                      <p className="text-[10px]">{val.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="vs-label block mb-1">GAME</label>
                <select value={bookingGame} onChange={e => setBookingGame(e.target.value)} className="vs-input text-sm appearance-none">
                  <option value="">Select game...</option>
                  {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="vs-label block mb-1">DATE</label>
                  <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} className="vs-input text-sm" />
                </div>
                <div>
                  <label className="vs-label block mb-1">TIME</label>
                  <input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)} className="vs-input text-sm" />
                </div>
              </div>

              <div>
                <label className="vs-label block mb-1">NOTES (OPTIONAL)</label>
                <textarea value={bookingNotes} onChange={e => setBookingNotes(e.target.value)} className="vs-input text-sm resize-none min-h-[60px]" placeholder="What do you want to work on?" maxLength={500} />
              </div>

              <button onClick={bookSession} disabled={booking} className="vs-btn vs-btn-primary w-full disabled:opacity-40">
                {booking ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : `Book for ${TIERS[bookingTier as keyof typeof TIERS].price}`}
              </button>
              <p className="text-[10px] text-text-dim text-center">Payment integration coming soon — sessions are free during beta</p>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setReviewSession(null)}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-sm mx-4 max-h-[85vh] overflow-y-auto animate-slide-up vs-lit" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-surface z-10">
              <h3 className="text-sm font-medium flex items-center gap-2"><Star size={16} className="text-yellow-400" /> Leave Review</h3>
              <button onClick={() => setReviewSession(null)} className="text-text-dim hover:text-text"><X size={16} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="vs-label block mb-2">RATING</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setReviewRating(n)}
                      className="transition-transform hover:scale-110">
                      <Star size={28} fill={n <= reviewRating ? '#FBBF24' : 'none'}
                        className={n <= reviewRating ? 'text-yellow-400' : 'text-text-dim'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="vs-label block mb-1">REVIEW (OPTIONAL)</label>
                <textarea value={reviewText} onChange={e => setReviewText(e.target.value)}
                  className="vs-input text-sm resize-none min-h-[80px]" placeholder="How was your session?" maxLength={500} />
              </div>
              <button onClick={submitReview} className="vs-btn vs-btn-primary w-full">Submit Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
