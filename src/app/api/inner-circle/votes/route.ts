import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const voteSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(2000),
  vote_type: z.enum(['simple', 'upgrade_request', 'platform_decision']),
  target_user_id: z.string().uuid().optional(),
  target_mod_level: z.number().int().min(2).max(4).optional(),
  quorum_pct: z.number().int().min(50).max(100).default(60),
  closes_at: z.string().datetime(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_inner_circle')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.is_inner_circle) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = voteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { data, error } = await supabase
      .from('ic_votes')
      .insert({ ...parsed.data, created_by: user.id })
      .select()
      .single()

    if (error) throw error

    // Alle IC-leden notificeren (behalve creator)
    const { data: icMembers } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_inner_circle', true)
      .neq('id', user.id)

    for (const member of icMembers ?? []) {
      await supabase.rpc('create_notification', {
        target_user_id: member.id,
        notif_type: 'ic_vote_new',
        notif_title: 'Nieuw voorstel in de Inner Circle',
        notif_body: parsed.data.title,
        notif_link: `/inner-circle/votes/${data.id}`,
      })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('IC vote POST error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 },
    )
  }
}
