import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { forumReplySchema } from '@/lib/validations'
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'

const REPLY_SELECT = `
  id, body, is_solution, like_count, created_at, updated_at,
  author:profiles!forum_replies_author_id_fkey(
    id, username, display_name, avatar_url,
    accent_color, is_verified, is_inner_circle,
    level_name, post_count, created_at
  )
`

export async function GET(req: NextRequest, { params }: { params: Promise<{ categorySlug: string; threadId: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { threadId } = await params
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const PAGE_SIZE = 30
    const offset = (page - 1) * PAGE_SIZE

    const { data: thread, error: threadError } = await supabase
      .from('forum_threads')
      .select(`
        id, title, body, is_pinned, is_locked, view_count,
        reply_count, last_reply_at, created_at,
        author:profiles!forum_threads_author_id_fkey(
          id, username, display_name, avatar_url,
          accent_color, is_verified, is_inner_circle, level_name
        ),
        category:forum_categories!forum_threads_category_id_fkey(
          id, name, slug
        )
      `)
      .eq('id', threadId)
      .maybeSingle()

    if (threadError) throw threadError
    if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

    await supabase.rpc('increment_thread_view', { p_thread_id: threadId })

    const { data: replies, error: replyError, count } = await supabase
      .from('forum_replies')
      .select(REPLY_SELECT, { count: 'exact' })
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)

    if (replyError) throw replyError

    const replyIds = (replies ?? []).map((r: any) => r.id)
    let likedReplyIds = new Set<string>()

    if (replyIds.length > 0) {
      const { data: liked } = await supabase
        .from('forum_reply_likes')
        .select('reply_id')
        .eq('user_id', user.id)
        .in('reply_id', replyIds)
      likedReplyIds = new Set((liked ?? []).map((l: any) => l.reply_id))
    }

    const enrichedReplies = (replies ?? []).map((r: any) => ({
      ...r,
      is_liked: likedReplyIds.has(r.id),
    }))

    return NextResponse.json({
      thread,
      replies: enrichedReplies,
      pagination: { page, total: count ?? 0, pageSize: PAGE_SIZE },
    })

  } catch (error) {
    console.error('Thread GET error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ categorySlug: string; threadId: string }> }) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const limit = checkRateLimit(ip, 'api')
    if (!limit.allowed) return rateLimitResponse(limit.resetAt)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { threadId } = await params

    const { data: thread } = await supabase
      .from('forum_threads')
      .select('is_locked')
      .eq('id', threadId)
      .maybeSingle()

    if (thread?.is_locked) {
      return NextResponse.json({ error: 'Thread is locked' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = forumReplySchema.safeParse({ ...body, thread_id: threadId })
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { data, error } = await supabase
      .from('forum_replies')
      .insert({ ...parsed.data, author_id: user.id })
      .select(REPLY_SELECT)
      .single()

    if (error) throw error
    return NextResponse.json({ data: { ...data, is_liked: false } }, { status: 201 })

  } catch (error) {
    console.error('Reply POST error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
