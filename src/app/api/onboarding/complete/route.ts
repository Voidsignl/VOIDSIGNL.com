import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const onboardingSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9_-]+$/),
  display_name: z.string().min(1).max(50),
  bio: z.string().min(1).max(300),
  preferred_language: z.enum(['nl', 'en']),
  platforms: z.array(z.string()).min(1),
  buddy_playtimes: z.array(z.string()),
  play_style: z.enum(['competitive', 'casual', 'coaching']),
  game_ids: z.array(z.string().uuid()).min(1).max(5),
  main_game_id: z.string().uuid(),
  avatar_url: z.string().url(),
})

const INNER_CIRCLE = [
  'shadow-and-dust8',
  'bigfish',
  'gunner4002',
  'warriorslife',
  'bigiborntofight',
]

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = onboardingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const d = parsed.data

    // Check username nog steeds beschikbaar
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', d.username)
      .neq('id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Username al bezet' },
        { status: 409 },
      )
    }

    // Inner Circle check
    const isInnerCircle = INNER_CIRCLE.includes(d.username.toLowerCase())

    // Profiel updaten
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        username: d.username,
        display_name: d.display_name || d.username,
        bio: d.bio,
        avatar_url: d.avatar_url,
        preferred_language: d.preferred_language,
        platforms: d.platforms,
        buddy_playtimes: d.buddy_playtimes,
        play_style: d.play_style,
        is_inner_circle: isInnerCircle,
        is_onboarded: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileError) throw profileError

    // Games toevoegen aan library
    const gameInserts = d.game_ids.map((game_id) => ({
      user_id: user.id,
      game_id,
      is_main: game_id === d.main_game_id,
    }))

    await supabase
      .from('user_games')
      .upsert(gameInserts, { onConflict: 'user_id,game_id' })

    // XP voor onboarding (50 XP)
    try {
      await supabase.rpc('add_xp', { user_uuid: user.id, amount: 50 })
    } catch {
      // RPC optioneel - skip silently
    }
    try {
      await supabase.rpc('check_achievements', { user_uuid: user.id })
    } catch {
      // RPC optioneel - skip silently
    }

    return NextResponse.json({
      success: true,
      is_inner_circle: isInnerCircle,
    })
  } catch (error) {
    console.error('Onboarding complete error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 },
    )
  }
}
