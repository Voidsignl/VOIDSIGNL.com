import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const start = Date.now()
  let dbStatus: 'ok' | 'error' = 'ok'
  let dbLatency = 0

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const dbStart = Date.now()
    await supabase.from('platform_settings').select('id').limit(1)
    dbLatency = Date.now() - dbStart
  } catch {
    dbStatus = 'error'
  }

  const totalLatency = Date.now() - start
  const healthy = dbStatus === 'ok'

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      db: dbStatus,
      latency: { db: dbLatency, total: totalLatency },
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0',
    },
    {
      status: healthy ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  )
}
