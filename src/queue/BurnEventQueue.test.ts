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

  it('groups adjacent micro and small burns without swallowing larger events', () => {
    const queue = new BurnEventQueue()
    const micro = { ...event('micro'), burnTier: 'micro' as const, timestamp: 1_000 }
    const small = { ...event('small'), burnTier: 'small' as const, timestamp: 1_500 }
    const medium = { ...event('medium'), burnTier: 'medium' as const, timestamp: 1_700 }
    queue.enqueueMany([micro, small, medium])

    expect(queue.dequeueBarrage(['micro', 'small'], 6, 2_500)).toEqual([micro, small])
    expect(queue.peek()).toBe(medium)
  })

  it('respects barrage size and timestamp boundaries', () => {
    const queue = new BurnEventQueue()
    const events = [0, 1, 2].map((index) => ({ ...event(String(index)), timestamp: index === 2 ? 9_000 : 1_000 + index * 100 }))
    queue.enqueueMany(events)

    expect(queue.dequeueBarrage(['micro'], 2, 2_500)).toHaveLength(2)
    expect(queue.size).toBe(1)
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
