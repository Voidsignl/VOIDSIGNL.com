'use client'

import { useState, useEffect } from 'react'
import { Share2, Copy, Check, Send, X } from 'lucide-react'

interface MeCoach {
  username: string
  is_coach: boolean
  hourly_tier: string | null
}

function bookingUrl(username: string) {
  if (typeof window === 'undefined') return `/profile/${username}`
  return `${window.location.origin}/profile/${username}`
}

const TIER_LABEL: Record<string, string> = {
  basic: '€10',
  standard: '€25',
  premium: '€50',
}

export default function CoachShareButton() {
  const [me, setMe] = useState<MeCoach | null>(null)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [posted, setPosted] = useState(false)
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    fetch('/api/coaching/me')
      .then(r => (r.ok ? r.json() : null))
      .then(j => j?.data && setMe(j.data))
      .catch(() => {})
  }, [])

  if (!me?.is_coach) return null

  const url = bookingUrl(me.username)
  const tierText = me.hourly_tier && TIER_LABEL[me.hourly_tier] ? ` (${TIER_LABEL[me.hourly_tier]}/sessie)` : ''

  function handleCopy() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function handlePost() {
    setPosting(true)
    try {
      const content = `Ik ben beschikbaar als coach${tierText}. Boek een sessie via mijn profiel → ${url}`
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, post_type: 'regular' }),
      })
      if (res.ok) {
        setPosted(true)
        setTimeout(() => setPosted(false), 2500)
      }
    } finally {
      setPosting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-purple/40 text-purple font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-purple/10 transition-colors"
      >
        <Share2 size={13} /> Deel mijn coach link
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-void/95" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-surface border border-border rounded-2xl overflow-hidden">

            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-0.5">
                  Coach share
                </p>
                <h2 className="font-mono text-lg font-bold text-text">Deel je booking link</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-text-dim hover:text-text transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-void border border-border rounded-lg px-3 py-2.5">
                <code className="font-mono text-sm text-text break-all">{url}</code>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-void border border-border text-text-dim font-mono text-xs uppercase tracking-wider rounded-lg hover:border-purple hover:text-text transition-colors"
                >
                  {copied ? <><Check size={12} /> Gekopieerd</> : <><Copy size={12} /> Kopieer link</>}
                </button>
                <button
                  onClick={handlePost}
                  disabled={posting}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-purple text-white font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-purple/85 transition-colors disabled:opacity-40"
                >
                  {posted ? <><Check size={12} /> Geplaatst</> : <><Send size={12} /> Post in feed</>}
                </button>
              </div>

              <p className="font-mono text-[10px] text-text-dim text-center leading-relaxed">
                Mensen kunnen je profiel openen en daar een sessie boeken.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
