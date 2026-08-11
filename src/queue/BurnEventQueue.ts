import type { BurnEvent } from '../domain/burnEvent'

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
