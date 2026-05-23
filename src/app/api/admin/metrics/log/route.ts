import { createClient } from '@/lib/supabase-server'
import { getAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

interface LogBody {
  endpoint?: string
  method?: string
  status_code?: number
  error_msg?: string | null
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = (await req.json().catch(() => ({}))) as LogBody
    const { endpoint, method, status_code, error_msg } = body

    if (!endpoint || !method || typeof status_code !== 'number') {
      return NextResponse.json({ ok: false })
    }

    const admin = getAdminClient()
    await admin.from('api_error_log').insert({
      endpoint,
      method,
      status_code,
      error_msg: error_msg ?? null,
      user_id: user?.id ?? null,
      ip: req.headers.get('x-forwarded-for') ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
