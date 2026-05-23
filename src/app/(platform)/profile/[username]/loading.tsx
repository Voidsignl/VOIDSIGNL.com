export default function ProfileLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4 animate-pulse">
      <div className="h-32 bg-surface rounded-xl" />
      <div className="h-20 bg-surface rounded-xl" />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-32 bg-surface rounded-xl" />
        ))}
      </div>
    </div>
  )
}
