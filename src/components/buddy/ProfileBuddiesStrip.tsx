'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { Avatar } from '@/components/ui/avatar'

interface Buddy {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  is_founding_member: boolean
}

/**
 * Compacte buddy-strip op de profielpagina.
 * Toont max 6 buddies + "Bekijk alle" link naar /buddies.
 */
export function ProfileBuddiesStrip({ userId }: { userId: string }) {
  const supabase = createClient()
  const [buddies, setBuddies] = useState<Buddy[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      // Beide kanten van geaccepteerde requests + count
      const { data, count: totalCount } = await supabase
        .from('buddy_requests')
        .select(`
          sender_id, receiver_id,
          sender:profiles!buddy_requests_sender_id_fkey(id, username, display_name, avatar_url, is_founding_member),
          receiver:profiles!buddy_requests_receiver_id_fkey(id, username, display_name, avatar_url, is_founding_member)
        `, { count: 'exact' })
        .eq('status', 'accepted')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .limit(6)

      if (cancelled) return

      const buddyList: Buddy[] = (data ?? [])
        .map((row: any) => (row.sender_id === userId ? row.receiver : row.sender))
        .filter(Boolean)
        .slice(0, 6)

      setBuddies(buddyList)
      setCount(totalCount ?? buddyList.length)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [userId, supabase])

  if (loading || buddies.length === 0) return null

  return (
    <div className="vs-card mb-5">
      <div className="flex items-center justify-between mb-3">
        <p className="vs-counter text-[10px] text-text-dim tabular-nums">
          BUDDIES · {count}
        </p>
        <Link href="/buddies" className="font-mono text-[10px] text-purple hover:text-purple/85 transition-colors">
          Bekijk alle →
        </Link>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {buddies.map(b => (
          <Avatar
            key={b.id}
            url={b.avatar_url}
            name={b.display_name || b.username}
            size="sm"
            variant="gradient"
            href={`/profile/${b.username}`}
            showInnerRing={b.is_founding_member}
          />
        ))}
      </div>
    </div>
  )
}
