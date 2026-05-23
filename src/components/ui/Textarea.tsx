import { TextareaHTMLAttributes, forwardRef } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  showCount?: boolean
  maxLength?: number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, showCount, maxLength, className = '', value, ...props },
  ref,
) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-muted block">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        maxLength={maxLength}
        value={value}
        className={`
          w-full bg-void border rounded-lg px-4 py-3
          text-text text-sm font-mono placeholder-text-dim
          focus:outline-none transition-[border-color] duration-200
          resize-none disabled:opacity-40
          ${error ? 'border-danger focus:border-danger' : 'border-border focus:border-purple'}
          ${className}
        `}
        {...props}
      />
      <div className="flex items-center justify-between">
        {error ? <p className="font-mono text-[10px] text-danger">{error}</p> : <span />}
        {showCount && maxLength && (
          <p className="font-mono text-[10px] text-text-dim">
            {String(value ?? '').length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
})
