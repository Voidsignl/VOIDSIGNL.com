'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Image from 'next/image'

interface ChatUser {
  id: string
  username: string
  display_name?: string | null
  avatar_url?: string | null
  accent_color?: string | null
}

interface ChatMessage {
  id: string
  content: string
  created_at: string
  user_id: string
  user: ChatUser | null
}

interface ClanChatProps {
  clanSlug: string
  clanId: string
}

export default function ClanChat({ clanSlug, clanId }: ClanChatProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/clans/${clanSlug}/chat`)
    const json = await res.json()
    setMessages((json.data ?? []) as ChatMessage[])
  }, [clanSlug])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null))
    fetchMessages()
  }, [fetchMessages, supabase])

  useEffect(() => {
    const channel = supabase
      .channel(`clan-chat:${clanId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clan_messages',
          filter: `clan_id=eq.${clanId}`,
        },
        async (payload) => {
          const newRow = payload.new as { id: string; content: string; created_at: string; user_id: string }
          // Skip own messages — we already render them locally on POST
          if (newRow.user_id === currentUserId) return

          const { data: sender } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url, accent_color')
            .eq('id', newRow.user_id)
            .maybeSingle()

          setMessages((prev) => [
            ...prev,
            { ...newRow, user: (sender as ChatUser | null) ?? null },
          ])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [clanId, currentUserId, supabase])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/clans/${clanSlug}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input }),
      })
      const json = await res.json()
      if (json.data) {
        setMessages((prev) => [...prev, json.data as ChatMessage])
        setInput('')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-80 bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase">Clan Chat</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.map((msg) => {
          const isMine = msg.user?.id === currentUserId
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2 ${isMine ? 'flex-row-reverse' : ''}`}
            >
              <div
                className="w-7 h-7 rounded-full overflow-hidden bg-surface-2 flex-shrink-0 border"
                style={{ borderColor: msg.user?.accent_color ?? '#6B3FE0' }}
              >
                {msg.user?.avatar_url ? (
                  <Image
                    src={msg.user.avatar_url}
                    alt={msg.user.username}
                    width={28}
                    height={28}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[9px] font-mono text-text-dim">
                      {msg.user?.username?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div
                className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}
              >
                {!isMine && (
                  <span className="font-mono text-[9px] text-text-dim mb-0.5 ml-1">
                    {msg.user?.display_name ?? msg.user?.username}
                  </span>
                )}
                <div
                  className="px-3 py-2 rounded-xl text-xs leading-relaxed"
                  style={{
                    background: isMine ? msg.user?.accent_color ?? '#6B3FE0' : '#24242e',
                    color: '#fff',
                    borderBottomRightRadius: isMine ? '4px' : '12px',
                    borderBottomLeftRadius: isMine ? '12px' : '4px',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 px-3 py-3 border-t border-border">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Bericht..."
          maxLength={1000}
          className="flex-1 bg-void border border-border rounded-full px-4 py-2 text-text text-xs font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="w-8 h-8 bg-purple text-white rounded-full flex items-center justify-center hover:bg-purple/85 transition-colors disabled:opacity-40"
        >
          <span className="font-mono text-xs">↑</span>
        </button>
      </form>
    </div>
  )
}
