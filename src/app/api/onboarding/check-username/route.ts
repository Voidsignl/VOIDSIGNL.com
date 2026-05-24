import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

const RESERVED = [
  'admin',
  'void',
  'voidsignl',
  'moderator',
  'support',
  'system',
  'root',
  'staff',
]

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const username = searchParams.get('username')?.trim().toLowerCase()

    if (!username || username.length < 3) {
      return NextResponse.json({
        available: false,
        error: 'Minimaal 3 tekens',
      })
    }
    if (username.length > 20) {
      return NextResponse.json({
        available: false,
        error: 'Maximaal 20 tekens',
      })
    }
    if (!/^[a-z0-9_-]+$/.test(username)) {
      return NextResponse.json({
        available: false,
        error: 'Alleen letters, cijfers, _ en -',
      })
    }
    if (RESERVED.includes(username)) {
      return NextResponse.json({
        available: false,
        error: 'Deze naam is gereserveerd',
      })
    }

    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    return NextResponse.json({ available: !data })
  } catch (error) {
    console.error('Username check error:', error)
    return NextResponse.json(
      { available: false, error: 'Check mislukt' },
      { status: 500 },
    )
  }
}
