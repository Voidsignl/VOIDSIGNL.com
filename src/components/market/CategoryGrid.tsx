/**
 * 2x2 category-tiles. Elke tile heeft eigen accent + count.
 * Vault toont HIGH RISK label.
 */
import Link from 'next/link'
import { AlertTriangle, ArrowUpRight } from 'lucide-react'
import { MARKET_CATEGORIES, type MarketCategory } from '@/types'
import { categoryAccent, CATEGORY_ICONS } from '@/lib/market-utils'

interface CategoryGridProps {
  counts?: Partial<Record<MarketCategory, number>>
}

export function CategoryGrid({ counts = {} }: CategoryGridProps) {
  const cats = Object.entries(MARKET_CATEGORIES) as [MarketCategory, typeof MARKET_CATEGORIES[MarketCategory]][]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
      {cats.map(([id, cat]) => {
        const accent = categoryAccent(id)
        const Icon = CATEGORY_ICONS[id]
        const count = counts[id] ?? 0
        return (
          <Link
            key={id}
            href={`/market/${id}`}
            className={`vs-brackets vs-lit group relative flex flex-col justify-between min-h-[180px] p-5 rounded-xl bg-surface border border-border overflow-hidden transition-all hover:border-purple/40 ${accent.glow} hover:scale-[1.005]`}
          >
            {/* Subtle accent bg */}
            <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full ${accent.bg} opacity-50 blur-3xl pointer-events-none`} />

            {/* Top row: icon + counter */}
            <div className="flex items-start justify-between relative z-10">
              <div className={`w-11 h-11 rounded-lg ${accent.bg} border ${accent.border} flex items-center justify-center`}>
                <Icon size={20} className={accent.text} />
              </div>
              <div className="flex items-center gap-2">
                {cat.highRisk && (
                  <span className="vs-badge text-[9px] bg-danger/20 text-danger border border-danger/40">
                    <AlertTriangle size={9} /> HIGH RISK
                  </span>
                )}
                <ArrowUpRight size={16} className="text-text-dim group-hover:text-purple-light transition-colors" />
              </div>
            </div>

            {/* Body */}
            <div className="relative z-10 mt-4">
              <p className={`vs-counter text-[10px] tabular-nums ${accent.text}`}>
                {String(count).padStart(3, '0')} ITEMS
              </p>
              <h3
                className="text-2xl mt-1 tracking-wide font-semibold text-text"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {cat.label.toUpperCase()}
              </h3>
              <p className="text-xs text-text-muted mt-1.5 lowercase">{cat.blurb}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
