'use client'

/**
 * Touch-only pull-to-refresh. Listens at the document level and only fires
 * when the nearest scrollable ancestor is at scrollTop=0.
 * Returns an indicator-state and a sentinel ref to anchor the UI on.
 */
import { useEffect, useRef, useState } from 'react'

interface Options {
  onRefresh: () => Promise<void> | void
  /** Distance the user must pull past before refresh fires. */
  threshold?: number
  /** Disable while modal is open / page hidden. */
  disabled?: boolean
}

interface State {
  pull: number
  refreshing: boolean
  ready: boolean
}

function findScrollableParent(node: Element | null): HTMLElement | null {
  let el: Element | null = node
  while (el && el !== document.body) {
    const parent = el.parentElement
    if (!parent) break
    const overflow = getComputedStyle(parent).overflowY
    if (overflow === 'auto' || overflow === 'scroll') return parent
    el = parent
  }
  return null
}

export function usePullToRefresh({ onRefresh, threshold = 70, disabled = false }: Options) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const startYRef = useRef<number | null>(null)
  const readyRef = useRef(false)
  const [state, setState] = useState<State>({ pull: 0, refreshing: false, ready: false })

  useEffect(() => {
    if (disabled) return
    const sentinel = sentinelRef.current
    const scroller = findScrollableParent(sentinel) || document.scrollingElement || document.documentElement

    let active = false

    const isScrolledTop = () => {
      if (!scroller) return window.scrollY <= 0
      return (scroller as HTMLElement).scrollTop <= 0
    }

    function onTouchStart(e: TouchEvent) {
      if (!isScrolledTop()) return
      startYRef.current = e.touches[0].clientY
      active = true
    }

    function onTouchMove(e: TouchEvent) {
      if (!active || startYRef.current === null) return
      const dy = e.touches[0].clientY - startYRef.current
      if (dy <= 0) {
        setState({ pull: 0, refreshing: false, ready: false })
        readyRef.current = false
        return
      }
      const resisted = Math.min(dy * 0.45, threshold * 1.6)
      const isReady = resisted >= threshold
      readyRef.current = isReady
      setState({ pull: resisted, refreshing: false, ready: isReady })
      // Suppress browser overscroll only once we've started showing the indicator.
      if (dy > 12) e.preventDefault()
    }

    async function onTouchEnd() {
      if (!active) return
      active = false
      const wasReady = readyRef.current
      readyRef.current = false
      startYRef.current = null
      if (wasReady) {
        setState({ pull: threshold, refreshing: true, ready: true })
        try {
          await onRefresh()
        } finally {
          setState({ pull: 0, refreshing: false, ready: false })
        }
      } else {
        setState({ pull: 0, refreshing: false, ready: false })
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    document.addEventListener('touchcancel', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [onRefresh, threshold, disabled])

  return { sentinelRef, ...state }
}
