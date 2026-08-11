import type { BurnEvent, BurnTier } from '../domain/burnEvent'

// A future live provider must only emit normalized BurnEvents through this contract.
// RPC parsing and chain-specific assumptions therefore never enter the visual engine.
export interface BurnDataProvider {
  createEvent(tier?: BurnTier): BurnEvent
  start(onEvent: (event: BurnEvent) => void): void
  stop(): void
}
