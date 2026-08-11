import { useCallback, useEffect, useRef, useState } from 'react'
import { BurnSoundEngine } from '../audio/BurnSoundEngine'
import type { BurnEvent } from '../domain/burnEvent'
import { BurnEventQueue } from '../queue/BurnEventQueue'
import { applyBurnEvent, INITIAL_STATS, type BurnStats } from '../state/burnStats'

export type EnginePhase = 'idle' | 'warning' | 'flight' | 'impact'

interface EngineOptions {
  playAnimation: (event: BurnEvent) => Promise<void>
  soundEnabled: boolean
}

export function useBurnEngine({ playAnimation, soundEnabled }: EngineOptions) {
  const queue = useRef(new BurnEventQueue())
  const audio = useRef(new BurnSoundEngine())
  const processing = useRef(false)
  const soundRef = useRef(soundEnabled)
  const [stats, setStats] = useState<BurnStats>(INITIAL_STATS)
  const [phase, setPhase] = useState<EnginePhase>('idle')
  const [activeEvent, setActiveEvent] = useState<BurnEvent | null>(null)
  const [queueDepth, setQueueDepth] = useState(0)

  useEffect(() => { soundRef.current = soundEnabled }, [soundEnabled])

  const drain = useCallback(async () => {
    if (processing.current) return
    processing.current = true
    let event = queue.current.dequeue()
    while (event) {
      setQueueDepth(queue.current.size)
      setActiveEvent(event)
      if (event.burnTier === 'whale') {
        setPhase('warning')
        audio.current.playWarning(soundRef.current)
        await new Promise((resolve) => window.setTimeout(resolve, 900))
      }
      setPhase('flight')
      await playAnimation(event)
      setPhase('impact')
      audio.current.playImpact(event.burnTier, soundRef.current)
      setStats((current) => applyBurnEvent(current, event!))
      await new Promise((resolve) => window.setTimeout(resolve, 240))
      event = queue.current.dequeue()
    }
    setQueueDepth(0)
    setActiveEvent(null)
    setPhase('idle')
    processing.current = false
  }, [playAnimation])

  const enqueue = useCallback((event: BurnEvent) => {
    queue.current.enqueue(event)
    setQueueDepth(queue.current.size)
    void drain()
  }, [drain])

  return { stats, phase, activeEvent, queueDepth, enqueue }
}
