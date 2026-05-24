import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Publieke homepage data — geen auth nodig.
// We gebruiken de anon key zodat RLS gehandhaafd blijft.
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const [
      { data: phaseStats },
      { data: phases },
      { data: topPlayers },
      { data: innerCircle },
      { count: totalClans },
      { count: totalClips },
    ] = await Promise.all([
      supabase.rpc('get_phase_stats'),
      supabase
        .from('access_phases')
        .select('phase, name, description, limit_count, is_active')
        .eq('is_visible', true)
        .order('phase'),
      supabase
        .from('profiles')
        .select(
          'username, display_name, avatar_url, accent_color, level_name, xp, is_inner_circle, is_verified',
        )
        .eq('is_onboarded', true)
        .order('xp', { ascending: false })
        .limit(5),
      supabase
        .from('profiles')
        .select(
          'username, display_name, avatar_url, accent_color, xp, level_name',
        )
        .eq('is_inner_circle', true)
        .order('created_at', { ascending: true })
        .limit(5),
      supabase.from('clans').select('*', { count: 'exact', head: true }),
      supabase.from('clips').select('*', { count: 'exact', head: true }),
    ])

    return NextResponse.json(
      {
        phaseStats,
        phases: phases ?? [],
        topPlayers: topPlayers ?? [],
        innerCircle: innerCircle ?? [],
        totalClans: totalClans ?? 0,
        totalClips: totalClips ?? 0,
      },
      {
        headers: {
          'Cache-Control': 's-maxage=60, stale-while-revalidate=30',
        },
      },
    )
  } catch (error) {
    console.error('Home API error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 },
    )
  }
}
