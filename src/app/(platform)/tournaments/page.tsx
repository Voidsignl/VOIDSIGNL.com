import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tournaments — VOIDSIGNL',
}

export default function TournamentsPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="w-16 h-16 rounded-full bg-purple/12 border border-purple/25 flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl text-purple">⬡</span>
        </div>
        <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-3">
          Coming Soon
        </p>
        <h1 className="font-mono text-3xl font-bold text-text mb-3">
          Tournaments
        </h1>
        <p className="text-text-dim text-sm leading-relaxed">
          We bouwen iets indrukwekkends. Tournaments komen eraan — stay tuned.
        </p>
      </div>
    </div>
  )
}
