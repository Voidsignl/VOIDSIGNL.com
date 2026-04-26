'use client'

/**
 * Registers the service worker and (a few seconds after first load) shows
 * an install banner if the browser fires beforeinstallprompt.
 */
import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { useLang } from '@/lib/lang-context'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAProvider() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [bannerVisible, setBannerVisible] = useState(false)
  const { t } = useLang()

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    // Register service worker after the page loads to avoid contention
    const t = setTimeout(() => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch(err => console.warn('[pwa] sw register failed', err))
    }, 2000)

    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    function onPrompt(e: Event) {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
      // Don't pester immediately — show after 8s if user is engaged
      const dismissedAt = Number(localStorage.getItem('voidsignl:pwa-dismissed-at') || 0)
      // Re-show only once a week after dismissal
      if (Date.now() - dismissedAt > 7 * 24 * 3_600_000) {
        setTimeout(() => setBannerVisible(true), 8000)
      }
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  async function install() {
    if (!installEvent) return
    setBannerVisible(false)
    await installEvent.prompt()
    const result = await installEvent.userChoice
    if (result.outcome === 'accepted') {
      localStorage.setItem('voidsignl:pwa-installed', '1')
    } else {
      localStorage.setItem('voidsignl:pwa-dismissed-at', String(Date.now()))
    }
    setInstallEvent(null)
  }

  function dismiss() {
    setBannerVisible(false)
    localStorage.setItem('voidsignl:pwa-dismissed-at', String(Date.now()))
  }

  if (!bannerVisible || !installEvent) return null

  return (
    <div
      className="fixed left-3 right-3 sm:left-auto sm:right-4 z-[60] sm:w-80 vs-card vs-lit animate-slide-up shadow-xl shadow-black/40"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)' }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple/15 border border-purple/30 flex items-center justify-center shrink-0">
          <Download size={18} className="text-purple-light" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{t('pwa.install')}</p>
          <p className="text-[11px] text-text-muted mt-0.5 leading-tight">
            {t('pwa.installDesc')}
          </p>
        </div>
        <button onClick={dismiss} className="text-text-dim hover:text-text shrink-0 p-1 -m-1">
          <X size={14} />
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={dismiss} className="vs-btn vs-btn-ghost text-xs flex-1">{t('pwa.later')}</button>
        <button onClick={install} className="vs-btn vs-btn-primary text-xs flex-1">
          <Download size={12} /> {t('pwa.installBtn')}
        </button>
      </div>
    </div>
  )
}
