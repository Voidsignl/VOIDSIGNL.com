'use client'

import { useEffect, ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  eyebrow?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizes: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-void/90 backdrop-blur-sm" onClick={onClose} />

      <div
        className={`
          relative z-10 w-full ${sizes[size]}
          bg-surface border border-border rounded-2xl
          overflow-hidden shadow-2xl
        `}
      >
        {(title || eyebrow) && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <div>
              {eyebrow && (
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-purple mb-0.5">
                  {eyebrow}
                </p>
              )}
              {title && (
                <h2 className="font-mono text-lg font-bold text-text">{title}</h2>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Sluiten"
              className="text-text-muted hover:text-text transition-colors duration-200 font-mono text-lg leading-none"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
