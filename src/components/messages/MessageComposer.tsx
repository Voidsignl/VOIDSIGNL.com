'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Smile, ImageIcon, Send } from 'lucide-react'
import type { ChatMessage } from './MessageBubble'

const TENOR_KEY = process.env.NEXT_PUBLIC_TENOR_API_KEY ?? ''

const STICKERS = [
  { id: 'void_scope', name: 'Scope' },
  { id: 'void_signal', name: 'Signal' },
  { id: 'void_gg', name: 'GG' },
  { id: 'void_ez', name: 'EZ' },
  { id: 'void_rip', name: 'RIP' },
  { id: 'void_clutch', name: 'Clutch' },
  { id: 'void_sus', name: 'Sus' },
  { id: 'void_bot', name: 'Bot' },
  { id: 'void_hype', name: 'Hype' },
  { id: 'void_silence', name: 'Silence' },
]

const EMOJIS = ['😂','😭','🔥','💀','👀','😤','🎮','⚡','👑','🎯',
                 '💪','🙏','😈','🤝','👏','💯','🫡','🤡','😮','🥶']

type MediaPanel = 'none' | 'emoji' | 'gif' | 'sticker'

interface TenorResult {
  id: string
  title: string
  media_formats?: {
    gif?: { url: string }
    tinygif?: { url: string }
  }
}

interface MessageComposerProps {
  conversationId: string
  onSend: (message: ChatMessage) => void
  disabled?: boolean
}

export default function MessageComposer({ conversationId, onSend, disabled }: MessageComposerProps) {
  const [text, setText] = useState('')
  const [panel, setPanel] = useState<MediaPanel>('none')
  const [gifSearch, setGifSearch] = useState('')
  const [gifs, setGifs] = useState<TenorResult[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (panel !== 'gif' || !TENOR_KEY) return
    const query = gifSearch.trim() || 'gaming'
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${TENOR_KEY}&limit=12&media_filter=gif`
        )
        const json = await res.json()
        setGifs(json.results ?? [])
      } catch { setGifs([]) }
    }, 300)
    return () => clearTimeout(t)
  }, [gifSearch, panel])

  async function sendMessage(payload: Record<string, unknown>) {
    setLoading(true)
    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.data) onSend(json.data as ChatMessage)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendText(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || loading) return
    await sendMessage({ content: text, message_type: 'text' })
    setText('')
  }

  async function handleImageUpload(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/messages/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (json.url) await sendMessage({ message_type: 'image', media_url: json.url, content: '' })
    } finally {
      setUploading(false)
    }
  }

  async function handleGif(gifUrl: string) {
    await sendMessage({ message_type: 'gif', gif_url: gifUrl, content: '' })
    setPanel('none')
  }

  async function handleSticker(stickerId: string) {
    await sendMessage({ message_type: 'sticker', sticker_id: stickerId, content: '' })
    setPanel('none')
  }

  function handleEmoji(emoji: string) {
    setText(prev => prev + emoji)
    setPanel('none')
    inputRef.current?.focus()
  }

  return (
    <div className="border-t border-border bg-surface">
      {panel !== 'none' && (
        <div className="border-b border-border max-h-48 overflow-y-auto">
          {panel === 'emoji' && (
            <div className="p-3 grid grid-cols-10 gap-1">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => handleEmoji(e)}
                  className="text-xl hover:bg-surface-2 rounded p-1 transition-colors">
                  {e}
                </button>
              ))}
            </div>
          )}

          {panel === 'gif' && (
            <div className="p-3">
              <input
                type="text"
                value={gifSearch}
                onChange={e => setGifSearch(e.target.value)}
                placeholder="Zoek GIFs..."
                className="w-full bg-void border border-border rounded-lg px-3 py-2 text-text text-xs font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple mb-2 transition-colors"
              />
              <div className="grid grid-cols-4 gap-1">
                {gifs.map(gif => {
                  const url = gif.media_formats?.gif?.url ?? gif.media_formats?.tinygif?.url
                  if (!url) return null
                  return (
                    <button key={gif.id} onClick={() => handleGif(url)}
                      className="rounded overflow-hidden hover:opacity-80 transition-opacity">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={gif.media_formats?.tinygif?.url ?? url}
                        alt={gif.title} className="w-full h-16 object-cover" />
                    </button>
                  )
                })}
                {gifs.length === 0 && (
                  <p className="col-span-4 text-center text-text-dim/60 font-mono text-xs py-4">
                    {TENOR_KEY ? 'Zoek een GIF...' : 'Tenor API key ontbreekt'}
                  </p>
                )}
              </div>
            </div>
          )}

          {panel === 'sticker' && (
            <div className="p-3 grid grid-cols-5 gap-2">
              {STICKERS.map(s => (
                <button key={s.id} onClick={() => handleSticker(s.id)}
                  className="flex flex-col items-center gap-1 hover:bg-surface-2 rounded-lg p-2 transition-colors">
                  <div className="relative w-10 h-10">
                    <Image src={`/stickers/${s.id.replace('void_', 'void-')}.svg`}
                      alt={s.name} fill sizes="40px" className="object-contain" />
                  </div>
                  <span className="font-mono text-[8px] text-text-dim">{s.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSendText} className="flex items-end gap-2 px-3 py-2.5">
        <div className="flex-1 flex items-center gap-1 bg-void border border-border rounded-full pl-2 pr-1 py-1 focus-within:border-purple transition-[border-color] duration-200">
          <button
            type="button"
            onClick={() => setPanel(p => p === 'emoji' ? 'none' : 'emoji')}
            className={`p-1.5 rounded-full transition-colors duration-200 ${
              panel === 'emoji' ? 'text-purple' : 'text-text-dim hover:text-text'
            }`}
            aria-label="Emoji"
          >
            <Smile size={16} />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={disabled ? 'Conversatie geblokkeerd' : 'Bericht'}
            disabled={disabled}
            className="flex-1 bg-transparent text-text text-sm placeholder-text-dim/60 focus:outline-none disabled:opacity-40 py-1.5"
          />
          <button
            type="button"
            onClick={() => setPanel(p => p === 'gif' ? 'none' : 'gif')}
            className={`px-2 py-1 rounded-full font-mono text-[10px] font-bold tracking-wider transition-colors duration-200 ${
              panel === 'gif' ? 'text-purple' : 'text-text-dim hover:text-text'
            }`}
            aria-label="GIF"
          >
            GIF
          </button>
          <button
            type="button"
            onClick={() => setPanel(p => p === 'sticker' ? 'none' : 'sticker')}
            className={`p-1.5 rounded-full transition-colors duration-200 ${
              panel === 'sticker' ? 'text-purple' : 'text-text-dim hover:text-text'
            }`}
            aria-label="Sticker"
          >
            <span className="text-[14px] leading-none">★</span>
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="p-1.5 rounded-full text-text-dim hover:text-text transition-colors duration-200 disabled:opacity-40"
            aria-label="Afbeelding"
          >
            {uploading ? '...' : <ImageIcon size={16} />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
            className="hidden"
          />
        </div>

        <button
          type="submit"
          disabled={!text.trim() || loading || disabled}
          className="w-10 h-10 bg-purple text-white rounded-full flex items-center justify-center hover:bg-purple/85 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-[0_2px_8px_rgba(107,63,224,0.35)]"
          aria-label="Verstuur"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
