import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

interface Params {
  username: string
}

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { username } = await params

  // Use anon-key client at build/edge — only reads public profile fields
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data } = await supabase
    .from('profiles')
    .select('display_name, username, bio, avatar_url, level_name, is_founding_member')
    .eq('username', username)
    .maybeSingle()

  if (!data) {
    return {
      title: `@${username} · VOIDSIGNL`,
      description: 'VOIDSIGNL — gaming community platform.',
    }
  }

  const name = data.display_name || data.username
  const title = `${name} (@${data.username}) · VOIDSIGNL`
  const description =
    data.bio?.slice(0, 160) ||
    `${data.is_founding_member ? 'Inner Circle · ' : ''}${data.level_name} on VOIDSIGNL — gaming community platform.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      images: data.avatar_url ? [{ url: data.avatar_url }] : undefined,
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: data.avatar_url ? [data.avatar_url] : undefined,
    },
  }
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children
}
