import type { BurnTier } from '../domain/burnEvent'

export type ReactionSide = 'supply' | 'burn'
export type ReactionMoment = 'idle' | 'launch' | 'impact' | 'barrage' | 'whale'

const SUPPLY_IDLE = [
  'Anyone hear whistling?', 'I hate night shift.', 'Bag looks safe.', 'Probably fine.',
  'Do we get dental?', 'My mum warned me.', 'Is that smoke?', 'Lunch soon?',
  'I joined yesterday.', 'What cannon?', 'Quiet tonight.', 'This wall is damp.',
  'Has it always leaned?', 'I miss accounting.', 'No refunds, right?', 'Why is the moon purple?',
]

const BURN_IDLE = [
  'Furnace hungry.', 'Who has the matches?', 'Pointy end left.', 'Safety third.',
  'More coal!', 'Is this insured?', 'I smell eyebrows.', 'Loader missing again.',
  'That seems stable.', 'Try the red button.', 'Definitely calibrated.', 'Do not lick cannon.',
  'Nine thousand and eight!', 'We need a bigger bomb.', 'Lunch is on fire.', 'Good smoke today.',
]

const BURN_LAUNCH = [
  'LIGHT IT!', 'SEND IT!', 'YEET THE SUPPLY!', 'FIRE IN THE HOLE!',
  'LESS COINS, LADS!', 'POINT IT LEFT!', 'BURN O’CLOCK!', 'LET HIM COOK!',
  'THAT FITS. PROBABLY.', 'PULL THE STUPID LEVER!', 'FURNACE SAYS YES!', 'FULL SEND!',
  'MAKE IT DEFLATIONARY!', 'LOAD THE SPICY ONE!', 'WHO GAVE HIM MATCHES?', 'INCOMING TAX CUT!',
]

const SUPPLY_IMPACT: Record<BurnTier, readonly string[]> = {
  micro: ['ow.', 'Was that a pea?', 'Tiny betrayal!', 'My ankle!', 'Rude.', 'Did we lose a coin?', 'pew?!', 'That still counts?!'],
  small: ['DUCK!', 'MY SHIDO!', 'AGAIN?!', 'NOT THE WALL!', 'Who keeps doing that?', 'I JUST FIXED THAT!', 'MEDIC-ISH!', 'THE BAG!', 'bonk!', 'OHH, COME ON!'],
  medium: ['THAT HAD A FACE!', 'ROCKET! WHY?!', 'WE NEED A ROOF!', 'MY GOOD HELMET!', 'EVERYONE LOOK BUSY!', 'STRUCTURAL ISSUE!', 'I AM NOT PAID!', 'THE WALL SAID CRACK!'],
  large: ['METEOR?! SERIOUSLY?!', 'THAT WAS A TOWER!', 'EVACUATE THE BAG!', 'WE ARE LOSING BRICKS!', 'SOMEONE CALL A CHAIN!', 'MUM WAS RIGHT!', 'THIS FEELS PERSONAL!', 'KRAKOO—OH NO!'],
  whale: ['WE ARE SO COOKED!', 'NOT THE BAG!', 'MUM?!', 'DELETE MY BROWSER!', 'THAT IS NOT REGULATION!', 'TELL MY WALLET I LOVE IT!', 'WHO BURNED THAT MUCH?!', 'I QUIT RETROACTIVELY!', 'EVERY COIN FOR ITSELF!', 'OH, THAT IS MASSIVE.'],
}

const SUPPLY_BARRAGE = [
  'WHY ARE THERE SIX?!', 'FORM A PANIC!', 'TOO MANY PEWS!', 'EVERYBODY DUCK DIFFERENTLY!',
  'THEY FOUND RAPID FIRE!', 'COUNT THEM—NO, RUN!', 'STOP DROP AND HODL!', 'THIS IS BULLSHIDO!',
]

const BURN_BARRAGE = [
  'SEND EVERYTHING!', 'MORE DAKKA!', 'EMPTY THE RACK!', 'SIX FOR THE PRICE OF SIX!',
  'MAKE THE SKY STUPID!', 'FIRE UNTIL SOMETHING FALLS!', 'ACCURACY OPTIONAL!', 'BARRAGE O’CLOCK!',
]

const BURN_WHALE = [
  'OH. THAT BIG.', 'WAKE THE BIG MISSILE!', 'THIS VOIDS THE WARRANTY!', 'WHALE FOOD LOADED!',
  'EVERYONE STAND BACK-ish!', 'PURPLE BUTTON! PURPLE!', 'WHO ORDERED APOCALYPSE?', 'THE BIG ONE HAS EYES!',
]

const NOISES = ['KLANG!', 'FWOOMP!', 'SKREEEE!', 'chk-chk', 'bonk', 'hissssss', 'WHEEEE!', 'clonk', 'uh-oh.', 'PFFFFT!']

export const REACTION_COUNT = SUPPLY_IDLE.length + BURN_IDLE.length + BURN_LAUNCH.length
  + Object.values(SUPPLY_IMPACT).reduce((sum, lines) => sum + lines.length, 0)
  + SUPPLY_BARRAGE.length + BURN_BARRAGE.length + BURN_WHALE.length + NOISES.length

export function reactionPool(side: ReactionSide, moment: ReactionMoment, tier: BurnTier = 'small'): readonly string[] {
  if (moment === 'idle') return side === 'supply' ? SUPPLY_IDLE : BURN_IDLE
  if (moment === 'barrage') return side === 'supply' ? SUPPLY_BARRAGE : BURN_BARRAGE
  if (moment === 'whale') return side === 'supply' ? SUPPLY_IMPACT.whale : BURN_WHALE
  if (moment === 'impact') return side === 'supply' ? SUPPLY_IMPACT[tier] : NOISES
  return side === 'burn' ? BURN_LAUNCH : NOISES
}

export function pickReaction(side: ReactionSide, moment: ReactionMoment, tier: BurnTier = 'small', previous?: string): string {
  const pool = reactionPool(side, moment, tier)
  if (pool.length === 1) return pool[0]
  let next = pool[Math.floor(Math.random() * pool.length)]
  if (next === previous) next = pool[(pool.indexOf(next) + 1) % pool.length]
  return next
}
