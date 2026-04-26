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
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'

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

    const orderField = activeTab === 'xp' ? 'xp' :
                       activeTab === 'posts' ? 'post_count' :
                       activeTab === 'clips' ? 'clip_count' : 'follower_count'

    const { data, count } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, xp, level, level_name, is_founding_member, is_verified, is_coach, post_count, clip_count, follower_count', { count: 'exact' })
      .eq('is_onboarded', true)
      .order(orderField, { ascending: false })
      .limit(100)

    if (data) setUsers(data as RankedUser[])
    setTotalMembers(count || 0)

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
    if (rank === 1) return <Crown size={16} className="text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.4)]" />
    if (rank === 2) return <Medal size={16} className="text-gray-300" />
    if (rank === 3) return <Medal size={16} className="text-amber-600" />
    return (
      <span className="vs-counter text-[10px] text-text-dim tabular-nums w-7 text-center">
        {String(rank).padStart(2, '0')}
      </span>
    )
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
            {totalMembers > 0 && (
              <span className="vs-counter text-[10px] text-text-dim tabular-nums ml-1">
                {String(totalMembers).padStart(3, '0')}
              </span>
            )}
          </h1>
          <p className="vs-counter text-[11px] text-text-dim mt-1 tabular-nums">
            {String(totalMembers).padStart(3, '0')} MEMBERS · {activeTab.toUpperCase()} LEADERBOARD
          </p>
        </div>
        {currentUserRank > 0 && (
          <div className="vs-card vs-lit flex items-center gap-3 py-2 px-4">
            <span className="vs-counter text-[10px] text-text-dim">YOUR RANK</span>
            <span className="text-lg font-bold text-cyan tabular-nums">
              #{String(currentUserRank).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      {/* Top 3 podium */}
      {!loading && users.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {/* 2nd place */}
          <div className="vs-card vs-lit vs-brackets text-center pt-7 pb-4 relative overflow-hidden border-gray-300/15">
            <span className="vs-counter text-[10px] text-gray-300 tabular-nums absolute top-3 left-4">02</span>
            <Medal size={20} className="text-gray-300 mx-auto mb-2" />
            <div className="flex justify-center mb-2">
              <Avatar
                url={users[1].avatar_url}
                name={users[1].display_name || users[1].username}
                href={`/profile/${users[1].username}`}
                size="lg"
                shape="rounded"
                variant="gradient"
                showInnerRing={users[1].is_founding_member}
              />
            </div>
            <Link href={`/profile/${users[1].username}`} className="text-sm font-medium hover:text-purple transition-colors">
              {users[1].display_name || users[1].username}
            </Link>
            <p className="text-[10px] text-text-dim">@{users[1].username}</p>
            <p className="text-xs text-cyan mt-2 font-medium tabular-nums">{getStatValue(users[1])}</p>
            <p className="vs-counter text-[10px] text-purple-light mt-1 tabular-nums">{users[1].level_name.toUpperCase()}</p>
          </div>

          {/* 1st place */}
          <div
            className="vs-card vs-lit vs-brackets text-center pt-5 pb-4 relative overflow-hidden border-yellow-400/25"
            style={{ boxShadow: '0 0 28px rgba(250,204,21,0.10), inset 0 0 24px rgba(250,204,21,0.04)' }}
          >
            <span className="vs-counter text-[10px] text-yellow-400 tabular-nums absolute top-3 left-4">01</span>
            <Crown size={26} className="text-yellow-400 mx-auto mb-2 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
            <div className="flex justify-center mb-2">
              <Avatar
                url={users[0].avatar_url}
                name={users[0].display_name || users[0].username}
                href={`/profile/${users[0].username}`}
                size="xl"
                shape="rounded"
                variant="gradient"
                showInnerRing={users[0].is_founding_member}
              />
            </div>
            <Link href={`/profile/${users[0].username}`} className="text-base font-semibold hover:text-yellow-400 transition-colors">
              {users[0].display_name || users[0].username}
            </Link>
            <p className="text-[10px] text-text-dim">@{users[0].username}</p>
            <p className="text-sm text-cyan mt-2 font-bold tabular-nums">{getStatValue(users[0])}</p>
            <p className="vs-counter text-[10px] text-purple-light mt-1 tabular-nums">{users[0].level_name.toUpperCase()}</p>
          </div>

          {/* 3rd place */}
          <div className="vs-card vs-lit vs-brackets text-center pt-7 pb-4 relative overflow-hidden border-amber-600/20">
            <span className="vs-counter text-[10px] text-amber-600 tabular-nums absolute top-3 left-4">03</span>
            <Medal size={20} className="text-amber-600 mx-auto mb-2" />
            <div className="flex justify-center mb-2">
              <Avatar
                url={users[2].avatar_url}
                name={users[2].display_name || users[2].username}
                href={`/profile/${users[2].username}`}
                size="lg"
                shape="rounded"
                variant="gradient"
                showInnerRing={users[2].is_founding_member}
              />
            </div>
            <Link href={`/profile/${users[2].username}`} className="text-sm font-medium hover:text-purple transition-colors">
              {users[2].display_name || users[2].username}
            </Link>
            <p className="text-[10px] text-text-dim">@{users[2].username}</p>
            <p className="text-xs text-cyan mt-2 font-medium tabular-nums">{getStatValue(users[2])}</p>
            <p className="vs-counter text-[10px] text-purple-light mt-1 tabular-nums">{users[2].level_name.toUpperCase()}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
        {/* Main leaderboard */}
        <div>
          {/* Tab bar + search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-1 shrink-0 flex-wrap">
              {[
                { id: 'xp' as RankTab, label: 'XP', icon: Zap },
                { id: 'posts' as RankTab, label: 'Posts', icon: TrendingUp },
                { id: 'clips' as RankTab, label: 'Clips', icon: Flame },
                { id: 'followers' as RankTab, label: 'Followers', icon: Users },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  data-active={activeTab === tab.id}
                  className="vs-tab text-xs"
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
            <EmptyState
              icon={BarChart3}
              title={searchQuery ? 'No players found' : 'No ranked players yet'}
              description={searchQuery ? 'Try a different search term.' : 'The leaderboard fills up as members earn XP.'}
            />
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
                    <Avatar
                      url={user.avatar_url}
                      name={user.display_name || user.username}
                      href={`/profile/${user.username}`}
                      size="md"
                      shape="rounded"
                      variant="gradient"
                      showInnerRing={user.is_founding_member}
                    />

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
                          <span className="vs-badge vs-badge-purple text-[8px] py-0 px-1.5">Inner</span>
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
                      <p className="text-sm font-medium text-cyan tabular-nums">{getStatValue(user)}</p>
                      <p className="vs-counter text-[10px] text-text-dim tabular-nums">
                        LV {String(user.level).padStart(2, '0')}
                      </p>
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
          <div className="vs-card vs-lit">
            <p className="vs-label mb-3">LEVEL DISTRIBUTION</p>
            <div className="space-y-2">
              {LEVELS.slice().reverse().map(level => {
                const count = levelDistribution[level.name] || 0
                const max = Math.max(...Object.values(levelDistribution), 1)
                const pct = (count / max) * 100
                const tierClass =
                  level.level >= 8 ? 'bg-gradient-to-r from-yellow-400/80 to-yellow-400' :
                  level.level >= 5 ? 'bg-gradient-to-r from-purple to-purple-light' :
                  level.level >= 3 ? 'bg-gradient-to-r from-cyan/80 to-cyan' :
                  'bg-text-dim/60'

                return (
                  <div key={level.level} className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted w-20 text-right truncate">{level.name}</span>
                    <div className="flex-1 h-2 bg-void rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${tierClass}`}
                        style={{ width: `${pct}%`, opacity: count > 0 ? 1 : 0.15 }}
                      />
                    </div>
                    <span className="vs-counter text-[10px] text-text-dim w-7 text-right tabular-nums">
                      {String(count).padStart(2, '0')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Rank tiers */}
          <div className="vs-card vs-lit">
            <p className="vs-label mb-3">RANK TIERS</p>
            <div className="space-y-1.5">
              {LEVELS.map(level => (
                <div key={level.level} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      level.level >= 8 ? 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.6)]' :
                      level.level >= 5 ? 'bg-purple shadow-[0_0_6px_rgba(107,63,224,0.5)]' :
                      level.level >= 3 ? 'bg-cyan' : 'bg-text-dim'
                    }`} />
                    <span className="text-text-muted">{level.name}</span>
                  </div>
                  <span className="vs-counter text-[10px] text-text-dim tabular-nums">
                    {level.min_xp.toLocaleString()} XP
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* How to earn XP */}
          <div className="vs-card vs-lit">
            <p className="vs-label mb-3">HOW TO CLIMB</p>
            <div className="space-y-2 text-xs text-text-dim">
              <div className="flex justify-between"><span>Create a post</span><span className="text-purple tabular-nums">+5 XP</span></div>
              <div className="flex justify-between"><span>Comment</span><span className="text-purple tabular-nums">+2 XP</span></div>
              <div className="flex justify-between"><span>Upload a clip</span><span className="text-purple tabular-nums">+10 XP</span></div>
              <div className="flex justify-between"><span>Daily login</span><span className="text-purple tabular-nums">+3 XP</span></div>
              <div className="flex justify-between"><span>Join tournament</span><span className="text-purple tabular-nums">+25 XP</span></div>
              <div className="flex justify-between"><span>Win tournament</span><span className="text-purple tabular-nums">+100 XP</span></div>
              <div className="flex justify-between"><span>Clip of the Week</span><span className="text-purple tabular-nums">+50 XP</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
