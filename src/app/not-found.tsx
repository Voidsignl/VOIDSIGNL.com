import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="font-mono text-xs tracking-[0.4em] text-text-dim uppercase mb-4">
          ERR_NOT_FOUND
        </p>
        <h1 className="text-6xl font-bold mb-3" style={{ fontFamily: 'Space Mono, monospace' }}>
          404
        </h1>
        <p className="text-text-dim mb-8">
          De pagina die je zoekt bestaat niet of is verplaatst.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-md border border-white/20 hover:border-white/40 hover:bg-white/5 transition-colors font-mono text-sm"
        >
          ← Terug naar home
        </Link>
      </div>
    </div>
  )
}
