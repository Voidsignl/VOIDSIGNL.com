import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const limit = checkRateLimit(ip, 'api')
    if (!limit.allowed) return rateLimitResponse(limit.resetAt)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') ?? 'accepted' // accepted | pending

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id, status, last_message_at, last_message_preview,
        user_a, user_b,
        unread_count_a, unread_count_b, request_from, created_at,
        user_a_profile:profiles!conversations_user_a_fkey(
          id, username, display_name, avatar_url, accent_color,
          is_verified, last_seen_at
        ),
        user_b_profile:profiles!conversations_user_b_fkey(
          id, username, display_name, avatar_url, accent_color,
          is_verified, last_seen_at
        )
      `)
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .eq('status', type)
      .eq('is_group', false)
      .order('last_message_at', { ascending: false })

    if (error) throw error

    const enriched = (data ?? []).map((conv: any) => ({
      ...conv,
      unread_count: conv.user_a === user.id ? conv.unread_count_a : conv.unread_count_b,
      other_user: conv.user_a === user.id ? conv.user_b_profile : conv.user_a_profile,
    }))

    const { data: unreadTotal } = await supabase
      .rpc('get_unread_message_count', { p_user_id: user.id })

    return NextResponse.json({ data: enriched, unread_total: unreadTotal ?? 0 })

  } catch (error) {
    console.error('Messages GET error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
