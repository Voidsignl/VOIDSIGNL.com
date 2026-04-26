/**
 * Het is groot, het is donker, het is een bank-vault deur.
 * Hero komt op homepage en bovenaan elke category page.
 */
import { LockKeyhole } from 'lucide-react'

interface MarketHeroProps {
  title?: string
  subtitle?: string
  /** When set, hero collapses to a slim banner rather than full-bleed. */
  compact?: boolean
}

export function MarketHero({
  title = 'THE VOID MARKET',
  subtitle = 'Only for those who know.',
  compact = false,
}: MarketHeroProps) {
  return (
    <section
      className={`vs-scanlines relative overflow-hidden rounded-2xl border border-border bg-[#0a0a0e] mb-6 ${
        compact ? 'py-8 px-6' : 'py-14 px-6 md:py-20 md:px-12'
      }`}
    >
      {/* Grid background — pure CSS, no animation */}
      <div
        className="absolute inset-0 opacity-[0.18] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(107,63,224,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(107,63,224,0.16) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 35%, transparent 80%)',
        }}
      />
      {/* Glow */}
      <div className="absolute inset-x-0 -top-1/2 h-full bg-[radial-gradient(ellipse_at_center,rgba(107,63,224,0.18),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-x-0 -bottom-1/2 h-full bg-[radial-gradient(ellipse_at_center,rgba(0,200,240,0.12),transparent_60%)] pointer-events-none" />

      <div className="relative z-10 max-w-3xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
          <p className="vs-counter text-[10px] text-cyan tracking-[3px]">SECURE · MEMBERS-ONLY · ESCROWED</p>
        </div>
        <h1
          className={`tracking-[2px] md:tracking-[4px] font-bold text-white ${
            compact ? 'text-3xl' : 'text-4xl md:text-6xl'
          }`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h1>
        <p className="text-text-muted mt-3 text-sm md:text-base flex items-center gap-2">
          <LockKeyhole size={14} className="text-purple-light shrink-0" />
          {subtitle}
        </p>
      </div>
    </section>
  )
}
