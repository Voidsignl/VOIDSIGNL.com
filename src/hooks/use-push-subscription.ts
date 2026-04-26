'use client'

/**
 * Client hook for managing the user's web-push subscription.
 *
 * - Checks browser support (Push API + Notification API)
 * - Reads current Notification.permission
 * - subscribe(): requests permission, registers via service worker, persists
 *   subscription to push_subscriptions table
 * - unsubscribe(): unregisters + deletes the row
 */
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'

type Status = 'unsupported' | 'denied' | 'idle' | 'subscribed' | 'pending'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export function usePushSubscription(userId: string | null) {
  const supabase = createClient()
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  // Detect support + initial state
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !VAPID_PUBLIC) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }
    // Check if already subscribed
    navigator.serviceWorker.ready
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => {
        if (sub) setStatus('subscribed')
        else setStatus('idle')
      })
      .catch(() => setStatus('idle'))
  }, [])

  const subscribe = useCallback(async () => {
    if (!userId || !VAPID_PUBLIC) return
    setError(null)
    setStatus('pending')
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') {
        setStatus(perm === 'denied' ? 'denied' : 'idle')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as unknown as BufferSource,
      })

      const json = sub.toJSON() as {
        endpoint?: string
        keys?: { p256dh?: string; auth?: string }
      }
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error('Could not extract subscription keys')
      }

      const { error: e } = await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth_key: json.keys.auth,
        user_agent: navigator.userAgent.slice(0, 200),
      }, { onConflict: 'endpoint' })
      if (e) throw e

      setStatus('subscribed')
    } catch (e) {
      setStatus('idle')
      setError(e instanceof Error ? e.message : 'Subscription failed')
    }
  }, [userId, supabase])

  const unsubscribe = useCallback(async () => {
    setStatus('pending')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        const endpoint = sub.endpoint
        await sub.unsubscribe()
        await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
      }
      setStatus('idle')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unsubscribe failed')
      setStatus('subscribed')
    }
  }, [supabase])

  return { status, error, subscribe, unsubscribe }
}
