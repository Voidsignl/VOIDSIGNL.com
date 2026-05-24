import 'server-only'
import { getAdminClient } from '@/lib/supabase-admin'

/**
 * Server-side API error logger.
 *
 * Writes to `api_error_log` via the service-role client so logging survives
 * even when the request was 5xx and the user-bound session is unusable.
 * Silently swallows failures — logging must never break the parent request.
 */
export async function logApiError(
  endpoint: string,
  method: string,
  status: number,
  error?: unknown,
  meta?: { userId?: string | null; ip?: string | null },
): Promise<void> {
  try {
    let msg: string
    if (error instanceof Error) {
      msg = error.message
    } else if (error && typeof error === 'object') {
      // Supabase PostgrestError-achtige objecten: { message, code, details, hint }
      const e = error as Record<string, unknown>
      const parts = [e.message, e.code, e.hint, e.details].filter(Boolean)
      msg = parts.length > 0 ? parts.map(String).join(' | ') : JSON.stringify(error)
    } else {
      msg = String(error ?? '')
    }
    const admin = getAdminClient()
    await admin.from('api_error_log').insert({
      endpoint,
      method,
      status_code: status,
      error_msg: msg.slice(0, 500),
      user_id: meta?.userId ?? null,
      ip: meta?.ip ?? null,
    })
  } catch {
    /* stille fail — logging mag nooit het verzoek breken */
  }
}
