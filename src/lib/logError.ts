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
    const msg = error instanceof Error ? error.message : String(error ?? '')
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
