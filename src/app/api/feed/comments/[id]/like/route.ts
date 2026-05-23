import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: commentId } = await params

    const { data: existing } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
      return NextResponse.json({ liked: false })
    }

    const { error } = await supabase.from('comment_likes').insert({
      comment_id: commentId,
      user_id: user.id,
    })
    if (error) throw error
    return NextResponse.json({ liked: true })

  } catch (error) {
    console.error('Comment like error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
