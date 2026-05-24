import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_inner_circle')
      .eq('id', user.id)
      .maybeSingle()
    if (!profile?.is_inner_circle)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: vote } = await supabase
      .from('ic_votes')
      .select(
        `
        *,
        creator:profiles!ic_votes_created_by_fkey(
          id, username, display_name, avatar_url, accent_color
        ),
        target:profiles!ic_votes_target_user_id_fkey(
          id, username, display_name, avatar_url, mod_level
        )
      `,
      )
      .eq('id', id)
      .maybeSingle()

    if (!vote)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: results } = await supabase
      .from('ic_vote_results')
      .select(
        `
        choice, comment, created_at,
        user:profiles!ic_vote_results_user_id_fkey(
          id, username, display_name, avatar_url, mod_level
        )
      `,
      )
      .eq('vote_id', id)
      .order('created_at')

    const { data: myVote } = await supabase
      .from('ic_vote_results')
      .select('choice, comment')
      .eq('vote_id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    const allResults = results ?? []
    const forCount = allResults.filter((r) => r.choice === 'for').length
    const againstCount = allResults.filter((r) => r.choice === 'against').length
    const abstainCount = allResults.filter((r) => r.choice === 'abstain').length

    const { count: totalIC } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_inner_circle', true)

    return NextResponse.json({
      vote,
      results: allResults,
      my_vote: myVote,
      stats: {
        for: forCount,
        against: againstCount,
        abstain: abstainCount,
        total: allResults.length,
        totalIC: totalIC ?? 0,
        quorum_met:
          (totalIC ?? 0) > 0
            ? allResults.length / (totalIC ?? 1) >= vote.quorum_pct / 100
            : false,
      },
    })
  } catch (error) {
    console.error('IC vote GET error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 },
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_inner_circle')
      .eq('id', user.id)
      .maybeSingle()
    if (!profile?.is_inner_circle)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: vote } = await supabase
      .from('ic_votes')
      .select('status, closes_at')
      .eq('id', id)
      .maybeSingle()

    if (
      !vote ||
      vote.status !== 'open' ||
      new Date(vote.closes_at) < new Date()
    ) {
      return NextResponse.json({ error: 'Vote is gesloten' }, { status: 400 })
    }

    const body = (await req.json()) as { choice?: string; comment?: string }
    if (!body.choice || !['for', 'against', 'abstain'].includes(body.choice)) {
      return NextResponse.json({ error: 'Ongeldige keuze' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('ic_vote_results')
      .upsert(
        {
          vote_id: id,
          user_id: user.id,
          choice: body.choice,
          comment: body.comment?.trim() || null,
        },
        { onConflict: 'vote_id,user_id' },
      )
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    console.error('IC vote POST error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 },
    )
  }
}
