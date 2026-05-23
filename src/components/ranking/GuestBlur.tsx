import Link from 'next/link'

export default function GuestBlur() {
  return (
    <div className="relative">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-5 py-4 rounded-xl border border-border bg-surface mb-2"
          style={{ filter: 'blur(4px)', opacity: 0.4 - i * 0.04 }}
        >
          <div className="w-8 h-4 bg-border rounded" />
          <div className="w-10 h-10 rounded-full bg-surface-2" />
          <div className="flex-1">
            <div className="w-32 h-3 bg-border rounded mb-2" />
            <div className="w-48 h-2 bg-surface-2 rounded" />
          </div>
          <div className="w-16 h-4 bg-border rounded" />
        </div>
      ))}

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center bg-void/90 backdrop-blur-sm border border-purple/30 rounded-xl px-8 py-6 max-w-xs mx-4">
          <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-2">
            Toegang vereist
          </p>
          <p className="text-text font-mono text-sm font-bold mb-1">
            Zie de volledige ranking
          </p>
          <p className="text-text-dim text-xs mb-4">
            Join VOIDSIGNL om je positie te zien.
          </p>
          <Link
            href="/register"
            className="block w-full py-2.5 bg-purple text-white font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-purple/85 transition-colors text-center"
          >
            Join the void
          </Link>
        </div>
      </div>
    </div>
  )
}
