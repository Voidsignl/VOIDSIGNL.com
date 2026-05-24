'use client'

import Link from 'next/link'
import Image from 'next/image'

interface MemberLite {
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

interface QuestLite {
  id: string
  title: string
  description: string
  current_value: number
  target_value: number
  xp_reward: number
  is_completed: boolean
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

interface ClanLite {
  xp_total: number
  member_count: number
  max_members: number
  is_open: boolean
}

interface Props {
  clan: ClanLite
  members: MemberLite[]
  quests: QuestLite[]
  xpHistory: XpEvent[]
  xpRules?: XpRule[] | null
  currentUserId?: string
  canJoin: boolean
  onJoin: () => void
  joining: boolean
}

const ACTION_LABELS: Record<string, string> = {
  clip_upload: 'Clip uploaden',
  achievement_unlock: 'Achievement behalen',
  cotw_win: 'CotW winnen',
  forum_post: 'Forum post',
  forum_reply: 'Forum reply',
  buddy_accepted: 'Buddy accepteren',
  war_won: 'War winnen',
  quest_completed: 'Quest voltooien',
  daily_login: 'Dagelijks inloggen',
}

function isOnline(lastSeen?: string | null): boolean {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < 90_000
}

export default function ClanOverviewTab({
  clan,
  members,
  quests,
  xpHistory,
  xpRules,
  currentUserId,
  canJoin,
  onJoin,
  joining,
}: Props) {
  const topMembers = [...members]
    .sort((a, b) => (b.user?.xp ?? 0) - (a.user?.xp ?? 0))
    .slice(0, 5)

  const activeRules = (xpRules ?? []).filter(
    (r) => r.is_enabled && r.xp_amount > 0,
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* LINKS — breed */}
      <div className="lg:col-span-2 space-y-5">
        {/* Actieve quests */}
        {quests.length > 0 && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-purple">
                Wekelijkse quests
              </p>
              <span className="font-mono text-[10px] text-text-muted">
                {quests.filter((q) => q.is_completed).length}/{quests.length}{' '}
                voltooid
              </span>
            </div>
            <div className="p-4 space-y-3">
              {quests.map((quest) => (
                <div
                  key={quest.id}
                  className={`rounded-xl p-4 ${
                    quest.is_completed
                      ? 'bg-success/5 border border-success/20'
                      : 'bg-void border border-border'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p
                      className={`font-mono text-sm font-bold ${
                        quest.is_completed ? 'text-success' : 'text-text'
                      }`}
                    >
                      {quest.is_completed && '✓ '}
                      {quest.title}
                    </p>
                    <span className="font-mono text-xs text-purple shrink-0 ml-3">
                      +{quest.xp_reward} XP
                    </span>
                  </div>
                  <p className="text-text-muted text-xs mb-3">
                    {quest.description}
                  </p>
                  {!quest.is_completed && (
                    <>
                      <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden mb-1">
                        <div
                          className="h-full rounded-full bg-purple"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (quest.current_value / quest.target_value) *
                                  100,
                              ),
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="font-mono text-[10px] text-text-muted">
                        {quest.current_value}/{quest.target_value}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top leden */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-purple px-5 py-4 border-b border-border">
            Top leden
          </p>
          {topMembers.map((member) => {
            const u = member.user
            if (!u) return null
            const accent = u.accent_color ?? '#6B3FE0'
            const isOwner = member.role === 'owner'
            const isOff = member.role === 'officer'
            const online = isOnline(u.last_seen_at)
            const isMe = u.id === currentUserId

            return (
              <Link
                key={member.id}
                href={`/profile/${u.username}`}
                className={`flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-0 hover:bg-surface-2 transition-colors duration-200 ${
                  isOwner ? 'border-l-2 border-l-purple' : ''
                } ${isMe ? 'bg-purple/5' : ''}`}
              >
                <div className="relative shrink-0">
                  <div
                    className="w-9 h-9 rounded-full overflow-hidden bg-surface-2 border-2 flex items-center justify-center"
                    style={{ borderColor: accent }}
                  >
                    {u.avatar_url ? (
                      <Image
                        src={u.avatar_url}
                        alt={u.username}
                        width={36}
                        height={36}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span
                        className="font-mono text-xs font-bold"
                        style={{ color: accent }}
                      >
                        {u.username[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  {online && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-surface" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-text truncate">
                      {u.display_name ?? u.username}
                    </span>
                    {isOwner && (
                      <span className="font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border bg-purple/10 border-purple/25 text-purple">
                        Owner
                      </span>
                    )}
                    {isOff && (
                      <span className="font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border bg-cyan/10 border-cyan/25 text-cyan">
                        Officer
                      </span>
                    )}
                    {u.is_inner_circle && (
                      <span className="font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border bg-cyan/10 border-cyan/25 text-cyan">
                        Inner Circle
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-text-muted">
                      {u.level_name}
                    </span>
                    <div className="w-16 h-0.5 bg-void rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((u.xp ?? 0) / 200),
                          )}%`,
                          background: accent,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-mono text-sm font-bold text-text">
                    {(u.xp ?? 0).toLocaleString()}
                  </p>
                  <p className="font-mono text-[9px] text-text-dim uppercase">
                    XP
                  </p>
                </div>
              </Link>
            )
          })}
        </div>

        {/* XP history */}
        {xpHistory.length > 0 && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-purple px-5 py-4 border-b border-border">
              Recente XP
            </p>
            {xpHistory.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0"
              >
                <div className="w-7 h-7 rounded-lg bg-purple/10 flex items-center justify-center shrink-0 text-purple font-mono text-xs">
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
                  +{event.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECHTS — sidebar */}
      <div className="space-y-4">
        {/* XP Voortgang */}
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-purple mb-3">
            Clan voortgang
          </p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-void border border-border rounded-lg p-3">
              <p className="font-mono text-xl font-bold text-purple leading-none">
                {clan.xp_total.toLocaleString()}
              </p>
              <p className="font-mono text-[9px] text-text-muted uppercase mt-1">
                Clan XP
              </p>
            </div>
            <div className="bg-void border border-border rounded-lg p-3">
              <p className="font-mono text-xl font-bold text-text leading-none">
                {clan.member_count}/{clan.max_members}
              </p>
              <p className="font-mono text-[9px] text-text-muted uppercase mt-1">
                Leden
              </p>
            </div>
          </div>
          {/* XP milestone bar */}
          {(() => {
            const milestones = [500, 1000, 2500, 5000, 10000]
            const next =
              milestones.find((m) => m > clan.xp_total) ??
              milestones[milestones.length - 1]
            const pct = Math.min(
              100,
              Math.round((clan.xp_total / next) * 100),
            )
            return (
              <>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-mono text-[9px] text-text-dim uppercase tracking-wider">
                    Naar {next.toLocaleString()} XP
                  </p>
                  <p className="font-mono text-[9px] text-text-muted">{pct}%</p>
                </div>
                <div className="w-full h-1.5 bg-void rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="font-mono text-[10px] text-text-dim mt-1">
                  nog {(next - clan.xp_total).toLocaleString()} XP
                </p>
              </>
            )
          })()}
        </div>

        {/* XP regels preview */}
        {activeRules.length > 0 && (
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-purple mb-3">
              XP verdienen
            </p>
            <div className="space-y-1.5">
              {activeRules.map((rule) => (
                <div
                  key={rule.action}
                  className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                >
                  <span className="text-xs text-text-muted">
                    {ACTION_LABELS[rule.action] ?? rule.action}
                  </span>
                  <span className="font-mono text-xs font-bold text-purple">
                    +{rule.xp_amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Join CTA */}
        {canJoin && (
          <div className="bg-purple/8 border border-purple/20 rounded-xl p-4">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-purple mb-2">
              Word lid
            </p>
            <p className="text-xs text-text-muted mb-3 leading-relaxed">
              {clan.is_open
                ? 'Open clan — je kunt direct joinen.'
                : 'Gesloten clan — stuur een aanvraag.'}
            </p>
            <button
              onClick={onJoin}
              disabled={joining}
              className="w-full py-2.5 bg-purple text-white font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-purple/85 transition-colors disabled:opacity-40"
            >
              {joining ? '...' : clan.is_open ? '+ Joinen' : '+ Aanvragen'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
