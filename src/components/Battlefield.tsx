import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import Phaser from 'phaser'
import type { BurnVolley } from '../domain/burnVolley'
import { BattlefieldScene } from '../animation/BattlefieldScene'

export interface BattlefieldHandle {
  play(volley: BurnVolley): Promise<void>
}

export const Battlefield = forwardRef<BattlefieldHandle>(function Battlefield(_, ref) {
  const hostRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<BattlefieldScene | null>(null)
  const [ready, setReady] = useState(false)

  useImperativeHandle(ref, () => ({
    play: (volley) => sceneRef.current?.playBurn(volley) ?? Promise.resolve(),
  }), [])

  useEffect(() => {
    if (!hostRef.current) return
    const scene = new BattlefieldScene(() => setReady(true))
    sceneRef.current = scene
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 1200,
      height: 600,
      parent: hostRef.current,
      backgroundColor: '#0a0b13',
      scene,
      transparent: false,
      render: { antialias: true, pixelArt: false },
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    })
    return () => {
      sceneRef.current = null
      game.destroy(true)
    }
  }, [])

  return (
    <div className="battlefield-shell">
      {!ready && <div className="battlefield-loading">Preparing the battlefield…</div>}
      <div className="battlefield" ref={hostRef} aria-label="Animated SHIDO burn battlefield" />
    </div>
  )
})
