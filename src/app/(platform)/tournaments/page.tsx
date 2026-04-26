'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import type { Game, Profile } from '@/types'
import Link from 'next/link'
import {
  Trophy, Plus, X, Calendar, Users, MapPin, Monitor, Shield,
  Clock, ChevronRight, Crown, Swords, Check, Gamepad2, Search, Zap,
  Flame, Loader2,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Avatar } from '@/components/ui/avatar'
import { ScopeSpinner } from '@/components/ui/loader'
import { Bracket } from '@/components/tournament/Bracket'

interface Tournament {
  id: string
  name: string
  description: string | null
  game_id: string | null
  organizer_id: string
  format: string
  team_size: number
  max_teams: number
  prize_description: string | null
  rules: string | null
  region: string | null
  platform: string | null
  status: string
  registration_open: boolean
  starts_at: string
  registration_deadline: string | null
  created_at: string
  game?: Game
  organizer?: Profile
  registered_count?: number
  user_registered?: boolean
}

type StatusFilter = 'all' | 'upcoming' | 'registration' | 'in_progress' | 'completed'

export default function TournamentsPage() {
  const supabase = createClient()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formGame, setFormGame] = useState('')
  const [formFormat, setFormFormat] = useState('single_elimination')
  const [formTeamSize, setFormTeamSize] = useState(1)
  const [formMaxTeams, setFormMaxTeams] = useState(16)
  const [formPrize, setFormPrize] = useState('')
  const [formRules, setFormRules] = useState('')
  const [formRegion, setFormRegion] = useState('')
  const [formPlatform, setFormPlatform] = useState('')
  const [formStartDate, setFormStartDate] = useState('')
  const [formStartTime, setFormStartTime] = useState('20:00')
  const [formDeadline, setFormDeadline] = useState('')
  const [creating, setCreating] = useState(false)

  // Detail modal
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null)

  useEffect(() => { init() }, [])
  useEffect(() => { loadTournaments() }, [statusFilter, selectedGame])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)
    loadGames()
    loadTournaments()
    // Real-time: nieuwe tournaments + registraties verschijnen direct
    if (!channelRef.current) {
      channelRef.current = supabase
        .channel('tournaments-feed')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, () => loadTournaments())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_registrations' }, () => loadTournaments())
        .subscribe()
    }
  }

  function timeUntil(date: string): { text: string; live: boolean; soon: boolean } {
    const ms = new Date(date).getTime() - Date.now()
    if (ms <= 0) return { text: 'Live', live: true, soon: false }
    const minutes = Math.floor(ms / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const soon = ms < 60 * 60 * 1000 // <1h
    if (days >= 1) return { text: `in ${days}d ${hours % 24}h`, live: false, soon: false }
    if (hours >= 1) return { text: `in ${hours}h ${minutes % 60}m`, live: false, soon: false }
    return { text: `in ${minutes}m`, live: false, soon }
  }

  async function loadGames() {
    const { data } = await supabase.from('games').select('*').eq('is_approved', true).order('name')
    if (data) setGames(data)
  }

  async function loadTournaments() {
    setLoading(true)
    let query = supabase
      .from('tournaments')
      .select('*, game:games(*), organizer:profiles(*)')
      .neq('status', 'cancelled')
      .order('starts_at', { ascending: true })
      .limit(50)

    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    if (selectedGame) query = query.eq('game_id', selectedGame)

    const { data } = await query
    if (!data) { setLoading(false); return }

    // Enrich with registration counts and user status
    const enriched = await Promise.all(data.map(async (t) => {
      const { count } = await supabase
        .from('tournament_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', t.id)

      let userReg = false
      if (userId) {
        const { data: reg } = await supabase
          .from('tournament_registrations')
          .select('id')
          .eq('tournament_id', t.id)
          .eq('user_id', userId)
          .maybeSingle()
        userReg = !!reg
      }

      return { ...t, registered_count: count || 0, user_registered: userReg } as Tournament
    }))

    setTournaments(enriched)
    setLoading(false)
  }

  async function register(tournamentId: string) {
    if (!userId) return
    await supabase.from('tournament_registrations').insert({ tournament_id: tournamentId, user_id: userId })
    setTournaments(prev => prev.map(t =>
      t.id === tournamentId ? { ...t, user_registered: true, registered_count: (t.registered_count || 0) + 1 } : t
    ))
    if (activeTournament?.id === tournamentId) {
      setActiveTournament(prev => prev ? { ...prev, user_registered: true, registered_count: (prev.registered_count || 0) + 1 } : null)
    }
  }

  async function unregister(tournamentId: string) {
    if (!userId) return
    await supabase.from('tournament_registrations').delete().eq('tournament_id', tournamentId).eq('user_id', userId)
    setTournaments(prev => prev.map(t =>
      t.id === tournamentId ? { ...t, user_registered: false, registered_count: Math.max(0, (t.registered_count || 0) - 1) } : t
    ))
    if (activeTournament?.id === tournamentId) {
      setActiveTournament(prev => prev ? { ...prev, user_registered: false, registered_count: Math.max(0, (prev.registered_count || 0) - 1) } : null)
    }
  }

  async function createTournament() {
    if (!userId || !formName.trim() || !formStartDate) return
    setCreating(true)

    const startsAt = new Date(`${formStartDate}T${formStartTime}:00`).toISOString()
    const deadline = formDeadline ? new Date(`${formDeadline}T23:59:00`).toISOString() : null

    const { error } = await supabase.from('tournaments').insert({
      name: formName.trim(),
      description: formDesc.trim() || null,
      game_id: formGame || null,
      organizer_id: userId,
      format: formFormat,
      team_size: formTeamSize,
      max_teams: formMaxTeams,
      prize_description: formPrize.trim() || null,
      rules: formRules.trim() || null,
      region: formRegion || null,
      platform: formPlatform || null,
      status: 'registration',
      starts_at: startsAt,
      registration_deadline: deadline,
    })

    if (!error) {
      setShowCreate(false)
      setFormName(''); setFormDesc(''); setFormGame(''); setFormFormat('single_elimination')
      setFormTeamSize(1); setFormMaxTeams(16); setFormPrize(''); setFormRules('')
      setFormRegion(''); setFormPlatform(''); setFormStartDate(''); setFormStartTime('20:00'); setFormDeadline('')
      loadTournaments()
    }
    setCreating(false)
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'upcoming': return <span className="vs-badge text-[9px] bg-text-dim/15 text-text-dim">Upcoming</span>
      case 'registration': return <span className="vs-badge text-[9px] bg-success/15 text-success">Open</span>
      case 'in_progress': return <span className="vs-badge text-[9px] bg-warning/15 text-warning">Live</span>
      case 'completed': return <span className="vs-badge text-[9px] bg-purple/15 text-purple">Completed</span>
      default: return null
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function formatLabel(f: string) {
    return f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-wide flex items-center gap-2">
            <Trophy size={20} className="text-purple" /> Tournaments
          </h1>
          <p className="text-sm text-text-dim mt-0.5">Compete, climb, win</p>
        </div>
        {userId && (
          <button onClick={() => setShowCreate(true)} className="vs-btn vs-btn-primary text-sm">
            <Plus size={15} /> Create Tournament
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tournaments..."
            className="vs-input text-xs pl-8 py-1.5"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {(['all', 'registration', 'upcoming', 'in_progress', 'completed'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              data-active={statusFilter === s}
              className="vs-tab text-xs"
            >
              {s === 'all' ? 'All' : s === 'in_progress' ? <><Flame size={11} /> Live</> : formatLabel(s)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 mb-5 flex-wrap">
        <button onClick={() => setSelectedGame(null)} data-active={!selectedGame} className="vs-tab text-xs">
          All Games
        </button>
        {games.slice(0, 5).map(g => (
          <button
            key={g.id}
            onClick={() => setSelectedGame(g.id)}
            data-active={selectedGame === g.id}
            className="vs-tab text-xs"
          >
            {g.name.split(':')[0]}
          </button>
        ))}
      </div>

      {/* Tournament list */}
      {loading ? (
        <div className="flex justify-center py-12"><ScopeSpinner size={28} /></div>
      ) : (() => {
        const filtered = searchQuery
          ? tournaments.filter(t =>
              t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (t.description || '').toLowerCase().includes(searchQuery.toLowerCase())
            )
          : tournaments
        if (filtered.length === 0) {
          return (
            <EmptyState
              icon={Trophy}
              title={searchQuery ? `No tournaments match "${searchQuery}"` : 'No tournaments found'}
              description={searchQuery ? 'Try a different keyword or remove filters.' : 'Create one and start competing.'}
              cta={!searchQuery && userId ? { label: 'Create tournament', onClick: () => setShowCreate(true) } : undefined}
            />
          )
        }
        return (
          <div className="space-y-3">
            {filtered.map(t => {
              const game = t.game as Game | undefined
              const organizer = t.organizer as (Profile & { is_verified?: boolean; level_name?: string }) | undefined
              const isFull = (t.registered_count || 0) >= t.max_teams
              const canRegister = t.registration_open && !isFull && t.status === 'registration' && !t.user_registered
              const tu = timeUntil(t.starts_at)

              return (
                <div key={t.id} className="vs-card vs-lit hover:border-border-hover transition-all cursor-pointer" onClick={() => setActiveTournament(t)}>
                  <div className="flex items-start gap-4">
                    {/* Trophy icon with status color */}
                    <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      t.status === 'in_progress' ? 'bg-warning/15' :
                      t.status === 'completed' ? 'bg-purple/15' :
                      t.status === 'registration' ? 'bg-success/15' : 'bg-surface-2'
                    }`}>
                      <Trophy size={20} className={
                        t.status === 'in_progress' ? 'text-warning' :
                        t.status === 'completed' ? 'text-purple' :
                        t.status === 'registration' ? 'text-success' : 'text-text-dim'
                      } />
                      {tu.live && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-warning opacity-75 animate-ping" />
                          <span className="relative inline-flex h-3 w-3 rounded-full bg-warning" />
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-semibold">{t.name}</h3>
                        {getStatusBadge(t.status)}
                        {game && <span className="vs-badge vs-badge-purple text-[9px]">{game.name}</span>}
                      </div>

                      {t.description && <p className="text-xs text-text-muted mb-2 line-clamp-1">{t.description}</p>}

                      <div className="flex items-center gap-3 text-[10px] text-text-dim flex-wrap">
                        <span className={`flex items-center gap-1 ${tu.soon ? 'text-warning' : tu.live ? 'text-warning' : ''}`}>
                          <Calendar size={10} /> {tu.live ? '🔴 Live now' : tu.text}
                        </span>
                        <span className="flex items-center gap-1"><Users size={10} /> {t.registered_count}/{t.max_teams} teams</span>
                        <span className="flex items-center gap-1"><Swords size={10} /> {formatLabel(t.format)}</span>
                        {t.team_size > 1 && <span>{t.team_size}v{t.team_size}</span>}
                        {t.platform && <span className="flex items-center gap-1"><Monitor size={10} /> {t.platform}</span>}
                        {t.region && <span className="flex items-center gap-1"><MapPin size={10} /> {t.region}</span>}
                        {t.prize_description && <span className="flex items-center gap-1 text-cyan"><Crown size={10} /> {t.prize_description}</span>}
                      </div>

                      {/* Organizer compact */}
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-text-dim">
                        <span>by</span>
                        <Link href={`/profile/${organizer?.username}`} className="flex items-center gap-1.5 hover:text-purple transition-colors" onClick={e => e.stopPropagation()}>
                          <Avatar
                            url={organizer?.avatar_url}
                            name={organizer?.display_name || organizer?.username}
                            size="xs"
                            variant="gradient"
                            showInnerRing={organizer?.is_founding_member}
                          />
                          <span>@{organizer?.username}</span>
                        </Link>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="shrink-0" onClick={e => e.stopPropagation()}>
                      {t.user_registered ? (
                        <button onClick={() => unregister(t.id)} className="vs-btn vs-btn-ghost text-xs px-3 py-1.5">
                          <Check size={12} /> Registered
                        </button>
                      ) : canRegister ? (
                        <button onClick={() => register(t.id)} className="vs-btn vs-btn-primary text-xs px-3 py-1.5">
                          Register
                        </button>
                      ) : isFull ? (
                        <span className="text-xs text-text-dim">Full</span>
                      ) : null}
                    </div>
                  </div>

                  {/* Fill bar — gradient */}
                  <div className="mt-3 h-1.5 bg-void rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isFull
                          ? 'bg-gradient-to-r from-success to-cyan shadow-[0_0_8px_rgba(93,202,165,0.4)]'
                          : 'bg-gradient-to-r from-purple to-cyan shadow-[0_0_8px_rgba(107,63,224,0.4)]'
                      }`}
                      style={{ width: `${((t.registered_count || 0) / t.max_teams) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* Tournament detail modal */}
      {activeTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setActiveTournament(null)}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto animate-slide-up vs-lit" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-surface z-10">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-purple" />
                <h3 className="text-sm font-semibold">{activeTournament.name}</h3>
                {getStatusBadge(activeTournament.status)}
              </div>
              <button onClick={() => setActiveTournament(null)} className="text-text-dim hover:text-text"><X size={16} /></button>
            </div>
            <div className="p-4 space-y-4">
              {activeTournament.description && <p className="text-sm text-text-muted leading-relaxed">{activeTournament.description}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="vs-card py-2.5 text-center">
                  <p className="text-[10px] text-text-dim">STARTS</p>
                  <p className="text-sm font-medium mt-0.5">{formatDate(activeTournament.starts_at)}</p>
                </div>
                <div className="vs-card py-2.5 text-center">
                  <p className="text-[10px] text-text-dim">FORMAT</p>
                  <p className="text-sm font-medium mt-0.5">{formatLabel(activeTournament.format)}</p>
                </div>
                <div className="vs-card py-2.5 text-center">
                  <p className="text-[10px] text-text-dim">TEAMS</p>
                  <p className="text-sm font-medium mt-0.5">{activeTournament.registered_count}/{activeTournament.max_teams}</p>
                </div>
                <div className="vs-card py-2.5 text-center">
                  <p className="text-[10px] text-text-dim">TEAM SIZE</p>
                  <p className="text-sm font-medium mt-0.5">{activeTournament.team_size}v{activeTournament.team_size}</p>
                </div>
              </div>

              {activeTournament.prize_description && (
                <div className="vs-card bg-gradient-to-r from-purple/10 to-surface">
                  <div className="flex items-center gap-2 mb-1">
                    <Crown size={14} className="text-cyan" />
                    <p className="vs-label text-cyan">PRIZE</p>
                  </div>
                  <p className="text-sm">{activeTournament.prize_description}</p>
                </div>
              )}

              {activeTournament.rules && (
                <div>
                  <p className="vs-label mb-1">RULES</p>
                  <p className="text-xs text-text-muted leading-relaxed whitespace-pre-wrap">{activeTournament.rules}</p>
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-text-dim">
                {(activeTournament.game as any)?.name && <span className="vs-badge vs-badge-purple">{(activeTournament.game as any).name}</span>}
                {activeTournament.platform && <span className="flex items-center gap-1"><Monitor size={11} /> {activeTournament.platform}</span>}
                {activeTournament.region && <span className="flex items-center gap-1"><MapPin size={11} /> {activeTournament.region}</span>}
              </div>

              <div className="flex items-center gap-2 text-xs text-text-dim">
                <span>Organized by</span>
                <Link
                  href={`/profile/${(activeTournament.organizer as any)?.username}`}
                  className="flex items-center gap-1.5 text-text hover:text-purple transition-colors"
                  onClick={() => setActiveTournament(null)}
                >
                  <Avatar
                    url={(activeTournament.organizer as any)?.avatar_url}
                    name={(activeTournament.organizer as any)?.display_name || (activeTournament.organizer as any)?.username}
                    size="xs"
                    variant="gradient"
                    showInnerRing={(activeTournament.organizer as any)?.is_founding_member}
                  />
                  <span>@{(activeTournament.organizer as any)?.username}</span>
                </Link>
              </div>

              {/* Register/unregister */}
              {userId && activeTournament.status === 'registration' && (
                <div className="pt-2">
                  {activeTournament.user_registered ? (
                    <button onClick={() => unregister(activeTournament.id)} className="vs-btn vs-btn-ghost w-full">
                      <Check size={14} /> Registered — Click to unregister
                    </button>
                  ) : (activeTournament.registered_count || 0) < activeTournament.max_teams ? (
                    <button onClick={() => register(activeTournament.id)} className="vs-btn vs-btn-primary w-full">
                      Register for Tournament
                    </button>
                  ) : (
                    <p className="text-center text-sm text-text-dim">Registration is full</p>
                  )}
                </div>
              )}

              {/* Bracket section */}
              <BracketSection
                tournamentId={activeTournament.id}
                isOrganizer={(activeTournament.organizer as { id?: string })?.id === userId}
                organizerId={(activeTournament.organizer as { id?: string })?.id || ''}
                tournamentStatus={activeTournament.status}
                userId={userId}
              />
            </div>
          </div>
        </div>
      )}

      {/* Create tournament modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto animate-slide-up vs-lit" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-surface z-10">
              <h3 className="text-sm font-medium flex items-center gap-2"><Plus size={16} className="text-purple" /> Create Tournament</h3>
              <button onClick={() => setShowCreate(false)} className="text-text-dim hover:text-text"><X size={16} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="vs-label block mb-1">NAME *</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} className="vs-input text-sm" placeholder="Void Cup #1" maxLength={80} />
              </div>
              <div>
                <label className="vs-label block mb-1">DESCRIPTION</label>
                <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} className="vs-input text-sm resize-none min-h-[60px]" placeholder="Tournament details..." maxLength={1000} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="vs-label block mb-1">GAME</label>
                  <select value={formGame} onChange={e => setFormGame(e.target.value)} className="vs-input text-sm appearance-none">
                    <option value="">Select game...</option>
                    {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="vs-label block mb-1">FORMAT</label>
                  <select value={formFormat} onChange={e => setFormFormat(e.target.value)} className="vs-input text-sm appearance-none">
                    <option value="single_elimination">Single Elimination</option>
                    <option value="double_elimination">Double Elimination</option>
                    <option value="round_robin">Round Robin</option>
                    <option value="swiss">Swiss</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="vs-label block mb-1">TEAM SIZE</label>
                  <select value={formTeamSize} onChange={e => setFormTeamSize(Number(e.target.value))} className="vs-input text-sm appearance-none">
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}v{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="vs-label block mb-1">MAX TEAMS</label>
                  <select value={formMaxTeams} onChange={e => setFormMaxTeams(Number(e.target.value))} className="vs-input text-sm appearance-none">
                    {[4,8,16,32,64,128].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="vs-label block mb-1">REGION</label>
                  <select value={formRegion} onChange={e => setFormRegion(e.target.value)} className="vs-input text-sm appearance-none">
                    <option value="">Any</option>
                    <option value="EU">EU</option>
                    <option value="NA">NA</option>
                    <option value="APAC">APAC</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="vs-label block mb-1">START DATE *</label>
                  <input type="date" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} className="vs-input text-sm" />
                </div>
                <div>
                  <label className="vs-label block mb-1">START TIME</label>
                  <input type="time" value={formStartTime} onChange={e => setFormStartTime(e.target.value)} className="vs-input text-sm" />
                </div>
              </div>
              <div>
                <label className="vs-label block mb-1">REGISTRATION DEADLINE</label>
                <input type="date" value={formDeadline} onChange={e => setFormDeadline(e.target.value)} className="vs-input text-sm" />
              </div>
              <div>
                <label className="vs-label block mb-1">PRIZE</label>
                <input value={formPrize} onChange={e => setFormPrize(e.target.value)} className="vs-input text-sm" placeholder="e.g. Bragging rights, $50 gift card..." />
              </div>
              <div>
                <label className="vs-label block mb-1">RULES</label>
                <textarea value={formRules} onChange={e => setFormRules(e.target.value)} className="vs-input text-sm resize-none min-h-[60px]" placeholder="Tournament rules..." maxLength={2000} />
              </div>
              <button onClick={createTournament} disabled={!formName.trim() || !formStartDate || creating} className="vs-btn vs-btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed">
                {creating ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Create Tournament'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface BracketMatch {
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

function BracketSection({
  tournamentId, isOrganizer, organizerId, tournamentStatus, userId,
}: {
  tournamentId: string
  isOrganizer: boolean
  organizerId: string
  tournamentStatus: string
  userId: string | null
}) {
  const supabase = createClient()
  const [matches, setMatches] = useState<BracketMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('tournament_matches')
      .select(`
        *,
        profile_a:profiles!tournament_matches_entrant_a_fkey(id, username, display_name, avatar_url),
        profile_b:profiles!tournament_matches_entrant_b_fkey(id, username, display_name, avatar_url)
      `)
      .eq('tournament_id', tournamentId)
      .order('round', { ascending: true })
      .order('slot', { ascending: true })
    setMatches((data || []) as unknown as BracketMatch[])
    setLoading(false)
  }

  useEffect(() => { load() }, [tournamentId])

  async function generate() {
    setGenerating(true)
    setError(null)
    try {
      const { error: e } = await supabase.rpc('generate_tournament_bracket', {
        p_tournament_id: tournamentId,
      })
      if (e) throw e
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate bracket')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="pt-4 border-t border-border">
      <div className="flex items-center justify-between mb-3">
        <p className="vs-label flex items-center gap-1.5">
          <Swords size={11} className="text-purple" /> BRACKET
        </p>
        {isOrganizer && matches.length === 0 && tournamentStatus !== 'completed' && (
          <button
            onClick={generate}
            disabled={generating}
            className="vs-btn vs-btn-primary text-xs disabled:opacity-50"
          >
            {generating ? <Loader2 size={12} className="animate-spin" /> : <><Swords size={12} /> Generate</>}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-danger mb-2">{error}</p>}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <ScopeSpinner size={22} />
        </div>
      ) : (
        <Bracket
          matches={matches}
          currentUserId={userId}
          organizerId={organizerId}
          onChanged={load}
        />
      )}
    </div>
  )
}
