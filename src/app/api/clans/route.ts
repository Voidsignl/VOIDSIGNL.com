import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { clanCreateSchema } from '@/lib/validations'
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const sort = searchParams.get('sort') ?? 'xp'
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const PAGE_SIZE = 20
    const offset = (page - 1) * PAGE_SIZE

    let query = supabase
      .from('clans')
      .select(`
        id, name, slug, description, avatar_url, banner_url,
        is_open, member_count, max_members, xp_total, created_at,
        owner:profiles!clans_owner_id_fkey(
          id, username, display_name, avatar_url
        )
      `, { count: 'exact' })

    if (sort === 'xp') query = query.order('xp_total', { ascending: false })
    else if (sort === 'members') query = query.order('member_count', { ascending: false })
    else query = query.order('created_at', { ascending: false })

    const { data, error, count } = await query.range(offset, offset + PAGE_SIZE - 1)
    if (error) throw error

    return NextResponse.json({
      data,
      pagination: { page, total: count ?? 0, pageSize: PAGE_SIZE },
    })
  } catch (error) {
    console.error('Clans GET error:', error)
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, is_inner_circle')
      .eq('id', user.id)
      .maybeSingle()

    // IC-leden mogen meerdere clans aanmaken / lid zijn van meerdere
    if (!profile?.is_inner_circle) {
      const { data: existing } = await supabase
        .from('clan_members')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing) {
        return NextResponse.json(
          { error: 'Je bent al lid van een clan' },
          { status: 400 },
        )
      }

      const { data: ownedClan } = await supabase
        .from('clans')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (ownedClan) {
        return NextResponse.json(
          { error: 'Je kunt maar 1 clan aanmaken' },
          { status: 400 },
        )
      }
    }

    if (!profile || (profile.xp ?? 0) < 500) {
      return NextResponse.json({
        error: 'Je hebt minimaal 500 XP nodig om een clan aan te maken',
      }, { status: 400 })
    }

    const body = await req.json()
    const parsed = clanCreateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { data, error } = await supabase
      .from('clans')
      .insert({ ...parsed.data, owner_id: user.id })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Deze clan naam of slug is al bezet' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Clan POST error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
