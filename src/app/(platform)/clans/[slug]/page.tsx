'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import ClanChat from '@/components/clans/ClanChat'
import ClanWarCard from '@/components/clans/ClanWarCard'
import ClanOverviewTab from '@/components/clans/ClanOverviewTab'
import ClanMembersTab from '@/components/clans/ClanMembersTab'
import ClanXpRules from '@/components/clans/ClanXpRules'
import ClanQuestCard from '@/components/clans/ClanQuestCard'

type Tab = 'overview' | 'members' | 'quests' | 'war' | 'chat' | 'settings'

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
  created_at: string
  owner?: {
    id: string
    username: string
    display_name?: string | null
    avatar_url?: string | null
  } | null
}

interface MemberRow {
  id: string
  role: 'owner' | 'officer' | 'member'
  joined_at: string
  user: {
    id: string
    username: string
    display_name?: string | null
    avatar_url?: string | null
    accent_color?: string | null
    level_name?: string
    xp?: number
    last_seen_at?: string | null
    is_inner_circle?: boolean
  } | null
}

interface QuestRow {
  id: string
  title: string
  description: string
  quest_type: string
  current_value: number
  target_value: number
  xp_reward: number
  is_completed: boolean
  week_start: string
}

interface XpEvent {
  id: string
  amount: number
  source: string
  user: { username: string; avatar_url?: string | null } | null
}

interface XpRule {
  action: string
  xp_amount: number
  is_enabled: boolean
}

interface ActiveWar {
  id: string
  status: string
  challenger_score: number
  challenged_score: number
  starts_at?: string | null
  ends_at?: string | null
  challenger: {
    id: string
    name: string
    slug: string
    avatar_url?: string | null
  }
  challenged: {
    id: string
    name: string
    slug: string
    avatar_url?: string | null
  }
}

interface ClanApiResponse {
  clan: ClanData
  members: MemberRow[]
  quests: QuestRow[]
  activeWar: ActiveWar | null
  xpHistory: XpEvent[]
  membership: { id: string; role: 'owner' | 'officer' | 'member' } | null
  xpRules: XpRule[] | null
}

interface CurrentUser {
  id: string
  username: string
  clan_id?: string | null
  accent_color?: string | null
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'members', label: 'Leden' },
  { key: 'quests', label: 'Quests' },
  { key: 'war', label: 'War' },
  { key: 'chat', label: 'Chat' },
  { key: 'settings', label: 'Instellingen' },
]

const ACTION_LABELS: Record<string, string> = {
  clip_upload: 'Clip uploaden',
  achievement_unlock: 'Achievement behalen',
  cotw_win: 'Clip of the Week winnen',
  forum_post: 'Forum post plaatsen',
  forum_reply: 'Forum reply plaatsen',
  buddy_accepted: 'Buddy request accepteren',
  war_won: 'War winnen',
  quest_completed: 'Quest voltooien',
  daily_login: 'Dagelijks inloggen',
}

