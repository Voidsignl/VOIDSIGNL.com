'use client'

/**
 * Friend recommendations widget — calls friend_recommendations RPC.
 * Click "Follow" to follow without leaving the dashboard.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { Users, UserPlus, Check } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'

interface Rec {
  user_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  level_name: string
  is_founding_member: boolean
  reason: string
  score: number
}

interface FriendRecsProps {
  userId: string
}

export function FriendRecs({ userId }: FriendRecsProps) {
  const supabase = createClient()
  const [recs, setRecs] = useState<Rec[]>([])
  const [loading, setLoading] = useState(true)
  const [followed, setFollowed] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data } = await supabase.rpc('friend_recommendations', { p_limit: 5 })
      if (!cancelled) {
        setRecs((data || []) as Rec[])
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function follow(targetId: string) {
    if (pending.has(targetId)) return
    setPending(prev => new Set(prev).add(targetId))
    try {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: userId, following_id: targetId })
      if (!error) {
        setFollowed(prev => new Set(prev).add(targetId))
      }
    } finally {
      setPending(prev => {
        const next = new Set(prev)
        next.delete(targetId)
        return next
      })
    }
  }

  if (loading || recs.length === 0) return null

  return (
    <div className="vs-card vs-lit">
      <p className="vs-label mb-3 flex items-center gap-1.5">
        <Users size={11} className="text-cyan" /> WHO TO FOLLOW
      </p>
      <ul className="space-y-3">
        {recs.map(r => {
          const isFollowed = followed.has(r.user_id)
          const isPending = pending.has(r.user_id)
          return (
            <li key={r.user_id} className="flex items-center gap-2.5">
              <Avatar
                url={r.avatar_url}
                name={r.display_name || r.username}
                size="sm"
                variant="gradient"
                showInnerRing={r.is_founding_member}
              />
              <div className="flex-1 min-w-0">
                <Link
                  href={`/profile/${r.username}`}
                  className="text-xs font-medium hover:text-purple-light transition-colors block truncate"
                >
                  {r.display_name || r.username}
                </Link>
                <p className="vs-counter text-[9px] text-text-dim tabular-nums truncate">
                  {r.reason.toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => follow(r.user_id)}
                disabled={isFollowed || isPending}
                className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors duration-200 ${
                  isFollowed ? 'bg-success/15 text-success cursor-default' :
                  'bg-purple/15 text-purple-light hover:bg-purple/25 active:scale-90'
                }`}
              >
                {isFollowed ? <><Check size={10} /> Followed</> : <><UserPlus size={10} /> Follow</>}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
