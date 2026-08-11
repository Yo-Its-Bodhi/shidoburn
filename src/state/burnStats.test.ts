import type { BurnEvent } from '../domain/burnEvent'
import { applyBurnEvent, type BurnStats } from './burnStats'

const burn: BurnEvent = {
  id: 'burn', transactionHash: '0xabc', blockNumber: 1, timestamp: 1, sender: '0xsender',
  burnAmount: 125, burnTier: 'micro', explorerURL: '#', source: 'simulation',
}

describe('applyBurnEvent', () => {
  it('increases burn totals, decreases supply and adds the event', () => {
    const initial: BurnStats = { burnedToday: 10, totalBurned: 1000, currentSupply: 5000, latestBurn: null, recentEvents: [] }
    const next = applyBurnEvent(initial, burn)
    expect(next.burnedToday).toBe(135)
    expect(next.totalBurned).toBe(1125)
    expect(next.currentSupply).toBe(4875)
    expect(next.latestBurn).toBe(burn)
    expect(next.recentEvents[0]).toBe(burn)
  })

  it('never allows supply to become negative', () => {
    expect(applyBurnEvent({ burnedToday: 0, totalBurned: 0, currentSupply: 10, latestBurn: null, recentEvents: [] }, burn).currentSupply).toBe(0)
  })
})
