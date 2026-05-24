import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { userGameSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id') ?? user.id

    const { data, error } = await supabase
      .from('user_games')
      .select(`
        id, rank, is_main, hours_played, created_at,
        game:games(id, name, slug, cover_url, genre, platforms, rank_set, custom_ranks, player_count)
      `)
      .eq('user_id', userId)
      .order('is_main', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) throw error
    return NextResponse.json({ data: data ?? [] })

  } catch (error) {
    console.error('Library GET error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = userGameSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    if (parsed.data.is_main) {
      await supabase
        .from('user_games')
        .update({ is_main: false })
        .eq('user_id', user.id)
    }

    const { data, error } = await supabase
      .from('user_games')
      .upsert({ user_id: user.id, ...parsed.data }, { onConflict: 'user_id,game_id' })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data }, { status: 201 })

  } catch (error) {
    console.error('Library POST error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { game_id, rank, is_main, hours_played } = body as {
      game_id?: string
      rank?: string | null
      is_main?: boolean
      hours_played?: number
    }
    if (!game_id) return NextResponse.json({ error: 'game_id required' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (rank !== undefined) updates.rank = rank
    if (is_main !== undefined) updates.is_main = is_main
    if (hours_played !== undefined) updates.hours_played = hours_played

    if (is_main === true) {
      await supabase
        .from('user_games')
        .update({ is_main: false })
        .eq('user_id', user.id)
    }

    const { data, error } = await supabase
      .from('user_games')
      .update(updates)
      .eq('user_id', user.id)
      .eq('game_id', game_id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })

  } catch (error) {
    console.error('Library PATCH error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    let game_id = searchParams.get('game_id')

    // Fallback: accept body for backwards compat
    if (!game_id) {
      try {
        const body = await req.json()
        game_id = body?.game_id ?? null
      } catch {
        // No body, that's fine
      }
    }

    if (!game_id) return NextResponse.json({ error: 'game_id required' }, { status: 400 })

    await supabase
      .from('user_games')
      .delete()
      .eq('user_id', user.id)
      .eq('game_id', game_id)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Library DELETE error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
