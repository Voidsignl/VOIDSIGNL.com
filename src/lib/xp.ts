// SERVER-SIDE ONLY. Importeer niet in client components.
import 'server-only'
import { getAdminClient } from './supabase-admin'

// XP bron-tags volgens MD3 §11
export type XPSource =
  | 'post_created'
  | 'clip_uploaded'
  | 'clip_cotw'
  | 'buddy_connected'
  | 'coaching_completed'
  | 'achievement_unlock'
  | 'forum_thread'
  | 'forum_reply'
  | 'clan_created'
  | 'daily_login'
  | 'streak_milestone'
  | 'tournament_win'
  | (string & {})

export const XP_AMOUNTS: Record<string, number> = {
  post_created: 10,
  clip_uploaded: 25,
  clip_cotw: 100,
  buddy_connected: 15,
  coaching_completed: 50,
  forum_thread: 10,
  forum_reply: 5,
  clan_created: 20,
}

/**
 * Verleen XP aan een gebruiker. Logt het event in xp_events en update
 * profile.xp / level / level_name via de bestaande add_xp RPC
 * (die ook level-up notificaties triggert + check_achievements aanroept).
 *
 * Werkt alleen server-side (gebruikt service role).
 */
export async function grantXP(
  userId: string,
  amount: number,
  source: XPSource,
): Promise<void> {
  if (!Number.isFinite(amount) || amount <= 0) return
  const admin = getAdminClient()

  // 1. Log het event (voor weekly_xp_leaders + audit trail)
  const { error: eventError } = await admin
    .from('xp_events')
    .insert({ user_id: userId, amount, source })
  if (eventError) {
    console.error('xp_events insert failed:', eventError)
    return
  }

  // 2. Update profiel-totaal + level via RPC
  const { error: rpcError } = await admin.rpc('add_xp', {
    user_uuid: userId,
    amount,
  })
  if (rpcError) console.error('add_xp RPC failed:', rpcError)
}
