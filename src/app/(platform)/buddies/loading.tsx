export default function BuddiesLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse space-y-6">
      <div className="h-8 w-24 bg-surface rounded" />
      <div className="h-12 bg-surface rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 bg-surface rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 bg-surface rounded-xl" />
        ))}
      </div>
    </div>
  )
}
