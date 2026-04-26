'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { Plus, Upload, Users, TrendingUp, Trophy, Zap, Calendar, Newspaper } from 'lucide-react'
import { getLevelFromXP, getXPProgress } from '@/types'
import type { Profile, Post, Game } from '@/types'
import Link from 'next/link'
import { OnlineFriends } from '@/components/ui/online-friends'
import { ActivityWidget } from '@/components/ui/activity-widget'
import { StreakWidget } from '@/components/ui/streak-widget'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'

type FeedTab = 'your' | 'global'

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FeedTab | string>('your')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setProfile(profileData as Profile)

      if (!profileData.is_onboarded) {
        router.push('/onboarding')
        return
      }
    }

    const { data: postsData } = await supabase
      .from('posts')
      .select('*, profile:profiles(*), game:games(*)')
      .order('created_at', { ascending: false })
      .limit(10)

    if (postsData) setPosts(postsData as Post[])

    const { count: followerCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id)

    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id)

    const { count: postCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    setStats({
      followers: followerCount || 0,
      following: followingCount || 0,
      posts: postCount || 0,
    })

    const { data: userGames } = await supabase
      .from('user_games')
      .select('game:games(*)')
      .eq('user_id', user.id)

    if (userGames) {
      setGames(userGames.map((ug: any) => ug.game).filter(Boolean))
    }

    setLoading(false)
  }

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-dim text-sm animate-pulse">Loading your signal...</div>
      </div>
    )
  }

  const level = getLevelFromXP(profile.xp)
  const xpProgress = getXPProgress(profile.xp)

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-xl font-medium mb-1">
          Welcome back, {profile.display_name || profile.username}
        </h1>
        <p className="text-sm text-text-dim">
          Season 1 · {profile.xp.toLocaleString()} XP · {level.name}
        </p>
      </div>

      {/* Stats row — followers/following clickable naar profile */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="vs-card vs-lit">
          <p className="vs-label mb-1">YOUR LEVEL</p>
          <p className="text-xl font-medium text-purple">{level.name}</p>
          <div className="mt-2 h-1.5 bg-void rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple to-cyan rounded-full transition-all shadow-[0_0_8px_rgba(107,63,224,0.5)]"
              style={{ width: `${xpProgress.percentage}%` }}
            />
          </div>
        </div>
        <div className="vs-card vs-lit">
          <p className="vs-label mb-1">XP</p>
          <p className="text-xl font-medium text-cyan">{profile.xp.toLocaleString()}</p>
        </div>
        <Link
          href={`/profile/${profile.username}?tab=followers`}
          className="vs-card hover:border-border-hover transition-colors"
        >
          <p className="vs-label mb-1">FOLLOWERS</p>
          <p className="text-xl font-medium">{stats.followers}</p>
        </Link>
        <Link
          href={`/profile/${profile.username}?tab=following`}
          className="vs-card hover:border-border-hover transition-colors"
        >
          <p className="vs-label mb-1">FOLLOWING</p>
          <p className="text-xl font-medium">{stats.following}</p>
        </Link>
        <Link
          href={`/profile/${profile.username}`}
          className="vs-card hover:border-border-hover transition-colors"
        >
          <p className="vs-label mb-1">POSTS</p>
          <p className="text-xl font-medium">{stats.posts}</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-5">
        {/* Feed */}
        <div>
          <div className="flex items-center gap-1.5 mb-4 flex-wrap">
            <button
              onClick={() => setActiveTab('your')}
              data-active={activeTab === 'your'}
              className="vs-tab"
            >
              Your feed
            </button>
            <button
              onClick={() => setActiveTab('global')}
              data-active={activeTab === 'global'}
              className="vs-tab"
            >
              Global
            </button>
            {games.slice(0, 3).map(game => (
              <button
                key={game.id}
                onClick={() => setActiveTab(`game:${game.id}`)}
                data-active={activeTab === `game:${game.id}`}
                className="vs-tab"
              >
                {game.name.split(':')[0].split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Create post — quick links naar de juiste compose-flows */}
          <div className="vs-card mb-4">
            <div className="flex items-center gap-3">
              <Avatar
                url={profile.avatar_url}
                name={profile.display_name || profile.username}
                size="md"
                variant="gradient"
              />
              <Link
                href="/feed?compose=true"
                className="flex-1 bg-void/50 rounded-lg px-4 py-2.5 text-sm text-text-dim hover:text-text-muted transition-colors cursor-pointer"
              >
                Share something with the community...
              </Link>
            </div>
            <div className="flex gap-2 mt-3 ml-12">
              <Link href="/clips" className="vs-btn vs-btn-ghost text-xs px-3 py-1.5">
                <Upload size={13} /> Clip
              </Link>
              <Link href="/lfg" className="vs-btn vs-btn-ghost text-xs px-3 py-1.5">
                <Users size={13} /> LFG
              </Link>
            </div>
          </div>

          {/* Posts */}
          {posts.length === 0 ? (
            <EmptyState
              icon={Newspaper}
              title="No posts yet"
              description="Your feed is empty. Follow members or create the first post to get the signal flowing."
              cta={{ label: 'Create post', href: '/feed?compose=true' }}
            />
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="vs-card">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar
                      url={(post.profile as any)?.avatar_url}
                      name={(post.profile as any)?.display_name || (post.profile as any)?.username}
                      href={(post.profile as any)?.username ? `/profile/${(post.profile as any).username}` : undefined}
                      size="sm"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/profile/${(post.profile as any)?.username}`}
                          className="text-sm font-medium hover:text-purple transition-colors"
                        >
                          {(post.profile as any)?.display_name || (post.profile as any)?.username}
                        </Link>
                        {(post.profile as any)?.is_founding_member && (
                          <span className="vs-badge vs-badge-purple text-[9px]">Inner</span>
                        )}
                        {post.game && (
                          <span className="vs-badge vs-badge-purple text-[9px]">
                            {(post.game as any)?.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-dim">
                        {new Date(post.created_at).toLocaleDateString('en', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-text/80 mb-3 leading-relaxed">{post.content}</p>
                  {post.image_url && (
                    <div className="rounded-lg overflow-hidden mb-3 bg-surface-2">
                      <img src={post.image_url} alt="" className="w-full" />
                    </div>
                  )}
                  {post.video_url && (
                    <div className="rounded-lg overflow-hidden mb-3 bg-surface-2 aspect-video flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-cyan/15 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 14 14" fill="#00C8F0">
                          <polygon points="4,2 12,7 4,12"/>
                        </svg>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-6 text-xs text-text-dim">
                    <button className="hover:text-text-muted transition-colors">
                      {post.like_count} likes
                    </button>
                    <button className="hover:text-text-muted transition-colors">
                      {post.comment_count} comments
                    </button>
                    <button className="hover:text-text-muted transition-colors">Share</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Daily streak */}
          {profile && (
            <StreakWidget
              current={profile.streak_count ?? 0}
              best={profile.streak_best ?? 0}
              lastDate={profile.last_streak_date}
            />
          )}

          {/* Online friends */}
          {profile && <OnlineFriends userId={profile.id} />}

          {/* Recent activity */}
          {profile && <ActivityWidget userId={profile.id} />}

          {/* Your games */}
          <div className="vs-card">
            <div className="flex items-center justify-between mb-3">
              <p className="vs-label">YOUR GAMES</p>
              <Link href="/games" className="text-[10px] text-cyan hover:text-cyan/80 transition-colors tracking-wide">
                Manage →
              </Link>
            </div>
            {games.length === 0 ? (
              <Link
                href="/games"
                className="block text-xs text-text-dim hover:text-purple transition-colors py-2"
              >
                + Add games you play
              </Link>
            ) : (
              <div className="space-y-2">
                {games.map((game, i) => (
                  <div key={game.id} className="flex items-center justify-between">
                    <span className="text-sm">{game.name}</span>
                    {i === 0 && (
                      <span className="text-[9px] text-purple bg-purple/10 px-2 py-0.5 rounded">MAIN</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="vs-card">
            <p className="vs-label mb-3">QUICK ACTIONS</p>
            <div className="space-y-2">
              <Link href="/feed?compose=true" className="flex items-center gap-2 text-sm text-cyan hover:text-cyan/80 transition-colors">
                <Plus size={14} /> Create post
              </Link>
              <Link href="/clips/upload" className="flex items-center gap-2 text-sm text-cyan hover:text-cyan/80 transition-colors">
                <Upload size={14} /> Upload clip
              </Link>
              <Link href="/lfg" className="flex items-center gap-2 text-sm text-cyan hover:text-cyan/80 transition-colors">
                <Users size={14} /> Find teammates
              </Link>
            </div>
          </div>

          {/* XP breakdown */}
          <div className="vs-card">
            <p className="vs-label mb-3">XP EARNED BY</p>
            <div className="space-y-2 text-xs text-text-dim">
              <div className="flex justify-between"><span>Posts</span><span className="text-purple">+5 XP each</span></div>
              <div className="flex justify-between"><span>Comments</span><span className="text-purple">+2 XP each</span></div>
              <div className="flex justify-between"><span>Clips</span><span className="text-purple">+10 XP each</span></div>
              <div className="flex justify-between"><span>Daily login</span><span className="text-purple">+3 XP</span></div>
              <div className="flex justify-between"><span>Tournament</span><span className="text-purple">+25 XP</span></div>
              <div className="flex justify-between"><span>Tournament win</span><span className="text-purple">+100 XP</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
