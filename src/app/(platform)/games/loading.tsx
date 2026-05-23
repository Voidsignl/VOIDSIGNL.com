export default function GamesLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 w-20 bg-surface rounded mb-6" />
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="bg-surface rounded-xl aspect-[3/4]" />
        ))}
      </div>
    </div>
  )
}
