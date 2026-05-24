'use client'

/**
 * Member-spotlight card. Reads platform_settings.featured_profile_id and
 * renders a hero card. Returns null if no featured profile is set.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { Sparkles, Star } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'

interface FeaturedProfile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  level_name: string
  is_inner_circle: boolean
}

export function SpotlightCard() {
  const supabase = createClient()
  const [profile, setProfile] = useState<FeaturedProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: settings } = await supabase
        .from('platform_settings')
        .select('featured_profile_id')
        .eq('id', 1)
        .maybeSingle()

      if (cancelled) return

      const featuredId = (settings as { featured_profile_id: string | null } | null)?.featured_profile_id
      if (!featuredId) {
        setLoading(false)
        return
      }

      const { data: p } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio, level_name, is_inner_circle')
        .eq('id', featuredId)
        .maybeSingle()

      if (!cancelled) {
        setProfile((p as FeaturedProfile) ?? null)
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading || !profile) return null

  return (
    <Link
      href={`/profile/${profile.username}`}
      className="vs-card vs-lit vs-brackets group block relative overflow-hidden hover:border-purple/40 transition-colors"
    >
      {/* Background spotlight glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-purple/15 opacity-50 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-cyan/15 opacity-40 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-center gap-4">
        <Avatar
          url={profile.avatar_url}
          name={profile.display_name || profile.username}
          size="xl"
          shape="rounded"
          variant="gradient-ring"
          showInnerRing={profile.is_inner_circle}
        />
        <div className="flex-1 min-w-0">
          <p className="vs-counter text-[10px] tabular-nums text-purple-light flex items-center gap-1">
            <Sparkles size={10} /> SPOTLIGHT · THIS WEEK
          </p>
          <h3 className="text-lg font-semibold tracking-wide mt-1 truncate flex items-center gap-2">
            {profile.display_name || profile.username}
            {profile.is_inner_circle && (
              <Star size={11} className="text-purple-light shrink-0" fill="currentColor" />
            )}
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            @{profile.username} · <span className="text-purple-light">{profile.level_name}</span>
          </p>
          {profile.bio && (
            <p className="text-xs text-text-dim mt-2 line-clamp-2 leading-relaxed">{profile.bio}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
