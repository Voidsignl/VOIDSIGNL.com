import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { coachApplicationSchema } from '@/lib/validations'
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const limit = checkRateLimit(ip, 'api')
    if (!limit.allowed) return rateLimitResponse(limit.resetAt)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = coachApplicationSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { data: existing } = await supabase
      .from('coach_profiles')
      .select('id, is_approved')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Already applied' }, { status: 400 })
    }

    const { game_ids, ...profileData } = parsed.data

    const { data: coach, error: coachError } = await supabase
      .from('coach_profiles')
      .insert({
        user_id: user.id,
        ...profileData,
        is_approved: false,
        is_active: false,
        applied_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (coachError) throw coachError

    // Games koppelen — coach_games.coach_id verwijst naar coach_profiles.id
    if (game_ids.length > 0) {
      const { error: gamesError } = await supabase.from('coach_games').insert(
        game_ids.map(game_id => ({
          coach_id: coach.id,
          game_id,
        }))
      )
      if (gamesError) console.error('coach_games insert failed:', gamesError)
    }

    // Admins notificeren
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')

    for (const admin of admins ?? []) {
      await supabase.rpc('create_notification', {
        target_user_id: admin.id,
        notif_type: 'coach_application',
        notif_title: 'Nieuwe coach aanvraag',
        notif_body: 'Iemand heeft zich aangemeld als coach. Controleer het admin paneel.',
        notif_link: '/admin/coaches',
      })
    }

    return NextResponse.json({ data: coach }, { status: 201 })

  } catch (error) {
    console.error('Coach apply error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
