import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'
import { logApiError } from '@/lib/logError'

const PAGE_SIZE = 50

const VIEW_MAP: Record<string, string> = {
  global: 'ranking_global',
  clips: 'ranking_clips',
  coaching: 'ranking_coaching',
  clans: 'ranking_clans',
}

interface RankingRow {
  id: string
  username: string
  display_name?: string | null
  avatar_url?: string | null
  xp: number
  level?: number
  level_name?: string
  is_verified?: boolean
  is_founding_member?: boolean
  accent_color?: string | null
  follower_count?: number
  clip_count?: number
  post_count?: number
  cotw_wins?: number
  rank?: number
}

interface EnrichmentRow {
  id: string
  last_seen_at: string | null
  clan_id: string | null
  clans: { name: string; slug: string }[] | { name: string; slug: string } | null
}

async function enrichRankingRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: RankingRow[],
) {
  if (rows.length === 0) return []
  const ids = rows.map((r) => r.id)

  const [{ data: profileExtras }, { data: achCounts }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, last_seen_at, clan_id, clans!profiles_clan_id_fkey(name, slug)')
      .in('id', ids),
    supabase
      .from('user_achievements')
      .select('user_id')
      .in('user_id', ids),
  ])

  const extraMap = new Map<string, EnrichmentRow>()
  for (const p of (profileExtras ?? []) as EnrichmentRow[]) {
    extraMap.set(p.id, p)
  }
  const achMap = new Map<string, number>()
  for (const row of (achCounts ?? []) as { user_id: string }[]) {
    achMap.set(row.user_id, (achMap.get(row.user_id) ?? 0) + 1)
  }

  return rows.map((row) => {
    const extra = extraMap.get(row.id)
    const clan = Array.isArray(extra?.clans) ? extra?.clans[0] : extra?.clans
    return {
      ...row,
      last_seen_at: extra?.last_seen_at ?? null,
      clan_name: clan?.name ?? null,
      clan_slug: clan?.slug ?? null,
      achievement_count: achMap.get(row.id) ?? 0,
      cotw_count: row.cotw_wins ?? 0,
    }
  })
}

async function getSidebarData(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [
    { data: topClip },
    { data: topClan },
    { count: totalMembers },
    { count: totalClips },
    { count: totalPosts },
    { count: totalClans },
    { count: activeToday },
    { count: achievementsToday },
  ] = await Promise.all([
    supabase
      .from('clips')
      .select(`
        id, title, like_count, source_type,
        user:profiles!clips_user_id_fkey(username, display_name, accent_color),
        game:games(name)
      `)
      .order('like_count', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('clans')
      .select('id, name, slug, avatar_url, xp_total, member_count')
      .order('xp_total', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('clips').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('clans').select('*', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gt('last_seen_at', new Date(Date.now() - 86_400_000).toISOString()),
    supabase
      .from('user_achievements')
      .select('*', { count: 'exact', head: true })
      .gt('unlocked_at', new Date(Date.now() - 86_400_000).toISOString()),
  ])

  return {
    topClip,
    topClan,
    stats: {
      totalMembers: totalMembers ?? 0,
      totalClips: totalClips ?? 0,
      totalPosts: totalPosts ?? 0,
      totalClans: totalClans ?? 0,
      activeToday: activeToday ?? 0,
      achievementsToday: achievementsToday ?? 0,
    },
  }
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
        .select('*')
        .order('rank', { ascending: true })
        .limit(5)
      return NextResponse.json({ data: data ?? [], isGuest: true })
    }

    // Zoekfunctie alleen op global
    if (search && tab === 'global') {
      const { data, error } = await supabase.rpc('search_ranking_global', {
        search_term: search,
      })
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

    // Global tab: per-row enrichment + sidebar data
    const isGlobal = tab === 'global'
    const enriched = isGlobal
      ? await enrichRankingRows(supabase, (data ?? []) as RankingRow[])
      : (data ?? [])

    const sidebar = isGlobal ? await getSidebarData(supabase) : null

    // Eigen positie ophalen (alleen global tab)
    let myPosition = null
    if (isGlobal) {
      const { data: me } = await supabase
        .from('ranking_global')
        .select('rank,xp,level_name,cotw_wins')
        .eq('id', user.id)
        .maybeSingle()
      myPosition = me
    }

    return NextResponse.json({
      data: enriched,
      myPosition,
      sidebar,
      pagination: { page, total: count ?? 0, pageSize: PAGE_SIZE },
    })
  } catch (error) {
    await logApiError('/api/ranking', 'GET', 500, error)
    console.error('Ranking API error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
