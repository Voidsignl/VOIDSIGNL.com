'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import AchievementUnlockPopup, { type AchievementPopupData } from '@/components/achievements/AchievementUnlockPopup'

interface AchievementContextType {
  showAchievement: (data: AchievementPopupData) => void
}

const AchievementContext = createContext<AchievementContextType>({
  showAchievement: () => {},
})

export function AchievementProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<AchievementPopupData | null>(null)

  const showAchievement = useCallback((data: AchievementPopupData) => {
    setCurrent(data)
  }, [])

  return (
    <AchievementContext.Provider value={{ showAchievement }}>
      {children}
      <AchievementUnlockPopup achievement={current} onClose={() => setCurrent(null)} />
    </AchievementContext.Provider>
  )
}

export const useAchievement = () => useContext(AchievementContext)
