/**
 * Reusable loader voor consistent placeholder-text + animatie.
 * Vervangt 5+ inline loading patterns die elk een eigen wording hadden.
 *
 * Twee componenten:
 * - <Loader> — text-based "Loading…" animatie met grootte/variant opties
 * - <ScopeSpinner> — animated VOIDSIGNL scope als spinner (vervangt generieke
 *   border-spinner divs zodat het brand-element alom­tegenwoordig is)
 */
import { VoidsignlLogo } from './logo'

interface LoaderProps {
  text?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'inline' | 'centered'
}

export function Loader({ text = 'Loading…', size = 'md', variant = 'centered' }: LoaderProps) {
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'

  if (variant === 'inline') {
    return <span className={`text-text-dim ${textSize} animate-pulse`}>{text}</span>
  }

  const padY = size === 'sm' ? 'py-6' : size === 'lg' ? 'py-20' : 'py-12'
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${padY}`}>
      <VoidsignlLogo size={size === 'sm' ? 22 : size === 'lg' ? 40 : 30} animated variant="icon" className="text-purple" />
      {text && <div className={`text-text-dim ${textSize} animate-pulse`}>{text}</div>}
    </div>
  )
}

/**
 * Compacte spinner — vervangt generic `border-2 ... animate-spin` divs.
 * Geen tekst, alleen het scope-icoon.
 */
export function ScopeSpinner({ size = 18, className = '' }: { size?: number; className?: string }) {
  return <VoidsignlLogo size={size} animated variant="icon" className={`text-purple ${className}`} />
}
