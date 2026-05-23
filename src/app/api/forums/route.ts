import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('forum_categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error

    const enriched = await Promise.all((data ?? []).map(async (cat: any) => {
      const { data: latest } = await supabase
        .from('forum_threads')
        .select(`
          id, title, last_reply_at,
          author:profiles!forum_threads_author_id_fkey(username, avatar_url)
        `)
        .eq('category_id', cat.id)
        .order('last_reply_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      return { ...cat, latest_thread: latest }
    }))

    return NextResponse.json({ data: enriched })

  } catch (error) {
    console.error('Forums GET error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
