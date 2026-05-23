'use client'

import { useState } from 'react'

interface FollowButtonProps {
  userId: string
  initialFollowing: boolean
  size?: 'sm' | 'md'
  onFollowChange?: (following: boolean) => void
}

export default function FollowButton({
  userId,
  initialFollowing,
  size = 'md',
  onFollowChange,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)
  const [hovered, setHovered] = useState(false)

  async function handleToggle() {
    setLoading(true)
    try {
      const res = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ following_id: userId }),
      })
      const json = await res.json()
      setFollowing(json.following)
      onFollowChange?.(json.following)
    } finally {
      setLoading(false)
    }
  }

  const isSmall = size === 'sm'

  if (following) {
    return (
      <button
        onClick={handleToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        disabled={loading}
        className={`font-mono uppercase tracking-wider transition-all disabled:opacity-40 border rounded-lg ${
          isSmall ? 'px-3 py-1 text-[10px]' : 'px-5 py-2.5 text-xs'
        } ${
          hovered
            ? 'border-danger text-danger bg-danger/5'
            : 'border-border text-text-dim'
        }`}
      >
        {loading ? '...' : hovered ? 'Ontvolgen' : 'Volgend'}
      </button>
    )
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`bg-purple text-white font-mono uppercase tracking-wider rounded-lg hover:bg-purple/85 transition-colors disabled:opacity-40 ${
        isSmall ? 'px-3 py-1 text-[10px]' : 'px-5 py-2.5 text-xs'
      }`}
    >
      {loading ? '...' : '+ Volgen'}
    </button>
  )
}
