import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { clipCommentSchema } from '@/lib/validations'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data, error } = await supabase
      .from('clip_comments')
      .select(`
        id, content, like_count, created_at,
        user:profiles(id, username, display_name, avatar_url, accent_color, is_verified)
      `)
      .eq('clip_id', id)
      .order('created_at', { ascending: true })

    if (error) throw error
    return NextResponse.json({ data: data ?? [] })

  } catch (error) {
    console.error('Clip comments GET error:', error)
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
    const parsed = clipCommentSchema.safeParse({ ...body, clip_id: id })
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { data, error } = await supabase
      .from('clip_comments')
      .insert({ clip_id: id, user_id: user.id, content: parsed.data.content })
      .select(`
        id, content, like_count, created_at,
        user:profiles(id, username, display_name, avatar_url, accent_color)
      `)
      .single()

    if (error) throw error
    return NextResponse.json({ data }, { status: 201 })

  } catch (error) {
    console.error('Clip comment POST error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
