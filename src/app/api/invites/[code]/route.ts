import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { logApiError } from '@/lib/logError'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params
    const supabase = await createClient()

    const { data: invite, error } = await supabase
      .from('clan_invite_codes')
      .select(`
        id, code, max_uses, uses, expires_at, created_at,
        clan:clans(id, slug, name, description, avatar_url, banner_url, member_count, max_members, is_open)
      `)
      .eq('code', code)
      .maybeSingle()
    if (error) throw error
    if (!invite) return NextResponse.json({ error: 'invalid_code' }, { status: 404 })

    const expired = invite.expires_at && new Date(invite.expires_at) < new Date()
    const exhausted = invite.max_uses > 0 && invite.uses >= invite.max_uses

    return NextResponse.json({
      data: { ...invite, expired, exhausted },
    })
  } catch (error) {
    await logApiError('/api/invites/[code]', 'GET', 500, error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
