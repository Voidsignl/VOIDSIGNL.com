'use client'

/**
 * Responsive modal: bottom-sheet on mobile, center-modal on md+.
 * Handles backdrop click + Escape key + body-scroll lock.
 *
 * Usage:
 *   <Sheet open={open} onClose={() => setOpen(false)} title="Confirm">
 *     <p>Are you sure?</p>
 *   </Sheet>
 */
import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  /** Tailwind max-width for desktop center-modal. Default 'max-w-md'. */
  maxWidth?: string
  /** Hide the close X button. */
  hideClose?: boolean
}

export function Sheet({
  open, onClose, title, children, maxWidth = 'max-w-md', hideClose = false,
}: SheetProps) {
  // Body scroll lock + Escape close
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center md:justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Spacer pushes sheet to bottom on mobile, ignored on desktop */}
      <div className="flex-1 md:hidden" aria-hidden />

      <div
        onClick={e => e.stopPropagation()}
        className={`
          w-full ${maxWidth}
          bg-surface border border-border vs-lit
          rounded-t-2xl md:rounded-xl
          md:mx-4
          max-h-[90vh] md:max-h-[85vh] overflow-y-auto
          animate-slide-up
        `}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Mobile drag-handle */}
        <div className="md:hidden w-10 h-1 rounded-full bg-border mx-auto mt-3" />

        {(title || !hideClose) && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-surface z-10">
            <div className="flex-1 text-sm font-medium">{title}</div>
            {!hideClose && (
              <button
                onClick={onClose}
                className="text-text-dim hover:text-text p-1 -m-1 active:scale-90 transition-transform"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
