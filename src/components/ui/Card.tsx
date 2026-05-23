interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  active?: boolean
  padding?: 'sm' | 'md' | 'lg'
}

const paddings: Record<NonNullable<CardProps['padding']>, string> = {
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({
  children,
  className = '',
  hover,
  active,
  padding = 'md',
}: CardProps) {
  return (
    <div
      className={`
        bg-surface border rounded-xl
        ${active ? 'border-purple/40 bg-purple/8' : 'border-border'}
        ${hover ? 'hover:border-purple transition-[border-color] duration-200' : ''}
        ${paddings[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
