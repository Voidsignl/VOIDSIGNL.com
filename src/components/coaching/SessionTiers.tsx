'use client'

interface SessionTiersProps {
  onBook?: (tier: string) => void
  comingSoon?: boolean
}

const TIERS = [
  {
    key: 'basic',
    label: 'Basic',
    price: '€10',
    duration: '60 min',
    features: ['1 game focus', 'Live coaching', 'Discord sessie'],
  },
  {
    key: 'standard',
    label: 'Standard',
    price: '€25',
    duration: '90 min',
    features: ['1 game focus', 'Live coaching', 'VOD review', 'Discord sessie'],
    featured: true,
  },
  {
    key: 'premium',
    label: 'Premium',
    price: '€50',
    duration: '120 min',
    features: ['Meerdere games', 'Live coaching', 'VOD review', 'Persoonlijk plan', 'Discord sessie'],
  },
]

export default function SessionTiers({ onBook, comingSoon = true }: SessionTiersProps) {
  return (
    <div className="space-y-4">
      <p className="font-mono text-[10px] tracking-[0.2em] text-purple uppercase mb-4">
        Sessie pakketten
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TIERS.map(tier => (
          <div
            key={tier.key}
            className={`relative rounded-xl border p-5 transition-all ${
              tier.featured ? 'border-purple bg-purple/8' : 'border-border bg-surface'
            }`}
          >
            {tier.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="font-mono text-[9px] uppercase tracking-widest px-3 py-1 rounded-full bg-purple text-white">
                  Populair
                </span>
              </div>
            )}

            <p className="font-mono text-xs uppercase tracking-widest text-text-dim mb-1">
              {tier.label}
            </p>
            <p className="font-mono text-3xl font-bold text-text mb-0.5">{tier.price}</p>
            <p className="font-mono text-[10px] text-text-dim mb-4">{tier.duration}</p>

            <ul className="space-y-2 mb-5">
              {tier.features.map(f => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-purple text-xs">→</span>
                  <span className="text-text-dim text-xs">{f}</span>
                </li>
              ))}
            </ul>

            {comingSoon ? (
              <div className="w-full py-2.5 rounded-lg border border-border text-center">
                <span className="font-mono text-[10px] text-text-dim/60 uppercase tracking-widest">
                  Binnenkort
                </span>
              </div>
            ) : (
              <button
                onClick={() => onBook?.(tier.key)}
                className={`w-full py-2.5 rounded-lg font-mono text-xs uppercase tracking-wider transition-all ${
                  tier.featured
                    ? 'bg-purple text-white hover:bg-purple/85'
                    : 'border border-border text-text-dim hover:border-purple hover:text-text'
                }`}
              >
                Boeken
              </button>
            )}
          </div>
        ))}
      </div>

      {comingSoon && (
        <p className="text-center font-mono text-[10px] text-text-dim/60 mt-2">
          Betaling via Stripe — binnenkort beschikbaar
        </p>
      )}
    </div>
  )
}
