'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import type { Clip, ClipComment, Game, Profile } from '@/types'
import {
  Film, Trophy, Heart, MessageCircle, Eye, Play, X, Upload,
  ChevronLeft, ChevronRight, Clock, Flame, Send, Trash2
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Avatar } from '@/components/ui/avatar'

type SortMode = 'recent' | 'popular'
type UploadStep = 'form' | 'uploading' | 'done'

export default function ClipsPage() {
  const supabase = createClient()
  const [clips, setClips] = useState<Clip[]>([])
  const [cotw, setCotw] = useState<Clip | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [sort, setSort] = useState<SortMode>('recent')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [likedClips, setLikedClips] = useState<Set<string>>(new Set())

  // Upload modal
  const [showUpload, setShowUpload] = useState(false)
  const [uploadStep, setUploadStep] = useState<UploadStep>('form')
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadUrl, setUploadUrl] = useState('')
  const [uploadGame, setUploadGame] = useState('')

  // Clip detail modal
  const [activeClip, setActiveClip] = useState<Clip | null>(null)
  const [clipComments, setClipComments] = useState<ClipComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    loadClips()
  }, [selectedGame, sort])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      loadLikedClips(user.id)
    }
    loadGames()
    loadCOTW()
    loadClips()
  }

  async function loadGames() {
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('is_approved', true)
      .order('name')
    if (data) setGames(data)
  }

  async function loadCOTW() {
    const { data } = await supabase
      .from('clips')
      .select('*, profile:profiles(*), game:games(*)')
      .eq('is_cotw', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data) setCotw(data as unknown as Clip)
  }

  async function loadClips() {
    setLoading(true)
    let query = supabase
      .from('clips')
      .select('*, profile:profiles(*), game:games(*)')

    if (selectedGame) {
      query = query.eq('game_id', selectedGame)
    }

    if (sort === 'popular') {
      query = query.order('like_count', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data } = await query.limit(50)
    if (data) setClips(data as unknown as Clip[])
    setLoading(false)
  }

  async function loadLikedClips(uid: string) {
    const { data } = await supabase
      .from('clip_likes')
      .select('clip_id')
      .eq('user_id', uid)
    if (data) {
      setLikedClips(new Set(data.map(l => l.clip_id)))
    }
  }

  async function toggleLike(clipId: string, e?: React.MouseEvent) {
    e?.stopPropagation()
    if (!userId) return

    const isLiked = likedClips.has(clipId)

    // Optimistic update
    const newLiked = new Set(likedClips)
    if (isLiked) {
      newLiked.delete(clipId)
    } else {
      newLiked.add(clipId)
    }
    setLikedClips(newLiked)

    // Update clips state
    setClips(prev => prev.map(c =>
      c.id === clipId ? { ...c, like_count: c.like_count + (isLiked ? -1 : 1) } : c
    ))
    if (cotw?.id === clipId) {
      setCotw(prev => prev ? { ...prev, like_count: prev.like_count + (isLiked ? -1 : 1) } : null)
    }
    if (activeClip?.id === clipId) {
      setActiveClip(prev => prev ? { ...prev, like_count: prev.like_count + (isLiked ? -1 : 1) } : null)
    }

    if (isLiked) {
      await supabase.from('clip_likes').delete().eq('user_id', userId).eq('clip_id', clipId)
    } else {
      await supabase.from('clip_likes').insert({ user_id: userId, clip_id: clipId })
    }
  }

  async function handleUpload() {
    if (!userId || !uploadTitle.trim() || !uploadUrl.trim()) return
    setUploadStep('uploading')

    const { error } = await supabase.from('clips').insert({
      user_id: userId,
      title: uploadTitle.trim(),
      video_url: uploadUrl.trim(),
      game_id: uploadGame || null,
    })

    if (!error) {
      setUploadStep('done')
      setTimeout(() => {
        setShowUpload(false)
        setUploadStep('form')
        setUploadTitle('')
        setUploadUrl('')
        setUploadGame('')
        loadClips()
      }, 1200)
    } else {
      setUploadStep('form')
    }
  }

  async function openClipDetail(clip: Clip) {
    setActiveClip(clip)
    setLoadingComments(true)

    // Increment view count
    await supabase
      .from('clips')
      .update({ view_count: (clip.view_count || 0) + 1 })
      .eq('id', clip.id)

    const { data } = await supabase
      .from('clip_comments')
      .select('*, profile:profiles(*)')
      .eq('clip_id', clip.id)
      .order('created_at', { ascending: true })

    if (data) setClipComments(data as unknown as ClipComment[])
    setLoadingComments(false)
  }

  async function postComment() {
    if (!userId || !activeClip || !newComment.trim()) return

    const { data, error } = await supabase
      .from('clip_comments')
      .insert({ clip_id: activeClip.id, user_id: userId, content: newComment.trim() })
      .select('*, profile:profiles(*)')
      .single()

    if (data && !error) {
      setClipComments(prev => [...prev, data as unknown as ClipComment])
      setNewComment('')
      setActiveClip(prev => prev ? { ...prev, comment_count: prev.comment_count + 1 } : null)
    }
  }

  async function deleteComment(commentId: string) {
    await supabase.from('clip_comments').delete().eq('id', commentId)
    setClipComments(prev => prev.filter(c => c.id !== commentId))
    setActiveClip(prev => prev ? { ...prev, comment_count: prev.comment_count - 1 } : null)
  }

  function getVideoEmbed(url: string) {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`
    // Twitch clips
    const twitchMatch = url.match(/clips\.twitch\.tv\/([a-zA-Z0-9_-]+)/)
    if (twitchMatch) return `https://clips.twitch.tv/embed?clip=${twitchMatch[1]}&parent=${window.location.hostname}`
    return url
  }

  function getVideoThumbnail(url: string) {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/)
    if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`
    return null
  }

  function timeAgo(date: string) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return new Date(date).toLocaleDateString()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-wide flex items-center gap-2">
            <Film size={20} className="text-purple" />
            Clips
          </h1>
          <p className="text-sm text-text-dim mt-0.5">Share your best moments</p>
        </div>
        {userId && (
          <button
            onClick={() => setShowUpload(true)}
            className="vs-btn vs-btn-primary text-sm"
          >
            <Upload size={15} /> Upload Clip
          </button>
        )}
      </div>

      {/* Clip of the Week */}
      {cotw && (
        <div className="relative overflow-hidden rounded-xl border border-purple/30 bg-gradient-to-br from-purple/10 via-surface to-surface">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple to-transparent" />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={16} className="text-purple" />
              <span className="vs-label text-purple-light">CLIP OF THE WEEK</span>
            </div>
            <div className="flex gap-5">
              {/* Thumbnail / embed */}
              <div
                className="relative w-80 aspect-video rounded-lg overflow-hidden bg-void cursor-pointer group shrink-0"
                onClick={() => openClipDetail(cotw)}
              >
                {cotw.thumbnail_url || getVideoThumbnail(cotw.video_url) ? (
                  <img
                    src={cotw.thumbnail_url || getVideoThumbnail(cotw.video_url)!}
                    alt={cotw.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-surface-2">
                    <Film size={32} className="text-text-dim" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-purple/90 flex items-center justify-center">
                    <Play size={20} fill="white" className="text-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3
                  className="text-lg font-medium mb-1 cursor-pointer hover:text-purple transition-colors"
                  onClick={() => openClipDetail(cotw)}
                >
                  {cotw.title}
                </h3>
                <div className="flex items-center gap-3 text-sm text-text-dim mb-3">
                  <span>{cotw.profile?.username || 'Unknown'}</span>
                  {cotw.game && (
                    <>
                      <span className="text-border">·</span>
                      <span className="vs-badge vs-badge-purple">{cotw.game.name}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-text-dim">
                  <button
                    onClick={(e) => toggleLike(cotw.id, e)}
                    className={`flex items-center gap-1.5 transition-colors ${
                      likedClips.has(cotw.id) ? 'text-danger' : 'hover:text-danger'
                    }`}
                  >
                    <Heart size={14} fill={likedClips.has(cotw.id) ? 'currentColor' : 'none'} />
                    {cotw.like_count}
                  </button>
                  <span className="flex items-center gap-1.5">
                    <MessageCircle size={14} /> {cotw.comment_count || 0}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye size={14} /> {cotw.view_count}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} /> {timeAgo(cotw.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Sort toggle */}
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

        <div className="h-4 w-px bg-border" />

        {/* Game filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedGame(null)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
              !selectedGame ? 'bg-cyan/15 text-cyan border border-cyan/30' : 'bg-surface border border-border text-text-dim hover:text-text-muted hover:border-border-hover'
            }`}
          >
            All Games
          </button>
          {games.map(game => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game.id)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                selectedGame === game.id
                  ? 'bg-cyan/15 text-cyan border border-cyan/30'
                  : 'bg-surface border border-border text-text-dim hover:text-text-muted hover:border-border-hover'
              }`}
            >
              {game.name}
            </button>
          ))}
        </div>
      </div>

      {/* Clips Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="vs-card animate-pulse">
              <div className="aspect-video bg-surface-2 rounded-lg mb-3" />
              <div className="h-4 bg-surface-2 rounded w-3/4 mb-2" />
              <div className="h-3 bg-surface-2 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : clips.length === 0 ? (
        <EmptyState
          icon={Film}
          title="No clips yet"
          description="Be the first to upload a clip and stake your claim."
          cta={userId ? { label: 'Upload clip', onClick: () => setShowUpload(true) } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clips.map((clip) => (
            <div
              key={clip.id}
              className="vs-card group cursor-pointer hover:border-border-hover transition-all"
              onClick={() => openClipDetail(clip)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video rounded-lg overflow-hidden bg-surface-2 mb-3">
                {clip.thumbnail_url || getVideoThumbnail(clip.video_url) ? (
                  <img
                    src={clip.thumbnail_url || getVideoThumbnail(clip.video_url)!}
                    alt={clip.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film size={24} className="text-text-dim" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-purple/90 flex items-center justify-center">
                    <Play size={16} fill="white" className="text-white ml-0.5" />
                  </div>
                </div>
                {clip.is_cotw && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-purple/90 text-white text-[10px] px-2 py-0.5 rounded font-medium">
                    <Trophy size={10} /> COTW
                  </div>
                )}
              </div>

              {/* Info */}
              <h3 className="text-sm font-medium truncate mb-1 group-hover:text-purple transition-colors">
                {clip.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-text-dim">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate">{clip.profile?.username || 'Unknown'}</span>
                  {clip.game && (
                    <>
                      <span className="text-border">·</span>
                      <span className="truncate">{clip.game.name}</span>
                    </>
                  )}
                </div>
                <span className="shrink-0 ml-2">{timeAgo(clip.created_at)}</span>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 mt-2 text-xs text-text-dim">
                <button
                  onClick={(e) => toggleLike(clip.id, e)}
                  className={`flex items-center gap-1 transition-colors ${
                    likedClips.has(clip.id) ? 'text-danger' : 'hover:text-danger'
                  }`}
                >
                  <Heart size={12} fill={likedClips.has(clip.id) ? 'currentColor' : 'none'} />
                  {clip.like_count}
                </button>
                <span className="flex items-center gap-1">
                  <MessageCircle size={12} /> {clip.comment_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={12} /> {clip.view_count}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowUpload(false)}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-md mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Upload size={16} className="text-purple" /> Upload Clip
              </h3>
              <button onClick={() => setShowUpload(false)} className="text-text-dim hover:text-text">
                <X size={16} />
              </button>
            </div>

            {uploadStep === 'form' && (
              <div className="p-4 space-y-4">
                <div>
                  <label className="vs-label block mb-1.5">TITLE</label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={e => setUploadTitle(e.target.value)}
                    placeholder="Epic 1v4 clutch..."
                    className="vs-input"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="vs-label block mb-1.5">VIDEO URL</label>
                  <input
                    type="url"
                    value={uploadUrl}
                    onChange={e => setUploadUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or Twitch clip URL"
                    className="vs-input"
                  />
                  <p className="text-[11px] text-text-dim mt-1">YouTube, Twitch clips, or direct video links</p>
                </div>
                <div>
                  <label className="vs-label block mb-1.5">GAME (OPTIONAL)</label>
                  <select
                    value={uploadGame}
                    onChange={e => setUploadGame(e.target.value)}
                    className="vs-input appearance-none"
                  >
                    <option value="">Select a game...</option>
                    {games.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleUpload}
                  disabled={!uploadTitle.trim() || !uploadUrl.trim()}
                  className="vs-btn vs-btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Upload Clip
                </button>
              </div>
            )}

            {uploadStep === 'uploading' && (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-purple border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-text-dim">Uploading clip...</p>
              </div>
            )}

            {uploadStep === 'done' && (
              <div className="p-8 text-center">
                <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
                  <Film size={18} className="text-success" />
                </div>
                <p className="text-sm font-medium">Clip uploaded!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clip Detail Modal */}
      {activeClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setActiveClip(null)}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <div className="min-w-0 flex-1 mr-4">
                <h3 className="text-sm font-medium truncate">{activeClip.title}</h3>
                <div className="flex items-center gap-2 text-xs text-text-dim mt-0.5">
                  <span>{activeClip.profile?.username}</span>
                  {activeClip.game && (
                    <>
                      <span className="text-border">·</span>
                      <span className="vs-badge vs-badge-purple text-[10px]">{activeClip.game.name}</span>
                    </>
                  )}
                  <span className="text-border">·</span>
                  <span>{timeAgo(activeClip.created_at)}</span>
                </div>
              </div>
              <button onClick={() => setActiveClip(null)} className="text-text-dim hover:text-text shrink-0">
                <X size={18} />
              </button>
            </div>

            {/* Video embed */}
            <div className="aspect-video bg-black shrink-0">
              <iframe
                src={getVideoEmbed(activeClip.video_url)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-4 px-4 py-3 border-b border-border text-sm text-text-dim shrink-0">
              <button
                onClick={() => toggleLike(activeClip.id)}
                className={`flex items-center gap-1.5 transition-colors ${
                  likedClips.has(activeClip.id) ? 'text-danger' : 'hover:text-danger'
                }`}
              >
                <Heart size={15} fill={likedClips.has(activeClip.id) ? 'currentColor' : 'none'} />
                {activeClip.like_count} {activeClip.like_count === 1 ? 'like' : 'likes'}
              </button>
              <span className="flex items-center gap-1.5">
                <Eye size={15} /> {activeClip.view_count} views
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle size={15} /> {activeClip.comment_count || 0} comments
              </span>
            </div>

            {/* Comments */}
            <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3">
              {loadingComments ? (
                <div className="text-center py-4">
                  <div className="w-5 h-5 border-2 border-purple border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : clipComments.length === 0 ? (
                <p className="text-sm text-text-dim text-center py-4">No comments yet. Be the first!</p>
              ) : (
                clipComments.map(comment => (
                  <div key={comment.id} className="flex gap-3 group">
                    <div className="mt-0.5">
                      <Avatar
                        url={(comment.profile as any)?.avatar_url}
                        name={comment.profile?.username}
                        size="sm"
                        variant="gradient"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{comment.profile?.username || 'Unknown'}</span>
                        <span className="text-[10px] text-text-dim">{timeAgo(comment.created_at)}</span>
                        {comment.user_id === userId && (
                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="opacity-0 group-hover:opacity-100 text-text-dim hover:text-danger transition-all ml-auto"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-text-muted mt-0.5">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment input */}
            {userId && (
              <div className="border-t border-border p-3 flex gap-2 shrink-0">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && postComment()}
                  placeholder="Write a comment..."
                  className="vs-input flex-1 text-sm"
                  maxLength={500}
                />
                <button
                  onClick={postComment}
                  disabled={!newComment.trim()}
                  className="vs-btn vs-btn-primary px-3 disabled:opacity-40"
                >
                  <Send size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
