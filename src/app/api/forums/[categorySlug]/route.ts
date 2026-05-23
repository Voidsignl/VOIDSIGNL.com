import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { forumThreadSchema } from '@/lib/validations'
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'
import { logApiError } from '@/lib/logError'

const PAGE_SIZE = 20

const THREAD_SELECT = `
  id, title, body, is_pinned, is_locked, view_count,
  reply_count, last_reply_at, created_at,
  author:profiles!forum_threads_author_id_fkey(
    id, username, display_name, avatar_url,
    accent_color, is_verified, level_name
  ),
  last_replier:profiles!forum_threads_last_reply_by_fkey(
    id, username, avatar_url
  )
`

export async function GET(req: NextRequest, { params }: { params: Promise<{ categorySlug: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { categorySlug } = await params
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const offset = (page - 1) * PAGE_SIZE

    const { data: category } = await supabase
      .from('forum_categories')
      .select('*')
      .eq('slug', categorySlug)
      .maybeSingle()

    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

    const { data: pinned } = await supabase
      .from('forum_threads')
      .select(THREAD_SELECT)
      .eq('category_id', category.id)
      .eq('is_pinned', true)
      .order('last_reply_at', { ascending: false })

    const { data: threads, error, count } = await supabase
      .from('forum_threads')
      .select(THREAD_SELECT, { count: 'exact' })
      .eq('category_id', category.id)
      .eq('is_pinned', false)
      .order('last_reply_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) throw error

    return NextResponse.json({
      category,
      pinned: pinned ?? [],
      threads: threads ?? [],
      pagination: { page, total: count ?? 0, pageSize: PAGE_SIZE },
    })

  } catch (error) {
    await logApiError('/api/forums/[categorySlug]', 'GET', 500, error)
    console.error('Forum threads GET error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ categorySlug: string }> }) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const limit = checkRateLimit(ip, 'api')
    if (!limit.allowed) return rateLimitResponse(limit.resetAt)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { categorySlug } = await params

    const { data: category } = await supabase
      .from('forum_categories')
      .select('id')
      .eq('slug', categorySlug)
      .maybeSingle()

    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

    const body = await req.json()
    const parsed = forumThreadSchema.safeParse({ ...body, category_id: category.id })
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { data, error } = await supabase
      .from('forum_threads')
      .insert({ ...parsed.data, author_id: user.id })
      .select(THREAD_SELECT)
      .single()

    if (error) throw error
    return NextResponse.json({ data }, { status: 201 })

  } catch (error) {
    await logApiError('/api/forums/[categorySlug]', 'POST', 500, error)
    console.error('Forum thread POST error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
