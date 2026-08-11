import type { BurnTier } from '../domain/burnEvent'

export class BurnSoundEngine {
  private context: AudioContext | null = null

  playWarning(enabled: boolean): void {
    if (!enabled) return
    this.tone(170, 0.16, 0.22)
    window.setTimeout(() => this.tone(170, 0.16, 0.22), 260)
  }

  playImpact(tier: BurnTier, enabled: boolean): void {
    if (!enabled) return
    const frequencies: Record<BurnTier, number> = { micro: 520, small: 380, medium: 260, large: 150, whale: 75 }
    this.tone(frequencies[tier], tier === 'whale' ? 0.65 : 0.25, tier === 'whale' ? 0.35 : 0.18)
  }

  private tone(frequency: number, duration: number, gainValue: number): void {
    this.context ??= new AudioContext()
    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()
    oscillator.type = 'sawtooth'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(gainValue, this.context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration)
    oscillator.connect(gain).connect(this.context.destination)
    oscillator.start()
    oscillator.stop(this.context.currentTime + duration)
  }
}
