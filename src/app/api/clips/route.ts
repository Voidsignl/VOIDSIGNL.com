import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { clipCreateSchema } from '@/lib/validations'
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'
import { logApiError } from '@/lib/logError'

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const limit = checkRateLimit(ip, 'api')
    if (!limit.allowed) return rateLimitResponse(limit.resetAt)

    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const gameId = searchParams.get('game_id')
    const sort = searchParams.get('sort') ?? 'newest'
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const userId = searchParams.get('user_id')
    const offset = (page - 1) * PAGE_SIZE

    let query = supabase
      .from('clips')
      .select(`
        id, title, description, video_url, thumbnail_url, source_type,
        like_count, view_count, comment_count, nomination_count,
        is_cotw, is_pinned, week_start, created_at,
        game:games(id, name),
        user:profiles(id, username, display_name, avatar_url, accent_color, is_verified)
      `, { count: 'exact' })

    if (gameId) query = query.eq('game_id', gameId)
    if (userId) query = query.eq('user_id', userId)

    if (sort === 'likes')      query = query.order('like_count', { ascending: false })
    else if (sort === 'views') query = query.order('view_count', { ascending: false })
    else                       query = query.order('created_at', { ascending: false })

    const { data, error, count } = await query.range(offset, offset + PAGE_SIZE - 1)
    if (error) throw error

    const { data: cotw } = await supabase
      .from('clips')
      .select(`
        id, title, video_url, thumbnail_url, source_type,
        like_count, view_count, is_cotw, created_at,
        game:games(id, name),
        user:profiles(id, username, display_name, avatar_url, accent_color)
      `)
      .eq('is_cotw', true)
      .maybeSingle()

    // Games dropdown
    const { data: games } = await supabase
      .from('games')
      .select('id, name')
      .eq('is_approved', true)
      .order('name')

    return NextResponse.json({
      data: data ?? [],
      cotw,
      games: games ?? [],
      pagination: { page, total: count ?? 0, pageSize: PAGE_SIZE },
    })

  } catch (error) {
    await logApiError('/api/clips', 'GET', 500, error)
    console.error('Clips GET error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const limit = checkRateLimit(ip, 'upload')
    if (!limit.allowed) return rateLimitResponse(limit.resetAt)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = clipCreateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    if (!parsed.data.video_url) {
      return NextResponse.json({ error: 'video_url required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('clips')
      .insert({ ...parsed.data, user_id: user.id })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data }, { status: 201 })

  } catch (error) {
    await logApiError('/api/clips', 'POST', 500, error)
    console.error('Clips POST error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
