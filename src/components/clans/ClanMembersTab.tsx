'use client'

import Link from 'next/link'
import Image from 'next/image'

interface MemberLite {
  id: string
  role: 'owner' | 'officer' | 'member'
  joined_at: string
  user: {
    id: string
    username: string
    display_name?: string | null
    avatar_url?: string | null
    accent_color?: string | null
    level_name?: string
    xp?: number
    last_seen_at?: string | null
    is_inner_circle?: boolean
  } | null
}

interface Props {
  members: MemberLite[]
  currentUserId?: string
  isOfficer: boolean
  isOwner: boolean
  clanSlug: string
  onRefresh: () => void
}

function isOnline(lastSeen?: string | null): boolean {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < 90_000
}

export default function ClanMembersTab({
  members,
  currentUserId,
  isOfficer,
  isOwner,
  clanSlug,
  onRefresh,
}: Props) {
  async function handlePromote(userId: string, newRole: 'officer' | 'member') {
    await fetch(`/api/clans/${clanSlug}/members`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, role: newRole }),
    })
    onRefresh()
  }

  async function handleKick(userId: string) {
    if (!confirm('Lid verwijderen?')) return
    await fetch(`/api/clans/${clanSlug}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    onRefresh()
  }

  const sorted = [...members].sort((a, b) => {
    const order: Record<string, number> = { owner: 0, officer: 1, member: 2 }
    return (order[a.role] ?? 2) - (order[b.role] ?? 2)
  })

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {sorted.map((member) => {
        const u = member.user
        if (!u) return null
        const accent = u.accent_color ?? '#6B3FE0'
        const isMe = u.id === currentUserId
        const online = isOnline(u.last_seen_at)

        return (
          <div
            key={member.id}
            className={`flex items-center gap-3 px-5 py-4 border-b border-border last:border-0 ${
              isMe ? 'bg-purple/5' : ''
            } ${member.role === 'owner' ? 'border-l-2 border-l-purple' : ''}`}
          >
            <div className="relative shrink-0">
              <div
                className="w-10 h-10 rounded-full overflow-hidden bg-surface-2 border-2 flex items-center justify-center"
                style={{ borderColor: accent }}
              >
                {u.avatar_url ? (
                  <Image
                    src={u.avatar_url}
                    alt={u.username}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span
                    className="font-mono text-sm font-bold"
                    style={{ color: accent }}
                  >
                    {u.username[0].toUpperCase()}
                  </span>
                )}
              </div>
              {online && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-surface" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <Link
                  href={`/profile/${u.username}`}
                  className="font-mono text-sm font-bold text-text hover:text-purple transition-colors duration-200"
                >
                  {u.display_name ?? u.username}
                </Link>
                {isMe && (
                  <span className="font-mono text-[9px] text-purple/50">
                    ← jij
                  </span>
                )}
                {member.role === 'owner' && (
                  <span className="font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border bg-purple/10 border-purple/25 text-purple">
                    Owner
                  </span>
                )}
                {member.role === 'officer' && (
                  <span className="font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border bg-cyan/10 border-cyan/25 text-cyan">
                    Officer
                  </span>
                )}
                {u.is_inner_circle && (
                  <span className="font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border bg-cyan/10 border-cyan/25 text-cyan">
                    Inner Circle
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-[10px] text-text-muted">
                  {u.level_name}
                </span>
                <span className="font-mono text-[10px] text-text-dim">
                  {(u.xp ?? 0).toLocaleString()} XP
                </span>
                <span className="font-mono text-[10px] text-text-dim">
                  Lid sinds{' '}
                  {new Date(member.joined_at).toLocaleDateString('nl-NL', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Officer/owner acties */}
            {isOfficer && !isMe && member.role !== 'owner' && (
              <div className="flex gap-2 shrink-0">
                {isOwner && member.role === 'member' && (
                  <button
                    onClick={() => handlePromote(u.id, 'officer')}
                    className="px-3 py-1.5 border border-border text-text-muted font-mono text-[10px] uppercase tracking-widest rounded-lg hover:border-purple/40 hover:text-text transition-colors duration-200"
                  >
                    Officer
                  </button>
                )}
                {isOwner && member.role === 'officer' && (
                  <button
                    onClick={() => handlePromote(u.id, 'member')}
                    className="px-3 py-1.5 border border-border text-text-muted font-mono text-[10px] uppercase tracking-widest rounded-lg hover:text-text transition-colors duration-200"
                  >
                    Degraderen
                  </button>
                )}
                {(isOwner || member.role === 'member') && (
                  <button
                    onClick={() => handleKick(u.id)}
                    className="px-3 py-1.5 border border-border text-text-muted font-mono text-[10px] uppercase tracking-widest rounded-lg hover:border-danger/40 hover:text-danger transition-colors duration-200"
                  >
                    Verwijderen
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
