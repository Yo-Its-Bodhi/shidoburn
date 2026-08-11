import { TIER_ANIMATIONS } from '../config/burnTiers'
import type { BurnEvent } from '../domain/burnEvent'

export function LatestBurn({ event }: { event: BurnEvent | null }) {
  if (!event) return <section className="latest-burn idle"><span>AWAITING DESTRUCTION</span><strong>Trigger a simulated burn</strong></section>
  const tier = TIER_ANIMATIONS[event.burnTier]
  return (
    <section className="latest-burn" style={{ '--tier': tier.cssColor } as React.CSSProperties}>
      <span>LATEST IMPACT · {tier.label}</span>
      <strong>{event.burnAmount.toLocaleString()} SHIDO BURNED</strong>
      <small>{event.transactionHash.slice(0, 10)}…{event.transactionHash.slice(-6)}</small>
    </section>
  )
}
