interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  hint?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, hint, disabled }: ToggleProps) {
  return (
    <div className="flex items-center justify-between">
      {(label || hint) && (
        <div className="mr-4">
          {label && <p className="font-mono text-sm text-text">{label}</p>}
          {hint && <p className="text-text-muted text-xs mt-0.5">{hint}</p>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`
          relative w-11 h-6 rounded-full transition-colors duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple
          disabled:opacity-40 disabled:cursor-not-allowed
          ${checked ? 'bg-purple' : 'bg-border'}
        `}
      >
        <span
          className={`
            absolute top-1 w-4 h-4 bg-white rounded-full
            transition-transform duration-200 shadow-sm
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  )
}
