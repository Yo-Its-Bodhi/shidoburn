import { TIER_SAMPLE_AMOUNTS } from '../config/burnTiers'
import type { BurnEvent, BurnTier, RawBurnEvent } from '../domain/burnEvent'
import { normalizeBurn } from '../services/normalizeBurn'
import type { BurnDataProvider } from './BurnDataProvider'

const TIERS: BurnTier[] = ['micro', 'small', 'medium', 'large', 'whale']

function hex(length: number): string {
  const chars = '0123456789abcdef'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function integerBetween([min, max]: [number, number]): number {
  return Math.floor(min + Math.random() * (max - min + 1))
}

export class SimulatedBurnProvider implements BurnDataProvider {
  private timer: ReturnType<typeof setTimeout> | null = null

  createEvent(requestedTier?: BurnTier): BurnEvent {
    const tier = requestedTier ?? TIERS[Math.floor(Math.random() * TIERS.length)]
    const transactionHash = `0x${hex(64)}`
    const raw: RawBurnEvent = {
      transactionHash,
      blockNumber: 18_492_000 + Math.floor(Math.random() * 2_000),
      timestamp: Date.now(),
      sender: `0x${hex(40)}`,
      burnAmount: integerBetween(TIER_SAMPLE_AMOUNTS[tier]),
      explorerURL: `https://shidoscan.com/tx/${transactionHash}`,
      source: 'simulation',
    }
    return normalizeBurn(raw)
  }

  start(onEvent: (event: BurnEvent) => void): void {
    if (this.timer) return
    const emit = () => {
      // Whale events stay uncommon in chaos mode, but can always be triggered manually.
      const roll = Math.random()
      const tier: BurnTier = roll < 0.46 ? 'micro' : roll < 0.73 ? 'small' : roll < 0.9 ? 'medium' : roll < 0.985 ? 'large' : 'whale'
      onEvent(this.createEvent(tier))
      this.timer = setTimeout(emit, 350 + Math.random() * 950)
    }
    emit()
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
  }
}
