'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

interface ProfileResult {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  accent_color: string | null
  level_name: string | null
}

interface NewConversationModalProps {
  open: boolean
  onClose: () => void
}

export default function NewConversationModal({ open, onClose }: NewConversationModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProfileResult[]>([])
  const [searching, setSearching] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) return
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null))
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [open, supabase])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
    }
  }, [open])

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, accent_color, level_name')
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .eq('is_onboarded', true)
        .limit(8)
      setResults(((data as ProfileResult[]) ?? []).filter((p) => p.id !== currentUserId))
    } finally {
      setSearching(false)
    }
  }, [supabase, currentUserId])

  function handleChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(value), 220)
  }

  function handlePick(username: string) {
    onClose()
    router.push(`/messages/${username}`)
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') onClose()
    if (e.key === 'Enter' && results[0]) handlePick(results[0].username)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24">
      <div className="absolute inset-0 bg-void/90 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-purple mb-0.5">
              Berichten
            </p>
            <h2 className="font-mono text-base font-bold text-text">Nieuw gesprek</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Sluiten"
            className="text-text-muted hover:text-text transition-colors duration-200 font-mono text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Zoek op gebruikersnaam..."
            className="w-full bg-void border border-border rounded-lg px-4 py-3 text-text text-sm font-mono placeholder-text-dim focus:outline-none focus:border-purple transition-[border-color] duration-200"
          />
        </div>

        <div className="max-h-80 overflow-y-auto">
          {searching && query && (
            <p className="px-5 py-6 text-center font-mono text-xs text-text-dim">Zoeken...</p>
          )}
          {!searching && query && results.length === 0 && (
            <p className="px-5 py-6 text-center font-mono text-xs text-text-dim">
              Geen gebruikers gevonden.
            </p>
          )}
          {!query && (
            <p className="px-5 py-6 text-center font-mono text-xs text-text-dim">
              Type een gebruikersnaam om te beginnen.
            </p>
          )}
          {results.map((u) => (
            <button
              key={u.id}
              onClick={() => handlePick(u.username)}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-surface-2 transition-colors duration-200 text-left border-t border-border first:border-t-0"
            >
              <div
                className="w-9 h-9 rounded-full overflow-hidden bg-surface-2 border-2 shrink-0"
                style={{ borderColor: u.accent_color ?? '#6B3FE0' }}
              >
                {u.avatar_url ? (
                  <Image
                    src={u.avatar_url}
                    alt={u.username}
                    width={36}
                    height={36}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-mono text-xs text-text-muted">
                      {u.username?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-bold text-text truncate">
                  {u.display_name ?? u.username}
                </p>
                <p className="font-mono text-[10px] text-text-muted truncate">
                  @{u.username}
                  {u.level_name && <> · {u.level_name}</>}
                </p>
              </div>
              <span className="font-mono text-[10px] text-purple shrink-0">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
