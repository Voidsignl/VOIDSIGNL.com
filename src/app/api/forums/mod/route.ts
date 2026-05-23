import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!['admin', 'moderator'].includes(profile?.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { action, thread_id, reply_id } = await req.json()

    if (thread_id) {
      switch (action) {
        case 'pin':
          await supabase.from('forum_threads').update({ is_pinned: true }).eq('id', thread_id)
          break
        case 'unpin':
          await supabase.from('forum_threads').update({ is_pinned: false }).eq('id', thread_id)
          break
        case 'lock':
          await supabase.from('forum_threads').update({ is_locked: true }).eq('id', thread_id)
          break
        case 'unlock':
          await supabase.from('forum_threads').update({ is_locked: false }).eq('id', thread_id)
          break
        case 'delete':
          await supabase.from('forum_threads').delete().eq('id', thread_id)
          break
      }
    }

    if (reply_id && action === 'delete') {
      await supabase.from('forum_replies').delete().eq('id', reply_id)
    }

    if (reply_id && action === 'solution') {
      const { data: reply } = await supabase
        .from('forum_replies').select('thread_id').eq('id', reply_id).maybeSingle()
      if (reply) {
        await supabase.from('forum_replies').update({ is_solution: false }).eq('thread_id', reply.thread_id)
        await supabase.from('forum_replies').update({ is_solution: true }).eq('id', reply_id)
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Forum mod error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
