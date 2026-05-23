'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import PostCard, { type FeedPost } from '@/components/feed/PostCard'
import CreatePostBox from '@/components/feed/CreatePostBox'
import RepostModal from '@/components/feed/RepostModal'

type FeedTab = 'global' | 'following'

interface CurrentUser {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  accent_color: string | null
}

const PAGE_SIZE = 20

function FeedContent() {
  const supabase = createClient()
  const [tab, setTab] = useState<FeedTab>('global')
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [repostTarget, setRepostTarget] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, accent_color')
        .eq('id', data.user.id)
        .maybeSingle()
      setCurrentUser(profile as CurrentUser | null)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchPosts = useCallback(async (currentPage: number, replace = false) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ tab, page: String(currentPage) })
      const res = await fetch(`/api/feed?${params}`)
      const json = await res.json()
      const list: FeedPost[] = json.data ?? []
      setPosts(prev => replace || currentPage === 1 ? list : [...prev, ...list])
      setTotal(json.pagination?.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    setPage(1)
    fetchPosts(1, true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  function handleNewPost(post: FeedPost) {
    setPosts(prev => [{ ...post, is_liked: false }, ...prev])
  }

  function handleDeletePost(postId: string) {
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-1">
          Community
        </p>
        <h1 className="font-mono text-3xl font-bold text-text">Feed</h1>
      </div>

      <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 mb-5">
        {[
          { key: 'global', label: 'Globaal' },
          { key: 'following', label: 'Volgend' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as FeedTab)}
            className={`flex-1 py-2.5 rounded-lg font-mono text-xs uppercase tracking-wider transition-colors duration-200 ${
              tab === t.key ? 'bg-purple text-white' : 'text-text-dim hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {currentUser && (
        <div className="mb-5">
          <CreatePostBox user={currentUser} onPost={handleNewPost} />
        </div>
      )}

      {loading && posts.length === 0 ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-surface rounded-xl h-36" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-mono text-[10px] tracking-[0.2em] text-text-dim/60 uppercase mb-3">
            Leeg
          </p>
          <p className="text-text-dim text-sm">
            {tab === 'following'
              ? 'Volg mensen om hun posts hier te zien.'
              : 'Nog geen posts. Wees de eerste.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUser?.id}
              onRepost={setRepostTarget}
              onDelete={handleDeletePost}
            />
          ))}
        </div>
      )}

      {page < totalPages && !loading && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => {
              const next = page + 1
              setPage(next)
              fetchPosts(next)
            }}
            className="px-6 py-2.5 border border-border text-text-dim font-mono text-xs rounded-lg hover:border-purple hover:text-text transition-colors duration-200"
          >
            Meer laden
          </button>
        </div>
      )}

      {repostTarget && (
        <RepostModal
          postId={repostTarget}
          onClose={() => setRepostTarget(null)}
          onSuccess={() => fetchPosts(1, true)}
        />
      )}
    </div>
  )
}

export default function FeedPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse bg-surface rounded-xl h-12" />
      </div>
    }>
      <FeedContent />
    </Suspense>
  )
}
