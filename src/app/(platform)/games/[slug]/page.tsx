import Image from 'next/image'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { Play } from 'lucide-react'

interface GameRow {
  id: string
  name: string
  slug: string
  cover_url: string | null
  description: string | null
  genre: string[] | null
  platforms: string[] | null
  release_year: number | null
  player_count: number
  rank_set: string | null
}

interface TopPlayer {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  accent_color: string | null
  is_verified: boolean
  level_name: string
  xp: number
  rank: string | null
}

interface CoachRow {
  rank_info: string | null
  avg_rating: number | null
  total_sessions: number | null
  user: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
    accent_color: string | null
  } | null
}

interface ClipRow {
  id: string
  title: string
  thumbnail_url: string | null
  source_type: string
  like_count: number
  view_count: number
  is_cotw: boolean
  user: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: game } = await supabase
    .from('games')
    .select('*')
    .eq('slug', slug)
    .eq('is_approved', true)
    .maybeSingle<GameRow>()

  if (!game) notFound()

  const [{ data: topPlayersRaw }, { data: coachesRaw }, { data: clipsRaw }] = await Promise.all([
    supabase
      .from('user_games')
      .select(`
        rank,
        user:profiles!user_games_user_id_fkey(
          id, username, display_name, avatar_url,
          accent_color, is_verified, level_name, xp
        )
      `)
      .eq('game_id', game.id)
      .order('created_at', { ascending: true })
      .limit(10),
    supabase
      .from('coach_games')
      .select(`
        rank_info,
        coach:coach_profiles!coach_games_coach_id_fkey(
          avg_rating, total_sessions, is_approved, is_active,
          user:profiles!coach_profiles_user_id_fkey(
            id, username, display_name, avatar_url, accent_color
          )
        )
      `)
      .eq('game_id', game.id)
      .limit(6),
    supabase
      .from('clips')
      .select(`
        id, title, thumbnail_url, source_type, like_count, view_count, is_cotw,
        user:profiles!clips_user_id_fkey(id, username, display_name, avatar_url)
      `)
      .eq('game_id', game.id)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const topPlayers: TopPlayer[] = (topPlayersRaw ?? [])
    .map((p: any) => p.user ? ({ ...p.user, rank: p.rank }) : null)
    .filter(Boolean) as TopPlayer[]

  const coaches: CoachRow[] = ((coachesRaw ?? []) as any[])
    .filter((c: any) => c.coach?.is_approved && c.coach?.is_active && c.coach?.user)
    .map((c: any) => ({
      rank_info: c.rank_info,
      avg_rating: c.coach?.avg_rating,
      total_sessions: c.coach?.total_sessions,
      user: c.coach?.user,
    }))

  const clips: ClipRow[] = (clipsRaw ?? []) as unknown as ClipRow[]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex gap-6 mb-10">
        <div className="relative w-32 h-44 rounded-xl overflow-hidden bg-surface flex-shrink-0">
          {game.cover_url ? (
            <Image src={game.cover_url} alt={game.name} fill sizes="128px" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-text-dim/60 text-4xl">⬡</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {game.genre && game.genre.length > 0 && (
            <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-2">
              {game.genre.join(' · ')}
            </p>
          )}
          <h1 className="font-mono text-3xl font-bold text-text mb-2">{game.name}</h1>
          <div className="flex items-center gap-4 mb-3">
            <span className="font-mono text-sm text-text-dim">
              {game.player_count?.toLocaleString() ?? 0} spelers
            </span>
            {game.release_year && (
              <span className="font-mono text-sm text-text-dim/60">{game.release_year}</span>
            )}
          </div>
          {game.platforms && game.platforms.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {game.platforms.map(p => (
                <span key={p}
                  className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-surface border border-border text-text-dim">
                  {p}
                </span>
              ))}
            </div>
          )}
          {game.description && (
            <p className="text-text-dim text-sm mt-3 leading-relaxed line-clamp-3">
              {game.description}
            </p>
          )}
        </div>
      </div>

      {topPlayers.length > 0 && (
        <div className="mb-10">
          <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-4">
            Top Spelers
          </p>
          <div className="space-y-2">
            {topPlayers.map((player, i) => (
              <Link key={player.id} href={`/profile/${player.username}`}>
                <div className="flex items-center gap-4 bg-surface border border-border rounded-xl px-4 py-3 hover:border-purple transition-all">
                  <span className="font-mono text-sm font-bold w-6 text-right"
                    style={{ color: i === 0 ? '#00C8F0' : i === 1 ? '#9998aa' : i === 2 ? '#6B3FE0' : 'rgba(255,255,255,0.3)' }}>
                    #{i + 1}
                  </span>
                  <div className="relative w-8 h-8 rounded-full overflow-hidden bg-surface-2 border border-border">
                    {player.avatar_url ? (
                      <Image src={player.avatar_url} alt={player.username} fill sizes="32px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-mono text-xs text-text-dim">
                          {player.username?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-sm font-bold text-text truncate block">
                      {player.display_name ?? player.username}
                    </span>
                    <span className="font-mono text-[10px] text-text-dim">
                      {player.level_name} · {player.xp?.toLocaleString()} XP
                    </span>
                  </div>
                  {player.rank && (
                    <span className="font-mono text-xs text-purple flex-shrink-0">{player.rank}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {coaches.length > 0 && (
        <div className="mb-10">
          <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-4">
            Coaches
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {coaches.map(c => c.user && (
              <Link key={c.user.id} href={`/coaching/${c.user.username}`}>
                <div className="bg-surface border border-border rounded-xl p-3 hover:border-purple transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-surface-2">
                      {c.user.avatar_url ? (
                        <Image src={c.user.avatar_url} alt={c.user.username} fill sizes="32px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-mono text-[10px] text-text-dim">
                            {c.user.username?.[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="font-mono text-xs font-bold text-text truncate">
                      {c.user.display_name ?? c.user.username}
                    </span>
                  </div>
                  {c.rank_info && (
                    <span className="font-mono text-[10px] text-purple">{c.rank_info}</span>
                  )}
                  {(c.avg_rating ?? 0) > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-warning text-[10px]">★</span>
                      <span className="font-mono text-[10px] text-text-dim">
                        {c.avg_rating?.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {clips.length > 0 && (
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-4">
            Recente Clips
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {clips.map(clip => (
              <Link key={clip.id} href="/clips" className="bg-surface border border-border rounded-xl overflow-hidden hover:border-purple transition-all">
                <div className="relative aspect-video bg-void">
                  {clip.thumbnail_url ? (
                    <Image src={clip.thumbnail_url} alt={clip.title} fill sizes="(max-width: 640px) 50vw, 300px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play size={20} className="text-text-dim/60" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="font-mono text-xs text-text truncate mb-1">{clip.title}</p>
                  <p className="font-mono text-[10px] text-text-dim">
                    {clip.user?.username} · ♥ {clip.like_count}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