export default function ClanDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<Tab>('overview')
  const [data, setData] = useState<ClanApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [joining, setJoining] = useState(false)

  const fetchClan = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/clans/${slug}`)
      if (!res.ok) {
        router.push('/clans')
        return
      }
      setData((await res.json()) as ClanApiResponse)
    } finally {
      setLoading(false)
    }
  }, [slug, router])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: authData }) => {
      if (!authData.user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, clan_id, accent_color')
        .eq('id', authData.user.id)
        .maybeSingle<CurrentUser>()
      setCurrentUser(profile)
    })
    void fetchClan()
  }, [fetchClan, supabase])

  async function handleJoin() {
    setJoining(true)
    try {
      const res = await fetch(`/api/clans/${slug}/join`, { method: 'POST' })
      const json = await res.json()
      if (res.ok) await fetchClan()
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

  async function handleWarChallenge() {
    const clanId = prompt('Clan ID van tegenstander:')
    if (!clanId) return
    const res = await fetch(`/api/clans/${slug}/war`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenged_clan_id: clanId }),
    })
    if (res.ok) await fetchClan()
    else alert((await res.json()).error)
  }

  if (loading && !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-48 bg-surface rounded-2xl" />
        <div className="h-12 bg-surface rounded-xl" />
      </div>
    )
  }

  if (!data) return null

  const { clan, members, quests, activeWar, xpHistory, membership, xpRules } =
    data
  const isMember = !!membership
  const isOfficer = ['owner', 'officer'].includes(membership?.role ?? '')
  const isOwner = membership?.role === 'owner'
  const canJoin = !isMember && !currentUser?.clan_id

  const visibleTabs = TABS.filter((t) => {
    if (t.key === 'chat' || t.key === 'settings') return isMember
    return true
  })

  const questsCompleted = quests.filter((q) => q.is_completed).length

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* HERO */}
      <div
        className="relative rounded-2xl overflow-hidden mb-6 border border-border"
        style={{
          background: clan.banner_url
            ? 'transparent'
            : 'linear-gradient(135deg, rgba(107,63,224,0.2) 0%, #0e0e12 60%)',
        }}
      >
        {clan.banner_url && (
          <div className="absolute inset-0">
            <Image
              src={clan.banner_url}
              alt=""
              fill
              className="object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-void via-void/90 to-void/70" />
          </div>
        )}

        <div className="relative z-10 p-6">
          <div className="flex gap-5 items-start flex-col sm:flex-row">
            {/* Avatar */}
            <div className="relative z-10 w-16 h-16 rounded-2xl bg-purple/20 border-2 border-purple/40 flex items-center justify-center shrink-0 overflow-hidden">
              {clan.avatar_url ? (
                <Image
                  src={clan.avatar_url}
                  alt={clan.name}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="font-mono text-2xl font-bold text-purple">
                  {clan.name[0].toUpperCase()}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h1 className="font-mono text-2xl font-bold text-text">
                  {clan.name}
                </h1>
                <span
                  className={`font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                    clan.is_open
                      ? 'bg-success/10 border-success/20 text-success'
                      : 'bg-surface-2 border-border text-text-muted'
                  }`}
                >
                  {clan.is_open ? 'Open' : 'Gesloten'}
                </span>
              </div>

              {clan.description && (
                <p className="text-text-muted text-sm mb-4 leading-relaxed max-w-lg">
                  {clan.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-5 flex-wrap mb-4">
                {[
                  { num: clan.member_count, label: 'Leden', color: '#fff' },
                  {
                    num: clan.xp_total.toLocaleString(),
                    label: 'Clan XP',
                    color: '#6B3FE0',
                  },
                  {
                    num: questsCompleted,
                    label: 'Quests',
                    color: '#22c55e',
                  },
                  {
                    num: members.length,
                    label: 'Actief',
                    color: '#fff',
                  },
                ].map((s, i) => (
                  <div key={s.label} className="flex items-center gap-3">
                    {i > 0 && <div className="w-px h-8 bg-border" />}
                    <div>
                      <p
                        className="font-mono text-lg font-bold leading-none"
                        style={{ color: s.color }}
                      >
                        {s.num}
                      </p>
                      <p className="font-mono text-[9px] text-text-muted uppercase tracking-wider mt-0.5">
                        {s.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Acties */}
              <div className="flex items-center gap-2 flex-wrap">
                {canJoin && (
                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="px-5 py-2.5 bg-purple text-white font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-purple/85 transition-colors disabled:opacity-40"
                  >
                    {joining
                      ? '...'
                      : clan.is_open
                        ? '+ Joinen'
                        : '+ Aanvragen'}
                  </button>
                )}
                {isOfficer && (
                  <button
                    onClick={handleWarChallenge}
                    className="px-4 py-2.5 border border-border text-text-muted font-mono text-xs uppercase tracking-wider rounded-lg hover:border-purple/40 hover:text-text transition-colors duration-200"
                  >
                    ⚔ War uitdagen
                  </button>
                )}
                {isMember && !isOwner && (
                  <button
                    onClick={handleLeave}
                    className="px-4 py-2.5 border border-border text-text-muted font-mono text-xs uppercase tracking-wider rounded-lg hover:border-danger/40 hover:text-danger transition-colors duration-200"
                  >
                    Verlaten
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Owner footer */}
          <div className="mt-4 pt-4 border-t border-border/40 flex items-center gap-6 flex-wrap">
            {clan.owner && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] text-text-dim uppercase tracking-widest">
                  Owner
                </span>
                <Link
                  href={`/profile/${clan.owner.username}`}
                  className="font-mono text-[10px] text-text-muted hover:text-text transition-colors duration-200"
                >
                  {clan.owner.username}
                </Link>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-text-dim uppercase tracking-widest">
                Opgericht
              </span>
              <span className="font-mono text-[10px] text-text-muted">
                {new Date(clan.created_at).toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-text-dim uppercase tracking-widest">
                Capaciteit
              </span>
              <span className="font-mono text-[10px] text-text-muted">
                {clan.member_count}/{clan.max_members}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active war banner */}
      {activeWar && tab !== 'war' && (
        <div className="mb-5">
          <ClanWarCard war={activeWar} myClanId={clan.id} />
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-0.5 bg-surface border border-border rounded-xl p-1 mb-6 overflow-x-auto">
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 min-w-[100px] py-2.5 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-colors duration-200 ${
              tab === t.key
                ? 'bg-purple text-white'
                : 'text-text-muted hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {tab === 'overview' && (
        <ClanOverviewTab
          clan={clan}
          members={members}
          quests={quests}
          xpHistory={xpHistory}
          xpRules={xpRules}
          currentUserId={currentUser?.id}
          canJoin={canJoin}
          onJoin={handleJoin}
          joining={joining}
        />
      )}

      {tab === 'members' && (
        <ClanMembersTab
          members={members}
          currentUserId={currentUser?.id}
          isOfficer={isOfficer}
          isOwner={isOwner}
          clanSlug={slug}
          onRefresh={fetchClan}
        />
      )}

      {tab === 'quests' && (
        <div className="space-y-3">
          {quests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-dim mb-2">
                Geen quests
              </p>
              <p className="text-text-muted text-sm">
                Quests worden wekelijks aangemaakt.
              </p>
            </div>
          ) : (
            quests.map((quest) => (
              <ClanQuestCard key={quest.id} quest={quest} />
            ))
          )}
          {xpHistory.length > 0 && (
            <div className="mt-6">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-purple mb-3">
                Recente clan XP
              </p>
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                {xpHistory.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 px-5 py-3 border-b border-border last:border-0"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple/12 flex items-center justify-center shrink-0 font-mono text-xs text-purple">
                      ⬡
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-muted">
                        {event.user?.username && (
                          <span className="font-mono text-text">
                            {event.user.username}{' '}
                          </span>
                        )}
                        {ACTION_LABELS[event.source] ??
                          event.source.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold text-purple shrink-0">
                      +{event.amount} XP
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'war' && (
        <div className="space-y-4">
          {activeWar ? (
            <ClanWarCard war={activeWar} myClanId={clan.id} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-dim mb-2">
                Geen actieve war
              </p>
              <p className="text-text-muted text-sm mb-6">
                Daag een andere clan uit.
              </p>
              {isOfficer && (
                <button
                  onClick={handleWarChallenge}
                  className="px-5 py-2.5 bg-purple text-white font-mono text-xs uppercase rounded-lg hover:bg-purple/85 transition-colors duration-200"
                >
                  ⚔ War starten
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'chat' && isMember && (
        <ClanChat clanSlug={slug} clanId={clan.id} />
      )}

      {tab === 'settings' && isMember && (
        <ClanXpRules
          clanSlug={slug}
          rules={xpRules ?? []}
          canEdit={isOfficer}
          actionLabels={ACTION_LABELS}
          onSaved={fetchClan}
        />
      )}
    </div>
  )
}
