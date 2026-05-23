'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error boundary:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="font-mono text-xs tracking-[0.4em] text-text-dim uppercase mb-4">
          ERR_RUNTIME
        </p>
        <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: 'Space Mono, monospace' }}>
          Er ging iets mis
        </h1>
        <p className="text-text-dim mb-2 text-sm">
          Een onverwachte fout heeft deze pagina onderbroken.
        </p>
        {error.digest && (
          <p className="text-text-dim/60 mb-6 text-xs font-mono">
            ref: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-md border border-white/20 hover:border-white/40 hover:bg-white/5 transition-colors font-mono text-sm"
          >
            Probeer opnieuw
          </button>
          <a
            href="/"
            className="px-6 py-3 rounded-md bg-white/5 hover:bg-white/10 transition-colors font-mono text-sm"
          >
            Naar home
          </a>
        </div>
      </div>
    </div>
  )
}
