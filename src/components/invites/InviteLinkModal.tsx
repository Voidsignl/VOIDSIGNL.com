'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Copy, Check, Send, Trash2 } from 'lucide-react'

interface InviteCode {
  id: string
  code: string
  max_uses: number
  uses: number
  expires_at: string | null
  created_at: string
}

interface InviteLinkModalProps {
  clanSlug: string
  clanName: string
  onClose: () => void
}

function inviteUrl(code: string) {
  if (typeof window === 'undefined') return `/invite/${code}`
  return `${window.location.origin}/invite/${code}`
}

export default function InviteLinkModal({ clanSlug, clanName, onClose }: InviteLinkModalProps) {
  const [codes, setCodes] = useState<InviteCode[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [posted, setPosted] = useState<string | null>(null)

  const [maxUses, setMaxUses] = useState(0)
  const [expiresIn, setExpiresIn] = useState(7)

  const fetchCodes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/clans/${clanSlug}/invite-link`)
      const json = await res.json()
      if (res.ok) setCodes(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [clanSlug])

  useEffect(() => { fetchCodes() }, [fetchCodes])

  async function handleCreate() {
    setError('')
    setCreating(true)
    try {
      const res = await fetch(`/api/clans/${clanSlug}/invite-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_uses: maxUses,
          expires_in_days: expiresIn || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Aanmaken mislukt')
      setCodes(prev => [json.data, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis.')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Link verwijderen? Bestaande uitnodigingen worden ongeldig.')) return
    const res = await fetch(`/api/clans/${clanSlug}/invite-link?id=${id}`, { method: 'DELETE' })
    if (res.ok) setCodes(prev => prev.filter(c => c.id !== id))
  }

  function handleCopy(code: string) {
    navigator.clipboard.writeText(inviteUrl(code))
    setCopied(code)
    setTimeout(() => setCopied(null), 1500)
  }

  async function handlePostToFeed(code: string) {
    const url = inviteUrl(code)
    const content = `Join "${clanName}" via deze invite link → ${url}`
    const res = await fetch('/api/feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, post_type: 'regular' }),
    })
    if (res.ok) {
      setPosted(code)
      setTimeout(() => setPosted(null), 2500)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-void/95" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-surface border border-border rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-0.5">
              Clan invites
            </p>
            <h2 className="font-mono text-lg font-bold text-text">Invite link delen</h2>
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-text transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          <div className="bg-void border border-border rounded-lg p-4 space-y-3">
            <p className="font-mono text-[10px] tracking-widest text-text-dim uppercase">Nieuwe link</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-[10px] text-text-dim block mb-1">Max joins (0 = ∞)</label>
                <input
                  type="number"
                  min={0}
                  max={1000}
                  value={maxUses}
                  onChange={e => setMaxUses(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-surface border border-border rounded-md px-3 py-2 text-text text-sm font-mono focus:outline-none focus:border-purple"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] text-text-dim block mb-1">Verloopt na (dagen)</label>
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={expiresIn}
                  onChange={e => setExpiresIn(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-surface border border-border rounded-md px-3 py-2 text-text text-sm font-mono focus:outline-none focus:border-purple"
                />
              </div>
            </div>

            {error && <p className="font-mono text-xs text-danger">{error}</p>}

            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full py-2.5 bg-purple text-white font-mono text-xs uppercase tracking-wider rounded-md hover:bg-purple/85 transition-colors disabled:opacity-40"
            >
              {creating ? 'Bezig...' : '+ Genereer link'}
            </button>
          </div>

          <div>
            <p className="font-mono text-[10px] tracking-widest text-text-dim uppercase mb-2">
              Actieve links {codes.length > 0 ? `(${codes.length})` : ''}
            </p>

            {loading ? (
              <div className="animate-pulse bg-void rounded-lg h-20" />
            ) : codes.length === 0 ? (
              <p className="font-mono text-xs text-text-dim/60 text-center py-6">
                Nog geen links. Genereer hierboven je eerste.
              </p>
            ) : (
              <div className="space-y-3">
                {codes.map(c => {
                  const expired = c.expires_at && new Date(c.expires_at) < new Date()
                  const exhausted = c.max_uses > 0 && c.uses >= c.max_uses
                  const dead = expired || exhausted
                  return (
                    <div
                      key={c.id}
                      className={`border rounded-lg p-3 ${dead ? 'border-danger/30 bg-danger/5' : 'border-border bg-void'}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <code className="font-mono text-sm text-text font-bold truncate">
                          {inviteUrl(c.code)}
                        </code>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-text-dim/60 hover:text-danger transition-colors flex-shrink-0"
                          title="Verwijderen"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 mb-3 font-mono text-[10px] text-text-dim">
                        <span>{c.uses}{c.max_uses > 0 ? `/${c.max_uses}` : ''} joins</span>
                        {c.expires_at && (
                          <span>
                            {expired ? 'Verlopen' : `Verloopt ${new Date(c.expires_at).toLocaleDateString('nl-NL')}`}
                          </span>
                        )}
                        {exhausted && <span className="text-danger">Vol</span>}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopy(c.code)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-surface border border-border text-text-dim font-mono text-[10px] uppercase tracking-wider rounded-md hover:border-purple hover:text-text transition-colors"
                        >
                          {copied === c.code ? <><Check size={11} /> Gekopieerd</> : <><Copy size={11} /> Kopieer</>}
                        </button>
                        <button
                          onClick={() => handlePostToFeed(c.code)}
                          disabled={dead}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-purple text-white font-mono text-[10px] uppercase tracking-wider rounded-md hover:bg-purple/85 transition-colors disabled:opacity-40"
                        >
                          {posted === c.code ? <><Check size={11} /> Geplaatst</> : <><Send size={11} /> Post in feed</>}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
