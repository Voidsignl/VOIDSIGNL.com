'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import type { Profile } from '@/types'
import {
  MessageCircle, Send, Search, ArrowLeft, Plus, Check, CheckCheck,
  User, X, MoreHorizontal
} from 'lucide-react'

interface Conversation {
  id: string
  user_a: string
  user_b: string
  last_message_at: string
  other_user?: Profile
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

  // Poll for new messages every 5s
  useEffect(() => {
    if (!activeConv) return
    const interval = setInterval(() => {
      loadMessages(activeConv.id)
    }, 5000)
    return () => clearInterval(interval)
  }, [activeConv?.id])

  // Poll conversations every 10s
  useEffect(() => {
    if (!userId) return
    const interval = setInterval(() => {
      loadConversations(userId)
    }, 10000)
    return () => clearInterval(interval)
  }, [userId])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    await loadConversations(user.id)
    setLoading(false)
  }

  async function loadConversations(uid: string) {
    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .or(`user_a.eq.${uid},user_b.eq.${uid}`)
      .order('last_message_at', { ascending: false })

    if (!convs) return

    // Load other user profiles and last messages
    const enriched = await Promise.all(convs.map(async (conv) => {
      const otherId = conv.user_a === uid ? conv.user_b : conv.user_a

      const [profileRes, msgRes, unreadRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', otherId).single(),
        supabase.from('messages').select('content').eq('conversation_id', conv.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('conversation_id', conv.id).eq('is_read', false).neq('sender_id', uid),
      ])

      return {
        ...conv,
        other_user: profileRes.data as Profile | undefined,
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
    ? conversations.filter(c =>
        c.other_user?.username.toLowerCase().includes(convSearch.toLowerCase()) ||
        (c.other_user?.display_name || '').toLowerCase().includes(convSearch.toLowerCase())
      )
    : conversations

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-dim text-sm animate-pulse">Loading messages...</div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-52px)] flex -m-4 md:-m-6">
      {/* Conversation list */}
      <div className={`w-full md:w-80 border-r border-border flex flex-col shrink-0 bg-[#12121a] ${activeConv ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <MessageCircle size={16} className="text-purple" />
              Messages
              {totalUnread > 0 && (
                <span className="w-5 h-5 rounded-full bg-danger text-white text-[10px] flex items-center justify-center font-medium">
                  {totalUnread}
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
            <div className="text-center py-12 px-4">
              <MessageCircle size={28} className="mx-auto text-text-dim opacity-40 mb-2" />
              <p className="text-xs text-text-dim">
                {convSearch ? 'No conversations found' : 'No messages yet'}
              </p>
              <button
                onClick={() => setShowNewConv(true)}
                className="text-xs text-cyan hover:underline mt-2"
              >
                Start a conversation
              </button>
            </div>
          ) : (
            filteredConvs.map(conv => {
              const isActive = activeConv?.id === conv.id
              const hasUnread = (conv.unread_count || 0) > 0

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-border/50 ${
                    isActive ? 'bg-purple/10' : 'hover:bg-surface'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-purple/20 flex items-center justify-center text-sm font-bold text-purple shrink-0 relative">
                    {(conv.other_user?.display_name || conv.other_user?.username || '?')[0].toUpperCase()}
                    {hasUnread && (
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-danger border-2 border-[#12121a]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm truncate ${hasUnread ? 'font-semibold' : 'font-medium'}`}>
                        {conv.other_user?.display_name || conv.other_user?.username || 'Unknown'}
                      </span>
                      <span className="text-[10px] text-text-dim shrink-0 ml-2">{timeAgo(conv.last_message_at)}</span>
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
          <div className="flex-1 flex flex-col items-center justify-center text-text-dim">
            <MessageCircle size={40} className="opacity-30 mb-3" />
            <p className="text-sm">Select a conversation</p>
            <p className="text-xs mt-1">or start a new one</p>
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
              <div className="w-8 h-8 rounded-lg bg-purple/20 flex items-center justify-center text-xs font-bold text-purple">
                {(activeConv.other_user?.display_name || activeConv.other_user?.username || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {activeConv.other_user?.display_name || activeConv.other_user?.username}
                </p>
                <p className="text-[10px] text-text-dim">@{activeConv.other_user?.username}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xs text-text-dim">No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMine = msg.sender_id === userId
                  const showDay = isNewDay(msg.created_at, messages[i - 1]?.created_at)

                  return (
                    <div key={msg.id}>
                      {showDay && (
                        <div className="flex items-center gap-3 py-3">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-[10px] text-text-dim">{formatDate(msg.created_at)}</span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                      )}
                      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-0.5`}>
                        <div className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                          isMine
                            ? 'bg-purple text-white rounded-br-md'
                            : 'bg-surface-2 text-text rounded-bl-md'
                        }`}>
                          <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                          <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : ''}`}>
                            <span className={`text-[9px] ${isMine ? 'text-white/50' : 'text-text-dim'}`}>
                              {formatMessageTime(msg.created_at)}
                            </span>
                            {isMine && (
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

      {/* New conversation modal */}
      {showNewConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowNewConv(false)}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-sm mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Plus size={16} className="text-purple" /> New Message
              </h3>
              <button onClick={() => setShowNewConv(false)} className="text-text-dim hover:text-text">
                <X size={16} />
              </button>
            </div>

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
                    <div className="w-4 h-4 border-2 border-purple border-t-transparent rounded-full animate-spin mx-auto" />
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
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-2 transition-colors text-left"
                      >
                        <div className="w-9 h-9 rounded-lg bg-purple/20 flex items-center justify-center text-sm font-bold text-purple shrink-0">
                          {(user.display_name || user.username)[0].toUpperCase()}
                        </div>
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
          </div>
        </div>
      )}
    </div>
  )
}
