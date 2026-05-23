import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { buddyResponseSchema } from '@/lib/validations'
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const limit = checkRateLimit(ip, 'api')
    if (!limit.allowed) return rateLimitResponse(limit.resetAt)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = buddyResponseSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { request_id, action } = parsed.data
    const newStatus = action === 'accept' ? 'accepted' : 'declined'

    const { data, error } = await supabase
      .from('buddy_requests')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', request_id)
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
      .select()
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

    return NextResponse.json({ data })

  } catch (error) {
    console.error('Buddy respond error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
