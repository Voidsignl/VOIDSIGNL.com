import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, className = '', children, ...props },
  ref,
) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-muted block">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={`
            w-full appearance-none bg-void border rounded-lg px-4 py-3 pr-10
            text-text text-sm font-mono
            focus:outline-none transition-[border-color] duration-200
            disabled:opacity-40 cursor-pointer
            ${error ? 'border-danger focus:border-danger' : 'border-border focus:border-purple'}
            ${className}
          `}
          {...props}
        >
          {children}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>
      {error && <p className="font-mono text-[10px] text-danger">{error}</p>}
    </div>
  )
})
