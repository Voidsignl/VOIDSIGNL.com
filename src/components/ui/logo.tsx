'use client'

export function VoidsignlLogo({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
    >
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.2" strokeDasharray="100 14" />
      <circle cx="24" cy="24" r="12" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      <line x1="24" y1="6" x2="24" y2="42" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <circle cx="24" cy="6" r="2.5" fill="currentColor" />
      <circle cx="24" cy="24" r="2" fill="currentColor" />
    </svg>
  )
}
