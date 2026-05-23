import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { conversation_id, action } = await req.json()
    if (!['accept', 'block'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    if (!conversation_id || typeof conversation_id !== 'string') {
      return NextResponse.json({ error: 'Invalid conversation_id' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('conversations')
      .update({ status: action === 'accept' ? 'accepted' : 'blocked' })
      .eq('id', conversation_id)
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .eq('status', 'pending')
      .select()
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

    return NextResponse.json({ data })

  } catch (error) {
    console.error('Message request error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
