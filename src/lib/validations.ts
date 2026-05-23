import { z } from 'zod'

// Profile update
export const profileUpdateSchema = z.object({
  display_name: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  status_text: z.string().max(100).optional(),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  preferred_language: z.enum(['nl', 'en']).optional(),
})

// Post create
export const postCreateSchema = z.object({
  content: z.string().min(1).max(2000),
  game_id: z.string().uuid().optional(),
  image_url: z.string().url().optional(),
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

// Clan create (MD3 scope)
export const clanCreateSchema = z.object({
  name: z.string().min(3).max(50),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  is_open: z.boolean().default(true),
  max_members: z.number().min(5).max(500).default(50),
})

// Generic UUID param check
export const uuidSchema = z.string().uuid()

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
