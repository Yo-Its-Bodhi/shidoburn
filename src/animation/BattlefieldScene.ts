import Phaser from 'phaser'
import { BARRAGE_CONFIG, TIER_ANIMATIONS } from '../config/burnTiers'
import type { BurnEvent, BurnTier } from '../domain/burnEvent'
import type { BurnVolley } from '../domain/burnVolley'

const WORLD = { width: 1200, height: 600 }
const LAUNCH = { x: 1015, y: 330 }
const TARGET = { x: 248, y: 405 }

export class BattlefieldScene extends Phaser.Scene {
  private readyCallback?: () => void
  private furnaceGlow?: Phaser.GameObjects.Arc
  private furnaceFlame?: Phaser.GameObjects.Container
  private burnCrew?: Phaser.GameObjects.Container
  private supplyCrew?: Phaser.GameObjects.Container
  private siren?: Phaser.GameObjects.Arc
  private impactCount = 0

  constructor(readyCallback?: () => void) {
    super('Battlefield')
    this.readyCallback = readyCallback
  }

  create(): void {
    this.drawBackdrop()
    this.drawSupplyBase()
    this.drawBurnBase()
    this.drawForeground()
    this.readyCallback?.()
  }

  async playBurn(volley: BurnVolley): Promise<void> {
    this.animateBurnCrew(volley)
    if (volley.tier === 'whale') await this.whaleLaunchSequence()

    const launches = volley.events.map(async (event, index) => {
      if (index > 0) await this.delay(BARRAGE_CONFIG.launchStaggerMs * index)
      await this.launchProjectile(event, index, volley.events.length)
    })
    await Promise.all(launches)
    await this.delay(volley.tier === 'whale' ? 620 : 280)
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve))
  }

  private launchProjectile(event: BurnEvent, index: number, total: number): Promise<void> {
    const config = TIER_ANIMATIONS[event.burnTier]
    const yOffset = total > 1 ? (index - (total - 1) / 2) * 18 : 0
    const start = new Phaser.Math.Vector2(LAUNCH.x, LAUNCH.y + yOffset)
    const target = new Phaser.Math.Vector2(TARGET.x + Phaser.Math.Between(-26, 28), TARGET.y + Phaser.Math.Between(-22, 22))
    const projectile = this.createProjectile(start.x, start.y, event)
    const trailColor = event.burnTier === 'whale' ? 0xd85cff : config.color
    let lastTrailAt = 0

    return new Promise((resolve) => {
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: config.flightMs,
        ease: config.projectile === 'meteor' ? 'Cubic.easeIn' : event.burnTier === 'whale' ? 'Sine.easeIn' : 'Quad.easeIn',
        onUpdate: (tween) => {
          const progress = tween.getValue() ?? 0
          const controlY = event.burnTier === 'micro' ? 350 : event.burnTier === 'whale' ? 80 : 145 - index * 9
          const x = Phaser.Math.Interpolation.QuadraticBezier(progress, start.x, (start.x + target.x) / 2, target.x)
          const y = Phaser.Math.Interpolation.QuadraticBezier(progress, start.y, controlY, target.y)
          const next = Math.min(1, progress + 0.015)
          const nextX = Phaser.Math.Interpolation.QuadraticBezier(next, start.x, (start.x + target.x) / 2, target.x)
          const nextY = Phaser.Math.Interpolation.QuadraticBezier(next, start.y, controlY, target.y)
          // Projectile artwork faces left at rotation 0; offset the travel angle by PI.
          projectile.setPosition(x, y).setRotation(Math.atan2(nextY - y, nextX - x) + Math.PI)
          if (progress - lastTrailAt > 0.035) {
            this.spawnTrail(x + 18, y, trailColor, event.burnTier)
            lastTrailAt = progress
          }
        },
        onComplete: () => {
          projectile.destroy()
          this.impactCount += 1
          this.reactToImpact(event)
          this.explode(target.x, target.y, event)
          this.scatterCoins(target.x, target.y, event)
          resolve()
        },
      })
    })
  }

  private drawBackdrop(): void {
    const sky = this.add.graphics().setDepth(0)
    sky.fillGradientStyle(0x080911, 0x080911, 0x21183a, 0x120f26, 1)
    sky.fillRect(0, 0, WORLD.width, WORLD.height)

    const moonGlow = this.add.circle(600, 138, 91, 0xa1c8c6, 0.035).setDepth(0)
    this.add.circle(600, 138, 61, 0xcde5d8, 0.07).setDepth(0)
    this.add.circle(600, 138, 35, 0xeef4df, 0.75).setDepth(0)
    this.add.circle(588, 127, 7, 0x9ead9f, 0.18).setDepth(0)
    this.tweens.add({ targets: moonGlow, scale: 1.18, alpha: 0.7, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

    for (let i = 0; i < 45; i += 1) {
      const star = this.add.circle(Phaser.Math.Between(20, 1180), Phaser.Math.Between(28, 275), Phaser.Math.FloatBetween(.6, 1.8), 0xffffff, Phaser.Math.FloatBetween(.12, .55)).setDepth(0)
      this.tweens.add({ targets: star, alpha: Phaser.Math.FloatBetween(.04, .2), duration: Phaser.Math.Between(1200, 3600), yoyo: true, repeat: -1 })
    }

    const mountains = this.add.graphics().setDepth(1)
    mountains.fillStyle(0x17152c, 1)
    mountains.fillTriangle(-80, 470, 250, 185, 520, 470)
    mountains.fillTriangle(300, 470, 660, 125, 930, 470)
    mountains.fillTriangle(760, 470, 1010, 220, 1280, 470)
    mountains.fillStyle(0x242044, .75)
    mountains.fillTriangle(40, 470, 280, 235, 455, 470)
    mountains.fillTriangle(710, 470, 930, 270, 1115, 470)

    const city = this.add.graphics().setDepth(1)
    city.fillStyle(0x0c0e16, .88)
    for (let x = 0; x < WORLD.width; x += 28) {
      const height = Phaser.Math.Between(25, 92)
      city.fillRect(x, 455 - height, 25, height)
      if (x % 56 === 0) city.fillStyle(0xf25b2a, .12).fillRect(x + 7, 431 - height / 2, 3, 5)
      city.fillStyle(0x0c0e16, .88)
    }

    const haze = this.add.graphics().setDepth(2)
    haze.fillStyle(0x0b0e12, .9).fillRect(0, 448, WORLD.width, 152)
    haze.fillStyle(0x151c1b, 1).fillEllipse(600, 510, 1500, 145)
    haze.lineStyle(2, 0x2d3a38, .55).lineBetween(0, 506, 1200, 496)

    this.add.text(600, 31, 'EVERY BURN LEAVES A MARK', {
      fontFamily: 'Impact, sans-serif', fontSize: '21px', color: '#969baa', letterSpacing: 5,
    }).setOrigin(.5).setDepth(3)
    this.add.text(600, 57, 'SHIDO SUPPLY DEFENCE FRONT · SECTOR 9008', {
      fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px', color: '#4d5860', letterSpacing: 3,
    }).setOrigin(.5).setDepth(3)
  }

  private drawCastle(x: number, y: number, side: 'supply' | 'burn'): Phaser.GameObjects.Container {
    const container = this.add.container(x, y).setDepth(4)
    const shadow = this.add.graphics()
    const wall = this.add.graphics()
    const accent = side === 'supply' ? 0x8fcf3b : 0xf04435
    shadow.fillStyle(0x000000, .48).fillRoundedRect(-16, 12, 276, 185, 12)
    wall.fillStyle(side === 'supply' ? 0x28322e : 0x302a2a).fillRoundedRect(0, 25, 240, 164, 5)
    wall.fillStyle(0x111519).fillRect(0, 25, 240, 19)
    wall.fillStyle(side === 'supply' ? 0x38443d : 0x443333).fillRect(18, -20, 61, 64).fillRect(161, -20, 61, 64)
    for (const tx of [18, 43, 68, 161, 186, 211]) wall.fillRect(tx, -40, 15, 22)
    wall.fillStyle(0x090b0d).fillRoundedRect(93, 90, 56, 99, 28)
    wall.lineStyle(3, accent, .8)
    for (let row = 0; row < 5; row += 1) {
      const offset = row % 2 ? 17 : 0
      for (let bx = offset; bx < 232; bx += 43) wall.strokeRoundedRect(bx, 43 + row * 27, 39, 23, 2)
    }
    wall.lineStyle(2, 0xffffff, .08).lineBetween(5, 47, 230, 47)
    container.add([shadow, wall])
    return container
  }

  private drawSupplyBase(): void {
    this.drawCastle(50, 284, 'supply')
    const sign = this.add.text(171, 267, 'SHIDO SUPPLY', {
      fontFamily: 'Impact, sans-serif', fontSize: '31px', color: '#f5f4ea', stroke: '#71161a', strokeThickness: 9,
    }).setOrigin(.5).setDepth(8).setAngle(-2)
    this.tweens.add({ targets: sign, angle: 1, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

    const pile = this.add.container(0, 0).setDepth(6)
    for (let i = 0; i < 34; i += 1) {
      const row = Math.floor(i / 8)
      const coin = this.add.container(76 + (i % 8) * 26 + (row % 2) * 9, 418 - row * 23)
      const disc = this.add.circle(0, 0, 16, 0xf5ad19).setStrokeStyle(3, 0x7d4a08)
      const shine = this.add.arc(-5, -5, 8, 205, 300, false, 0xffde62, .8)
      coin.add([disc, shine])
      if (i % 3 === 0) coin.add(this.add.text(0, 0, 'S', { fontFamily: 'Impact', fontSize: '15px', color: '#714a08' }).setOrigin(.5))
      pile.add(coin)
    }
    this.add.text(69, 475, 'PROTECT THE BAG!', { fontFamily: 'Impact', fontSize: '18px', color: '#ff5e57', stroke: '#1a0b0b', strokeThickness: 4 }).setDepth(8)
    this.supplyCrew = this.createCharacter(325, 434, 0x7dda35, 'PANIC').setDepth(9)
  }

  private drawBurnBase(): void {
    this.drawCastle(910, 284, 'burn')
    this.add.text(1029, 267, 'THE BURN', {
      fontFamily: 'Impact, sans-serif', fontSize: '31px', color: '#f2f4e8', stroke: '#257321', strokeThickness: 9,
    }).setOrigin(.5).setDepth(8).setAngle(2)

    this.furnaceGlow = this.add.circle(1090, 438, 62, 0xff4b16, .14).setDepth(5)
    const furnace = this.add.graphics().setDepth(7)
    furnace.fillStyle(0x101316).fillRoundedRect(1035, 355, 112, 142, 14)
    furnace.lineStyle(5, 0x596266).strokeRoundedRect(1035, 355, 112, 142, 14)
    furnace.fillStyle(0x050607).fillRoundedRect(1055, 407, 72, 77, 27)
    furnace.lineStyle(3, 0x8c2d20).strokeRoundedRect(1055, 407, 72, 77, 27)
    this.furnaceFlame = this.createFlame(1091, 462).setDepth(8)
    this.add.text(1091, 382, 'FURNACE', { fontFamily: 'Impact', fontSize: '18px', color: '#ff7431' }).setOrigin(.5).setDepth(8)
    this.add.text(1044, 518, 'BURN IT ALL', { fontFamily: 'Impact', fontSize: '20px', color: '#8fe63d', stroke: '#10150d', strokeThickness: 4 }).setOrigin(.5).setDepth(8)
    this.burnCrew = this.createCharacter(875, 435, 0xef3434, 'FIRE!').setDepth(9)
    this.siren = this.add.circle(948, 278, 9, 0xff392e, .28).setDepth(9)
    this.tweens.add({ targets: this.siren, alpha: .95, scale: 1.35, duration: 430, yoyo: true, repeat: -1 })
  }

  private createCharacter(x: number, y: number, color: number, label: string): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const body = this.add.graphics()
    body.fillStyle(0x111417).fillCircle(0, -24, 19)
    body.fillStyle(color).fillRoundedRect(-17, -8, 34, 42, 10)
    body.lineStyle(5, 0x111417).lineBetween(-11, 29, -16, 52).lineBetween(11, 29, 16, 52)
    body.lineBetween(-14, 3, -29, 19).lineBetween(14, 3, 29, 19)
    const eyeLeft = this.add.circle(-6, -26, 5, 0xffffff)
    const eyeRight = this.add.circle(7, -26, 5, 0xffffff)
    const pupils = this.add.graphics().fillStyle(0x050607).fillCircle(-4, -25, 2).fillCircle(9, -25, 2)
    const caption = this.add.text(0, -61, label, { fontFamily: 'Impact', fontSize: '14px', color: '#f2f3ed', stroke: '#08090b', strokeThickness: 4 }).setOrigin(.5).setAlpha(0)
    container.add([body, eyeLeft, eyeRight, pupils, caption])
    container.setData('caption', caption)
    return container
  }

  private createFlame(x: number, y: number): Phaser.GameObjects.Container {
    const outer = this.add.graphics().fillStyle(0xff421f).fillTriangle(-28, 15, -10, -42, 2, -5).fillTriangle(-12, 15, 11, -54, 30, 15)
    const inner = this.add.graphics().fillStyle(0xffb51c).fillTriangle(-17, 15, 3, -30, 20, 15)
    const core = this.add.graphics().fillStyle(0xe3ff48).fillTriangle(-6, 15, 5, -13, 12, 15)
    const flame = this.add.container(x, y, [outer, inner, core])
    this.tweens.add({ targets: outer, scaleY: .82, angle: -3, duration: 170, yoyo: true, repeat: -1 })
    this.tweens.add({ targets: inner, scaleY: 1.12, angle: 4, duration: 130, yoyo: true, repeat: -1 })
    return flame
  }

  private drawForeground(): void {
    const g = this.add.graphics().setDepth(20)
    g.fillStyle(0x050708, .78).fillEllipse(600, 617, 1450, 105)
    for (let i = 0; i < 13; i += 1) {
      const ember = this.add.circle(Phaser.Math.Between(850, 1160), Phaser.Math.Between(435, 570), Phaser.Math.Between(1, 3), 0xff5a24, Phaser.Math.FloatBetween(.3, .8)).setDepth(19)
      this.tweens.add({ targets: ember, y: ember.y - Phaser.Math.Between(40, 110), x: ember.x + Phaser.Math.Between(-20, 20), alpha: 0, duration: Phaser.Math.Between(1100, 2300), repeat: -1, delay: Phaser.Math.Between(0, 1600) })
    }
  }

  private createProjectile(x: number, y: number, event: BurnEvent): Phaser.GameObjects.Container {
    const config = TIER_ANIMATIONS[event.burnTier]
    const body = this.add.graphics()
    const flame = this.add.graphics()
    const markings = this.add.graphics()
    const eye = this.add.graphics()

    if (config.projectile !== 'spark' && config.projectile !== 'meteor') {
      flame.fillStyle(0xff3d1f).fillTriangle(27, 0, 61, -15, 61, 15)
      flame.fillStyle(0xffc126).fillTriangle(31, 0, 50, -7, 50, 7)
    }

    switch (config.projectile) {
      case 'spark':
        body.fillStyle(config.color).fillTriangle(-20, 0, 12, -9, 12, 9)
        body.fillStyle(0xffffff).fillCircle(-5, 0, 3)
        break
      case 'bomb':
        body.fillStyle(0x20252a).fillCircle(0, 0, 18)
        body.lineStyle(3, config.color).strokeCircle(0, 0, 16)
        body.fillStyle(0x7a858a).fillRect(12, -5, 19, 10)
        eye.fillStyle(0xffffff).fillCircle(-7, -4, 5).fillStyle(0x08090a).fillCircle(-9, -4, 2)
        break
      case 'rocket':
        body.fillStyle(0xd7dfdc).fillRoundedRect(-31, -14, 64, 28, 14)
        body.fillStyle(config.color).fillTriangle(-8, -14, 17, -30, 19, -14).fillTriangle(-8, 14, 17, 30, 19, 14)
        markings.fillStyle(0x1b2023).fillRect(-2, -14, 9, 28)
        eye.fillStyle(0xffffff).fillCircle(-17, 0, 7).fillStyle(0x08090a).fillCircle(-19, 0, 3)
        break
      case 'meteor':
        body.fillStyle(0x301b19).fillCircle(0, 0, 27)
        body.fillStyle(0xff6425, .9).fillCircle(-4, -3, 21)
        body.fillStyle(0xffc42c, .7).fillCircle(-10, -8, 9)
        body.fillStyle(0x5a261c).fillCircle(8, 8, 6).fillCircle(6, -13, 4)
        break
      case 'missile':
        body.fillStyle(0x1b1e22).fillRoundedRect(-44, -20, 92, 40, 19)
        body.fillStyle(0xdadbd3).fillTriangle(-44, -20, -70, 0, -44, 20)
        body.fillStyle(config.color).fillTriangle(4, -20, 32, -42, 36, -20).fillTriangle(4, 20, 32, 42, 36, 20)
        markings.fillStyle(0xffe52b).fillRect(-8, -20, 11, 40)
        markings.lineStyle(4, 0xffe52b).strokeCircle(-24, 0, 9)
        eye.fillStyle(0xffffff).fillCircle(-50, 0, 8).fillStyle(0x07080a).fillCircle(-53, 0, 4)
        break
    }

    return this.add.container(x, y, [flame, body, markings, eye]).setScale(config.projectileScale).setDepth(13)
  }

  private spawnTrail(x: number, y: number, color: number, tier: BurnTier): void {
    const radius = tier === 'whale' ? 13 : tier === 'large' ? 10 : tier === 'micro' ? 3 : 6
    const puff = this.add.circle(x, y, radius, tier === 'large' ? 0xff5b24 : color, tier === 'micro' ? .45 : .24).setDepth(11)
    this.tweens.add({ targets: puff, x: x + Phaser.Math.Between(8, 28), y: y + Phaser.Math.Between(-7, 7), scale: Phaser.Math.FloatBetween(1.7, 2.6), alpha: 0, duration: Phaser.Math.Between(380, 720), onComplete: () => puff.destroy() })
  }

  private animateBurnCrew(volley: BurnVolley): void {
    if (!this.burnCrew || !this.furnaceFlame || !this.furnaceGlow) return
    const caption = this.burnCrew.getData('caption') as Phaser.GameObjects.Text
    caption.setText(volley.isBarrage ? 'SEND EVERYTHING!' : volley.tier === 'whale' ? 'OH. THAT BIG.' : 'LIGHT IT!').setAlpha(1)
    this.tweens.add({ targets: this.burnCrew, y: 422, angle: -7, duration: 150, yoyo: true, repeat: volley.isBarrage ? 4 : 1, onComplete: () => caption.setAlpha(0) })
    this.tweens.add({ targets: this.furnaceFlame, scaleX: volley.tier === 'whale' ? 1.7 : 1.25, scaleY: volley.tier === 'whale' ? 1.9 : 1.45, duration: 210, yoyo: true, repeat: volley.isBarrage ? 5 : 2 })
    this.tweens.add({ targets: this.furnaceGlow, alpha: volley.tier === 'whale' ? .75 : .42, scale: volley.tier === 'whale' ? 2.3 : 1.5, duration: 280, yoyo: true, repeat: volley.isBarrage ? 4 : 1 })
  }

  private async whaleLaunchSequence(): Promise<void> {
    this.cameras.main.flash(140, 130, 40, 150, false)
    if (this.siren) this.tweens.add({ targets: this.siren, scale: 2.8, alpha: 1, duration: 140, yoyo: true, repeat: 4 })
    for (let i = 0; i < 8; i += 1) this.spawnSmoke(1000 + Phaser.Math.Between(-40, 40), 360 + Phaser.Math.Between(-20, 20), 0xb64af0)
    await this.delay(360)
  }

  private reactToImpact(event: BurnEvent): void {
    const shake = TIER_ANIMATIONS[event.burnTier].shake
    if (shake) this.cameras.main.shake(190 + shake * 28, shake / 1100)
    if (event.burnTier === 'whale') this.cameras.main.flash(220, 255, 68, 35)
    if (!this.supplyCrew) return
    const caption = this.supplyCrew.getData('caption') as Phaser.GameObjects.Text
    const lines = event.burnTier === 'whale' ? ['WE ARE SO COOKED', 'NOT THE BAG!', 'MUM?!'] : ['MY SHIDO!', 'AGAIN?!', 'DUCK!']
    caption.setText(lines[this.impactCount % lines.length]).setAlpha(1)
    this.tweens.add({ targets: this.supplyCrew, x: 344, y: 416, angle: 13, duration: 100, yoyo: true, repeat: event.burnTier === 'whale' ? 5 : 2, onComplete: () => caption.setAlpha(0) })
  }

  private explode(x: number, y: number, event: BurnEvent): void {
    const config = TIER_ANIMATIONS[event.burnTier]
    const blast = this.add.container(x, y).setDepth(16)
    const outer = this.add.circle(0, 0, 58, 0xff351d, .8)
    const mid = this.add.circle(0, 0, 42, 0xffa31c, .95)
    const core = this.add.circle(0, 0, 23, 0xfff7b0, 1)
    const ring = this.add.circle(0, 0, 35, 0x000000, 0).setStrokeStyle(6, config.color, .8)
    blast.add([outer, mid, core, ring]).setScale(.08)
    this.tweens.add({ targets: blast, scale: config.explosionScale, alpha: 0, duration: event.burnTier === 'whale' ? 900 : 520, ease: 'Cubic.easeOut', onComplete: () => blast.destroy() })
    this.tweens.add({ targets: ring, scale: 2.2, alpha: 0, duration: 420 })

    const word = event.burnTier === 'whale' ? 'SUPPLY WREKT!' : event.burnTier === 'large' ? 'KRAKOOOM!' : event.burnTier === 'micro' ? 'pew!' : 'BOOM!'
    const boom = this.add.text(x, y - 55, word, {
      fontFamily: 'Impact', fontSize: event.burnTier === 'whale' ? '52px' : event.burnTier === 'micro' ? '18px' : '31px', color: '#fff7c7', stroke: '#a5191d', strokeThickness: event.burnTier === 'micro' ? 4 : 8,
    }).setOrigin(.5).setDepth(18).setScale(.2).setAngle(Phaser.Math.Between(-6, 6))
    this.tweens.add({ targets: boom, scale: 1, y: y - 115, alpha: 0, duration: event.burnTier === 'whale' ? 1150 : 760, ease: 'Back.easeOut', onComplete: () => boom.destroy() })

    const smokeCount = event.burnTier === 'whale' ? 18 : event.burnTier === 'large' ? 11 : 5
    for (let i = 0; i < smokeCount; i += 1) this.time.delayedCall(i * 28, () => this.spawnSmoke(x + Phaser.Math.Between(-25, 25), y + Phaser.Math.Between(-20, 20), config.color))
    if (this.impactCount % 2 === 0 || event.burnTier === 'whale') this.leaveScorch(x, y, event.burnTier)
  }

  private spawnSmoke(x: number, y: number, color: number): void {
    const dark = Phaser.Display.Color.IntegerToColor(color).darken(70).color
    const puff = this.add.circle(x, y, Phaser.Math.Between(9, 18), dark, .72).setDepth(15)
    this.tweens.add({ targets: puff, x: x + Phaser.Math.Between(-45, 35), y: y - Phaser.Math.Between(45, 105), scale: Phaser.Math.FloatBetween(1.8, 3.2), alpha: 0, duration: Phaser.Math.Between(850, 1500), ease: 'Quad.easeOut', onComplete: () => puff.destroy() })
  }

  private leaveScorch(x: number, y: number, tier: BurnTier): void {
    const scorch = this.add.graphics().setDepth(5)
    scorch.fillStyle(0x020303, tier === 'whale' ? .8 : .45).fillEllipse(x, y + 28, tier === 'whale' ? 130 : 70, tier === 'whale' ? 50 : 28)
    scorch.lineStyle(3, 0xff3f1f, tier === 'whale' ? .55 : .2)
    scorch.lineBetween(x - 18, y + 15, x - 38, y - 11).lineBetween(x + 3, y + 18, x + 19, y - 16)
  }

  private scatterCoins(x: number, y: number, event: BurnEvent): void {
    const count = event.burnTier === 'whale' ? 22 : event.burnTier === 'large' ? 13 : event.burnTier === 'micro' ? 2 : 6
    for (let i = 0; i < count; i += 1) {
      const coin = this.add.container(x, y).setDepth(17)
      const disc = this.add.circle(0, 0, event.burnTier === 'whale' ? 9 : 6, 0xf6b716).setStrokeStyle(2, 0x6f4508)
      const mark = this.add.text(0, 0, 'S', { fontFamily: 'Impact', fontSize: event.burnTier === 'whale' ? '9px' : '7px', color: '#684207' }).setOrigin(.5)
      coin.add([disc, mark])
      this.tweens.add({
        targets: coin,
        x: x + Phaser.Math.Between(-150, 130), y: y + Phaser.Math.Between(-185, 55), angle: Phaser.Math.Between(-540, 540), alpha: 0, scaleX: .25,
        duration: Phaser.Math.Between(600, 1100), ease: 'Quad.easeOut', onComplete: () => coin.destroy(),
      })
    }
  }
}
