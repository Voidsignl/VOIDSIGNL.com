'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useAchievement } from '@/context/AchievementContext'
import type { AchievementPopupData } from './AchievementUnlockPopup'

/**
 * Mount in de platform layout. Subscribet op INSERTs in user_achievements
 * voor de ingelogde gebruiker en triggert de popup via context.
 */
export default function AchievementChecker() {
  const supabase = createClient()
  const { showAchievement } = useAchievement()
  const lastShown = useRef<string | null>(null)

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false

    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      channel = supabase
        .channel(`achievement-unlocks:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_achievements',
            filter: `user_id=eq.${user.id}`,
          },
          async (payload: { new: { achievement_id: string } }) => {
            const achievementId = payload.new.achievement_id
            if (achievementId === lastShown.current) return

            const { data } = await supabase
              .from('achievements')
              .select('name, description, icon, rarity, xp_reward')
              .eq('id', achievementId)
              .maybeSingle()

            if (data) {
              lastShown.current = achievementId
              showAchievement(data as AchievementPopupData)
            }
          }
        )
        .subscribe()
    })()

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [supabase, showAchievement])

  return null
}
