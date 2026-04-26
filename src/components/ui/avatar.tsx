/**
 * Unified avatar component.
 *
 * Replaces de ~50 ad-hoc avatar implementaties verspreid over topnav,
 * sidebar, dashboard, feed, profile, messages en notifications. Eén
 * source of truth voor sizes, gradient-treatment, fallback-letters en
 * inner-circle ring.
 */
import Link from 'next/link'
import { cn } from '@/lib/utils'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type AvatarVariant = 'plain' | 'gradient' | 'gradient-ring'

interface AvatarProps {
  url?: string | null
  name?: string | null
  fallbackInitials?: string
  size?: AvatarSize
  variant?: AvatarVariant
  shape?: 'circle' | 'rounded'
  href?: string
  className?: string
  showInnerRing?: boolean // Inner Circle indicator
  online?: boolean // Online status dot
}

const SIZE_MAP: Record<AvatarSize, { box: string; text: string; ringOffset: string; statusDot: string }> = {
  xs: { box: 'w-6 h-6', text: 'text-[9px]', ringOffset: '-inset-0.5', statusDot: 'w-1.5 h-1.5' },
  sm: { box: 'w-8 h-8', text: 'text-[10px]', ringOffset: '-inset-0.5', statusDot: 'w-2 h-2' },
  md: { box: 'w-10 h-10', text: 'text-sm', ringOffset: '-inset-1', statusDot: 'w-2.5 h-2.5' },
  lg: { box: 'w-14 h-14', text: 'text-base', ringOffset: '-inset-1', statusDot: 'w-3 h-3' },
  xl: { box: 'w-20 h-20', text: 'text-xl', ringOffset: '-inset-1.5', statusDot: 'w-3.5 h-3.5' },
  '2xl': { box: 'w-28 h-28', text: 'text-3xl', ringOffset: '-inset-2', statusDot: 'w-4 h-4' },
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar({
  url,
  name,
  fallbackInitials,
  size = 'md',
  variant = 'gradient',
  shape = 'circle',
  href,
  className,
  showInnerRing = false,
  online = false,
}: AvatarProps) {
  const dims = SIZE_MAP[size]
  const initials = fallbackInitials ?? getInitials(name)
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-xl'

  const inner = (
    <div className={cn('relative shrink-0', dims.box, className)}>
      {/* Inner Circle ring with subtle blur glow */}
      {showInnerRing && (
        <div
          className={cn(
            'absolute',
            dims.ringOffset,
            radius,
            'bg-gradient-to-br from-purple via-purple-light to-cyan opacity-50 blur-md pointer-events-none',
          )}
        />
      )}

      <div
        className={cn(
          'relative w-full h-full flex items-center justify-center font-medium text-white overflow-hidden',
          radius,
          variant === 'plain' && 'bg-purple',
          variant === 'gradient' && 'bg-gradient-to-br from-purple to-cyan',
          variant === 'gradient-ring' && 'bg-gradient-to-br from-purple/30 to-cyan/20 border border-purple/40',
          dims.text,
        )}
      >
        {url ? (
          <img src={url} alt={name ?? ''} className="w-full h-full object-cover" />
        ) : (
          <span style={{ fontFamily: 'var(--font-display)' }}>{initials}</span>
        )}
      </div>

      {/* Online status dot */}
      {online && (
        <div
          className={cn(
            'absolute bottom-0 right-0 rounded-full bg-success border-2 border-void',
            dims.statusDot,
          )}
        />
      )}
    </div>
  )

  if (href) {
    return <Link href={href} className="shrink-0">{inner}</Link>
  }
  return inner
}
