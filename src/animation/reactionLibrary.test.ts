import { describe, expect, it, vi } from 'vitest'
import { pickReaction, REACTION_COUNT, reactionPool } from './reactionLibrary'

describe('reactionLibrary', () => {
  it('contains at least one hundred battlefield reactions and noises', () => {
    expect(REACTION_COUNT).toBeGreaterThanOrEqual(100)
  })

  it('uses tier-specific supply impact pools', () => {
    expect(reactionPool('supply', 'impact', 'whale')).toContain('WE ARE SO COOKED!')
    expect(reactionPool('supply', 'impact', 'micro')).toContain('ow.')
  })

  it('avoids immediately repeating a reaction when alternatives exist', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const first = reactionPool('burn', 'launch')[0]
    expect(pickReaction('burn', 'launch', 'small', first)).not.toBe(first)
    vi.restoreAllMocks()
  })
})
