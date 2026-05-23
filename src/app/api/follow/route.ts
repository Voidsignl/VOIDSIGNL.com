import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const limit = checkRateLimit(ip, 'api')
    if (!limit.allowed) return rateLimitResponse(limit.resetAt)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { following_id } = await req.json()
    if (!following_id || typeof following_id !== 'string') {
      return NextResponse.json({ error: 'following_id required' }, { status: 400 })
    }
    if (following_id === user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', following_id)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', following_id)
      return NextResponse.json({ following: false })
    }

    const { error } = await supabase.from('follows').insert({
      follower_id: user.id,
      following_id,
    })
    if (error) throw error
    return NextResponse.json({ following: true })

  } catch (error) {
    console.error('Follow error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
