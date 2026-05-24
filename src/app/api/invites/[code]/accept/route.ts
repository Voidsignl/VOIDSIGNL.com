import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { logApiError } from '@/lib/logError'

const ERROR_MESSAGES: Record<string, string> = {
  invalid_code: 'Deze invite link bestaat niet.',
  expired: 'Deze invite link is verlopen.',
  exhausted: 'Deze invite link heeft het maximum aantal joins bereikt.',
  already_member: 'Je bent al lid van deze clan.',
  clan_full: 'Deze clan zit vol.',
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase.rpc('accept_clan_invite_code', { p_code: code })
    if (error) {
      const key = error.message?.match(/(invalid_code|expired|exhausted|already_member|clan_full)/)?.[1]
      const msg = key ? ERROR_MESSAGES[key] : 'Joinen mislukt.'
      return NextResponse.json({ error: msg, code: key ?? 'unknown' }, { status: 400 })
    }

    const row = Array.isArray(data) ? data[0] : data
    return NextResponse.json({ joined: true, slug: row?.slug })
  } catch (error) {
    await logApiError('/api/invites/[code]/accept', 'POST', 500, error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
