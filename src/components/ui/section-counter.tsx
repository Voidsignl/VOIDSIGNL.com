/**
 * Section counter — mono `01 / 12` style label.
 * Onderdeel van de cyber-premium taal: numerieke framing op secties/kaarten.
 */
interface SectionCounterProps {
  index: number
  total?: number
  className?: string
}

export function SectionCounter({ index, total, className = '' }: SectionCounterProps) {
  return (
    <span className={`vs-counter ${className}`}>
      {String(index).padStart(2, '0')}
      {total ? ` / ${String(total).padStart(2, '0')}` : ''}
    </span>
  )
}
