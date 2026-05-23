'use client'

interface Tab {
  key: string
  label: string
  count?: number
  comingSoon?: boolean
}

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (key: string) => void
  variant?: 'pills' | 'underline'
}

export function Tabs({ tabs, active, onChange, variant = 'pills' }: TabsProps) {
  if (variant === 'underline') {
    return (
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => !tab.comingSoon && onChange(tab.key)}
            disabled={tab.comingSoon}
            className={`
              px-5 py-3 font-mono text-xs uppercase tracking-wider
              border-b-2 -mb-px transition-colors duration-200
              ${
                active === tab.key
                  ? 'text-text border-purple'
                  : 'text-text-muted border-transparent hover:text-text'
              }
              ${tab.comingSoon ? 'opacity-30 cursor-not-allowed' : ''}
            `}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-2 font-mono text-text-dim">{tab.count}</span>
            )}
            {tab.comingSoon && <span className="ml-2 font-mono text-[8px]">SOON</span>}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => !tab.comingSoon && onChange(tab.key)}
          disabled={tab.comingSoon}
          className={`
            flex-1 flex items-center justify-center gap-2
            py-2.5 rounded-lg font-mono text-xs uppercase tracking-wider
            transition-colors duration-200
            ${active === tab.key ? 'bg-purple text-white' : 'text-text-muted hover:text-text'}
            ${tab.comingSoon ? 'opacity-30 cursor-not-allowed' : ''}
          `}
        >
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && (
            <span
              className={`font-mono text-[9px] ${
                active === tab.key ? 'text-white/60' : 'text-text-dim'
              }`}
            >
              {tab.count}
            </span>
          )}
          {tab.comingSoon && <span className="font-mono text-[8px] text-text-dim">SOON</span>}
        </button>
      ))}
    </div>
  )
}
