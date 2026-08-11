import type { BurnTier } from '../domain/burnEvent'

export interface TierAnimationConfig {
  label: string
  color: number
  cssColor: string
  projectile: 'spark' | 'bomb' | 'rocket' | 'meteor' | 'missile'
  flightMs: number
  projectileScale: number
  explosionScale: number
  shake: number
}

// Change burn balancing here. The classifier and simulator both consume this source.
export const BURN_THRESHOLDS = {
  small: 250,
  medium: 2_500,
  large: 25_000,
  whale: 100_000,
} as const

export const TIER_ANIMATIONS: Record<BurnTier, TierAnimationConfig> = {
  micro: { label: 'Micro Burn', color: 0x94f044, cssColor: '#94f044', projectile: 'spark', flightMs: 550, projectileScale: 0.55, explosionScale: 0.55, shake: 0 },
  small: { label: 'Small Burn', color: 0x34cfff, cssColor: '#34cfff', projectile: 'bomb', flightMs: 750, projectileScale: 0.75, explosionScale: 0.8, shake: 1 },
  medium: { label: 'Medium Burn', color: 0xffd338, cssColor: '#ffd338', projectile: 'rocket', flightMs: 920, projectileScale: 0.95, explosionScale: 1.1, shake: 2 },
  large: { label: 'Large Burn', color: 0xff7628, cssColor: '#ff7628', projectile: 'meteor', flightMs: 1150, projectileScale: 1.25, explosionScale: 1.55, shake: 6 },
  whale: { label: 'Whale Burn', color: 0xc654ff, cssColor: '#c654ff', projectile: 'missile', flightMs: 1500, projectileScale: 1.75, explosionScale: 2.3, shake: 12 },
}

export const TIER_SAMPLE_AMOUNTS: Record<BurnTier, [number, number]> = {
  micro: [10, BURN_THRESHOLDS.small - 1],
  small: [BURN_THRESHOLDS.small, BURN_THRESHOLDS.medium - 1],
  medium: [BURN_THRESHOLDS.medium, BURN_THRESHOLDS.large - 1],
  large: [BURN_THRESHOLDS.large, BURN_THRESHOLDS.whale - 1],
  whale: [BURN_THRESHOLDS.whale, 400_000],
}
