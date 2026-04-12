'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { VoidsignlLogo } from '@/components/ui/logo'
import { ChevronRight, Check, Gamepad2, User, Image } from 'lucide-react'

const PLATFORM_AVATARS = [
  '/avatars/void-01.svg', '/avatars/void-02.svg', '/avatars/void-03.svg',
  '/avatars/void-04.svg', '/avatars/void-05.svg', '/avatars/void-06.svg',
]

type Step = 'username' | 'avatar' | 'games' | 'done'

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('username')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [games, setGames] = useState<{ id: string; name: string; slug: string }[]>([])
  const [selectedGames, setSelectedGames] = useState<string[]>([])
  const [platforms, setPlatforms] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadGames()
    loadExistingProfile()
  }, [])

  async function loadGames() {
    const { data } = await supabase
      .from('games')
      .select('id, name, slug')
      .eq('is_approved', true)
      .order('name')
    if (data) setGames(data)
  }

  async function loadExistingProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, display_name, is_onboarded')
        .eq('id', user.id)
        .single()
      if (profile) {
        if (profile.is_onboarded) {
          router.push('/dashboard')
          return
        }
        if (profile.username) setUsername(profile.username)
        if (profile.display_name) setDisplayName(profile.display_name)
      }
    }
  }

  async function handleUsernameStep() {
    setError('')
    if (username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }
    const { data: existing } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .neq('id', (await supabase.auth.getUser()).data.user?.id)
      .single()

    if (existing) {
      setError('Username already taken')
      return
    }
    setStep('avatar')
  }

  function toggleGame(gameId: string) {
    setSelectedGames(prev =>
      prev.includes(gameId) ? prev.filter(id => id !== gameId) : [...prev, gameId]
    )
  }

  function togglePlatform(platform: string) {
    setPlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    )
  }

  async function finishOnboarding() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('profiles')
      .update({
        username,
        display_name: displayName || username,
        avatar_url: selectedAvatar || null,
        platforms,
        is_onboarded: true,
      })
      .eq('id', user.id)

    if (selectedGames.length > 0) {
      const userGames = selectedGames.map((gameId, i) => ({
        user_id: user.id,
        game_id: gameId,
        is_main: i === 0,
      }))
      await supabase.from('user_games').insert(userGames)
    }

    await supabase.rpc('add_xp', { user_uuid: user.id, amount: 10 })

    setStep('done')
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  const steps = [
    { key: 'username', label: 'Identity', icon: User },
    { key: 'avatar', label: 'Avatar', icon: Image },
    { key: 'games', label: 'Games', icon: Gamepad2 },
  ]

  const currentIndex = steps.findIndex(s => s.key === step)

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <VoidsignlLogo size={40} className="mx-auto mb-4 text-text" />
          <p className="vs-label">SETUP YOUR SIGNAL</p>
        </div>

        {step !== 'done' && (
          <div className="flex items-center justify-center gap-3 mb-10">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                  i < currentIndex ? 'bg-purple text-white' :
                  i === currentIndex ? 'bg-purple/20 text-purple border border-purple/40' :
                  'bg-surface text-text-dim border border-border'
                }`}>
                  {i < currentIndex ? <Check size={14} /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-12 h-[1px] ${i < currentIndex ? 'bg-purple' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {step === 'username' && (
          <div className="animate-slide-up space-y-6">
            <div>
              <label className="vs-label block mb-2">USERNAME</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                className="vs-input text-lg"
                placeholder="your-name"
                maxLength={24}
              />
            </div>
            <div>
              <label className="vs-label block mb-2">DISPLAY NAME</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="vs-input"
                placeholder="How others see you (optional)"
                maxLength={32}
              />
            </div>
            <div>
              <label className="vs-label block mb-3">PLATFORMS</label>
              <div className="flex flex-wrap gap-2">
                {['PC', 'PlayStation', 'Xbox', 'Switch', 'Mobile'].map(p => (
                  <button
                    key={p}
                    onClick={() => togglePlatform(p)}
                    className={`vs-btn text-sm px-4 py-2 ${
                      platforms.includes(p)
                        ? 'bg-purple/20 text-purple border border-purple/30'
                        : 'vs-btn-ghost'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-danger text-sm">{error}</p>}
            <button onClick={handleUsernameStep} className="vs-btn vs-btn-primary w-full">
              Continue <ChevronRight size={16} />
            </button>
          </div>
        )}

        {step === 'avatar' && (
          <div className="animate-slide-up space-y-6">
            <div>
              <label className="vs-label block mb-3">CHOOSE YOUR AVATAR</label>
              <div className="grid grid-cols-3 gap-3">
                {PLATFORM_AVATARS.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedAvatar(url)}
                    className={`aspect-square rounded-xl bg-surface-2 flex items-center justify-center border transition-all ${
                      selectedAvatar === url
                        ? 'border-purple ring-2 ring-purple/20'
                        : 'border-border hover:border-border-hover'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-full bg-purple/20 flex items-center justify-center text-purple text-2xl font-bold">
                      {String.fromCharCode(65 + i)}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-dim mt-3 text-center">
                You can upload a custom avatar later in your profile settings
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('username')} className="vs-btn vs-btn-ghost flex-1">
                Back
              </button>
              <button onClick={() => setStep('games')} className="vs-btn vs-btn-primary flex-1">
                Continue <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 'games' && (
          <div className="animate-slide-up space-y-6">
            <div>
              <label className="vs-label block mb-3">SELECT YOUR GAMES</label>
              <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
                {games.map(game => (
                  <button
                    key={game.id}
                    onClick={() => toggleGame(game.id)}
                    className={`text-left px-4 py-3 rounded-lg border transition-all text-sm ${
                      selectedGames.includes(game.id)
                        ? 'bg-purple/15 border-purple/30 text-text'
                        : 'bg-surface border-border text-text-muted hover:border-border-hover'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {selectedGames.includes(game.id) && <Check size={14} className="text-purple" />}
                      {game.name}
                    </span>
                  </button>
                ))}
              </div>
              {selectedGames.length > 0 && (
                <p className="text-xs text-cyan mt-2">
                  {selectedGames.length} game{selectedGames.length > 1 ? 's' : ''} selected — first one is your main
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('avatar')} className="vs-btn vs-btn-ghost flex-1">
                Back
              </button>
              <button
                onClick={finishOnboarding}
                disabled={loading}
                className="vs-btn vs-btn-primary flex-1"
              >
                {loading ? 'Setting up...' : 'Complete setup'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center animate-fade-in space-y-4">
            <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto">
              <Check size={28} className="text-success" />
            </div>
            <h2 className="text-xl font-medium">You&apos;re in</h2>
            <p className="text-text-dim text-sm">Welcome to the void, {displayName || username}</p>
            <p className="text-xs text-purple">+10 XP earned</p>
          </div>
        )}
      </div>
    </div>
  )
}
