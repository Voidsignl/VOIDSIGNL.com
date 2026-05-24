import { createClient } from '@/lib/supabase-server'
import { getAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { fetchCoverByName } from '@/lib/igdb'

type Tab = 'overview' | 'players' | 'clips' | 'forum' | 'coaches'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { searchParams } = new URL(req.url)
    const tab = (searchParams.get('tab') ?? 'overview') as Tab
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))

    const { data: game, error } = await supabase
      .from('games')
      .select('*')
      .eq('slug', slug)
      .eq('is_approved', true)
      .maybeSingle()

    if (error) throw error
    if (!game) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Cover on-demand fetch als die nog null is
    let coverUrl = game.cover_url
    if (!coverUrl && process.env.IGDB_CLIENT_ID) {
      coverUrl = await fetchCoverByName(game.name)
      if (coverUrl) {
        const admin = getAdminClient()
        await admin
          .from('games')
          .update({
            cover_url: coverUrl,
            cover_fetched_at: new Date().toISOString(),
          })
          .eq('id', game.id)
      }
    }

    // Forum categorie voor dit game
    const { data: forumCategory } = await supabase
      .from('forum_categories')
      .select('id, name, slug, thread_count')
      .eq('game_id', game.id)
      .maybeSingle()

    // Library status van huidige user
    let userGame = null
    if (user) {
      const { data: ug } = await supabase
        .from('user_games')
        .select('id, rank, is_main, hours_played')
        .eq('user_id', user.id)
        .eq('game_id', game.id)
        .maybeSingle()
      userGame = ug
    }

    // Stats — altijd ophalen voor de hero
    const [
      { count: playerCount },
      { count: clipCount },
      { count: coachCount },
    ] = await Promise.all([
      supabase
        .from('user_games')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', game.id),
      supabase
        .from('clips')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', game.id),
      supabase
        .from('coach_games')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', game.id),
    ])

    let tabData: Record<string, unknown> = {}

    if (tab === 'overview') {
      const [
        { data: topPlayersRaw },
        { data: lfgPlayersRaw },
        { data: gameClansRaw },
        { data: recentPosts },
      ] = await Promise.all([
        supabase
          .from('user_games')
          .select(`
            rank,
            user:profiles!user_games_user_id_fkey(
              id, username, display_name, avatar_url,
              accent_color, is_verified, is_founding_member,
              level_name, xp, last_seen_at
            )
          `)
          .eq('game_id', game.id)
          .limit(5),
        supabase
          .from('user_games')
          .select(`
            rank,
            user:profiles!user_games_user_id_fkey(
              id, username, display_name, avatar_url,
              accent_color, level_name, last_seen_at, clan_id
            )
          `)
          .eq('game_id', game.id)
          .limit(20),
        supabase
          .from('user_games')
          .select(`
            user:profiles!user_games_user_id_fkey(
              clan:clans!profiles_clan_id_fkey(
                id, name, slug, avatar_url, member_count, xp_total
              )
            )
          `)
          .eq('game_id', game.id)
          .limit(40),
        supabase
          .from('posts')
          .select(`
            id, content, created_at,
            user:profiles!posts_user_id_fkey(
              id, username, display_name, avatar_url, accent_color
            )
          `)
          .eq('game_id', game.id)
          .order('created_at', { ascending: false })
          .limit(3),
      ])

      type PlayerJoin = { rank: string | null; user: Record<string, unknown> | null }
      const topPlayers = ((topPlayersRaw as PlayerJoin[] | null) ?? [])
        .filter((p) => p.user)
        .map((p) => ({ ...(p.user as Record<string, unknown>), rank: p.rank }))

      // Online = laatste 5 minuten actief (LFG)
      const fiveMinAgo = Date.now() - 5 * 60 * 1000
      const lfgPlayers = ((lfgPlayersRaw as PlayerJoin[] | null) ?? [])
        .filter((p) => {
          const seen = (p.user as Record<string, unknown> | null)?.last_seen_at
          if (!seen || typeof seen !== 'string') return false
          return new Date(seen).getTime() > fiveMinAgo
        })
        .slice(0, 8)
        .map((p) => ({ ...(p.user as Record<string, unknown>), rank: p.rank }))

      // Dedupliceer clans
      const clanMap = new Map<string, Record<string, unknown>>()
      type ClanJoin = {
        user: { clan: Record<string, unknown> | null } | null
      }
      for (const row of (gameClansRaw as ClanJoin[] | null) ?? []) {
        const clan = row.user?.clan
        if (clan && typeof clan === 'object' && 'id' in clan) {
          const cid = String((clan as { id: unknown }).id)
          if (!clanMap.has(cid)) clanMap.set(cid, clan as Record<string, unknown>)
        }
      }

      tabData = {
        topPlayers,
        lfgPlayers,
        clans: Array.from(clanMap.values()).slice(0, 4),
        recentPosts: recentPosts ?? [],
        forumCategory,
      }
    } else if (tab === 'players') {
      const PAGE_SIZE = 20
      const offset = (page - 1) * PAGE_SIZE

      const { data: playersRaw, count } = await supabase
        .from('user_games')
        .select(`
          rank, is_main, hours_played, updated_at,
          user:profiles!user_games_user_id_fkey(
            id, username, display_name, avatar_url,
            accent_color, is_verified, is_founding_member,
            level_name, xp, last_seen_at,
            clan:clans!profiles_clan_id_fkey(name, slug)
          )
        `, { count: 'exact' })
        .eq('game_id', game.id)
        .order('updated_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)

      type PlayerRow = {
        rank: string | null
        is_main: boolean
        hours_played: number | null
        user: (Record<string, unknown> & {
          clan?: { name: string; slug: string } | null
        }) | null
      }

      tabData = {
        players: ((playersRaw as PlayerRow[] | null) ?? [])
          .filter((p) => p.user)
          .map((p) => ({
            ...(p.user as Record<string, unknown>),
            rank: p.rank,
            is_main: p.is_main,
            hours_played: p.hours_played,
            clan_name: p.user?.clan?.name ?? null,
            clan_slug: p.user?.clan?.slug ?? null,
          })),
        pagination: { page, total: count ?? 0, pageSize: PAGE_SIZE },
      }
    } else if (tab === 'clips') {
      const PAGE_SIZE = 12
      const offset = (page - 1) * PAGE_SIZE

      const { data: clips, count } = await supabase
        .from('clips')
        .select(`
          id, title, thumbnail_url, source_type,
          like_count, view_count, is_cotw, created_at,
          user:profiles!clips_user_id_fkey(
            id, username, display_name, avatar_url, accent_color
          )
        `, { count: 'exact' })
        .eq('game_id', game.id)
        .order('like_count', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)

      tabData = {
        clips: clips ?? [],
        pagination: { page, total: count ?? 0, pageSize: PAGE_SIZE },
      }
    } else if (tab === 'forum') {
      if (forumCategory) {
        const PAGE_SIZE = 15
        const offset = (page - 1) * PAGE_SIZE

        const { data: threads, count } = await supabase
          .from('forum_threads')
          .select(`
            id, title, body, is_pinned, is_locked,
            reply_count, view_count, last_reply_at, created_at,
            author:profiles!forum_threads_author_id_fkey(
              id, username, display_name, avatar_url, accent_color, level_name
            )
          `, { count: 'exact' })
          .eq('category_id', forumCategory.id)
          .order('is_pinned', { ascending: false })
          .order('last_reply_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1)

        tabData = {
          category: forumCategory,
          threads: threads ?? [],
          pagination: { page, total: count ?? 0, pageSize: PAGE_SIZE },
        }
      } else {
        tabData = {
          category: null,
          threads: [],
          pagination: { page: 1, total: 0, pageSize: 15 },
        }
      }
    } else if (tab === 'coaches') {
      const { data: coachesRaw } = await supabase
        .from('coach_games')
        .select(`
          rank_info,
          coach:profiles!coach_games_coach_id_fkey(
            id, username, display_name, avatar_url, accent_color, is_verified
          ),
          coach_profile:coach_profiles!coach_games_coach_id_fkey(
            avg_rating, total_sessions, is_approved, is_active,
            price_basic, price_standard, price_premium, bio, languages
          )
        `)
        .eq('game_id', game.id)

      type CoachJoin = {
        rank_info: string | null
        coach: Record<string, unknown> | null
        coach_profile: {
          avg_rating: number | null
          total_sessions: number | null
          is_approved: boolean
          is_active: boolean
          price_basic: number | null
          bio: string | null
          languages: string[] | null
        } | null
      }

      tabData = {
        coaches: ((coachesRaw as CoachJoin[] | null) ?? [])
          .filter(
            (c) => c.coach_profile?.is_approved && c.coach_profile?.is_active,
          )
          .map((c) => ({
            ...(c.coach as Record<string, unknown>),
            rank_info: c.rank_info,
            avg_rating: c.coach_profile?.avg_rating ?? 0,
            total_sessions: c.coach_profile?.total_sessions ?? 0,
            price_basic: c.coach_profile?.price_basic ?? 10,
            bio: c.coach_profile?.bio,
            languages: c.coach_profile?.languages ?? [],
          })),
      }
    }

    return NextResponse.json({
      game: { ...game, cover_url: coverUrl },
      userGame,
      stats: {
        players: playerCount ?? 0,
        clips: clipCount ?? 0,
        coaches: coachCount ?? 0,
        threads: forumCategory?.thread_count ?? 0,
      },
      forumCategory,
      tab,
      ...tabData,
    })
  } catch (error) {
    console.error('Game detail error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
