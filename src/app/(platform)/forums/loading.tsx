export default function ForumsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-4">
      <div className="h-8 w-24 bg-surface rounded" />
      <div className="h-12 bg-surface rounded-xl" />
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-24 bg-surface rounded-xl" />
      ))}
    </div>
  )
}
