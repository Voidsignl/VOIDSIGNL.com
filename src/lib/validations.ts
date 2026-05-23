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

// Buddy request
export const buddyRequestSchema = z.object({
  receiver_id: z.string().uuid(),
})

// Clip upload
export const clipCreateSchema = z.object({
  title: z.string().min(2).max(100),
  video_url: z.string().url(),
  thumbnail_url: z.string().url().optional(),
  game_id: z.string().uuid().optional(),
  source_type: z.enum(['native', 'youtube', 'twitch']),
})

// Coaching session book
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

export function validate<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.message}`)
  }
  return result.data
}
