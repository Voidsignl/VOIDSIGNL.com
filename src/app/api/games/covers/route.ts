import { createClient } from '@/lib/supabase-server'
import { getAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { fetchCoverByName } from '@/lib/igdb'

interface PostBody {
  game_id?: string
  game_name?: string
}

/**
 * POST: haalt cover op voor één game en slaat hem op.
 * Bedoeld voor on-demand fetch wanneer een speler een gameprofiel
 * opent en de cover ontbreekt.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await req.json()) as PostBody
    const { game_id, game_name } = body
    if (!game_id || !game_name) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    }

    const coverUrl = await fetchCoverByName(game_name)

    if (coverUrl) {
      // Service-role insert om RLS te omzeilen voor admin-loze save
      const admin = getAdminClient()
      await admin
        .from('games')
        .update({
          cover_url: coverUrl,
          cover_fetched_at: new Date().toISOString(),
        })
        .eq('id', game_id)
    }

    return NextResponse.json({ cover_url: coverUrl })
  } catch (error) {
    console.error('Cover fetch error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

/**
 * GET: admin-only batch. Haalt covers op voor alle approved games
 * zonder cover (max 20 per call) en cacht ze in de DB.
 */
export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: games } = await supabase
      .from('games')
      .select('id, name, slug')
      .eq('is_approved', true)
      .is('cover_url', null)
      .limit(20)

    if (!games?.length) {
      return NextResponse.json({ message: 'Alle covers al opgehaald', updated: 0 })
    }

    const admin = getAdminClient()
    let updated = 0
    for (const game of games) {
      const coverUrl = await fetchCoverByName(game.name)
      if (coverUrl) {
        await admin
          .from('games')
          .update({
            cover_url: coverUrl,
            cover_fetched_at: new Date().toISOString(),
          })
          .eq('id', game.id)
        updated++
      }
      await new Promise((r) => setTimeout(r, 200))
    }

    return NextResponse.json({
      message: `${updated} covers opgehaald`,
      updated,
    })
  } catch (error) {
    console.error('Batch cover error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
