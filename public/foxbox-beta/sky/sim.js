/**
 * sim.js — Sky Scramble's pure, deterministic game simulation + bot AI.
 *
 * Everyone auto-bounces upward on cloud platforms while the camera rises; fall below
 * the bottom of the screen and you're out. Land on a rival's head to steal their
 * bounce and knock them down. Last one up wins.
 *
 * This module has NO DOM, NO canvas and NO Math.random: all state is a plain
 * JSON-able object, all randomness comes from the round seed (mulberry32 for the level,
 * a stateless hash for bot "personality"), so the same seed + the same inputs always
 * produce exactly the same state. The renderer and the Gaming Couch glue only READ it.
 *
 * Coordinates: world pixels of a 1920 × 1080 virtual screen, y points UP, the world
 * wraps horizontally. `state.cameraY` is the world y of the BOTTOM screen edge.
 * One `stepSim` call advances exactly TICK = 1/60 s.
 *
 * ── Exported tuning constants (read-only for other modules) ────────────────────
 *   WORLD_W, VIEW_H, TICK        the SPEC basics
 *   PLAYER_R                     puffball radius (46; was 34, players made 35% bigger)
 *   PLATFORM_H                   cloud thickness (22)
 *   START_Y                      world y of the starting cloud's top surface (140)
 *   UNITS_PER_METRE              50 world px = 1 "metre" for the HUD height readout
 *   GRAVITY, JUMP_H, JUMP_VY     a normal bounce rises ~JUMP_H (260) px
 *   SPRING_VY                    spring launch (3× the height), after SPRING_HOLD_TICKS sitting
 *                                on the squashed spring (player.springHold counts down)
 *   STOMP_VY, BONK_STOMP_VY      head-stomp bounce: 1.6× plain, 2.2× from a bonk dive
 *   MAX_VX                       top horizontal speed (px/s) at full stick
 *   BONK_COOLDOWN_TICKS          90: ticks between bonk dives (player.bonkCooldown counts down from it)
 *   BONK_TICKS                   30: max length of one dive (player.bonkTicks counts down from it)
 *   DAZE_TICKS, BONK_DAZE_TICKS  max tumble after a stomp (player.dazedTicks; scaled by round time)
 *   STOMP_SAFE_TICKS             45: post-stomp immunity (player.stompSafeTicks)
 *   UPDRAFT_ZONE, UPDRAFT_BOOST  catch-up updraft near the bottom edge (see below)
 *   CAM_START_TICKS              120: the base camera rise starts after this
 *   CAM_CALM_TICKS               360: the leader-follow eases in over this
 *   GEN_MAX_GAP                  biggest vertical gap the generator leaves between linked clouds
 *
 * ── Extra state (beyond the SPEC; all plain JSON) ─────────────────────────────
 *   state.camSpeed       base camera rise speed (px/s)
 *   state.camVy          actual camera speed last tick incl. leader follow (px/s)
 *   player.bonkCooldown  ticks until the next bonk is allowed (0 = ready)
 *   player.dazedTicks    >0 while tumbling after being stomped: falls THROUGH clouds, ~no control
 *   player.stompSafeTicks >0 right after being stomped: can't be stomped again (blink it?)
 *   player.stomps        heads this player has landed on this round
 *   player.stompedBy     playerId of the last player to stomp this one (or null)
 *   player.bonkHeld      last tick's bonk button (rising-edge detection)
 *   player.ai            bot plan memory (bots only; ignore)
 *   platform.base        true on the wide starting cloud (it also catches dazed players)
 *   platform.x0/range/off  drift clouds: anchor, half-travel and current offset (x = x0 + off)
 *   bounce event .boost  0..1 updraft strength of that bounce (bigger puff of air?)
 *   stomp event .bonk    true when the stomper was bonk-diving (the big one)
 *
 * ── Extra helpers ─────────────────────────────────────────────────────────────
 *   heightMetres(state, player) best height in whole metres above the start cloud
 *   bonkReadiness(player)       0..100, 100 = bonk ready (for the HUD meter)
 *   rankPlayers(state)          current standings best → worst (same rule as placement)
 *   updraft(state, y)           0..1 updraft strength at world height y
 *   wrapDelta(dx)               shortest signed horizontal distance on the wrapped world
 *   genReach(gap)               generator's horizontal reach for a climb of `gap` px
 */

export const WORLD_W = 1920;
export const VIEW_H = 1080;
export const TICK = 1 / 60;

// Bodies.
export const PLAYER_R = 46;
export const PLATFORM_H = 22;
export const START_Y = 140; // top surface of the wide starting cloud
export const UNITS_PER_METRE = 50;

