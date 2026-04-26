'use client'

/**
 * VOIDSIGNL scope/vizier logo — gerefined.
 *
 * Variants:
 * - default: refined static — outer ring met exact 33° gap, kruishaar-tickmarks
 *   op 12/3/6/9 uur (alleen size >= 32), variabele dikte (ring 1.5px, dots 2.5px)
 * - animated: rotation 8s + center-dot pulse 2s — voor hero/loading
 * - icon: minimaal zonder tickmarks — voor avatars/favicon-grootte
 *
 * Monogram-component apart voor super kleine plekken (favicon-replacement,
 * inner-circle pill, comment-thread badges).
 */

interface LogoProps {
  size?: number
  className?: string
  animated?: boolean
  variant?: 'default' | 'icon'
}

export function VoidsignlLogo({
  size = 48,
  className = '',
  animated = false,
  variant = 'default',
}: LogoProps) {
  const showTickmarks = variant === 'default' && size >= 32

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-label="VOIDSIGNL"
      role="img"
    >
      {/* Inner faint ring */}
      <circle
        cx="24"
        cy="24"
        r="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.25"
      />

      {/* Subtle vertical sight-line */}
      <line
        x1="24"
        y1="8"
        x2="24"
        y2="40"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.35"
      />

      {/* Outer scope ring with 33° gap at top.
          Circumference of r=20 ≈ 125.66; gap = 33/360 × C ≈ 11.52, dash = 114.14 */}
      <g
        style={{
          transformOrigin: '24px 24px',
          transform: 'rotate(-90deg)',
          animation: animated ? 'vs-scope-rotate 8s linear infinite' : undefined,
        }}
      >
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="114.14 11.52"
          strokeLinecap="round"
        />
      </g>

      {/* Crosshair tickmarks — 12, 3, 6, 9 uur */}
      {showTickmarks && (
        <g opacity="0.55">
          <line x1="24" y1="1.5" x2="24" y2="4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <line x1="24" y1="44" x2="24" y2="46.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <line x1="1.5" y1="24" x2="4" y2="24" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <line x1="44" y1="24" x2="46.5" y2="24" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </g>
      )}

      {/* Top marker dot — pulse-state on animated */}
      <circle
        cx="24"
        cy="6"
        r="2.5"
        fill="currentColor"
        style={{
          transformOrigin: '24px 6px',
          animation: animated ? 'vs-scope-pulse 2s ease-in-out infinite' : undefined,
        }}
      />

      {/* Center dot */}
      <circle cx="24" cy="24" r="2.5" fill="currentColor" />
    </svg>
  )
}

/**
 * Compact monogram — gebruikt 'VS' binnen het scope-frame.
 * Voor avatars, kleine badges, of waar het volledige logo te druk is.
 */
export function VoidsignlMonogram({
  size = 32,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-label="VS"
      role="img"
    >
      {/* Outer ring — kleine gap voor monogram (cleaner) */}
      <circle
        cx="24"
        cy="24"
        r="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="119 6.5"
        strokeLinecap="round"
        style={{ transformOrigin: '24px 24px', transform: 'rotate(-90deg)' }}
      />

      {/* Letters */}
      <text
        x="24"
        y="29"
        textAnchor="middle"
        fontFamily="'Space Mono', monospace"
        fontWeight="700"
        fontSize="13"
        letterSpacing="0.5"
        fill="currentColor"
      >
        VS
      </text>
    </svg>
  )
}
