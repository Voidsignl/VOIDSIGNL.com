import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { slug } = await params

    const { data: game, error } = await supabase
      .from('games')
      .select('*')
      .eq('slug', slug)
      .eq('is_approved', true)
      .maybeSingle()

    if (error) throw error
    if (!game) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: topPlayers } = await supabase
      .from('user_games')
      .select(`
        rank,
        user:profiles!user_games_user_id_fkey(
          id, username, display_name, avatar_url,
          accent_color, is_verified, level_name, xp
        )
      `)
      .eq('game_id', game.id)
      .order('created_at', { ascending: true })
      .limit(10)

    const { data: coaches } = await supabase
      .from('coach_games')
      .select(`
        rank_info,
        coach:coach_profiles!coach_games_coach_id_fkey(
          avg_rating, total_sessions, is_approved, is_active,
          user:profiles!coach_profiles_user_id_fkey(
            id, username, display_name, avatar_url, accent_color
          )
        )
      `)
      .eq('game_id', game.id)
      .limit(6)

    const { data: clips } = await supabase
      .from('clips')
      .select(`
        id, title, thumbnail_url, source_type, like_count, view_count, is_cotw,
        user:profiles!clips_user_id_fkey(id, username, display_name, avatar_url)
      `)
      .eq('game_id', game.id)
      .order('created_at', { ascending: false })
      .limit(6)

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

    return NextResponse.json({
      game,
      topPlayers: (topPlayers ?? []).map((p: any) => ({ ...p.user, rank: p.rank })),
      coaches: (coaches ?? [])
        .filter((c: any) => c.coach?.is_approved && c.coach?.is_active)
        .map((c: any) => ({
          rank_info: c.rank_info,
          user: c.coach?.user,
          avg_rating: c.coach?.avg_rating,
          total_sessions: c.coach?.total_sessions,
        })),
      clips: clips ?? [],
      userGame,
    })

  } catch (error) {
    console.error('Game detail error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
