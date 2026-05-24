import { createClient } from '@/lib/supabase-server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const modActionSchema = z.object({
  target_type: z.enum([
    'post',
    'clip',
    'comment',
    'forum_thread',
    'forum_reply',
    'user',
  ]),
  target_id: z.string().uuid(),
  action: z.enum(['delete', 'pin', 'lock', 'warn', 'mute', 'report']),
  reason: z.string().max(500).optional(),
  mute_days: z.number().int().min(1).max(30).optional(),
})

async function executeDelete(
  supabase: SupabaseClient,
  type: string,
  id: string,
) {
  const tableMap: Record<string, string> = {
    post: 'posts',
    clip: 'clips',
    comment: 'post_comments',
    forum_thread: 'forum_threads',
    forum_reply: 'forum_replies',
  }
  const table = tableMap[type]
  if (table) await supabase.from(table).delete().eq('id', id)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: mod } = await supabase
      .from('profiles')
      .select('mod_level, role')
      .eq('id', user.id)
      .maybeSingle()

    if (!mod || (mod.mod_level ?? 0) < 1) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = modActionSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { target_type, target_id, action, reason, mute_days } = parsed.data

    if (['warn', 'mute'].includes(action) && (mod.mod_level ?? 0) < 2) {
      return NextResponse.json({ error: 'Niveau 2 vereist' }, { status: 403 })
    }

    switch (action) {
      case 'delete':
        await executeDelete(supabase, target_type, target_id)
        break
      case 'pin':
      case 'lock':
        if (target_type === 'forum_thread') {
          await supabase
            .from('forum_threads')
            .update({
              [action === 'pin' ? 'is_pinned' : 'is_locked']: true,
            })
            .eq('id', target_id)
        }
        break
      case 'warn':
        await supabase.rpc('create_notification', {
          target_user_id: target_id,
          notif_type: 'mod_warning',
          notif_title: 'Moderator waarschuwing',
          notif_body:
            reason ?? 'Je hebt een waarschuwing ontvangen van een moderator.',
          notif_link: null,
        })
        break
      case 'mute': {
        const mutedUntil = new Date()
        mutedUntil.setDate(mutedUntil.getDate() + (mute_days ?? 1))
        await supabase.from('user_mutes').upsert(
          {
            user_id: target_id,
            muted_by: user.id,
            reason: reason ?? null,
            muted_until: mutedUntil.toISOString(),
          },
          { onConflict: 'user_id' },
        )
        await supabase.rpc('create_notification', {
          target_user_id: target_id,
          notif_type: 'mod_mute',
          notif_title: 'Je account is tijdelijk gemute',
          notif_body: `Je kunt ${mute_days ?? 1} dag(en) niet posten. Reden: ${
            reason ?? 'Niet opgegeven'
          }`,
          notif_link: null,
        })
        break
      }
      case 'report':
        // Geen directe actie — alleen loggen
        break
    }

    await supabase.from('mod_actions').insert({
      mod_id: user.id,
      target_type,
      target_id,
      action,
      reason: reason ?? null,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mod action error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 },
    )
  }
}
