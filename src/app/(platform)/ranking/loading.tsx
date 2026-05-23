export default function RankingLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-32 bg-surface rounded" />
        <div className="h-12 bg-surface rounded-xl" />
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 bg-surface rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
