import type { BurnEvent, BurnTier } from './burnEvent'

export interface BurnVolley {
  id: string
  events: BurnEvent[]
  tier: BurnTier
  totalAmount: number
  isBarrage: boolean
}

const rank: Record<BurnTier, number> = { micro: 0, small: 1, medium: 2, large: 3, whale: 4 }

export function createBurnVolley(events: BurnEvent[]): BurnVolley {
  if (events.length === 0) throw new Error('A burn volley requires at least one event')
  const tier = events.reduce<BurnTier>((highest, event) => rank[event.burnTier] > rank[highest] ? event.burnTier : highest, events[0].burnTier)
  return {
    id: events.map((event) => event.id).join(':'),
    events,
    tier,
    totalAmount: events.reduce((total, event) => total + event.burnAmount, 0),
    isBarrage: events.length > 1,
  }
}
