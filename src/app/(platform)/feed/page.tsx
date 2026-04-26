'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import type { Post, Comment, Game, Profile } from '@/types'
import Link from 'next/link'
import {
  Newspaper, Heart, MessageCircle, Share2, Send, Trash2,
  Image, X, ChevronDown, ChevronUp, MoreHorizontal, Flag,
  Flame, Clock, Users, Globe, Bookmark, Pin
} from 'lucide-react'

type FeedTab = 'global' | 'following' | string // string = game_id
type SortMode = 'recent' | 'popular'

export default function FeedPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="text-text-dim text-sm animate-pulse">Loading feed...</div>
      </div>
    }>
      <FeedContent />
    </Suspense>
  )
}

function FeedContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const composerRef = useRef<HTMLTextAreaElement>(null)

  const [posts, setPosts] = useState<Post[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [userGames, setUserGames] = useState<Game[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Feed controls
  const [activeTab, setActiveTab] = useState<FeedTab>('global')
  const [sort, setSort] = useState<SortMode>('recent')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 20

  // Composer
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerText, setComposerText] = useState('')
  const [composerGame, setComposerGame] = useState('')
  const [composerImageUrl, setComposerImageUrl] = useState('')
  const [composerVideoUrl, setComposerVideoUrl] = useState('')
  const [posting, setPosting] = useState(false)

  // Likes
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())

  // Comments
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({})
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set())
  const [newComments, setNewComments] = useState<Record<string, string>>({})

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    setPosts([])
    setPage(0)
    setHasMore(true)
    loadPosts(0)
  }, [activeTab, sort])

  useEffect(() => {
    if (searchParams.get('compose') === 'true') {
      setComposerOpen(true)
      setTimeout(() => composerRef.current?.focus(), 200)
    }
  }, [searchParams])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      loadProfile(user.id)
      loadLikedPosts(user.id)
      loadUserGames(user.id)
    }
    loadGames()
    loadPosts(0)
  }

  async function loadProfile(uid: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    if (data) setProfile(data as Profile)
  }

  async function loadGames() {
    const { data } = await supabase.from('games').select('*').eq('is_approved', true).order('name')
    if (data) setGames(data)
  }

  async function loadUserGames(uid: string) {
    const { data } = await supabase
      .from('user_games')
      .select('game:games(*)')
      .eq('user_id', uid)
    if (data) setUserGames(data.map((ug: any) => ug.game).filter(Boolean))
  }

  async function loadPosts(pageNum: number) {
    if (pageNum === 0) setLoading(true)
    else setLoadingMore(true)

    let query = supabase
      .from('posts')
      .select('*, profile:profiles(*), game:games(*)')

    // Filter by tab
    if (activeTab === 'following' && userId) {
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)
      const followingIds = followingData?.map(f => f.following_id) || []
      if (followingIds.length > 0) {
        query = query.in('user_id', followingIds)
      } else {
        // No following = empty feed
        setPosts([])
        setHasMore(false)
        setLoading(false)
        setLoadingMore(false)
        return
      }
    } else if (activeTab !== 'global' && activeTab !== 'following') {
      // Game channel
      query = query.eq('game_id', activeTab)
    }

    // Sort
    if (sort === 'popular') {
      query = query.order('like_count', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Pagination
    query = query.range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

    const { data } = await query
    if (data) {
      const newPosts = data as unknown as Post[]
      if (pageNum === 0) {
        setPosts(newPosts)
      } else {
        setPosts(prev => [...prev, ...newPosts])
      }
      setHasMore(newPosts.length === PAGE_SIZE)
    }

    setLoading(false)
    setLoadingMore(false)
  }

  async function loadLikedPosts(uid: string) {
    const { data } = await supabase.from('likes').select('post_id').eq('user_id', uid)
    if (data) setLikedPosts(new Set(data.map(l => l.post_id)))
  }

  async function toggleLike(postId: string) {
    if (!userId) return
    const isLiked = likedPosts.has(postId)

    // Optimistic
    const newLiked = new Set(likedPosts)
    if (isLiked) newLiked.delete(postId)
    else newLiked.add(postId)
    setLikedPosts(newLiked)

    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, like_count: p.like_count + (isLiked ? -1 : 1) } : p
    ))

    if (isLiked) {
      await supabase.from('likes').delete().eq('user_id', userId).eq('post_id', postId)
    } else {
      await supabase.from('likes').insert({ user_id: userId, post_id: postId })
    }
  }

  async function toggleComments(postId: string) {
    const expanded = new Set(expandedComments)
    if (expanded.has(postId)) {
      expanded.delete(postId)
      setExpandedComments(expanded)
      return
    }

    expanded.add(postId)
    setExpandedComments(expanded)

    // Load comments if not cached
    if (!postComments[postId]) {
      setLoadingComments(prev => new Set(prev).add(postId))
      const { data } = await supabase
        .from('comments')
        .select('*, profile:profiles(*)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
      if (data) {
        setPostComments(prev => ({ ...prev, [postId]: data as unknown as Comment[] }))
      }
      setLoadingComments(prev => {
        const next = new Set(prev)
        next.delete(postId)
        return next
      })
    }
  }

  async function postComment(postId: string) {
    const text = newComments[postId]?.trim()
    if (!userId || !text) return

    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: userId, content: text })
      .select('*, profile:profiles(*)')
      .single()

    if (data && !error) {
      setPostComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), data as unknown as Comment]
      }))
      setNewComments(prev => ({ ...prev, [postId]: '' }))
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p
      ))
    }
  }

  async function deleteComment(postId: string, commentId: string) {
    await supabase.from('comments').delete().eq('id', commentId)
    setPostComments(prev => ({
      ...prev,
      [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
    }))
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comment_count: Math.max(0, p.comment_count - 1) } : p
    ))
  }

  async function createPost() {
    if (!userId || !composerText.trim()) return
    setPosting(true)

    const { error } = await supabase.from('posts').insert({
      user_id: userId,
      content: composerText.trim(),
      game_id: composerGame || null,
      image_url: composerImageUrl.trim() || null,
      video_url: composerVideoUrl.trim() || null,
    })

    if (!error) {
      setComposerText('')
      setComposerGame('')
      setComposerImageUrl('')
      setComposerVideoUrl('')
      setComposerOpen(false)
      // Reload feed
      setPosts([])
      setPage(0)
      loadPosts(0)
    }
    setPosting(false)
  }

  async function deletePost(postId: string) {
    await supabase.from('posts').delete().eq('id', postId)
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  function timeAgo(date: string) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })
  }

  function getVideoEmbed(url: string) {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
    return null
  }

  // Build tab list: Global, Following, then user's games, then divider + all games
  const tabList: { id: string; label: string; icon?: React.ReactNode }[] = [
    { id: 'global', label: 'Global', icon: <Globe size={13} /> },
    { id: 'following', label: 'Following', icon: <Users size={13} /> },
  ]

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-wide flex items-center gap-2">
            <Newspaper size={20} className="text-purple" />
            Feed
          </h1>
          <p className="text-sm text-text-dim mt-0.5">What&apos;s happening in the community</p>
        </div>
        <div className="flex items-center bg-surface rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setSort('recent')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
              sort === 'recent' ? 'bg-purple/15 text-purple' : 'text-text-dim hover:text-text-muted'
            }`}
          >
            <Clock size={12} /> Recent
          </button>
          <button
            onClick={() => setSort('popular')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
              sort === 'popular' ? 'bg-purple/15 text-purple' : 'text-text-dim hover:text-text-muted'
            }`}
          >
            <Flame size={12} /> Popular
          </button>
        </div>
      </div>

      {/* Channel tabs */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {tabList.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors shrink-0 ${
              activeTab === tab.id
                ? 'bg-cyan/15 text-cyan border border-cyan/30'
                : 'bg-surface border border-border text-text-dim hover:text-text-muted hover:border-border-hover'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}

        {/* User's games first */}
        {userGames.length > 0 && (
          <>
            <div className="w-px h-5 bg-border shrink-0" />
            {userGames.map(game => (
              <button
                key={game.id}
                onClick={() => setActiveTab(game.id)}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors shrink-0 ${
                  activeTab === game.id
                    ? 'bg-cyan/15 text-cyan border border-cyan/30'
                    : 'bg-surface border border-border text-text-dim hover:text-text-muted hover:border-border-hover'
                }`}
              >
                {game.name}
              </button>
            ))}
          </>
        )}

        {/* Remaining games not in user's list */}
        {games.filter(g => !userGames.find(ug => ug.id === g.id)).length > 0 && (
          <>
            <div className="w-px h-5 bg-border shrink-0" />
            {games
              .filter(g => !userGames.find(ug => ug.id === g.id))
              .map(game => (
                <button
                  key={game.id}
                  onClick={() => setActiveTab(game.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors shrink-0 ${
                    activeTab === game.id
                      ? 'bg-cyan/15 text-cyan border border-cyan/30'
                      : 'bg-surface border border-border text-text-dim hover:text-text-muted hover:border-border-hover'
                  }`}
                >
                  {game.name}
                </button>
              ))}
          </>
        )}
      </div>

      {/* Post Composer */}
      {userId && (
        <div className="vs-card mb-5">
          {!composerOpen ? (
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => { setComposerOpen(true); setTimeout(() => composerRef.current?.focus(), 100) }}
            >
              <div className="w-9 h-9 rounded-full bg-purple flex items-center justify-center text-sm font-medium text-white shrink-0">
                {profile?.display_name?.[0]?.toUpperCase() || profile?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 bg-void/50 rounded-lg px-4 py-2.5 text-sm text-text-dim hover:text-text-muted transition-colors">
                Share something with the community...
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-purple flex items-center justify-center text-sm font-medium text-white shrink-0 mt-1">
                  {profile?.display_name?.[0]?.toUpperCase() || profile?.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <textarea
                    ref={composerRef}
                    value={composerText}
                    onChange={e => setComposerText(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full bg-transparent text-sm text-text resize-none outline-none min-h-[80px] placeholder:text-text-dim"
                    maxLength={2000}
                  />

                  {/* Image URL preview */}
                  {composerImageUrl && (
                    <div className="relative mt-2 rounded-lg overflow-hidden bg-surface-2 border border-border">
                      <img src={composerImageUrl} alt="Preview" className="w-full max-h-48 object-cover" onError={() => {}} />
                      <button
                        onClick={() => setComposerImageUrl('')}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-void/80 flex items-center justify-center text-text-dim hover:text-text"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}

                  {/* Video URL preview */}
                  {composerVideoUrl && (
                    <div className="relative mt-2 rounded-lg overflow-hidden bg-surface-2 border border-border">
                      <div className="aspect-video bg-void flex items-center justify-center">
                        {getVideoEmbed(composerVideoUrl) ? (
                          <iframe src={getVideoEmbed(composerVideoUrl)!} className="w-full h-full" allowFullScreen />
                        ) : (
                          <p className="text-xs text-text-dim">Video: {composerVideoUrl}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setComposerVideoUrl('')}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-void/80 flex items-center justify-center text-text-dim hover:text-text"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Composer toolbar */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border ml-12">
                <div className="flex items-center gap-2">
                  {/* Image URL toggle */}
                  {!composerImageUrl && !composerVideoUrl && (
                    <button
                      onClick={() => {
                        const url = prompt('Image URL:')
                        if (url) setComposerImageUrl(url)
                      }}
                      className="vs-btn vs-btn-ghost text-xs px-2.5 py-1.5"
                    >
                      <Image size={13} /> Image
                    </button>
                  )}

                  {/* Video URL toggle */}
                  {!composerVideoUrl && !composerImageUrl && (
                    <button
                      onClick={() => {
                        const url = prompt('Video URL (YouTube):')
                        if (url) setComposerVideoUrl(url)
                      }}
                      className="vs-btn vs-btn-ghost text-xs px-2.5 py-1.5"
                    >
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="1" y="2.5" width="9" height="9" rx="1.5" />
                        <path d="M10 5.5l3-1.5v6l-3-1.5" />
                      </svg>
                      Video
                    </button>
                  )}

                  {/* Game select */}
                  <select
                    value={composerGame}
                    onChange={e => setComposerGame(e.target.value)}
                    className="bg-surface border border-border rounded-lg text-xs text-text-dim px-2.5 py-1.5 outline-none appearance-none cursor-pointer hover:border-border-hover transition-colors"
                  >
                    <option value="">No game tag</option>
                    {(userGames.length > 0 ? userGames : games).map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-dim">{composerText.length}/2000</span>
                  <button
                    onClick={() => { setComposerOpen(false); setComposerText(''); setComposerImageUrl(''); setComposerVideoUrl(''); setComposerGame('') }}
                    className="text-xs text-text-dim hover:text-text transition-colors px-2 py-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createPost}
                    disabled={!composerText.trim() || posting}
                    className="vs-btn vs-btn-primary text-xs px-4 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {posting ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Post'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Posts */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="vs-card animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-surface-2" />
                <div className="flex-1">
                  <div className="h-3.5 bg-surface-2 rounded w-28 mb-1.5" />
                  <div className="h-2.5 bg-surface-2 rounded w-16" />
                </div>
              </div>
              <div className="h-4 bg-surface-2 rounded w-full mb-2" />
              <div className="h-4 bg-surface-2 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="vs-card text-center py-16">
          <Newspaper size={36} className="mx-auto text-text-dim mb-3 opacity-40" />
          <p className="text-text-dim text-sm">
            {activeTab === 'following'
              ? 'No posts from people you follow yet'
              : activeTab === 'global'
                ? 'No posts yet — be the first!'
                : 'No posts in this channel yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => {
            const postProfile = post.profile as any
            const postGame = post.game as any
            const isOwn = post.user_id === userId
            const isLiked = likedPosts.has(post.id)
            const commentsExpanded = expandedComments.has(post.id)
            const comments = postComments[post.id] || []
            const isLoadingComments = loadingComments.has(post.id)

            return (
              <div key={post.id} className="vs-card group/post">
                {/* Post header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-purple/30 flex items-center justify-center text-xs font-medium text-purple shrink-0">
                    {postProfile?.display_name?.[0]?.toUpperCase() || postProfile?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/profile/${postProfile?.username}`}
                        className="text-sm font-medium hover:text-purple transition-colors"
                      >
                        {postProfile?.display_name || postProfile?.username || 'Unknown'}
                      </Link>
                      {postProfile?.is_founding_member && (
                        <span className="vs-badge vs-badge-purple text-[9px]">Inner</span>
                      )}
                      {postProfile?.level_name && postProfile.level_name !== 'Recruit' && (
                        <span className="text-[10px] text-text-dim">{postProfile.level_name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-dim">
                      <span>{timeAgo(post.created_at)}</span>
                      {postGame && (
                        <>
                          <span className="text-border">·</span>
                          <span className="vs-badge vs-badge-purple text-[9px]">{postGame.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Post menu */}
                  {isOwn && (
                    <button
                      onClick={() => {
                        if (confirm('Delete this post?')) deletePost(post.id)
                      }}
                      className="opacity-0 group-hover/post:opacity-100 text-text-dim hover:text-danger transition-all p-1"
                      title="Delete post"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Content */}
                <p className="text-sm text-text/85 leading-relaxed mb-3 whitespace-pre-wrap break-words">
                  {post.content}
                </p>

                {/* Image */}
                {post.image_url && (
                  <div className="rounded-lg overflow-hidden mb-3 bg-surface-2 border border-border">
                    <img src={post.image_url} alt="" className="w-full max-h-[400px] object-cover" />
                  </div>
                )}

                {/* Video embed */}
                {post.video_url && (
                  <div className="rounded-lg overflow-hidden mb-3 bg-surface-2 border border-border aspect-video">
                    {getVideoEmbed(post.video_url) ? (
                      <iframe
                        src={getVideoEmbed(post.video_url)!}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <a href={post.video_url} target="_blank" rel="noopener noreferrer" className="text-cyan text-sm hover:underline">
                          Open video
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Action bar */}
                <div className="flex items-center gap-1 pt-1">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      isLiked
                        ? 'text-danger bg-danger/10'
                        : 'text-text-dim hover:bg-surface-2 hover:text-text-muted'
                    }`}
                  >
                    <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
                    {post.like_count > 0 && post.like_count}
                  </button>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      commentsExpanded
                        ? 'text-cyan bg-cyan/10'
                        : 'text-text-dim hover:bg-surface-2 hover:text-text-muted'
                    }`}
                  >
                    <MessageCircle size={14} />
                    {post.comment_count > 0 && post.comment_count}
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(`${window.location.origin}/feed?post=${post.id}`)
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-dim hover:bg-surface-2 hover:text-text-muted transition-colors"
                  >
                    <Share2 size={14} />
                  </button>
                </div>

                {/* Comments section */}
                {commentsExpanded && (
                  <div className="mt-3 pt-3 border-t border-border">
                    {isLoadingComments ? (
                      <div className="flex justify-center py-3">
                        <div className="w-4 h-4 border-2 border-purple border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : comments.length === 0 ? (
                      <p className="text-xs text-text-dim text-center py-2">No comments yet</p>
                    ) : (
                      <div className="space-y-3 mb-3">
                        {comments.map(comment => {
                          const commentProfile = comment.profile as any
                          return (
                            <div key={comment.id} className="flex gap-2.5 group/comment">
                              <div className="w-6 h-6 rounded-full bg-purple/20 flex items-center justify-center text-[9px] text-purple font-medium shrink-0 mt-0.5">
                                {commentProfile?.username?.[0]?.toUpperCase() || '?'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium">{commentProfile?.username || 'Unknown'}</span>
                                  <span className="text-[10px] text-text-dim">{timeAgo(comment.created_at)}</span>
                                  {comment.user_id === userId && (
                                    <button
                                      onClick={() => deleteComment(post.id, comment.id)}
                                      className="opacity-0 group-hover/comment:opacity-100 text-text-dim hover:text-danger transition-all ml-auto"
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                  )}
                                </div>
                                <p className="text-sm text-text-muted mt-0.5 break-words">{comment.content}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Comment input */}
                    {userId && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newComments[post.id] || ''}
                          onChange={e => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && postComment(post.id)}
                          placeholder="Write a comment..."
                          className="vs-input flex-1 text-xs py-2"
                          maxLength={500}
                        />
                        <button
                          onClick={() => postComment(post.id)}
                          disabled={!(newComments[post.id]?.trim())}
                          className="vs-btn vs-btn-primary px-2.5 py-2 disabled:opacity-40"
                        >
                          <Send size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Load more */}
          {hasMore && (
            <div className="text-center pt-2 pb-4">
              <button
                onClick={() => {
                  const nextPage = page + 1
                  setPage(nextPage)
                  loadPosts(nextPage)
                }}
                disabled={loadingMore}
                className="vs-btn vs-btn-ghost text-xs"
              >
                {loadingMore ? (
                  <div className="w-3.5 h-3.5 border-2 border-text-dim border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Load more'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
