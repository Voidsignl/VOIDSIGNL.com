import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { gameRequestSchema } from '@/lib/validations'
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
    const parsed = gameRequestSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { data: existing } = await supabase
      .from('games')
      .select('id, name')
      .eq('igdb_id', parsed.data.igdb_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Game bestaat al', game_id: existing.id }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('game_requests')
      .insert({ ...parsed.data, requester_id: user.id })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Al aangevraagd' }, { status: 409 })
      }
      throw error
    }

    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')

    for (const admin of admins ?? []) {
      await supabase.rpc('create_notification', {
        target_user_id: admin.id,
        notif_type: 'game_request',
        notif_title: 'Nieuwe game aanvraag',
        notif_body: `${parsed.data.name} is aangevraagd.`,
        notif_link: '/admin/games',
      })
    }

    return NextResponse.json({ data }, { status: 201 })

  } catch (error) {
    console.error('Game request error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
