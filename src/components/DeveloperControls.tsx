import type { BurnTier } from '../domain/burnEvent'

interface Props {
  chaos: boolean
  queueDepth: number
  onTrigger: (tier?: BurnTier) => void
  onToggleChaos: () => void
}

const TIERS: BurnTier[] = ['micro', 'small', 'medium', 'large', 'whale']

export function DeveloperControls({ chaos, queueDepth, onTrigger, onToggleChaos }: Props) {
  return (
    <section className="panel controls-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">SIMULATION MODE</span><h2>Fire control</h2></div>
        <span className="queue-pill">QUEUE {queueDepth}</span>
      </div>
      <div className="control-grid">
        {TIERS.map((tier) => <button key={tier} className={`trigger ${tier}`} onClick={() => onTrigger(tier)}>Trigger {tier}</button>)}
        <button className="trigger random" onClick={() => onTrigger()}>Random burn</button>
        <button className={`trigger chaos ${chaos ? 'active' : ''}`} onClick={onToggleChaos}>{chaos ? 'Stop chaos' : 'Start chaos'}</button>
      </div>
    </section>
  )
}
