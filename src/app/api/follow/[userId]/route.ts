import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'

const PAGE_SIZE = 30

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const limit = checkRateLimit(ip, 'api')
    if (!limit.allowed) return rateLimitResponse(limit.resetAt)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { userId } = await params
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') ?? 'followers'
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const offset = (page - 1) * PAGE_SIZE

    let users: any[] = []
    let count = 0

    if (type === 'followers') {
      const { data, error, count: c } = await supabase
        .from('follows')
        .select(`
          id, created_at,
          follower:profiles!follows_follower_id_fkey(
            id, username, display_name, avatar_url,
            accent_color, is_verified, is_inner_circle,
            level_name, follower_count
          )
        `, { count: 'exact' })
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)
      if (error) throw error
      users = (data ?? []).map((f: any) => f.follower)
      count = c ?? 0

    } else {
      const { data, error, count: c } = await supabase
        .from('follows')
        .select(`
          id, created_at,
          following:profiles!follows_following_id_fkey(
            id, username, display_name, avatar_url,
            accent_color, is_verified, is_inner_circle,
            level_name, follower_count
          )
        `, { count: 'exact' })
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)
      if (error) throw error
      users = (data ?? []).map((f: any) => f.following)
      count = c ?? 0
    }

    const userIds = users.map((u: any) => u?.id).filter(Boolean) as string[]
    let followingIds = new Set<string>()

    if (userIds.length > 0) {
      const { data: myFollowing } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', userIds)
      followingIds = new Set((myFollowing ?? []).map((f: { following_id: string }) => f.following_id))
    }

    const enriched = users
      .filter(Boolean)
      .map((u: any) => ({
        ...u,
        is_following: followingIds.has(u.id),
        is_self: u.id === user.id,
      }))

    return NextResponse.json({
      data: enriched,
      pagination: { page, total: count, pageSize: PAGE_SIZE },
    })

  } catch (error) {
    console.error('Follow list error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
