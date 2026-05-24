'use client'

import Image from 'next/image'
import Link from 'next/link'

export interface ConversationItem {
  id: string
  status: string
  last_message_preview?: string | null
  last_message_at?: string | null
  unread_count: number
  is_pending_outgoing?: boolean
  other_user: {
    id: string
    username: string
    display_name?: string | null
    avatar_url?: string | null
    accent_color?: string | null
    last_seen_at?: string | null
  } | null
}

interface ConversationListProps {
  conversations: ConversationItem[]
  activeId?: string
}

function isOnline(lastSeen?: string | null) {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < 90000
}

function timeAgo(date?: string | null) {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'nu'
  if (mins < 60) return `${mins}m`
  if (mins < 1440) return `${Math.floor(mins / 60)}u`
  return `${Math.floor(mins / 1440)}d`
}

export default function ConversationList({ conversations, activeId }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="font-mono text-[10px] tracking-[0.2em] text-text-dim/60 uppercase mb-2">
          Leeg
        </p>
        <p className="text-text-dim text-xs">Nog geen gesprekken.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {conversations.map(conv => {
        if (!conv.other_user) return null
        const online = isOnline(conv.other_user.last_seen_at)
        const accentColor = conv.other_user.accent_color ?? '#6B3FE0'
        const isActive = conv.id === activeId

        return (
          <Link key={conv.id} href={`/messages/${conv.other_user.username}`}>
            <div className={`flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2 transition-colors ${
              isActive ? 'bg-purple/10 border-r-2 border-purple' : ''
            }`}>
              <div className="relative flex-shrink-0">
                <div className="relative w-11 h-11 rounded-full overflow-hidden bg-surface-2 border-2"
                  style={{ borderColor: accentColor }}>
                  {conv.other_user.avatar_url ? (
                    <Image src={conv.other_user.avatar_url} alt={conv.other_user.username}
                      fill sizes="44px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-mono text-sm text-text-dim">
                        {conv.other_user.username?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface ${
                  online ? 'bg-success' : 'bg-border'
                }`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-sm truncate ${
                    conv.unread_count > 0 ? 'text-text font-bold' : 'text-text-dim'
                  }`}>
                    {conv.other_user.display_name ?? conv.other_user.username}
                  </span>
                  <span className="font-mono text-[10px] text-text-dim/60 flex-shrink-0 ml-2">
                    {timeAgo(conv.last_message_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className={`text-xs truncate ${
                    conv.unread_count > 0 ? 'text-text' : 'text-text-dim/60'
                  }`}>
                    {conv.last_message_preview ?? 'Nog geen berichten'}
                  </p>
                  {conv.is_pending_outgoing ? (
                    <span className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-warning/10 border border-warning/20 text-warning flex-shrink-0 ml-2 whitespace-nowrap">
                      Wachtend
                    </span>
                  ) : conv.unread_count > 0 ? (
                    <div className="w-5 h-5 rounded-full bg-purple flex items-center justify-center flex-shrink-0 ml-2">
                      <span className="font-mono text-[9px] text-white font-bold">
                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
