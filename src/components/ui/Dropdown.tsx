'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'

interface DropdownItem {
  label: string
  onClick: () => void
  variant?: 'default' | 'danger'
  icon?: ReactNode
}

interface DropdownProps {
  trigger: ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
}

export function Dropdown({ trigger, items, align = 'right' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((o) => !o)} className="cursor-pointer">
        {trigger}
      </div>

      {open && (
        <div
          className={`
            absolute top-full mt-1 z-50 min-w-[160px]
            bg-surface border border-border rounded-xl
            overflow-hidden shadow-xl
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
        >
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                item.onClick()
                setOpen(false)
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3
                font-mono text-xs text-left transition-colors duration-200
                hover:bg-surface-2
                ${item.variant === 'danger' ? 'text-danger' : 'text-text-muted hover:text-text'}
                ${i > 0 ? 'border-t border-border' : ''}
              `}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
