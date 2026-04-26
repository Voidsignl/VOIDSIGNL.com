'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import type { Game, Profile } from '@/types'
import Link from 'next/link'
import {
  Users, Plus, X, Mic, MicOff, Clock, MapPin, Monitor, Shield,
  UserPlus, Check, ChevronDown, Gamepad2, Search, Filter, Zap
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

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
  expires_at: string
  profile?: Profile
  game?: Game
  response_count?: number
  user_responded?: boolean
}

export default function LfgPage() {
  const supabase = createClient()
  const [posts, setPosts] = useState<LfgPost[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

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
  const [creating, setCreating] = useState(false)

  useEffect(() => { init() }, [])
  useEffect(() => { loadPosts() }, [selectedGame, selectedPlatform])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)
    loadGames()
    loadPosts()
  }

  async function loadGames() {
    const { data } = await supabase.from('games').select('*').eq('is_approved', true).order('name')
    if (data) setGames(data)
  }

  async function loadPosts() {
    setLoading(true)
    let query = supabase
      .from('lfg_posts')
      .select('*, profile:profiles(*), game:games(*)')
      .in('status', ['open'])
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(50)

    if (selectedGame) query = query.eq('game_id', selectedGame)
    if (selectedPlatform) query = query.eq('platform', selectedPlatform)

    const { data } = await query
    if (data) setPosts(data as unknown as LfgPost[])
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
    })

    if (!error) {
      setShowCreate(false)
      setFormTitle(''); setFormDesc(''); setFormGame(''); setFormPlatform('')
      setFormRegion(''); setFormPartySize(2); setFormMic(false); setFormMinRank('')
      loadPosts()
    }
    setCreating(false)
  }

  async function respondToPost(postId: string) {
    if (!userId) return
    await supabase.from('lfg_responses').insert({ lfg_post_id: postId, user_id: userId })
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, user_responded: true } : p))
  }

  async function closePost(postId: string) {
    await supabase.from('lfg_posts').update({ status: 'closed' }).eq('id', postId)
    setPosts(prev => prev.filter(p => p.id !== postId))
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
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-wide flex items-center gap-2">
            <Users size={20} className="text-purple" /> LFG
          </h1>
          <p className="text-sm text-text-dim mt-0.5">Find teammates, squad up</p>
        </div>
        {userId && (
          <button onClick={() => setShowCreate(true)} className="vs-btn vs-btn-primary text-sm">
            <Plus size={15} /> Create LFG
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search LFG posts..." className="vs-input text-xs pl-8 py-1.5" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setSelectedGame(null)} className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${!selectedGame ? 'bg-cyan/15 text-cyan border border-cyan/30' : 'bg-surface border border-border text-text-dim hover:border-border-hover'}`}>
            All Games
          </button>
          {games.slice(0, 6).map(g => (
            <button key={g.id} onClick={() => setSelectedGame(g.id)} className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${selectedGame === g.id ? 'bg-cyan/15 text-cyan border border-cyan/30' : 'bg-surface border border-border text-text-dim hover:border-border-hover'}`}>
              {g.name.split(':')[0]}
            </button>
          ))}
        </div>
        <select value={selectedPlatform || ''} onChange={e => setSelectedPlatform(e.target.value || null)} className="bg-surface border border-border rounded-lg text-xs text-text-dim px-3 py-1.5 outline-none appearance-none">
          <option value="">All Platforms</option>
          <option value="PC">PC</option>
          <option value="PlayStation">PlayStation</option>
          <option value="Xbox">Xbox</option>
          <option value="Switch">Switch</option>
          <option value="Crossplay">Crossplay</option>
        </select>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="vs-card animate-pulse">
              <div className="h-4 bg-surface-2 rounded w-48 mb-2" />
              <div className="h-3 bg-surface-2 rounded w-full mb-2" />
              <div className="h-3 bg-surface-2 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No LFG posts right now"
          description="Create one and find your squad."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(post => {
            const isOwn = post.user_id === userId
            const profile = post.profile as any
            const game = post.game as any
            const spotsLeft = post.party_size - post.filled

            return (
              <div key={post.id} className="vs-card hover:border-border-hover transition-all">
                <div className="flex items-start gap-4">
                  {/* Left: avatar */}
                  <Link href={`/profile/${profile?.username}`} className="shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-purple/20 flex items-center justify-center text-sm font-bold text-purple">
                      {(profile?.display_name || profile?.username || '?')[0].toUpperCase()}
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-medium">{post.title}</h3>
                      {game && <span className="vs-badge vs-badge-purple text-[9px]">{game.name}</span>}
                    </div>

                    {post.description && (
                      <p className="text-xs text-text-muted mb-2 line-clamp-2">{post.description}</p>
                    )}

                    {/* Tags row */}
                    <div className="flex items-center gap-3 text-[10px] text-text-dim flex-wrap">
                      <span className="flex items-center gap-1">
                        <Users size={10} />
                        <span className={spotsLeft > 0 ? 'text-success' : 'text-danger'}>
                          {post.filled}/{post.party_size}
                        </span>
                        {spotsLeft > 0 ? ` · ${spotsLeft} spot${spotsLeft > 1 ? 's' : ''} left` : ' · Full'}
                      </span>
                      {post.platform && <span className="flex items-center gap-1"><Monitor size={10} /> {post.platform}</span>}
                      {post.region && <span className="flex items-center gap-1"><MapPin size={10} /> {post.region}</span>}
                      {post.mic_required && <span className="flex items-center gap-1 text-cyan"><Mic size={10} /> Mic required</span>}
                      {post.min_rank && <span className="flex items-center gap-1"><Shield size={10} /> {post.min_rank}+</span>}
                      <span className="flex items-center gap-1"><Clock size={10} /> {expiresIn(post.expires_at)}</span>
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

                  {/* Action */}
                  <div className="shrink-0">
                    {isOwn ? (
                      <button onClick={() => closePost(post.id)} className="vs-btn vs-btn-ghost text-xs px-3 py-1.5">
                        Close
                      </button>
                    ) : spotsLeft > 0 ? (
                      post.user_responded ? (
                        <span className="vs-btn vs-btn-ghost text-xs px-3 py-1.5 opacity-60 cursor-default">
                          <Check size={12} /> Applied
                        </span>
                      ) : (
                        <button onClick={() => respondToPost(post.id)} className="vs-btn vs-btn-cyan text-xs px-3 py-1.5">
                          <UserPlus size={12} /> Join
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-text-dim">Full</span>
                    )}
                  </div>
                </div>

                {/* Party fill bar */}
                <div className="mt-3 h-1 bg-void rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${post.filled >= post.party_size ? 'bg-success' : 'bg-cyan'}`}
                    style={{ width: `${(post.filled / post.party_size) * 100}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-surface z-10">
              <h3 className="text-sm font-medium flex items-center gap-2"><Plus size={16} className="text-purple" /> Create LFG Post</h3>
              <button onClick={() => setShowCreate(false)} className="text-text-dim hover:text-text"><X size={16} /></button>
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formMic} onChange={e => setFormMic(e.target.checked)} className="accent-purple w-4 h-4" />
                <Mic size={14} className="text-cyan" />
                <span className="text-sm">Mic required</span>
              </label>
              <button onClick={createPost} disabled={!formTitle.trim() || !formGame || creating} className="vs-btn vs-btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed">
                {creating ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Post LFG'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
