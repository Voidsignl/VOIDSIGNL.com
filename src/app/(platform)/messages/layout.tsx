'use client'

import { usePathname } from 'next/navigation'
import MessagesSidebar from '@/components/messages/MessagesSidebar'

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname() ?? ''
  const isChatRoute =
    pathname.startsWith('/messages/') && pathname !== '/messages'
  const activeUsername = isChatRoute
    ? decodeURIComponent(pathname.split('/').pop() ?? '')
    : undefined

  return (
    <div className="flex h-full -mt-4 md:-mt-6 -mx-4 md:-mx-6 md:-mb-6 bg-void">
      {/* Sidebar: conversation list */}
      <aside
        className={`${
          isChatRoute ? 'hidden md:flex' : 'flex'
        } w-full md:w-[340px] flex-col border-r border-border bg-surface/20 flex-shrink-0`}
      >
        <MessagesSidebar activeUsername={activeUsername} />
      </aside>

      {/* Right pane: chat OR empty state */}
      <div
        className={`${
          isChatRoute ? 'flex' : 'hidden md:flex'
        } flex-1 flex-col min-w-0`}
      >
        {children}
      </div>
    </div>
  )
}
