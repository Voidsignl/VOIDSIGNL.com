import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className = '', ...props },
  ref,
) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-muted block">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`
          w-full bg-void border rounded-lg px-4 py-3
          text-text text-sm font-mono placeholder-text-dim
          focus:outline-none transition-[border-color] duration-200
          disabled:opacity-40
          ${error ? 'border-danger focus:border-danger' : 'border-border focus:border-purple'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="font-mono text-[10px] text-danger">{error}</p>}
      {hint && !error && <p className="font-mono text-[10px] text-text-muted">{hint}</p>}
    </div>
  )
})
