interface BadgeProps {
  variant?: 'purple' | 'cyan' | 'green' | 'red' | 'muted'
  size?: 'sm' | 'md'
  children: React.ReactNode
}

const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
  purple: 'bg-purple/12 border-purple/25 text-purple',
  cyan: 'bg-cyan/10 border-cyan/20 text-cyan',
  green: 'bg-success/10 border-success/20 text-success',
  red: 'bg-danger/10 border-danger/20 text-danger',
  muted: 'bg-surface-2 border-border text-text-muted',
}

const sizes: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'text-[8px] px-1.5 py-0.5',
  md: 'text-[9px] px-2.5 py-1',
}

export function Badge({ variant = 'purple', size = 'md', children }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center font-mono uppercase tracking-widest rounded-full border
        ${variants[variant]} ${sizes[size]}
      `}
    >
      {children}
    </span>
  )
}
