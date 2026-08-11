import type { BurnEvent } from '../domain/burnEvent'
import { BurnEventQueue } from './BurnEventQueue'

const event = (id: string): BurnEvent => ({
  id, transactionHash: `0x${id}`, blockNumber: 1, timestamp: 1, sender: '0xsender', burnAmount: 10,
  burnTier: 'micro', explorerURL: '#', source: 'simulation',
})

describe('BurnEventQueue', () => {
  it('preserves FIFO ordering across multiple events', () => {
    const queue = new BurnEventQueue()
    queue.enqueueMany([event('a'), event('b'), event('c')])
    expect(queue.size).toBe(3)
    expect(queue.dequeue()?.id).toBe('a')
    expect(queue.dequeue()?.id).toBe('b')
    expect(queue.peek()?.id).toBe('c')
  })

  it('returns a safe snapshot for future barrage inspection', () => {
    const queue = new BurnEventQueue()
    queue.enqueue(event('a'))
    const snapshot = queue.snapshot()
    queue.clear()
    expect(snapshot).toHaveLength(1)
    expect(queue.size).toBe(0)
  })
})
