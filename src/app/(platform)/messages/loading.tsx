export default function MessagesLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse space-y-3">
      <div className="h-8 w-24 bg-surface rounded" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-surface rounded-xl" />
      ))}
    </div>
  )
}
