export default function ClipsLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse space-y-6">
      <div className="h-8 w-20 bg-surface rounded" />
      <div className="aspect-video bg-surface rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-surface rounded-xl aspect-video" />
        ))}
      </div>
    </div>
  )
}
