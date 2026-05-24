'use client'

import { useState, useEffect } from 'react'
import ConversationList, { type ConversationItem } from './ConversationList'
import NewConversationModal from './NewConversationModal'

type Tab = 'inbox' | 'requests'

interface MessagesSidebarProps {
  activeUsername?: string
  defaultTab?: Tab
}

export default function MessagesSidebar({
  activeUsername,
  defaultTab = 'inbox',
}: MessagesSidebarProps) {
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [requests, setRequests] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>(defaultTab)
  const [newOpen, setNewOpen] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/messages?type=accepted').then((r) => r.json()),
      fetch('/api/messages?type=pending').then((r) => r.json()),
    ])
      .then(([inbox, pending]) => {
        setConversations(inbox.data ?? [])
        setRequests(pending.data ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleRequest(convId: string, action: 'accept' | 'block') {
    await fetch('/api/messages/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: convId, action }),
    })
    if (action === 'accept') {
      const conv = requests.find((r) => r.id === convId)
      if (conv) {
        setConversations((prev) => [{ ...conv, status: 'accepted' }, ...prev])
      }
    }
    setRequests((prev) => prev.filter((r) => r.id !== convId))
  }

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'inbox', label: 'Inbox' },
    { key: 'requests', label: 'Verzoeken', count: requests.length },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase">Community</p>
          <h1 className="font-mono text-base font-bold text-text">Berichten</h1>
        </div>
        <button
          onClick={() => setNewOpen(true)}
          className="w-9 h-9 bg-purple text-white rounded-full flex items-center justify-center hover:bg-purple/85 transition-colors duration-200 shadow-[0_2px_8px_rgba(107,63,224,0.35)]"
          aria-label="Nieuw gesprek"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      <NewConversationModal open={newOpen} onClose={() => setNewOpen(false)} />

      {/* Tabs */}
      <div className="px-3 pt-3 flex-shrink-0">
        <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-colors duration-200 ${
                tab === t.key
                  ? 'bg-purple text-white'
                  : 'text-text-dim hover:text-text'
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`ml-1.5 ${tab === t.key ? 'text-white/70' : 'text-text-dim/60'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto mt-3">
        {loading ? (
          <div className="space-y-2 px-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-surface rounded-xl h-16" />
            ))}
          </div>
        ) : tab === 'inbox' ? (
          <ConversationList conversations={conversations} activeUsername={activeUsername} />
        ) : requests.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="font-mono text-[10px] tracking-[0.2em] text-text-dim/60 uppercase mb-2">
              Leeg
            </p>
            <p className="text-text-dim text-xs">Geen berichtverzoeken.</p>
          </div>
        ) : (
          <div className="space-y-2 px-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-surface border border-border rounded-xl p-3"
              >
                <p className="font-mono text-xs font-bold text-text mb-1">
                  {req.other_user?.display_name ?? req.other_user?.username}
                </p>
                <p className="text-text-dim text-[11px] mb-2 line-clamp-2">
                  {req.last_message_preview ?? 'Geen preview'}
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleRequest(req.id, 'accept')}
                    className="flex-1 py-1.5 bg-purple text-white font-mono text-[10px] uppercase tracking-wider rounded-lg hover:bg-purple/85 transition-colors duration-200"
                  >
                    Accepteren
                  </button>
                  <button
                    onClick={() => handleRequest(req.id, 'block')}
                    className="flex-1 py-1.5 border border-border text-text-dim font-mono text-[10px] uppercase tracking-wider rounded-lg hover:border-danger hover:text-danger transition-colors duration-200"
                  >
                    Weigeren
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
