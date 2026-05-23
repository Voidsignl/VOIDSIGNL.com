export interface AchievementCardData {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  category: string
  xp_reward: number
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  is_unlocked: boolean
  unlocked_at: string | null
  current_value: number
  target_value: number
}

const RARITY_COLORS: Record<string, { border: string; glow: string; label: string }> = {
  common: { border: '#3a3a48', glow: 'rgba(153,152,170,0.10)', label: '#9998aa' },
  uncommon: { border: '#22c55e', glow: 'rgba(34,197,94,0.15)', label: '#22c55e' },
  rare: { border: '#00C8F0', glow: 'rgba(0,200,240,0.15)', label: '#00C8F0' },
  epic: { border: '#6B3FE0', glow: 'rgba(107,63,224,0.20)', label: '#6B3FE0' },
  legendary: { border: '#f59e0b', glow: 'rgba(245,158,11,0.20)', label: '#f59e0b' },
}

export default function AchievementCard({ achievement }: { achievement: AchievementCardData }) {
  const colors = RARITY_COLORS[achievement.rarity] ?? RARITY_COLORS.common
  const pct = achievement.target_value > 0
    ? Math.min(100, Math.round((achievement.current_value / achievement.target_value) * 100))
    : 0

  return (
    <div
      className="relative rounded-xl border p-4 transition-colors duration-200"
      style={{
        background: achievement.is_unlocked ? colors.glow : '#1a1a22',
        borderColor: achievement.is_unlocked ? colors.border : '#3a3a48',
        boxShadow: achievement.is_unlocked ? `0 0 20px ${colors.glow}` : 'none',
        opacity: achievement.is_unlocked ? 1 : 0.5,
      }}
    >
      <div
        className="text-3xl mb-3 text-center"
        style={{ filter: achievement.is_unlocked ? 'none' : 'grayscale(100%)' }}
      >
        {achievement.icon}
      </div>

      <p className="font-mono text-xs font-bold text-text text-center mb-1 leading-tight">
        {achievement.name}
      </p>

      <p className="text-text-dim text-[10px] text-center leading-relaxed mb-3">
        {achievement.description}
      </p>

      <div className="flex justify-center mb-3">
        <span
          className="font-mono text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full border"
          style={{ borderColor: colors.border, color: colors.label, background: colors.glow }}
        >
          {achievement.rarity}
        </span>
      </div>

      {!achievement.is_unlocked && achievement.target_value > 1 && (
        <div>
          <div className="w-full h-1 bg-void rounded-full overflow-hidden mb-1">
            <div
              className="h-full rounded-full transition-colors duration-200"
              style={{ width: `${pct}%`, background: colors.border }}
            />
          </div>
          <p className="font-mono text-[9px] text-text-dim text-center">
            {achievement.current_value}/{achievement.target_value}
          </p>
        </div>
      )}

      {achievement.xp_reward > 0 && (
        <p
          className="font-mono text-[9px] text-center mt-2"
          style={{ color: achievement.is_unlocked ? colors.label : '#3a3a48' }}
        >
          +{achievement.xp_reward} XP
        </p>
      )}

      {achievement.is_unlocked && achievement.unlocked_at && (
        <p className="text-[9px] text-center mt-1" style={{ color: colors.label, opacity: 0.6 }}>
          {new Date(achievement.unlocked_at).toLocaleDateString('nl-NL')}
        </p>
      )}
    </div>
  )
}
