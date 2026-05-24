import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { buddyRequestSchema } from '@/lib/validations'
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const limit = checkRateLimit(ip, 'api')
    if (!limit.allowed) return rateLimitResponse(limit.resetAt)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = buddyRequestSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { receiver_id, message } = parsed.data

    if (receiver_id === user.id) {
      return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('buddy_requests')
      .select('id, status')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiver_id}),and(sender_id.eq.${receiver_id},receiver_id.eq.${user.id})`)
      .maybeSingle()

    if (existing) {
      if (existing.status === 'accepted') {
        return NextResponse.json({ error: 'Already buddies' }, { status: 400 })
      }
      if (existing.status === 'pending') {
        return NextResponse.json({ error: 'Request already sent' }, { status: 400 })
      }
    }

    const { data, error } = await supabase
      .from('buddy_requests')
      .insert({
        sender_id: user.id,
        receiver_id,
        message: message ?? null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data }, { status: 201 })

  } catch (error) {
    console.error('Buddy request error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const limit = checkRateLimit(ip, 'api')
    if (!limit.allowed) return rateLimitResponse(limit.resetAt)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') ?? 'received' // received | sent | accepted

    let query = supabase
      .from('buddy_requests')
      .select(`
        id, status, message, created_at,
        sender:profiles!buddy_requests_sender_id_fkey(
          id, username, display_name, avatar_url, level, level_name, is_verified, is_inner_circle, accent_color, last_seen_at, platforms, buddy_playtimes, preferred_language
        ),
        receiver:profiles!buddy_requests_receiver_id_fkey(
          id, username, display_name, avatar_url, level, level_name, is_verified, is_inner_circle, accent_color, last_seen_at, platforms, buddy_playtimes, preferred_language
        )
      `)

    if (type === 'received') {
      query = query.eq('receiver_id', user.id).eq('status', 'pending')
    } else if (type === 'sent') {
      query = query.eq('sender_id', user.id).eq('status', 'pending')
    } else {
      query = query
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted')
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error

    return NextResponse.json({ data: data ?? [] })

  } catch (error) {
    console.error('Buddy GET error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
