import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { logApiError } from '@/lib/logError'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: clan, error } = await supabase
      .from('clans')
      .select(`
        id, name, slug, description, avatar_url, banner_url,
        is_open, member_count, max_members, xp_total, created_at,
        owner:profiles!clans_owner_id_fkey(
          id, username, display_name, avatar_url, accent_color
        )
      `)
      .eq('slug', slug)
      .maybeSingle()

    if (error) throw error
    if (!clan) return NextResponse.json({ error: 'Clan not found' }, { status: 404 })

    const { data: members } = await supabase
      .from('clan_members')
      .select(`
        id, role, joined_at,
        user:profiles!clan_members_user_id_fkey(
          id, username, display_name, avatar_url,
          accent_color, is_verified, level_name, xp, last_seen_at
        )
      `)
      .eq('clan_id', clan.id)
      .order('role', { ascending: true })
      .order('joined_at', { ascending: true })

    const { data: quests } = await supabase
      .from('clan_quests')
      .select('*')
      .eq('clan_id', clan.id)
      .eq('week_start', new Date().toISOString().slice(0, 10))
      .order('quest_type', { ascending: true })

    const { data: activeWar } = await supabase
      .from('clan_wars')
      .select(`
        id, status, challenger_score, challenged_score,
        starts_at, ends_at,
        challenger:clans!clan_wars_challenger_id_fkey(id, name, slug, avatar_url),
        challenged:clans!clan_wars_challenged_id_fkey(id, name, slug, avatar_url)
      `)
      .or(`challenger_id.eq.${clan.id},challenged_id.eq.${clan.id}`)
      .eq('status', 'active')
      .maybeSingle()

    const { data: xpHistory } = await supabase
      .from('clan_xp_events')
      .select(`
        id, amount, source, created_at,
        user:profiles!clan_xp_events_user_id_fkey(username, avatar_url)
      `)
      .eq('clan_id', clan.id)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: membership } = await supabase
      .from('clan_members')
      .select('id, role')
      .eq('clan_id', clan.id)
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({
      clan,
      members: members ?? [],
      quests: quests ?? [],
      activeWar,
      xpHistory: xpHistory ?? [],
      membership,
    })
  } catch (error) {
    await logApiError('/api/clans/[slug]', 'GET', 500, error)
    console.error('Clan detail GET error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
