import Link from 'next/link'
import Image from 'next/image'

export interface ThreadRowData {
  id: string
  title: string
  body: string
  is_pinned: boolean
  is_locked: boolean
  reply_count: number
  view_count: number
  last_reply_at: string
  created_at: string
  author?: {
    id: string
    username: string
    display_name?: string | null
    avatar_url?: string | null
    accent_color?: string | null
  } | null
  last_replier?: {
    username: string
    avatar_url?: string | null
  } | null
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'nu'
  if (mins < 60) return `${mins}m`
  if (mins < 1440) return `${Math.floor(mins / 60)}u`
  return `${Math.floor(mins / 1440)}d`
}

export default function ThreadRow({ thread, categorySlug }: { thread: ThreadRowData; categorySlug: string }) {
  const accentColor = thread.author?.accent_color ?? '#6B3FE0'

  return (
    <Link href={`/forums/${categorySlug}/${thread.id}`}>
      <div className={`flex items-center gap-4 px-5 py-4 border-b border-border hover:bg-surface-2 transition-colors group ${
        thread.is_pinned ? 'bg-purple/4' : ''
      }`}>
        <div className="relative w-9 h-9 rounded-full overflow-hidden bg-surface-2 border-2 flex-shrink-0"
          style={{ borderColor: accentColor }}>
          {thread.author?.avatar_url ? (
            <Image src={thread.author.avatar_url} alt={thread.author.username}
              fill sizes="36px" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-mono text-xs text-text-dim">
                {thread.author?.username?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
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
            <p className="font-mono text-sm font-bold text-text group-hover:text-purple transition-colors truncate">
              {thread.title}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-text-dim">
              {thread.author?.display_name ?? thread.author?.username}
            </span>
            <span className="font-mono text-[10px] text-text-dim/60">
              {timeAgo(thread.created_at)}
            </span>
          </div>
        </div>

        <div className="text-right flex-shrink-0 hidden sm:block">
          <p className="font-mono text-xs text-text mb-0.5">
            {thread.reply_count.toLocaleString()} replies
          </p>
          <p className="font-mono text-[10px] text-text-dim/60">
            {thread.view_count.toLocaleString()} views
          </p>
        </div>

        <div className="text-right flex-shrink-0 min-w-[60px]">
          <p className="font-mono text-[10px] text-text-dim">
            {timeAgo(thread.last_reply_at)}
          </p>
          {thread.last_replier && (
            <p className="font-mono text-[9px] text-text-dim/60 truncate max-w-[60px]">
              {thread.last_replier.username}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
