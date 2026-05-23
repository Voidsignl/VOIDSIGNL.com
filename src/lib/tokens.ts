/**
 * VOIDSIGNL design tokens — brandbook reference (MD17).
 *
 * Source of truth lives in src/app/globals.css via the @theme block.
 * This file documents the brand palette and the corresponding Tailwind
 * v4 token classes so authors don't have to scan the CSS every time.
 *
 * Always prefer the Tailwind class on the left over the raw hex on the right.
 */

export const tokens = {
  colors: {
    void:      { class: 'bg-void',          hex: '#0e0e12' },   // Primary background
    surface:   { class: 'bg-surface',       hex: '#16161c' },   // Cards, panels
    surface2:  { class: 'bg-surface-2',     hex: '#1c1c24' },   // Deep cards, hover states
    surface3:  { class: 'bg-surface-3',     hex: '#22222c' },   // Inputs, dropdowns
    border:    { class: 'border-border',    hex: 'rgba(255,255,255,0.08)' },
    purple:    { class: 'text-purple',      hex: '#6B3FE0' },   // Primary accent
    cyan:      { class: 'text-cyan',        hex: '#00C8F0' },   // Secondary accent
    text:      { class: 'text-text',        hex: '#e2e0d8' },   // Body text
    textMuted: { class: 'text-text-muted',  hex: 'rgba(255,255,255,0.5)' },
    textDim:   { class: 'text-text-dim',    hex: 'rgba(255,255,255,0.3)' },
    success:   { class: 'text-success',     hex: '#5DCAA5' },
    danger:    { class: 'text-danger',      hex: '#E24B4A' },
    warning:   { class: 'text-warning',     hex: '#EF9F27' },
  },

  fonts: {
    display: 'font-mono',  // Space Mono — headings, labels, buttons, badges
    body:    'font-body',  // Outfit     — paragraphs, descriptions
  },

  /** Reusable text presets for consistent typographic rhythm. */
  text: {
    eyebrow:  'font-mono text-[10px] tracking-[0.2em] uppercase',
    label:    'font-mono text-xs tracking-widest uppercase',
    badge:    'font-mono text-[9px] tracking-widest uppercase',
    button:   'font-mono text-xs tracking-wider uppercase',
    stat:     'font-mono text-2xl font-bold',
    heading1: 'font-mono text-3xl font-bold',
    heading2: 'font-mono text-2xl font-bold',
    heading3: 'font-mono text-lg font-bold',
  },

  radius: {
    sm:   'rounded-lg',    // 8px  — buttons, inputs, small elements
    md:   'rounded-xl',    // 12px — cards, modals, panels
    lg:   'rounded-2xl',   // 16px — large modals, hero cards
    full: 'rounded-full',  // avatars, pills, badges
  },

  /**
   * Always pick a specific property — never `transition-all`. Hard cuts only,
   * no soft crossfades (per brandbook).
   */
  transition: {
    colors:    'transition-colors duration-200',
    border:    'transition-[border-color] duration-200',
    transform: 'transition-transform duration-300',
    opacity:   'transition-opacity duration-200',
  },

  /** Page max-widths — pick by content density. */
  layout: {
    narrow: 'max-w-2xl',  //  672px — feed, forums, profile
    medium: 'max-w-3xl',  //  768px — ranking, buddies, clans, FAQ
    wide:   'max-w-5xl',  // 1024px — games, coaching, admin, clips
  },
} as const

export type Tokens = typeof tokens
