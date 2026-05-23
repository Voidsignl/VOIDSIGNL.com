interface PageHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function PageHeader({ eyebrow, title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        {eyebrow && (
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-purple mb-1">
            {eyebrow}
          </p>
        )}
        <h1 className="font-mono text-3xl font-bold text-text mb-1">{title}</h1>
        {subtitle && <p className="text-text-muted text-sm">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 ml-4">{action}</div>}
    </div>
  )
}
