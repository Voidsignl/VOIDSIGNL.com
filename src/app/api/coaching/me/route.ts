import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { logApiError } from '@/lib/logError'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle()

    const { data: coach } = await supabase
      .from('coach_profiles')
      .select('hourly_tier, is_approved, is_active')
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({
      data: {
        username: profile?.username ?? '',
        is_coach: !!coach?.is_approved && !!coach?.is_active,
        hourly_tier: coach?.hourly_tier ?? null,
      },
    })
  } catch (error) {
    await logApiError('/api/coaching/me', 'GET', 500, error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
