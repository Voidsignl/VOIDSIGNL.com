import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { sessionBookSchema } from '@/lib/validations'
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'

const TIER_PRICES: Record<string, number> = {
  basic: 1000,
  standard: 2500,
  premium: 5000,
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const limit = checkRateLimit(ip, 'api')
    if (!limit.allowed) return rateLimitResponse(limit.resetAt)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = sessionBookSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { coach_id, game_id, tier, notes, scheduled_at } = parsed.data

    if (coach_id === user.id) {
      return NextResponse.json({ error: 'Cannot book yourself' }, { status: 400 })
    }

    // coach_id in coaching_sessions verwijst naar coach_profiles.id
    const { data: coach } = await supabase
      .from('coach_profiles')
      .select('id, user_id, is_approved, is_active')
      .eq('id', coach_id)
      .maybeSingle()

    if (!coach?.is_approved || !coach?.is_active) {
      return NextResponse.json({ error: 'Coach not available' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('coaching_sessions')
      .insert({
        coach_id,
        student_id: user.id,
        game_id: game_id ?? null,
        tier,
        price_cents: TIER_PRICES[tier],
        notes: notes ?? null,
        scheduled_at,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    await supabase.rpc('create_notification', {
      target_user_id: coach.user_id,
      notif_type: 'session_request',
      notif_title: 'Nieuwe sessie aanvraag',
      notif_body: 'Een student wil een sessie boeken.',
      notif_link: '/coaching/dashboard',
    })

    return NextResponse.json({ data }, { status: 201 })

  } catch (error) {
    console.error('Session book error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role') ?? 'student'

    let query = supabase
      .from('coaching_sessions')
      .select(`
        id, status, tier, price_cents, notes, scheduled_at, completed_at,
        feedback_sent, discord_invite, created_at,
        game:games(id, name),
        coach:coach_profiles!coaching_sessions_coach_id_fkey(
          id,
          user:profiles!coach_profiles_user_id_fkey(
            id, username, display_name, avatar_url, accent_color
          )
        ),
        student:profiles!coaching_sessions_student_id_fkey(
          id, username, display_name, avatar_url, accent_color
        )
      `)

    if (role === 'coach') {
      // coach: zoek alle coach_profiles van deze user, filter sessions op die ids
      const { data: cp } = await supabase
        .from('coach_profiles')
        .select('id')
        .eq('user_id', user.id)
      const ids = (cp ?? []).map((r: { id: string }) => r.id)
      if (ids.length === 0) return NextResponse.json({ data: [] })
      query = query.in('coach_id', ids)
    } else {
      query = query.eq('student_id', user.id)
    }

    const { data, error } = await query.order('scheduled_at', { ascending: true })
    if (error) throw error
    return NextResponse.json({ data: data ?? [] })

  } catch (error) {
    console.error('Sessions GET error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
