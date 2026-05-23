import { NextRequest, NextResponse } from 'next/server'
import { searchIGDB, formatIGDBGame } from '@/lib/igdb'
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const limit = checkRateLimit(ip, 'search')
    if (!limit.allowed) return rateLimitResponse(limit.resetAt)

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()

    if (!q || q.length < 2) {
      return NextResponse.json({ data: [] })
    }

    const results = await searchIGDB(q, 10)
    return NextResponse.json({ data: results.map(formatIGDBGame) })

  } catch (error) {
    console.error('IGDB search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
