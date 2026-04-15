'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { getLevelFromXP, getXPProgress, LEVELS } from '@/types'
import type { Profile, Game } from '@/types'
import Link from 'next/link'
import {
  BarChart3, Trophy, Star, Crown, Medal, ChevronUp, ChevronDown,
  Flame, Users, Shield, Gamepad2, TrendingUp, Zap, Search
} from 'lucide-react'

type RankTab = 'xp' | 'posts' | 'clips' | 'followers'
type TimeFilter = 'all' | 'month' | 'week'

interface RankedUser {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  xp: number
  level: number
  level_name: string
  is_founding_member: boolean
  is_verified: boolean
  is_coach: boolean
  post_count?: number
  clip_count?: number
  follower_count?: number
}

export default function RankingsPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<RankedUser[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<RankTab>('xp')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [totalMembers, setTotalMembers] = useState(0)

  // Level distribution
  const [levelDistribution, setLevelDistribution] = useState<Record<string, number>>({})

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    loadRankings()
  }, [activeTab])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setCurrentUserId(user.id)
    loadGames()
    loadRankings()
    loadLevelDistribution()
  }

  async function loadGames() {
    const { data } = await supabase.from('games').select('*').eq('is_approved', true).order('name')
    if (data) setGames(data)
  }

  async function loadRankings() {
    setLoading(true)

    if (activeTab === 'xp') {
      const { data, count } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, xp, level, level_name, is_founding_member, is_verified, is_coach', { count: 'exact' })
        .eq('is_onboarded', true)
        .order('xp', { ascending: false })
        .limit(100)

      if (data) setUsers(data as RankedUser[])
      setTotalMembers(count || 0)

    } else if (activeTab === 'posts') {
      // Get users with most posts
      const { data: postCounts } = await supabase
        .rpc('get_post_rankings')
        .limit(100)

      if (postCounts) {
        setUsers(postCounts as RankedUser[])
      } else {
        // Fallback: just load by XP
        const { data } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, xp, level, level_name, is_founding_member, is_verified, is_coach')
          .eq('is_onboarded', true)
          .order('xp', { ascending: false })
          .limit(100)
        if (data) setUsers(data as RankedUser[])
      }

    } else if (activeTab === 'clips') {
      const { data: clipCounts } = await supabase
        .rpc('get_clip_rankings')
        .limit(100)

      if (clipCounts) {
        setUsers(clipCounts as RankedUser[])
      } else {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, xp, level, level_name, is_founding_member, is_verified, is_coach')
          .eq('is_onboarded', true)
          .order('xp', { ascending: false })
          .limit(100)
        if (data) setUsers(data as RankedUser[])
      }

    } else if (activeTab === 'followers') {
      const { data: followerCounts } = await supabase
        .rpc('get_follower_rankings')
        .limit(100)

      if (followerCounts) {
        setUsers(followerCounts as RankedUser[])
      } else {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, xp, level, level_name, is_founding_member, is_verified, is_coach')
          .eq('is_onboarded', true)
          .order('xp', { ascending: false })
          .limit(100)
        if (data) setUsers(data as RankedUser[])
      }
    }

    setLoading(false)
  }

  async function loadLevelDistribution() {
    const { data } = await supabase
      .from('profiles')
      .select('level_name')
      .eq('is_onboarded', true)

    if (data) {
      const dist: Record<string, number> = {}
      data.forEach(p => {
        const name = p.level_name || 'Recruit'
        dist[name] = (dist[name] || 0) + 1
      })
      setLevelDistribution(dist)
    }
  }

  function getStatValue(user: RankedUser): string {
    switch (activeTab) {
      case 'xp': return `${user.xp.toLocaleString()} XP`
      case 'posts': return `${user.post_count || 0} posts`
      case 'clips': return `${user.clip_count || 0} clips`
      case 'followers': return `${user.follower_count || 0} followers`
      default: return `${user.xp.toLocaleString()} XP`
    }
  }

  function getRankIcon(rank: number) {
    if (rank === 1) return <Crown size={16} className="text-yellow-400" />
    if (rank === 2) return <Medal size={16} className="text-gray-300" />
    if (rank === 3) return <Medal size={16} className="text-amber-600" />
    return <span className="text-xs text-text-dim w-4 text-center">{rank}</span>
  }

  function getRankBg(rank: number) {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400/10 via-surface to-surface border-yellow-400/20'
    if (rank === 2) return 'bg-gradient-to-r from-gray-300/10 via-surface to-surface border-gray-300/15'
    if (rank === 3) return 'bg-gradient-to-r from-amber-600/10 via-surface to-surface border-amber-600/15'
    return ''
  }

  const filteredUsers = searchQuery
    ? users.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.display_name || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users

  // Find current user's rank
  const currentUserRank = currentUserId ? users.findIndex(u => u.id === currentUserId) + 1 : 0

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-wide flex items-center gap-2">
            <BarChart3 size={20} className="text-purple" />
            Rankings
          </h1>
          <p className="text-sm text-text-dim mt-0.5">{totalMembers} members competing</p>
        </div>
        {currentUserRank > 0 && (
          <div className="vs-card flex items-center gap-3 py-2 px-4">
            <span className="text-xs text-text-dim">Your rank</span>
            <span className="text-lg font-bold text-cyan">#{currentUserRank}</span>
          </div>
        )}
      </div>

      {/* Top 3 podium */}
      {!loading && users.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* 2nd place */}
          <div className="vs-card text-center pt-8 pb-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300/40 to-transparent" />
            <Medal size={20} className="text-gray-300 mx-auto mb-2" />
            <Link href={`/profile/${users[1].username}`}>
              <div className="w-14 h-14 rounded-xl bg-purple/20 flex items-center justify-center text-xl font-bold text-purple mx-auto mb-2 relative">
                {(users[1].display_name || users[1].username)[0].toUpperCase()}
                {users[1].is_founding_member && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple flex items-center justify-center">
                    <Star size={8} className="text-white" fill="white" />
                  </div>
                )}
              </div>
              <p className="text-sm font-medium hover:text-purple transition-colors">{users[1].display_name || users[1].username}</p>
            </Link>
            <p className="text-[10px] text-text-dim">@{users[1].username}</p>
            <p className="text-xs text-cyan mt-2 font-medium">{getStatValue(users[1])}</p>
            <p className="text-[10px] text-purple mt-0.5">{users[1].level_name}</p>
          </div>

          {/* 1st place */}
          <div className="vs-card text-center pt-6 pb-4 relative overflow-hidden border-yellow-400/20">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />
            <Crown size={24} className="text-yellow-400 mx-auto mb-2" />
            <Link href={`/profile/${users[0].username}`}>
              <div className="w-16 h-16 rounded-xl bg-yellow-400/15 border border-yellow-400/20 flex items-center justify-center text-2xl font-bold text-yellow-400 mx-auto mb-2 relative">
                {(users[0].display_name || users[0].username)[0].toUpperCase()}
                {users[0].is_founding_member && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple flex items-center justify-center">
                    <Star size={8} className="text-white" fill="white" />
                  </div>
                )}
              </div>
              <p className="text-base font-semibold hover:text-yellow-400 transition-colors">{users[0].display_name || users[0].username}</p>
            </Link>
            <p className="text-[10px] text-text-dim">@{users[0].username}</p>
            <p className="text-sm text-cyan mt-2 font-bold">{getStatValue(users[0])}</p>
            <p className="text-[10px] text-purple mt-0.5">{users[0].level_name}</p>
          </div>

          {/* 3rd place */}
          <div className="vs-card text-center pt-8 pb-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-600/40 to-transparent" />
            <Medal size={20} className="text-amber-600 mx-auto mb-2" />
            <Link href={`/profile/${users[2].username}`}>
              <div className="w-14 h-14 rounded-xl bg-purple/20 flex items-center justify-center text-xl font-bold text-purple mx-auto mb-2 relative">
                {(users[2].display_name || users[2].username)[0].toUpperCase()}
                {users[2].is_founding_member && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple flex items-center justify-center">
                    <Star size={8} className="text-white" fill="white" />
                  </div>
                )}
              </div>
              <p className="text-sm font-medium hover:text-purple transition-colors">{users[2].display_name || users[2].username}</p>
            </Link>
            <p className="text-[10px] text-text-dim">@{users[2].username}</p>
            <p className="text-xs text-cyan mt-2 font-medium">{getStatValue(users[2])}</p>
            <p className="text-[10px] text-purple mt-0.5">{users[2].level_name}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-[1fr_260px] gap-5">
        {/* Main leaderboard */}
        <div>
          {/* Tab bar + search */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center bg-surface rounded-lg border border-border overflow-hidden">
              {[
                { id: 'xp' as RankTab, label: 'XP', icon: Zap },
                { id: 'posts' as RankTab, label: 'Posts', icon: TrendingUp },
                { id: 'clips' as RankTab, label: 'Clips', icon: Flame },
                { id: 'followers' as RankTab, label: 'Followers', icon: Users },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                    activeTab === tab.id ? 'bg-purple/15 text-purple' : 'text-text-dim hover:text-text-muted'
                  }`}
                >
                  <tab.icon size={12} /> {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search players..."
                className="vs-input text-xs pl-8 py-1.5"
              />
            </div>
          </div>

          {/* Leaderboard list */}
          {loading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="vs-card flex items-center gap-3 animate-pulse">
                  <div className="w-5 h-5 bg-surface-2 rounded" />
                  <div className="w-9 h-9 bg-surface-2 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-3.5 bg-surface-2 rounded w-28 mb-1" />
                    <div className="h-2.5 bg-surface-2 rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="vs-card text-center py-12">
              <BarChart3 size={28} className="mx-auto text-text-dim opacity-40 mb-2" />
              <p className="text-sm text-text-dim">
                {searchQuery ? 'No players found' : 'No ranked players yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredUsers.map((user, i) => {
                const rank = i + 1
                const isCurrentUser = user.id === currentUserId
                const level = getLevelFromXP(user.xp)

                return (
                  <div
                    key={user.id}
                    className={`vs-card flex items-center gap-3 py-2.5 transition-all hover:border-border-hover ${
                      getRankBg(rank)
                    } ${isCurrentUser ? 'ring-1 ring-cyan/30' : ''}`}
                  >
                    {/* Rank */}
                    <div className="w-7 flex items-center justify-center shrink-0">
                      {getRankIcon(rank)}
                    </div>

                    {/* Avatar */}
                    <Link href={`/profile/${user.username}`} className="shrink-0">
                      <div className="w-9 h-9 rounded-lg bg-purple/20 flex items-center justify-center text-sm font-bold text-purple relative">
                        {(user.display_name || user.username)[0].toUpperCase()}
                        {user.is_founding_member && (
                          <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-purple flex items-center justify-center">
                            <Star size={7} className="text-white" fill="white" />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/profile/${user.username}`}
                          className="text-sm font-medium truncate hover:text-purple transition-colors"
                        >
                          {user.display_name || user.username}
                        </Link>
                        {user.is_founding_member && (
                          <span className="vs-badge vs-badge-purple text-[8px] py-0 px-1.5">Founder</span>
                        )}
                        {user.is_coach && (
                          <span className="vs-badge text-[8px] py-0 px-1.5 bg-success/15 text-success">Coach</span>
                        )}
                        {isCurrentUser && (
                          <span className="text-[9px] text-cyan">You</span>
                        )}
                      </div>
                      <p className="text-[10px] text-text-dim">
                        @{user.username} · {level.name}
                      </p>
                    </div>

                    {/* Stat */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-cyan">{getStatValue(user)}</p>
                      <p className="text-[10px] text-text-dim">Lvl {user.level}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Level distribution */}
          <div className="vs-card">
            <p className="vs-label mb-3">LEVEL DISTRIBUTION</p>
            <div className="space-y-2">
              {LEVELS.slice().reverse().map(level => {
                const count = levelDistribution[level.name] || 0
                const max = Math.max(...Object.values(levelDistribution), 1)
                const pct = (count / max) * 100

                return (
                  <div key={level.level} className="flex items-center gap-2">
                    <span className="text-[10px] text-text-dim w-20 text-right truncate">{level.name}</span>
                    <div className="flex-1 h-2 bg-void rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all bg-purple"
                        style={{ width: `${pct}%`, opacity: count > 0 ? 1 : 0.2 }}
                      />
                    </div>
                    <span className="text-[10px] text-text-dim w-5 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Rank tiers */}
          <div className="vs-card">
            <p className="vs-label mb-3">RANK TIERS</p>
            <div className="space-y-1.5">
              {LEVELS.map(level => (
                <div key={level.level} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      level.level >= 8 ? 'bg-yellow-400' :
                      level.level >= 5 ? 'bg-purple' :
                      level.level >= 3 ? 'bg-cyan' : 'bg-text-dim'
                    }`} />
                    <span className="text-text-muted">{level.name}</span>
                  </div>
                  <span className="text-text-dim">{level.min_xp.toLocaleString()} XP</span>
                </div>
              ))}
            </div>
          </div>

          {/* How to earn XP */}
          <div className="vs-card">
            <p className="vs-label mb-3">HOW TO CLIMB</p>
            <div className="space-y-2 text-xs text-text-dim">
              <div className="flex justify-between"><span>Create a post</span><span className="text-purple">+5 XP</span></div>
              <div className="flex justify-between"><span>Comment</span><span className="text-purple">+2 XP</span></div>
              <div className="flex justify-between"><span>Upload a clip</span><span className="text-purple">+10 XP</span></div>
              <div className="flex justify-between"><span>Daily login</span><span className="text-purple">+3 XP</span></div>
              <div className="flex justify-between"><span>Join tournament</span><span className="text-purple">+25 XP</span></div>
              <div className="flex justify-between"><span>Win tournament</span><span className="text-purple">+100 XP</span></div>
              <div className="flex justify-between"><span>Clip of the Week</span><span className="text-purple">+50 XP</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
