'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import type { Game, Profile } from '@/types'
import Link from 'next/link'
import {
  Users, Plus, X, Mic, Clock, MapPin, Monitor, Shield,
  UserPlus, Check, Gamepad2, Search, Send, Inbox, Crown,
  Zap, ChevronDown
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Avatar } from '@/components/ui/avatar'
import { ScopeSpinner } from '@/components/ui/loader'

interface LfgResponse {
  id: string
  user_id: string
  message: string | null
  status: 'pending' | 'accepted' | 'declined' | null
  created_at: string
  profile?: Profile
}

interface LfgPost {
  id: string
  user_id: string
  game_id: string
  title: string
  description: string | null
  platform: string | null
  region: string | null
  min_rank: string | null
  party_size: number
  filled: number
  mic_required: boolean
  status: string
  created_at: string
  bumped_at: string
  expires_at: string
  discord_link: string | null
  profile?: Profile
  game?: Game
  responses?: LfgResponse[]
  my_response?: LfgResponse | null
}

type ViewMode = 'browse' | 'mine' | 'applied' | 'squads'

export default function LfgPage() {
  const supabase = createClient()
  const [posts, setPosts] = useState<LfgPost[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // View + filters
  const [view, setView] = useState<ViewMode>('browse')
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Quick-filter chips (combineerbaar)
  const [chipMicOnly, setChipMicOnly] = useState(false)
  const [chipMyGamesOnly, setChipMyGamesOnly] = useState(false)
  const [chipUrgent, setChipUrgent] = useState(false)  // <30 min left
  const [userGames, setUserGames] = useState<string[]>([])

  // Quick composer (inline)
  const [quickOpen, setQuickOpen] = useState(false)
  const [quickTitle, setQuickTitle] = useState('')
  const [quickGame, setQuickGame] = useState('')
  const [quickPartySize, setQuickPartySize] = useState(2)
  const [quickMic, setQuickMic] = useState(false)
  const [quickSubmitting, setQuickSubmitting] = useState(false)

  // Counts voor My LFG section
  const [myCounts, setMyCounts] = useState({ posts: 0, applied: 0, squads: 0 })

  // Apply-with-note state per post
  const [applyingPostId, setApplyingPostId] = useState<string | null>(null)
  const [applyNote, setApplyNote] = useState('')

  // Owner-side: panel open voor responses
  const [openResponsesId, setOpenResponsesId] = useState<string | null>(null)

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formGame, setFormGame] = useState('')
  const [formPlatform, setFormPlatform] = useState('')
  const [formRegion, setFormRegion] = useState('')
  const [formPartySize, setFormPartySize] = useState(2)
  const [formMic, setFormMic] = useState(false)
  const [formMinRank, setFormMinRank] = useState('')
  const [formDiscord, setFormDiscord] = useState('')
  const [creating, setCreating] = useState(false)

  // Live pulse — totalen
  const [pulse, setPulse] = useState({ active: 0, formingNow: 0 })

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => { init() }, [])
  useEffect(() => {
    if (userId) loadAll()
  }, [view, selectedGame, selectedPlatform, userId, chipMicOnly, chipMyGamesOnly, chipUrgent])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      // Pre-fill quick composer met user's main game
      const { data: ug } = await supabase
        .from('user_games')
        .select('game_id, is_main')
        .eq('user_id', user.id)
      if (ug) {
        setUserGames(ug.map((u: { game_id: string }) => u.game_id))
        const main = ug.find((u: { is_main: boolean }) => u.is_main)
        if (main) setQuickGame((main as { game_id: string }).game_id)
      }
    }
    await loadGames()
    if (user) {
      await loadAll(user.id)
      subscribeRealtime(user.id)
    } else {
      await loadAll(null)
    }
  }

  function subscribeRealtime(uid: string) {
    if (channelRef.current) return
    channelRef.current = supabase
      .channel('lfg-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lfg_posts' }, () => loadAll(uid))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lfg_posts' }, () => loadAll(uid))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lfg_responses' }, () => loadAll(uid))
      .subscribe()
  }

  async function loadGames() {
    const { data } = await supabase.from('games').select('*').eq('is_approved', true).order('name')
    if (data) setGames(data)
  }

  async function loadAll(uid: string | null = userId) {
    setLoading(true)

    // Build base query — depends on view-mode. Sort by bumped_at zodat
    // gebumpte posts naar boven komen (bumped_at = created_at by default).
    let postQuery = supabase
      .from('lfg_posts')
      .select('*, profile:profiles(*), game:games(*), responses:lfg_responses(id, user_id, message, status, created_at, profile:profiles(*))')
      .order('bumped_at', { ascending: false })
      .limit(50)

    if (view === 'mine' && uid) {
      postQuery = postQuery.eq('user_id', uid)
    } else if (view === 'applied' && uid) {
      // Posts waar ik op heb gereageerd — sub-query approach via responses
      const { data: myResp } = await supabase
        .from('lfg_responses')
        .select('lfg_post_id')
        .eq('user_id', uid)
      const ids = (myResp ?? []).map((r: { lfg_post_id: string }) => r.lfg_post_id)
      if (ids.length === 0) {
        setPosts([])
        setLoading(false)
        return
      }
      postQuery = postQuery.in('id', ids)
    } else if (view === 'squads' && uid) {
      // Squads waar ik in zit (accepted response of eigen post)
      const { data: accepted } = await supabase
        .from('lfg_responses')
        .select('lfg_post_id')
        .eq('user_id', uid)
        .eq('status', 'accepted')
      const ids = (accepted ?? []).map((r: { lfg_post_id: string }) => r.lfg_post_id)
      postQuery = postQuery.or(`user_id.eq.${uid},id.in.(${ids.length ? ids.join(',') : '00000000-0000-0000-0000-000000000000'})`)
    } else {
      // Browse view — alleen open en niet verlopen
      postQuery = postQuery.in('status', ['open']).gt('expires_at', new Date().toISOString())
      if (selectedGame) postQuery = postQuery.eq('game_id', selectedGame)
      if (selectedPlatform) postQuery = postQuery.eq('platform', selectedPlatform)
      if (chipMicOnly) postQuery = postQuery.eq('mic_required', true)
      if (chipMyGamesOnly && userGames.length > 0) postQuery = postQuery.in('game_id', userGames)
      if (chipUrgent) {
        const cutoff = new Date(Date.now() + 30 * 60 * 1000).toISOString()
        postQuery = postQuery.lt('expires_at', cutoff)
      }
    }

    const { data } = await postQuery
    if (data) {
      const enriched = (data as unknown as LfgPost[]).map(p => ({
        ...p,
        my_response: uid ? p.responses?.find(r => r.user_id === uid) ?? null : null,
      }))
      setPosts(enriched)
    }

    // Load counts voor My LFG section + pulse
    if (uid) {
      const [myPosts, myApplied, mySquads, allActive] = await Promise.all([
        supabase.from('lfg_posts').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'open').gt('expires_at', new Date().toISOString()),
        supabase.from('lfg_responses').select('id', { count: 'exact', head: true }).eq('user_id', uid).is('status', null),
        supabase.from('lfg_responses').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'accepted'),
        supabase.from('lfg_posts').select('id', { count: 'exact', head: true }).eq('status', 'open').gt('expires_at', new Date().toISOString()),
      ])
      setMyCounts({
        posts: myPosts.count ?? 0,
        applied: myApplied.count ?? 0,
        squads: mySquads.count ?? 0,
      })
      setPulse({ active: allActive.count ?? 0, formingNow: 0 })
    }

    setLoading(false)
  }

  async function createPost() {
    if (!userId || !formTitle.trim() || !formGame) return
    setCreating(true)
    const { error } = await supabase.from('lfg_posts').insert({
      user_id: userId,
      game_id: formGame,
      title: formTitle.trim(),
      description: formDesc.trim() || null,
      platform: formPlatform || null,
      region: formRegion || null,
      min_rank: formMinRank.trim() || null,
      party_size: formPartySize,
      mic_required: formMic,
      discord_link: formDiscord.trim() || null,
    })
    if (!error) {
      setShowCreate(false)
      setFormTitle(''); setFormDesc(''); setFormGame(''); setFormPlatform('')
      setFormRegion(''); setFormPartySize(2); setFormMic(false); setFormMinRank('')
      setFormDiscord('')
      loadAll()
    }
    setCreating(false)
  }

  async function quickPost() {
    if (!userId || !quickTitle.trim() || !quickGame) return
    setQuickSubmitting(true)
    const { error } = await supabase.from('lfg_posts').insert({
      user_id: userId,
      game_id: quickGame,
      title: quickTitle.trim(),
      party_size: quickPartySize,
      mic_required: quickMic,
    })
    if (!error) {
      setQuickTitle('')
      setQuickPartySize(2)
      setQuickMic(false)
      setQuickOpen(false)
      loadAll()
    }
    setQuickSubmitting(false)
  }

  async function applyToPost(postId: string) {
    if (!userId) return
    const { data: insertedResp } = await supabase
      .from('lfg_responses')
      .insert({
        lfg_post_id: postId,
        user_id: userId,
        message: applyNote.trim() || null,
      })
      .select('id')
      .maybeSingle()

    // Notify post-eigenaar
    const post = posts.find(p => p.id === postId)
    if (post && insertedResp) {
      const { data: { user: me } } = await supabase.auth.getUser()
      const myProfile = me ? await supabase.from('profiles').select('display_name, username').eq('id', me.id).maybeSingle() : null
      const applicantName = myProfile?.data?.display_name || myProfile?.data?.username || 'Someone'
      await supabase.from('notifications').insert({
        user_id: post.user_id,
        type: 'lfg_apply',
        title: `${applicantName} applied to your LFG`,
        body: post.title,
        link: '/lfg',
      })
    }
    setApplyingPostId(null)
    setApplyNote('')
    loadAll()
  }

  async function acceptResponse(responseId: string, postId: string) {
    await supabase.from('lfg_responses').update({ status: 'accepted' }).eq('id', responseId)
    const post = posts.find(p => p.id === postId)
    if (!post) { loadAll(); return }

    const newFilled = (post.filled ?? 0) + 1
    const willBeFull = newFilled >= post.party_size - 1 // -1 omdat poster zelf ook telt; party_size includes lead

    // Bump filled + auto-close als vol
    const update: Record<string, unknown> = { filled: newFilled }
    if (willBeFull) update.status = 'closed'
    await supabase.from('lfg_posts').update(update).eq('id', postId)

    // Vind applicant
    const response = post.responses?.find(r => r.id === responseId)
    const applicantId = response?.user_id

    if (applicantId && userId) {
      // Start of pak bestaande conversation tussen owner en applicant
      const userA = userId < applicantId ? userId : applicantId
      const userB = userId < applicantId ? applicantId : userId
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_a', userA)
        .eq('user_b', userB)
        .maybeSingle()

      let convId = existing?.id
      if (!convId) {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({ user_a: userA, user_b: userB })
          .select('id')
          .maybeSingle()
        convId = newConv?.id
      }

      // Welcome-message
      if (convId) {
        await supabase.from('messages').insert({
          conversation_id: convId,
          sender_id: userId,
          content: `Welcome to the squad! 🎮 — ${post.title}`,
        })
        await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', convId)
      }

      // Notify de applicant
      await supabase.from('notifications').insert({
        user_id: applicantId,
        type: 'lfg_accepted',
        title: `You're in the squad`,
        body: post.title,
        link: convId ? `/messages?conv=${convId}` : '/messages',
      })
    }

    loadAll()
  }

  async function declineResponse(responseId: string) {
    await supabase.from('lfg_responses').update({ status: 'declined' }).eq('id', responseId)
    loadAll()
  }

  async function closePost(postId: string) {
    await supabase.from('lfg_posts').update({ status: 'closed' }).eq('id', postId)
    loadAll()
  }

  async function bumpPost(postId: string) {
    await supabase.from('lfg_posts').update({ bumped_at: new Date().toISOString() }).eq('id', postId)
    loadAll()
  }

  function timeAgo(date: string) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    return `${Math.floor(s / 86400)}d ago`
  }

  function expiresIn(date: string) {
    const s = Math.floor((new Date(date).getTime() - Date.now()) / 1000)
    if (s <= 0) return 'Expired'
    if (s < 3600) return `${Math.floor(s / 60)}m left`
    if (s < 86400) return `${Math.floor(s / 3600)}h left`
    return `${Math.floor(s / 86400)}d left`
  }

  const filtered = searchQuery
    ? posts.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : posts

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header — title + live pulse + create CTA */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-wide flex items-center gap-2">
            <Users size={20} className="text-purple" /> LFG
          </h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-text-dim">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              <span><strong className="text-text">{pulse.active}</strong> looking now</span>
            </span>
          </div>
        </div>
        {userId && (
          <button onClick={() => setShowCreate(true)} className="vs-btn vs-btn-primary text-sm">
            <Plus size={15} /> Create LFG
          </button>
        )}
      </div>

      {/* My LFG bar — quick switch */}
      {userId && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          <button
            onClick={() => setView('browse')}
            data-active={view === 'browse'}
            className="vs-card vs-tab text-left py-3 px-4 flex flex-col gap-1 items-start"
          >
            <span className="vs-label flex items-center gap-1.5"><Search size={11} /> BROWSE</span>
            <span className="text-base font-medium">All squads</span>
          </button>
          <button
            onClick={() => setView('mine')}
            data-active={view === 'mine'}
            className="vs-card vs-tab text-left py-3 px-4 flex flex-col gap-1 items-start"
          >
            <span className="vs-label flex items-center gap-1.5"><Crown size={11} /> MY POSTS</span>
            <span className="text-base font-medium">{myCounts.posts}</span>
          </button>
          <button
            onClick={() => setView('applied')}
            data-active={view === 'applied'}
            className="vs-card vs-tab text-left py-3 px-4 flex flex-col gap-1 items-start"
          >
            <span className="vs-label flex items-center gap-1.5"><Inbox size={11} /> APPLIED</span>
            <span className="text-base font-medium">{myCounts.applied}</span>
          </button>
          <button
            onClick={() => setView('squads')}
            data-active={view === 'squads'}
            className="vs-card vs-tab text-left py-3 px-4 flex flex-col gap-1 items-start"
          >
            <span className="vs-label flex items-center gap-1.5"><Users size={11} /> SQUADS</span>
            <span className="text-base font-medium">{myCounts.squads}</span>
          </button>
        </div>
      )}

      {/* Quick composer — inline, snel posten */}
      {view === 'browse' && userId && (
        <div className="vs-card vs-lit mb-4">
          {!quickOpen ? (
            <button
              onClick={() => setQuickOpen(true)}
              className="w-full flex items-center gap-3 text-left text-sm text-text-dim hover:text-text-muted transition-colors"
            >
              <Zap size={16} className="text-purple shrink-0" />
              <span className="flex-1">Quick LFG — wat zoek je?</span>
              <ChevronDown size={14} className="opacity-50" />
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-purple shrink-0" />
                <input
                  autoFocus
                  value={quickTitle}
                  onChange={e => setQuickTitle(e.target.value)}
                  placeholder="Need 2 for ranked grind…"
                  maxLength={80}
                  className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-dim"
                />
                <button onClick={() => setQuickOpen(false)} className="text-text-dim hover:text-text">
                  <X size={14} />
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <select value={quickGame} onChange={e => setQuickGame(e.target.value)} className="bg-surface-2 border border-border rounded-md px-2.5 py-1 text-xs outline-none">
                  <option value="">Select game…</option>
                  {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <select value={quickPartySize} onChange={e => setQuickPartySize(Number(e.target.value))} className="bg-surface-2 border border-border rounded-md px-2.5 py-1 text-xs outline-none">
                  {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} players</option>)}
                </select>
                <button
                  onClick={() => setQuickMic(!quickMic)}
                  data-active={quickMic}
                  className="vs-tab text-xs"
                >
                  <Mic size={11} /> Mic
                </button>
                <button
                  onClick={() => setShowCreate(true)}
                  className="text-[11px] text-text-dim hover:text-cyan transition-colors ml-1"
                >
                  More options →
                </button>
                <button
                  onClick={quickPost}
                  disabled={!quickTitle.trim() || !quickGame || quickSubmitting}
                  className="vs-btn vs-btn-cyan text-xs ml-auto disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {quickSubmitting ? <ScopeSpinner size={12} /> : <><Send size={11} /> Post</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters — alleen op browse view */}
      {view === 'browse' && (
        <>
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search LFG posts..." className="vs-input text-xs pl-8 py-1.5" />
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <button onClick={() => setSelectedGame(null)} data-active={!selectedGame} className="vs-tab text-xs">
                All Games
              </button>
              {games.slice(0, 6).map(g => (
                <button key={g.id} onClick={() => setSelectedGame(g.id)} data-active={selectedGame === g.id} className="vs-tab text-xs">
                  {g.name.split(':')[0]}
                </button>
              ))}
            </div>
            <select
              value={selectedPlatform || ''}
              onChange={e => setSelectedPlatform(e.target.value || null)}
              className="bg-surface border border-border rounded-lg text-xs text-text-dim px-3 py-1.5 outline-none appearance-none"
            >
              <option value="">All Platforms</option>
              <option value="PC">PC</option>
              <option value="PlayStation">PlayStation</option>
              <option value="Xbox">Xbox</option>
              <option value="Switch">Switch</option>
              <option value="Crossplay">Crossplay</option>
            </select>
          </div>

          {/* Quick filter chips */}
          <div className="flex items-center gap-1.5 mb-5 flex-wrap">
            {userId && userGames.length > 0 && (
              <button onClick={() => setChipMyGamesOnly(!chipMyGamesOnly)} data-active={chipMyGamesOnly} className="vs-tab text-xs">
                <Gamepad2 size={11} /> My games
              </button>
            )}
            <button onClick={() => setChipMicOnly(!chipMicOnly)} data-active={chipMicOnly} className="vs-tab text-xs">
              <Mic size={11} /> Mic only
            </button>
            <button onClick={() => setChipUrgent(!chipUrgent)} data-active={chipUrgent} className="vs-tab text-xs">
              <Clock size={11} /> Closing soon
            </button>
            {(chipMyGamesOnly || chipMicOnly || chipUrgent) && (
              <button
                onClick={() => { setChipMyGamesOnly(false); setChipMicOnly(false); setChipUrgent(false) }}
                className="text-[10px] text-text-dim hover:text-cyan ml-1"
              >
                Clear
              </button>
            )}
          </div>
        </>
      )}

      {/* Posts feed */}
      {loading ? (
        <div className="flex justify-center py-12"><ScopeSpinner size={28} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            view === 'mine' ? "You haven't posted any LFG yet"
            : view === 'applied' ? "You haven't applied to any squads"
            : view === 'squads' ? "You haven't joined any squads yet"
            : 'No LFG posts right now'
          }
          description={
            view === 'browse' ? 'Create one and find your squad.'
            : 'Switch to Browse to find squads.'
          }
          cta={view !== 'browse' ? { label: 'Browse squads', onClick: () => setView('browse') } : userId ? { label: 'Create LFG', onClick: () => setShowCreate(true) } : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(post => (
            <LfgPostCard
              key={post.id}
              post={post}
              userId={userId}
              applying={applyingPostId === post.id}
              applyNote={applyNote}
              setApplyNote={setApplyNote}
              onStartApply={() => { setApplyingPostId(post.id); setApplyNote('') }}
              onCancelApply={() => { setApplyingPostId(null); setApplyNote('') }}
              onApply={() => applyToPost(post.id)}
              onClose={() => closePost(post.id)}
              onBump={() => bumpPost(post.id)}
              responsesOpen={openResponsesId === post.id}
              onToggleResponses={() => setOpenResponsesId(openResponsesId === post.id ? null : post.id)}
              onAcceptResponse={(rid) => acceptResponse(rid, post.id)}
              onDeclineResponse={declineResponse}
              timeAgo={timeAgo}
              expiresIn={expiresIn}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreatePostModal
          games={games}
          onClose={() => setShowCreate(false)}
          formTitle={formTitle} setFormTitle={setFormTitle}
          formDesc={formDesc} setFormDesc={setFormDesc}
          formGame={formGame} setFormGame={setFormGame}
          formPlatform={formPlatform} setFormPlatform={setFormPlatform}
          formRegion={formRegion} setFormRegion={setFormRegion}
          formPartySize={formPartySize} setFormPartySize={setFormPartySize}
          formMic={formMic} setFormMic={setFormMic}
          formMinRank={formMinRank} setFormMinRank={setFormMinRank}
          formDiscord={formDiscord} setFormDiscord={setFormDiscord}
          creating={creating}
          onSubmit={createPost}
        />
      )}
    </div>
  )
}

// ─── Post Card met slot visualization ───────────────────────────────────────────

function LfgPostCard({
  post, userId, applying, applyNote, setApplyNote,
  onStartApply, onCancelApply, onApply, onClose, onBump,
  responsesOpen, onToggleResponses, onAcceptResponse, onDeclineResponse,
  timeAgo, expiresIn,
}: {
  post: LfgPost
  userId: string | null
  applying: boolean
  applyNote: string
  setApplyNote: (v: string) => void
  onStartApply: () => void
  onCancelApply: () => void
  onApply: () => void
  onClose: () => void
  onBump: () => void
  responsesOpen: boolean
  onToggleResponses: () => void
  onAcceptResponse: (responseId: string) => void
  onDeclineResponse: (responseId: string) => void
  timeAgo: (d: string) => string
  expiresIn: (d: string) => string
}) {
  const isOwn = post.user_id === userId
  const profile = post.profile as (Profile & { last_seen_at?: string; is_verified?: boolean; level_name?: string }) | undefined
  const game = post.game as Game | undefined
  const responses = post.responses ?? []
  const accepted = responses.filter(r => r.status === 'accepted')
  const pending = responses.filter(r => !r.status || r.status === 'pending')
  const filledTotal = 1 + accepted.length // poster + accepted
  const spotsLeft = post.party_size - filledTotal
  const hasApplied = !!post.my_response
  const myStatus = post.my_response?.status
  const isOnline = profile?.last_seen_at
    ? Date.now() - new Date(profile.last_seen_at).getTime() < 5 * 60 * 1000
    : false

  // Slot rendering: 1 owner + accepted + empty
  const slots: ({ kind: 'owner' | 'member' | 'empty', profile?: Profile })[] = []
  slots.push({ kind: 'owner', profile })
  for (const r of accepted) slots.push({ kind: 'member', profile: r.profile })
  while (slots.length < post.party_size) slots.push({ kind: 'empty' })

  return (
    <div className="vs-card vs-lit hover:border-border-hover transition-all">
      <div className="flex items-start gap-4">
        <Avatar
          url={profile?.avatar_url}
          name={profile?.display_name || profile?.username}
          href={profile?.username ? `/profile/${profile.username}` : undefined}
          size="md"
          variant="gradient"
          showInnerRing={profile?.is_founding_member}
          online={isOnline}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-medium">{post.title}</h3>
            {game && <span className="vs-badge vs-badge-purple text-[9px]">{game.name}</span>}
            {profile?.level_name && profile.level_name !== 'Recruit' && (
              <span className="vs-badge vs-badge-cyan text-[9px]">{profile.level_name}</span>
            )}
            {profile?.is_verified && (
              <span className="vs-badge vs-badge-success text-[9px]"><Shield size={8} /> Verified</span>
            )}
          </div>
          {post.description && (
            <p className="text-xs text-text-muted mb-2 line-clamp-2">{post.description}</p>
          )}

          {/* Tags */}
          <div className="flex items-center gap-3 text-[10px] text-text-dim flex-wrap">
            {post.platform && <span className="flex items-center gap-1"><Monitor size={10} /> {post.platform}</span>}
            {post.region && <span className="flex items-center gap-1"><MapPin size={10} /> {post.region}</span>}
            {post.mic_required && <span className="flex items-center gap-1 text-cyan"><Mic size={10} /> Mic required</span>}
            {post.min_rank && <span className="flex items-center gap-1"><Shield size={10} /> {post.min_rank}+</span>}
            <span className="flex items-center gap-1"><Clock size={10} /> {expiresIn(post.expires_at)}</span>
            {post.discord_link && (
              <a
                href={post.discord_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 text-[#5865F2] hover:underline"
              >
                <svg width="11" height="11" viewBox="0 0 71 55" fill="currentColor">
                  <path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.7 40.7 0 00-1.8 3.7 54 54 0 00-16.2 0A26.4 26.4 0 0025.4.3a.2.2 0 00-.2-.1 58.3 58.3 0 00-14.7 4.6.2.2 0 00-.1.1C1.5 18.7-.9 32 .3 45.1v.1a58.8 58.8 0 0017.9 9.1.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.8 38.8 0 01-5.5-2.7.2.2 0 010-.4l1.1-.9a.2.2 0 01.2 0 42 42 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.4 36.4 0 01-5.5 2.7.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1A58.6 58.6 0 0070.7 45.2v-.1c1.4-15-2.3-28-9.8-39.6a.2.2 0 00-.1-.1zM23.7 37c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.8 7-6.2 7zm23 0c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.7 7-6.2 7z" />
                </svg>
                Discord
              </a>
            )}
          </div>

          {/* Author + time */}
          <div className="flex items-center gap-2 mt-2 text-[10px] text-text-dim">
            <Link href={`/profile/${profile?.username}`} className="hover:text-purple transition-colors">
              @{profile?.username}
            </Link>
            <span>·</span>
            <span>{timeAgo(post.created_at)}</span>
          </div>
        </div>

        {/* Action button */}
        <div className="shrink-0">
          {isOwn ? (
            <div className="flex flex-col items-end gap-1.5">
              {pending.length > 0 && (
                <button onClick={onToggleResponses} className="vs-btn vs-btn-cyan text-xs px-3 py-1.5">
                  <Inbox size={12} /> {pending.length} {pending.length === 1 ? 'applicant' : 'applicants'}
                </button>
              )}
              <div className="flex gap-1.5">
                <button onClick={onBump} className="vs-btn vs-btn-ghost text-xs px-2.5 py-1.5" title="Bump to top">
                  <Zap size={11} /> Bump
                </button>
                <button onClick={onClose} className="vs-btn vs-btn-ghost text-xs px-2.5 py-1.5">
                  Close
                </button>
              </div>
            </div>
          ) : hasApplied ? (
            <span className={`vs-btn text-xs px-3 py-1.5 cursor-default ${
              myStatus === 'accepted' ? 'vs-btn-cyan' : myStatus === 'declined' ? 'opacity-40' : 'vs-btn-ghost'
            }`}>
              {myStatus === 'accepted' ? <><Check size={12} /> In squad</>
                : myStatus === 'declined' ? <>Declined</>
                : <><Check size={12} /> Applied</>}
            </span>
          ) : spotsLeft > 0 ? (
            <button onClick={onStartApply} className="vs-btn vs-btn-cyan text-xs px-3 py-1.5">
              <UserPlus size={12} /> Join
            </button>
          ) : (
            <span className="text-xs text-text-dim">Full</span>
          )}
        </div>
      </div>

      {/* Slot visualization — N circles for party_size */}
      <div className="mt-4 pt-4 border-t border-border/40">
        <div className="flex items-center gap-2.5 flex-wrap">
          {slots.map((slot, i) => {
            if (slot.kind === 'owner') {
              return (
                <div key={i} className="flex flex-col items-center gap-1 group">
                  <div className="relative">
                    <Avatar
                      url={slot.profile?.avatar_url}
                      name={slot.profile?.display_name || slot.profile?.username}
                      size="sm"
                      variant="gradient"
                    />
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple flex items-center justify-center border-2 border-surface">
                      <Crown size={8} fill="white" className="text-white" />
                    </div>
                  </div>
                  <span className="text-[8px] text-text-dim">Lead</span>
                </div>
              )
            }
            if (slot.kind === 'member') {
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <Avatar
                    url={slot.profile?.avatar_url}
                    name={slot.profile?.display_name || slot.profile?.username}
                    size="sm"
                    variant="gradient"
                  />
                  <span className="text-[8px] text-text-dim truncate max-w-[40px]">{slot.profile?.username?.slice(0, 6) ?? ''}</span>
                </div>
              )
            }
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full border border-dashed border-border-hover bg-void/40 flex items-center justify-center text-text-dim hover:border-cyan hover:text-cyan transition-colors">
                  <Plus size={12} />
                </div>
                <span className="text-[8px] text-text-dim">Open</span>
              </div>
            )
          })}
          <div className="ml-auto text-[10px] text-text-dim">
            <span className={spotsLeft > 0 ? 'text-success' : 'text-text-dim'}>
              {filledTotal}/{post.party_size}
            </span>
            {spotsLeft > 0 && <span className="ml-1">· {spotsLeft} {spotsLeft > 1 ? 'spots' : 'spot'} open</span>}
          </div>
        </div>
      </div>

      {/* Apply-with-note inline prompt */}
      {applying && (
        <div className="mt-3 p-3 bg-void/60 border border-cyan/20 rounded-lg space-y-2">
          <textarea
            value={applyNote}
            onChange={e => setApplyNote(e.target.value)}
            maxLength={200}
            rows={2}
            className="vs-input text-xs resize-none"
            placeholder="Optional: add a note (role, comm style, your rank...)"
            autoFocus
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-text-dim">{applyNote.length}/200</span>
            <div className="flex gap-2">
              <button onClick={onCancelApply} className="vs-btn vs-btn-ghost text-xs px-3 py-1">Cancel</button>
              <button onClick={onApply} className="vs-btn vs-btn-cyan text-xs px-3 py-1">
                <Send size={11} /> Send application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Owner-only: responses panel */}
      {isOwn && responsesOpen && pending.length > 0 && (
        <div className="mt-3 p-3 bg-void/60 border border-cyan/20 rounded-lg space-y-2">
          <p className="vs-label flex items-center gap-1.5"><Inbox size={11} /> APPLICANTS</p>
          {pending.map(r => (
            <div key={r.id} className="flex items-start gap-3 py-2 border-t border-border/30 first:border-t-0">
              <Avatar
                url={r.profile?.avatar_url}
                name={r.profile?.display_name || r.profile?.username}
                href={r.profile?.username ? `/profile/${r.profile.username}` : undefined}
                size="sm"
                variant="gradient"
                showInnerRing={r.profile?.is_founding_member}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/profile/${r.profile?.username}`} className="text-xs font-medium hover:text-purple">
                    {r.profile?.display_name || r.profile?.username}
                  </Link>
                  <span className="text-[9px] text-text-dim">{timeAgo(r.created_at)}</span>
                </div>
                {r.message && <p className="text-xs text-text-muted mt-0.5">{r.message}</p>}
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => onAcceptResponse(r.id)} className="vs-btn vs-btn-cyan text-xs px-2.5 py-1">
                  <Check size={11} /> Accept
                </button>
                <button onClick={() => onDeclineResponse(r.id)} className="vs-btn vs-btn-ghost text-xs px-2.5 py-1">
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Create Modal ────────────────────────────────────────────────────────────

function CreatePostModal(props: {
  games: Game[]
  onClose: () => void
  formTitle: string; setFormTitle: (v: string) => void
  formDesc: string; setFormDesc: (v: string) => void
  formGame: string; setFormGame: (v: string) => void
  formPlatform: string; setFormPlatform: (v: string) => void
  formRegion: string; setFormRegion: (v: string) => void
  formPartySize: number; setFormPartySize: (n: number) => void
  formMic: boolean; setFormMic: (b: boolean) => void
  formMinRank: string; setFormMinRank: (v: string) => void
  formDiscord: string; setFormDiscord: (v: string) => void
  creating: boolean
  onSubmit: () => void
}) {
  const {
    games, onClose,
    formTitle, setFormTitle, formDesc, setFormDesc, formGame, setFormGame,
    formPlatform, setFormPlatform, formRegion, setFormRegion,
    formPartySize, setFormPartySize, formMic, setFormMic, formMinRank, setFormMinRank,
    formDiscord, setFormDiscord,
    creating, onSubmit,
  } = props

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto animate-slide-up vs-lit" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-surface z-10">
          <h3 className="text-sm font-medium flex items-center gap-2"><Plus size={16} className="text-purple" /> Create LFG Post</h3>
          <button onClick={onClose} className="text-text-dim hover:text-text"><X size={16} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="vs-label block mb-1">TITLE *</label>
            <input value={formTitle} onChange={e => setFormTitle(e.target.value)} className="vs-input text-sm" placeholder="Need 2 for ranked grind..." maxLength={80} />
          </div>
          <div>
            <label className="vs-label block mb-1">DESCRIPTION</label>
            <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} className="vs-input text-sm resize-none min-h-[60px]" placeholder="What are you looking for?" maxLength={500} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="vs-label block mb-1">GAME *</label>
              <select value={formGame} onChange={e => setFormGame(e.target.value)} className="vs-input text-sm appearance-none">
                <option value="">Select game...</option>
                {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="vs-label block mb-1">PLATFORM</label>
              <select value={formPlatform} onChange={e => setFormPlatform(e.target.value)} className="vs-input text-sm appearance-none">
                <option value="">Any</option>
                <option value="PC">PC</option>
                <option value="PlayStation">PlayStation</option>
                <option value="Xbox">Xbox</option>
                <option value="Crossplay">Crossplay</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="vs-label block mb-1">REGION</label>
              <select value={formRegion} onChange={e => setFormRegion(e.target.value)} className="vs-input text-sm appearance-none">
                <option value="">Any</option>
                <option value="EU">EU</option>
                <option value="NA">NA</option>
                <option value="APAC">APAC</option>
                <option value="SA">SA</option>
                <option value="OCE">OCE</option>
              </select>
            </div>
            <div>
              <label className="vs-label block mb-1">PARTY SIZE</label>
              <select value={formPartySize} onChange={e => setFormPartySize(Number(e.target.value))} className="vs-input text-sm appearance-none">
                {[2,3,4,5,6].map(n => <option key={n} value={n}>{n} players</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="vs-label block mb-1">MIN RANK (OPTIONAL)</label>
            <input value={formMinRank} onChange={e => setFormMinRank(e.target.value)} className="vs-input text-sm" placeholder="e.g. Gold, Diamond, Platinum..." />
          </div>
          <div>
            <label className="vs-label block mb-1">DISCORD INVITE (OPTIONAL)</label>
            <input
              value={formDiscord}
              onChange={e => setFormDiscord(e.target.value)}
              className="vs-input text-sm"
              placeholder="https://discord.gg/..."
              type="url"
            />
            <p className="text-[10px] text-text-dim mt-1">Members kunnen hierop joinen voor voice chat</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formMic} onChange={e => setFormMic(e.target.checked)} className="accent-purple w-4 h-4" />
            <Mic size={14} className="text-cyan" />
            <span className="text-sm">Mic required</span>
          </label>
          <button onClick={onSubmit} disabled={!formTitle.trim() || !formGame || creating} className="vs-btn vs-btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed">
            {creating ? <ScopeSpinner size={16} /> : 'Post LFG'}
          </button>
        </div>
      </div>
    </div>
  )
}
