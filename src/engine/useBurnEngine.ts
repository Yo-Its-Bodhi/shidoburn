import { useCallback, useEffect, useRef, useState } from 'react'
import { BurnSoundEngine } from '../audio/BurnSoundEngine'
import { BARRAGE_CONFIG } from '../config/burnTiers'
import type { BurnEvent } from '../domain/burnEvent'
import { createBurnVolley, type BurnVolley } from '../domain/burnVolley'
import { BurnEventQueue } from '../queue/BurnEventQueue'
import { applyBurnEvents, INITIAL_STATS, type BurnStats } from '../state/burnStats'

export type EnginePhase = 'idle' | 'warning' | 'flight' | 'impact'

interface EngineOptions {
  playAnimation: (volley: BurnVolley) => Promise<void>
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
  const [activeVolley, setActiveVolley] = useState<BurnVolley | null>(null)
  const [queueDepth, setQueueDepth] = useState(0)

  useEffect(() => { soundRef.current = soundEnabled }, [soundEnabled])

  const drain = useCallback(async () => {
    if (processing.current) return
    processing.current = true
    let events = queue.current.dequeueBarrage(BARRAGE_CONFIG.eligibleTiers, BARRAGE_CONFIG.maxEvents, BARRAGE_CONFIG.maxTimestampGapMs)
    while (events.length > 0) {
      const volley = createBurnVolley(events)
      const event = events[0]
      setQueueDepth(queue.current.size)
      setActiveEvent(event)
      setActiveVolley(volley)
      if (volley.tier === 'whale') {
        setPhase('warning')
        audio.current.playWarning(soundRef.current)
        await new Promise((resolve) => window.setTimeout(resolve, 900))
      }
      setPhase('flight')
      audio.current.playLaunch(volley.tier, volley.events.length, soundRef.current)
      await playAnimation(volley)
      setPhase('impact')
      audio.current.playImpact(volley.tier, soundRef.current)
      setStats((current) => applyBurnEvents(current, volley.events))
      await new Promise((resolve) => window.setTimeout(resolve, 240))
      events = queue.current.dequeueBarrage(BARRAGE_CONFIG.eligibleTiers, BARRAGE_CONFIG.maxEvents, BARRAGE_CONFIG.maxTimestampGapMs)
    }
    setQueueDepth(0)
    setActiveEvent(null)
    setActiveVolley(null)
    setPhase('idle')
    processing.current = false
  }, [playAnimation])

  const enqueue = useCallback((event: BurnEvent) => {
    queue.current.enqueue(event)
    setQueueDepth(queue.current.size)
    void drain()
  }, [drain])

  const enqueueMany = useCallback((events: BurnEvent[]) => {
    queue.current.enqueueMany(events)
    setQueueDepth(queue.current.size)
    void drain()
  }, [drain])

  return { stats, phase, activeEvent, activeVolley, queueDepth, enqueue, enqueueMany }
}
