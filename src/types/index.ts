export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  banner_url: string | null
  bio: string | null
  status_text: string | null
  availability: string | null
  platforms: string[]
  socials: Record<string, string>
  gamertags: Record<string, string>
  is_verified: boolean
  is_founding_member: boolean
  is_coach: boolean
  is_onboarded: boolean
  xp: number
  level: number
  level_name: string
  privacy_settings: PrivacySettings
  created_at: string
  updated_at: string
}

export interface PrivacySettings {
  show_gamertags: 'everyone' | 'buddies' | 'nobody'
  show_stats: 'everyone' | 'buddies' | 'nobody'
  show_clips: 'everyone' | 'buddies' | 'nobody'
  show_socials: 'everyone' | 'buddies' | 'nobody'
  show_availability: 'everyone' | 'buddies' | 'nobody'
}

export interface Game {
  id: string
  name: string
  slug: string
  cover_url: string | null
  is_approved: boolean
  created_at: string
}

export interface UserGame {
  id: string
  user_id: string
  game_id: string
  is_main: boolean
  game?: Game
}

export interface Post {
  id: string
  user_id: string
  content: string
  image_url: string | null
  video_url: string | null
  game_id: string | null
  like_count: number
  comment_count: number
  created_at: string
  profile?: Profile
  game?: Game
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  profile?: Profile
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface BuddyRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  is_read: boolean
  link: string | null
  created_at: string
}

export type Level = {
  level: number
  name: string
  min_xp: number
}

export const LEVELS: Level[] = [
  { level: 1, name: 'Recruit', min_xp: 0 },
  { level: 2, name: 'Initiate', min_xp: 100 },
  { level: 3, name: 'Member', min_xp: 300 },
  { level: 4, name: 'Regular', min_xp: 600 },
  { level: 5, name: 'Veteran', min_xp: 1000 },
  { level: 6, name: 'Elite', min_xp: 1800 },
  { level: 7, name: 'Champion', min_xp: 3000 },
  { level: 8, name: 'Master', min_xp: 5000 },
  { level: 9, name: 'Grandmaster', min_xp: 8000 },
  { level: 10, name: 'Legend', min_xp: 12000 },
]

export function getLevelFromXP(xp: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min_xp) return LEVELS[i]
  }
  return LEVELS[0]
}

export function getXPProgress(xp: number): { current: number; next: number; percentage: number } {
  const currentLevel = getLevelFromXP(xp)
  const nextLevel = LEVELS[currentLevel.level] || LEVELS[LEVELS.length - 1]
  const currentMin = currentLevel.min_xp
  const nextMin = nextLevel.min_xp
  const progress = nextMin > currentMin ? ((xp - currentMin) / (nextMin - currentMin)) * 100 : 100
  return { current: currentMin, next: nextMin, percentage: Math.min(progress, 100) }
}
