# SHIDO BURN WAR — Phase 3 Comedy Front

A responsive cartoon battlefield that turns normalized SHIDO burn events into an escalating attack on the token supply:

`provider → normalize → classify → queue/volley → animate → impact → update totals and feed`

Phase 3 is still **simulation-only**. It pushes the visual storytelling and battlefield comedy toward the original product concept while deliberately keeping live-chain code out of the animation engine.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the URL Vite prints (normally `http://localhost:5173`). Try **Fire Barrage** and **Trigger Whale** first.

Verification:

```bash
npm test
npm run build
npm run lint
```

## Phase 3 additions

- Asymmetric ruined Supply fortress with an exposed, destructible SHIDO coin vault
- Stacked industrial Burn citadel with cannon deck, furnace, pipes, chimney, machinery and green smoke
- Ten active crew positions: shield guard, spear guard, coin handler, panicked defender, commander, cannoneer, loader, archer, spotter and furnace goblin
- 126 contextual phrases and noises split across idle, launch, barrage, tiered impact and whale moments
- Anti-repeat reaction selection and multi-character staggered reactions
- Persistent coin loss, new wall cracks and impact rubble as the battle progresses
- Five visually distinct weapons: spark, bomb, rocket, meteor and giant missile
- Layered trails, smoke clouds, shock rings, scorch marks, coin debris, flashes and tier-scaled camera shake
- Idle crew chatter so the battlefield stays alive between transactions
- Furnace heat, flame, crew and warning-light reactions during launches
- Real micro/small barrage grouping plus a dedicated **Fire Barrage** control
- Exact per-event totals and feed records even when multiple events share one volley
- Layered Web Audio launch, warning, impact and filtered-noise effects
- Responsive barrage and impact HUD states

## Event flow

```text
BurnDataProvider
  → normalizeBurn()
  → classifyBurn()
  → BurnEventQueue.dequeueBarrage()
  → createBurnVolley()
  → useBurnEngine
  → BattlefieldScene.playBurn()
  → applyBurnEvents()
```

The queue groups only adjacent `micro` and `small` events inside the configured time and size limits. It never merges their transaction identity. Counters still change only after the complete volley impacts.

## Project structure

```text
src/
  animation/   Phaser scene, drawing, weapons, particles and reactions
  audio/       Generated Web Audio launch/warning/impact layers
  components/  React HUD, feed, controls and battlefield host
  config/      Tier thresholds, animation mappings and barrage policy
  domain/      BurnEvent and BurnVolley contracts
  engine/      Queue-to-animation orchestration
  providers/   Provider interface and simulator
  queue/       Framework-independent event queue and grouping
  services/    Classification and normalization
  state/       Pure counter/feed state updates
```

## Configuration

All balancing remains in `src/config/burnTiers.ts`:

- `BURN_THRESHOLDS` controls tier classification.
- `TIER_ANIMATIONS` controls weapon type, duration, colour, scale, blast and shake.
- `BARRAGE_CONFIG` controls eligible tiers, maximum volley size, timestamp gap and launch stagger.

## Future live Shido provider

A live provider implements `BurnDataProvider` from `src/providers/BurnDataProvider.ts`, converts chain-specific data into `RawBurnEvent`, passes it through `normalizeBurn`, and emits normalized `BurnEvent` objects. The queue, barrage policy, Phaser scene and React UI remain unchanged.

Candidate endpoints supplied for later verification—not called by Phase 2:

- REST/Swagger: `https://rest.mavnode.io/swagger/#`
- Cosmos RPC: `https://rpc.mavnode.io`
- REST API: `https://rest.mavnode.io`
- gRPC: `https://grpc.mavnode.io`
- EVM JSON-RPC: `https://evm.mavnode.io`

## Current limits

- All values and explorer links are simulated; starting totals are demo fixtures.
- Art remains deterministic Phaser vector art. `docs/concepts/phase3-cast-fortress-guide.png` is the approved visual-development direction, not a runtime sprite atlas.
- Barrages group queued lightweight events; they do not yet use network-rate windows or adaptive choreography.
- Audio is generated in-browser rather than using licensed/original recorded samples.
- Persistent battlefield damage resets on refresh and does not yet reflect supply percentage.
- No backend, wallet, authentication, NFT, sharing, Burn Cam or blockchain integration.

## Future deployment

The intended production hostname is `burnwars.bodhix.io`. No DNS, hosting or production environment has been changed in Phase 3. The Vite app is static-host friendly; the eventual host should build with `npm run build` and serve `dist/` with SPA fallback to `index.html`.

## Recommended next work

- Research and verify the exact Shido burn mechanism and authoritative live event source.
- Implement a read-only `ShidoProvider` behind a simulation/live mode switch.
- Reconcile missed blocks, reconnects, duplicate transaction hashes and chain reorgs.
- Replace demo totals with verified supply/burn data and clearly label finality state.
- Convert the approved fortress and crew guide into transparent production sprite atlases with idle, launch, panic, impact and celebration frames.
