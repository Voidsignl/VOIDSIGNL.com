export default function CoachingLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse space-y-6">
      <div className="h-8 w-24 bg-surface rounded" />
      <div className="flex gap-3">
        {[...Array(3)].map((_, i) => <div key={i} className="h-10 w-32 bg-surface rounded-lg" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 bg-surface rounded-xl" />
        ))}
      </div>
    </div>
  )
}
