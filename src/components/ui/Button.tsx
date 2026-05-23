import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const base =
  'font-mono uppercase tracking-wider rounded-lg transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2'

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-purple text-white hover:bg-purple/85',
  secondary:
    'bg-transparent border border-border text-text-muted hover:border-purple hover:text-text',
  ghost: 'bg-transparent text-text-muted hover:text-text hover:bg-surface',
  danger: 'bg-transparent border border-danger text-danger hover:bg-danger/10',
}

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-[10px]',
  md: 'px-5 py-2.5 text-xs',
  lg: 'px-6 py-3.5 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  )
})
