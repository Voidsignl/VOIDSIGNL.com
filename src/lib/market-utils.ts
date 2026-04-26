/**
 * Market helpers — formatting, accent-class lookups, category/icon mappings.
 * Pure utilities; no Supabase calls.
 */
import {
  ShoppingBag, Cpu, Wrench, Box, KeyRound, type LucideIcon,
} from 'lucide-react'
import type { MarketCategory } from '@/types'

export function formatPrice(amount: number, currency: string = 'EUR'): string {
  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : ''
  return `${symbol}${amount.toFixed(2)}`
}

export const CATEGORY_ICONS: Record<MarketCategory, LucideIcon> = {
  digital:  Cpu,
  services: Wrench,
  gear:     Box,
  vault:    KeyRound,
}

export const CATEGORY_FALLBACK_ICON = ShoppingBag

/**
 * Tailwind-class helper voor de category accent. Gebruikt onze design tokens
 * — geen losse hex codes — zodat elke category visueel cohesief blijft.
 */
export function categoryAccent(cat: MarketCategory): {
  text: string
  bg: string
  border: string
  ring: string
  glow: string
} {
  switch (cat) {
    case 'digital':
      return {
        text: 'text-cyan',
        bg: 'bg-cyan/15',
        border: 'border-cyan/30',
        ring: 'ring-cyan/40',
        glow: 'shadow-[0_0_24px_rgba(0,200,240,0.18)]',
      }
    case 'services':
      return {
        text: 'text-purple-light',
        bg: 'bg-purple/15',
        border: 'border-purple/30',
        ring: 'ring-purple/40',
        glow: 'shadow-[0_0_24px_rgba(107,63,224,0.22)]',
      }
    case 'gear':
      return {
        text: 'text-warning',
        bg: 'bg-warning/15',
        border: 'border-warning/30',
        ring: 'ring-warning/40',
        glow: 'shadow-[0_0_24px_rgba(239,159,39,0.18)]',
      }
    case 'vault':
      return {
        text: 'text-danger',
        bg: 'bg-danger/15',
        border: 'border-danger/30',
        ring: 'ring-danger/40',
        glow: 'shadow-[0_0_24px_rgba(226,75,74,0.20)]',
      }
  }
}

/**
 * Validate a single image URL (avoid javascript: / data: in user input).
 */
export function isSafeImageUrl(url: string): boolean {
  if (!url) return false
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function commissionFor(price: number, rate: number): { commission: number; payout: number } {
  const commission = Math.round(price * rate * 100) / 100
  return { commission, payout: Math.round((price - commission) * 100) / 100 }
}
