import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { buddySearchSchema } from '@/lib/validations'
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'
import { logApiError } from '@/lib/logError'

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const limit = checkRateLimit(ip, 'search')
    if (!limit.allowed) return rateLimitResponse(limit.resetAt)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const parsed = buddySearchSchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { game_id, language, platform, playtime, min_level, max_level, page } = parsed.data
    const offset = (page - 1) * PAGE_SIZE

    const { data, error } = await supabase.rpc('search_buddies', {
      p_user_id: user.id,
      p_game_id: game_id ?? null,
      p_language: language ?? null,
      p_platform: platform ?? null,
      p_playtime: playtime ?? null,
      p_min_level: min_level ?? null,
      p_max_level: max_level ?? null,
      p_limit: PAGE_SIZE,
      p_offset: offset,
    })
    if (error) throw error

    const { data: games } = await supabase
      .from('games')
      .select('id, name')
      .eq('is_approved', true)
      .order('name')

    return NextResponse.json({ data: data ?? [], games: games ?? [] })

  } catch (error) {
    await logApiError('/api/buddy/search', 'GET', 500, error)
    console.error('Buddy search error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
