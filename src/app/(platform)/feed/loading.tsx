export default function FeedLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse space-y-4">
      <div className="h-8 w-16 bg-surface rounded" />
      <div className="h-12 bg-surface rounded-xl" />
      <div className="h-24 bg-surface rounded-xl" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-36 bg-surface rounded-xl" />
      ))}
    </div>
  )
}
