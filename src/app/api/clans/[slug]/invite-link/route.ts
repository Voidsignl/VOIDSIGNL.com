import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { logApiError } from '@/lib/logError'

function genCode(len = 8) {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let out = ''
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length]
  return out
}

async function loadClanAndCheckRole(slug: string, userId: string) {
  const supabase = await createClient()
  const { data: clan } = await supabase
    .from('clans')
    .select('id, slug, name')
    .eq('slug', slug)
    .maybeSingle()
  if (!clan) return { error: 'not_found' as const }

  const { data: membership } = await supabase
    .from('clan_members')
    .select('role')
    .eq('clan_id', clan.id)
    .eq('user_id', userId)
    .maybeSingle()

  if (!membership || !['owner', 'officer'].includes(membership.role)) {
    return { error: 'forbidden' as const }
  }
  return { clan, supabase }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const res = await loadClanAndCheckRole(slug, user.id)
    if ('error' in res) {
      return NextResponse.json({ error: res.error }, { status: res.error === 'not_found' ? 404 : 403 })
    }

    const { data, error } = await res.supabase
      .from('clan_invite_codes')
      .select('id, code, max_uses, uses, expires_at, created_at')
      .eq('clan_id', res.clan.id)
      .order('created_at', { ascending: false })
    if (error) throw error

    return NextResponse.json({ data: data ?? [] })
  } catch (error) {
    await logApiError('/api/clans/[slug]/invite-link', 'GET', 500, error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const res = await loadClanAndCheckRole(slug, user.id)
    if ('error' in res) {
      return NextResponse.json({ error: res.error }, { status: res.error === 'not_found' ? 404 : 403 })
    }

    const body = await req.json().catch(() => ({}))
    const maxUses = Math.max(0, Math.min(1000, Number(body.max_uses ?? 0)))
    const expiresDays = body.expires_in_days ? Math.max(1, Math.min(365, Number(body.expires_in_days))) : null
    const expiresAt = expiresDays ? new Date(Date.now() + expiresDays * 86_400_000).toISOString() : null

    // Try a few times in case of collision
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = genCode()
      const { data, error } = await res.supabase
        .from('clan_invite_codes')
        .insert({
          clan_id: res.clan.id,
          code,
          created_by: user.id,
          max_uses: maxUses,
          expires_at: expiresAt,
        })
        .select('id, code, max_uses, uses, expires_at, created_at')
        .single()

      if (!error) return NextResponse.json({ data }, { status: 201 })
      if (error.code !== '23505') throw error
    }
    return NextResponse.json({ error: 'Kon geen unieke code genereren' }, { status: 500 })
  } catch (error) {
    await logApiError('/api/clans/[slug]/invite-link', 'POST', 500, error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const res = await loadClanAndCheckRole(slug, user.id)
    if ('error' in res) {
      return NextResponse.json({ error: res.error }, { status: res.error === 'not_found' ? 404 : 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { error } = await res.supabase
      .from('clan_invite_codes')
      .delete()
      .eq('id', id)
      .eq('clan_id', res.clan.id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    await logApiError('/api/clans/[slug]/invite-link', 'DELETE', 500, error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
