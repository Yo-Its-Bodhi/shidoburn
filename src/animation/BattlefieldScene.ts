import Phaser from 'phaser'
import { BARRAGE_CONFIG, TIER_ANIMATIONS } from '../config/burnTiers'
import type { BurnEvent, BurnTier } from '../domain/burnEvent'
import type { BurnVolley } from '../domain/burnVolley'
import { pickReaction, REACTION_COUNT, type ReactionMoment, type ReactionSide } from './reactionLibrary'

const WORLD = { width: 1200, height: 600 }
const LAUNCH = { x: 1015, y: 330 }
const TARGET = { x: 248, y: 405 }

export class BattlefieldScene extends Phaser.Scene {
  private readyCallback?: () => void
  private furnaceGlow?: Phaser.GameObjects.Arc
  private furnaceFlame?: Phaser.GameObjects.Container
  private burnCrew?: Phaser.GameObjects.Container
  private burnCharacters: Phaser.GameObjects.Container[] = []
  private supplyCharacters: Phaser.GameObjects.Container[] = []
  private supplyCoins: Phaser.GameObjects.Container[] = []
  private siren?: Phaser.GameObjects.Arc
  private impactCount = 0
  private lastReaction = ''

  constructor(readyCallback?: () => void) {
    super('Battlefield')
    this.readyCallback = readyCallback
  }

  create(): void {
    this.drawBackdrop()
    this.drawSupplyBase()
    this.drawBurnBase()
    this.drawForeground()
    this.startIdleComedy()
    this.readyCallback?.()
  }

