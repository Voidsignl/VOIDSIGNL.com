'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X } from 'lucide-react'
import FollowButton from './FollowButton'

type FollowTab = 'followers' | 'following'

interface UserRow {
  id: string
  username: string
  display_name?: string | null
  avatar_url?: string | null
  accent_color?: string | null
  is_verified?: boolean
  is_inner_circle?: boolean
  level_name?: string
  follower_count?: number
  is_following: boolean
  is_self: boolean
}

interface FollowModalProps {
  userId: string
  username: string
  initialTab?: FollowTab
  followerCount: number
  followingCount: number
  onClose: () => void
}

const PAGE_SIZE = 30

export default function FollowModal({
  userId,
  username,
  initialTab = 'followers',
  followerCount,
  followingCount,
  onClose,
}: FollowModalProps) {
  const [tab, setTab] = useState<FollowTab>(initialTab)
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchUsers = useCallback(async (currentPage: number, reset = false) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/follow/${userId}?type=${tab}&page=${currentPage}`)
      const json = await res.json()
      const newUsers: UserRow[] = json.data ?? []
      setUsers(prev => reset || currentPage === 1 ? newUsers : [...prev, ...newUsers])
      setTotal(json.pagination?.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [tab, userId])

  useEffect(() => {
    setPage(1)
    fetchUsers(1, true)
  }, [fetchUsers])

  function handleFollowChange(uid: string, follow: boolean) {
    setUsers(prev => prev.map(u =>
      u.id === uid ? { ...u, is_following: follow } : u
    ))
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <>
      <div className="fixed inset-0 z-50 bg-void/90" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md bg-surface border border-border rounded-2xl overflow-hidden max-h-[70vh] flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
            <p className="font-mono text-sm font-bold text-text">@{username}</p>
            <button onClick={onClose} className="text-text-dim hover:text-text transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="flex border-b border-border flex-shrink-0">
            {([
              { key: 'followers', label: 'Volgers', count: followerCount },
              { key: 'following', label: 'Volgend', count: followingCount },
            ] as const).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-3 font-mono text-xs uppercase tracking-wider transition-colors duration-200 border-b-2 ${
                  tab === t.key
                    ? 'text-text border-purple'
                    : 'text-text-dim border-transparent hover:text-text'
                }`}
              >
                {t.label}
                <span className="ml-2 text-text-dim/60">{t.count.toLocaleString()}</span>
              </button>
            ))}
          </div>

          <div className="overflow-y-auto flex-1">
            {loading && users.length === 0 ? (
              <div className="space-y-3 p-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-2" />
                    <div className="flex-1">
                      <div className="h-3 w-28 bg-surface-2 rounded mb-2" />
                      <div className="h-2 w-16 bg-surface-2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <p className="font-mono text-[10px] tracking-[0.2em] text-text-dim/60 uppercase mb-2">
                  Leeg
                </p>
                <p className="text-text-dim text-xs">
                  {tab === 'followers' ? 'Nog geen volgers.' : 'Volgt nog niemand.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {users.map(u => (
                  <div key={u.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-2 transition-colors">
                    <Link href={`/profile/${u.username}`} onClick={onClose} className="flex-shrink-0">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-surface-2 border-2"
                        style={{ borderColor: u.accent_color ?? '#6B3FE0' }}>
                        {u.avatar_url ? (
                          <Image src={u.avatar_url} alt={u.username} fill sizes="40px" className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="font-mono text-sm text-text-dim">
                              {u.username?.[0]?.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/profile/${u.username}`} onClick={onClose}>
                          <span className="font-mono text-sm font-bold text-text hover:text-purple transition-colors truncate">
                            {u.display_name ?? u.username}
                          </span>
                        </Link>
                        {u.is_verified && <span className="text-cyan text-xs flex-shrink-0">✓</span>}
                        {u.is_inner_circle && (
                          <span className="font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-cyan/10 border border-cyan/20 text-cyan flex-shrink-0">
                            Inner Circle                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px] text-text-dim">{u.level_name}</span>
                        {(u.follower_count ?? 0) > 0 && (
                          <span className="font-mono text-[10px] text-text-dim/60">
                            · {u.follower_count?.toLocaleString()} volgers
                          </span>
                        )}
                      </div>
                    </div>

                    {!u.is_self && (
                      <FollowButton
                        userId={u.id}
                        initialFollowing={u.is_following}
                        size="sm"
                        onFollowChange={(f) => handleFollowChange(u.id, f)}
                      />
                    )}
                  </div>
                ))}

                {page < totalPages && (
                  <div className="p-4 text-center">
                    <button
                      onClick={() => {
                        const next = page + 1
                        setPage(next)
                        fetchUsers(next)
                      }}
                      className="font-mono text-xs text-text-dim hover:text-text transition-colors"
                    >
                      Meer laden
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
