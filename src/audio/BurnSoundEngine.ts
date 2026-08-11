import type { BurnTier } from '../domain/burnEvent'

export class BurnSoundEngine {
  private context: AudioContext | null = null

  playWarning(enabled: boolean): void {
    if (!enabled) return
    this.tone(170, 0.16, 0.22)
    window.setTimeout(() => this.tone(170, 0.16, 0.22), 260)
  }

  playLaunch(tier: BurnTier, count: number, enabled: boolean): void {
    if (!enabled) return
    const base: Record<BurnTier, number> = { micro: 680, small: 460, medium: 330, large: 210, whale: 105 }
    for (let index = 0; index < Math.min(count, 6); index += 1) {
      window.setTimeout(() => this.tone(base[tier] + index * 18, tier === 'whale' ? .42 : .12, tier === 'whale' ? .18 : .08), index * 95)
    }
  }

  playImpact(tier: BurnTier, enabled: boolean): void {
    if (!enabled) return
    const frequencies: Record<BurnTier, number> = { micro: 520, small: 380, medium: 260, large: 150, whale: 75 }
    this.tone(frequencies[tier], tier === 'whale' ? 0.65 : 0.25, tier === 'whale' ? 0.35 : 0.18)
    this.noise(tier === 'whale' ? .85 : tier === 'large' ? .5 : .2, tier === 'whale' ? .32 : .12)
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

  private noise(duration: number, gainValue: number): void {
    this.context ??= new AudioContext()
    const frameCount = Math.floor(this.context.sampleRate * duration)
    const buffer = this.context.createBuffer(1, frameCount, this.context.sampleRate)
    const samples = buffer.getChannelData(0)
    for (let index = 0; index < frameCount; index += 1) samples[index] = (Math.random() * 2 - 1) * (1 - index / frameCount)
    const source = this.context.createBufferSource()
    const gain = this.context.createGain()
    const filter = this.context.createBiquadFilter()
    source.buffer = buffer
    filter.type = 'lowpass'
    filter.frequency.value = 680
    gain.gain.value = gainValue
    source.connect(filter).connect(gain).connect(this.context.destination)
    source.start()
  }
}
