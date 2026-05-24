'use client'

import { useState } from 'react'

interface XpRule {
  action: string
  xp_amount: number
  is_enabled: boolean
}

interface Props {
  clanSlug: string
  rules: XpRule[]
  canEdit: boolean
  actionLabels: Record<string, string>
  onSaved: () => void
}

const ACTION_DEFAULTS: Record<string, { default: number; max: number }> = {
  clip_upload: { default: 5, max: 50 },
  achievement_unlock: { default: 10, max: 100 },
  cotw_win: { default: 50, max: 500 },
  forum_post: { default: 3, max: 25 },
  forum_reply: { default: 2, max: 20 },
  buddy_accepted: { default: 5, max: 50 },
  war_won: { default: 200, max: 1000 },
  quest_completed: { default: 100, max: 500 },
  daily_login: { default: 2, max: 20 },
}

type LocalRules = Record<string, { xp_amount: number; is_enabled: boolean }>

export default function ClanXpRules({
  clanSlug,
  rules,
  canEdit,
  actionLabels,
  onSaved,
}: Props) {
  const [localRules, setLocalRules] = useState<LocalRules>(() =>
    Object.fromEntries(
      rules.map((r) => [
        r.action,
        { xp_amount: r.xp_amount, is_enabled: r.is_enabled },
      ]),
    ),
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function updateRule(
    action: string,
    field: 'xp_amount' | 'is_enabled',
    value: number | boolean,
  ) {
    setLocalRules((prev) => ({
      ...prev,
      [action]: {
        ...(prev[action] ?? { xp_amount: 0, is_enabled: true }),
        [field]: value,
      },
    }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const updates = Object.entries(localRules).map(([action, rule]) => ({
        action,
        xp_amount: rule.xp_amount,
        is_enabled: rule.is_enabled,
      }))

      const res = await fetch(`/api/clans/${clanSlug}/xp-rules`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        onSaved()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-purple mb-0.5">
              Clan XP regels
            </p>
            <p className="text-text-muted text-xs">
              {canEdit
                ? 'Stel in hoeveel XP leden verdienen per actie.'
                : 'Hoeveel XP leden verdienen per actie.'}
            </p>
          </div>
          {canEdit && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 bg-purple text-white font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-purple/85 transition-colors disabled:opacity-40"
            >
              {saving ? '...' : saved ? '✓ Opgeslagen' : 'Opslaan'}
            </button>
          )}
        </div>

        <div className="divide-y divide-border">
          {Object.entries(ACTION_DEFAULTS).map(([action, meta]) => {
            const rule = localRules[action] ?? {
              xp_amount: meta.default,
              is_enabled: true,
            }

            return (
              <div
                key={action}
                className={`flex items-center gap-4 px-5 py-4 ${
                  !rule.is_enabled ? 'opacity-40' : ''
                }`}
              >
                {/* Toggle */}
                {canEdit ? (
                  <button
                    onClick={() =>
                      updateRule(action, 'is_enabled', !rule.is_enabled)
                    }
                    className="relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0"
                    style={{
                      background: rule.is_enabled ? '#6B3FE0' : '#3a3a48',
                    }}
                    aria-label={
                      rule.is_enabled ? 'Schakel uit' : 'Schakel aan'
                    }
                  >
                    <span
                      className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200"
                      style={{
                        transform: rule.is_enabled
                          ? 'translateX(22px)'
                          : 'translateX(2px)',
                      }}
                    />
                  </button>
                ) : (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      background: rule.is_enabled ? '#22c55e' : '#3a3a48',
                    }}
                  />
                )}

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-text">
                    {actionLabels[action] ?? action}
                  </p>
                  <p className="font-mono text-[10px] text-text-dim mt-0.5">
                    Max: {meta.max} XP · Standaard: {meta.default} XP
                  </p>
                </div>

                {/* XP input of label */}
                {canEdit ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={meta.max}
                      value={rule.xp_amount}
                      onChange={(e) =>
                        updateRule(
                          action,
                          'xp_amount',
                          Math.min(
                            meta.max,
                            Math.max(0, parseInt(e.target.value) || 0),
                          ),
                        )
                      }
                      disabled={!rule.is_enabled}
                      className="w-20 bg-void border border-border rounded-lg px-3 py-2 text-text text-sm font-mono text-center focus:outline-none focus:border-purple transition-colors duration-200 disabled:opacity-40"
                    />
                    <span className="font-mono text-[10px] text-text-dim uppercase">
                      XP
                    </span>
                  </div>
                ) : (
                  <span className="font-mono text-sm font-bold text-purple shrink-0">
                    +{rule.xp_amount} XP
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {!canEdit && (
        <div className="bg-purple/5 border border-purple/20 rounded-xl p-4">
          <p className="text-text-muted text-xs leading-relaxed">
            XP regels worden ingesteld door de clan owner en officers.
          </p>
        </div>
      )}
    </div>
  )
}