// ── Movement ──────────────────────────────────────────────────────────────────
// Gravity + a fixed bounce velocity. With the discrete (semi-implicit Euler) step a
// normal bounce really rises ~250 px; the level generator keeps every gap well under
// that (see MAX_GAP).
export const GRAVITY = 2400; // px/s²
export const JUMP_H = 260; // nominal bounce height, px
export const JUMP_VY = Math.sqrt(2 * GRAVITY * JUMP_H); // ≈ 1117 px/s
export const SPRING_VY = Math.sqrt(2 * GRAVITY * JUMP_H * 3); // ≈ 1935 px/s (3× height)
// Landing on a spring pins you, squashed, for a moment ("springLoad"), then launches
// you ("spring"). Someone stomping you meanwhile cancels it.
export const SPRING_HOLD_TICKS = 3; // 0.05 s: a quick squash before the launch
export const STOMP_VY = Math.sqrt(2 * GRAVITY * JUMP_H * 1.6); // plain head-stomp bounce (1.6× height)
export const BONK_STOMP_VY = Math.sqrt(2 * GRAVITY * JUMP_H * 2.2); // bonk-dive stomp: 2.2× height
const MAX_FALL = 2300; // terminal fall speed, px/s
export const MAX_VX = 700; // horizontal top speed at full stick, px/s
const AIR_ACCEL = 3400; // px/s² toward the stick's target speed
const AIR_DRAG = 2000; // px/s² back toward 0 when the stick is centred
const CONTROL_BONK = 0.3; // air-control multiplier while diving
const CONTROL_DAZED = 0.2; // …and while tumbling after a stomp

// Collision tolerances.
const LAND_SLOP_X = PLAYER_R * 0.55; // how far past a cloud's edge you can still land on it
const HEAD_TH = PLAYER_R * 2 * 0.8; // feet-to-head vertical threshold for a stomp (on a default-height body)
// Body height, feet to top of head. A puffball is 2·PLAYER_R; a drawn character can be taller (a whole person),
// up to MAX_BODY_H. Feet and landing are the same for everyone; the head (stomps, going out) follows the height.
export const MAX_BODY_H = PLAYER_R * 4;
const bodyH = (p) => p.h || PLAYER_R * 2;
const headTh = (p) => bodyH(p) * 0.8;
const STOMP_DX = PLAYER_R * 2 * 0.7; // max horizontal offset for a stomp

// ── Bonk dive + head stomp (the core interaction) ─────────────────────────────
// A bonk is a fast straight-down dive. Landing on a rival's head (diving or not) is a
// STOMP: the stomper gets a big bounce (1.6× height, a full 2.2× spring when diving),
// the victim is shoved down and DAZED —
// for a moment they fall straight through clouds with almost no control, so a stomp
// costs them several hundred pixels and, near the bottom of the screen, their life.
// A bonk-dive stomp shoves harder and dazes longer, and refunds most of the cooldown so
// a well-aimed dive is a real reward.
export const BONK_COOLDOWN_TICKS = 90; // 1.5 s
export const BONK_TICKS = 30; // a dive lasts up to 0.5 s (ends early on any landing)
const BONK_VY = 1500; // dive speed, px/s
const BONK_REFUND_TICKS = 30; // cooldown left after a successful bonk-stomp
const SHOVE_VY = 550; // extra downward speed given to the victim of a plain stomp
const BONK_SHOVE_VY = 950; // …after a bonk-dive stomp
export const STOMP_SAFE_TICKS = 45; // after being stomped you can't be stomped again for 0.75 s
export const DAZE_TICKS = 12; // plain stomp: ~0.27 s falling through clouds
export const BONK_DAZE_TICKS = 22; // bonk stomp: ~0.43 s
// Stomps get meaner as the round goes on: the victim's daze (and half the shove)
// scales from STOMP_POWER0 at the start up to full strength at STOMP_RAMP_TICKS, so an
// accidental early bump in the crowded opening isn't a death sentence.
const STOMP_POWER0 = 0.25;
const STOMP_RAMP_TICKS = 1800; // 30 s

// ── Updraft (catch-up) ────────────────────────────────────────────────────────
// Warm air rises from the bottom of the screen: a normal cloud bounce in the lower
// UPDRAFT_ZONE of the view launches you higher, up to (1 + UPDRAFT_BOOST)× the height
// right at the bottom edge, fading to none at the top of the zone. It keeps the pack
// together (a stomped or lagging player can scramble back) without ever making a
// bounce WEAKER, so level reachability is unaffected. Bounce events carry `boost` 0..1.
export const UPDRAFT_ZONE = 0.55; // fraction of the screen height, from the bottom
export const UPDRAFT_BOOST = 1.2; // extra bounce height at the very bottom (+120%)

// ── Camera ────────────────────────────────────────────────────────────────────
// Holds still for CAM_START_TICKS, then rises at CAM_V0 and ramps up by CAM_RAMP
// every second, steepening after CAM_LATE_S (capped at CAM_VMAX) — the pressure that
// eventually beats everyone, so even a long duel ends.
// It also follows the leader: once anyone alive is in the top third (above
// CAM_FOLLOW_LINE) it rises extra, CAM_FOLLOW_K px/s per px they are above the line,
// capped at CAM_FOLLOW_VMAX (eased in from CAM_FOLLOW_VMIN over CAM_CALM_TICKS so the
// opening doesn't lurch). The gentle gain lets the leader ride high in the top third,
// which leaves the most room below for the pack. The camera never moves down.
export const CAM_START_TICKS = 120; // 2 s before the base rise starts
const CAM_V0 = 30; // px/s once it starts
const CAM_RAMP = 4.6; // px/s gained per second
const CAM_LATE_S = 45; // after this many seconds of rising…
const CAM_LATE_RAMP = 0.12; // …speed also grows by this × (seconds past it)², ending long duels
const CAM_VMAX = 650; // px/s
const CAM_FOLLOW_LINE = (VIEW_H * 2) / 3;
const CAM_FOLLOW_K = 1.3; // 1/s
const CAM_FOLLOW_VMAX = 800; // px/s, full follow cap…
const CAM_FOLLOW_VMIN = 150; // …and the cap at the very start,
export const CAM_CALM_TICKS = 360; // ramping up to the full cap over the first 6 s