  async playBurn(volley: BurnVolley): Promise<void> {
    this.animateBurnCrew(volley)
    if (volley.isBarrage) this.reactCrew('supply', 'barrage', volley.tier, 2)
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

  private drawSupplyBase(): void {
    const fort = this.add.graphics().setDepth(4)
    fort.fillStyle(0x090b0d, .75).fillEllipse(177, 492, 390, 64)
    fort.fillStyle(0x242a29).fillRect(12, 374, 292, 108)
    fort.fillStyle(0x303735).fillRect(38, 278, 102, 196).fillRect(178, 327, 114, 147)
    fort.fillStyle(0x373e3b).fillRect(58, 226, 72, 80).fillRect(201, 286, 73, 64)
    fort.fillStyle(0x1b201f)
    for (const [x, y] of [[38, 356], [72, 356], [106, 356], [178, 309], [214, 309], [250, 309], [58, 208], [83, 208], [108, 208]]) fort.fillRect(x, y, 20, 24)
    fort.fillStyle(0x111514).fillRoundedRect(82, 333, 102, 150, 47)
    fort.lineStyle(4, 0x59635e, .55).strokeRoundedRect(82, 333, 102, 150, 47)
    fort.fillStyle(0x171b1a).fillTriangle(136, 279, 171, 327, 132, 327).fillTriangle(227, 285, 256, 327, 218, 327)
    fort.fillStyle(0x151918)
    fort.fillTriangle(12, 374, 42, 340, 54, 374).fillTriangle(282, 374, 325, 348, 304, 404)
    fort.lineStyle(3, 0x0a0c0c, .8)
    for (let row = 0; row < 6; row += 1) {
      const offset = row % 2 ? 19 : 0
      for (let x = 16 + offset; x < 294; x += 48) fort.strokeRoundedRect(x, 379 + row * 18, 43, 15, 2)
    }
    fort.lineStyle(4, 0x111313).lineBetween(55, 310, 23, 359).lineBetween(55, 310, 85, 338)
    fort.lineStyle(5, 0x634026).lineBetween(20, 449, 77, 416).lineBetween(259, 347, 312, 391)

    const flag = this.add.graphics().setDepth(6)
    flag.lineStyle(5, 0x33291d).lineBetween(117, 224, 117, 154)
    flag.fillStyle(0x99272a).fillTriangle(118, 158, 190, 174, 118, 194)
    this.add.text(142, 175, 'S', { fontFamily: 'Impact', fontSize: '22px', color: '#f3e8d4', stroke: '#4a1214', strokeThickness: 3 }).setOrigin(.5).setDepth(7).setAngle(5)

    const sign = this.add.text(162, 259, 'SHIDO SUPPLY', {
      fontFamily: 'Impact, sans-serif', fontSize: '31px', color: '#f5f4ea', stroke: '#71161a', strokeThickness: 9,
    }).setOrigin(.5).setDepth(8).setAngle(-2)
    this.tweens.add({ targets: sign, angle: 1, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

    const pile = this.add.container(0, 0).setDepth(6)
    for (let i = 0; i < 42; i += 1) {
      const row = Math.floor(i / 9)
      const coin = this.add.container(61 + (i % 9) * 24 + (row % 2) * 10, 456 - row * 21)
      const disc = this.add.circle(0, 0, 16, 0xf5ad19).setStrokeStyle(3, 0x7d4a08)
      const shine = this.add.arc(-5, -5, 8, 205, 300, false, 0xffde62, .8)
      coin.add([disc, shine])
      if (i % 3 === 0) coin.add(this.add.text(0, 0, 'S', { fontFamily: 'Impact', fontSize: '15px', color: '#714a08' }).setOrigin(.5))
      pile.add(coin)
      this.supplyCoins.push(coin)
    }
    this.add.text(150, 502, 'PROTECT THE BAG!', { fontFamily: 'Impact', fontSize: '18px', color: '#ff5e57', stroke: '#1a0b0b', strokeThickness: 4 }).setOrigin(.5).setDepth(8)
    this.supplyCharacters = [
      this.createCharacter(41, 342, 'supply', 'shield'),
      this.createCharacter(274, 303, 'supply', 'spear'),
      this.createCharacter(321, 447, 'supply', 'panic'),
      this.createCharacter(194, 347, 'supply', 'coin'),
    ]
  }

  private drawBurnBase(): void {
    const fort = this.add.graphics().setDepth(4)
    fort.fillStyle(0x08090a, .78).fillEllipse(1030, 500, 410, 70)
    fort.fillStyle(0x252424).fillRect(884, 358, 304, 126)
    fort.fillStyle(0x32302e).fillRect(930, 278, 220, 190)
    fort.fillStyle(0x393532).fillRect(1002, 212, 137, 92).fillRect(902, 317, 82, 83)
    fort.fillStyle(0x171817)
    for (const [x, y] of [[884, 337], [916, 337], [948, 337], [1002, 190], [1035, 190], [1068, 190], [1101, 190], [1142, 337], [1172, 337]]) fort.fillRect(x, y, 22, 25)
    fort.lineStyle(3, 0x131313, .9)
    for (let row = 0; row < 6; row += 1) {
      const offset = row % 2 ? 18 : 0
      for (let x = 888 + offset; x < 1185; x += 48) fort.strokeRoundedRect(x, 365 + row * 19, 43, 16, 2)
    }
    fort.lineStyle(11, 0x151719).lineBetween(1130, 321, 1180, 290).lineBetween(1180, 290, 1180, 214)
    fort.lineStyle(4, 0x61615d).lineBetween(1130, 321, 1180, 290).lineBetween(1180, 290, 1180, 214)
    fort.fillStyle(0x151719).fillRect(1165, 174, 30, 49)
    fort.fillStyle(0x273228).fillCircle(1180, 170, 21)
    fort.fillStyle(0x1a1b1a).fillCircle(1180, 170, 13)
    fort.lineStyle(8, 0x141615).strokeCircle(927, 449, 29)
    fort.lineStyle(3, 0x6d6258).strokeCircle(927, 449, 29)
    for (let a = 0; a < 8; a += 1) {
      const angle = a * Math.PI / 4
      fort.lineBetween(927, 449, 927 + Math.cos(angle) * 24, 449 + Math.sin(angle) * 24)
    }

    const cannon = this.add.graphics().setDepth(8)
    cannon.fillStyle(0x111415).fillRoundedRect(914, 263, 113, 32, 13)
    cannon.fillStyle(0x7dda35, .8).fillCircle(914, 279, 18)
    cannon.lineStyle(4, 0x070808).strokeCircle(914, 279, 18)
    cannon.fillStyle(0x1a1d1d).fillCircle(996, 310, 24).fillCircle(945, 310, 24)
    cannon.lineStyle(4, 0x64615a).strokeCircle(996, 310, 24).strokeCircle(945, 310, 24)

    const smoke = this.add.graphics().setDepth(3)
    smoke.fillStyle(0x5ca81d, .22).fillCircle(1182, 133, 27).fillCircle(1162, 108, 35).fillCircle(1190, 75, 43)
    this.tweens.add({ targets: smoke, alpha: .35, x: -10, y: -12, duration: 1900, yoyo: true, repeat: -1 })

    this.add.text(1043, 239, 'THE BURN', {
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
    this.add.text(1089, 518, 'BURN IT ALL', { fontFamily: 'Impact', fontSize: '20px', color: '#8fe63d', stroke: '#10150d', strokeThickness: 4 }).setOrigin(.5).setDepth(8)
    this.burnCharacters = [
      this.createCharacter(867, 450, 'burn', 'commander'),
      this.createCharacter(942, 244, 'burn', 'cannon'),
      this.createCharacter(1017, 344, 'burn', 'loader'),
      this.createCharacter(1150, 340, 'burn', 'archer'),
      this.createCharacter(979, 449, 'burn', 'goblin'),
      this.createCharacter(1109, 310, 'burn', 'spotter'),
    ]
    this.burnCrew = this.burnCharacters[0]
    this.siren = this.add.circle(1136, 203, 9, 0xff392e, .28).setDepth(9)
    this.tweens.add({ targets: this.siren, alpha: .95, scale: 1.35, duration: 430, yoyo: true, repeat: -1 })
  }

  private createCharacter(x: number, y: number, side: ReactionSide, role: string): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const body = this.add.graphics()
    const color = side === 'supply' ? 0x8f3734 : role === 'goblin' ? 0x6f9f2e : 0x426a2e
    body.fillStyle(0x111417).fillCircle(0, -24, 19)
    body.fillStyle(color).fillRoundedRect(-17, -8, 34, 42, 10)
    body.lineStyle(5, 0x111417).lineBetween(-11, 29, -16, 52).lineBetween(11, 29, 16, 52)
    body.lineBetween(-14, 3, -29, 19).lineBetween(14, 3, 29, 19)
    const eyeLeft = this.add.circle(-6, -26, 5, 0xffffff)
    const eyeRight = this.add.circle(7, -26, 5, 0xffffff)
    const pupils = this.add.graphics().fillStyle(0x050607).fillCircle(-4, -25, 2).fillCircle(9, -25, 2)
    const helmet = this.add.graphics().fillStyle(side === 'supply' ? 0x777d7d : 0x526f31).fillEllipse(0, -34, 42, 22)
    helmet.lineStyle(3, 0x111313).lineBetween(-21, -29, 21, -29)
    if (side === 'supply') helmet.fillStyle(0xc83a32).fillTriangle(0, -48, 8, -34, -8, -34)
    const prop = this.add.graphics()
    if (role === 'shield') prop.fillStyle(0x73402a).fillRoundedRect(-35, -1, 22, 35, 4).lineStyle(3, 0x24130d).strokeRoundedRect(-35, -1, 22, 35, 4)
    if (role === 'spear' || role === 'archer') prop.lineStyle(4, 0x6d4a25).lineBetween(24, -15, 36, 44)
    if (role === 'coin') prop.fillStyle(0xf5ad19).fillCircle(28, 9, 14).lineStyle(3, 0x6f4508).strokeCircle(28, 9, 14)
    if (role === 'loader') prop.fillStyle(0x181a1b).fillCircle(27, 12, 13).fillStyle(0xff8a22).fillCircle(35, 2, 3)
    if (role === 'spotter') prop.lineStyle(7, 0x1b2222).lineBetween(19, -18, 42, -28).fillStyle(0x7dda35).fillCircle(43, -28, 5)
    if (role === 'goblin') prop.lineStyle(5, 0x6b4825).lineBetween(-28, 11, 31, 11)
    const bubble = this.add.graphics().fillStyle(0xf4f0dd, .96).fillRoundedRect(-72, -84, 144, 29, 9).lineStyle(3, 0x0b0c0c).strokeRoundedRect(-72, -84, 144, 29, 9).fillTriangle(-9, -56, 4, -47, 11, -56).setAlpha(0)
    const caption = this.add.text(0, -69, '', { fontFamily: 'Barlow Condensed, Impact', fontStyle: 'bold', fontSize: '13px', color: '#111313', align: 'center', fixedWidth: 136 }).setOrigin(.5).setAlpha(0)
    container.add([body, prop, eyeLeft, eyeRight, pupils, helmet, bubble, caption])
    container.setData('caption', caption)
    container.setData('bubble', bubble)
    container.setData('side', side)
    container.setData('homeX', x)
    container.setData('homeY', y)
    return container.setDepth(9)
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

  private startIdleComedy(): void {
    this.time.addEvent({
      delay: 4200,
      loop: true,
      callback: () => {
        if (Phaser.Math.Between(0, 100) > 68) return
        const side: ReactionSide = Phaser.Math.Between(0, 1) ? 'burn' : 'supply'
        this.reactCrew(side, 'idle', 'small', 1, 1750)
      },
    })
    this.add.text(600, 574, `${REACTION_COUNT}+ THINGS THESE IDIOTS CAN SAY`, {
      fontFamily: 'Barlow Condensed, sans-serif', fontSize: '10px', color: '#3f4947', letterSpacing: 2,
    }).setOrigin(.5).setDepth(21)
  }

  private showReaction(character: Phaser.GameObjects.Container, side: ReactionSide, moment: ReactionMoment, tier: BurnTier, holdMs = 1150): void {
    const caption = character.getData('caption') as Phaser.GameObjects.Text
    const bubble = character.getData('bubble') as Phaser.GameObjects.Graphics
    const line = pickReaction(side, moment, tier, this.lastReaction)
    this.lastReaction = line
    caption.setText(line).setAlpha(1)
    bubble.setAlpha(1)
    this.time.delayedCall(holdMs, () => {
      caption.setAlpha(0)
      bubble.setAlpha(0)
    })
  }

  private reactCrew(side: ReactionSide, moment: ReactionMoment, tier: BurnTier, count = 1, holdMs = 1200): void {
    const crew = side === 'burn' ? this.burnCharacters : this.supplyCharacters
    if (!crew.length) return
    const shuffled = Phaser.Utils.Array.Shuffle([...crew])
    shuffled.slice(0, Math.min(count, crew.length)).forEach((character, index) => {
      this.time.delayedCall(index * 120, () => {
        this.showReaction(character, side, moment, tier, holdMs)
        const homeY = character.getData('homeY') as number
        this.tweens.add({
          targets: character,
          y: homeY - (side === 'burn' ? 12 : 8),
          angle: Phaser.Math.Between(-9, 9),
          duration: 100,
          yoyo: true,
          repeat: moment === 'whale' ? 5 : moment === 'barrage' ? 3 : 1,
          onComplete: () => character.setAngle(0).setY(homeY),
        })
      })
    })
  }

  private damageSupply(tier: BurnTier): void {
    const losses: Record<BurnTier, number> = { micro: 0, small: 1, medium: 2, large: 4, whale: 8 }
    for (let i = 0; i < losses[tier]; i += 1) {
      const coin = this.supplyCoins.pop()
      if (!coin) break
      this.tweens.add({ targets: coin, y: coin.y + 70, angle: Phaser.Math.Between(-80, 80), alpha: 0, duration: 420, onComplete: () => coin.destroy() })
    }
    if (tier === 'micro') return
    const crack = this.add.graphics().setDepth(8).lineStyle(tier === 'whale' ? 6 : 3, 0x070909, .9)
    const x = Phaser.Math.Between(80, 280)
    const y = Phaser.Math.Between(340, 440)
    crack.lineBetween(x, y, x + 11, y + 17).lineBetween(x + 11, y + 17, x + 3, y + 35).lineBetween(x + 11, y + 17, x + 28, y + 25)
    const rubbleCount = tier === 'whale' ? 13 : tier === 'large' ? 8 : 3
    for (let i = 0; i < rubbleCount; i += 1) {
      const rubble = this.add.rectangle(Phaser.Math.Between(40, 310), Phaser.Math.Between(335, 460), Phaser.Math.Between(5, 13), Phaser.Math.Between(4, 10), 0x333937).setDepth(17).setAngle(Phaser.Math.Between(0, 90))
      this.tweens.add({ targets: rubble, x: rubble.x + Phaser.Math.Between(-65, 70), y: 500 + Phaser.Math.Between(-12, 12), angle: Phaser.Math.Between(-300, 300), duration: Phaser.Math.Between(450, 850), ease: 'Bounce.easeOut' })
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
    const moment: ReactionMoment = volley.isBarrage ? 'barrage' : volley.tier === 'whale' ? 'whale' : 'launch'
    this.reactCrew('burn', moment, volley.tier, volley.isBarrage ? 3 : volley.tier === 'whale' ? 2 : 1, volley.tier === 'whale' ? 2100 : 1200)
    this.tweens.add({ targets: this.furnaceFlame, scaleX: volley.tier === 'whale' ? 1.7 : 1.25, scaleY: volley.tier === 'whale' ? 1.9 : 1.45, duration: 210, yoyo: true, repeat: volley.isBarrage ? 5 : 2 })
    this.tweens.add({ targets: this.furnaceGlow, alpha: volley.tier === 'whale' ? .75 : .42, scale: volley.tier === 'whale' ? 2.3 : 1.5, duration: 280, yoyo: true, repeat: volley.isBarrage ? 4 : 1 })
  }

  private async whaleLaunchSequence(): Promise<void> {
    this.cameras.main.flash(140, 130, 40, 150, false)
    if (this.siren) this.tweens.add({ targets: this.siren, scale: 2.8, alpha: 1, duration: 140, yoyo: true, repeat: 4 })
    this.reactCrew('supply', 'whale', 'whale', 3, 2300)
    for (let i = 0; i < 8; i += 1) this.spawnSmoke(1000 + Phaser.Math.Between(-40, 40), 360 + Phaser.Math.Between(-20, 20), 0xb64af0)
    await this.delay(360)
  }

  private reactToImpact(event: BurnEvent): void {
    const shake = TIER_ANIMATIONS[event.burnTier].shake
    if (shake) this.cameras.main.shake(190 + shake * 28, shake / 1100)
    if (event.burnTier === 'whale') this.cameras.main.flash(220, 255, 68, 35)
    this.damageSupply(event.burnTier)
    this.reactCrew('supply', event.burnTier === 'whale' ? 'whale' : 'impact', event.burnTier, event.burnTier === 'whale' ? 4 : event.burnTier === 'large' ? 3 : 1, event.burnTier === 'whale' ? 2200 : 1250)
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
