'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

type Language = 'nl' | 'en'
type PlayStyle = 'competitive' | 'casual' | 'coaching' | ''
type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

interface GamePick {
  id: string
  name: string
  cover_url?: string | null
}

interface OnboardingData {
  language: Language
  username: string
  display_name: string
  games: GamePick[]
  main_game_id: string
  platforms: string[]
  playtimes: string[]
  play_style: PlayStyle
  bio: string
  avatar_url: string
}

const COPY = {
  nl: {
    welcome_title: 'De void wacht.',
    welcome_sub: 'Niet voor iedereen. Only for those who know.',
    welcome_btn: 'Enter the void',
    lang_title: 'Kies je taal.',
    lang_sub: 'Je kunt dit later aanpassen in je instellingen.',
    username_title: 'Kies je naam.',
    username_sub: 'Dit is wie jij bent in de void. Kies zorgvuldig.',
    username_placeholder: 'jouw_naam',
    username_hint: 'Minimaal 3 tekens. Alleen letters, cijfers, _ en -',
    username_available: 'Beschikbaar',
    username_preview_label: 'Zo ziet je profiel eruit',
    games_title: 'Welke games speel je?',
    games_sub: 'Kies maximaal 5 games. Markeer je hoofdgame.',
    games_search: 'Zoek een game...',
    games_main: 'Main',
    games_hint:
      'Klik op een game om te selecteren. Klik nogmaals om als main te markeren.',
    platforms_title: 'Waar speel je?',
    platforms_sub: 'Selecteer je platforms en wanneer je actief bent.',
    playtimes_title: 'Wanneer ben je online?',
    style_title: 'Hoe speel je het liefst?',
    style_sub: 'Dit helpt ons de juiste mensen voor je te vinden.',
    profile_title: 'Maak je profiel compleet.',
    profile_sub: 'Een avatar en bio zijn verplicht.',
    avatar_label: 'Avatar *',
    bio_label: 'Bio *',
    bio_placeholder: 'Vertel iets over jezelf als gamer...',
    bio_hint: 'Minimaal 10 tekens',
    avatar_hint: 'JPG, PNG of WebP · Max 2MB',
    avatar_btn: 'Foto uploaden',
    next: 'Volgende',
    back: 'Terug',
    finish: 'Enter the void',
    finishing: 'Bezig...',
    step_of: 'Stap',
    of: 'van',
    inner_circle_title: 'Welkom, Inner Circle.',
    inner_circle_sub: 'Je bent een van de founding members van VOIDSIGNL.',
  },
  en: {
    welcome_title: 'The void awaits.',
    welcome_sub: 'Not for everyone. Only for those who know.',
    welcome_btn: 'Enter the void',
    lang_title: 'Choose your language.',
    lang_sub: 'You can change this later in your settings.',
    username_title: 'Choose your name.',
    username_sub: 'This is who you are in the void. Choose wisely.',
    username_placeholder: 'your_name',
    username_hint: 'At least 3 characters. Letters, numbers, _ and - only.',
    username_available: 'Available',
    username_preview_label: 'Your profile preview',
    games_title: 'Which games do you play?',
    games_sub: 'Choose up to 5 games. Mark your main game.',
    games_search: 'Search a game...',
    games_main: 'Main',
    games_hint: 'Click a game to select it. Click again to mark as main.',
    platforms_title: 'Where do you play?',
    platforms_sub: 'Select your platforms and when you are active.',
    playtimes_title: 'When are you online?',
    style_title: 'How do you like to play?',
    style_sub: 'This helps us find the right people for you.',
    profile_title: 'Complete your profile.',
    profile_sub: 'An avatar and bio are required.',
    avatar_label: 'Avatar *',
    bio_label: 'Bio *',
    bio_placeholder: 'Tell something about yourself as a gamer...',
    bio_hint: 'At least 10 characters',
    avatar_hint: 'JPG, PNG or WebP · Max 2MB',
    avatar_btn: 'Upload photo',
    next: 'Next',
    back: 'Back',
    finish: 'Enter the void',
    finishing: 'Loading...',
    step_of: 'Step',
    of: 'of',
    inner_circle_title: 'Welcome, Inner Circle.',
    inner_circle_sub: 'You are one of the founding members of VOIDSIGNL.',
  },
}

