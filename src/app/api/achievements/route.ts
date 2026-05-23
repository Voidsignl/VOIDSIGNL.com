import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const limit = checkRateLimit(ip, 'api')
    if (!limit.allowed) return rateLimitResponse(limit.resetAt)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId') ?? user.id

    const { data: allAchievements, error: achError } = await supabase
      .from('achievements')
      .select('*')
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true })
    if (achError) throw achError

    const { data: unlocked } = await supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', userId)

    let progress: { achievement_id: string; current_value: number; target_value: number }[] = []
    if (userId === user.id) {
      const { data: prog } = await supabase
        .from('achievement_progress')
        .select('achievement_id, current_value, target_value')
        .eq('user_id', userId)
      progress = prog ?? []
    }

    const unlockedIds = new Set((unlocked ?? []).map((u: any) => u.achievement_id))
    const unlockedMap = new Map((unlocked ?? []).map((u: any) => [u.achievement_id, u.unlocked_at]))
    const progressMap = new Map(progress.map(p => [p.achievement_id, p]))

    const achievements = (allAchievements ?? []).map((a: any) => ({
      ...a,
      is_unlocked: unlockedIds.has(a.id),
      unlocked_at: unlockedMap.get(a.id) ?? null,
      current_value: progressMap.get(a.id)?.current_value ?? 0,
      target_value: progressMap.get(a.id)?.target_value ?? a.target_value ?? 1,
    }))

    const grouped: Record<string, any[]> = achievements.reduce((acc, a) => {
      (acc[a.category] ??= []).push(a)
      return acc
    }, {} as Record<string, any[]>)

    const stats = {
      total: achievements.length,
      unlocked: unlockedIds.size,
      xp_from_achievements: (unlocked ?? []).reduce((sum: number, u: any) => {
        const a = allAchievements?.find((x: any) => x.id === u.achievement_id)
        return sum + (a?.xp_reward ?? 0)
      }, 0),
    }

    return NextResponse.json({ grouped, stats })

  } catch (error) {
    console.error('Achievements API error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
