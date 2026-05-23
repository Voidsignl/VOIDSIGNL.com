import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { clanWarSchema } from '@/lib/validations'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: clan } = await supabase
      .from('clans')
      .select('id, name')
      .eq('slug', slug)
      .maybeSingle()

    if (!clan) return NextResponse.json({ error: 'Clan not found' }, { status: 404 })

    const { data: membership } = await supabase
      .from('clan_members')
      .select('role')
      .eq('clan_id', clan.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership || !['owner', 'officer'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Alleen owners en officers kunnen een war starten' },
        { status: 403 },
      )
    }

    const { data: existingWar } = await supabase
      .from('clan_wars')
      .select('id')
      .or(`challenger_id.eq.${clan.id},challenged_id.eq.${clan.id}`)
      .eq('status', 'active')
      .maybeSingle()

    if (existingWar) {
      return NextResponse.json({ error: 'Jullie clan heeft al een actieve war' }, { status: 400 })
    }

    const body = await req.json()
    const parsed = clanWarSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    if (parsed.data.challenged_clan_id === clan.id) {
      return NextResponse.json({ error: 'Je kunt niet tegen je eigen clan strijden' }, { status: 400 })
    }

    const { data: war, error } = await supabase
      .from('clan_wars')
      .insert({
        challenger_id: clan.id,
        challenged_id: parsed.data.challenged_clan_id,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    const { data: challengedClan } = await supabase
      .from('clans')
      .select('owner_id')
      .eq('id', parsed.data.challenged_clan_id)
      .maybeSingle()

    if (challengedClan) {
      await supabase.rpc('create_notification', {
        target_user_id: challengedClan.owner_id,
        notif_type: 'clan_war_challenge',
        notif_title: 'Clan war uitdaging!',
        notif_body: `${clan.name} heeft jullie uitgedaagd voor een clan war.`,
        notif_link: `/clans/${slug}`,
      })
    }

    return NextResponse.json({ data: war }, { status: 201 })
  } catch (error) {
    console.error('Clan war POST error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  _ctx: { params: Promise<{ slug: string }> },
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { war_id, action } = await req.json()
    if (typeof war_id !== 'string' || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const startsAt = new Date()
    const endsAt = new Date(startsAt.getTime() + 7 * 24 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('clan_wars')
      .update({
        status: action === 'accept' ? 'active' : 'declined',
        starts_at: action === 'accept' ? startsAt.toISOString() : null,
        ends_at: action === 'accept' ? endsAt.toISOString() : null,
      })
      .eq('id', war_id)
      .select()
      .maybeSingle()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Clan war PATCH error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
