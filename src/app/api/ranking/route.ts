import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'

const PAGE_SIZE = 50

const VIEW_MAP: Record<string, string> = {
  global: 'ranking_global',
  clips: 'ranking_clips',
  coaching: 'ranking_coaching',
  clans: 'ranking_clans',
}

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const limit = checkRateLimit(ip, 'api')
    if (!limit.allowed) return rateLimitResponse(limit.resetAt)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { searchParams } = new URL(req.url)
    const tab = searchParams.get('tab') ?? 'global'
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const search = searchParams.get('q')?.trim() ?? ''
    const offset = (page - 1) * PAGE_SIZE

    // Niet ingelogd: alleen top 5 global
    if (!user) {
      const { data } = await supabase
        .from('ranking_global')
        .select('id,username,display_name,avatar_url,xp,level,level_name,is_verified,is_founding_member,accent_color,clip_count,cotw_wins,rank')
        .order('rank', { ascending: true })
        .limit(5)
      return NextResponse.json({ data: data ?? [], isGuest: true })
    }

    // Zoekfunctie alleen op global
    if (search && tab === 'global') {
      const { data, error } = await supabase.rpc('search_ranking_global', { search_term: search })
      if (error) throw error
      return NextResponse.json({ data: data ?? [], search: true })
    }

    const view = VIEW_MAP[tab] ?? 'ranking_global'

    const { data, error, count } = await supabase
      .from(view)
      .select('*', { count: 'exact' })
      .order('rank', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) throw error

    // Eigen positie ophalen (alleen global tab)
    let myPosition = null
    if (tab === 'global') {
      const { data: me } = await supabase
        .from('ranking_global')
        .select('rank,xp,level_name,cotw_wins')
        .eq('id', user.id)
        .maybeSingle()
      myPosition = me
    }

    return NextResponse.json({
      data: data ?? [],
      myPosition,
      pagination: { page, total: count ?? 0, pageSize: PAGE_SIZE },
    })

  } catch (error) {
    console.error('Ranking API error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
