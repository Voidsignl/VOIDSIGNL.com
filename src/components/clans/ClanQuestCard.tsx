interface ClanQuestCardProps {
  quest: {
    id: string
    title: string
    description: string
    quest_type: string
    target_value: number
    current_value: number
    xp_reward: number
    is_completed: boolean
    week_start: string
  }
}

export default function ClanQuestCard({ quest }: ClanQuestCardProps) {
  const pct = Math.min(100, Math.round((quest.current_value / quest.target_value) * 100))

  return (
    <div
      className={`rounded-xl border p-4 transition-colors duration-200 ${
        quest.is_completed
          ? 'bg-success/5 border-success/20'
          : 'bg-surface border-border'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p
            className={`font-mono text-sm font-bold mb-0.5 ${
              quest.is_completed ? 'text-success' : 'text-text'
            }`}
          >
            {quest.is_completed && '✓ '}
            {quest.title}
          </p>
          <p className="text-text-dim text-xs">{quest.description}</p>
        </div>
        <span className="font-mono text-xs text-purple flex-shrink-0 ml-3">
          +{quest.xp_reward} XP
        </span>
      </div>

      {!quest.is_completed && (
        <>
          <div className="w-full h-1.5 bg-void rounded-full overflow-hidden mb-1">
            <div
              className="h-full rounded-full transition-colors duration-200"
              style={{
                width: `${pct}%`,
                background: pct === 100 ? '#22c55e' : '#6B3FE0',
              }}
            />
          </div>
          <p className="font-mono text-[10px] text-text-dim">
            {quest.current_value}/{quest.target_value}
          </p>
        </>
      )}
    </div>
  )
}
