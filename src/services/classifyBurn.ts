import { BURN_THRESHOLDS } from '../config/burnTiers'
import type { BurnTier } from '../domain/burnEvent'

export function classifyBurn(amount: number): BurnTier {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Burn amount must be a positive number')
  if (amount >= BURN_THRESHOLDS.whale) return 'whale'
  if (amount >= BURN_THRESHOLDS.large) return 'large'
  if (amount >= BURN_THRESHOLDS.medium) return 'medium'
  if (amount >= BURN_THRESHOLDS.small) return 'small'
  return 'micro'
}
