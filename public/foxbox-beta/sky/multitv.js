/**
 * multitv.js — Sky Scramble live on every TV of a multi-TV party (web build + relay only).
 *
 * The main ("boss") TV is the referee. It runs the round exactly as before (gc.game.js); when the shell
 * gives play() the optional hooks it also hands out (MULTITV-SPEC.md, "Game ↔ shell contract"):
 *
 *   header, once, when the round really starts (after drawn characters loaded):
 *     { v: 1, live: true, batch: 1, game: "sky", feel, jetpack, kfEvery, opts, seed,
 *       players: [{ playerId, isBot, h, color, colors: {base, light, dark} }], state }
 *     state = the whole start state (a JSON clone: new sim fields flow with no code here)
 *   tick, once per sim step, right after it (the over tick before gameOver):
 *     { n, in: { [playerId]: [x, bonk] }, e?, kf?: state, over?: 1, feel? }
 *     in   = the humans' inputs exactly as stepSim got them (bots are recomputed on every TV with botInput,
 *            a pure function of the state; a bot driven from the boss's keyboard is recorded like a human)
 *     e    = the referee's clock: the wall time (Date.now() ms) its tick 0 was due, from its frame time and
 *            step accumulator; sent when it moves (a stall / pause) and on keyframes. Screens draw on it.
 *     kf   = the whole state every KF_EVERY ticks and on the over tick (late screens start from it,
 *            every screen checks its re-simulation against it)
 *     feel = the feel preset, on keyframes and on a tick whose step ran with a new one (?feel= test keys)
 *
 * Every other TV ("screen") calls game.playMirror(ctx) → a live view (view.live === true):
 *   auth    an exact re-simulation of the referee: header state (or a keyframe after a gap / late join),
 *           then every pushed tick: recorded human inputs + botInput for bots → stepSim. Checked against
 *           every keyframe (view.stats.mismatches; a mismatch adopts the keyframe).
 *   others  everyone not in ctx.own, drawn from auth's history a little behind its newest tick
 *           (an adaptive buffer of ~50–100 ms that never runs dry on normal jitter), interpolated at the
 *           display rate, wrap-aware, never backwards.
 *   own     this TV's own players, predicted at the referee's "now" (its tick from each tick's boss time w
 *           and ctx.clock.bossNow()): a clone of the newest auth state stepped forward with the phones'
 *           inputs (view.input; logged per tick so every rebase replays them as they were), the other
 *           humans' last referee inputs and botInput. Rebased on every new referee tick; the difference
 *           goes into a visual offset that eases to 0 in ~100 ms (never a snap). Lead capped at MAX_LEAD.
 *   drawing one renderer (render.js) fed a composite state each frame (camera / clouds / jetpack items
 *           from the prediction, own players predicted, others delayed) with a fresh tick and alpha = 1,
 *           so it draws exactly these positions. Drawn characters show as puffballs here (pictures stay
 *           on the boss); every body keeps its height h from the header (it is in the state).
 *   events  the referee's events at the others' (delayed) time; own players' bounce / bonk / spring / jet
 *           events from the prediction's new ticks (the referee's copies are de-duplicated); anything else
 *           involving an own player as soon as the referee's tick arrives.
 *   HUD     gc.game.js's own pushPlayersHud / pushScreenPoints on the composite state (eliminations are
 *           the referee's).
 *   over    once the others' timeline reaches the referee's over tick: the final frame (the referee's final
 *           state) is drawn and held, view.over = true.
 *
 * QA: globalThis.__MTV_TRACE === true → every drawn frame pushes [Date.now(), {playerId: [x, y]}] to
 * globalThis.__mtvTrace (last 900): the boss from its normal loop (traceDrawn), screens from the view.
 * view.stats is a plain object updated live (the shell exposes it as FOXBOX_MIRROR.live).
 * Dev harness + numbers: dev/multitv-sky/ (README in index.html), QA: webkit-qa/multitv-sky-harness.mjs.
 */

import * as Sim from "./sim.js";
import { stepSim, botInput } from "./sim.js";
import { createRenderer } from "./render.js";
import { createSfx } from "./sfx.js";
import { loadCharacterImage } from "./character.js";

export const MIRROR_V = 1;
/** A full keyframe every this many ticks (2 s; the spec's maximum). */
export const KF_EVERY = 120;

const W = Number.isFinite(Sim.WORLD_W) && Sim.WORLD_W > 0 ? Sim.WORLD_W : 1920;
const TICK_MS = 1000 * (Number.isFinite(Sim.TICK) && Sim.TICK > 0 ? Sim.TICK : 1 / 60);
const BODY = 2 * (Number.isFinite(Sim.PLAYER_R) ? Sim.PLAYER_R : 46);

/** The prediction never runs more than this many ticks past the newest referee tick (a stalled referee). */
export const MAX_LEAD = 20;
/** Others: kept this far (ms) behind the newest referee tick on top of the recent arrival jitter. */
const BUFFER_MS = 50;
/** …the arrival-lateness peak-hold: its excess over the current lateness fades with this time constant (ms)… */
const PEAK_TAU = 2000;
/** …and a tick later than this (ms) is a stall, not jitter: the others hold, then catch up, the buffer stays. */
const LATE_MAX = 400;
/** Own players' corrections ease out with this time constant (≈95 % gone in 100 ms)… */
const EASE_MS = 33;
/** …and a teleport-size one (> 3 bodies) faster. */
const EASE_FAST_MS = 12;
/** Timeline steering: rate = 1 ± GAIN·error (ticks), at most ±MAX_RATE; further off than *_SNAP ticks jumps. */
const GAIN = 0.05, MAX_RATE = 0.1, OWN_SNAP = 8, OTHERS_SNAP = 30;
/** Referee history kept for the others (ticks). */
const RING = 240;
/** Own events the prediction can play (the referee's copies of them are dropped within MATCH_TICKS). */
const PRED_TYPES = new Set(["bounce", "bonk", "spring", "springLoad", "jetGet", "jetSputter", "jetEnd", "jetPop"]);
const MATCH_TICKS = 15;
/** Ticks arriving up to this many early wait for the ones before them (a reordering relay); more is a gap. */
const REORDER = 8;
/** Delayed referee events further behind than this (a jump) are dropped instead of all playing at once. */
const STALE_TICKS = 30;
const TRACE_KEEP = 900;

