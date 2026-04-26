/**
 * Reusable empty-state voor lijsten zonder data. Voorkomt dat elke pagina
 * z'n eigen "no posts yet" / "no messages" combinatie schrijft.
 */
import Link from 'next/link'
import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  cta?: {
    label: string
    href?: string
    onClick?: () => void
  }
  size?: 'sm' | 'md' | 'lg'
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
  size = 'md',
}: EmptyStateProps) {
  const padding = size === 'sm' ? 'py-8' : size === 'lg' ? 'py-16' : 'py-12'
  const iconSize = size === 'sm' ? 24 : size === 'lg' ? 36 : 28

  return (
    <div className={`vs-card text-center ${padding} px-4`}>
      {Icon && (
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple/10 border border-purple/15 mb-3">
          <Icon size={iconSize} className="text-purple opacity-70" />
        </div>
      )}
      <p className="text-sm font-medium text-text mb-1">{title}</p>
      {description && (
        <p className="text-xs text-text-dim max-w-sm mx-auto leading-relaxed">{description}</p>
      )}
      {cta && (
        <div className="mt-5">
          {cta.href ? (
            <Link href={cta.href} className="vs-btn vs-btn-primary text-xs">
              {cta.label}
            </Link>
          ) : (
            <button onClick={cta.onClick} className="vs-btn vs-btn-primary text-xs">
              {cta.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
