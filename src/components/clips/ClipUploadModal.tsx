'use client'

import { useState, useRef } from 'react'
import { X } from 'lucide-react'

interface Game {
  id: string
  name: string
}

interface ClipUploadModalProps {
  games: Game[]
  onClose: () => void
  onSuccess: () => void
}

type UploadMode = 'link' | 'upload'

export default function ClipUploadModal({ games, onClose, onSuccess }: ClipUploadModalProps) {
  const [mode, setMode] = useState<UploadMode>('link')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [gameId, setGameId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function detectSourceType(url: string): 'youtube' | 'twitch' | 'upload' {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
    if (url.includes('twitch.tv')) return 'twitch'
    return 'upload'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('Geef een titel op.'); return }

    setUploading(true)
    try {
      let finalUrl = videoUrl.trim()
      let sourceType: 'upload' | 'youtube' | 'twitch' = detectSourceType(finalUrl)

      if (mode === 'upload') {
        if (!file) { setError('Selecteer een bestand.'); setUploading(false); return }
        setProgress(10)
        const formData = new FormData()
        formData.append('file', file)
        const uploadRes = await fetch('/api/clips/upload', { method: 'POST', body: formData })
        const uploadJson = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadJson.error ?? 'Upload mislukt')
        finalUrl = uploadJson.url
        sourceType = 'upload'
        setProgress(60)
      }

      if (!finalUrl) { setError('Voeg een link of bestand toe.'); setUploading(false); return }

      const res = await fetch('/api/clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          video_url: finalUrl,
          game_id: gameId || undefined,
          source_type: sourceType,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Aanmaken mislukt')

      setProgress(100)
      onSuccess()
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Er ging iets mis.'
      setError(msg)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-void/95" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-surface border border-border rounded-2xl overflow-hidden">

        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-0.5">Clips</p>
            <h2 className="font-mono text-lg font-bold text-text">Clip toevoegen</h2>
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-text transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex gap-1 bg-void border border-border rounded-lg p-1">
            {(['link', 'upload'] as UploadMode[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-md font-mono text-xs uppercase tracking-wider transition-colors duration-200 ${
                  mode === m ? 'bg-purple text-white' : 'text-text-dim hover:text-text'
                }`}
              >
                {m === 'link' ? 'YouTube / Twitch link' : 'Bestand uploaden'}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Clip titel *"
            maxLength={100}
            required
            className="w-full bg-void border border-border rounded-lg px-4 py-3 text-text text-sm font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors"
          />

          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Beschrijving (optioneel)"
            maxLength={500}
            rows={2}
            className="w-full bg-void border border-border rounded-lg px-4 py-3 text-text text-sm font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors resize-none"
          />

          {mode === 'link' ? (
            <input
              type="url"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/... of https://twitch.tv/..."
              className="w-full bg-void border border-border rounded-lg px-4 py-3 text-text text-sm font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors"
            />
          ) : (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-border rounded-lg font-mono text-xs text-text-dim hover:border-purple hover:text-text transition-colors duration-200"
              >
                {file ? file.name : '↑ Klik om video te selecteren (max 100MB)'}
              </button>
            </div>
          )}

          <select
            value={gameId}
            onChange={e => setGameId(e.target.value)}
            className="w-full bg-void border border-border rounded-lg px-4 py-3 text-text text-sm font-mono focus:outline-none focus:border-purple transition-colors"
          >
            <option value="">Game selecteren (optioneel)</option>
            {games.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>

          {uploading && progress > 0 && (
            <div className="w-full h-1.5 bg-void rounded-full overflow-hidden">
              <div className="h-full bg-purple rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          )}

          {error && <p className="font-mono text-xs text-danger">{error}</p>}

          <button
            type="submit"
            disabled={uploading}
            className="w-full py-3 bg-purple text-white font-mono text-sm rounded-lg hover:bg-purple/85 transition-colors disabled:opacity-40"
          >
            {uploading ? 'Bezig...' : 'Clip plaatsen'}
          </button>
        </form>
      </div>
    </div>
  )
}
