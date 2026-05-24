import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { postCreateSchema } from '@/lib/validations'
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'
import { logApiError } from '@/lib/logError'

const PAGE_SIZE = 20

const POST_SELECT = `
  id, content, images, image_url, video_url, post_type,
  like_count, comment_count, repost_count, is_auto_post,
  game_id, repost_id, created_at, updated_at,
  user:profiles!posts_user_id_fkey(
    id, username, display_name, avatar_url, accent_color,
    is_verified, is_inner_circle, level_name
  ),
  game:games(id, name),
  repost:posts!repost_id(
    id, content, images, post_type, created_at,
    user:profiles!posts_user_id_fkey(
      id, username, display_name, avatar_url, accent_color
    )
  )
`

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const limit = checkRateLimit(ip, 'api')
    if (!limit.allowed) return rateLimitResponse(limit.resetAt)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const tab = searchParams.get('tab') ?? 'global'
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const userId = searchParams.get('user_id')
    const offset = (page - 1) * PAGE_SIZE

    let posts: any[] = []
    let count = 0

    if (userId) {
      // Profielpagina posts
      const { data, error, count: c } = await supabase
        .from('posts')
        .select(POST_SELECT, { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)
      if (error) throw error
      posts = data ?? []
      count = c ?? 0

    } else if (tab === 'following') {
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      const followingIds = (following ?? []).map((f: { following_id: string }) => f.following_id)
      followingIds.push(user.id)

      const { data, error, count: c } = await supabase
        .from('posts')
        .select(POST_SELECT, { count: 'exact' })
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)
      if (error) throw error
      posts = data ?? []
      count = c ?? 0

    } else {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data, error, count: c } = await supabase
        .from('posts')
        .select(POST_SELECT, { count: 'exact' })
        .gte('created_at', sevenDaysAgo)
        .order('like_count', { ascending: false })
        .order('comment_count', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)
      if (error) throw error
      posts = data ?? []
      count = c ?? 0
    }

    const postIds = posts.map((p: { id: string }) => p.id)
    let likedIds = new Set<string>()

    if (postIds.length > 0) {
      const { data: liked } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds)
      likedIds = new Set((liked ?? []).map((l: { post_id: string }) => l.post_id))
    }

    const enriched = posts.map(p => ({ ...p, is_liked: likedIds.has(p.id) }))

    return NextResponse.json({
      data: enriched,
      pagination: { page, total: count, pageSize: PAGE_SIZE },
    })

  } catch (error) {
    await logApiError('/api/feed', 'GET', 500, error)
    console.error('Feed GET error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const limit = checkRateLimit(ip, 'api')
    if (!limit.allowed) return rateLimitResponse(limit.resetAt)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = postCreateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    // is_auto_post forceer false (alleen via DB triggers / service role)
    const { is_auto_post: _ignore, ...payload } = parsed.data
    void _ignore

    const { data, error } = await supabase
      .from('posts')
      .insert({ ...payload, is_auto_post: false, user_id: user.id })
      .select(POST_SELECT)
      .single()

    if (error) throw error
    return NextResponse.json({ data }, { status: 201 })

  } catch (error) {
    await logApiError('/api/feed', 'POST', 500, error)
    console.error('Feed POST error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
