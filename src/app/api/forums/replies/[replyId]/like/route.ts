import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ replyId: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { replyId } = await params

    const { data: existing } = await supabase
      .from('forum_reply_likes')
      .select('id')
      .eq('reply_id', replyId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('forum_reply_likes')
        .delete()
        .eq('reply_id', replyId)
        .eq('user_id', user.id)
      return NextResponse.json({ liked: false })
    }

    const { error } = await supabase.from('forum_reply_likes').insert({
      reply_id: replyId,
      user_id: user.id,
    })
    if (error) throw error
    return NextResponse.json({ liked: true })

  } catch (error) {
    console.error('Reply like error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
