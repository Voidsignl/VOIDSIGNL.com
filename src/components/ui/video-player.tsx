'use client'

/**
 * VOIDSIGNL custom branded video-player.
 *
 * Native <video> element met eigen controls — geen YouTube/Twitch
 * branding pollution. Gebruikt voor clips uploaded naar onze Supabase
 * Storage. Externe URLs (legacy) krijgen iframe-fallback via een
 * separate code-pad.
 */
import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react'

interface VideoPlayerProps {
  src: string
  poster?: string | null
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  className?: string
  onPlay?: () => void
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function VideoPlayer({ src, poster, autoPlay = false, loop = false, muted = false, className = '', onPlay }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isMuted, setIsMuted] = useState(muted)
  const [volume, setVolume] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const handleTime = () => {
      setCurrentTime(video.currentTime)
      setProgress(video.duration ? (video.currentTime / video.duration) * 100 : 0)
    }
    const handleLoaded = () => setDuration(video.duration)
    const handleEnded = () => setPlaying(false)
    video.addEventListener('timeupdate', handleTime)
    video.addEventListener('loadedmetadata', handleLoaded)
    video.addEventListener('ended', handleEnded)
    return () => {
      video.removeEventListener('timeupdate', handleTime)
      video.removeEventListener('loadedmetadata', handleLoaded)
      video.removeEventListener('ended', handleEnded)
    }
  }, [])

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setPlaying(true)
      onPlay?.()
    } else {
      video.pause()
      setPlaying(false)
    }
  }

  function toggleMute() {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value)
    if (videoRef.current) {
      videoRef.current.volume = v
      videoRef.current.muted = v === 0
    }
    setVolume(v)
    setIsMuted(v === 0)
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const video = videoRef.current
    if (!video || !video.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    video.currentTime = pct * video.duration
  }

  function toggleFullscreen() {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  function showControlsTemp() {
    setShowControls(true)
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    if (playing) {
      hideTimeoutRef.current = setTimeout(() => setShowControls(false), 2500)
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-black overflow-hidden group ${className}`}
      onMouseMove={showControlsTemp}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster ?? undefined}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline
        className="w-full h-full object-contain"
        onClick={togglePlay}
      />

      {/* Center play overlay — alleen zichtbaar als niet aan het spelen */}
      {!playing && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group/play"
        >
          <div className="w-16 h-16 rounded-full bg-purple/90 flex items-center justify-center shadow-[0_0_40px_rgba(107,63,224,0.6)] group-hover/play:scale-110 transition-transform">
            <Play size={28} fill="white" className="text-white ml-1" />
          </div>
        </button>
      )}

      {/* Bottom controls — fade-out tijdens playback */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 pt-8 pb-2 transition-opacity ${
          showControls || !playing ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress scrubber */}
        <div
          onClick={handleSeek}
          className="relative h-1 bg-white/20 rounded-full cursor-pointer mb-2 group/scrubber"
        >
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple to-cyan rounded-full"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover/scrubber:opacity-100 transition-opacity shadow-lg"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        {/* Controls bar */}
        <div className="flex items-center gap-3 text-white">
          <button onClick={togglePlay} className="hover:text-cyan transition-colors">
            {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          </button>

          <div className="flex items-center gap-1.5 group/vol">
            <button onClick={toggleMute} className="hover:text-cyan transition-colors">
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-0 group-hover/vol:w-16 transition-colors duration-200 accent-purple"
            />
          </div>

          <span className="text-[10px] tabular-nums opacity-80" style={{ fontFamily: 'var(--font-display)' }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="ml-auto flex items-center gap-2">
            {/* VOIDSIGNL watermark */}
            <span
              className="text-[9px] tracking-[2.5px] opacity-50 hidden sm:inline"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              VOIDSIGNL
            </span>
            <button onClick={toggleFullscreen} className="hover:text-cyan transition-colors">
              {fullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
