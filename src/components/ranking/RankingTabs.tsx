'use client'

interface Tab {
  key: string
  label: string
  comingSoon?: boolean
}

const TABS: Tab[] = [
  { key: 'global', label: 'Global' },
  { key: 'clips', label: 'Clips' },
  { key: 'coaching', label: 'Coaching' },
  { key: 'clans', label: 'Clans' },
]

interface RankingTabsProps {
  active: string
  onChange: (tab: string) => void
}

export default function RankingTabs({ active, onChange }: RankingTabsProps) {
  return (
    <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
      {TABS.map(tab => (
        <button
          key={tab.key}
          onClick={() => !tab.comingSoon && onChange(tab.key)}
          disabled={tab.comingSoon}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-mono text-xs uppercase tracking-wider transition-colors duration-200 ${
            active === tab.key
              ? 'bg-purple text-white'
              : tab.comingSoon
                ? 'text-text-dim/60 cursor-not-allowed'
                : 'text-text-dim hover:text-text'
          }`}
        >
          {tab.label}
          {tab.comingSoon && (
            <span className="text-[8px] tracking-widest text-text-dim/60">SOON</span>
          )}
        </button>
      ))}
    </div>
  )
}
