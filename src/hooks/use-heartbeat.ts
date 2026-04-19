'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'

export function useHeartbeat() {
  useEffect(() => {
    const supabase = createClient()

    async function beat() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', user.id)
      }
    }

    // Beat immediately on mount
    beat()

    // Then every 60 seconds
    const interval = setInterval(beat, 60_000)

    return () => clearInterval(interval)
  }, [])
}
