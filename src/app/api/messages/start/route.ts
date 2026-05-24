import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { startDmSchema } from '@/lib/validations'
import { logApiError } from '@/lib/logError'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = startDmSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { data: otherUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', parsed.data.username)
      .maybeSingle()

    if (!otherUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (otherUser.id === user.id) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 })
    }

    const { data: convId, error } = await supabase.rpc('get_or_create_dm', {
      p_user_a: user.id,
      p_user_b: otherUser.id,
    })
    if (error) throw error

    return NextResponse.json({ conversation_id: convId })

  } catch (error) {
    await logApiError('/api/messages/start', 'POST', 500, error)
    console.error('Start DM error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