// ── Level generation ──────────────────────────────────────────────────────────
// Platforms are generated in LANES: a few independent chains, each platform reachable
// from the one before it (vertical gap ≤ MAX_GAP, horizontal offset within air reach,
// drift ranges included). Lane platforms are never 'puff' (a popped puff would break
// the chain for everyone else). "Extra" clouds are sprinkled near each lane step,
// placed so the NEXT lane platform is reachable from them too — so there are no dead
// ends. Difficulty 0→1 over HARD_HEIGHT px: bigger gaps, narrower clouds, more
// drift/puff, fewer extras.
const LANES = 3;
const HARD_HEIGHT = 14000;
const MAX_GAP = 205; // < the ~250 px a discrete bounce really rises
const GAP_MIN0 = 135; // lane step range at the bottom…
const GAP_MAX0 = 165;
const GAP_MIN1 = 170; // …and at HARD_HEIGHT (max is MAX_GAP)
const GEN_REACH = 0.55; // fraction of MAX_VX air-time reach the generator relies on
const GEN_AHEAD = 700; // generate this far above the top screen edge
const DROP_BELOW = 400; // forget platforms this far below the bottom edge

// ── Bots ──────────────────────────────────────────────────────────────────────
// Bots pick the highest platform they can still land on (springs liked, puffs and
// low-on-screen clouds disliked), re-think every few ticks (slower for weaker bots),
// aim a little off-centre, and bonk-dive at rivals passing below them. Each bot gets
// a deterministic "skill" 0..1 from the seed — competent, but beatable.
const BOT_SKILL_MIN = 0.45;
const BOT_THINK_MIN = 4; // ticks between re-plans for the best bot…
const BOT_THINK_MAX = 18; // …and the worst
const BOT_AGGRO_MIN = 0.04; // per-tick chance to take a lined-up bonk, worst bot…
const BOT_AGGRO_MAX = 0.15; // …best bot
const BOT_FUMBLE = 0.12; // per re-plan chance (× (1 − skill)) of a badly misjudged pick
const BOT_CALM_TICKS = 360; // bots never bonk in the first 6 s…
const BOT_AGGRO_RAMP_TICKS = 1500; // …and reach full aggression by 25 s

// ── Small helpers ─────────────────────────────────────────────────────────────

const clamp = (n, lo, hi) => (n < lo ? lo : n > hi ? hi : n);
const lerp = (a, b, t) => a + (b - a) * t;

/** Wrap an x coordinate into [0, WORLD_W). */
function wrapX(x) {
  return ((x % WORLD_W) + WORLD_W) % WORLD_W;
}

/** Shortest signed horizontal distance on the wrapped world (−W/2..W/2). */
export function wrapDelta(dx) {
  return dx - WORLD_W * Math.round(dx / WORLD_W);
}

/**
 * mulberry32 — a tiny deterministic PRNG, written as a step on `state.rng` (a uint32)
 * so the generator's position survives JSON round-trips. Only level generation uses it,
 * so the level for a seed is the same whatever the players do.
 */
