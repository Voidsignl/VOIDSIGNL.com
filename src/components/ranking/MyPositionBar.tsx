interface MyPositionBarProps {
  rank: number
  xp: number
  levelName: string
  cotwWins: number
}

export default function MyPositionBar({ rank, xp, levelName, cotwWins }: MyPositionBarProps) {
  return (
    <div className="fixed bottom-20 md:bottom-4 left-0 right-0 z-40 px-4 pointer-events-none">
      <div className="max-w-2xl mx-auto">
        <div className="bg-void/95 backdrop-blur-md border border-purple/40 rounded-xl px-5 py-3 flex items-center justify-between pointer-events-auto shadow-lg shadow-purple/15">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-purple">Jouw positie</span>
            <span className="font-mono text-lg font-bold text-text">#{rank}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-text-dim">{levelName}</span>
            {cotwWins > 0 && (
              <span className="font-mono text-xs text-purple">{cotwWins}× CotW</span>
            )}
            <span className="font-mono text-sm font-bold text-text">
              {xp.toLocaleString()}
              <span className="text-text-dim/60 text-[10px] ml-1">XP</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
