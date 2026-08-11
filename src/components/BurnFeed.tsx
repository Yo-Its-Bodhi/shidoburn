import { TIER_ANIMATIONS } from '../config/burnTiers'
import type { BurnEvent } from '../domain/burnEvent'

const amount = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const short = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`

export function BurnFeed({ events }: { events: BurnEvent[] }) {
  return (
    <section className="panel feed-panel">
      <div className="panel-heading"><h2>Recent burns</h2><span className="live-dot">● LIVE</span></div>
      <div className="feed-list">
        {events.length === 0 && <p className="empty">The battlefield is suspiciously quiet. Fire something.</p>}
        {events.map((event) => {
          const config = TIER_ANIMATIONS[event.burnTier]
          return (
            <a className="feed-row" href={event.explorerURL} target="_blank" rel="noreferrer" key={event.id} style={{ '--tier': config.cssColor } as React.CSSProperties}>
              <span className="feed-icon">{event.burnTier === 'whale' ? '☠' : '🔥'}</span>
              <strong>{amount.format(event.burnAmount)}</strong>
              <span className="feed-tier">{config.label}</span>
              <span className="feed-hash">{short(event.transactionHash)} · #{event.blockNumber}</span>
              <span className="feed-view">View tx ↗</span>
            </a>
          )
        })}
      </div>
    </section>
  )
}
