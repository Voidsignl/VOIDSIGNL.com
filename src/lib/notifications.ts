// SERVER-SIDE ONLY. Importeer niet in client components.
import 'server-only'
import { getAdminClient } from './supabase-admin'

export interface CreateNotificationInput {
  userId: string
  type: string
  title: string
  body?: string
  link?: string
  actorId?: string
}

/**
 * Maak een notificatie aan voor een gebruiker.
 * Slaat actie over als userId gelijk is aan actorId (geen self-notify).
 * Werkt alleen server-side (gebruikt service role).
 */
export async function createNotification({
  userId,
  type,
  title,
  body,
  link,
  actorId,
}: CreateNotificationInput): Promise<void> {
  if (actorId && actorId === userId) return

  const admin = getAdminClient()
  const { error } = await admin.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body: body ?? null,
    link: link ?? null,
    actor_id: actorId ?? null,
  })
  if (error) console.error('createNotification failed:', error)
}