const clamp = (n, lo, hi) => (n < lo ? lo : n > hi ? hi : n);
const wrapX = (x) => ((x % W) + W) % W;
const wrapDelta = (dx) => dx - W * Math.round(dx / W);

// ── Plain-data helpers (the sim state is plain JSON-able data) ──────────────────

/** Deep copy of plain data (objects, arrays, primitives). */
export function clone(v) {
  if (v === null || typeof v !== "object") return v;
  if (Array.isArray(v)) {
    const a = new Array(v.length);
    for (let i = 0; i < v.length; i++) a[i] = clone(v[i]);
    return a;
  }
  const o = {};
  for (const k of Object.keys(v)) o[k] = clone(v[k]);
  return o;
}

/** A JSON-safe deep copy (what the relay would deliver). */
export function jsonClone(v) {
  return v === undefined ? undefined : JSON.parse(JSON.stringify(v));
}

/**
 * First difference between two plain-data values as a path ("players.2.vy"), or null when equal.
 * Key order is ignored, a key holding undefined counts as missing, 0 === -0.
 */
export function firstDiff(a, b, path = "") {
  if (a === b) return null;
  if (typeof a === "number" && typeof b === "number") return a !== a && b !== b ? null : path || "(root)";
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return path || "(root)";
  if (Array.isArray(a) !== Array.isArray(b)) return path || "(root)";
  if (Array.isArray(a)) {
    if (a.length !== b.length) return `${path}.length`;
    for (let i = 0; i < a.length; i++) {
      const d = firstDiff(a[i], b[i], path ? `${path}.${i}` : String(i));
      if (d) return d;
    }
    return null;
  }
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (a[k] === undefined && b[k] === undefined) continue;
    const d = firstDiff(a[k], b[k], path ? `${path}.${k}` : k);
    if (d) return d;
  }
  return null;
}

let hookErrors = 0;
function report(label, err) {
  if (hookErrors++ < 10) console.error(`[sky-scramble] multitv: ${label}`, err);
}

/** A bot's input exactly as gc.game.js gatherInputs() makes it. */
function aiInput(state, id) {
  const ai = botInput(state, id) || {};
  return { x: clamp(Number(ai.x) || 0, -1, 1), bonk: ai.bonk ? 1 : 0 };
}

// ── Boss: the referee's header + ticks ──────────────────────────────────────────

/**
 * Called by gc.game.js startRound() when play() got onMirrorHeader / onMirrorTick: sends the header now and
 * returns the per-tick function the loop calls right after each stepSim(r.state, inputs) (null when there is
 * no tick hook). Never throws; a throwing hook is caught and logged.
 *   r      the round (r.state, r.controls, r.acc, r.lastTime)
 *   opts   the game's URL options (gc.game.js URL_OPTS, whatever it holds) — passed through to the screens'
 *          renderer options as they are, so a look option the boss uses reaches them
 *   colors { [playerId]: {base, light, dark} } as resolved for the boss's renderer
 */
export function bossTap(ctx, r, opts, colors) {
  const onHeader = typeof ctx.onMirrorHeader === "function" ? ctx.onMirrorHeader : null;
  const onTick = typeof ctx.onMirrorTick === "function" ? ctx.onMirrorTick : null;
  if (!onHeader && !onTick) return null;
  let feel = Sim.FEEL;
  try {
    if (onHeader) {
      const s = r.state;
      const byId = new Map((ctx.players || []).map((p) => [p && p.playerId, p]));
      const header = {
        v: MIRROR_V, live: true, batch: 1, game: "sky", feel, jetpack: !!s.jet, kfEvery: KF_EVERY,
        opts: jsonClone(opts || {}), seed: s.seed,
        players: s.players.map((p) => ({
          playerId: p.playerId, isBot: !!p.isBot, h: p.h,
          color: (byId.get(p.playerId) && byId.get(p.playerId).color) || null,
          colors: jsonClone((colors && colors[p.playerId]) || null),
        })),
        state: jsonClone(s),
      };
      onHeader(header);
    }
  } catch (err) {
    report("onMirrorHeader failed", err);
  }
  if (!onTick) return null;
  let lastE = null;
  return function tap(inputs) {
    try {
      const s = r.state;
      const t = { n: s.tick, in: {} };
      // the referee's clock exactly: the wall time (ms, Date.now() terms) its tick 0 was due = this frame's
      // start − the ticks done − what the accumulator still holds past this tick. Sent when it moves (a
      // stall / pause shifts it) and on keyframes; screens draw on this timeline.
      if (Number.isFinite(r.lastTime) && Number.isFinite(r.acc) && typeof performance !== "undefined") {
        const e = Date.now() - (performance.now() - r.lastTime * 1000) - s.tick * TICK_MS - (r.acc * 1000 - TICK_MS);
        if (lastE == null || Math.abs(e - lastE) >= 2 || s.tick % KF_EVERY === 0 || s.finished) t.e = lastE = Math.round(e);
      }
      for (const p of s.players) {
        const inp = inputs && inputs[p.playerId];
        if (!inp) continue;
        if (p.isBot) {
          // a bot follows its AI (recomputed on every screen) unless the dev keyboard drives it
          const c = r.controls && r.controls.get(p.playerId);
          if (!c || (c.x === 0 && !c.bonk)) continue;
        }
        t.in[p.playerId] = [inp.x, inp.bonk];
      }
      if (s.finished) t.over = 1;
      if (s.finished || s.tick % KF_EVERY === 0) t.kf = jsonClone(s);
      if (Sim.FEEL !== feel || t.kf) t.feel = feel = Sim.FEEL;
      onTick(t);
    } catch (err) {
      report("onMirrorTick failed", err);
    }
  };
}

