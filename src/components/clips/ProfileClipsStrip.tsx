'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { ClipData } from './ClipModal'
import ClipModal from './ClipModal'
import { Play } from 'lucide-react'

/**
 * Compacte clips-strip op de profielpagina.
 * Toont max 6 clips + "Bekijk alle" link naar /clips.
 */
export function ProfileClipsStrip({ userId }: { userId: string }) {
  const [clips, setClips] = useState<ClipData[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeClip, setActiveClip] = useState<ClipData | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`/api/clips?user_id=${userId}&page=1&sort=newest`)
        const json = await res.json()
        if (cancelled) return
        const list: ClipData[] = (json.data ?? []).slice(0, 6)
        setClips(list)
        setTotal(json.pagination?.total ?? list.length)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [userId])

  if (loading || clips.length === 0) return null

  return (
    <div className="vs-card mb-5">
      <div className="flex items-center justify-between mb-3">
        <p className="vs-counter text-[10px] text-text-dim tabular-nums">
          CLIPS · {total}
        </p>
        <Link href="/clips" className="font-mono text-[10px] text-purple hover:text-purple/85 transition-colors">
          Bekijk alle →
        </Link>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {clips.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveClip(c)}
            className="group relative aspect-video rounded-lg overflow-hidden bg-surface-2 border border-border hover:border-purple transition-all"
          >
            {c.thumbnail_url ? (
              <Image src={c.thumbnail_url} alt={c.title} fill sizes="120px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play size={16} className="text-text-dim/60" />
              </div>
            )}
            {c.is_cotw && (
              <div className="absolute top-1 left-1">
                <span className="text-[7px] font-bold tracking-widest text-void bg-cyan px-1 py-0.5 rounded-full uppercase">
                  CotW
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-void/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Play size={20} fill="white" className="text-white" />
            </div>
          </button>
        ))}
      </div>
      {activeClip && <ClipModal clip={activeClip} onClose={() => setActiveClip(null)} />}
    </div>
  )
}
