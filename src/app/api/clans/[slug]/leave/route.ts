import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
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
      .select('id, owner_id')
      .eq('slug', slug)
      .maybeSingle()

    if (!clan) return NextResponse.json({ error: 'Clan not found' }, { status: 404 })

    if (clan.owner_id === user.id) {
      return NextResponse.json({
        error: 'Als owner kun je de clan niet verlaten. Draag het eigendom over of verwijder de clan.',
      }, { status: 400 })
    }

    const { error } = await supabase.from('clan_members')
      .delete()
      .eq('clan_id', clan.id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ left: true })
  } catch (error) {
    console.error('Clan leave error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
