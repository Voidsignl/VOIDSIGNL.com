import { z } from 'zod'

// Profile update
export const profileUpdateSchema = z.object({
  display_name: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  status_text: z.string().max(100).optional(),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  preferred_language: z.enum(['nl', 'en']).optional(),
})

// Post create (MD10)
export const postCreateSchema = z.object({
  content: z.string().min(1).max(2000),
  images: z.array(z.string().url()).max(4).default([]),
  image_url: z.string().url().optional(),
  game_id: z.string().uuid().optional(),
  post_type: z.enum(['regular', 'achievement', 'clip', 'buddy', 'repost']).default('regular'),
  repost_id: z.string().uuid().optional(),
  is_auto_post: z.boolean().default(false),
})

// Comment create (MD10)
export const commentCreateSchema = z.object({
  post_id: z.string().uuid(),
  content: z.string().min(1).max(1000),
  parent_id: z.string().uuid().optional(),
})

// Buddy request sturen
export const buddyRequestSchema = z.object({
  receiver_id: z.string().uuid(),
  message: z.string().max(200).optional(),
})

// Buddy request beantwoorden
export const buddyResponseSchema = z.object({
  request_id: z.string().uuid(),
  action: z.enum(['accept', 'decline']),
})

// Buddy zoeken filters
export const buddySearchSchema = z.object({
  game_id:   z.string().uuid().optional(),
  language:  z.enum(['nl', 'en']).optional(),
  platform:  z.string().optional(),
  playtime:  z.string().optional(),
  min_level: z.coerce.number().min(1).max(10).optional(),
  max_level: z.coerce.number().min(1).max(10).optional(),
  page:      z.coerce.number().min(1).default(1),
})

// Clip upload (MD8: 'upload' source ipv 'native')
export const clipCreateSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  video_url: z.string().url().optional(),
  thumbnail_url: z.string().url().optional(),
  game_id: z.string().uuid().optional(),
  source_type: z.enum(['upload', 'youtube', 'twitch']),
  duration_seconds: z.number().min(1).max(600).optional(),
})

// Clip comment
export const clipCommentSchema = z.object({
  clip_id: z.string().uuid(),
  content: z.string().min(1).max(1000),
})

// Coach aanmelding (MD9)
export const coachApplicationSchema = z.object({
  bio: z.string().min(50).max(1000),
  specializations: z.array(z.string()).min(1).max(8),
  languages: z.array(z.enum(['nl', 'en'])).min(1),
  discord_handle: z.string().min(2).max(50),
  hourly_tier: z.enum(['basic', 'standard', 'premium']),
  game_ids: z.array(z.string().uuid()).min(1).max(10),
})

// Sessie boeken (MD9)
export const sessionBookSchema = z.object({
  coach_id: z.string().uuid(),
  game_id: z.string().uuid().optional(),
  tier: z.enum(['basic', 'standard', 'premium']),
  notes: z.string().max(500).optional(),
  scheduled_at: z.string().datetime(),
})

// Review indienen (MD9)
export const coachReviewSchema = z.object({
  session_id: z.string().uuid(),
  coach_id: z.string().uuid(),
  rating: z.number().min(1).max(5),
  content: z.string().min(10).max(1000),
})

// Beschikbaarheid (MD9)
export const availabilitySchema = z.object({
  slots: z.array(z.object({
    day_of_week: z.number().min(0).max(6),
    start_time: z.string().regex(/^\d{2}:\d{2}$/),
    end_time: z.string().regex(/^\d{2}:\d{2}$/),
  })),
})

// Coaching session book (legacy MD3)
export const coachingBookSchema = z.object({
  coach_id: z.string().uuid(),
  game_id: z.string().uuid().optional(),
  tier: z.enum(['basic', 'standard', 'premium']),
  notes: z.string().max(500).optional(),
  scheduled_at: z.string().datetime().optional(),
})

// Forum thread (MD5 scope, schema vast neerzetten)
export const forumThreadSchema = z.object({
  category_id: z.string().uuid(),
  title: z.string().min(5).max(200),
  body: z.string().min(10).max(10000),
})

// Forum reply (MD5 scope)
export const forumReplySchema = z.object({
  thread_id: z.string().uuid(),
  body: z.string().min(1).max(5000),
})

// Clan create (MD16)
export const clanCreateSchema = z.object({
  name: z.string().min(3).max(50),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, 'Alleen kleine letters, cijfers en koppeltekens'),
  description: z.string().max(500).optional(),
  is_open: z.boolean().default(true),
  max_members: z.number().min(5).max(500).default(50),
})

// Clan update (MD16)
export const clanUpdateSchema = z.object({
  description: z.string().max(500).optional(),
  is_open: z.boolean().optional(),
  max_members: z.number().min(5).max(500).optional(),
})

// Clan war uitdaging (MD16)
export const clanWarSchema = z.object({
  challenged_clan_id: z.string().uuid(),
})

// Clan bericht (MD16)
export const clanMessageSchema = z.object({
  content: z.string().min(1).max(1000),
})

// Generic UUID param check
export const uuidSchema = z.string().uuid()

// Game aanvragen (MD13 + manual)
export const gameRequestSchema = z.object({
  igdb_id: z.number().int().positive().nullable().optional(),
  name: z.string().min(1).max(100),
  cover_url: z.string().url().nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  genre: z.array(z.string()).default([]),
  platforms: z.array(z.string()).default([]),
  release_year: z.number().int().min(1970).max(2030).nullable().optional(),
})

// Game toevoegen aan library (MD13)
export const userGameSchema = z.object({
  game_id: z.string().uuid(),
  rank: z.string().max(50).optional(),
  is_main: z.boolean().default(false),
  hours_played: z.number().min(0).max(100000).optional(),
})

// Game goedkeuren (MD13 admin)
export const gameApproveSchema = z.object({
  request_id: z.string().uuid(),
  rank_set: z.string(),
  custom_ranks: z.array(z.string()).optional(),
})

// Bericht sturen (MD11)
export const messageSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().max(2000).optional(),
  message_type: z.enum(['text', 'image', 'gif', 'sticker']).default('text'),
  media_url: z.string().url().optional(),
  gif_url: z.string().url().optional(),
  sticker_id: z.string().optional(),
})

// DM starten (MD11)
export const startDmSchema = z.object({
  username: z.string().min(1).max(50),
})

// Ranking zoekfunctie
export const rankingSearchSchema = z.object({
  q: z.string().min(1).max(50),
  tab: z.enum(['global', 'clips', 'coaching', 'clans']).default('global'),
})

export function validate<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.message}`)
  }
  return result.data
}