const PLATFORMS = [
  { id: 'pc', label: 'PC', icon: '⬡' },
  { id: 'playstation', label: 'PlayStation', icon: '〇' },
  { id: 'xbox', label: 'Xbox', icon: '⬡' },
  { id: 'switch', label: 'Switch', icon: '〇' },
  { id: 'mobile', label: 'Mobile', icon: '↗' },
]

const PLAYTIMES = [
  { id: 'morning', label_nl: 'Ochtend', label_en: 'Morning', time: '08–12' },
  { id: 'afternoon', label_nl: 'Middag', label_en: 'Afternoon', time: '12–17' },
  { id: 'evening', label_nl: 'Avond', label_en: 'Evening', time: '17–22' },
  { id: 'night', label_nl: 'Nacht', label_en: 'Night', time: '22–02' },
  { id: 'weekend', label_nl: 'Weekend', label_en: 'Weekend', time: 'Za/Zo' },
]

const PLAY_STYLES = [
  {
    id: 'competitive' as const,
    label_nl: 'Competitief',
    label_en: 'Competitive',
    desc_nl: 'Ik speel om te winnen. Ranked, scrims, toernooien.',
    desc_en: 'I play to win. Ranked, scrims, tournaments.',
    icon: '↗',
    color: '#ef4444',
    rgb: '239,68,68',
  },
  {
    id: 'casual' as const,
    label_nl: 'Casual',
    label_en: 'Casual',
    desc_nl: 'Ik speel voor de fun. Samen een squad, goed gezelschap.',
    desc_en: 'I play for fun. Squad up, good vibes.',
    icon: '〇',
    color: '#22c55e',
    rgb: '34,197,94',
  },
  {
    id: 'coaching' as const,
    label_nl: 'Coaching',
    label_en: 'Coaching',
    desc_nl: 'Ik wil beter worden. Of ik kan anderen helpen.',
    desc_en: 'I want to improve. Or I can help others.',
    icon: '⚡',
    color: '#6B3FE0',
    rgb: '107,63,224',
  },
]

const TOTAL_STEPS = 6

interface GameApiRow {
  id: string
  name: string
  cover_url?: string | null
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [innerCircle, setInnerCircle] = useState(false)
  const [done, setDone] = useState(false)

  const [data, setData] = useState<OnboardingData>({
    language: 'nl',
    username: '',
    display_name: '',
    games: [],
    main_game_id: '',
    platforms: [],
    playtimes: [],
    play_style: '',
    bio: '',
    avatar_url: '',
  })

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const [usernameError, setUsernameError] = useState('')
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [allGames, setAllGames] = useState<GameApiRow[]>([])
  const [gameSearch, setGameSearch] = useState('')
  const [gameResults, setGameResults] = useState<GameApiRow[]>([])
  const [searchingGames, setSearchingGames] = useState(false)

  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const t = COPY[data.language]

  useEffect(() => {
    supabase.auth.getUser().then(({ data: authData }) => {
      if (!authData.user) router.push('/login')
    })
  }, [router, supabase])

  useEffect(() => {
    fetch('/api/games')
      .then((r) => r.json())
      .then((j) => setAllGames((j.data as GameApiRow[] | undefined) ?? []))
      .catch(() => setAllGames([]))
  }, [])

