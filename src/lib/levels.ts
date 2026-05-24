export interface LevelDef {
  name: string
  minXp: number
}

export const LEVELS: LevelDef[] = [
  { name: 'Recruit',     minXp: 0     },
  { name: 'Initiate',    minXp: 100   },
  { name: 'Member',      minXp: 500   },
  { name: 'Regular',     minXp: 1000  },
  { name: 'Veteran',     minXp: 2000  },
  { name: 'Elite',       minXp: 3500  },
  { name: 'Champion',    minXp: 5000  },
  { name: 'Master',      minXp: 7500  },
  { name: 'Grandmaster', minXp: 12000 },
  { name: 'Legend',      minXp: 20000 },
]

export function getLevelIndex(currentLevelName: string): number {
  return LEVELS.findIndex((l) => l.name === currentLevelName)
}

export function getNextLevel(currentLevelName: string): LevelDef | null {
  const idx = getLevelIndex(currentLevelName)
  if (idx === -1 || idx >= LEVELS.length - 1) return null
  return LEVELS[idx + 1]
}

export function getXpToNextLevel(xp: number, currentLevelName: string): number {
  const next = getNextLevel(currentLevelName)
  if (!next) return 0
  return Math.max(0, next.minXp - xp)
}
