import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { commentCreateSchema } from '@/lib/validations'
import { logApiError } from '@/lib/logError'

const COMMENT_SELECT = `
  id, content, like_count, parent_id, created_at,
  user:profiles!comments_user_id_fkey(
    id, username, display_name, avatar_url, accent_color, is_verified
  ),
  replies:comments!parent_id(
    id, content, like_count, created_at,
    user:profiles!comments_user_id_fkey(
      id, username, display_name, avatar_url, accent_color
    )
  )
`

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data, error } = await supabase
      .from('comments')
      .select(COMMENT_SELECT)
      .eq('post_id', id)
      .is('parent_id', null)
      .order('created_at', { ascending: true })

    if (error) throw error
    return NextResponse.json({ data: data ?? [] })

  } catch (error) {
    await logApiError('/api/feed/[id]/comments', 'GET', 500, error)
    console.error('Comments GET error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const parsed = commentCreateSchema.safeParse({ ...body, post_id: id })
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: id,
        user_id: user.id,
        content: parsed.data.content,
        parent_id: parsed.data.parent_id ?? null,
      })
      .select(COMMENT_SELECT)
      .single()

    if (error) throw error
    return NextResponse.json({ data }, { status: 201 })

  } catch (error) {
    await logApiError('/api/feed/[id]/comments', 'POST', 500, error)
    console.error('Comment POST error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
