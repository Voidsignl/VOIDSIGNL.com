import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: existingMember } = await supabase
      .from('clan_members')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingMember) {
      return NextResponse.json({ error: 'Je bent al lid van een clan' }, { status: 400 })
    }

    const { data: clan } = await supabase
      .from('clans')
      .select('id, is_open, member_count, max_members, owner_id, name')
      .eq('slug', slug)
      .maybeSingle()

    if (!clan) return NextResponse.json({ error: 'Clan not found' }, { status: 404 })

    if (clan.member_count >= clan.max_members) {
      return NextResponse.json({ error: 'Clan is vol' }, { status: 400 })
    }

    if (clan.is_open) {
      const { error: insertError } = await supabase.from('clan_members').insert({
        clan_id: clan.id,
        user_id: user.id,
        role: 'member',
      })
      if (insertError) throw insertError

      const { data: joiner } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle()

      await supabase.rpc('create_notification', {
        target_user_id: clan.owner_id,
        notif_type: 'clan_join',
        notif_title: 'Nieuw clan lid',
        notif_body: `${joiner?.username ?? 'iemand'} heeft zich aangesloten bij ${clan.name}`,
        notif_link: `/clans/${slug}`,
      })

      return NextResponse.json({ joined: true })
    } else {
      const body = await req.json().catch(() => ({}))
      const { error: reqError } = await supabase.from('clan_join_requests').insert({
        clan_id: clan.id,
        user_id: user.id,
        message: body.message ?? null,
      })
      if (reqError) {
        if (reqError.code === '23505') {
          return NextResponse.json({ error: 'Je hebt al een aanvraag ingediend' }, { status: 409 })
        }
        throw reqError
      }
      return NextResponse.json({ requested: true })
    }
  } catch (error) {
    console.error('Clan join error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
