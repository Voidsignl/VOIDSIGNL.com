import Image from 'next/image'
import Link from 'next/link'

export interface CategoryCardData {
  id: string
  name: string
  slug: string
  description?: string | null
  icon: string
  thread_count: number
  latest_thread?: {
    id: string
    title: string
    last_reply_at: string
    author?: { username: string; avatar_url?: string | null } | null
  } | null
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  if (mins < 1440) return `${Math.floor(mins / 60)}u`
  return `${Math.floor(mins / 1440)}d`
}

export default function CategoryCard({ category }: { category: CategoryCardData }) {
  return (
    <Link href={`/forums/${category.slug}`}>
      <div className="bg-surface border border-border rounded-xl p-5 hover:border-purple transition-colors duration-200 group">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple/12 border border-purple/25 flex items-center justify-center flex-shrink-0 group-hover:bg-purple/20 transition-colors">
            <span className="text-purple text-lg">{category.icon}</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-mono text-sm font-bold text-text group-hover:text-purple transition-colors mb-0.5">
              {category.name}
            </p>
            {category.description && (
              <p className="text-text-dim text-xs leading-relaxed mb-2">
                {category.description}
              </p>
            )}
            <p className="font-mono text-[10px] text-text-dim/60">
              {category.thread_count.toLocaleString()} threads
            </p>
          </div>

          {category.latest_thread && (
            <div className="text-right flex-shrink-0 max-w-[160px]">
              <p className="text-text text-xs truncate mb-1">
                {category.latest_thread.title}
              </p>
              <div className="flex items-center gap-1.5 justify-end">
                {category.latest_thread.author?.avatar_url && (
                  <div className="relative w-4 h-4 rounded-full overflow-hidden bg-surface-2">
                    <Image
                      src={category.latest_thread.author.avatar_url}
                      alt={category.latest_thread.author.username}
                      fill sizes="16px" className="object-cover"
                    />
                  </div>
                )}
                <span className="font-mono text-[9px] text-text-dim/60">
                  {timeAgo(category.latest_thread.last_reply_at)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
