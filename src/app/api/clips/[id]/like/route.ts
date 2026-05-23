import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: clipId } = await params

    const { data: existing } = await supabase
      .from('clip_likes')
      .select('id')
      .eq('clip_id', clipId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('clip_likes')
        .delete()
        .eq('clip_id', clipId)
        .eq('user_id', user.id)
      return NextResponse.json({ liked: false })
    }

    const { error } = await supabase.from('clip_likes').insert({
      clip_id: clipId,
      user_id: user.id,
    })
    if (error) throw error
    return NextResponse.json({ liked: true })

  } catch (error) {
    console.error('Clip like error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