// ── QA trace (spec "QA hooks") ──────────────────────────────────────────────────

function tracePush(pos) {
  const tr = Array.isArray(globalThis.__mtvTrace) ? globalThis.__mtvTrace : (globalThis.__mtvTrace = []);
  tr.push([Date.now(), pos]);
  if (tr.length > TRACE_KEEP) tr.splice(0, tr.length - TRACE_KEEP);
}

/** Boss: where render.js draws each alive player this frame (its prev/cur-per-tick interpolation by alpha). */
const bt = { state: null, tick: -1, recs: new Map() };
export function traceDrawn(state, alpha) {
  try {
    if (!state || !Array.isArray(state.players)) return;
    const tick = state.tick | 0;
    if (state !== bt.state || tick < bt.tick) {
      bt.state = state;
      bt.tick = -1;
      bt.recs = new Map();
    }
    const dt = bt.tick < 0 ? 0 : tick - bt.tick;
    if (dt !== 0 || bt.tick < 0) {
      for (const p of state.players) {
        let rec = bt.recs.get(p.playerId);
        if (!rec) bt.recs.set(p.playerId, (rec = { px: p.x, py: p.y, cx: p.x, cy: p.y }));
        if (dt === 1) {
          rec.px = rec.cx;
          rec.py = rec.cy;
        } else {
          rec.px = p.x;
          rec.py = p.y;
        }
        rec.cx = p.x;
        rec.cy = p.y;
      }
      bt.tick = tick;
    }
    const a = alpha == null || !Number.isFinite(alpha) ? 1 : clamp(alpha, 0, 1);
    const pos = {};
    for (const p of state.players) {
      if (!p.alive) continue;
      const rec = bt.recs.get(p.playerId);
      pos[p.playerId] = [wrapX(rec.px + wrapDelta(rec.cx - rec.px) * a), rec.py + (rec.cy - rec.py) * a];
    }
    tracePush(pos);
  } catch {
    /* QA only */
  }
}

function traceState(state) {
  const pos = {};
  for (const p of state.players) if (p.alive) pos[p.playerId] = [p.x, p.y];
  tracePush(pos);
}

// ── Screen: the live core (no DOM: unit-testable) ───────────────────────────────

/**
 * The live view's logic without drawing. header = the boss's header, own = this TV's playerIds.
 *   push(tick, w, tArr, tLocal)  a referee tick; w = the boss's Date.now() when it was made, tArr = the boss's
 *                        clock when it arrived here (bossNow()), tLocal = performance.now(); true if it was used
 *   input(id, inputs, tArr)  an own player's phone input {a0, a1, b0, b1} (tArr = bossNow() on arrival)
 *   frame(tLocal, tBoss) one display frame (tLocal: performance.now(), tBoss: the boss's clock now) →
 *                        { state (the composite to draw), events (to play this frame), over (the final frame) }
 *   setPaused(on), stats, auth (the referee re-simulation: { s, n, over, overN })
 */
