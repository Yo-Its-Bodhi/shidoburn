# SHIDO BURN WAR — Phase 1

A functional browser prototype that turns normalized SHIDO burn events into a cartoon battlefield sequence:

`burn event → classify → enqueue → launch projectile → impact supply → update UI`

This is intentionally **simulation-only**. It proves the interaction and architecture before any live-chain assumptions or finished artwork are introduced.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the local URL Vite prints (normally `http://localhost:5173`). Click **Trigger Whale** to see the warning, largest projectile, explosion, stat update, and feed entry.

Verification commands:

```bash
npm test
npm run build
```

## What Phase 1 includes

- Responsive, 2:1 Phaser battlefield with code-drawn placeholder supply/burn bases, SHIDO coin pile, furnace, projectiles, explosions, camera shake, and coin scatter
- Micro, small, medium, large, and whale attack animations
- Whale warning state and delayed cinematic launch
- Three counters, latest-impact display, recent event feed, fake explorer links, sound toggle, and queue depth
- Manual triggers, random burn, and stoppable Chaos mode
- FIFO event queue capable of receiving events while another animation is active
- Tests for thresholds, queue order, counter mutations, and simulated event creation

## Event flow

```text
BurnDataProvider
  → normalizeBurn()
  → classifyBurn()
  → BurnEventQueue
  → useBurnEngine
  → BattlefieldScene animation
  → applyBurnEvent() UI update
```

The totals change **on impact**, not when an event first enters the queue. This keeps the visual event and displayed state synchronized.

## Project structure

```text
src/
  animation/   Phaser scene and drawing/animation code
  audio/       Generated Web Audio warning/impact sounds
  components/  Responsive React HUD, feed, controls, battlefield host
  config/      Tier thresholds and animation mappings
  domain/      Normalized BurnEvent contract
  engine/      Queue-to-animation orchestration
  providers/   Provider interface and simulated implementation
  queue/       Framework-independent FIFO BurnEventQueue
  services/    Classification and normalization
  state/       Pure counter/feed state updates
```

## Configure burn tiers

Edit `src/config/burnTiers.ts` only. `BURN_THRESHOLDS` controls classification boundaries, while `TIER_ANIMATIONS` controls visual duration, scale, colour, explosion size, and camera shake. Thresholds are not duplicated in the UI or engine.

## Future live Shido provider

A future `ShidoProvider` should implement `BurnDataProvider` from `src/providers/BurnDataProvider.ts`. Its chain-specific job will be to:

1. connect to a verified live source,
2. calculate/extract burns using verified Shido mechanics,
3. construct a `RawBurnEvent`,
4. pass it through `normalizeBurn`, and
5. emit only normalized `BurnEvent` objects.

The user supplied the following candidate endpoints for later research; they are deliberately **not called or treated as verified in Phase 1**:

- REST/Swagger: `https://rest.mavnode.io/swagger/#`
- Cosmos RPC: `https://rpc.mavnode.io`
- REST API: `https://rest.mavnode.io`
- gRPC: `https://grpc.mavnode.io`
- EVM JSON-RPC: `https://evm.mavnode.io`

No queue, classifier, animation, or React UI changes should be necessary when the simulator is replaced or supplemented with a live provider.

## Known Phase 1 limits

- Values and explorer links are simulated; the starting totals are visual demo fixtures.
- Projectiles, castles, coins, and explosions are drawn primitives rather than production art.
- Queue processing is sequential. Its snapshot API leaves a clean seam for Phase 2 barrage grouping, but grouping is not implemented yet.
- Sound is intentionally basic oscillator audio and begins only after user interaction due to browser autoplay policy.
- No backend, wallet, authentication, NFT, sharing, Burn Cam, or blockchain integration.

## Recommended Phase 2 (not started)

- Replace primitives with an authored sprite/texture atlas while preserving the current scene API.
- Add pooled particles, smoke trails, projectile variants, furnace heat states, and two or three restrained reaction animations.
- Add a barrage policy that groups adjacent micro/small burns while retaining exact aggregate totals and individual feed records.
- Improve audio with small licensed/original effects and per-tier mixing.
- Add visual regression and reduced-motion behavior around the new art.
