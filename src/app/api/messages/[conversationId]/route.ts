import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { messageSchema } from '@/lib/validations'
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'
import { logApiError } from '@/lib/logError'

const PAGE_SIZE = 50

export async function GET(req: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { conversationId } = await params
    const { searchParams } = new URL(req.url)
    const before = searchParams.get('before')

    let query = supabase
      .from('messages')
      .select(`
        id, content, message_type, media_url, gif_url, sticker_id,
        is_read, is_deleted, sender_id, created_at,
        sender:profiles!messages_sender_id_fkey(
          id, username, display_name, avatar_url, accent_color
        )
      `)
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (before) query = query.lt('created_at', before)

    const { data, error } = await query
    if (error) throw error

    await supabase.rpc('mark_conversation_read', {
      p_conversation_id: conversationId,
      p_user_id: user.id,
    })

    return NextResponse.json({ data: (data ?? []).reverse() })

  } catch (error) {
    await logApiError('/api/messages/[conversationId]', 'GET', 500, error)
    console.error('Messages conversation GET error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const limit = checkRateLimit(ip, 'api')
    if (!limit.allowed) return rateLimitResponse(limit.resetAt)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { conversationId } = await params
    const body = await req.json()
    const parsed = messageSchema.safeParse({ ...body, conversation_id: conversationId })
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: parsed.data.content ?? '',
        message_type: parsed.data.message_type,
        media_url: parsed.data.media_url ?? null,
        gif_url: parsed.data.gif_url ?? null,
        sticker_id: parsed.data.sticker_id ?? null,
      })
      .select(`
        id, content, message_type, media_url, gif_url, sticker_id,
        is_read, sender_id, created_at,
        sender:profiles!messages_sender_id_fkey(
          id, username, display_name, avatar_url, accent_color
        )
      `)
      .single()

    if (error) throw error
    return NextResponse.json({ data }, { status: 201 })

  } catch (error) {
    await logApiError('/api/messages/[conversationId]', 'POST', 500, error)
    console.error('Message POST error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
