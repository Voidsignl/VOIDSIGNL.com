import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const limit = checkRateLimit(ip, 'api')
    if (!limit.allowed) return rateLimitResponse(limit.resetAt)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const gameId = searchParams.get('game_id')
    const language = searchParams.get('language')
    const sort = searchParams.get('sort') ?? 'rating'
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const offset = (page - 1) * PAGE_SIZE

    let query = supabase
      .from('coach_profiles')
      .select(`
        id, bio, specializations, languages, hourly_tier,
        avg_rating, review_count, total_sessions, response_rate,
        user:profiles!coach_profiles_user_id_fkey(
          id, username, display_name, avatar_url, banner_url,
          accent_color, is_verified, is_founding_member, level_name
        ),
        games:coach_games(
          game:games(id, name)
        )
      `, { count: 'exact' })
      .eq('is_approved', true)
      .eq('is_active', true)

    if (language) query = query.contains('languages', [language])

    if (sort === 'rating')        query = query.order('avg_rating', { ascending: false })
    else if (sort === 'sessions') query = query.order('total_sessions', { ascending: false })
    else                          query = query.order('created_at', { ascending: false })

    const { data, error, count } = await query.range(offset, offset + PAGE_SIZE - 1)
    if (error) throw error

    let filtered = data ?? []
    if (gameId) {
      filtered = filtered.filter((c: any) =>
        Array.isArray(c.games) && c.games.some((g: any) => g.game?.id === gameId)
      )
    }

    return NextResponse.json({
      data: filtered,
      pagination: { page, total: count ?? 0, pageSize: PAGE_SIZE },
    })

  } catch (error) {
    console.error('Coaching GET error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
