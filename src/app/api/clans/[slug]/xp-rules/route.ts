import { createClient } from '@/lib/supabase-server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateRuleSchema = z.object({
  action: z.string(),
  xp_amount: z.number().int().min(0).max(1000),
  is_enabled: z.boolean(),
})

async function getClanAndCheckMod(
  supabase: SupabaseClient,
  slug: string,
  userId: string,
) {
  const { data: clan } = await supabase
    .from('clans')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (!clan) return null

  const { data: membership } = await supabase
    .from('clan_members')
    .select('role')
    .eq('clan_id', clan.id)
    .eq('user_id', userId)
    .maybeSingle()

  const isMod = ['owner', 'officer'].includes(membership?.role ?? '')
  return { clan, isMod, role: membership?.role }
}

export async function GET(
  _req: NextRequest,
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

    const result = await getClanAndCheckMod(supabase, slug, user.id)
    if (!result)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: rules } = await supabase
      .from('clan_xp_rules')
      .select('*')
      .eq('clan_id', result.clan.id)
      .order('action')

    return NextResponse.json({
      rules: rules ?? [],
      can_edit: result.isMod,
    })
  } catch (error) {
    console.error('XP rules GET error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 },
    )
  }
}

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

    const result = await getClanAndCheckMod(supabase, slug, user.id)
    if (!result)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!result.isMod)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const updates = Array.isArray(body) ? body : [body]

    for (const update of updates) {
      const parsed = updateRuleSchema.safeParse(update)
      if (!parsed.success) continue

      await supabase.from('clan_xp_rules').upsert(
        {
          clan_id: result.clan.id,
          action: parsed.data.action,
          xp_amount: parsed.data.xp_amount,
          is_enabled: parsed.data.is_enabled,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        },
        { onConflict: 'clan_id,action' },
      )
    }

    const { data: rules } = await supabase
      .from('clan_xp_rules')
      .select('*')
      .eq('clan_id', result.clan.id)
      .order('action')

    return NextResponse.json({ rules })
  } catch (error) {
    console.error('XP rules PATCH error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 },
    )
  }
}
