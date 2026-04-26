/**
 * Reusable loader voor consistent placeholder-text + animatie.
 * Vervangt 5+ inline loading patterns die elk een eigen wording hadden.
 */
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
    <div className={`flex items-center justify-center ${padY}`}>
      <div className={`text-text-dim ${textSize} animate-pulse`}>{text}</div>
    </div>
  )
}
