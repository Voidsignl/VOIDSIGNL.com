'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import type { Clip, ClipComment, Game, Profile } from '@/types'
import {
  Film, Trophy, Heart, MessageCircle, Eye, Play, X, Upload,
  ChevronLeft, ChevronRight, Clock, Flame, Send, Trash2,
  CloudUpload, AlertCircle, Check
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Avatar } from '@/components/ui/avatar'
import { ScopeSpinner } from '@/components/ui/loader'
import { VideoPlayer } from '@/components/ui/video-player'
import { CLIP_LIMITS, readVideoMeta, extractThumbnail, validateClipFile } from '@/lib/video-utils'

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
  const [uploadGame, setUploadGame] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [uploadDuration, setUploadDuration] = useState<number | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

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

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      loadLikedClips(user.id)
    }
    loadGames()
    loadCOTW()
    loadClips()
    // Real-time: nieuwe clips + likes verschijnen direct
    if (!channelRef.current) {
      channelRef.current = supabase
        .channel('clips-feed')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clips' }, () => loadClips())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clip_likes' }, () => loadClips())
        .subscribe()
    }
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

  async function handleFileSelected(file: File) {
    setUploadError(null)
    const formatErr = validateClipFile(file)
    if (formatErr) {
      setUploadError(formatErr)
      return
    }
    try {
      const meta = await readVideoMeta(file)
      if (meta.durationSec > CLIP_LIMITS.maxDurationSec) {
        setUploadError(`Clip is ${meta.durationSec.toFixed(1)}s — max ${CLIP_LIMITS.maxDurationSec}s.`)
        return
      }
      setUploadFile(file)
      setUploadDuration(meta.durationSec)
      // Preview-URL voor lokale playback
      if (uploadPreview) URL.revokeObjectURL(uploadPreview)
      setUploadPreview(URL.createObjectURL(file))
    } catch (err) {
      setUploadError((err as Error).message)
    }
  }

  function resetUploadForm() {
    if (uploadPreview) URL.revokeObjectURL(uploadPreview)
    setUploadFile(null)
    setUploadPreview(null)
    setUploadDuration(null)
    setUploadProgress(0)
    setUploadError(null)
    setUploadTitle('')
    setUploadGame('')
    setUploadStep('form')
    setDragActive(false)
  }

  async function handleUpload() {
    if (!userId || !uploadTitle.trim() || !uploadFile) return
    setUploadStep('uploading')
    setUploadError(null)

    try {
      const fileExt = uploadFile.name.split('.').pop()?.toLowerCase() || 'mp4'
      const baseName = `${userId}/${crypto.randomUUID()}`
      const videoPath = `${baseName}.${fileExt}`

      // 1. Upload video
      setUploadProgress(15)
      const { error: vidErr } = await supabase.storage
        .from('clips-videos')
        .upload(videoPath, uploadFile, { contentType: uploadFile.type, upsert: false })
      if (vidErr) throw new Error(`Video upload mislukt: ${vidErr.message}`)
      setUploadProgress(60)

      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from('clips-videos')
        .getPublicUrl(videoPath)

      // 2. Genereer + upload thumbnail
      let thumbnailUrl: string | null = null
      try {
        const thumbBlob = await extractThumbnail(uploadFile, 2)
        const thumbPath = `${baseName}-thumb.jpg`
        const { error: thumbErr } = await supabase.storage
          .from('clips-videos')
          .upload(thumbPath, thumbBlob, { contentType: 'image/jpeg', upsert: false })
        if (!thumbErr) {
          thumbnailUrl = supabase.storage.from('clips-videos').getPublicUrl(thumbPath).data.publicUrl
        }
      } catch (e) {
        // Thumbnail-fout is niet kritiek — clip blijft uploaden zonder
        console.warn('Thumbnail extraction failed:', e)
      }
      setUploadProgress(90)

      // 3. Insert clip-record
      const { error: insertErr } = await supabase.from('clips').insert({
        user_id: userId,
        title: uploadTitle.trim(),
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        game_id: uploadGame || null,
        source_type: 'native',
      })
      if (insertErr) throw new Error(`Opslaan mislukt: ${insertErr.message}`)

      setUploadProgress(100)
      setUploadStep('done')
      setTimeout(() => {
        setShowUpload(false)
        resetUploadForm()
        loadClips()
        loadCOTW()
      }, 1200)
    } catch (err) {
      setUploadError((err as Error).message)
      setUploadStep('form')
      setUploadProgress(0)
    }
  }

  function handleDrop(e: React.DragEvent<HTMLElement>) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelected(file)
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
        <div className="relative overflow-hidden rounded-xl border border-purple/30 bg-gradient-to-br from-purple/10 via-surface to-surface vs-lit">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={16} className="text-purple" />
              <span className="vs-label text-purple-light">CLIP OF THE WEEK</span>
            </div>
            <div className="flex flex-col md:flex-row gap-5">
              {/* Thumbnail / embed */}
              <div
                className="relative w-full md:w-80 aspect-video rounded-lg overflow-hidden bg-void cursor-pointer group shrink-0"
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
                  <div className="w-12 h-12 rounded-full bg-purple/90 flex items-center justify-center shadow-[0_0_20px_rgba(107,63,224,0.6)]">
                    <Play size={20} fill="white" className="text-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3
                  className="text-lg font-medium mb-2 cursor-pointer hover:text-purple transition-colors"
                  onClick={() => openClipDetail(cotw)}
                >
                  {cotw.title}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <Avatar
                    url={cotw.profile?.avatar_url}
                    name={cotw.profile?.display_name || cotw.profile?.username}
                    href={cotw.profile?.username ? `/profile/${cotw.profile.username}` : undefined}
                    size="sm"
                    variant="gradient"
                    showInnerRing={cotw.profile?.is_founding_member}
                  />
                  <div className="flex flex-col text-xs">
                    <span className="font-medium text-text">{cotw.profile?.display_name || cotw.profile?.username || 'Unknown'}</span>
                    <span className="text-text-dim">@{cotw.profile?.username}</span>
                  </div>
                  {cotw.game && (
                    <span className="vs-badge vs-badge-purple ml-2">{cotw.game.name}</span>
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
        {/* Sort */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSort('recent')}
            data-active={sort === 'recent'}
            className="vs-tab text-xs"
          >
            <Clock size={12} /> Recent
          </button>
          <button
            onClick={() => setSort('popular')}
            data-active={sort === 'popular'}
            className="vs-tab text-xs"
          >
            <Flame size={12} /> Popular
          </button>
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Game filters */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setSelectedGame(null)}
            data-active={!selectedGame}
            className="vs-tab text-xs"
          >
            All Games
          </button>
          {games.map(game => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game.id)}
              data-active={selectedGame === game.id}
              className="vs-tab text-xs"
            >
              {game.name}
            </button>
          ))}
        </div>
      </div>

      {/* Clips Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><ScopeSpinner size={32} /></div>
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
              className="vs-card vs-lit group cursor-pointer hover:border-border-hover transition-all"
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
                  <div className="w-10 h-10 rounded-full bg-purple/90 flex items-center justify-center shadow-[0_0_18px_rgba(107,63,224,0.55)]">
                    <Play size={16} fill="white" className="text-white ml-0.5" />
                  </div>
                </div>
                {clip.is_cotw && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-purple/90 text-white text-[10px] px-2 py-0.5 rounded font-medium shadow-[0_0_10px_rgba(107,63,224,0.5)]">
                    <Trophy size={10} /> COTW
                  </div>
                )}
                {clip.game && (
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded font-medium">
                    {clip.game.name}
                  </div>
                )}
                <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded">
                  <Eye size={10} /> {clip.view_count}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-sm font-medium truncate mb-2 group-hover:text-purple transition-colors">
                {clip.title}
              </h3>

              {/* Author + meta */}
              <div className="flex items-center gap-2 text-xs">
                <Avatar
                  url={clip.profile?.avatar_url}
                  name={clip.profile?.display_name || clip.profile?.username}
                  size="xs"
                  variant="gradient"
                  showInnerRing={clip.profile?.is_founding_member}
                />
                <span className="font-medium text-text truncate flex-1">{clip.profile?.display_name || clip.profile?.username || 'Unknown'}</span>
                <span className="text-text-dim shrink-0">{timeAgo(clip.created_at)}</span>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-border/30 text-xs text-text-dim">
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
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => { if (uploadStep === 'form') { setShowUpload(false); resetUploadForm() } }}
        >
          <div className="bg-surface border border-border rounded-xl w-full max-w-md mx-4 animate-slide-up vs-lit max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Upload size={16} className="text-purple" /> Upload Clip
              </h3>
              <button
                onClick={() => { if (uploadStep === 'form') { setShowUpload(false); resetUploadForm() } }}
                disabled={uploadStep === 'uploading'}
                className="text-text-dim hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <X size={16} />
              </button>
            </div>

            {uploadStep === 'form' && (
              <div className="p-4 space-y-4">
                {/* Drop zone OR preview */}
                {!uploadFile ? (
                  <label
                    htmlFor="clip-file-input"
                    onDragOver={e => { e.preventDefault(); setDragActive(true) }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      dragActive
                        ? 'border-purple bg-purple/5'
                        : 'border-border hover:border-border-hover bg-void/30'
                    }`}
                  >
                    <input
                      id="clip-file-input"
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm"
                      onChange={e => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
                      className="hidden"
                    />
                    <CloudUpload size={32} className={`mx-auto mb-3 ${dragActive ? 'text-purple' : 'text-text-dim'}`} />
                    <p className="text-sm font-medium mb-1">
                      Drop your clip here or click to browse
                    </p>
                    <p className="text-[11px] text-text-dim">
                      MP4, MOV or WebM · max {CLIP_LIMITS.maxBytes / 1024 / 1024} MB · max {CLIP_LIMITS.maxDurationSec}s
                    </p>
                  </label>
                ) : (
                  <div className="space-y-2">
                    {uploadPreview && (
                      <div className="aspect-video rounded-lg overflow-hidden bg-black">
                        <video
                          src={uploadPreview}
                          controls
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-text-dim">
                      <span className="truncate flex-1">
                        {uploadFile.name} · {(uploadFile.size / 1024 / 1024).toFixed(1)} MB
                        {uploadDuration !== null && ` · ${uploadDuration.toFixed(1)}s`}
                      </span>
                      <button onClick={resetUploadForm} className="text-cyan hover:underline shrink-0 ml-2">
                        Change
                      </button>
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="flex items-start gap-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg p-2">
                    <AlertCircle size={13} className="mt-0.5 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

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
                  disabled={!uploadTitle.trim() || !uploadFile}
                  className="vs-btn vs-btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Upload size={14} /> Upload Clip
                </button>
              </div>
            )}

            {uploadStep === 'uploading' && (
              <div className="p-8 text-center space-y-4">
                <ScopeSpinner size={36} className="mx-auto" />
                <div>
                  <p className="text-sm text-text mb-2">Uploading clip…</p>
                  <div className="h-1.5 bg-void rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple to-cyan rounded-full transition-all shadow-[0_0_8px_rgba(107,63,224,0.5)]"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-text-dim mt-1.5">{uploadProgress}%</p>
                </div>
              </div>
            )}

            {uploadStep === 'done' && (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-success/20 border border-success/30 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(93,202,165,0.4)]">
                  <Check size={20} className="text-success" />
                </div>
                <p className="text-sm font-medium">Clip uploaded</p>
                <p className="text-xs text-text-dim mt-0.5">Live in the feed</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clip Detail Modal */}
      {activeClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setActiveClip(null)}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col animate-slide-up vs-lit" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0 gap-4">
              <div className="min-w-0 flex-1 flex items-center gap-3">
                <Avatar
                  url={activeClip.profile?.avatar_url}
                  name={activeClip.profile?.display_name || activeClip.profile?.username}
                  href={activeClip.profile?.username ? `/profile/${activeClip.profile.username}` : undefined}
                  size="md"
                  variant="gradient"
                  showInnerRing={activeClip.profile?.is_founding_member}
                />
                <div className="min-w-0">
                  <h3 className="text-sm font-medium truncate">{activeClip.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-text-dim mt-0.5">
                    <span className="truncate">@{activeClip.profile?.username}</span>
                    {activeClip.game && (
                      <span className="vs-badge vs-badge-purple text-[10px]">{activeClip.game.name}</span>
                    )}
                    <span className="text-border">·</span>
                    <span className="shrink-0">{timeAgo(activeClip.created_at)}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setActiveClip(null)} className="text-text-dim hover:text-text shrink-0">
                <X size={18} />
              </button>
            </div>

            {/* Video player — native voor onze uploads, iframe-fallback voor legacy externe URLs */}
            <div className="aspect-video bg-black shrink-0">
              {(activeClip as any).source_type === 'native' ? (
                <VideoPlayer
                  src={activeClip.video_url}
                  poster={activeClip.thumbnail_url}
                  autoPlay
                  className="w-full h-full"
                />
              ) : (
                <iframe
                  src={getVideoEmbed(activeClip.video_url)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
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
                  <ScopeSpinner size={22} className="mx-auto" />
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
