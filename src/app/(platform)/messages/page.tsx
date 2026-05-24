'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ConversationList, { type ConversationItem } from '@/components/messages/ConversationList'
import NewConversationModal from '@/components/messages/NewConversationModal'

type Tab = 'inbox' | 'requests'

function MessagesPageInner() {
  const searchParams = useSearchParams()
  const initialTab: Tab = searchParams?.get('tab') === 'requests' ? 'requests' : 'inbox'
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [requests, setRequests] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>(initialTab)
  const [newOpen, setNewOpen] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/messages?type=accepted').then(r => r.json()),
      fetch('/api/messages?type=pending').then(r => r.json()),
    ]).then(([inbox, pending]) => {
      setConversations(inbox.data ?? [])
      setRequests(pending.data ?? [])
    }).finally(() => setLoading(false))
  }, [])

  async function handleRequest(convId: string, action: 'accept' | 'block') {
    await fetch('/api/messages/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: convId, action }),
    })
    if (action === 'accept') {
      const conv = requests.find(r => r.id === convId)
      if (conv) {
        setConversations(prev => [{ ...conv, status: 'accepted' }, ...prev])
      }
    }
    setRequests(prev => prev.filter(r => r.id !== convId))
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'inbox', label: 'Inbox' },
    { key: 'requests', label: `Verzoeken${requests.length > 0 ? ` (${requests.length})` : ''}` },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-1">
            Community
          </p>
          <h1 className="font-mono text-2xl font-bold text-text">Berichten</h1>
        </div>
        <button
          onClick={() => setNewOpen(true)}
          className="px-4 py-2 bg-purple text-white font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-purple/85 transition-colors duration-200"
        >
          + Nieuw gesprek
        </button>
      </div>

      <NewConversationModal open={newOpen} onClose={() => setNewOpen(false)} />

      <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 mb-4">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-lg font-mono text-xs transition-colors duration-200 ${
              tab === t.key ? 'bg-purple text-white' : 'text-text-dim hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-surface rounded-xl h-16" />
          ))}
        </div>
      ) : tab === 'inbox' ? (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <ConversationList conversations={conversations} />
        </div>
      ) : (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <p className="text-center text-text-dim font-mono text-sm py-8">
              Geen berichtverzoeken.
            </p>
          ) : requests.map(req => (
            <div key={req.id} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm font-bold text-text">
                  {req.other_user?.display_name ?? req.other_user?.username}
                </span>
              </div>
              <p className="text-text-dim text-xs mb-3 line-clamp-2">
                {req.last_message_preview ?? 'Geen preview'}
              </p>
              <div className="flex gap-2">
                <button onClick={() => handleRequest(req.id, 'accept')}
                  className="flex-1 py-2 bg-purple text-white font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-purple/85 transition-colors duration-200">
                  Accepteren
                </button>
                <button onClick={() => handleRequest(req.id, 'block')}
                  className="flex-1 py-2 border border-border text-text-dim font-mono text-xs uppercase tracking-wider rounded-lg hover:border-danger hover:text-danger transition-colors duration-200">
                  Weigeren
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="h-8 w-32 bg-surface rounded animate-pulse mb-6" />
      </div>
    }>
      <MessagesPageInner />
    </Suspense>
  )
}
