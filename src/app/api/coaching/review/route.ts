import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { coachReviewSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = coachReviewSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { data: sess } = await supabase
      .from('coaching_sessions')
      .select('id, status, feedback_sent')
      .eq('id', parsed.data.session_id)
      .eq('student_id', user.id)
      .eq('status', 'completed')
      .maybeSingle()

    if (!sess) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (sess.feedback_sent) return NextResponse.json({ error: 'Already reviewed' }, { status: 400 })

    const { data, error } = await supabase
      .from('coach_reviews')
      .insert({
        session_id: parsed.data.session_id,
        reviewer_id: user.id,
        coach_id: parsed.data.coach_id,
        rating: parsed.data.rating,
        content: parsed.data.content,
      })
      .select()
      .single()

    if (error) throw error

    await supabase
      .from('coaching_sessions')
      .update({ feedback_sent: true })
      .eq('id', parsed.data.session_id)

    return NextResponse.json({ data }, { status: 201 })

  } catch (error) {
    console.error('Review error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
