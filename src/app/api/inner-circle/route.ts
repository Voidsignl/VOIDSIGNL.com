import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

interface ProfileLite {
  id: string
  username: string
  display_name?: string | null
  avatar_url?: string | null
  accent_color?: string | null
  mod_level: number
  mod_actions_count: number
  inner_circle_joined_at: string | null
  level_name: string
  xp: number
  last_seen_at: string | null
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select(
        'id, username, is_inner_circle, mod_level, mod_actions_count, inner_circle_joined_at',
      )
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.is_inner_circle) {
      return NextResponse.json({ error: 'Not Inner Circle' }, { status: 403 })
    }

    const { data: members } = await supabase
      .from('profiles')
      .select(
        `
        id, username, display_name, avatar_url, accent_color,
        mod_level, mod_actions_count, inner_circle_joined_at,
        level_name, xp, last_seen_at
      `,
      )
      .eq('is_inner_circle', true)
      .order('inner_circle_joined_at', { ascending: true })

    const { data: icClan } = await supabase
      .from('clans')
      .select(
        'id, name, slug, avatar_url, xp_total, member_count, description',
      )
      .eq('is_inner_circle_clan', true)
      .maybeSingle()

    const { data: activeVotes } = await supabase
      .from('ic_votes')
      .select(
        `
        id, title, description, vote_type, status,
        closes_at, created_at, quorum_pct,
        creator:profiles!ic_votes_created_by_fkey(
          id, username, display_name, avatar_url
        ),
        target:profiles!ic_votes_target_user_id_fkey(
          id, username, display_name, mod_level
        )
      `,
      )
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    const { data: closedVotes } = await supabase
      .from('ic_votes')
      .select(
        `
        id, title, vote_type, status, result,
        closes_at, created_at,
        creator:profiles!ic_votes_created_by_fkey(
          id, username, avatar_url
        )
      `,
      )
      .in('status', ['closed', 'implemented', 'rejected'])
      .order('closes_at', { ascending: false })
      .limit(5)

    // Stemmen per actieve vote (apart om count te doen)
    const activeVoteIds = (activeVotes ?? []).map((v) => v.id)
    const voteCounts: Record<string, number> = {}
    if (activeVoteIds.length > 0) {
      for (const vid of activeVoteIds) {
        const { count } = await supabase
          .from('ic_vote_results')
          .select('*', { count: 'exact', head: true })
          .eq('vote_id', vid)
        voteCounts[vid] = count ?? 0
      }
    }

    let myVotes: Record<string, string> = {}
    if (activeVoteIds.length > 0) {
      const { data: myVoteResults } = await supabase
        .from('ic_vote_results')
        .select('vote_id, choice')
        .eq('user_id', user.id)
        .in('vote_id', activeVoteIds)
      myVotes = Object.fromEntries(
        (myVoteResults ?? []).map((v) => [v.vote_id, v.choice]),
      )
    }

    const { data: recentModActions } = await supabase
      .from('mod_actions')
      .select(
        `
        id, target_type, target_id, action, reason, created_at,
        mod:profiles!mod_actions_mod_id_fkey(username, avatar_url, mod_level)
      `,
      )
      .order('created_at', { ascending: false })
      .limit(10)

    const membersList = (members as ProfileLite[] | null) ?? []
    const stats = {
      total: membersList.length,
      level1: membersList.filter((m) => m.mod_level === 1).length,
      level2: membersList.filter((m) => m.mod_level === 2).length,
      level3p: membersList.filter((m) => m.mod_level >= 3).length,
    }

    return NextResponse.json({
      profile,
      members: membersList,
      icClan,
      activeVotes: (activeVotes ?? []).map((v) => ({
        ...v,
        my_vote: myVotes[v.id] ?? null,
        vote_count: voteCounts[v.id] ?? 0,
      })),
      closedVotes: closedVotes ?? [],
      recentModActions: recentModActions ?? [],
      stats,
    })
  } catch (error) {
    console.error('IC hub error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 },
    )
  }
}
