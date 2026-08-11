import { BURN_THRESHOLDS } from '../config/burnTiers'
import { SimulatedBurnProvider } from './SimulatedBurnProvider'

describe('SimulatedBurnProvider', () => {
  it('creates normalized fake events for a requested tier', () => {
    const event = new SimulatedBurnProvider().createEvent('whale')
    expect(event.source).toBe('simulation')
    expect(event.burnTier).toBe('whale')
    expect(event.burnAmount).toBeGreaterThanOrEqual(BURN_THRESHOLDS.whale)
    expect(event.transactionHash).toMatch(/^0x[0-9a-f]{64}$/)
    expect(event.explorerURL).toContain(event.transactionHash)
  })
})
