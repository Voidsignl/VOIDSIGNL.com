'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import type { Profile, Game } from '@/types'
import Link from 'next/link'
import {
  Shield, Users, Newspaper, Film, Trophy, Gamepad2,
  BarChart3, Search, Check, X, Star, Trash2,
  TrendingUp, Zap, ShieldCheck, Sparkles, GraduationCap, Activity, Layers,
} from 'lucide-react'
import { BrandSelect } from '@/components/ui/BrandSelect'

type AdminTab = 'overview' | 'users' | 'content' | 'games' | 'tournaments'

export default function AdminPage() {
  const supabase = createClient()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)

  const [stats, setStats] = useState({
    members: 0, posts: 0, clips: 0, tournaments: 0,
    new_members_7d: 0, new_posts_7d: 0,
  })

  const [users, setUsers] = useState<Profile[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all')

  const [posts, setPosts] = useState<any[]>([])

  const [games, setGames] = useState<Game[]>([])
  const [newGameName, setNewGameName] = useState('')
  const [newGameSlug, setNewGameSlug] = useState('')

  const [tournaments, setTournaments] = useState<any[]>([])

  const [spotlightId, setSpotlightId] = useState<string | null>(null)

  const [xpModal, setXpModal] = useState<{ userId: string; username: string } | null>(null)
  const [xpAmount, setXpAmount] = useState(10)
  const [xpReason, setXpReason] = useState('')
  const [grantingXp, setGrantingXp] = useState(false)

  useEffect(() => { checkAccess() }, [])
  useEffect(() => { if (authorized) loadTabData() }, [activeTab, authorized])

  async function checkAccess() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator' && !profile.is_inner_circle)) {
      router.push('/dashboard')
      return
    }

    setCurrentUser(profile as Profile)
    setAuthorized(true)
    setLoading(false)
    loadOverview()
    loadSpotlight()
  }

  async function loadSpotlight() {
    const { data } = await supabase
      .from('platform_settings')
      .select('featured_profile_id')
      .eq('id', 1)
      .maybeSingle()
    setSpotlightId((data as { featured_profile_id: string | null } | null)?.featured_profile_id ?? null)
  }

  async function loadOverview() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()

    const [members, postsCount, clips, tournamentsCount, newMembers, newPosts] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('clips').select('*', { count: 'exact', head: true }),
      supabase.from('tournaments').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    ])

    setStats({
      members: members.count || 0,
      posts: postsCount.count || 0,
      clips: clips.count || 0,
      tournaments: tournamentsCount.count || 0,
      new_members_7d: newMembers.count || 0,
      new_posts_7d: newPosts.count || 0,
    })
  }

  async function loadTabData() {
    if (activeTab === 'users') {
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100)
      if (userRoleFilter !== 'all') query = query.eq('role', userRoleFilter)
      const { data } = await query
      if (data) setUsers(data as Profile[])
    }
    if (activeTab === 'content') {
      const { data } = await supabase
        .from('posts')
        .select('*, profile:profiles(username, display_name, role), game:games(name)')
        .order('created_at', { ascending: false })
        .limit(50)
      if (data) setPosts(data)
    }
    if (activeTab === 'games') {
      const { data } = await supabase.from('games').select('*').order('name')
      if (data) setGames(data)
    }
    if (activeTab === 'tournaments') {
      const { data } = await supabase
        .from('tournaments')
        .select('*, game:games(name), organizer:profiles(username)')
        .order('created_at', { ascending: false })
        .limit(50)
      if (data) setTournaments(data)
    }
  }

  async function updateUserRole(userId: string, role: string) {
    await supabase.from('profiles').update({ role }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } as any : u))
  }

  async function toggleFounder(userId: string, current: boolean) {
    await supabase.from('profiles').update({ is_inner_circle: !current }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_inner_circle: !current } as any : u))
  }

  async function setAsSpotlight(userId: string) {
    if (!currentUser?.id) return
    await supabase
      .from('platform_settings')
      .update({
        featured_profile_id: userId,
        featured_set_at: new Date().toISOString(),
        featured_set_by: currentUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)
    setSpotlightId(userId)
  }

  async function deletePost(postId: string) {
    await supabase.from('posts').delete().eq('id', postId)
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  async function toggleGameApproval(gameId: string, current: boolean) {
    await supabase.from('games').update({ is_approved: !current }).eq('id', gameId)
    setGames(prev => prev.map(g => g.id === gameId ? { ...g, is_approved: !current } as any : g))
  }

  async function addGame() {
    if (!newGameName.trim()) return
    const slug = newGameSlug.trim() || newGameName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    await supabase.from('games').insert({ name: newGameName.trim(), slug, is_approved: true })
    setNewGameName(''); setNewGameSlug('')
    loadTabData()
  }

  async function deleteGame(gameId: string) {
    await supabase.from('games').delete().eq('id', gameId)
    setGames(prev => prev.filter(g => g.id !== gameId))
  }

  async function updateTournamentStatus(tournamentId: string, status: string) {
    await supabase.from('tournaments').update({ status }).eq('id', tournamentId)
    setTournaments(prev => prev.map(t => t.id === tournamentId ? { ...t, status } : t))
  }

  async function grantXP() {
    if (!xpModal || xpAmount <= 0) return
    setGrantingXp(true)

    const { error } = await supabase.rpc('add_xp', { user_uuid: xpModal.userId, amount: xpAmount })

    if (!error) {
      await supabase.from('notifications').insert({
        user_id: xpModal.userId,
        type: 'xp',
        title: `You received +${xpAmount} XP!`,
        body: xpReason.trim() || `Granted by ${currentUser?.display_name || currentUser?.username}`,
        link: '/achievements',
      })

      setUsers(prev => prev.map(u => u.id === xpModal.userId ? { ...u, xp: u.xp + xpAmount } as any : u))
      setXpModal(null)
      setXpAmount(10)
      setXpReason('')
    }
    setGrantingXp(false)
  }

  function timeAgo(date: string) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    return `${Math.floor(s / 86400)}d ago`
  }

  const filteredUsers = userSearch
    ? users.filter(u => u.username.toLowerCase().includes(userSearch.toLowerCase()) || (u.display_name || '').toLowerCase().includes(userSearch.toLowerCase()))
    : users

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-text-dim text-sm animate-pulse">Checking access...</div></div>

  const isAdmin = (currentUser as any)?.role === 'admin'
  const canGrantXP = isAdmin || (currentUser as any)?.is_inner_circle

  const TABS: { id: AdminTab; label: string; icon: any; adminOnly?: boolean }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'content', label: 'Content', icon: Newspaper },
    { id: 'games', label: 'Games', icon: Gamepad2, adminOnly: true },
    { id: 'tournaments', label: 'Tournaments', icon: Trophy },
  ]

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-wide flex items-center gap-2">
            <Shield size={20} className="text-purple" /> Admin Dashboard
          </h1>
          <p className="text-sm text-text-dim mt-0.5">
            Logged in as <span className="text-cyan">{currentUser?.username}</span> · {(currentUser as any)?.role}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.filter(t => !t.adminOnly || isAdmin).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            data-active={activeTab === tab.id}
            className="vs-tab whitespace-nowrap"
          >
            <tab.icon size={13} /> {tab.label}
          </button>
        ))}
        {isAdmin && (
          <Link href="/admin/coaches" className="vs-tab whitespace-nowrap">
            <GraduationCap size={13} /> Coaches
          </Link>
        )}
        {isAdmin && (
          <Link href="/admin/games" className="vs-tab whitespace-nowrap">
            <Gamepad2 size={13} /> Game Aanvragen
          </Link>
        )}
        {isAdmin && (
          <Link href="/admin/infra" className="vs-tab whitespace-nowrap">
            <ShieldCheck size={13} /> Infra
          </Link>
        )}
        {isAdmin && (
          <Link href="/admin/system" className="vs-tab whitespace-nowrap">
            <Activity size={13} /> System
          </Link>
        )}
        {isAdmin && (
          <Link href="/admin/phases" className="vs-tab whitespace-nowrap">
            <Layers size={13} /> Phases
          </Link>
        )}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Members', value: stats.members, icon: Users, color: 'text-cyan' },
              { label: 'Total Posts', value: stats.posts, icon: Newspaper, color: 'text-purple' },
              { label: 'Total Clips', value: stats.clips, icon: Film, color: 'text-cyan' },
              { label: 'Tournaments', value: stats.tournaments, icon: Trophy, color: 'text-purple' },
            ].map(s => (
              <div key={s.label} className="vs-card">
                <div className="flex items-center justify-between mb-2">
                  <p className="vs-label">{s.label.toUpperCase()}</p>
                  <s.icon size={14} className="text-text-dim" />
                </div>
                <p className={`text-2xl font-semibold ${s.color}`}>{s.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="vs-card">
              <p className="vs-label mb-1">NEW MEMBERS (7D)</p>
              <p className="text-xl font-semibold text-success flex items-center gap-2">
                +{stats.new_members_7d} <TrendingUp size={14} />
              </p>
            </div>
            <div className="vs-card">
              <p className="vs-label mb-1">NEW POSTS (7D)</p>
              <p className="text-xl font-semibold text-success flex items-center gap-2">
                +{stats.new_posts_7d} <TrendingUp size={14} />
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Users */}
      {activeTab === 'users' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
              <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users..." className="vs-input text-xs pl-8 py-1.5" />
            </div>
            <div className="w-44">
              <BrandSelect
                value={userRoleFilter}
                onChange={(v) => { setUserRoleFilter(v); setTimeout(loadTabData, 0) }}
                size="sm"
                options={[
                  { value: 'all', label: 'All roles' },
                  { value: 'member', label: 'Members' },
                  { value: 'moderator', label: 'Moderators' },
                  { value: 'admin', label: 'Admins' },
                ]}
              />
            </div>
            <span className="text-xs text-text-dim">{filteredUsers.length} users</span>
          </div>

          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-[1fr_80px_80px] md:grid-cols-[1fr_100px_100px_80px_120px] px-4 py-2.5 border-b border-border text-[10px] text-text-dim tracking-wider uppercase">
              <span>User</span><span>Role</span><span className="hidden md:block">Level</span><span className="hidden md:block">XP</span><span className="hidden md:block">Actions</span>
            </div>
            {filteredUsers.map(user => (
              <div key={user.id} className="grid grid-cols-[1fr_80px_80px] md:grid-cols-[1fr_100px_100px_80px_120px] px-4 py-3 border-b border-border/50 items-center hover:bg-surface-2/50 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-purple/15 flex items-center justify-center text-[10px] font-bold text-purple shrink-0">
                    {(user.display_name || user.username)[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/profile/${user.username}`} className="text-xs font-medium truncate hover:text-purple transition-colors">{user.display_name || user.username}</Link>
                      {user.is_inner_circle && <Star size={9} className="text-purple shrink-0" fill="currentColor" />}
                    </div>
                    <p className="text-[10px] text-text-dim truncate">@{user.username}</p>
                  </div>
                </div>
                <div>
                  {isAdmin ? (
                    <BrandSelect
                      value={(user as { role?: string }).role || 'member'}
                      onChange={(v) => updateUserRole(user.id, v)}
                      size="sm"
                      options={[
                        { value: 'member', label: 'member' },
                        { value: 'moderator', label: 'moderator' },
                        { value: 'admin', label: 'admin' },
                      ]}
                    />
                  ) : (
                    <span className="text-[10px] text-text-dim">{(user as { role?: string }).role || 'member'}</span>
                  )}
                </div>
                <span className="text-[10px] text-text-dim hidden md:block">{user.level_name}</span>
                <span className="text-[10px] text-cyan hidden md:block">{user.xp}</span>
                <div className="hidden md:flex items-center gap-1">
                  {canGrantXP && (
                    <button onClick={() => setXpModal({ userId: user.id, username: user.display_name || user.username })}
                      className="p-1.5 rounded text-[10px] text-cyan hover:text-cyan hover:bg-cyan/10 transition-colors"
                      title="Grant XP">
                      <Zap size={11} />
                    </button>
                  )}
                  {isAdmin && (
                    <button onClick={() => toggleFounder(user.id, user.is_inner_circle)}
                      className={`p-1.5 rounded text-[10px] transition-colors ${user.is_inner_circle ? 'text-purple bg-purple/10' : 'text-text-dim hover:text-purple'}`}
                      title={user.is_inner_circle ? 'Remove from Inner Circle' : 'Add to Inner Circle'}>
                      <Star size={11} fill={user.is_inner_circle ? 'currentColor' : 'none'} />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => setAsSpotlight(user.id)}
                      disabled={spotlightId === user.id}
                      className={`p-1.5 rounded text-[10px] transition-colors ${
                        spotlightId === user.id ? 'text-cyan bg-cyan/10 cursor-default' : 'text-text-dim hover:text-cyan'
                      }`}
                      title={spotlightId === user.id ? 'Currently featured' : 'Feature in homepage spotlight'}
                    >
                      <Sparkles size={11} fill={spotlightId === user.id ? 'currentColor' : 'none'} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === 'content' && (
        <div className="space-y-2">
          {posts.map((post: any) => (
            <div key={post.id} className="vs-card flex items-start gap-3 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs mb-1">
                  <span className="font-medium">{post.profile?.display_name || post.profile?.username}</span>
                  <span className="text-text-dim">·</span>
                  <span className="text-text-dim">{timeAgo(post.created_at)}</span>
                  {post.game?.name && <span className="vs-badge vs-badge-purple text-[8px]">{post.game.name}</span>}
                </div>
                <p className="text-xs text-text-muted line-clamp-2">{post.content}</p>
                <div className="flex gap-3 mt-1.5 text-[10px] text-text-dim">
                  <span>{post.like_count} likes</span>
                  <span>{post.comment_count} comments</span>
                </div>
              </div>
              <button onClick={() => { if (confirm('Delete this post?')) deletePost(post.id) }}
                className="text-text-dim hover:text-danger transition-colors p-1.5 shrink-0" title="Delete post">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {posts.length === 0 && <div className="vs-card text-center py-8"><p className="text-sm text-text-dim">No posts yet</p></div>}
        </div>
      )}

      {/* Games */}
      {activeTab === 'games' && isAdmin && (
        <div>
          <div className="vs-card mb-4">
            <p className="vs-label mb-3">ADD GAME</p>
            <div className="flex gap-2">
              <input value={newGameName} onChange={e => setNewGameName(e.target.value)} placeholder="Game name" className="vs-input text-sm flex-1" />
              <input value={newGameSlug} onChange={e => setNewGameSlug(e.target.value)} placeholder="slug (auto)" className="vs-input text-sm w-40" />
              <button onClick={addGame} disabled={!newGameName.trim()} className="vs-btn vs-btn-primary text-xs px-4 disabled:opacity-40">Add</button>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-[1fr_80px_60px] md:grid-cols-[1fr_120px_80px_80px] px-4 py-2.5 border-b border-border text-[10px] text-text-dim tracking-wider uppercase">
              <span>Game</span><span className="hidden md:block">Slug</span><span>Status</span><span className="hidden md:block">Actions</span>
            </div>
            {games.map(game => (
              <div key={game.id} className="grid grid-cols-[1fr_80px_60px] md:grid-cols-[1fr_120px_80px_80px] px-4 py-3 border-b border-border/50 items-center hover:bg-surface-2/50 transition-colors">
                <span className="text-xs md:text-sm font-medium truncate">{game.name}</span>
                <span className="text-xs text-text-dim font-mono hidden md:block">{game.slug}</span>
                <button onClick={() => toggleGameApproval(game.id, game.is_approved)}
                  className={`text-[10px] px-2 py-0.5 rounded ${game.is_approved ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
                  {game.is_approved ? 'Approved' : 'Hidden'}
                </button>
                <button onClick={() => { if (confirm(`Delete ${game.name}?`)) deleteGame(game.id) }}
                  className="text-text-dim hover:text-danger transition-colors hidden md:block"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tournaments */}
      {activeTab === 'tournaments' && (
        <div className="space-y-2">
          {tournaments.map((t: any) => (
            <div key={t.id} className="vs-card flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium">{t.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                    t.status === 'in_progress' ? 'bg-warning/15 text-warning' :
                    t.status === 'registration' ? 'bg-success/15 text-success' :
                    t.status === 'completed' ? 'bg-purple/15 text-purple' : 'bg-text-dim/15 text-text-dim'
                  }`}>{t.status}</span>
                  {t.game?.name && <span className="text-[10px] text-text-dim">{t.game.name}</span>}
                </div>
                <p className="text-[10px] text-text-dim">by @{t.organizer?.username} · {new Date(t.starts_at).toLocaleDateString()}</p>
              </div>
              <div className="w-36">
                <BrandSelect
                  value={t.status}
                  onChange={(v) => updateTournamentStatus(t.id, v)}
                  size="sm"
                  options={[
                    { value: 'upcoming', label: 'upcoming' },
                    { value: 'registration', label: 'registration' },
                    { value: 'in_progress', label: 'in_progress' },
                    { value: 'completed', label: 'completed' },
                    { value: 'cancelled', label: 'cancelled' },
                  ]}
                />
              </div>
            </div>
          ))}
          {tournaments.length === 0 && <div className="vs-card text-center py-8"><p className="text-sm text-text-dim">No tournaments</p></div>}
        </div>
      )}

      {/* XP Grant Modal */}
      {xpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setXpModal(null)}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-sm mx-4 max-h-[85vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Zap size={16} className="text-cyan" /> Grant XP
              </h3>
              <button onClick={() => setXpModal(null)} className="text-text-dim hover:text-text"><X size={16} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="text-center pb-3 border-b border-border">
                <p className="text-sm">Grant XP to <span className="font-semibold text-purple">{xpModal.username}</span></p>
              </div>

              <div>
                <label className="vs-label block mb-2">AMOUNT</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[5, 10, 25, 50].map(n => (
                    <button key={n} onClick={() => setXpAmount(n)}
                      className={`py-2 rounded-lg text-sm font-medium border transition-colors duration-200 ${
                        xpAmount === n ? 'border-cyan bg-cyan/10 text-cyan' : 'border-border bg-surface text-text-dim hover:border-border-hover'
                      }`}>
                      +{n}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[100, 250, 500, 1000].map(n => (
                    <button key={n} onClick={() => setXpAmount(n)}
                      className={`py-2 rounded-lg text-sm font-medium border transition-colors duration-200 ${
                        xpAmount === n ? 'border-cyan bg-cyan/10 text-cyan' : 'border-border bg-surface text-text-dim hover:border-border-hover'
                      }`}>
                      +{n}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={xpAmount}
                  onChange={e => setXpAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="vs-input text-sm text-center"
                  min={1}
                  max={10000}
                />
              </div>

              <div>
                <label className="vs-label block mb-1">REASON (OPTIONAL)</label>
                <input
                  type="text"
                  value={xpReason}
                  onChange={e => setXpReason(e.target.value)}
                  className="vs-input text-sm"
                  placeholder="e.g. Won community event, great contribution..."
                  maxLength={200}
                />
              </div>

              <button onClick={grantXP} disabled={grantingXp || xpAmount <= 0}
                className="vs-btn vs-btn-primary w-full disabled:opacity-40">
                {grantingXp ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap size={14} /> Grant +{xpAmount} XP
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
