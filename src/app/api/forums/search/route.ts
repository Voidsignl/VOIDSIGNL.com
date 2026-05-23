import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const limit = checkRateLimit(ip, 'search')
    if (!limit.allowed) return rateLimitResponse(limit.resetAt)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()
    if (!q || q.length < 2) return NextResponse.json({ data: [] })

    const { data, error } = await supabase.rpc('search_forum_threads', { search_term: q })
    if (error) throw error

    const threadIds = (data ?? []).map((t: any) => t.id)
    let enriched: any[] = data ?? []

    if (threadIds.length > 0) {
      const { data: full } = await supabase
        .from('forum_threads')
        .select(`
          id, title, reply_count, last_reply_at, created_at,
          is_pinned, is_locked,
          author:profiles!forum_threads_author_id_fkey(
            id, username, display_name, avatar_url
          ),
          category:forum_categories!forum_threads_category_id_fkey(
            id, name, slug
          )
        `)
        .in('id', threadIds)

      enriched = (data ?? []).map((t: any) => {
        const found = (full ?? []).find((f: any) => f.id === t.id)
        return { ...t, ...found }
      })
    }

    return NextResponse.json({ data: enriched })

  } catch (error) {
    console.error('Forum search error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
