import type { BurnEvent } from '../domain/burnEvent'
import type { BurnTier } from '../domain/burnEvent'

export class BurnEventQueue {
  private events: BurnEvent[] = []

  enqueue(event: BurnEvent): number {
    this.events.push(event)
    return this.events.length
  }

  enqueueMany(events: BurnEvent[]): number {
    this.events.push(...events)
    return this.events.length
  }

  dequeue(): BurnEvent | undefined {
    return this.events.shift()
  }

  dequeueBarrage(eligibleTiers: readonly BurnTier[], maxEvents: number, maxTimestampGapMs: number): BurnEvent[] {
    const first = this.dequeue()
    if (!first) return []
    if (!eligibleTiers.includes(first.burnTier)) return [first]

    const volley = [first]
    while (volley.length < maxEvents && this.events.length > 0) {
      const next = this.events[0]
      const previous = volley[volley.length - 1]
      if (!eligibleTiers.includes(next.burnTier) || next.timestamp - previous.timestamp > maxTimestampGapMs) break
      volley.push(this.events.shift()!)
    }
    return volley
  }

  peek(): BurnEvent | undefined {
    return this.events[0]
  }

  get size(): number {
    return this.events.length
  }

  clear(): void {
    this.events = []
  }

  // Future barrage grouping can inspect adjacent events without changing consumers.
  snapshot(): readonly BurnEvent[] {
    return [...this.events]
  }
}
