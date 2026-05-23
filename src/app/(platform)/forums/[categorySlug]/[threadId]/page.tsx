'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import ReplyCard, { type ReplyCardData } from '@/components/forums/ReplyCard'

const PAGE_SIZE = 30

interface ThreadData {
  id: string
  title: string
  body: string
  is_pinned: boolean
  is_locked: boolean
  view_count: number
  reply_count: number
  last_reply_at: string
  created_at: string
  author: ReplyCardData['author'] | null
  category: { id: string; name: string; slug: string } | null
}

interface CurrentUser {
  id: string
  username: string
  role: string | null
}

export default function ThreadPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const slug = (params?.categorySlug as string) ?? ''
  const threadId = (params?.threadId as string) ?? ''

  const [thread, setThread] = useState<ThreadData | null>(null)
  const [replies, setReplies] = useState<ReplyCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [newReply, setNewReply] = useState('')
  const [posting, setPosting] = useState(false)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, role')
        .eq('id', data.user.id)
        .maybeSingle()
      setCurrentUser(profile as CurrentUser | null)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchThread = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/forums/${slug}/${threadId}?page=${page}`)
      const json = await res.json()
      if (json.error) { router.push(`/forums/${slug}`); return }
      setThread(json.thread)
      setReplies(prev => page === 1 ? (json.replies ?? []) : [...prev, ...(json.replies ?? [])])
      setTotal(json.pagination?.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [slug, threadId, page, router])

  useEffect(() => { fetchThread() }, [fetchThread])

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!newReply.trim()) return
    setPosting(true)
    try {
      const res = await fetch(`/api/forums/${slug}/${threadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newReply }),
      })
      const json = await res.json()
      if (res.ok && json.data) {
        setReplies(prev => [...prev, json.data])
        setNewReply('')
        setTotal(t => t + 1)
      }
    } finally {
      setPosting(false)
    }
  }

  async function handleMod(action: string, threadId?: string, replyId?: string) {
    await fetch('/api/forums/mod', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, thread_id: threadId, reply_id: replyId }),
    })
    if (action === 'delete' && threadId) {
      router.push(`/forums/${slug}`)
    } else {
      fetchThread()
    }
  }

  const isMod = ['admin', 'moderator'].includes(currentUser?.role ?? '')

  if (loading && !thread) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-8 w-64 bg-surface rounded" />
        <div className="h-32 bg-surface rounded-xl" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-surface rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Link href="/forums" className="font-mono text-xs text-text-dim hover:text-text transition-colors">
          Forums
        </Link>
        <span className="text-text-dim/60 font-mono text-xs">→</span>
        <Link href={`/forums/${slug}`} className="font-mono text-xs text-text-dim hover:text-text transition-colors">
          {thread?.category?.name}
        </Link>
        <span className="text-text-dim/60 font-mono text-xs">→</span>
        <span className="font-mono text-xs text-text truncate max-w-[200px]">
          {thread?.title}
        </span>
      </div>

      {thread && thread.author && (
        <div className="bg-surface border border-border rounded-xl p-6 mb-1">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {thread.is_pinned && (
                  <span className="font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-purple/15 text-purple">
                    Gepind
                  </span>
                )}
                {thread.is_locked && (
                  <span className="font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-text-dim/10 text-text-dim">
                    Gesloten
                  </span>
                )}
              </div>
              <h1 className="font-mono text-xl font-bold text-text">{thread.title}</h1>
            </div>

            {isMod && (
              <div className="flex gap-2 flex-shrink-0 flex-wrap">
                <button
                  onClick={() => handleMod(thread.is_pinned ? 'unpin' : 'pin', thread.id)}
                  className="px-3 py-1.5 border border-border text-text-dim font-mono text-[10px] rounded-lg hover:border-purple transition-colors duration-200"
                >
                  {thread.is_pinned ? 'Losgemaakt' : 'Pinnen'}
                </button>
                <button
                  onClick={() => handleMod(thread.is_locked ? 'unlock' : 'lock', thread.id)}
                  className="px-3 py-1.5 border border-border text-text-dim font-mono text-[10px] rounded-lg hover:border-purple transition-colors duration-200"
                >
                  {thread.is_locked ? 'Openen' : 'Sluiten'}
                </button>
                <button
                  onClick={() => handleMod('delete', thread.id)}
                  className="px-3 py-1.5 border border-danger text-danger font-mono text-[10px] rounded-lg hover:bg-danger/10 transition-colors duration-200"
                >
                  Verwijderen
                </button>
              </div>
            )}
          </div>

          <ReplyCard
            reply={{
              id: thread.id,
              body: thread.body,
              is_solution: false,
              like_count: 0,
              is_liked: false,
              created_at: thread.created_at,
              author: thread.author,
            }}
            currentUserId={currentUser?.id}
            isMod={isMod}
          />

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border px-5">
            <span className="font-mono text-[10px] text-text-dim/60">
              {total.toLocaleString()} replies · {thread.view_count?.toLocaleString()} views
            </span>
          </div>
        </div>
      )}

      {replies.length > 0 && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden mb-4">
          {replies.map(reply => (
            <ReplyCard
              key={reply.id}
              reply={reply}
              threadAuthorId={thread?.author?.id}
              currentUserId={currentUser?.id}
              isMod={isMod}
              onDelete={id => setReplies(prev => prev.filter(r => r.id !== id))}
              onMarkSolution={async id => { await handleMod('solution', undefined, id) }}
            />
          ))}
        </div>
      )}

      {replies.length < total && (
        <div className="text-center mb-6">
          <button
            onClick={() => setPage(p => p + 1)}
            className="px-5 py-2.5 border border-border text-text-dim font-mono text-xs rounded-lg hover:border-purple hover:text-text transition-colors duration-200"
          >
            Meer laden ({total - replies.length} resterend)
          </button>
        </div>
      )}

      {thread && !thread.is_locked && (
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-4">
            Reageer
          </p>
          <form onSubmit={handleReply} className="space-y-3">
            <textarea
              value={newReply}
              onChange={e => setNewReply(e.target.value)}
              placeholder="Schrijf een reactie..."
              rows={4}
              maxLength={5000}
              className="w-full bg-void border border-border rounded-xl px-4 py-3 text-text text-sm font-mono placeholder-text-dim/60 focus:outline-none focus:border-purple transition-colors resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-text-dim/60">
                {newReply.length}/5000
              </span>
              <button
                type="submit"
                disabled={posting || !newReply.trim()}
                className="px-6 py-2.5 bg-purple text-white font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-purple/85 transition-colors duration-200 disabled:opacity-40"
              >
                {posting ? 'Bezig...' : 'Plaatsen'}
              </button>
            </div>
          </form>
        </div>
      )}

      {thread?.is_locked && (
        <div className="text-center py-6 border border-border rounded-xl">
          <p className="font-mono text-xs text-text-dim">
            Deze thread is gesloten. Reageren is niet meer mogelijk.
          </p>
        </div>
      )}
    </div>
  )
}
