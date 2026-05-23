// In-memory rate limiter — werkt per Vercel instance.
// Migrate naar Upstash Redis voor persistente limiting over alle edge regions.

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

interface RateLimitConfig {
  windowMs: number
  max: number
}

const CONFIGS = {
  auth:   { windowMs: 15 * 60 * 1000, max: 10 }, // 10 per 15 min (login/register)
  api:    { windowMs: 60 * 1000,      max: 60 }, // 60 per min (algemene API)
  upload: { windowMs: 60 * 1000,      max: 10 }, // 10 uploads per min
  search: { windowMs: 60 * 1000,      max: 30 }, // 30 searches per min
} as const satisfies Record<string, RateLimitConfig>

export type RateLimitType = keyof typeof CONFIGS

export function checkRateLimit(
  identifier: string,
  type: RateLimitType = 'api'
): { allowed: boolean; remaining: number; resetAt: number } {
  const config = CONFIGS[type]
  const now = Date.now()
  const key = `${type}:${identifier}`
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, remaining: config.max - 1, resetAt: now + config.windowMs }
  }

  if (entry.count >= config.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: config.max - entry.count, resetAt: entry.resetAt }
}

export function rateLimitResponse(resetAt: number) {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Try again later.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
      },
    }
  )
}
