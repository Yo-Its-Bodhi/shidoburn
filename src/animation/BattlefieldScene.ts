import Phaser from 'phaser'
import { TIER_ANIMATIONS } from '../config/burnTiers'
import type { BurnEvent } from '../domain/burnEvent'

export class BattlefieldScene extends Phaser.Scene {
  private readyCallback?: () => void

  constructor(readyCallback?: () => void) {
    super('Battlefield')
    this.readyCallback = readyCallback
  }

  create(): void {
    this.drawBackdrop()
    this.drawSupplyBase()
    this.drawBurnBase()
    this.readyCallback?.()
  }

  playBurn(event: BurnEvent): Promise<void> {
    const config = TIER_ANIMATIONS[event.burnTier]
    const start = new Phaser.Math.Vector2(995, event.burnTier === 'whale' ? 185 : 270)
    const target = new Phaser.Math.Vector2(270, 385)
    const projectile = this.createProjectile(start.x, start.y, event)
    const trail = this.add.graphics().setDepth(8)
    const controlY = event.burnTier === 'micro' ? 300 : 100

    return new Promise((resolve) => {
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: config.flightMs,
        ease: event.burnTier === 'whale' ? 'Sine.easeIn' : 'Quad.easeIn',
        onUpdate: (tween) => {
          const progress = tween.getValue() ?? 0
          const x = Phaser.Math.Interpolation.QuadraticBezier(progress, start.x, (start.x + target.x) / 2, target.x)
          const y = Phaser.Math.Interpolation.QuadraticBezier(progress, start.y, controlY, target.y)
          projectile.setPosition(x, y)
          projectile.rotation = Math.atan2(target.y - y, target.x - x)
          trail.fillStyle(config.color, 0.08 + progress * 0.1)
          trail.fillCircle(x + 24, y, 3 + config.projectileScale * 2)
        },
        onComplete: () => {
          projectile.destroy()
          trail.destroy()
          if (config.shake) this.cameras.main.shake(180 + config.shake * 18, config.shake / 1200)
          this.explode(target.x, target.y, event)
          this.scatterCoins(target.x, target.y, event)
          this.time.delayedCall(event.burnTier === 'whale' ? 900 : 520, resolve)
        },
      })
    })
  }

  private drawBackdrop(): void {
    const graphics = this.add.graphics()
    graphics.fillStyle(0x0a0b13).fillRect(0, 0, 1200, 600)
    graphics.fillStyle(0x17132d).fillRect(0, 95, 1200, 420)
    graphics.fillStyle(0x251e42, 0.9)
    graphics.fillTriangle(70, 470, 330, 190, 570, 470)
    graphics.fillTriangle(390, 470, 700, 145, 940, 470)
    graphics.fillTriangle(760, 470, 1010, 230, 1190, 470)
    graphics.fillStyle(0x11131a).fillRect(0, 445, 1200, 155)
    graphics.fillStyle(0x171b1b).fillEllipse(600, 500, 1500, 155)
    graphics.lineStyle(2, 0x2d3740, 0.45).lineBetween(0, 500, 1200, 490)

    for (let i = 0; i < 25; i += 1) {
      graphics.fillStyle(0xffffff, 0.08 + Math.random() * 0.15)
      graphics.fillCircle(Math.random() * 1200, 110 + Math.random() * 170, 1 + Math.random())
    }

    this.add.text(600, 34, 'EVERY BURN FUELS THE DESTRUCTION', {
      fontFamily: 'Impact, sans-serif', fontSize: '23px', color: '#9aa1ab', letterSpacing: 4,
    }).setOrigin(0.5)
  }

  private drawCastle(x: number, y: number, color: number, side: 'supply' | 'burn'): void {
    const g = this.add.graphics().setDepth(3)
    g.fillStyle(0x080a0c, 0.65).fillRoundedRect(x - 13, y + 16, 264, 178, 10)
    g.fillStyle(color).fillRect(x, y + 30, 238, 160)
    g.fillRect(x + 28, y - 24, 58, 68).fillRect(x + 158, y - 24, 58, 68)
    for (const tx of [x + 28, x + 52, x + 76, x + 158, x + 182, x + 206]) g.fillRect(tx, y - 40, 14, 20)
    g.fillStyle(0x07090a).fillRoundedRect(x + 94, y + 92, 54, 98, 25)
    g.lineStyle(3, side === 'supply' ? 0x8fbf35 : 0xb82727, 0.8)
    for (let row = 0; row < 5; row += 1) {
      const offset = row % 2 ? 16 : 0
      for (let bx = x + offset; bx < x + 230; bx += 42) g.strokeRect(bx, y + 42 + row * 26, 38, 22)
    }
  }

  private drawSupplyBase(): void {
    this.drawCastle(55, 280, 0x30363a, 'supply')
    this.add.text(174, 251, 'SHIDO SUPPLY', {
      fontFamily: 'Impact, sans-serif', fontSize: '30px', color: '#f3f4ef', stroke: '#710f12', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(5)

    const coins = this.add.graphics().setDepth(4)
    for (let i = 0; i < 28; i += 1) {
      const cx = 76 + (i % 7) * 28 + (Math.floor(i / 7) % 2) * 10
      const cy = 382 - Math.floor(i / 7) * 24
      coins.fillStyle(0xf0aa16).fillCircle(cx, cy, 17)
      coins.lineStyle(3, 0x7e4a08).strokeCircle(cx, cy, 14)
      if (i % 3 === 0) this.add.text(cx, cy, 'S', { fontFamily: 'Impact', fontSize: '16px', color: '#624008' }).setOrigin(0.5).setDepth(5)
    }
    this.add.text(73, 454, 'SUPPLY UNDER ATTACK', { fontFamily: 'Impact', fontSize: '18px', color: '#ff5656' }).setDepth(6)
  }

  private drawBurnBase(): void {
    this.drawCastle(908, 280, 0x252d2d, 'burn')
    this.add.text(1027, 251, 'THE BURN', {
      fontFamily: 'Impact, sans-serif', fontSize: '30px', color: '#eff5ea', stroke: '#236f1e', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(5)
    const furnace = this.add.graphics().setDepth(5)
    furnace.fillStyle(0x121414).fillRoundedRect(1050, 350, 100, 135, 12)
    furnace.lineStyle(4, 0x4c5556).strokeRoundedRect(1050, 350, 100, 135, 12)
    furnace.fillStyle(0xff4b16).fillRoundedRect(1071, 406, 58, 67, 24)
    furnace.fillStyle(0xffb11a).fillTriangle(1080, 465, 1097, 418, 1108, 465)
    furnace.fillStyle(0xdfff41).fillTriangle(1100, 465, 1119, 429, 1125, 465)
    this.add.text(1100, 373, 'FURNACE', { fontFamily: 'Impact', fontSize: '17px', color: '#ff6a2b' }).setOrigin(0.5).setDepth(6)
    this.add.text(1010, 505, 'FEED THE FURNACE', { fontFamily: 'Impact', fontSize: '19px', color: '#8fe63d' }).setOrigin(0.5).setDepth(6)
  }

  private createProjectile(x: number, y: number, event: BurnEvent): Phaser.GameObjects.Container {
    const config = TIER_ANIMATIONS[event.burnTier]
    const body = this.add.graphics()
    const flame = this.add.graphics()
    const scale = config.projectileScale

    flame.fillStyle(0xff511e, 0.95).fillTriangle(24, 0, 54, -11, 54, 11)
    flame.fillStyle(config.color, 0.85).fillTriangle(27, 0, 43, -6, 43, 6)
    body.fillStyle(event.burnTier === 'whale' ? 0x17171b : 0xdce3dd)
    if (config.projectile === 'bomb' || config.projectile === 'meteor') {
      body.fillCircle(0, 0, config.projectile === 'meteor' ? 20 : 13)
      body.fillStyle(0x090a0b).fillCircle(-5, -5, 4)
    } else if (config.projectile === 'spark') {
      body.fillStyle(config.color).fillTriangle(-14, 0, 14, -7, 14, 7)
    } else {
      body.fillRoundedRect(-25, -13, 54, 26, 12)
      body.fillStyle(config.color).fillTriangle(-4, -13, 18, -27, 18, -13)
      body.fillTriangle(-4, 13, 18, 27, 18, 13)
      body.fillStyle(0xf1f0e7).fillCircle(-8, 0, 7)
      body.fillStyle(0x111216).fillCircle(-8, 0, 3)
    }
    return this.add.container(x, y, [flame, body]).setScale(scale).setDepth(10)
  }

  private explode(x: number, y: number, event: BurnEvent): void {
    const config = TIER_ANIMATIONS[event.burnTier]
    const blast = this.add.graphics().setDepth(12)
    blast.fillStyle(0xff351d).fillCircle(0, 0, 58)
    blast.fillStyle(0xff9d19).fillCircle(0, 0, 43)
    blast.fillStyle(0xfff176).fillCircle(0, 0, 24)
    blast.setPosition(x, y).setScale(0.1)
    this.tweens.add({ targets: blast, scale: config.explosionScale, alpha: 0, duration: event.burnTier === 'whale' ? 850 : 470, ease: 'Cubic.easeOut', onComplete: () => blast.destroy() })
    this.add.text(x, y - 72, event.burnTier === 'whale' ? 'KABOOOOM!' : 'BOOM!', {
      fontFamily: 'Impact', fontSize: event.burnTier === 'whale' ? '52px' : '30px', color: '#fff6c4', stroke: '#b91d1d', strokeThickness: 7,
    }).setOrigin(0.5).setDepth(14).setScale(0.2)
      .setAlpha(1)
      .once('destroy', () => undefined)
    const boom = this.children.list[this.children.list.length - 1] as Phaser.GameObjects.Text
    this.tweens.add({ targets: boom, scale: 1, y: y - 105, alpha: 0, duration: 780, onComplete: () => boom.destroy() })
  }

  private scatterCoins(x: number, y: number, event: BurnEvent): void {
    const count = event.burnTier === 'whale' ? 18 : event.burnTier === 'large' ? 10 : 5
    for (let i = 0; i < count; i += 1) {
      const coin = this.add.circle(x, y, 7, 0xf6b716).setStrokeStyle(2, 0x6f4508).setDepth(13)
      this.tweens.add({
        targets: coin,
        x: x + Phaser.Math.Between(-120, 100),
        y: y + Phaser.Math.Between(-150, 70),
        alpha: 0,
        scale: 0.4,
        duration: Phaser.Math.Between(450, 850),
        ease: 'Quad.easeOut',
        onComplete: () => coin.destroy(),
      })
    }
  }
}
