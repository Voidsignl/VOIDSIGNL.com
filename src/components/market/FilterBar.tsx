'use client'

/**
 * Compact filter row: category chip switch (when no category param), game select,
 * search input, sort select, price min/max.
 *
 * Filter state lifted up — parent owns the values.
 */
import { Search, X } from 'lucide-react'
import type { Game, MarketCategory } from '@/types'
import { MARKET_CATEGORIES } from '@/types'

export type SortMode = 'newest' | 'price_asc' | 'price_desc' | 'rep'

export interface MarketFilters {
  search: string
  category?: MarketCategory | 'all'
  game_id?: string
  sort: SortMode
  min?: number
  max?: number
}

interface FilterBarProps {
  filters: MarketFilters
  onChange: (next: MarketFilters) => void
  games: Game[]
  showCategory?: boolean
}

export function FilterBar({ filters, onChange, games, showCategory = true }: FilterBarProps) {
  function patch(p: Partial<MarketFilters>) {
    onChange({ ...filters, ...p })
  }
  const hasFilters =
    filters.search || filters.game_id || (filters.category && filters.category !== 'all') ||
    filters.min !== undefined || filters.max !== undefined

  return (
    <div className="flex flex-col gap-3 mb-5">
      {/* Search row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            type="search"
            value={filters.search}
            onChange={e => patch({ search: e.target.value })}
            placeholder="Search listings..."
            className="vs-input text-sm pl-8"
          />
        </div>
        <select
          value={filters.sort}
          onChange={e => patch({ sort: e.target.value as SortMode })}
          className="vs-input text-xs w-auto appearance-none cursor-pointer"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price · low → high</option>
          <option value="price_desc">Price · high → low</option>
          <option value="rep">Top rated sellers</option>
        </select>
        {hasFilters && (
          <button
            onClick={() => onChange({ search: '', sort: filters.sort, category: showCategory ? 'all' : filters.category })}
            className="vs-btn vs-btn-ghost text-xs"
          >
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Category chips */}
      {showCategory && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {(['all', 'digital', 'services', 'gear', 'vault'] as const).map(c => (
            <button
              key={c}
              onClick={() => patch({ category: c })}
              data-active={(filters.category ?? 'all') === c}
              className="vs-tab shrink-0"
            >
              {c === 'all' ? 'All' : MARKET_CATEGORIES[c].label}
            </button>
          ))}
        </div>
      )}

      {/* Game + price */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <select
          value={filters.game_id || ''}
          onChange={e => patch({ game_id: e.target.value || undefined })}
          className="vs-input text-xs w-auto"
        >
          <option value="">Any game</option>
          {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <div className="flex items-center gap-1">
          <span className="vs-label">€ MIN</span>
          <input
            type="number"
            min={0}
            step={1}
            value={filters.min ?? ''}
            onChange={e => patch({ min: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="0"
            className="vs-input text-xs w-20 py-1.5"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="vs-label">€ MAX</span>
          <input
            type="number"
            min={0}
            step={1}
            value={filters.max ?? ''}
            onChange={e => patch({ max: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="∞"
            className="vs-input text-xs w-20 py-1.5"
          />
        </div>
      </div>
    </div>
  )
}