export function createLiveCore({ header, own = [] }) {
  const h = header;
  const humans = new Set(h.players.filter((p) => !p.isBot).map((p) => p.playerId));
  const ownIds = new Set([...(own || [])].map(Number).filter((id) => humans.has(id)));

  const stats = {
    live: true, game: "sky", v: h.v, own: [...ownIds],
    received: 0, ticks: 0, reordered: 0, gaps: 0, joins: 0, keyframes: 0, mismatches: 0, lastMismatch: null,
    authTick: 0, predTick: 0, ownTick: null, othersTick: null,
    leadTicks: 0, leadAvg: 0, capped: 0,
    othersBufferMs: 0, othersBufferAvgMs: 0, othersBufferMinMs: null, othersDry: 0, othersHolds: 0, othersSnaps: 0,
    latePeakMs: 0, epochResets: 0, ownSnaps: 0,
    rebases: 0, replayTicks: 0, newTicks: 0, corrections: 0, maxCorrectionPx: 0, lastCorrectionPx: 0, offsetPx: 0,
    inputs: 0, predictedEvents: 0, dedupedEvents: 0, lateOwnEvents: 0, droppedEvents: 0,
    frames: 0, over: false, overTick: null, placement: null,
  };

  // ── the referee, re-simulated ──
  const auth = { s: clone(h.state), n: 0, over: false, overN: -1 };
  auth.n = auth.s.tick | 0;
  let ringLo = auth.n; // oldest tick in the history
  let waitKf = false; // a gap / late join / divergence: waiting for a keyframe
  let lastIn = {}; // the newest referee tick's human inputs
  const ring = new Map(); // n → { cam, byId: Map(playerId → player) }: the referee's players after step n
  function snapAuth() {
    const byId = new Map();
    for (const p of auth.s.players) byId.set(p.playerId, clone(p));
    ring.set(auth.n, { cam: auth.s.cameraY, byId });
    while (auth.n - ringLo >= RING) ring.delete(ringLo++);
  }
  snapAuth();

  // ── the referee's clock: tick n is due at epoch + n·TICK_MS (boss ms) ──
  const eWin = [], phaseWin = [];
  let epoch = null, wEpoch = null, bossE = null, phaseB = 0;
  let latPeak = null, latAt = 0;
  function epochSample(n, w, e) {
    if (Number.isFinite(e)) {
      // the referee says it exactly (tick.e); a jump is it pausing / stalling
      if (bossE != null && Math.abs(e - bossE) > 100) {
        latPeak = null;
        stats.epochResets++;
      }
      bossE = e;
    }
    if (Number.isFinite(w)) {
      // else from w (the boss's own clock: network jitter never moves w − n·TICK, only the boss's late
      // frames do, upward): the minimum of the last 30; more than 100 ms later is a pause / stall
      const ew = w - n * TICK_MS;
      if (wEpoch != null && ew > wEpoch + 100) {
        eWin.length = 0;
        if (bossE == null) {
          latPeak = null;
          stats.epochResets++;
        }
      }
      eWin.push(ew);
      if (eWin.length > 30) eWin.shift();
      let m = Infinity;
      for (const v of eWin) if (v < m) m = v;
      wEpoch = m;
    }
    epoch = bossE != null ? bossE : wEpoch;
    if (epoch != null && Number.isFinite(w)) {
      // the referee's frame phase: how long after tick n was due its frame really stepped it (median)
      phaseWin.push(w - epoch - n * TICK_MS);
      if (phaseWin.length > 31) phaseWin.shift();
      const sorted = [...phaseWin].sort((a, b) => a - b);
      phaseB = clamp(sorted[sorted.length >> 1], 0, 3 * TICK_MS);
    }
  }
  /**
   * How late tick n arrived after it was due (+ one tick: the next one is due a tick later), peak-held, the
   * excess fading. Only the trip counts (relay + network): a tick the referee itself made late (its own hiccup)
   * counts as made on time — its screen froze too — and a tick handled late because THIS page stalled (no frame
   * for 45 ms) is skipped.
   */
  function lateSample(n, w, ta, tLocal) {
    if (epoch == null || !Number.isFinite(ta)) return;
    if (Number.isFinite(tLocal) && lastLocal != null && tLocal - lastLocal > 45) return;
    const due = epoch + n * TICK_MS;
    const trip = Number.isFinite(w) ? Math.max(0, ta - w) + clamp(w - due, 0, phaseB + 4) : ta - due; // relay + usual frame phase
    const l = Math.min(LATE_MAX, trip + TICK_MS);
    latPeak = latPeak == null ? l : Math.max(l, l + (latPeak - l) * Math.exp(-Math.max(0, ta - latAt) / PEAK_TAU));
    latAt = ta;
    stats.latePeakMs = Math.round(latPeak);
  }

  // ── own players: the prediction ──
  const local = new Map([...ownIds].map((id) => [id, { x: 0, bonk: 0, latch: false }]));
  const offset = new Map([...ownIds].map((id) => [id, { x: 0, y: 0 }]));
  let pred = null; // { s, n }: the newest referee state, stepped forward
  let predBase = -1; // auth.n it was built from
  let predMax = auth.n; // highest tick the prediction ever reached (each tick's events play once)
  let predHist = new Map(); // n (> predBase) → { cam, byId (own players) }
  const inLog = new Map(); // n → { [ownId]: {x, bonk} } as the prediction first used them
  const predPlayed = []; // own events played from the prediction: { type, pid, n, matched }

  // ── display timelines (fractional ticks) ──
  let tauOwn = null, tauOth = null, lastLocal = null, paused = false, overShown = false, drawTick = 0;
  let bufSum = 0, bufN = 0, leadSum = 0, leadN = 0;

  // ── events ──
  const evNow = []; // play at the next frame
  const evLater = []; // { n, ev }: play when the others' timeline reaches tick n

  function markOver(n) {
    auth.over = true;
    auth.overN = n;
    stats.overTick = n;
    stats.placement = Array.isArray(auth.s.placement) ? auth.s.placement.slice() : null;
  }

  function resetPrediction() {
    pred = null;
    predBase = -1;
    predMax = auth.n;
    predHist = new Map();
    inLog.clear();
    predPlayed.length = 0;
    for (const o of offset.values()) o.x = o.y = 0;
  }

  /** Take a keyframe as the referee's state at tick n (a late join / gap, or a mismatch). */
  function adopt(kf, n, why) {
    auth.s = clone(kf);
    auth.n = n;
    if (why === "join") {
      ring.clear();
      ringLo = n;
      evLater.length = 0;
      resetPrediction();
    } else predBase = -1; // rebuild the prediction from the corrected state
    snapAuth();
  }

  function ownKind(ev, lastBouncer) {
    if (PRED_TYPES.has(ev.type)) return ownIds.has(ev.playerId) ? ev.playerId : null;
    return ev.type === "pop" && lastBouncer != null ? lastBouncer : null; // the puff that bounce popped
  }

  function routeAuthEvents(evs, n) {
    let lastBouncer = null;
    for (const ev of evs) {
      if (!ev || !ev.type) continue;
      const pk = ownKind(ev, lastBouncer);
      lastBouncer = ev.type === "bounce" && ownIds.has(ev.playerId) ? ev.playerId : null;
      if (pk != null) {
        // the prediction plays these: drop the referee's copy if it already did
        let best = null;
        for (const m of predPlayed) {
          if (m.matched || m.type !== ev.type || m.pid !== pk || Math.abs(m.n - n) > MATCH_TICKS) continue;
          if (!best || Math.abs(m.n - n) < Math.abs(best.n - n)) best = m;
        }
        if (best) {
          best.matched = true;
          stats.dedupedEvents++;
        } else {
          evNow.push(ev); // the prediction missed it: play it now
          stats.lateOwnEvents++;
        }
      } else if (ownIds.has(ev.playerId) || ownIds.has(ev.otherId)) evNow.push(ev); // own players are drawn "now"
      else evLater.push({ n, ev });
    }
  }

  function predEvents(evs, n) {
    let lastBouncer = null;
    for (const ev of evs) {
      if (!ev || !ev.type) continue;
      const pk = ownKind(ev, lastBouncer);
      lastBouncer = ev.type === "bounce" && ownIds.has(ev.playerId) ? ev.playerId : null;
      if (pk == null) continue;
      evNow.push(ev);
      predPlayed.push({ type: ev.type, pid: pk, n, matched: false });
      stats.predictedEvents++;
    }
    while (predPlayed.length && predPlayed[0].n < n - 4 * MATCH_TICKS) predPlayed.shift();
  }

  // ── push: a referee tick ──
  const stash = new Map(); // ticks that came early (≤ REORDER ahead): applied in order once the hole fills
  function push(t, w, tArr, tLocal) {
    if (!t || !Number.isFinite(t.n)) return false;
    stats.received++;
    const n = t.n | 0;
    epochSample(n, w, t.e);
    lateSample(n, w, Number.isFinite(tArr) ? tArr : w, tLocal);
    if (auth.over) return false;
    if (!waitKf && n <= auth.n) return false; // a repeat / an older tick
    if (!waitKf && n > auth.n + 1 && n <= auth.n + REORDER) {
      stash.set(n, t); // early (reordered on the way?): wait a moment for the ones before it
      stats.reordered++;
      return true;
    }
    if (waitKf || n !== auth.n + 1) {
      // a gap (a late join, or more than REORDER missing): start again from the next keyframe
      if (!waitKf) {
        waitKf = true;
        stats.gaps++;
      }
      if (!t.kf) return false;
      if (t.feel && Sim.FEELS && Sim.FEELS[t.feel]) Sim.setFeel(t.feel);
      adopt(t.kf, n, "join");
      waitKf = false;
      lastIn = t.in || {};
      stats.joins++;
      stats.keyframes++;
      stats.authTick = n;
      if (t.over) markOver(n);
    } else applyNext(t);
    // anything stashed that now follows on
    for (let next = stash.get(auth.n + 1); next && !auth.over && !waitKf; next = stash.get(auth.n + 1)) {
      stash.delete(auth.n + 1);
      applyNext(next);
    }
    for (const k of stash.keys()) if (k <= auth.n || auth.over || waitKf) stash.delete(k);
    return true;
  }

  /** The tick right after auth.n: re-simulate it exactly as the referee did. */
  function applyNext(t) {
    const n = t.n | 0;
    if (t.feel && Sim.FEELS && Sim.FEELS[t.feel] && t.feel !== Sim.FEEL) Sim.setFeel(t.feel); // before stepping n
    const tin = t.in || {};
    const inputs = {};
    for (const p of auth.s.players) {
      if (!p.alive) continue;
      const rec = tin[p.playerId];
      if (rec) inputs[p.playerId] = { x: rec[0], bonk: rec[1] };
      else if (p.isBot) inputs[p.playerId] = aiInput(auth.s, p.playerId);
    }
    const evs = stepSim(auth.s, inputs) || [];
    auth.n = auth.s.tick | 0;
    lastIn = tin;
    stats.ticks++;
    stats.authTick = n;
    if (auth.n !== n || !!auth.s.finished !== !!t.over) {
      // diverged right here (the round ended on one side only): the keyframe fixes it, else wait for one
      stats.mismatches++;
      stats.lastMismatch = { n, path: auth.n !== n ? "tick" : "finished" };
      if (!t.kf) {
        auth.n = n;
        snapAuth();
        waitKf = true;
        return;
      }
      adopt(t.kf, n, "mismatch");
    } else {
      snapAuth();
      routeAuthEvents(evs, n);
      if (t.kf) {
        stats.keyframes++;
        const d = firstDiff(auth.s, t.kf);
        if (d) {
          stats.mismatches++;
          stats.lastMismatch = { n, path: d };
          adopt(t.kf, n, "mismatch");
        }
      }
    }
    if (t.over) markOver(n);
  }

  // ── input: an own player's phone (the same mapping as game.inputs on the boss) ──
  function input(playerId, inputs, tArr) {
    const id = Number(playerId);
    const l = local.get(id);
    if (!l || !inputs) return;
    stats.inputs++;
    const was = { x: l.x, bonk: l.bonk, latch: l.latch };
    const x = Number(inputs.a0);
    l.x = Number.isFinite(x) ? clamp(x, -1, 1) : 0;
    const bonk = inputs.b0 ? 1 : 0;
    const press = !!bonk && !l.bonk;
    if (press) l.latch = true; // a tap shorter than one tick still counts
    l.bonk = bonk;
    if (!pred || epoch == null || !Number.isFinite(tArr) || (was.x === l.x && was.bonk === l.bonk)) return;
    // The referee uses an input from its first step after it gets it, and it gets it about when this TV does
    // (phone → relay → each TV): steps it already made keep the old input, steps predicted past that take the
    // new one (then the drawn own player agrees with the referee's to the tick).
    const nb = Math.floor((tArr - epoch - phaseB) / TICK_MS); // the referee's newest step right now
    let oldLatch = was.latch;
    for (let k = pred.n + 1; k <= nb && k <= auth.n + MAX_LEAD; k++) {
      let lg = inLog.get(k);
      if (!lg) inLog.set(k, (lg = {}));
      if (lg[id]) continue;
      lg[id] = { x: was.x, bonk: was.bonk || oldLatch ? 1 : 0 }; // an earlier tap is used up here
      oldLatch = false;
    }
    if (was.latch && !oldLatch) l.latch = press;
    for (let k = Math.max(nb + 1, auth.n + 1); k <= pred.n; k++) {
      const lg = inLog.get(k);
      if (!lg || !lg[id]) continue;
      const tapHere = lg[id].bonk && !was.bonk; // an earlier tap was used up in this predicted tick: keep it
      lg[id] = { x: l.x, bonk: tapHere || l.bonk || l.latch ? 1 : 0 };
      l.latch = false;
      predBase = -1; // replay the prediction with it
    }
  }

  function takeLocal(id) {
    const l = local.get(id);
    const inp = { x: l.x, bonk: l.bonk || l.latch ? 1 : 0 };
    l.latch = false;
    return inp;
  }

  // ── records at a tick: the referee's history up to auth.n, the prediction after it ──
  function recAt(n) {
    if (n <= auth.n) return ring.get(Math.max(n, ringLo)) || ring.get(auth.n);
    return predHist.get(n) || (pred && predHist.get(pred.n)) || ring.get(auth.n); // past the prediction: its newest
  }

  /** One prediction step after another up to tick toN (own: the logged inputs, else the phone's now). */
  function step(toN) {
    const s = pred.s;
    while (pred.n < toN && !s.finished) {
      const n = pred.n + 1;
      let logged = inLog.get(n);
      const inputs = {};
      for (const p of s.players) {
        if (!p.alive) continue;
        const id = p.playerId;
        if (ownIds.has(id)) {
          let inp = logged && logged[id];
          if (!inp) {
            inp = takeLocal(id);
            if (!logged) inLog.set(n, (logged = {}));
            logged[id] = inp;
          }
          inputs[id] = inp;
        } else if (!p.isBot) {
          const r = lastIn[id];
          inputs[id] = r ? { x: r[0], bonk: r[1] } : { x: 0, bonk: 0 };
        } else inputs[id] = aiInput(s, id);
      }
      const evs = stepSim(s, inputs) || [];
      if ((s.tick | 0) !== n) break; // defensive
      pred.n = n;
      const byId = new Map();
      for (const p of s.players) if (ownIds.has(p.playerId)) byId.set(p.playerId, clone(p));
      predHist.set(n, { cam: s.cameraY, byId });
      if (n > predMax) {
        predMax = n;
        stats.newTicks++;
        predEvents(evs, n);
      } else stats.replayTicks++;
    }
  }

  /** Rebuild the prediction from the newest referee state when it moved, then run it out to tick F. */
  function predict(F) {
    const A = auth.n;
    if (!pred || predBase !== A) {
      const oldN = pred ? pred.n : null;
      const oldRec = oldN == null ? null : predHist.get(oldN) || ring.get(oldN); // as predicted before the news
      pred = { s: clone(auth.s), n: A };
      predBase = A;
      predHist = new Map();
      for (const k of inLog.keys()) if (k <= A) inLog.delete(k);
      stats.rebases++;
      if (oldN != null && oldN > A) step(oldN); // replay to the old frontier with the inputs as they were
      const newRec = oldRec ? recAt(oldN) : null;
      if (oldRec && newRec) {
        // the same tick, now with the referee's news: the difference goes into the eased visual offset
        for (const id of ownIds) {
          const b = oldRec.byId.get(id), a = newRec.byId.get(id);
          if (!a || !b || !a.alive || !b.alive) continue;
          const dx = wrapDelta(b.x - a.x), dy = b.y - a.y;
          const d = Math.hypot(dx, dy);
          if (d < 0.01) continue;
          const o = offset.get(id);
          o.x += dx;
          o.y += dy;
          if (d > 0.5) stats.corrections++;
          stats.lastCorrectionPx = Math.round(d * 10) / 10;
          if (d > stats.maxCorrectionPx) stats.maxCorrectionPx = stats.lastCorrectionPx;
        }
      }
    }
    if (F > pred.n) step(F);
    stats.predTick = pred.n;
  }

  /** Steer a timeline toward want: ±MAX_RATE around real time, a jump when further off than snap. */
  function steer(cur, want, dt, snap) {
    const d = dt / TICK_MS;
    const at = cur == null ? null : cur + d; // where real time alone takes it this frame
    if (at == null || !Number.isFinite(at) || Math.abs(want - at) > snap) return { v: want, snapped: cur != null };
    return { v: at + d * clamp((want - at) * GAIN, -MAX_RATE, MAX_RATE), snapped: false };
  }

  /** A player at fractional tick tau: x / y lerped (wrap-aware), everything else from the later tick. */
  function playerAt(id, tau) {
    const k = Math.floor(tau);
    const ra = recAt(k), rb = recAt(k + 1);
    const a = ra && ra.byId.get(id);
    const b = (rb && rb.byId.get(id)) || a;
    if (!a) return b ? Object.assign({}, b) : null;
    const f = clamp(tau - k, 0, 1);
    const out = Object.assign({}, b);
    out.x = wrapX(a.x + wrapDelta(b.x - a.x) * f);
    out.y = a.y + (b.y - a.y) * f;
    return out;
  }

  function camAt(tau) {
    const k = Math.floor(tau);
    const a = recAt(k) || ring.get(ringLo), b = recAt(k + 1) || a;
    return a ? a.cam + (b.cam - a.cam) * clamp(tau - k, 0, 1) : auth.s.cameraY;
  }

  function ownDrawn(id, tau) {
    const p = playerAt(id, tau);
    if (!p) return null;
    const o = offset.get(id);
    p.x = wrapX(p.x + o.x);
    p.y += o.y;
    return p;
  }

  function compose() {
    const base = ownIds.size && pred ? pred.s : auth.s;
    const comp = Object.assign({}, base); // clouds, jetpack items, … from the prediction (it is "now")
    comp.tick = ++drawTick; // a fresh tick per frame: the renderer then draws exactly these positions
    const tO = tauOth == null ? auth.n : tauOth;
    const tW = tauOwn == null ? auth.n : tauOwn;
    comp.cameraY = camAt(ownIds.size ? tW : tO);
    comp.finished = overShown;
    comp.placement = overShown && Array.isArray(auth.s.placement) ? auth.s.placement.slice() : null;
    comp.players = auth.s.players.map((ap) => {
      const id = ap.playerId;
      if (ownIds.has(id)) {
        if (!ap.alive) return Object.assign({}, ap); // out is the referee's word
        const p = ownDrawn(id, tW) || Object.assign({}, ap);
        p.alive = true;
        return p;
      }
      return playerAt(id, tO) || Object.assign({}, ap);
    });
    return comp;
  }

  function frame(tLocal, tBoss) {
    stats.frames++;
    const dt = lastLocal == null ? 0 : clamp(tLocal - lastLocal, 0, 250);
    lastLocal = tLocal;
    const A = auth.n;
    const out = { state: null, events: [], over: false };
    let snapFrom = null;

    if (!paused && epoch != null && !waitKf && !overShown) {
      const now = (tBoss - epoch) / TICK_MS; // the referee's tick right now (fractional)
      // own players: where the referee draws them right now (its renderer shows one tick behind its newest step)
      if (ownIds.size) {
        const cap = A + MAX_LEAD - 1; // a stalled referee: the prediction waits at the cap
        if (now - 1 > cap) stats.capped++;
        const r = steer(tauOwn, Math.min(now - 1, cap), dt, OWN_SNAP);
        if (r.snapped) {
          stats.ownSnaps++;
          snapFrom = new Map();
          for (const id of ownIds) {
            const p = ownDrawn(id, tauOwn);
            if (p) snapFrom.set(id, p);
          }
        }
        tauOwn = Math.min(r.v, cap);
      }
      // others: behind "now" by the recent arrival lateness (peak-held) + BUFFER_MS; once the referee
      // finished, just run out to its last tick
      const prevOth = tauOth;
      const want = auth.over ? auth.overN : now - ((latPeak == null ? 0 : latPeak) + BUFFER_MS) / TICK_MS;
      const r = steer(tauOth, want, dt, OTHERS_SNAP);
      if (r.snapped) stats.othersSnaps++;
      tauOth = r.v;
      if (tauOth > A) {
        tauOth = A; // ran dry: hold at the newest referee tick (never extrapolate)
        stats.othersDry++;
      }
      if (prevOth != null && tauOth < prevOth) tauOth = prevOth; // never backwards
      if (prevOth != null && dt > 0 && tauOth === prevOth && !auth.over) stats.othersHolds++;
      if (tauOth < ringLo) tauOth = ringLo;
    }

    // ease the own players' offsets out (before this frame's corrections join them)
    if (dt > 0) {
      for (const o of offset.values()) {
        const d = Math.hypot(o.x, o.y);
        if (d < 0.05) {
          o.x = o.y = 0;
          continue;
        }
        const k = Math.exp(-dt / (d > 3 * BODY ? EASE_FAST_MS : EASE_MS));
        o.x *= k;
        o.y *= k;
      }
    }

    if (ownIds.size && !waitKf) {
      const F = tauOwn == null ? A : Math.max(A, Math.floor(tauOwn) + 1);
      predict(Math.min(F, A + MAX_LEAD));
    }
    if (snapFrom) {
      // a jump of the own timeline (the referee paused / stalled): the drawn spot stays, then eases
      for (const [id, b] of snapFrom) {
        const a = playerAt(id, tauOwn);
        if (!a) continue;
        const o = offset.get(id);
        o.x = wrapDelta(b.x - a.x);
        o.y = b.y - a.y;
      }
    }

    // the referee finished: the over shows once the others' timeline gets there
    if (auth.over && !overShown && (tauOth == null || tauOth >= auth.overN || paused)) {
      overShown = true;
      tauOth = tauOwn = auth.overN;
      for (const o of offset.values()) o.x = o.y = 0; // the final frame is the referee's final state
      stats.over = true;
      out.over = true;
    }

    // events due now: own players' (as they come) + the others' (at their delayed time)
    out.events = evNow.splice(0);
    const due = overShown ? Infinity : tauOth == null ? -Infinity : tauOth + 1;
    while (evLater.length && evLater[0].n <= due) {
      const { n, ev } = evLater.shift();
      if (!overShown && due - n > STALE_TICKS && ev.type !== "out") stats.droppedEvents++;
      else out.events.push(ev);
    }

    out.state = compose();

    // numbers for QA
    stats.ownTick = tauOwn == null ? null : Math.round(tauOwn * 100) / 100;
    stats.othersTick = tauOth == null ? null : Math.round(tauOth * 100) / 100;
    if (tauOth != null && !overShown && !auth.over) {
      const buf = (A - tauOth) * TICK_MS;
      stats.othersBufferMs = Math.round(buf);
      bufSum += buf;
      bufN++;
      stats.othersBufferAvgMs = Math.round(bufSum / bufN);
      if (stats.othersBufferMinMs == null || buf < stats.othersBufferMinMs) stats.othersBufferMinMs = Math.round(buf);
    }
    if (pred && tauOwn != null && !overShown && !auth.over) {
      stats.leadTicks = pred.n - A;
      leadSum += stats.leadTicks;
      leadN++;
      stats.leadAvg = Math.round((leadSum / leadN) * 100) / 100;
    }
    let maxOff = 0;
    for (const o of offset.values()) maxOff = Math.max(maxOff, Math.hypot(o.x, o.y));
    stats.offsetPx = Math.round(maxOff * 10) / 10;
    return out;
  }

  function setPaused(on) {
    on = !!on;
    if (on === paused) return;
    paused = on;
    if (!on) {
      // the referee resumes on a later timeline: learn it again from its next ticks
      eWin.length = phaseWin.length = 0;
      epoch = wEpoch = bossE = latPeak = null;
      lastLocal = null;
    }
  }

  return {
    push, input, frame, setPaused, stats,
    get auth() { return auth; },
    get own() { return ownIds; },
    get over() { return overShown; },
    get taus() { return { own: tauOwn, others: tauOth, epoch, latPeak }; },
  };
}

