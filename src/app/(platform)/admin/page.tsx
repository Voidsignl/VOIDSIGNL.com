'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import type { Profile, Game } from '@/types'
import Link from 'next/link'
import {
  Shield, Users, Newspaper, Film, Trophy, Flag, Gamepad2,
  BarChart3, Search, ChevronDown, Check, X, Ban, Star,
  AlertTriangle, Eye, Trash2, UserCog, Settings, TrendingUp,
  MessageCircle, Clock, Zap, ShoppingBag, ShieldCheck, EyeOff,
  Sparkles,
} from 'lucide-react'
import type { MarketSeller, MarketListing } from '@/types'
import { MARKET_CATEGORIES } from '@/types'
import { formatPrice } from '@/lib/market-utils'

type AdminTab = 'overview' | 'users' | 'content' | 'reports' | 'games' | 'tournaments' | 'market'

interface Report {
  id: string
  reporter_id: string
  target_type: string
  target_id: string
  reason: string
  status: string
  admin_notes: string | null
  resolved_by: string | null
  created_at: string
  resolved_at: string | null
  reporter?: Profile
}

export default function AdminPage() {
  const supabase = createClient()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)

  // Overview stats
  const [stats, setStats] = useState({
    members: 0, posts: 0, clips: 0, tournaments: 0, reports_pending: 0,
    new_members_7d: 0, new_posts_7d: 0
  })

  // Users
  const [users, setUsers] = useState<Profile[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all')

  // Content (posts)
  const [posts, setPosts] = useState<any[]>([])

  // Reports
  const [reports, setReports] = useState<Report[]>([])
  const [reportFilter, setReportFilter] = useState<string>('pending')

  // Games
  const [games, setGames] = useState<Game[]>([])
  const [newGameName, setNewGameName] = useState('')
  const [newGameSlug, setNewGameSlug] = useState('')

  // Tournaments
  const [tournaments, setTournaments] = useState<any[]>([])

  // Spotlight (currently featured profile id)
  const [spotlightId, setSpotlightId] = useState<string | null>(null)

  // Market admin state
  const [pendingSellers, setPendingSellers] = useState<(MarketSeller & { profile?: Profile })[]>([])
  const [marketListings, setMarketListings] = useState<MarketListing[]>([])
  const [pendingReports, setPendingReports] = useState<Array<{
    id: string
    listing_id: string
    reason: string
    details: string | null
    created_at: string
    listing?: { id: string; title: string; status: string } | null
    reporter?: { username: string; display_name: string | null } | null
  }>>([])
  const [marketStats, setMarketStats] = useState({
    pending_sellers: 0, active_listings: 0, total_orders: 0, total_commission: 0, total_revenue: 0,
    pending_reports: 0,
  })

  // XP Grant
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

    if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator' && !profile.is_founding_member)) {
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

    const [members, posts, clips, tournaments, pendingReports, newMembers, newPosts] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('clips').select('*', { count: 'exact', head: true }),
      supabase.from('tournaments').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    ])

    setStats({
      members: members.count || 0,
      posts: posts.count || 0,
      clips: clips.count || 0,
      tournaments: tournaments.count || 0,
      reports_pending: pendingReports.count || 0,
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
    if (activeTab === 'reports') {
      let query = supabase.from('reports').select('*, reporter:profiles!reporter_id(username, display_name)').order('created_at', { ascending: false }).limit(50)
      if (reportFilter !== 'all') query = query.eq('status', reportFilter)
      const { data } = await query
      if (data) setReports(data as any)
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
    if (activeTab === 'market') {
      const [pendingRes, listingsRes, ordersRes, reportsRes] = await Promise.all([
        supabase
          .from('market_sellers')
          .select('*, profile:profiles(*)')
          .is('verified_at', null)
          .is('rejected_at', null)
          .order('created_at', { ascending: false }),
        supabase
          .from('market_listings')
          .select('*, seller:market_sellers(*, profile:profiles(username, display_name)), game:games(id,name)')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('market_orders')
          .select('amount, commission, status')
          .eq('status', 'confirmed'),
        supabase
          .from('market_reports')
          .select('id, listing_id, reason, details, created_at, listing:market_listings(id,title,status), reporter:profiles!reporter_id(username, display_name)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
      ])
      const pend = (pendingRes.data || []) as unknown as (MarketSeller & { profile?: Profile })[]
      const lst = (listingsRes.data || []) as unknown as MarketListing[]
      const orders = (ordersRes.data || []) as { amount: number; commission: number; status: string }[]
      const reps = (reportsRes.data || []) as unknown as typeof pendingReports
      setPendingSellers(pend)
      setMarketListings(lst)
      setPendingReports(reps)
      setMarketStats({
        pending_sellers: pend.length,
        active_listings: lst.filter(l => l.status === 'active').length,
        total_orders: orders.length,
        total_commission: orders.reduce((s, o) => s + Number(o.commission), 0),
        total_revenue: orders.reduce((s, o) => s + Number(o.amount), 0),
        pending_reports: reps.length,
      })
    }
  }

  async function resolveMarketReport(reportId: string, status: 'resolved' | 'dismissed') {
    if (!currentUser?.id) return
    await supabase
      .from('market_reports')
      .update({ status, resolved_by: currentUser.id, resolved_at: new Date().toISOString() })
      .eq('id', reportId)
    setPendingReports(prev => prev.filter(r => r.id !== reportId))
    setMarketStats(s => ({ ...s, pending_reports: Math.max(0, s.pending_reports - 1) }))
  }

  async function approveSeller(sellerId: string) {
    if (!currentUser?.id) return
    await supabase
      .from('market_sellers')
      .update({ verified_at: new Date().toISOString(), approved_by: currentUser.id })
      .eq('id', sellerId)
    setPendingSellers(prev => prev.filter(s => s.id !== sellerId))
    setMarketStats(s => ({ ...s, pending_sellers: Math.max(0, s.pending_sellers - 1) }))
  }

  async function rejectSeller(sellerId: string) {
    if (!confirm('Reject this seller application?')) return
    await supabase.from('market_sellers').update({ rejected_at: new Date().toISOString() }).eq('id', sellerId)
    setPendingSellers(prev => prev.filter(s => s.id !== sellerId))
    setMarketStats(s => ({ ...s, pending_sellers: Math.max(0, s.pending_sellers - 1) }))
  }

  async function toggleVoidVerified(listingId: string, current: boolean) {
    await supabase.from('market_listings').update({ void_verified: !current }).eq('id', listingId)
    setMarketListings(prev => prev.map(l => l.id === listingId ? { ...l, void_verified: !current } : l))
  }

  async function removeListing(listingId: string) {
    if (!confirm('Remove this listing? It will be hidden from the market.')) return
    await supabase.from('market_listings').update({ status: 'removed' }).eq('id', listingId)
    setMarketListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'removed' as const } : l))
  }

  async function updateUserRole(userId: string, role: string) {
    await supabase.from('profiles').update({ role }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } as any : u))
  }

  async function toggleFounder(userId: string, current: boolean) {
    await supabase.from('profiles').update({ is_founding_member: !current }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_founding_member: !current } as any : u))
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

  async function resolveReport(reportId: string, status: 'resolved' | 'dismissed') {
    await supabase.from('reports').update({
      status,
      resolved_by: currentUser?.id,
      resolved_at: new Date().toISOString(),
    }).eq('id', reportId)
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r))
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
      // Send notification to user
      await supabase.from('notifications').insert({
        user_id: xpModal.userId,
        type: 'xp',
        title: `You received +${xpAmount} XP!`,
        body: xpReason.trim() || `Granted by ${currentUser?.display_name || currentUser?.username}`,
        link: '/achievements',
      })
      
      // Refresh user list
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
  const canGrantXP = isAdmin || (currentUser as any)?.is_founding_member

  const TABS: { id: AdminTab; label: string; icon: any; adminOnly?: boolean }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'content', label: 'Content', icon: Newspaper },
    { id: 'reports', label: 'Reports', icon: Flag },
    { id: 'games', label: 'Games', icon: Gamepad2, adminOnly: true },
    { id: 'tournaments', label: 'Tournaments', icon: Trophy },
    { id: 'market', label: 'Market', icon: ShoppingBag, adminOnly: true },
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
        {stats.reports_pending > 0 && (
          <button onClick={() => setActiveTab('reports')} className="vs-badge bg-danger/15 text-danger text-xs py-1.5 px-3 cursor-pointer hover:bg-danger/25 transition-colors">
            <AlertTriangle size={12} /> {stats.reports_pending} pending reports
          </button>
        )}
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
            {tab.id === 'reports' && stats.reports_pending > 0 && (
              <span className="w-4 h-4 rounded-full bg-danger text-white text-[9px] flex items-center justify-center">{stats.reports_pending}</span>
            )}
          </button>
        ))}
        {isAdmin && (
          <Link href="/admin/infra" className="vs-tab whitespace-nowrap">
            <ShieldCheck size={13} /> Infra
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <div className="vs-card cursor-pointer hover:border-danger/30 transition-all" onClick={() => setActiveTab('reports')}>
              <p className="vs-label mb-1">PENDING REPORTS</p>
              <p className={`text-xl font-semibold ${stats.reports_pending > 0 ? 'text-danger' : 'text-success'}`}>
                {stats.reports_pending}
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
            <select value={userRoleFilter} onChange={e => { setUserRoleFilter(e.target.value); setTimeout(loadTabData, 0) }}
              className="bg-surface border border-border rounded-lg text-xs text-text-dim px-3 py-1.5 outline-none appearance-none">
              <option value="all">All roles</option>
              <option value="member">Members</option>
              <option value="moderator">Moderators</option>
              <option value="admin">Admins</option>
            </select>
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
                      {user.is_founding_member && <Star size={9} className="text-purple shrink-0" fill="currentColor" />}
                    </div>
                    <p className="text-[10px] text-text-dim truncate">@{user.username}</p>
                  </div>
                </div>
                <div>
                  {isAdmin ? (
                    <select value={(user as any).role || 'member'} onChange={e => updateUserRole(user.id, e.target.value)}
                      className={`bg-transparent text-[10px] outline-none cursor-pointer ${
                        (user as any).role === 'admin' ? 'text-danger' : (user as any).role === 'moderator' ? 'text-warning' : 'text-text-dim'
                      }`}>
                      <option value="member">member</option>
                      <option value="moderator">moderator</option>
                      <option value="admin">admin</option>
                    </select>
                  ) : (
                    <span className="text-[10px] text-text-dim">{(user as any).role || 'member'}</span>
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
                    <button onClick={() => toggleFounder(user.id, user.is_founding_member)}
                      className={`p-1.5 rounded text-[10px] transition-colors ${user.is_founding_member ? 'text-purple bg-purple/10' : 'text-text-dim hover:text-purple'}`}
                      title={user.is_founding_member ? 'Remove from Inner Circle' : 'Add to Inner Circle'}>
                      <Star size={11} fill={user.is_founding_member ? 'currentColor' : 'none'} />
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

      {/* Reports */}
      {activeTab === 'reports' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            {['pending', 'resolved', 'dismissed', 'all'].map(f => (
              <button key={f} onClick={() => { setReportFilter(f); setTimeout(loadTabData, 0) }}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${reportFilter === f ? 'bg-purple/15 text-purple' : 'text-text-dim hover:bg-surface'}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {reports.length === 0 ? (
            <div className="vs-card text-center py-12">
              <Flag size={28} className="mx-auto text-text-dim opacity-40 mb-2" />
              <p className="text-sm text-text-dim">{reportFilter === 'pending' ? 'No pending reports' : 'No reports found'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map(report => (
                <div key={report.id} className={`vs-card ${report.status === 'pending' ? 'border-warning/20' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded ${
                          report.status === 'pending' ? 'bg-warning/15 text-warning' :
                          report.status === 'resolved' ? 'bg-success/15 text-success' : 'bg-text-dim/15 text-text-dim'
                        }`}>{report.status}</span>
                        <span className="text-[10px] text-text-dim bg-surface-2 px-2 py-0.5 rounded">{report.target_type}</span>
                        <span className="text-[10px] text-text-dim">{timeAgo(report.created_at)}</span>
                      </div>
                      <p className="text-sm mb-1">{report.reason}</p>
                      <p className="text-[10px] text-text-dim">
                        Reported by {(report as any).reporter?.username || 'Unknown'} · Target: {report.target_id.slice(0, 8)}...
                      </p>
                    </div>
                    {report.status === 'pending' && (
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => resolveReport(report.id, 'resolved')}
                          className="vs-btn vs-btn-primary text-[10px] px-2.5 py-1"><Check size={11} /> Resolve</button>
                        <button onClick={() => resolveReport(report.id, 'dismissed')}
                          className="vs-btn vs-btn-ghost text-[10px] px-2.5 py-1"><X size={11} /> Dismiss</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
              <select value={t.status} onChange={e => updateTournamentStatus(t.id, e.target.value)}
                className="bg-surface border border-border rounded text-[10px] text-text-dim px-2 py-1 outline-none appearance-none">
                <option value="upcoming">upcoming</option>
                <option value="registration">registration</option>
                <option value="in_progress">in_progress</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
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

              {/* Quick amounts */}
              <div>
                <label className="vs-label block mb-2">AMOUNT</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[5, 10, 25, 50].map(n => (
                    <button key={n} onClick={() => setXpAmount(n)}
                      className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                        xpAmount === n ? 'border-cyan bg-cyan/10 text-cyan' : 'border-border bg-surface text-text-dim hover:border-border-hover'
                      }`}>
                      +{n}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[100, 250, 500, 1000].map(n => (
                    <button key={n} onClick={() => setXpAmount(n)}
                      className={`py-2 rounded-lg text-sm font-medium border transition-all ${
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

      {/* Market */}
      {activeTab === 'market' && isAdmin && (
        <div className="space-y-6">
          {/* Stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="vs-card vs-lit">
              <p className="vs-label">SELLER QUEUE</p>
              <p className="text-2xl font-semibold text-warning tabular-nums mt-1">{marketStats.pending_sellers}</p>
            </div>
            <div className="vs-card vs-lit">
              <p className="vs-label">REPORTS</p>
              <p className={`text-2xl font-semibold tabular-nums mt-1 ${marketStats.pending_reports > 0 ? 'text-danger' : 'text-success'}`}>
                {marketStats.pending_reports}
              </p>
            </div>
            <div className="vs-card vs-lit">
              <p className="vs-label">ACTIVE LISTINGS</p>
              <p className="text-2xl font-semibold text-cyan tabular-nums mt-1">{marketStats.active_listings}</p>
            </div>
            <div className="vs-card vs-lit">
              <p className="vs-label">CONFIRMED ORDERS</p>
              <p className="text-2xl font-semibold tabular-nums mt-1">{marketStats.total_orders}</p>
            </div>
            <div className="vs-card vs-lit">
              <p className="vs-label">REVENUE</p>
              <p className="text-2xl font-semibold tabular-nums mt-1">€{marketStats.total_revenue.toFixed(2)}</p>
            </div>
            <div className="vs-card vs-lit">
              <p className="vs-label">COMMISSION</p>
              <p className="text-2xl font-semibold text-success tabular-nums mt-1">€{marketStats.total_commission.toFixed(2)}</p>
            </div>
          </div>

          {/* Pending listing reports */}
          <div>
            <h3 className="vs-counter text-[11px] tabular-nums mb-2">PENDING REPORTS</h3>
            {pendingReports.length === 0 ? (
              <div className="vs-card text-center py-6">
                <Check size={20} className="text-success mx-auto mb-1" />
                <p className="text-xs text-text-dim">No pending reports</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingReports.map(r => (
                  <div key={r.id} className="vs-card flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="vs-badge text-[9px] bg-warning/15 text-warning border border-warning/30 capitalize">
                          {r.reason}
                        </span>
                        {r.listing && (
                          <Link href={`/market/listing/${r.listing.id}`} className="text-sm font-medium hover:text-purple-light line-clamp-1">
                            {r.listing.title}
                          </Link>
                        )}
                      </div>
                      <p className="text-[10px] text-text-dim tabular-nums">
                        Reported by @{r.reporter?.username || 'unknown'} · {timeAgo(r.created_at)}
                      </p>
                      {r.details && (
                        <p className="text-xs text-text-muted mt-2 leading-relaxed whitespace-pre-wrap line-clamp-3">
                          {r.details}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => resolveMarketReport(r.id, 'resolved')}
                        className="vs-btn vs-btn-primary text-xs"
                      >
                        <Check size={13} /> RESOLVE
                      </button>
                      <button
                        onClick={() => resolveMarketReport(r.id, 'dismissed')}
                        className="vs-btn vs-btn-ghost text-xs"
                      >
                        <X size={13} /> DISMISS
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending sellers */}
          <div>
            <h3 className="vs-counter text-[11px] tabular-nums mb-2">PENDING SELLER APPLICATIONS</h3>
            {pendingSellers.length === 0 ? (
              <div className="vs-card text-center py-8">
                <Check size={20} className="text-success mx-auto mb-1" />
                <p className="text-xs text-text-dim">No pending applications</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingSellers.map(s => (
                  <div key={s.id} className="vs-card flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-purple/15 flex items-center justify-center text-xs font-bold text-purple shrink-0">
                        {(s.profile?.display_name || s.profile?.username || '?')[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link href={`/profile/${s.profile?.username}`} className="text-sm font-medium hover:text-purple-light">
                          {s.profile?.display_name || s.profile?.username}
                        </Link>
                        <p className="text-[10px] text-text-dim tabular-nums">
                          @{s.profile?.username} · applied {timeAgo(s.created_at)}
                        </p>
                        {s.application_note && (
                          <p className="text-xs text-text-muted mt-2 leading-relaxed whitespace-pre-wrap line-clamp-4">
                            {s.application_note}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => approveSeller(s.id)} className="vs-btn vs-btn-primary text-xs">
                        <Check size={13} /> APPROVE
                      </button>
                      <button onClick={() => rejectSeller(s.id)} className="vs-btn vs-btn-danger text-xs">
                        <X size={13} /> REJECT
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All listings */}
          <div>
            <h3 className="vs-counter text-[11px] tabular-nums mb-2">ALL LISTINGS</h3>
            {marketListings.length === 0 ? (
              <div className="vs-card text-center py-8">
                <ShoppingBag size={20} className="text-text-dim mx-auto mb-1" />
                <p className="text-xs text-text-dim">No listings yet</p>
              </div>
            ) : (
              <div className="vs-card vs-lit p-0 overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead className="bg-surface-2 border-b border-border">
                    <tr className="text-left vs-counter text-[10px] tabular-nums">
                      <th className="px-4 py-2.5">TITLE</th>
                      <th className="px-4 py-2.5">SELLER</th>
                      <th className="px-4 py-2.5">CATEGORY</th>
                      <th className="px-4 py-2.5 text-right">PRICE</th>
                      <th className="px-4 py-2.5">STATUS</th>
                      <th className="px-4 py-2.5 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {marketListings.map(l => (
                      <tr key={l.id} className="hover:bg-surface/50 transition-colors">
                        <td className="px-4 py-2.5">
                          <Link href={`/market/listing/${l.id}`} className="text-text hover:text-purple-light line-clamp-1">
                            {l.void_verified && <ShieldCheck size={11} className="text-purple-light inline mr-1" />}
                            {l.title}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-xs">
                          <Link href={`/profile/${l.seller?.profile?.username || ''}`} className="text-text-muted hover:text-text">
                            @{l.seller?.profile?.username || 'unknown'}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="vs-badge text-[9px] bg-surface-2 text-text-muted border border-border">
                            {MARKET_CATEGORIES[l.category].tag}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-cyan tabular-nums">
                          {formatPrice(l.price, l.currency)}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`vs-badge text-[9px] capitalize ${
                            l.status === 'active' ? 'vs-badge-success' :
                            l.status === 'sold' ? 'vs-badge-cyan' :
                            l.status === 'removed' ? 'vs-badge-danger' :
                            'vs-badge-warning'
                          }`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="inline-flex gap-1">
                            <button
                              onClick={() => toggleVoidVerified(l.id, l.void_verified)}
                              className={`p-1.5 rounded transition-colors ${
                                l.void_verified
                                  ? 'text-purple-light bg-purple/10 hover:bg-purple/20'
                                  : 'text-text-dim hover:text-purple-light hover:bg-purple/10'
                              }`}
                              title={l.void_verified ? 'Remove VOID Verified' : 'Mark VOID Verified'}
                            >
                              <ShieldCheck size={13} />
                            </button>
                            {l.status !== 'removed' && (
                              <button
                                onClick={() => removeListing(l.id)}
                                className="p-1.5 rounded text-text-dim hover:text-danger hover:bg-danger/10 transition-colors"
                                title="Remove listing"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
