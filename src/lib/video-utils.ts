/**
 * Client-side video utilities voor de native upload-flow:
 * - duration meten zonder de file naar de server te sturen
 * - thumbnail genereren via canvas op een specifieke timestamp
 * - basis validatie (size + duration limits)
 */

export const CLIP_LIMITS = {
  maxBytes: 50 * 1024 * 1024, // 50 MB
  maxDurationSec: 60,
  acceptedTypes: ['video/mp4', 'video/quicktime', 'video/webm'],
} as const

export interface VideoMeta {
  durationSec: number
  width: number
  height: number
}

/**
 * Lees duration + dimensions uit een lokale video-file zonder upload.
 */
export function readVideoMeta(file: File): Promise<VideoMeta> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    video.onloadedmetadata = () => {
      const meta: VideoMeta = {
        durationSec: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      }
      URL.revokeObjectURL(url)
      resolve(meta)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read video metadata'))
    }
    video.src = url
  })
}

/**
 * Genereer thumbnail-frame uit een video-file via canvas.
 * Default seek-time = 2s (of 0 als video < 2s).
 */
export function extractThumbnail(file: File, seekSec = 2): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    video.crossOrigin = 'anonymous'

    video.onloadedmetadata = () => {
      const targetTime = Math.min(seekSec, Math.max(0, video.duration - 0.1))
      video.currentTime = targetTime
    }

    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      // Limit thumbnail size — 720p max width
      const maxW = 1280
      const scale = video.videoWidth > maxW ? maxW / video.videoWidth : 1
      canvas.width = Math.round(video.videoWidth * scale)
      canvas.height = Math.round(video.videoHeight * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('Canvas context unavailable'))
        return
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          if (!blob) reject(new Error('Thumbnail generation failed'))
          else resolve(blob)
        },
        'image/jpeg',
        0.85,
      )
    }

    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not load video for thumbnail'))
    }

    video.src = url
  })
}

/**
 * Valideer file vóór upload. Returnt error-message of null als OK.
 */
export function validateClipFile(file: File): string | null {
  if (!CLIP_LIMITS.acceptedTypes.includes(file.type as typeof CLIP_LIMITS.acceptedTypes[number])) {
    return `Format niet ondersteund. Gebruik MP4, MOV of WebM.`
  }
  if (file.size > CLIP_LIMITS.maxBytes) {
    const mb = (file.size / 1024 / 1024).toFixed(1)
    const max = CLIP_LIMITS.maxBytes / 1024 / 1024
    return `Bestand is ${mb} MB — max ${max} MB.`
  }
  return null
}
