import type { BurnEvent } from '../domain/burnEvent'

export interface BurnStats {
  burnedToday: number
  totalBurned: number
  currentSupply: number
  latestBurn: BurnEvent | null
  recentEvents: BurnEvent[]
}

export const INITIAL_STATS: BurnStats = {
  burnedToday: 8_294_821,
  totalBurned: 2_645_392_198,
  currentSupply: 5_354_607_802,
  latestBurn: null,
  recentEvents: [],
}

export function applyBurnEvent(state: BurnStats, event: BurnEvent): BurnStats {
  return {
    burnedToday: state.burnedToday + event.burnAmount,
    totalBurned: state.totalBurned + event.burnAmount,
    currentSupply: Math.max(0, state.currentSupply - event.burnAmount),
    latestBurn: event,
    recentEvents: [event, ...state.recentEvents].slice(0, 8),
  }
}
