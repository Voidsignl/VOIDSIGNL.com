'use client'

interface ClipPlayerProps {
  videoUrl: string
  sourceType: 'upload' | 'youtube' | 'twitch' | string
  title: string
}

function getYouTubeId(url: string) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{11})/)
  return match?.[1] ?? null
}

function getTwitchClipId(url: string) {
  const match = url.match(/twitch\.tv\/(?:\w+\/clip\/|clips\/)([^?]+)/)
  return match?.[1] ?? null
}

export default function ClipPlayer({ videoUrl, sourceType, title }: ClipPlayerProps) {
  if (sourceType === 'youtube') {
    const videoId = getYouTubeId(videoUrl)
    if (!videoId) {
      return (
        <div className="aspect-video bg-void rounded-xl flex items-center justify-center">
          <p className="text-text-dim font-mono text-xs">Ongeldige YouTube URL</p>
        </div>
      )
    }
    return (
      <div className="aspect-video rounded-xl overflow-hidden bg-void">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    )
  }

  if (sourceType === 'twitch') {
    const clipId = getTwitchClipId(videoUrl)
    if (!clipId) {
      return (
        <div className="aspect-video bg-void rounded-xl flex items-center justify-center">
          <p className="text-text-dim font-mono text-xs">Ongeldige Twitch URL</p>
        </div>
      )
    }
    const parent = typeof window !== 'undefined' ? window.location.hostname : 'voidsignl.vercel.app'
    return (
      <div className="aspect-video rounded-xl overflow-hidden bg-void">
        <iframe
          src={`https://clips.twitch.tv/embed?clip=${clipId}&parent=${parent}&autoplay=true`}
          title={title}
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    )
  }

  return (
    <div className="aspect-video rounded-xl overflow-hidden bg-void">
      <video src={videoUrl} controls autoPlay className="w-full h-full object-contain" title={title} />
    </div>
  )
}
