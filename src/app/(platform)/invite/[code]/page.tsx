'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface InvitePayload {
  id: string
  code: string
  max_uses: number
  uses: number
  expires_at: string | null
  expired: boolean
  exhausted: boolean
  clan: {
    id: string
    slug: string
    name: string
    description?: string | null
    avatar_url?: string | null
    banner_url?: string | null
    member_count: number
    max_members: number
    is_open: boolean
  } | null
}

export default function InviteLandingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const router = useRouter()
  const [invite, setInvite] = useState<InvitePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/invites/${code}`)
      .then(r => r.json())
      .then(j => {
        if (j.error) setError('Deze invite link bestaat niet.')
        else setInvite(j.data)
      })
      .catch(() => setError('Kon invite niet laden.'))
      .finally(() => setLoading(false))
  }, [code])

  async function handleJoin() {
    setJoining(true)
    setError('')
    try {
      const res = await fetch(`/api/invites/${code}/accept`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Joinen mislukt.')
        return
      }
      router.push(`/clans/${json.slug}`)
    } catch {
      setError('Joinen mislukt.')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="animate-pulse bg-surface rounded-2xl h-72" />
      </div>
    )
  }

  if (!invite || !invite.clan) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.2em] text-danger uppercase mb-3">
          Ongeldige link
        </p>
        <h1 className="font-mono text-2xl font-bold text-text mb-3">
          Deze invite link werkt niet meer.
        </h1>
        <p className="text-text-dim text-sm mb-8">
          {error || 'De link is verwijderd of nooit aangemaakt.'}
        </p>
        <Link
          href="/clans"
          className="px-6 py-3 bg-purple text-white font-mono text-sm rounded-lg hover:bg-purple/85 transition-colors"
        >
          Bekijk alle clans
        </Link>
      </div>
    )
  }

  const clan = invite.clan
  const blocked = invite.expired || invite.exhausted

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="relative h-32 bg-void">
          {clan.banner_url && (
            <Image src={clan.banner_url} alt="" fill className="object-cover opacity-60" />
          )}
        </div>

        <div className="px-6 pb-6">
          <div className="relative -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl border-4 border-surface bg-surface-2 overflow-hidden">
              {clan.avatar_url ? (
                <Image src={clan.avatar_url} alt={clan.name} width={80} height={80} className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-mono text-2xl text-text-dim">
                  {clan.name[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-1">
            Je bent uitgenodigd
          </p>
          <h1 className="font-mono text-2xl font-bold text-text mb-2">{clan.name}</h1>

          {clan.description && (
            <p className="text-text-dim text-sm mb-4 leading-relaxed line-clamp-3">
              {clan.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-text-dim font-mono text-xs mb-6">
            <span>{clan.member_count}/{clan.max_members} leden</span>
            <span>{clan.is_open ? 'Open' : 'Op uitnodiging'}</span>
          </div>

          {blocked ? (
            <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg mb-4">
              <p className="font-mono text-xs text-danger">
                {invite.expired ? 'Deze link is verlopen.' : 'Deze link heeft het maximum aantal joins bereikt.'}
              </p>
            </div>
          ) : null}

          {error && (
            <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg mb-4">
              <p className="font-mono text-xs text-danger">{error}</p>
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={joining || blocked}
            className="w-full py-3 bg-purple text-white font-mono text-sm uppercase tracking-wider rounded-lg hover:bg-purple/85 transition-colors disabled:opacity-40"
          >
            {joining ? 'Bezig...' : 'Clan joinen'}
          </button>

          <Link
            href={`/clans/${clan.slug}`}
            className="block text-center mt-3 font-mono text-xs text-text-dim hover:text-text transition-colors"
          >
            Bekijk clan eerst →
          </Link>
        </div>
      </div>
    </div>
  )
}
