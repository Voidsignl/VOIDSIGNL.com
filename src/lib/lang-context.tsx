'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { t as translate, type Lang } from '@/lib/translations'

interface LangContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
}

const LangContext = createContext<LangContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')
  const supabase = createClient()

  useEffect(() => {
    // Load from localStorage first for instant display
    const saved = typeof window !== 'undefined' ? localStorage.getItem('voidsignl_lang') : null
    if (saved === 'nl' || saved === 'en') setLangState(saved)

    // Then check profile
    loadProfileLang()
  }, [])

  async function loadProfileLang() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('preferred_language').eq('id', user.id).single()
      if (data?.preferred_language) {
        const l = data.preferred_language as Lang
        setLangState(l)
        localStorage.setItem('voidsignl_lang', l)
      }
    }
  }

  async function setLang(newLang: Lang) {
    setLangState(newLang)
    localStorage.setItem('voidsignl_lang', newLang)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ preferred_language: newLang }).eq('id', user.id)
    }
  }

  function t(key: string): string {
    return translate(key, lang)
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