// ── Screen: the live view (drawing, sound, HUD, its own animation frames) ───────

let active = null;

/** Stop the live view if one is running (a new play() / playMirror() on this page). */
export function stopMirror() {
  if (active) active.stop();
}

/** game.pause on a screen page: freeze / resume the live view. false when no view is running. */
export function pauseMirror(isPaused) {
  if (!active) return false;
  active.pause(isPaused);
  return true;
}

/**
 * game.playMirror(ctx) — see the file comment and MULTITV-SPEC.md ("Live view").
 * kit (from gc.game.js): { stage: {canvas, sfx}, pushPlayersHud, pushScreenPoints, resolveColors? }
 */
export function playMirror(ctx, kit) {
  const h = ctx && ctx.header;
  if (!h || h.v !== MIRROR_V || h.game !== "sky" || !h.state || !Array.isArray(h.players)) {
    throw new Error("[sky-scramble] playMirror: not a Sky v1 live header");
  }
  stopMirror();
  const prevFeel = Sim.FEEL;
  if (h.feel && Sim.FEELS && Sim.FEELS[h.feel] && typeof Sim.setFeel === "function") Sim.setFeel(h.feel);
  const core = createLiveCore({ header: h, own: ctx.own || [] });

  const colors = {};
  for (const p of h.players) {
    colors[p.playerId] = p.colors || (kit.resolveColors ? kit.resolveColors(ctx.gameProperties, p.color) : null) || { base: "#ffffff", light: "#ffffff", dark: "#888888" };
  }
  // the boss's look options (jetpack look, …); drawn characters come below, once their pictures are in
  const renderer = createRenderer(kit.stage.canvas, colors, Object.assign({}, h.opts || {}, { characters: {} }));
  if (!kit.stage.sfx) {
    try {
      kit.stage.sfx = createSfx();
    } catch (err) {
      report("createSfx failed", err);
    }
  }
  const sfx = kit.stage.sfx;
  const bossNow = () => {
    const v = ctx.clock && typeof ctx.clock.bossNow === "function" ? Number(ctx.clock.bossNow()) : NaN;
    return Number.isFinite(v) ? v : Date.now();
  };
  const hud = ctx.hud || { updatePlayers() {}, updateScreenPoints() {} };
  const hudR = { state: core.auth.s, hud, baseY: Math.min(...h.state.players.map((p) => p.y)), lastBonkTick: new Map(), lastHudKey: null };

  let raf = 0, stopped = false, errors = 0, last = null;
  const safe = (fn, label) => {
    try {
      return fn();
    } catch (err) {
      if (errors++ < 10) console.error(`[sky-scramble] multitv view: ${label} failed`, err);
      return undefined;
    }
  };

  // Drawn characters (Lakota: drawings and selfies on every TV). The shell passes the pictures this TV has — small
  // copies the main TV sent — as ctx.players[].character = { src, hitbox, img? }, like the main TV's play() gets
  // them. Each one is drawn once its image is in; the puffball until then, and for good if it never loads.
  // view.setCharacters({ [playerId]: character }) adds pictures that arrive during the round. The sizes come
  // from the referee's state (p.h), so this only changes how a player looks, never the game.
  const drawn = {}, loading = {};
  function wantCharacters(byPid) {
    for (const pid in byPid || {}) {
      const c = byPid[pid];
      if (!c || typeof c.src !== "string" || !c.src) continue;
      if ((drawn[pid] && drawn[pid].src === c.src) || loading[pid] === c.src) continue;
      loading[pid] = c.src;
      loadCharacterImage(c).then((img) => {
        if (loading[pid] === c.src) delete loading[pid];
        if (stopped || !img) return; // no picture: the puffball stays
        drawn[pid] = { img, hitbox: c.hitbox, src: c.src };
        safe(() => renderer.setCharacters(drawn), "renderer.setCharacters");
      });
    }
  }
  const startChars = {};
  for (const p of ctx.players || []) if (p && p.character && typeof p.playerId === "number") startChars[p.playerId] = p.character;
  wantCharacters(startChars);

  function draw(out) {
    if (sfx) for (const ev of out.events) safe(() => sfx.play(ev), "sfx.play");
    safe(() => renderer.draw(out.state, out.events, 1), "renderer.draw");
    hudR.state = out.state;
    safe(() => kit.pushPlayersHud(hudR), "pushPlayersHud");
    if (out.over) safe(() => hud.updateScreenPoints({ points: [] }), "hud.updateScreenPoints");
    else safe(() => kit.pushScreenPoints(hudR), "pushScreenPoints");
    if (globalThis.__MTV_TRACE === true) traceState(out.state);
  }

  function frame() {
    raf = 0;
    if (stopped) return;
    const out = safe(() => core.frame(performance.now(), bossNow()), "frame");
    if (out) {
      last = out.state;
      draw(out);
      if (out.over) {
        view.over = true; // hold the final frame (no more animation frames)
        return;
      }
    }
    raf = requestAnimationFrame(frame);
  }

  // a resize clears the canvas: redraw the held final frame
  const onResize = () => {
    if (!stopped && view.over && last) safe(() => renderer.draw(Object.assign({}, last, { tick: last.tick + 1 }), [], 1), "redraw");
  };
  window.addEventListener("resize", onResize);

  const view = {
    live: true,
    over: false,
    stats: core.stats,
    push(tick, w) {
      return stopped ? false : !!safe(() => core.push(tick, w, bossNow(), performance.now()), "push");
    },
    input(playerId, inputs) {
      if (!stopped) safe(() => core.input(playerId, inputs, bossNow()), "input");
    },
    pause(isPaused) {
      if (!stopped) core.setPaused(isPaused);
    },
    /** More pictures (playerId → { src, hitbox, img? }), e.g. one that reached this TV mid-round. */
    setCharacters(byPid) {
      if (!stopped) wantCharacters(byPid);
    },
    /** QA: the players drawn with their picture right now. */
    get drawnCharacters() {
      return Object.keys(drawn).map(Number);
    },
    stop() {
      if (stopped) return;
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      window.removeEventListener("resize", onResize);
      safe(() => hud.updateScreenPoints({ points: [] }), "hud.updateScreenPoints");
      if (prevFeel && prevFeel !== Sim.FEEL && typeof Sim.setFeel === "function") Sim.setFeel(prevFeel);
      if (active === view) active = null;
    },
  };
  if (ctx.isPaused) core.setPaused(true);
  active = view;
  globalThis.__skyMirror = { view, core }; // read-only peek for QA scripts
  // linked mid-round: the main TV's recent ticks (ctx.late = [[tick, w], …], from the last keyframe) go in before
  // the first frame, with no arrival time (a replay, not network lateness), so the start state never shows
  if (Array.isArray(ctx.late) && ctx.late.length) {
    for (const [t, w] of ctx.late) safe(() => core.push(t, w, undefined, performance.now()), "push");
    view.lateApplied = true;
  }
  // the start frame right away: the renderer's first (slow) draw happens before the referee's ticks flow
  const first = safe(() => core.frame(performance.now(), bossNow()), "frame");
  if (first) {
    last = first.state;
    draw(first);
  }
  raf = requestAnimationFrame(frame);
  return view;
}
