import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

async function isAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  return data?.role === 'admin'
}

interface BucketSummary {
  name: string
  file_count: number
}

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: dbStats } = await supabase.rpc('get_database_stats')
    const { data: tableSizes } = await supabase.rpc('get_table_sizes')

    const { data: recentErrors, count: errorCount } = await supabase
      .from('api_error_log')
      .select('endpoint, status_code, recorded_at', { count: 'exact' })
      .gte('recorded_at', new Date(Date.now() - 3600_000).toISOString())
      .order('recorded_at', { ascending: false })
      .limit(50)

    const { count: errors24h } = await supabase
      .from('api_error_log')
      .select('*', { count: 'exact', head: true })
      .gte('recorded_at', new Date(Date.now() - 86_400_000).toISOString())
      .gte('status_code', 500)

    const { data: metricsHistory } = await supabase
      .from('system_metrics')
      .select('metric_type, value, recorded_at')
      .gte('recorded_at', new Date(Date.now() - 3600_000).toISOString())
      .order('recorded_at', { ascending: false })
      .limit(100)

    let storage: BucketSummary[] | null = null
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      storage = await Promise.all(
        (buckets ?? []).map(async (bucket): Promise<BucketSummary> => {
          const { data: files } = await supabase.storage
            .from(bucket.name)
            .list('', { limit: 1000 })
          return { name: bucket.name, file_count: files?.length ?? 0 }
        }),
      )
    } catch {
      storage = null
    }

    const { count: onlineCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gt('last_seen_at', new Date(Date.now() - 90_000).toISOString())

    return NextResponse.json({
      db_stats: dbStats,
      table_sizes: (tableSizes as { table_name: string; row_count: number; size_bytes: number; size_pretty: string }[] | null)?.slice(0, 15) ?? [],
      errors_1h: errorCount ?? 0,
      errors_24h: errors24h ?? 0,
      recent_errors: recentErrors ?? [],
      metrics_history: metricsHistory ?? [],
      storage,
      online_now: onlineCount ?? 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Metrics API error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
