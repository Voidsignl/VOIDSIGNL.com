'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import ClanChat from '@/components/clans/ClanChat'
import ClanQuestCard from '@/components/clans/ClanQuestCard'
import ClanWarCard from '@/components/clans/ClanWarCard'

interface ClanData {
  id: string
  name: string
  slug: string
  description?: string | null
  avatar_url?: string | null
  banner_url?: string | null
  is_open: boolean
  member_count: number
  max_members: number
  xp_total: number
}

interface MemberRow {
  id: string
  role: string
  joined_at: string
  user: {
    id: string
    username: string
    display_name?: string | null
    avatar_url?: string | null
    accent_color?: string | null
    level_name?: string | null
    xp?: number | null
  } | null
}

interface QuestRow {
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

interface ActiveWar {
  id: string
  status: string
  challenger_score: number
  challenged_score: number
  ends_at?: string | null
  challenger: { id: string; name: string; slug: string; avatar_url?: string | null }
  challenged: { id: string; name: string; slug: string; avatar_url?: string | null }
}

interface XpEvent {
  id: string
  amount: number
  source: string
  created_at: string
  user: { username: string; avatar_url?: string | null } | null
}

interface ClanResponse {
  clan: ClanData
  members: MemberRow[]
  quests: QuestRow[]
  activeWar: ActiveWar | null
  xpHistory: XpEvent[]
  membership: { id: string; role: string } | null
}

interface CurrentUser {
  id: string
  username: string
  role: string
  clan_id: string | null
}

export default function ClanDetailPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const supabase = createClient()
  const slug = params?.slug as string

  const [data, setData] = useState<ClanResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [joining, setJoining] = useState(false)
  const [activeTab, setActiveTab] = useState<'members' | 'quests' | 'war' | 'chat'>('members')

