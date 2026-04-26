/* VOIDSIGNL service worker — minimal: fetch passthrough, push display */

const CACHE = 'voidsignl-shell-v1'

self.addEventListener('install', () => {
  // Skip waiting so updates apply on next page load
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Network-first for navigation; do NOT intercept other requests so we don't
// break Supabase / Next.js dynamic chunks. Stale-while-revalidate would need
// careful HTTP cache headers we don't control yet.
self.addEventListener('fetch', () => {
  // no-op: passthrough
})

// Push notifications --------------------------------------------------------
self.addEventListener('push', (event) => {
  let data = { title: 'VOIDSIGNL', body: 'New activity', link: '/notifications' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch (_) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: data.tag || 'voidsignl',
      data: { link: data.link },
      renotify: true,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const link = (event.notification.data && event.notification.data.link) || '/dashboard'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
      for (const c of cs) {
        if ('focus' in c) {
          c.navigate(link)
          return c.focus()
        }
      }
      return self.clients.openWindow(link)
    })
  )
})