function rand(state) {
  let a = (state.rng + 0x6d2b79f5) | 0;
  state.rng = a >>> 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Stateless hash → [0, 1). Bots use it (seed, tick, playerId, salt) so their dice rolls
 * never disturb the level generator and botInput stays a pure function of the state.
 */
function hash01(a, b, c) {
  let h = Math.imul((a | 0) ^ 0x9e3779b9, 0x85ebca6b);
  h ^= Math.imul((b | 0) + 0x632be5ab, 0xc2b2ae35);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h ^= Math.imul((c | 0) + 0x27d4eb2f, 0x165667b1);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/**
 * Time (s) for a body whose feet are at `feet` moving at `vy` to come back DOWN to
 * height `y`, or -1 if it never gets that high / is already falling past it.
 */
function timeToFallTo(feet, vy, y) {
  const disc = vy * vy + 2 * GRAVITY * (feet - y);
  if (disc < 0) return -1;
  const t = (vy + Math.sqrt(disc)) / GRAVITY;
  return t > 0 ? t : -1;
}

/** Air time available to land on a cloud `gap` px above the one you bounced from. */
function descendTime(gap) {
  return timeToFallTo(0, JUMP_VY, gap);
}

/**
 * Horizontal distance a player can cover in `t` seconds starting from speed `v0`
 * (already signed TOWARD the destination), accelerating at AIR_ACCEL up to MAX_VX.
 */
function airReach(v0, t) {
  if (t <= 0) return 0;
  const ta = Math.max(0, (MAX_VX - v0) / AIR_ACCEL);
  if (t <= ta) return v0 * t + 0.5 * AIR_ACCEL * t * t;
  return v0 * ta + 0.5 * AIR_ACCEL * ta * ta + MAX_VX * (t - ta);
}

/** Generator reach: centre-to-centre horizontal offset allowed for a `gap` px climb. */
export function genReach(gap) {
  return GEN_REACH * MAX_VX * descendTime(gap);
}

/** The maximum vertical gap the generator will ever leave between linked clouds. */
export const GEN_MAX_GAP = MAX_GAP;

/** Updraft strength 0..1 for a cloud at world height y (1 = at the bottom edge). */
export function updraft(state, y) {
  return clamp(1 - (y - state.cameraY) / (VIEW_H * UPDRAFT_ZONE), 0, 1);
}

const difficulty = (y) => clamp((y - START_Y) / HARD_HEIGHT, 0, 1);

// ── Level generation ──────────────────────────────────────────────────────────

function addPlatform(state, x, y, w, kind, d) {
  const p = { id: state.nextId++, x: wrapX(x), y, w: Math.round(w), h: PLATFORM_H, kind, broken: false };
  if (kind === "drift") {
    // Drifts sideways around x0, ±range, reversing at the bounds.
    p.x0 = p.x;
    p.range = Math.round(lerp(60, 130, d) * (0.7 + 0.3 * rand(state)));
    p.off = 0;
    p.vx = (rand(state) < 0.5 ? -1 : 1) * Math.round(lerp(50, 120, d));
  }
  state.platforms.push(p);
  return p;
}

/** Does a new cloud at (x, y, w) visually overlap an existing one? */
function overlaps(state, x, y, w) {
  for (const p of state.platforms) {
    if (Math.abs(p.y - y) > 46) continue;
    const reach = (p.w + w) / 2 + 30 + (p.range || 0);
    if (Math.abs(wrapDelta(p.x - x)) < reach) return true;
  }
  return false;
}

/** Generate lane steps (and their extras) until every lane is above `topY`. */
function generateUpTo(state, topY) {
  const lanes = state.gen.lanes;
  for (;;) {
    // Always advance the lowest lane, so lanes interleave deterministically.
    let lane = lanes[0];
    for (const l of lanes) if (l.y < lane.y) lane = l;
    if (lane.y >= topY) return;

    const d = difficulty(lane.y);
    // Small early steps can't be skipped two at a time (2 × 135 > a bounce), which keeps
    // the opening climb slow and calm; bigger later steps climb faster but need aim.
    const gap = Math.min(MAX_GAP, lerp(lerp(GAP_MIN0, GAP_MIN1, d), lerp(GAP_MAX0, MAX_GAP, d), rand(state)));
    const y = lane.y + gap;
    const w = lerp(290, 165, d) * (0.85 + 0.3 * rand(state));

    // Lane clouds are never puffs. Springs stay rare; drifts grow with height.
    const roll = rand(state);
    const kind = roll < 0.06 ? "spring" : roll < 0.06 + lerp(0.04, 0.32, d) ? "drift" : "cloud";

    // Horizontal step within reach. Drift ranges (from both ends) eat into the budget.
    const driftBudget = kind === "drift" ? lerp(60, 130, d) : 0;
    const reach = Math.max(40, genReach(gap) - lane.range - driftBudget);
    let x = lane.x;
    for (let tries = 0; tries < 5; tries++) {
      const sign = rand(state) < 0.5 ? -1 : 1;
      x = wrapX(lane.x + sign * reach * (0.15 + 0.85 * rand(state)));
      if (!overlaps(state, x, y, w)) break;
    }
    const p = addPlatform(state, x, y, w, kind, d);

    // Extras between the previous lane cloud and this one, each within reach of `p`.
    const extras = lerp(0.75, 0.2, d) + rand(state);
    for (let i = 1; i <= extras; i++) {
      const ey = lane.y + gap * (0.15 + 0.7 * rand(state)) - 70 * (i - 1);
      if (y - ey > MAX_GAP - 10) break; // keep the climb to `p` within one bounce
      const er = rand(state);
      const ekind =
        er < 0.04 ? "spring" : er < 0.04 + lerp(0.2, 0.6, d) ? "puff" : er < 0.06 + lerp(0.3, 0.85, d) ? "drift" : "cloud";
      const ew = (ekind === "puff" ? lerp(190, 130, d) : lerp(240, 150, d)) * (0.85 + 0.3 * rand(state));
      const eDrift = ekind === "drift" ? lerp(60, 130, d) : 0;
      const er2 = Math.max(0, genReach(y - ey) - eDrift - (p.range || 0));
      const ex = wrapX(p.x + (rand(state) * 2 - 1) * er2);
      if (overlaps(state, ex, ey, ew)) continue;
      addPlatform(state, ex, ey, ew, ekind, d);
    }

    lane.x = p.x;
    lane.y = y;
    lane.range = p.range || 0;
  }
}

/** Drift clouds slide back and forth around their anchor. */
function moveDrifts(state) {
  for (const p of state.platforms) {
    if (p.kind !== "drift") continue;
    p.off += p.vx * TICK;
    if (p.off > p.range) {
      p.off = p.range;
      p.vx = -Math.abs(p.vx);
    } else if (p.off < -p.range) {
      p.off = -p.range;
      p.vx = Math.abs(p.vx);
    }
    p.x = wrapX(p.x0 + p.off);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Build a fresh round. players: [{ playerId, isBot }], seed: number.
 * Everyone spawns spread out on a wide starting cloud at the bottom of the screen.
 */
export function createSim({ players, seed }) {
  const state = {
    tick: 0,
    seed: seed >>> 0,
    rng: (seed >>> 0) ^ 0x5bd1e995,
    cameraY: 0,
    camSpeed: 0, // base rise speed (px/s)
    camVy: 0, // actual camera speed last tick, base + leader follow (px/s)
    finished: false,
    placement: null,
    players: [],
    platforms: [],
    nextId: 0,
    gen: { lanes: [] },
  };

  // The starting cloud: wide enough that nobody misses it.
  state.platforms.push({
    id: state.nextId++, x: WORLD_W / 2, y: START_Y, w: 1600, h: PLATFORM_H, kind: "cloud", broken: false, base: true,
  });

  const n = players.length;
  const spacing = Math.min(190, 1400 / Math.max(1, n));
  players.forEach((pl, i) => {
    const x = WORLD_W / 2 + (i - (n - 1) / 2) * spacing;
    const y = START_Y + PLAYER_R + (i % 2) * 70; // staggered so they don't bounce in unison
    state.players.push({
      playerId: pl.playerId,
      isBot: !!pl.isBot,
      x, y,
      vx: 0, vy: 0,
      r: PLAYER_R,
      h: Math.max(PLAYER_R, Math.min(MAX_BODY_H, Number(pl.h) || PLAYER_R * 2)),
      alive: true,
      eliminatedTick: null,
      facing: x < WORLD_W / 2 ? 1 : -1,
      bonkTicks: 0,
      bonkCooldown: 0,
      bonkHeld: 0,
      dazedTicks: 0,
      stompSafeTicks: 0,
      springHold: 0,
      springY: 0,
      squash: 0,
      bestY: y,
      stomps: 0,
      stompedBy: null,
    });
  });

  // Lanes start spread across the world, rooted on the starting cloud.
  for (let i = 0; i < LANES; i++) {
    state.gen.lanes.push({ x: wrapX(WORLD_W * (i + 0.5) / LANES + (rand(state) - 0.5) * 200), y: START_Y, range: 0 });
  }
  generateUpTo(state, state.cameraY + VIEW_H + GEN_AHEAD);
  return state;
}

/**
 * Advance the round by one TICK. inputs: { [playerId]: { x: -1..1, bonk: 0|1 } }.
 * Mutates `state`; returns this tick's SimEvents (for sound and particles).
 */
export function stepSim(state, inputs) {
  const events = [];
  if (state.finished) return events;
  state.tick++;
  moveDrifts(state);

  const ps = state.players;
  const prevY = new Array(ps.length);

  // 1. Steering, bonk, gravity, integration (no collisions yet).
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    prevY[i] = p.y;
    if (!p.alive) {
      // Out players keep tumbling for the renderer, then park far below.
      if (p.y > state.cameraY - 1500) {
        p.vy = Math.max(p.vy - GRAVITY * TICK, -MAX_FALL);
        p.y += p.vy * TICK;
        p.x = wrapX(p.x + p.vx * TICK);
      }
      continue;
    }
    const inp = (inputs && inputs[p.playerId]) || {};
    const ux = clamp(Number(inp.x) || 0, -1, 1);
    const bonk = inp.bonk ? 1 : 0;

    if (p.bonkCooldown > 0) p.bonkCooldown--;
    if (p.dazedTicks > 0) p.dazedTicks--;
    if (p.stompSafeTicks > 0) p.stompSafeTicks--;
    p.squash = p.squash > 0.02 ? p.squash * 0.86 : 0;

    // Loaded on a spring: sit squashed, then launch.
    if (p.springHold > 0) {
      p.bonkHeld = bonk;
      p.vx = 0;
      p.vy = 0;
      p.y = p.springY + PLAYER_R;
      p.squash = 1;
      if (--p.springHold === 0) {
        p.vy = SPRING_VY;
        events.push({ type: "spring", playerId: p.playerId, x: p.x, y: p.springY });
      }
      continue;
    }

    // Bonk on the rising edge of the button.
    if (bonk && !p.bonkHeld && p.bonkCooldown === 0 && p.dazedTicks === 0) {
      p.bonkTicks = BONK_TICKS;
      p.bonkCooldown = BONK_COOLDOWN_TICKS;
      p.vy = Math.min(p.vy, -BONK_VY);
      p.vx *= 0.35;
      events.push({ type: "bonk", playerId: p.playerId, x: p.x, y: p.y });
    }
    p.bonkHeld = bonk;

    // Horizontal air control: ease vx toward the stick's target speed.
    const control = p.dazedTicks > 0 ? CONTROL_DAZED : p.bonkTicks > 0 ? CONTROL_BONK : 1;
    const accel = (ux !== 0 ? AIR_ACCEL : AIR_DRAG) * control * TICK;
    p.vx += clamp(ux * MAX_VX - p.vx, -accel, accel);
    if (ux > 0.2) p.facing = 1;
    else if (ux < -0.2) p.facing = -1;

    // Vertical: gravity; a dive holds at least BONK_VY downward.
    p.vy -= GRAVITY * TICK;
    if (p.bonkTicks > 0) {
      p.vy = Math.min(p.vy, -BONK_VY);
      p.bonkTicks--;
    }
    if (p.vy < -MAX_FALL) p.vy = -MAX_FALL;

    p.x = wrapX(p.x + p.vx * TICK);
    p.y += p.vy * TICK;
  }

  // 2. Head stomps — before platform landings, so a stomp on the way down to a cloud
  //    counts. Swept on RELATIVE height so fast dives can't tunnel through a head.
  const stomped = new Array(ps.length).fill(false);
  const stomper = new Array(ps.length).fill(false);
  for (let i = 0; i < ps.length; i++) {
    const a = ps[i];
    if (!a.alive || a.dazedTicks > 0 || stomped[i]) continue;
    for (let j = 0; j < ps.length; j++) {
      if (j === i || stomped[j] || stomper[j]) continue;
      const b = ps[j];
      if (!b.alive || b.stompSafeTicks > 0) continue;
      const relPrev = prevY[i] - prevY[j];
      const relNow = a.y - b.y;
      const th = headTh(b);
      if (relPrev < th || relNow >= th || relNow < -bodyH(a)) continue;
      if (a.vy >= b.vy) continue; // must be coming down onto them
      if (Math.abs(wrapDelta(a.x - b.x)) > STOMP_DX) continue;

      const diving = a.bonkTicks > 0;
      a.vy = diving ? BONK_STOMP_VY : STOMP_VY;
      a.y = b.y + th;
      a.bonkTicks = 0;
      a.squash = 1;
      a.stomps++;
      if (diving) a.bonkCooldown = Math.min(a.bonkCooldown, BONK_REFUND_TICKS);

      const power = lerp(STOMP_POWER0, 1, Math.min(1, state.tick / STOMP_RAMP_TICKS));
      // The shove ADDS to any fall already under way, so it always hurts.
      b.vy = Math.min(b.vy, 0) - (diving ? BONK_SHOVE_VY : SHOVE_VY) * (0.5 + 0.5 * power);
      b.vx = b.vx * 0.5 + wrapDelta(b.x - a.x) * 4; // knocked a little sideways, away from the stomper
      b.dazedTicks = Math.round((diving ? BONK_DAZE_TICKS : DAZE_TICKS) * power);
      b.bonkTicks = 0;
      b.springHold = 0;
      b.squash = 1;
      b.stompedBy = a.playerId;
      b.stompSafeTicks = STOMP_SAFE_TICKS;

      stomper[i] = true;
      stomped[j] = true;
      events.push({ type: "stomp", playerId: a.playerId, otherId: b.playerId, x: b.x, y: b.y - PLAYER_R + bodyH(b), bonk: diving });
      break;
    }
  }

  // 3. Platform landings: falling feet that crossed a cloud's top = automatic bounce.
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    if (!p.alive || stomper[i] || p.vy > 0 || p.springHold > 0) continue;
    const feetPrev = prevY[i] - PLAYER_R;
    const feet = p.y - PLAYER_R;
    let best = null;
    for (const c of state.platforms) {
      if (c.broken || c.y > feetPrev + 0.001 || c.y < feet) continue;
      if (p.dazedTicks > 0 && !c.base) continue; // dazed: fall through (the start cloud still catches you)
      if (Math.abs(wrapDelta(p.x - c.x)) > c.w / 2 + LAND_SLOP_X) continue;
      if (!best || c.y > best.y) best = c;
    }
    if (!best) continue;
    p.y = best.y + PLAYER_R;
    p.bonkTicks = 0;
    if (best.kind === "spring") {
      p.vy = 0;
      p.vx = 0;
      p.squash = 1;
      p.springHold = SPRING_HOLD_TICKS;
      p.springY = best.y;
      events.push({ type: "springLoad", playerId: p.playerId, x: p.x, y: best.y, platformId: best.id });
    } else {
      const boost = updraft(state, best.y);
      p.vy = JUMP_VY * Math.sqrt(1 + UPDRAFT_BOOST * boost);
      p.squash = 0.75;
      events.push({ type: "bounce", playerId: p.playerId, x: p.x, y: best.y, boost: Math.round(boost * 100) / 100 });
      if (best.kind === "puff") {
        best.broken = true;
        events.push({ type: "pop", platformId: best.id, x: best.x, y: best.y });
      }
    }
  }

  // 4. Best heights.
  for (const p of ps) if (p.alive && p.y > p.bestY) p.bestY = p.y;

  // 5. Camera: base rise that ramps up, plus easing up after the leader. Never down.
  const camBefore = state.cameraY;
  if (state.tick > CAM_START_TICKS) {
    const t = (state.tick - CAM_START_TICKS) * TICK;
    const late = Math.max(0, t - CAM_LATE_S);
    state.camSpeed = Math.min(CAM_VMAX, CAM_V0 + CAM_RAMP * t + CAM_LATE_RAMP * late * late);
    state.cameraY += state.camSpeed * TICK;
  }
  let leaderY = -Infinity;
  for (const p of ps) if (p.alive && p.y > leaderY) leaderY = p.y;
  const over = leaderY - CAM_FOLLOW_LINE - state.cameraY;
  if (over > 0) {
    const cap = lerp(CAM_FOLLOW_VMIN, CAM_FOLLOW_VMAX, Math.min(1, state.tick / CAM_CALM_TICKS));
    state.cameraY += Math.min(over * CAM_FOLLOW_K, cap) * TICK;
  }
  state.camVy = (state.cameraY - camBefore) / TICK;

  // 6. Eliminations: your top dropped below the bottom screen edge.
  for (const p of ps) {
    if (p.alive && p.y - PLAYER_R + bodyH(p) < state.cameraY) {
      p.alive = false;
      p.eliminatedTick = state.tick;
      p.bonkTicks = 0;
      p.dazedTicks = 0;
      events.push({ type: "out", playerId: p.playerId, x: p.x, y: state.cameraY });
    }
  }

  // 7. Level: generate ahead, forget what's far below.
  generateUpTo(state, state.cameraY + VIEW_H + GEN_AHEAD);
  if (state.platforms.length && state.platforms[0].y < state.cameraY - DROP_BELOW) {
    const floor = state.cameraY - DROP_BELOW;
    state.platforms = state.platforms.filter((c) => c.y >= floor);
  }

  // 8. Finish: ≤ 1 alive (or 0 alive in a solo round).
  let alive = 0;
  for (const p of ps) if (p.alive) alive++;
  if (ps.length === 1 ? alive === 0 : alive <= 1) {
    state.finished = true;
    state.placement = rankPlayers(state);
    events.push({ type: "finish", placement: state.placement.slice() });
  }
  return events;
}

/**
 * Standings best → worst: survivors by bestY, then eliminated players by
 * eliminatedTick (later = better), ties by bestY, then playerId (deterministic).
 */
export function rankPlayers(state) {
  return state.players
    .slice()
    .sort((a, b) => {
      if (a.alive !== b.alive) return a.alive ? -1 : 1;
      if (!a.alive && a.eliminatedTick !== b.eliminatedTick) return b.eliminatedTick - a.eliminatedTick;
      if (a.bestY !== b.bestY) return b.bestY - a.bestY;
      return a.playerId - b.playerId;
    })
    .map((p) => p.playerId);
}

/** Best height in whole metres above the starting cloud (for the HUD). */
export function heightMetres(state, player) {
  return Math.max(0, Math.floor((player.bestY - (START_Y + PLAYER_R)) / UNITS_PER_METRE));
}

/** Bonk readiness 0..100 (100 = ready) for the HUD meter. */
export function bonkReadiness(player) {
  return Math.round(100 * (1 - player.bonkCooldown / BONK_COOLDOWN_TICKS));
}

// ── Bot AI ────────────────────────────────────────────────────────────────────

/** A bot's fixed personality for this round, 0 (clumsy) … 1 (sharp). */
function botSkill(state, playerId) {
  return lerp(BOT_SKILL_MIN, 1, hash01(state.seed, playerId, 0x51c1));
}

/**
 * Choose the cloud to land on next: the best-scoring one this bot can still reach
 * before its feet fall past it. Returns { plat, t, cx } or null.
 */
function chooseTarget(state, p, skill) {
  const feet = p.y - PLAYER_R;
  const fumble = hash01(state.seed ^ 0x7f4a7c15, state.tick, p.playerId) < BOT_FUMBLE * (1 - skill);
  // Judgement noise per cloud; a weak bot occasionally misjudges badly (fumble).
  const noiseAmp = fumble ? 700 : lerp(160, 25, skill);
  let best = null;
  let bestScore = -Infinity;
  for (const c of state.platforms) {
    if (c.broken) continue;
    const t = timeToFallTo(feet, p.vy, c.y + 6); // a little margin above the surface
    if (t < 0) continue;
    // Where will it be when we get there? (drifts: ignore bounces off their bounds)
    let cx = c.x;
    if (c.kind === "drift") cx = wrapX(c.x0 + clamp(c.off + c.vx * t, -c.range, c.range));
    const dx = wrapDelta(cx - p.x);
    const need = Math.max(0, Math.abs(dx) - c.w / 2 - LAND_SLOP_X * 0.3);
    const v0 = Math.sign(dx) * p.vx;
    const can = airReach(v0, t - 0.05) * (p.dazedTicks > 0 ? 0.3 : 0.92);
    if (need > can) continue;

    let score = c.y;
    if (c.kind === "spring") score += 260;
    if (c.kind === "puff") score -= 90;
    if (c.kind === "drift") score -= 25;
    // Where will the bottom edge be when we land? Skip clouds it will have passed,
    // and dislike ones that will be uncomfortably close to it.
    const camAt = state.cameraY + state.camVy * t;
    if (c.y + PLAYER_R * 0.5 < camAt) continue;
    if (c.y < camAt + 220) score -= 500;
    score += (can - need > 60 ? 30 : 0); // prefer comfortable jumps
    score += (hash01(state.seed + c.id * 31, p.playerId, 0xa11) - 0.5) * noiseAmp;
    if (score > bestScore) {
      bestScore = score;
      best = { plat: c, t, cx };
    }
  }
  return best;
}

/**
 * The best stepping stone above cloud `c`: a solid cloud within one bounce's height,
 * nearest horizontally (higher ones slightly preferred). null if none.
 */
function nextCloudUp(state, c) {
  let best = null;
  let bestCost = Infinity;
  for (const q of state.platforms) {
    if (q === c || q.broken || q.kind === "puff") continue;
    const dy = q.y - c.y;
    if (dy < 30 || dy > MAX_GAP + 25) continue;
    const cost = Math.abs(wrapDelta(q.x - c.x)) - dy * 0.6 - (q.kind === "spring" ? 120 : 0);
    if (cost < bestCost) {
      bestCost = cost;
      best = q;
    }
  }
  return best;
}

/**
 * The input a bot would press this tick. Deterministic: depends only on `state`
 * (it keeps a little plan memory in `player.ai`, which is part of the state).
 */
export function botInput(state, playerId) {
  const p = state.players.find((q) => q.playerId === playerId);
  if (!p || !p.alive || state.finished) return { x: 0, bonk: 0 };
  const skill = botSkill(state, playerId);
  const ai = p.ai || (p.ai = { targetId: -1, thinkAt: 0, aimOff: 0 });
  const feet = p.y - PLAYER_R;

  // Re-plan when it's time, or when the plan has gone stale.
  let target = null;
  if (ai.targetId >= 0) {
    for (const c of state.platforms) if (c.id === ai.targetId) { target = c; break; }
  }
  const stale = !target || target.broken || timeToFallTo(feet, p.vy, target.y) < 0;
  if (stale || state.tick >= ai.thinkAt) {
    const pick = chooseTarget(state, p, skill);
    const newId = pick ? pick.plat.id : -1;
    if (newId !== ai.targetId && pick) {
      // Where on the landing cloud? On the side nearest the next cloud up, so the
      // following bounce can reach it (this is what walks bots across wide clouds),
      // plus a little aiming error — worse bots more so. Once per new target.
      const c = pick.plat;
      const half = Math.max(0, c.w / 2 - 30);
      const next = nextCloudUp(state, c);
      const lean = next ? clamp(wrapDelta(next.x - c.x), -half, half) : 0;
      const err = (hash01(state.seed, state.tick, playerId ^ 0x3c3c) - 0.5) * c.w * lerp(0.6, 0.2, skill);
      ai.aimOff = clamp(lean + err, -half - 10, half + 10);
    }
    ai.targetId = newId;
    target = pick ? pick.plat : null;
    ai.thinkAt = state.tick + Math.round(lerp(BOT_THINK_MAX, BOT_THINK_MIN, skill));
  }

  // Steer: pick the horizontal speed that arrives over the target as we come down.
  let x = 0;
  if (target) {
    const t = Math.max(0.12, timeToFallTo(feet, p.vy, target.y));
    let tx = target.x;
    if (target.kind === "drift") tx = wrapX(target.x0 + clamp(target.off + target.vx * t, -target.range, target.range));
    const dx = wrapDelta(tx + ai.aimOff - p.x);
    const want = clamp(dx / t, -MAX_VX, MAX_VX);
    x = clamp(want / MAX_VX + (want - p.vx) / 900, -1, 1);
    if (Math.abs(x) < 0.05) x = 0;
  } else {
    // No cloud in reach: head for the nearest one below and hope.
    let near = null;
    let nd = Infinity;
    for (const c of state.platforms) {
      if (c.broken || c.y > feet) continue;
      const d = Math.abs(wrapDelta(c.x - p.x)) + (feet - c.y) * 0.5;
      if (d < nd) { nd = d; near = c; }
    }
    if (near) x = clamp(wrapDelta(near.x - p.x) / 120, -1, 1);
  }

  // Bonk: dive at a rival lined up below, if it's safe to spend the height.
  let bonk = 0;
  if (p.bonkCooldown === 0 && p.bonkTicks === 0 && p.dazedTicks === 0 && p.y - 520 > state.cameraY + 160) {
    for (const r of state.players) {
      if (r === p || !r.alive || r.dazedTicks > 0 || r.stompSafeTicks > 0) continue;
      const dy = p.y - r.y;
      if (dy < HEAD_TH + 10 || dy > 430) continue;
      const tHit = (dy - HEAD_TH) / Math.max(300, BONK_VY + r.vy);
      const dxNow = wrapDelta(r.x + r.vx * tHit - (p.x + p.vx * 0.35 * tHit));
      if (Math.abs(dxNow) > STOMP_DX * 0.7) continue;
      const ramp = clamp((state.tick - BOT_CALM_TICKS) / (BOT_AGGRO_RAMP_TICKS - BOT_CALM_TICKS), 0, 1);
      if (hash01(state.seed ^ 0xb0b, state.tick, playerId) < ramp * lerp(BOT_AGGRO_MIN, BOT_AGGRO_MAX, skill)) bonk = 1;
      break;
    }
  }
  // Release the button between presses so the next press is a fresh rising edge.
  if (p.bonkHeld) bonk = 0;
  return { x, bonk };
}
