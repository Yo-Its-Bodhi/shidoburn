import type { BurnEvent, RawBurnEvent } from '../domain/burnEvent'
import { classifyBurn } from './classifyBurn'

export function normalizeBurn(raw: RawBurnEvent): BurnEvent {
  return {
    ...raw,
    id: `${raw.transactionHash}-${raw.blockNumber}`,
    burnTier: classifyBurn(raw.burnAmount),
  }
}
