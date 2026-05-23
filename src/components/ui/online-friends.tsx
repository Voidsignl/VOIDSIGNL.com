'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import Image from 'next/image'
import { Circle, Users, Wifi } from 'lucide-react'

interface OnlineFriend {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  last_seen_at: string
  level_name: string
}

// User is online if seen in last 5 minutes
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000

export function OnlineFriends({ userId }: { userId: string }) {
  const supabase = createClient()
  const [friends, setFriends] = useState<OnlineFriend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOnlineFriends()
    const interval = setInterval(loadOnlineFriends, 30_000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [userId])

  async function loadOnlineFriends() {
    // Get users I follow (friends)
    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)

    if (!following || following.length === 0) {
      setFriends([])
      setLoading(false)
      return
    }

    const friendIds = following.map(f => f.following_id)

    // Get their profiles with last_seen_at
    const cutoff = new Date(Date.now() - ONLINE_THRESHOLD_MS).toISOString()
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, last_seen_at, level_name')
      .in('id', friendIds)
      .gte('last_seen_at', cutoff)
      .order('last_seen_at', { ascending: false })

    if (data) setFriends(data as OnlineFriend[])
    setLoading(false)
  }

  function getStatusText(lastSeen: string) {
    const diff = Date.now() - new Date(lastSeen).getTime()
    if (diff < 60_000) return 'just now'
    return `${Math.floor(diff / 60_000)}m ago`
  }

  if (loading) return null

  return (
    <div className="vs-card">
      <div className="flex items-center justify-between mb-3">
        <p className="vs-label flex items-center gap-1.5">
          <Wifi size={10} className="text-success" />
          ONLINE FRIENDS
        </p>
        <span className="text-[10px] text-text-dim">{friends.length}</span>
      </div>

      {friends.length === 0 ? (
        <p className="text-xs text-text-dim py-2">No friends online right now</p>
      ) : (
        <div className="space-y-2">
          {friends.slice(0, 10).map(friend => (
            <Link
              key={friend.id}
              href={`/profile/${friend.username}`}
              className="flex items-center gap-2.5 group"
            >
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-purple/20 flex items-center justify-center text-[10px] font-bold text-purple overflow-hidden">
                  {friend.avatar_url ? (
                    <Image src={friend.avatar_url} alt="" fill sizes="32px" className="object-cover" />
                  ) : (
                    (friend.display_name || friend.username)[0].toUpperCase()
                  )}
                </div>
                {/* Green dot */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-surface" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate group-hover:text-purple transition-colors">
                  {friend.display_name || friend.username}
                </p>
                <p className="text-[9px] text-text-dim">{getStatusText(friend.last_seen_at)}</p>
              </div>
            </Link>
          ))}
          {friends.length > 10 && (
            <p className="text-[10px] text-text-dim text-center pt-1">+{friends.length - 10} more online</p>
          )}
        </div>
      )}
    </div>
  )
}
