'use client'

export default function ClansError({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="font-mono text-[10px] tracking-[0.2em] text-danger uppercase mb-3">Fout</p>
      <h2 className="font-mono text-xl font-bold text-text mb-2">Clans niet beschikbaar.</h2>
      <p className="text-text-dim text-sm mb-6">Probeer het opnieuw.</p>
      <button
        onClick={reset}
        className="px-5 py-2.5 bg-purple text-white font-mono text-sm rounded-lg hover:bg-purple/85 transition-colors"
      >
        Opnieuw
      </button>
    </div>
  )
}
