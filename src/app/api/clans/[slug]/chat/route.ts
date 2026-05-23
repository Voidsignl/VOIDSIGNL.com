import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { clanMessageSchema } from '@/lib/validations'
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: clan } = await supabase
      .from('clans')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!clan) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data, error } = await supabase
      .from('clan_messages')
      .select(`
        id, content, created_at, user_id,
        user:profiles!clan_messages_user_id_fkey(
          id, username, display_name, avatar_url, accent_color
        )
      `)
      .eq('clan_id', clan.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return NextResponse.json({ data: (data ?? []).reverse() })
  } catch (error) {
    console.error('Clan chat GET error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const limit = checkRateLimit(ip, 'api')
    if (!limit.allowed) return rateLimitResponse(limit.resetAt)

    const { slug } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: clan } = await supabase
      .from('clans')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!clan) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const parsed = clanMessageSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { data, error } = await supabase
      .from('clan_messages')
      .insert({ clan_id: clan.id, user_id: user.id, content: parsed.data.content })
      .select(`
        id, content, created_at, user_id,
        user:profiles!clan_messages_user_id_fkey(
          id, username, display_name, avatar_url, accent_color
        )
      `)
      .single()

    if (error) throw error
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Clan chat POST error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
