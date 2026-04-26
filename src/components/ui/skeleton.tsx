/**
 * Reusable shimmer skeletons. Use these instead of ScopeSpinner when the
 * resulting layout has a predictable shape — feels much faster than a spinner.
 */

interface SkeletonProps {
  className?: string
}

function Bar({ className = '' }: SkeletonProps) {
  return (
    <span
      className={`block bg-surface-2 rounded ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
        backgroundSize: '200% 100%',
        animation: 'vs-shimmer 1.5s linear infinite',
      }}
    />
  )
}

export function PostSkeleton() {
  return (
    <div className="vs-card animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <Bar className="w-9 h-9 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Bar className="h-3 w-28" />
          <Bar className="h-2.5 w-16" />
        </div>
      </div>
      <Bar className="h-3 w-full mb-2" />
      <Bar className="h-3 w-3/4" />
    </div>
  )
}

export function NotifSkeleton() {
  return (
    <div className="flex items-start gap-3.5 px-4 py-3.5 animate-pulse">
      <Bar className="w-9 h-9 rounded-lg shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Bar className="h-3 w-3/4" />
        <Bar className="h-2.5 w-1/2" />
      </div>
    </div>
  )
}

export function ListingCardSkeleton() {
  return (
    <div className="vs-card p-0 overflow-hidden animate-pulse">
      <Bar className="aspect-[4/3] w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Bar className="h-3 w-3/4" />
        <Bar className="h-3 w-1/2" />
      </div>
    </div>
  )
}

export function StatSkeleton() {
  return (
    <div className="vs-card animate-pulse space-y-2">
      <Bar className="h-2.5 w-16" />
      <Bar className="h-6 w-20" />
    </div>
  )
}
