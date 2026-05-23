'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import MessageBubble, { type ChatMessage } from '@/components/messages/MessageBubble'
import MessageComposer from '@/components/messages/MessageComposer'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface OtherUser {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  accent_color: string | null
  is_verified: boolean
  last_seen_at: string | null
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const username = (params?.username as string) ?? ''

  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [convStatus, setConvStatus] = useState<string>('accepted')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const initChat = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, accent_color, is_verified, last_seen_at')
        .eq('username', username)
        .maybeSingle()

      if (!profile) { router.push('/messages'); return }
      setOtherUser(profile as OtherUser)

      const res = await fetch('/api/messages/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      const json = await res.json()
      if (!json.conversation_id) return

      setConversationId(json.conversation_id)

      const msgRes = await fetch(`/api/messages/${json.conversation_id}`)
      const msgJson = await msgRes.json()
      setMessages(msgJson.data ?? [])

      const { data: conv } = await supabase
        .from('conversations')
        .select('status')
        .eq('id', json.conversation_id)
        .maybeSingle()
      setConvStatus(conv?.status ?? 'accepted')

    } finally {
      setLoading(false)
    }
  }, [username, supabase, router])

  useEffect(() => { initChat() }, [initChat])

  // Realtime
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, async (payload: { new: { sender_id: string; [k: string]: unknown } }) => {
        if (payload.new.sender_id === currentUserId) return

        const { data: sender } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, accent_color')
          .eq('id', payload.new.sender_id)
          .maybeSingle()

        setMessages(prev => [...prev, { ...(payload.new as unknown as ChatMessage), sender }])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId, currentUserId, supabase])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend(message: ChatMessage) {
    setMessages(prev => [...prev, message])
  }

  function showAvatar(index: number) {
    if (index === 0) return true
    const prev = messages[index - 1]
    const curr = messages[index]
    return (prev.sender?.id ?? prev.sender_id) !== (curr.sender?.id ?? curr.sender_id)
  }

  async function handleRequestAction(action: 'accept' | 'block') {
    if (!conversationId) return
    await fetch('/api/messages/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: conversationId, action }),
    })
    if (action === 'accept') {
      setConvStatus('accepted')
    } else {
      router.push('/messages')
    }
  }

  const isOnline = otherUser?.last_seen_at
    ? Date.now() - new Date(otherUser.last_seen_at).getTime() < 90000
    : false

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen max-w-2xl mx-auto">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-surface flex-shrink-0">
        <Link href="/messages" className="text-text-dim hover:text-text transition-colors">
          <ArrowLeft size={18} />
        </Link>

        {otherUser && (
          <>
            <Link href={`/profile/${otherUser.username}`} className="relative flex-shrink-0">
              <div className="relative w-9 h-9 rounded-full overflow-hidden bg-surface-2 border-2"
                style={{ borderColor: otherUser.accent_color ?? '#6B3FE0' }}>
                {otherUser.avatar_url ? (
                  <Image src={otherUser.avatar_url} alt={otherUser.username}
                    fill sizes="36px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-mono text-xs text-text-dim">
                      {otherUser.username?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface ${
                isOnline ? 'bg-success' : 'bg-border'
              }`} />
            </Link>

            <div className="flex-1 min-w-0">
              <Link href={`/profile/${otherUser.username}`}>
                <p className="font-mono text-sm font-bold text-text hover:text-purple transition-colors truncate">
                  {otherUser.display_name ?? otherUser.username}
                </p>
              </Link>
              <p className="font-mono text-[10px] text-text-dim">
                {isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="font-mono text-[10px] tracking-[0.2em] text-text-dim/60 uppercase mb-2">
              Begin
            </p>
            <p className="text-text-dim text-sm">
              Stuur een bericht naar {otherUser?.display_name ?? otherUser?.username}.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={(msg.sender?.id ?? msg.sender_id) === currentUserId}
                showAvatar={showAvatar(i)}
              />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {convStatus === 'pending' && otherUser && (
        <div className="px-4 py-3 bg-purple/10 border-t border-purple/30">
          <p className="text-text-dim text-xs text-center font-mono mb-2">
            Berichtverzoek van {otherUser.username}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleRequestAction('accept')}
              className="flex-1 py-2 bg-purple text-white font-mono text-xs rounded-lg hover:bg-purple/85 transition-colors"
            >
              Accepteren
            </button>
            <button
              onClick={() => handleRequestAction('block')}
              className="flex-1 py-2 border border-border text-text-dim font-mono text-xs rounded-lg hover:border-danger hover:text-danger transition-colors duration-200"
            >
              Weigeren
            </button>
          </div>
        </div>
      )}

      {conversationId && (
        <MessageComposer
          conversationId={conversationId}
          onSend={handleSend}
          disabled={convStatus === 'blocked'}
        />
      )}
    </div>
  )
}
