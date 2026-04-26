'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { VoidsignlLogo } from '@/components/ui/logo'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setError('Please confirm your email first. Check your inbox for the confirmation link.')
      } else if (error.message.toLowerCase().includes('invalid login credentials')) {
        setError('Wrong email or password')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    // Check if user has completed onboarding
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_onboarded')
        .eq('id', user.id)
        .single()

      if (profile?.is_onboarded) {
        router.push('/dashboard')
      } else {
        router.push('/onboarding')
      }
    } else {
      router.push('/dashboard')
    }
  }

  async function handleDiscordLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden vs-scanlines">
      {/* Subtle background ambient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-purple/[0.04] rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10 animate-fade-in">
          <VoidsignlLogo size={64} animated className="mx-auto mb-6 text-text" />
          <p className="vs-counter text-[10px] text-purple-light tabular-nums mb-2">
            ENTRY · 01
          </p>
          <h1
            className="text-2xl tracking-[4px] font-bold mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            VOIDSIGNL
          </h1>
          <p className="text-[13px] tracking-[3px] text-text-dim">
            NOT FOR EVERYONE · FOR THOSE WHO KNOW
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 animate-slide-up vs-brackets">
          {error && (
            <div className="bg-danger/10 border border-danger/20 rounded-lg px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="login-email" className="vs-label block mb-1.5">EMAIL</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="vs-input"
              autoComplete="email"
              required
              aria-invalid={!!error && error.toLowerCase().includes('email')}
            />
          </div>

          <div>
            <label htmlFor="login-password" className="vs-label block mb-1.5">PASSWORD</label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="vs-input"
              autoComplete="current-password"
              required
              aria-invalid={!!error && error.toLowerCase().includes('password')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="vs-btn vs-btn-primary w-full disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" /> Entering...</>
            ) : (
              'Enter the void'
            )}
          </button>
        </form>

        <div className="mt-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-void px-4 text-xs text-text-dim">or</span>
            </div>
          </div>

          <button
            onClick={handleDiscordLogin}
            className="vs-btn vs-btn-ghost w-full"
          >
            <svg width="18" height="14" viewBox="0 0 71 55" fill="currentColor">
              <path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.7 40.7 0 00-1.8 3.7 54 54 0 00-16.2 0A26.4 26.4 0 0025.4.3a.2.2 0 00-.2-.1 58.3 58.3 0 00-14.7 4.6.2.2 0 00-.1.1C1.5 18.7-.9 32 .3 45.1v.1a58.8 58.8 0 0017.9 9.1.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.8 38.8 0 01-5.5-2.7.2.2 0 01 0-.4l1.1-.9a.2.2 0 01.2 0 42 42 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.4 36.4 0 01-5.5 2.7.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1A58.6 58.6 0 0070.7 45.2v-.1c1.4-15-2.3-28-9.8-39.6a.2.2 0 00-.1-.1zM23.7 37c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.8 7-6.2 7zm23 0c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.7 7-6.2 7z"/>
            </svg>
            Continue with Discord
          </button>
        </div>

        <p className="text-center mt-8 text-sm text-text-dim">
          No account?{' '}
          <Link href="/register" className="text-purple hover:text-purple-light transition-colors">
            Request access
          </Link>
        </p>
      </div>
    </div>
  )
}
