import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    // Bepaal de coach_profile ids van deze gebruiker
    const { data: cp } = await supabase
      .from('coach_profiles')
      .select('id')
      .eq('user_id', user.id)
    const ids = (cp ?? []).map((r: { id: string }) => r.id)
    if (ids.length === 0) return NextResponse.json({ error: 'Not a coach' }, { status: 403 })

    const { data, error } = await supabase
      .from('coaching_sessions')
      .update({ status: 'completed' })
      .eq('id', id)
      .in('coach_id', ids)
      .eq('status', 'confirmed')
      .select()
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    return NextResponse.json({ data })

  } catch (error) {
    console.error('Session complete error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
