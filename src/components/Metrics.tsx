import type { BurnStats } from '../state/burnStats'

const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

export function Metrics({ stats }: { stats: BurnStats }) {
  return (
    <section className="metrics" aria-label="Burn metrics">
      <article><span>SHIDO BURNED TODAY</span><strong className="red">{number.format(stats.burnedToday)}</strong><small>SHIDO</small></article>
      <article><span>TOTAL SHIDO BURNED</span><strong>{number.format(stats.totalBurned)}</strong><small>SHIDO</small></article>
      <article><span>CURRENT SHIDO SUPPLY</span><strong className="green">{number.format(stats.currentSupply)}</strong><small>SHIDO</small></article>
    </section>
  )
}
