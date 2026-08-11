import { BURN_THRESHOLDS } from '../config/burnTiers'
import { classifyBurn } from './classifyBurn'

describe('classifyBurn', () => {
  it('classifies each configured boundary', () => {
    expect(classifyBurn(1)).toBe('micro')
    expect(classifyBurn(BURN_THRESHOLDS.small)).toBe('small')
    expect(classifyBurn(BURN_THRESHOLDS.medium)).toBe('medium')
    expect(classifyBurn(BURN_THRESHOLDS.large)).toBe('large')
    expect(classifyBurn(BURN_THRESHOLDS.whale)).toBe('whale')
  })

  it('rejects invalid amounts', () => {
    expect(() => classifyBurn(0)).toThrow()
    expect(() => classifyBurn(Number.NaN)).toThrow()
  })
})
