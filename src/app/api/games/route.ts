import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { logApiError } from '@/lib/logError'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const sort = searchParams.get('sort') ?? 'players'

    let query = supabase
      .from('games')
      .select('id, name, slug, cover_url, description, genre, platforms, release_year, player_count, rank_set, created_at')
      .eq('is_approved', true)

    if (sort === 'players')      query = query.order('player_count', { ascending: false })
    else if (sort === 'name')    query = query.order('name', { ascending: true })
    else                         query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data: data ?? [] })
  } catch (error) {
    await logApiError('/api/games', 'GET', 500, error)
    console.error('Games GET error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
