'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import type { Profile } from '@/types'
import {
  MessageCircle, Send, Search, ArrowLeft, Plus, Check, CheckCheck,
  User, X, MoreHorizontal, Users,
} from 'lucide-react'
import { ScopeSpinner } from '@/components/ui/loader'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { Sheet } from '@/components/ui/sheet'

interface Conversation {
  id: string
  user_a: string | null
  user_b: string | null
  last_message_at: string
  is_group: boolean
  name: string | null
  creator_id: string | null
  /** For 1-to-1: the other user. For groups: undefined. */
  other_user?: Profile
  /** For groups: list of member profiles. */
  members?: Profile[]
  last_message?: string
  unread_count?: number
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
}

export default function MessagesPage() {
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)

  // New conversation modal
  const [showNewConv, setShowNewConv] = useState(false)
  const [searchUsers, setSearchUsers] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)

  // Search conversations
  const [convSearch, setConvSearch] = useState('')

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv.id)
      markAsRead(activeConv.id)
    }
  }, [activeConv?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime: subscribe to new messages in the active conversation.
  useEffect(() => {
    if (!activeConv) return
    const chan = supabase
      .channel(`msgs:${activeConv.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConv.id}` },
        () => {
          loadMessages(activeConv.id)
          // Auto-mark as read if a peer message comes in while window is open
          if (userId) markAsRead(activeConv.id)
        },
      )
      .subscribe()
    return () => { void supabase.removeChannel(chan) }
  }, [activeConv?.id, userId])

  // Realtime: subscribe to all message changes affecting this user's
  // conversations so the conv-list reorders/badges update without polling.
  useEffect(() => {
    if (!userId) return
    const chan = supabase
      .channel(`conv-list:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => loadConversations(userId),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => loadConversations(userId),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversation_participants', filter: `user_id=eq.${userId}` },
        () => loadConversations(userId),
      )
      .subscribe()
    return () => { void supabase.removeChannel(chan) }
  }, [userId])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    await loadConversations(user.id)
    setLoading(false)
  }

  async function loadConversations(uid: string) {
    // 1-to-1 convs where I am user_a/user_b
    const { data: dmConvs } = await supabase
      .from('conversations')
      .select('*')
      .eq('is_group', false)
      .or(`user_a.eq.${uid},user_b.eq.${uid}`)

    // Group convs where I'm an active participant
    const { data: groupParticipations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', uid)
      .is('left_at', null)

    const groupIds = (groupParticipations || []).map(p => p.conversation_id)
    let groupConvs: Conversation[] = []
    if (groupIds.length > 0) {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .in('id', groupIds)
        .eq('is_group', true)
      groupConvs = (data as Conversation[]) || []
    }

    const allConvs: Conversation[] = [...((dmConvs as Conversation[]) || []), ...groupConvs]

    // Sort by last_message_at desc
    allConvs.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())

    // Enrich each
    const enriched = await Promise.all(allConvs.map(async (conv) => {
      const [msgRes, unreadRes] = await Promise.all([
        supabase.from('messages').select('content').eq('conversation_id', conv.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('conversation_id', conv.id).eq('is_read', false).neq('sender_id', uid),
      ])

      let other_user: Profile | undefined
      let members: Profile[] | undefined

      if (conv.is_group) {
        // Load active group members
        const { data: parts } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conv.id)
          .is('left_at', null)
        const memberIds = (parts || []).map(p => p.user_id)
        if (memberIds.length > 0) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('*')
            .in('id', memberIds)
          members = (profs as Profile[]) || []
        }
      } else {
        const otherId = conv.user_a === uid ? conv.user_b : conv.user_a
        if (otherId) {
          const { data } = await supabase.from('profiles').select('*').eq('id', otherId).maybeSingle()
          other_user = (data as Profile) || undefined
        }
      }

      return {
        ...conv,
        other_user,
        members,
        last_message: msgRes.data?.content,
        unread_count: unreadRes.count || 0,
      } as Conversation
    }))

    setConversations(enriched)
  }

  async function loadMessages(convId: string) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(200)

    if (data) setMessages(data as Message[])
  }

  async function markAsRead(convId: string) {
    if (!userId) return
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', convId)
      .eq('is_read', false)
      .neq('sender_id', userId)

    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, unread_count: 0 } : c
    ))
  }

  async function sendMessage() {
    if (!userId || !activeConv || !newMessage.trim()) return
    setSending(true)

    const content = newMessage.trim()
    setNewMessage('')

    // Optimistic add
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConv.id,
      sender_id: userId,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: activeConv.id,
        sender_id: userId,
        content,
      })
      .select()
      .single()

    if (data && !error) {
      // Replace optimistic with real
      setMessages(prev => prev.map(m => m.id === optimistic.id ? data as Message : m))
      // Update conversation last message
      setConversations(prev => prev.map(c =>
        c.id === activeConv.id ? { ...c, last_message: content, last_message_at: new Date().toISOString() } : c
      ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()))
    }

    setSending(false)
    inputRef.current?.focus()
  }

  async function searchForUsers(query: string) {
    setSearchUsers(query)
    if (query.length < 2) { setSearchResults([]); return }

    setSearchingUsers(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', userId)
      .eq('is_onboarded', true)
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(10)

    if (data) setSearchResults(data as Profile[])
    setSearchingUsers(false)
  }

  async function startConversation(otherUser: Profile) {
    if (!userId) return

    const { data: convId } = await supabase.rpc('get_or_create_conversation', {
      user_1: userId,
      user_2: otherUser.id,
    })

    if (convId) {
      // Check if already in list
      let conv = conversations.find(c => c.id === convId)
      if (!conv) {
        conv = {
          id: convId,
          user_a: userId < otherUser.id ? userId : otherUser.id,
          user_b: userId < otherUser.id ? otherUser.id : userId,
          last_message_at: new Date().toISOString(),
          is_group: false,
          name: null,
          creator_id: null,
          other_user: otherUser,
          unread_count: 0,
        }
        setConversations(prev => [conv!, ...prev])
      }
      setActiveConv(conv)
      setShowNewConv(false)
      setSearchUsers('')
      setSearchResults([])
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }

  function timeAgo(date: string) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`
    return new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })
  }

  function formatMessageTime(date: string) {
    return new Date(date).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  }

  function isNewDay(current: string, previous?: string) {
    if (!previous) return true
    return new Date(current).toDateString() !== new Date(previous).toDateString()
  }

  function formatDate(date: string) {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  const filteredConvs = convSearch
    ? conversations.filter(c => {
        const q = convSearch.toLowerCase()
        if (c.is_group) {
          return (c.name || '').toLowerCase().includes(q) ||
                 (c.members || []).some(m => m.username.toLowerCase().includes(q) || (m.display_name || '').toLowerCase().includes(q))
        }
        return (c.other_user?.username || '').toLowerCase().includes(q) ||
               (c.other_user?.display_name || '').toLowerCase().includes(q)
      })
    : conversations

  function convDisplayName(c: Conversation): string {
    if (c.is_group) {
      return c.name || `Squad · ${(c.members || []).length} members`
    }
    return c.other_user?.display_name || c.other_user?.username || 'Unknown'
  }

  function convSubtitle(c: Conversation): string {
    if (c.is_group) {
      const memberCount = (c.members || []).length
      return `${memberCount} member${memberCount === 1 ? '' : 's'}`
    }
    return `@${c.other_user?.username || ''}`
  }

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <ScopeSpinner size={28} />
      </div>
    )
  }

  return (
    <div className="flex -m-4 md:-m-6 h-[calc(100dvh-52px-4rem-env(safe-area-inset-bottom))] md:h-[calc(100dvh-52px)]">
      {/* Conversation list */}
      <div className={`w-full md:w-80 border-r border-border flex flex-col shrink-0 bg-[#12121a] ${activeConv ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <MessageCircle size={16} className="text-purple" />
              Messages
              {totalUnread > 0 && (
                <span className="vs-counter px-1.5 h-[18px] min-w-[20px] rounded-full bg-danger text-white text-[10px] flex items-center justify-center font-medium tabular-nums">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </h2>
            <button
              onClick={() => setShowNewConv(true)}
              className="w-7 h-7 rounded-lg bg-purple/15 text-purple flex items-center justify-center hover:bg-purple/25 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              value={convSearch}
              onChange={e => setConvSearch(e.target.value)}
              placeholder="Search conversations..."
              className="vs-input text-xs pl-8 py-1.5"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConvs.length === 0 ? (
            <div className="px-3 py-6">
              <EmptyState
                icon={MessageCircle}
                title={convSearch ? 'No conversations found' : 'No messages yet'}
                description={convSearch ? 'Try a different search.' : 'Start chatting with squad members.'}
                size="sm"
                cta={!convSearch ? { label: 'Start conversation', onClick: () => setShowNewConv(true) } : undefined}
              />
            </div>
          ) : (
            filteredConvs.map(conv => {
              const isActive = activeConv?.id === conv.id
              const hasUnread = (conv.unread_count || 0) > 0

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={`relative w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-border/50 ${
                    isActive ? 'bg-purple/10' : 'hover:bg-surface'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r bg-gradient-to-b from-purple to-cyan" />
                  )}
                  <div className="relative shrink-0">
                    {conv.is_group ? (
                      // Stacked avatars for group: show first 2 members
                      <div className="relative w-10 h-10">
                        {(conv.members || []).slice(0, 2).map((m, idx) => (
                          <div
                            key={m.id}
                            className={`absolute ${idx === 0 ? 'top-0 left-0' : 'bottom-0 right-0'}`}
                          >
                            <Avatar
                              url={m.avatar_url}
                              name={m.display_name || m.username}
                              size="xs"
                              shape="rounded"
                              variant="gradient"
                            />
                          </div>
                        ))}
                        {/* Members count badge */}
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-purple text-white text-[8px] flex items-center justify-center font-medium tabular-nums border border-[#12121a]">
                          {(conv.members || []).length}
                        </span>
                      </div>
                    ) : (
                      <Avatar
                        url={conv.other_user?.avatar_url}
                        name={conv.other_user?.display_name || conv.other_user?.username}
                        size="md"
                        shape="rounded"
                        variant="gradient"
                        showInnerRing={(conv.other_user as any)?.is_founding_member}
                        online={!!(conv.other_user as any)?.last_seen_at && Date.now() - new Date((conv.other_user as any).last_seen_at).getTime() < 5 * 60 * 1000}
                      />
                    )}
                    {hasUnread && (
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-danger border-2 border-[#12121a]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate flex items-center gap-1.5 ${hasUnread ? 'font-semibold' : 'font-medium'}`}>
                        {conv.is_group && <Users size={11} className="text-purple-light shrink-0" />}
                        {convDisplayName(conv)}
                      </span>
                      <span className="vs-counter text-[9px] text-text-dim shrink-0 tabular-nums">{timeAgo(conv.last_message_at)}</span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-text-muted font-medium' : 'text-text-dim'}`}>
                      {conv.last_message || 'No messages yet'}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat view */}
      <div className={`flex-1 flex flex-col ${!activeConv ? 'hidden md:flex' : 'flex'}`}>
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="max-w-xs w-full">
              <EmptyState
                icon={MessageCircle}
                title="Select a conversation"
                description="Pick a chat from the list, or start a new one."
                cta={{ label: 'New message', onClick: () => setShowNewConv(true) }}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="h-14 border-b border-border flex items-center gap-3 px-4 shrink-0">
              <button
                onClick={() => setActiveConv(null)}
                className="md:hidden text-text-dim hover:text-text"
              >
                <ArrowLeft size={18} />
              </button>
              {activeConv.is_group ? (
                <>
                  <div className="flex -space-x-2 shrink-0">
                    {(activeConv.members || []).slice(0, 3).map(m => (
                      <Avatar
                        key={m.id}
                        url={m.avatar_url}
                        name={m.display_name || m.username}
                        size="xs"
                        shape="rounded"
                        variant="gradient"
                      />
                    ))}
                    {(activeConv.members || []).length > 3 && (
                      <div className="w-6 h-6 rounded-md bg-surface-2 border border-border flex items-center justify-center vs-counter text-[8px] tabular-nums text-text-muted">
                        +{(activeConv.members || []).length - 3}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate flex items-center gap-1.5">
                      <Users size={11} className="text-purple-light shrink-0" />
                      {convDisplayName(activeConv)}
                    </p>
                    <p className="vs-counter text-[10px] text-text-dim tabular-nums">
                      {(activeConv.members || []).length} MEMBERS
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Avatar
                    url={activeConv.other_user?.avatar_url}
                    name={activeConv.other_user?.display_name || activeConv.other_user?.username}
                    href={activeConv.other_user?.username ? `/profile/${activeConv.other_user.username}` : undefined}
                    size="sm"
                    shape="rounded"
                    variant="gradient"
                    showInnerRing={(activeConv.other_user as any)?.is_founding_member}
                    online={!!(activeConv.other_user as any)?.last_seen_at && Date.now() - new Date((activeConv.other_user as any).last_seen_at).getTime() < 5 * 60 * 1000}
                  />
                  <div className="flex-1 min-w-0">
                    {activeConv.other_user?.username ? (
                      <Link href={`/profile/${activeConv.other_user.username}`} className="text-sm font-medium truncate hover:text-purple transition-colors block">
                        {activeConv.other_user.display_name || activeConv.other_user.username}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium truncate">Unknown</p>
                    )}
                    <p className="text-[10px] text-text-dim">@{activeConv.other_user?.username}</p>
                  </div>
                </>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xs text-text-dim">No messages yet. Say hello.</p>
                  <span className="vs-counter text-[9px] text-text-dim mt-2 inline-block">START THE THREAD</span>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMine = msg.sender_id === userId
                  const showDay = isNewDay(msg.created_at, messages[i - 1]?.created_at)
                  const prevMsg = messages[i - 1]
                  // In a group: show sender name on first message in a streak from same sender
                  const isFirstFromSender =
                    activeConv.is_group && !isMine &&
                    (!prevMsg || prevMsg.sender_id !== msg.sender_id || isNewDay(msg.created_at, prevMsg.created_at))
                  const sender = activeConv.is_group
                    ? (activeConv.members || []).find(m => m.id === msg.sender_id)
                    : undefined

                  return (
                    <div key={msg.id}>
                      {showDay && (
                        <div className="flex items-center gap-3 py-3">
                          <div className="flex-1 h-px bg-border" />
                          <span className="vs-counter text-[10px] text-text-dim tabular-nums">{formatDate(msg.created_at)}</span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                      )}
                      {isFirstFromSender && sender && (
                        <Link
                          href={`/profile/${sender.username}`}
                          className="flex items-center gap-2 ml-1 mt-2 mb-0.5 group/sender"
                        >
                          <Avatar
                            url={sender.avatar_url}
                            name={sender.display_name || sender.username}
                            size="xs"
                            variant="gradient"
                          />
                          <span className="text-[10px] text-text-muted group-hover/sender:text-purple-light transition-colors">
                            {sender.display_name || sender.username}
                          </span>
                        </Link>
                      )}
                      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-0.5`}>
                        <div className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                          isMine
                            ? 'bg-purple text-white rounded-br-md'
                            : 'bg-surface-2 text-text rounded-bl-md'
                        }`}>
                          <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                          <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : ''}`}>
                            <span className={`vs-counter text-[9px] tabular-nums ${isMine ? 'text-white/50' : 'text-text-dim'}`}>
                              {formatMessageTime(msg.created_at)}
                            </span>
                            {isMine && !activeConv.is_group && (
                              msg.is_read
                                ? <CheckCheck size={10} className="text-white/50" />
                                : <Check size={10} className="text-white/30" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-3 flex gap-2 shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Type a message..."
                className="vs-input flex-1 text-sm"
                maxLength={2000}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="vs-btn vs-btn-primary px-3 disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* New conversation sheet */}
      <Sheet
        open={showNewConv}
        onClose={() => setShowNewConv(false)}
        maxWidth="max-w-sm"
        title={<span className="flex items-center gap-2"><Plus size={16} className="text-purple" /> New Message</span>}
      >
        <div className="p-4">
          <div className="relative mb-3">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              value={searchUsers}
              onChange={e => searchForUsers(e.target.value)}
              placeholder="Search by username..."
              className="vs-input text-sm pl-8"
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {searchingUsers ? (
              <div className="text-center py-4">
                <ScopeSpinner size={20} className="mx-auto" />
              </div>
            ) : searchResults.length === 0 ? (
              <p className="text-xs text-text-dim text-center py-4">
                {searchUsers.length >= 2 ? 'No users found' : 'Type to search for users'}
              </p>
            ) : (
              <div className="space-y-1">
                {searchResults.map(user => (
                  <button
                    key={user.id}
                    onClick={() => startConversation(user)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-2 transition-colors text-left active:scale-[0.99]"
                  >
                    <Avatar
                      url={user.avatar_url}
                      name={user.display_name || user.username}
                      size="sm"
                      shape="rounded"
                      variant="gradient"
                      showInnerRing={(user as any).is_founding_member}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{user.display_name || user.username}</p>
                      <p className="text-[10px] text-text-dim">@{user.username} · {user.level_name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Sheet>
    </div>
  )
}
