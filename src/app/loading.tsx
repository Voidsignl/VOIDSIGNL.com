export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
        <p className="font-mono text-xs tracking-[0.3em] text-text-dim uppercase">
          Loading
        </p>
      </div>
    </div>
  )
}