  const fetchClan = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/clans/${slug}`)
      if (!res.ok) {
        router.push('/clans')
        return
      }
      const json = (await res.json()) as ClanResponse
      setData(json)
    } finally {
      setLoading(false)
    }
  }, [slug, router])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: authData }) => {
      if (!authData.user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, role, clan_id')
        .eq('id', authData.user.id)
        .maybeSingle()
      if (profile) setCurrentUser(profile as CurrentUser)
    })
    fetchClan()
  }, [slug, fetchClan, supabase])

  async function handleJoin() {
    setJoining(true)
    try {
      const res = await fetch(`/api/clans/${slug}/join`, { method: 'POST' })
      const json = await res.json()
      if (res.ok) fetchClan()
      else alert(json.error)
    } finally {
      setJoining(false)
    }
  }

  async function handleLeave() {
    if (!confirm('Clan verlaten?')) return
    await fetch(`/api/clans/${slug}/leave`, { method: 'POST' })
    router.push('/clans')
  }

  if (loading || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-40 bg-surface rounded-xl" />
        <div className="h-20 bg-surface rounded-xl" />
      </div>
    )
  }

  const { clan, members, quests, activeWar, xpHistory, membership } = data
  const isMember = !!membership
  const isOfficer = ['owner', 'officer'].includes(membership?.role ?? '')
  const isOwner = membership?.role === 'owner'
  const canJoin = !isMember && !currentUser?.clan_id

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Banner */}
      <div className="relative h-40 rounded-xl overflow-hidden bg-surface mb-0">
        {clan.banner_url ? (
          <Image
            src={clan.banner_url}
            alt={clan.name}
            fill
            sizes="(max-width: 1024px) 100vw, 900px"
            className="object-cover"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: 'linear-gradient(135deg, #0e0e12 0%, rgba(107,63,224,0.3) 100%)' }}
          />
        )}
      </div>

      {/* Clan info */}
      <div className="bg-surface border border-border rounded-xl p-5 mb-6 -mt-6 relative">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-2 border-2 border-surface flex-shrink-0 -mt-10">
            {clan.avatar_url ? (
              <Image
                src={clan.avatar_url}
                alt={clan.name}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-purple/20">
                <span className="font-mono text-2xl text-purple">{clan.name[0].toUpperCase()}</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 mt-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-mono text-xl font-bold text-text mb-0.5">{clan.name}</h1>
                {clan.description && (
                  <p className="text-text-dim text-sm">{clan.description}</p>
                )}
              </div>

              {canJoin && (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="px-5 py-2.5 bg-purple text-white font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-purple/85 transition-colors disabled:opacity-40 flex-shrink-0"
                >
                  {joining ? '...' : clan.is_open ? 'Joinen' : 'Aanvragen'}
                </button>
              )}
              {isMember && !isOwner && (
                <button
                  onClick={handleLeave}
                  className="px-4 py-2 border border-border text-text-dim font-mono text-xs rounded-lg hover:border-danger hover:text-danger transition-colors duration-200 flex-shrink-0"
                >
                  Verlaten
                </button>
              )}
            </div>

            <div className="flex items-center gap-6 mt-3">
              <div>
                <p className="font-mono text-lg font-bold text-text">{clan.member_count}</p>
                <p className="font-mono text-[10px] text-text-dim uppercase tracking-wider">Leden</p>
              </div>
              <div>
                <p className="font-mono text-lg font-bold text-purple">
                  {clan.xp_total.toLocaleString()}
                </p>
                <p className="font-mono text-[10px] text-text-dim uppercase tracking-wider">Clan XP</p>
              </div>
              <div>
                <p className="font-mono text-lg font-bold text-text">{clan.max_members}</p>
                <p className="font-mono text-[10px] text-text-dim uppercase tracking-wider">Max</p>
              </div>
              <div>
                <p
                  className={`font-mono text-xs font-bold ${
                    clan.is_open ? 'text-success' : 'text-text-dim'
                  }`}
                >
                  {clan.is_open ? 'Open' : 'Gesloten'}
                </p>
                <p className="font-mono text-[10px] text-text-dim uppercase tracking-wider">Type</p>
              </div>
            </div>
          </div>
        </div>

        {/* Officer acties */}
        {isOfficer && (
          <div className="mt-4 pt-4 border-t border-border flex gap-3 flex-wrap">
            {isOwner && (
              <Link
                href={`/clans/${slug}/settings`}
                className="px-4 py-2 border border-border text-text-dim font-mono text-xs rounded-lg hover:border-purple hover:text-text transition-colors duration-200"
              >
                Instellingen
              </Link>
            )}
            <button
              onClick={async () => {
                const clanId = prompt('Clan ID van tegenstander:')
                if (!clanId) return
                const res = await fetch(`/api/clans/${slug}/war`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ challenged_clan_id: clanId }),
                })
                if (res.ok) fetchClan()
                else alert((await res.json()).error)
              }}
              className="px-4 py-2 border border-border text-text-dim font-mono text-xs rounded-lg hover:border-purple hover:text-text transition-colors duration-200"
            >
              ⚔ War uitdagen
            </button>
          </div>
        )}
      </div>

      {/* Active war */}
      {activeWar && (
        <div className="mb-6">
          <ClanWarCard war={activeWar} myClanId={clan.id} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 mb-6">
        {(
          [
            { key: 'members', label: `Leden (${members.length})` },
            { key: 'quests', label: `Quests (${quests.length})` },
            { key: 'war', label: 'War Historie' },
            ...(isMember ? [{ key: 'chat', label: 'Chat' }] : []),
          ] as { key: 'members' | 'quests' | 'war' | 'chat'; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2.5 rounded-lg font-mono text-xs uppercase tracking-wider transition-colors duration-200 ${
              activeTab === t.key
                ? 'bg-purple text-white'
                : 'text-text-dim hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'members' && (
        <div className="space-y-2">
          {members.map((member) =>
            member.user ? (
              <Link key={member.id} href={`/profile/${member.user.username}`}>
                <div className="flex items-center gap-4 bg-surface border border-border rounded-xl px-4 py-3 hover:border-purple transition-colors duration-200">
                  <div
                    className="w-9 h-9 rounded-full overflow-hidden bg-surface-2 border-2 flex-shrink-0"
                    style={{ borderColor: member.user.accent_color ?? '#6B3FE0' }}
                  >
                    {member.user.avatar_url ? (
                      <Image
                        src={member.user.avatar_url}
                        alt={member.user.username}
                        width={36}
                        height={36}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-mono text-xs text-text-dim">
                          {member.user.username?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-text truncate">
                        {member.user.display_name ?? member.user.username}
                      </span>
                      {member.role !== 'member' && (
                        <span
                          className={`font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                            member.role === 'owner'
                              ? 'bg-cyan/10 text-cyan border border-cyan/20'
                              : 'bg-purple/10 text-purple border border-purple/20'
                          }`}
                        >
                          {member.role}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-text-dim">
                      {member.user.level_name}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-purple flex-shrink-0">
                    {(member.user.xp ?? 0).toLocaleString()} XP
                  </span>
                </div>
              </Link>
            ) : null,
          )}
        </div>
      )}

      {activeTab === 'quests' && (
        <div className="space-y-3">
          {quests.length === 0 ? (
            <p className="text-center text-text-dim font-mono text-sm py-8">
              Geen actieve quests deze week.
            </p>
          ) : (
            quests.map((quest) => <ClanQuestCard key={quest.id} quest={quest} />)
          )}
          {xpHistory.length > 0 && (
            <div className="mt-6">
              <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-3">
                Recente XP
              </p>
              <div className="space-y-2">
                {xpHistory.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      {event.user && (
                        <span className="font-mono text-xs text-text-dim">
                          {event.user.username}
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-text-dim/60">
                        {event.source.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-purple">
                      +{event.amount} XP
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'war' && (
        <div className="text-center py-12">
          <p className="text-text-dim font-mono text-sm">
            {activeWar ? 'Actieve war hierboven zichtbaar.' : 'Geen war geschiedenis.'}
          </p>
        </div>
      )}

      {activeTab === 'chat' && isMember && <ClanChat clanSlug={slug} clanId={clan.id} />}
    </div>
  )
}
