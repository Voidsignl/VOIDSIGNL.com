import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: clan } = await supabase
      .from('clans')
      .select('id, owner_id')
      .eq('slug', slug)
      .maybeSingle()
    if (!clan)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Alleen owner kan rollen aanpassen
    if (clan.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { user_id, role } = (await req.json()) as {
      user_id?: string
      role?: string
    }
    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }
    if (!['officer', 'member'].includes(role ?? '')) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    await supabase
      .from('clan_members')
      .update({ role })
      .eq('clan_id', clan.id)
      .eq('user_id', user_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Members PATCH error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: clan } = await supabase
      .from('clans')
      .select('id, owner_id')
      .eq('slug', slug)
      .maybeSingle()
    if (!clan)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: membership } = await supabase
      .from('clan_members')
      .select('role')
      .eq('clan_id', clan.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!['owner', 'officer'].includes(membership?.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { user_id } = (await req.json()) as { user_id?: string }
    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }

    // Owner kan niet verwijderd worden
    if (user_id === clan.owner_id) {
      return NextResponse.json(
        { error: 'Owner kan niet verwijderd worden' },
        { status: 400 },
      )
    }

    // Members mogen geen andere officers/owner verwijderen
    if (membership?.role === 'officer') {
      const { data: target } = await supabase
        .from('clan_members')
        .select('role')
        .eq('clan_id', clan.id)
        .eq('user_id', user_id)
        .maybeSingle()
      if (target?.role !== 'member') {
        return NextResponse.json(
          { error: 'Officers kunnen alleen members verwijderen' },
          { status: 403 },
        )
      }
    }

    await supabase
      .from('clan_members')
      .delete()
      .eq('clan_id', clan.id)
      .eq('user_id', user_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Members DELETE error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 },
    )
  }
}
