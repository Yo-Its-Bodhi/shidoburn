import { useCallback, useEffect, useRef, useState } from 'react'
import { Battlefield, type BattlefieldHandle } from './components/Battlefield'
import { BurnFeed } from './components/BurnFeed'
import { DeveloperControls } from './components/DeveloperControls'
import { LatestBurn } from './components/LatestBurn'
import { Metrics } from './components/Metrics'
import type { BurnTier } from './domain/burnEvent'
import { useBurnEngine } from './engine/useBurnEngine'
import { SimulatedBurnProvider } from './providers/SimulatedBurnProvider'

export default function App() {
  const battlefield = useRef<BattlefieldHandle>(null)
  const provider = useRef(new SimulatedBurnProvider())
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [chaos, setChaos] = useState(false)
  const playAnimation = useCallback((event: Parameters<BattlefieldHandle['play']>[0]) => battlefield.current?.play(event) ?? Promise.resolve(), [])
  const { stats, phase, activeEvent, queueDepth, enqueue } = useBurnEngine({ playAnimation, soundEnabled })

  const trigger = useCallback((tier?: BurnTier) => enqueue(provider.current.createEvent(tier)), [enqueue])

  const toggleChaos = useCallback(() => {
    setChaos((running) => {
      if (running) provider.current.stop()
      else provider.current.start(enqueue)
      return !running
    })
  }, [enqueue])

  useEffect(() => () => provider.current.stop(), [])

  const whaleWarning = activeEvent?.burnTier === 'whale' && phase === 'warning'

  return (
    <main className="app-shell">
      <header className="masthead">
        <div className="brand"><span>SHIDO</span><strong>BURN WAR</strong><small>LESS SUPPLY. MORE CHAOS.</small></div>
        <button className="sound-button" onClick={() => setSoundEnabled((on) => !on)} aria-pressed={soundEnabled}>
          {soundEnabled ? '🔊 SOUND ON' : '🔇 SOUND OFF'}
        </button>
      </header>
      <Metrics stats={stats} />
      <section className={`battlefield-stage ${phase}`}>
        <Battlefield ref={battlefield} />
        {whaleWarning && <div className="whale-warning"><small>⚠ INCOMING ⚠</small><strong>WHALE DETECTED</strong><span>{activeEvent.burnAmount.toLocaleString()} SHIDO</span></div>}
        {activeEvent && phase === 'flight' && <div className={`incoming-tag ${activeEvent.burnTier}`}>{activeEvent.burnTier.toUpperCase()} BURN INCOMING</div>}
      </section>
      <LatestBurn event={stats.latestBurn} />
      <section className="lower-grid">
        <BurnFeed events={stats.recentEvents} />
        <DeveloperControls chaos={chaos} queueDepth={queueDepth} onTrigger={trigger} onToggleChaos={toggleChaos} />
      </section>
      <footer>SIMULATION MODE · NO LIVE BLOCKCHAIN DATA · PHASE 1 PROTOTYPE</footer>
    </main>
  )
}