  useEffect(() => {
    if (!gameSearch.trim() || gameSearch.length < 2) {
      setGameResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearchingGames(true)
      try {
        const res = await fetch(
          `/api/games/search?q=${encodeURIComponent(gameSearch)}`,
        )
        const json = await res.json()
        setGameResults((json.data as GameApiRow[] | undefined) ?? [])
      } finally {
        setSearchingGames(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [gameSearch])

  const checkUsername = useCallback((value: string) => {
    if (usernameTimer.current) clearTimeout(usernameTimer.current)
    const v = value.trim().toLowerCase()

    if (!v) {
      setUsernameStatus('idle')
      return
    }
    if (v.length < 3) {
      setUsernameStatus('invalid')
      setUsernameError('Minimaal 3 tekens')
      return
    }
    if (!/^[a-z0-9_-]+$/.test(v)) {
      setUsernameStatus('invalid')
      setUsernameError('Alleen letters, cijfers, _ en -')
      return
    }

    setUsernameStatus('checking')
    usernameTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/onboarding/check-username?username=${v}`,
        )
        const json = await res.json()
        if (json.error) {
          setUsernameStatus('invalid')
          setUsernameError(json.error)
        } else if (json.available) {
          setUsernameStatus('available')
        } else {
          setUsernameStatus('taken')
          setUsernameError('Deze naam is al bezet')
        }
      } catch {
        setUsernameStatus('invalid')
        setUsernameError('Check mislukt')
      }
    }, 500)
  }, [])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Max 2MB')
      return
    }

    setUploadError('')
    setAvatarPreview(URL.createObjectURL(file))
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await fetch('/api/onboarding/avatar', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (json.url) {
        setData((d) => ({ ...d, avatar_url: json.url }))
      } else {
        setUploadError(json.error ?? 'Upload mislukt')
        setAvatarPreview('')
      }
    } finally {
      setUploading(false)
    }
  }

  function toggleGame(game: GameApiRow) {
    setData((d) => {
      const already = d.games.find((g) => g.id === game.id)
      if (already) {
        const newGames = d.games.filter((g) => g.id !== game.id)
        const newMain =
          d.main_game_id === game.id ? (newGames[0]?.id ?? '') : d.main_game_id
        return { ...d, games: newGames, main_game_id: newMain }
      }
      if (d.games.length >= 5) return d
      const newGames = [
        ...d.games,
        { id: game.id, name: game.name, cover_url: game.cover_url ?? undefined },
      ]
      return {
        ...d,
        games: newGames,
        main_game_id: d.main_game_id || game.id,
      }
    })
  }

  function setMainGame(gameId: string) {
    setData((d) => ({ ...d, main_game_id: gameId }))
  }

  function togglePlatform(id: string) {
    setData((d) => ({
      ...d,
      platforms: d.platforms.includes(id)
        ? d.platforms.filter((p) => p !== id)
        : [...d.platforms, id],
    }))
  }

  function togglePlaytime(id: string) {
    setData((d) => ({
      ...d,
      playtimes: d.playtimes.includes(id)
        ? d.playtimes.filter((p) => p !== id)
        : [...d.playtimes, id],
    }))
  }

  function canProceed(): boolean {
    switch (step) {
      case 1:
        return true
      case 2:
        return usernameStatus === 'available' && data.username.length >= 3
      case 3:
        return data.games.length >= 1 && !!data.main_game_id
      case 4:
        return data.platforms.length >= 1
      case 5:
        return !!data.play_style
      case 6:
        return !!data.avatar_url && data.bio.trim().length >= 10
      default:
        return true
    }
  }

  async function handleFinish() {
    if (!canProceed() || submitting || !data.play_style) return
    setSubmitting(true)

    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: data.username.toLowerCase(),
          display_name: data.display_name || data.username,
          bio: data.bio,
          avatar_url: data.avatar_url,
          preferred_language: data.language,
          platforms: data.platforms,
          buddy_playtimes: data.playtimes,
          play_style: data.play_style,
          game_ids: data.games.map((g) => g.id),
          main_game_id: data.main_game_id,
        }),
      })
      const json = await res.json()

      if (json.success) {
        if (json.is_inner_circle) {
          setInnerCircle(true)
          setDone(true)
          setTimeout(() => router.push('/dashboard'), 3000)
        } else {
          router.push('/dashboard')
        }
      } else {
        alert(json.error ?? 'Er ging iets mis')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const displayedGames =
    gameSearch.length >= 2
      ? gameResults
      : allGames.filter((g) => g.name.toLowerCase() !== 'tesy')

  if (done && innerCircle) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center text-center px-4"
        style={{ background: '#0e0e12' }}
      >
        <div className="mb-8">
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            className="mx-auto mb-6"
          >
            <circle cx="40" cy="40" r="36" stroke="#00C8F0" strokeWidth="2" opacity="0.6" />
            <circle cx="40" cy="40" r="10" stroke="#00C8F0" strokeWidth="1.5" />
            <line x1="40" y1="2" x2="40" y2="18" stroke="white" strokeWidth="2" />
            <circle cx="40" cy="40" r="2.5" fill="#00C8F0" />
          </svg>
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-cyan mb-3">
            Inner Circle
          </p>
          <h1 className="font-mono text-4xl font-bold text-white mb-4">
            {t.inner_circle_title}
          </h1>
          <p className="text-text-muted text-lg">{t.inner_circle_sub}</p>
        </div>
      </div>
    )
  }

  if (step === 0) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center text-center px-4 relative overflow-hidden"
        style={{ background: '#0e0e12' }}
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#6B3FE0 1px, transparent 1px), linear-gradient(90deg, #6B3FE0 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 mb-12">
          <svg
            width="100"
            height="100"
            viewBox="0 0 80 80"
            fill="none"
            className="mx-auto mb-8"
          >
            <circle cx="40" cy="40" r="36" stroke="#6B3FE0" strokeWidth="1.5" opacity="0.5" />
            <circle cx="40" cy="40" r="27" stroke="#6B3FE0" strokeWidth="1" opacity="0.3" />
            <circle cx="40" cy="40" r="18" stroke="#6B3FE0" strokeWidth="1" opacity="0.2" />
            <circle cx="40" cy="40" r="10" stroke="#6B3FE0" strokeWidth="1.5" />
            <line x1="40" y1="2" x2="40" y2="18" stroke="white" strokeWidth="1.5" />
            <line x1="40" y1="62" x2="40" y2="78" stroke="white" strokeWidth="1.5" opacity="0.4" />
            <line x1="2" y1="40" x2="18" y2="40" stroke="white" strokeWidth="1.5" opacity="0.4" />
            <line x1="62" y1="40" x2="78" y2="40" stroke="white" strokeWidth="1.5" opacity="0.4" />
            <circle cx="40" cy="40" r="2.5" fill="#00C8F0" />
            <line x1="40" y1="40" x2="40" y2="5" stroke="#00C8F0" strokeWidth="1.5" opacity="0.7" />
          </svg>

          <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-purple mb-4">
            VOIDSIGNL
          </p>
          <h1 className="font-mono text-5xl font-bold text-white mb-4 leading-tight">
            {t.welcome_title}
          </h1>
          <p className="font-mono text-sm text-text-muted tracking-wide">
            {t.welcome_sub}
          </p>
        </div>

        <button
          onClick={() => setStep(1)}
          className="relative z-10 px-10 py-4 bg-purple text-white font-mono text-sm uppercase tracking-[0.2em] rounded-xl hover:bg-purple/85 transition-colors duration-200"
        >
          {t.welcome_btn}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0e0e12' }}>
      <div className="w-full h-0.5 bg-surface">
        <div
          className="h-full bg-purple transition-all duration-500"
          style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between px-6 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <svg width="24" height="24" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" stroke="#6B3FE0" strokeWidth="2" opacity="0.6" />
            <circle cx="40" cy="40" r="10" stroke="#6B3FE0" strokeWidth="1.5" />
            <circle cx="40" cy="40" r="2.5" fill="#00C8F0" />
          </svg>
          <span className="font-mono text-xs font-bold text-white tracking-wider">
            VOID<span className="text-purple">SIGNL</span>
          </span>
        </div>
        <span className="font-mono text-[10px] text-text-dim">
          {t.step_of} {step} {t.of} {TOTAL_STEPS}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {step === 1 && (
            <div>
              <StepHeader
                eyebrow="01 — Taal / Language"
                title={t.lang_title}
                subtitle={t.lang_sub}
              />
              <div className="grid grid-cols-2 gap-4">
                {(
                  [
                    { id: 'nl' as Language, label: 'Nederlands', flag: '🇳🇱', sub: 'Dutch' },
                    { id: 'en' as Language, label: 'English', flag: '🇬🇧', sub: 'Engels' },
                  ]
                ).map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setData((d) => ({ ...d, language: lang.id }))}
                    className="p-6 rounded-2xl border-2 transition-all duration-200 text-left"
                    style={{
                      background:
                        data.language === lang.id
                          ? 'rgba(107,63,224,0.12)'
                          : '#1a1a22',
                      borderColor:
                        data.language === lang.id ? '#6B3FE0' : '#3a3a48',
                    }}
                  >
                    <div className="text-3xl mb-3">{lang.flag}</div>
                    <p className="font-mono text-base font-bold text-white mb-1">
                      {lang.label}
                    </p>
                    <p className="font-mono text-xs text-text-muted">{lang.sub}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <StepHeader
                eyebrow="02 — Identity"
                title={t.username_title}
                subtitle={t.username_sub}
              />
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={data.username}
                    onChange={(e) => {
                      const v = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_-]/g, '')
                      setData((d) => ({ ...d, username: v }))
                      checkUsername(v)
                    }}
                    placeholder={t.username_placeholder}
                    maxLength={20}
                    autoFocus
                    className="w-full bg-void border-2 rounded-xl px-5 py-4 text-white text-xl font-mono placeholder-text-dim/60 focus:outline-none transition-colors duration-200"
                    style={{
                      borderColor:
                        usernameStatus === 'available'
                          ? '#22c55e'
                          : usernameStatus === 'taken' ||
                              usernameStatus === 'invalid'
                            ? '#ef4444'
                            : '#3a3a48',
                    }}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && (
                      <div className="w-4 h-4 border-2 border-purple border-t-transparent rounded-full animate-spin" />
                    )}
                    {usernameStatus === 'available' && (
                      <span className="text-success font-mono text-sm">✓</span>
                    )}
                    {(usernameStatus === 'taken' ||
                      usernameStatus === 'invalid') && (
                      <span className="text-danger font-mono text-sm">✕</span>
                    )}
                  </div>
                </div>

                {usernameStatus === 'available' && (
                  <p className="font-mono text-xs text-success">
                    ✓ {t.username_available}
                  </p>
                )}
                {(usernameStatus === 'taken' ||
                  usernameStatus === 'invalid') && (
                  <p className="font-mono text-xs text-danger">
                    {usernameError}
                  </p>
                )}
                {usernameStatus === 'idle' && (
                  <p className="font-mono text-xs text-text-dim">
                    {t.username_hint}
                  </p>
                )}

                {usernameStatus === 'available' && (
                  <div className="mt-4 p-4 bg-surface border border-border rounded-xl">
                    <p className="font-mono text-[10px] text-text-dim uppercase tracking-wider mb-2">
                      {t.username_preview_label}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple/20 border-2 border-purple flex items-center justify-center">
                        <span className="font-mono text-sm font-bold text-purple">
                          {data.username[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-mono text-sm font-bold text-white">
                          {data.username}
                        </p>
                        <p className="font-mono text-[10px] text-text-muted">
                          Initiate
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <StepHeader
                eyebrow="03 — Games"
                title={t.games_title}
                subtitle={t.games_sub}
              />

              {data.games.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {data.games.map((game) => (
                    <button
                      key={game.id}
                      onClick={() => setMainGame(game.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200"
                      style={{
                        background:
                          game.id === data.main_game_id
                            ? 'rgba(107,63,224,0.15)'
                            : '#1a1a22',
                        borderColor:
                          game.id === data.main_game_id
                            ? '#6B3FE0'
                            : '#3a3a48',
                      }}
                    >
                      <span className="text-white text-xs font-mono">{game.name}</span>
                      {game.id === data.main_game_id && (
                        <span className="font-mono text-[9px] text-purple uppercase">
                          {t.games_main}
                        </span>
                      )}
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleGame(game)
                        }}
                        className="text-text-muted hover:text-danger transition-colors font-mono text-xs ml-1"
                      >
                        ✕
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {data.games.length < 5 && (
                <input
                  type="text"
                  value={gameSearch}
                  onChange={(e) => setGameSearch(e.target.value)}
                  placeholder={t.games_search}
                  className="w-full bg-void border border-border rounded-xl px-4 py-3 text-white text-sm font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors duration-200 mb-4"
                />
              )}

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto">
                {(searchingGames ? [] : displayedGames).map((game) => {
                  const selected = !!data.games.find((g) => g.id === game.id)
                  const isMain = game.id === data.main_game_id
                  return (
                    <button
                      key={game.id}
                      onClick={() => toggleGame(game)}
                      disabled={!selected && data.games.length >= 5}
                      className="relative rounded-xl overflow-hidden border transition-all duration-200 disabled:opacity-30"
                      style={{
                        borderColor: isMain
                          ? '#6B3FE0'
                          : selected
                            ? 'rgba(107,63,224,0.4)'
                            : '#3a3a48',
                        background: selected ? 'rgba(107,63,224,0.08)' : '#1a1a22',
                      }}
                    >
                      <div className="aspect-[3/4] bg-void relative">
                        {game.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={game.cover_url}
                            alt={game.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-text-dim text-2xl">⬡</span>
                          </div>
                        )}
                        {isMain && (
                          <div className="absolute top-1 left-1">
                            <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-full bg-purple text-white">
                              Main
                            </span>
                          </div>
                        )}
                        {selected && !isMain && (
                          <div className="absolute top-1 right-1">
                            <span className="font-mono text-[8px] text-success">
                              ✓
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-1.5">
                        <p className="font-mono text-[9px] text-white truncate leading-tight">
                          {game.name}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>

              <p className="font-mono text-[10px] text-text-dim mt-3 text-center">
                {t.games_hint}
              </p>
            </div>
          )}

          {step === 4 && (
            <div>
              <StepHeader
                eyebrow="04 — Platforms"
                title={t.platforms_title}
                subtitle={t.platforms_sub}
              />

              <div className="space-y-6">
                <div className="grid grid-cols-5 gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => togglePlatform(p.id)}
                      className="flex flex-col items-center gap-2 py-4 rounded-xl border transition-all duration-200"
                      style={{
                        background: data.platforms.includes(p.id)
                          ? 'rgba(107,63,224,0.15)'
                          : '#1a1a22',
                        borderColor: data.platforms.includes(p.id)
                          ? '#6B3FE0'
                          : '#3a3a48',
                      }}
                    >
                      <span
                        className="text-lg"
                        style={{
                          color: data.platforms.includes(p.id)
                            ? '#6B3FE0'
                            : '#9998aa',
                        }}
                      >
                        {p.icon}
                      </span>
                      <span
                        className="font-mono text-[9px] uppercase tracking-wider"
                        style={{
                          color: data.platforms.includes(p.id)
                            ? '#fff'
                            : '#9998aa',
                        }}
                      >
                        {p.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div>
                  <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-purple mb-3">
                    {t.playtimes_title}
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {PLAYTIMES.map((pt) => (
                      <button
                        key={pt.id}
                        onClick={() => togglePlaytime(pt.id)}
                        className="flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all duration-200"
                        style={{
                          background: data.playtimes.includes(pt.id)
                            ? 'rgba(107,63,224,0.15)'
                            : '#1a1a22',
                          borderColor: data.playtimes.includes(pt.id)
                            ? '#6B3FE0'
                            : '#3a3a48',
                        }}
                      >
                        <span
                          className="font-mono text-[9px] font-bold"
                          style={{
                            color: data.playtimes.includes(pt.id)
                              ? '#fff'
                              : '#9998aa',
                          }}
                        >
                          {data.language === 'nl' ? pt.label_nl : pt.label_en}
                        </span>
                        <span
                          className="font-mono text-[8px]"
                          style={{
                            color: data.playtimes.includes(pt.id)
                              ? '#6B3FE0'
                              : '#3a3a48',
                          }}
                        >
                          {pt.time}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <StepHeader
                eyebrow="05 — Play style"
                title={t.style_title}
                subtitle={t.style_sub}
              />
              <div className="space-y-3">
                {PLAY_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() =>
                      setData((d) => ({ ...d, play_style: style.id }))
                    }
                    className="w-full flex items-start gap-5 p-5 rounded-2xl border-2 text-left transition-all duration-200"
                    style={{
                      background:
                        data.play_style === style.id
                          ? `rgba(${style.rgb}, 0.08)`
                          : '#1a1a22',
                      borderColor:
                        data.play_style === style.id ? style.color : '#3a3a48',
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-mono text-2xl"
                      style={{
                        background: `rgba(${style.rgb}, 0.15)`,
                        color: style.color,
                      }}
                    >
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-base font-bold text-white mb-1">
                        {data.language === 'nl' ? style.label_nl : style.label_en}
                      </p>
                      <p className="text-text-muted text-sm leading-relaxed">
                        {data.language === 'nl' ? style.desc_nl : style.desc_en}
                      </p>
                    </div>
                    {data.play_style === style.id && (
                      <div className="shrink-0 mt-1">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: style.color }}
                        >
                          <span className="text-white font-mono text-[10px]">
                            ✓
                          </span>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <StepHeader
                eyebrow="06 — Profile"
                title={t.profile_title}
                subtitle={t.profile_sub}
              />
              <div className="space-y-5">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-purple mb-3">
                    {t.avatar_label}
                  </p>
                  <div className="flex items-center gap-5">
                    <div
                      className="w-20 h-20 rounded-full overflow-hidden border-2 shrink-0 flex items-center justify-center"
                      style={{
                        borderColor: data.avatar_url ? '#6B3FE0' : '#3a3a48',
                        background: '#24242e',
                      }}
                    >
                      {avatarPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarPreview}
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-mono text-2xl text-text-dim">
                          {data.username?.[0]?.toUpperCase() ?? '?'}
                        </span>
                      )}
                    </div>

                    <div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="px-5 py-2.5 border border-border text-text-muted font-mono text-xs uppercase tracking-wider rounded-lg hover:border-purple/40 hover:text-white transition-colors duration-200 disabled:opacity-40 mb-2 block"
                      >
                        {uploading ? '...' : t.avatar_btn}
                      </button>
                      <p className="font-mono text-[10px] text-text-dim">
                        {t.avatar_hint}
                      </p>
                      {uploadError && (
                        <p className="font-mono text-[10px] text-danger mt-1">
                          {uploadError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-purple block mb-2">
                    {t.bio_label}
                  </label>
                  <textarea
                    value={data.bio}
                    onChange={(e) =>
                      setData((d) => ({ ...d, bio: e.target.value }))
                    }
                    placeholder={t.bio_placeholder}
                    rows={4}
                    maxLength={300}
                    className="w-full bg-void border border-border rounded-xl px-4 py-3 text-white text-sm font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors duration-200 resize-none"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="font-mono text-[10px] text-text-dim">
                      {t.bio_hint}
                    </p>
                    <p className="font-mono text-[10px] text-text-dim">
                      {data.bio.length}/300
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-10">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="px-5 py-3 border border-border text-text-muted font-mono text-xs uppercase tracking-wider rounded-xl hover:border-purple/40 hover:text-white transition-colors duration-200"
            >
              {t.back}
            </button>

            {step < TOTAL_STEPS ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="flex-1 py-3 bg-purple text-white font-mono text-xs uppercase tracking-wider rounded-xl hover:bg-purple/85 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {t.next}
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={!canProceed() || submitting}
                className="flex-1 py-3 bg-purple text-white font-mono text-sm uppercase tracking-wider rounded-xl hover:bg-purple/85 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {submitting ? t.finishing : t.finish}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StepHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: string
  subtitle: string
}) {
  return (
    <div className="mb-8">
      <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-purple mb-2">
        {eyebrow}
      </p>
      <h2 className="font-mono text-2xl font-bold text-white mb-2 leading-tight">
        {title}
      </h2>
      <p className="text-text-muted text-sm leading-relaxed">{subtitle}</p>
    </div>
  )
}
