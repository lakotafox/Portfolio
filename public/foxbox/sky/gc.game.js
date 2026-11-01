/**
 * gc.game.js — Sky Scramble, the Gaming Couch game module.
 *
 * This file is only the glue between the Gaming Couch platform and the game:
 *   - lifecycle hooks (setup → play → inputs / pause → gameOver)
 *   - a fixed-step (1/60 s) simulation loop on requestAnimationFrame
 *   - controller inputs → sim inputs (a0 → x, b0 → bonk), bots via botInput()
 *   - the platform HUD: per-player standings (updatePlayers) and screen points
 *     (updateScreenPoints)
 *
 * The game itself lives in sibling modules:
 *   sim.js    — deterministic simulation + bot AI (no DOM)
 *   render.js — canvas drawing
 *   sfx.js    — synthesised sound effects
 *   character.js — drawn characters (party mode only, see below)
 *
 * Party mode extra (never sent by the Gaming Couch platform; everything works as before
 * without it): a play-context player may carry `character: { src, hitbox, img? }`. Then
 * play() loads those images first (it returns a Promise in that case, resolved once the
 * round is running), gives the player a taller body height from the drawing, and the
 * renderer draws the drawing instead of a puffball. A character that fails to load falls
 * back to the puffball.
 */

import { createSim, stepSim, botInput, TICK, PLAYER_R } from "./sim.js";
// Namespace import too, to read OPTIONAL exports (e.g. a bonk cooldown constant)
// without a link error when the sim does not export them.
import * as Sim from "./sim.js";
import { createRenderer, worldToNorm } from "./render.js";
import { createSfx } from "./sfx.js";
import { characterFit, loadCharacterImage } from "./character.js";
// Multi-TV (relay parties only): the referee's ticks for the other TVs, and the live view on those TVs.
import { bossTap, traceDrawn, playMirror as startLiveView, stopMirror, pauseMirror } from "./multitv.js";

// ── Tuning ──────────────────────────────────────────────────────────────────────

/** World units per metre for the HUD height readout (a puffball is ~68 units wide). */
const UNITS_PER_METRE =
  Number.isFinite(Sim.UNITS_PER_METRE) && Sim.UNITS_PER_METRE > 0 ? Sim.UNITS_PER_METRE : 50;

/** Never run more than this many sim steps in one animation frame (avoid death spirals). */
const MAX_STEPS_PER_FRAME = 5;

/** A frame gap longer than this (s) is treated as a stall (tab hidden etc.), not catch-up. */
const MAX_FRAME_GAP = 0.25;

/** Gap (world units) between the top of a puffball and its overhead HUD anchor. */
const OVERHEAD_GAP = 16;
/** …plus, while flying the propeller hat, its height (jetpack-look.js), so the name tag doesn't sit on the propeller. */
const JET_HAT_ROOM = 44;

/** Fallback bonk cooldown (ticks) when the sim neither exports one nor exposes it per player. */
const FALLBACK_BONK_COOLDOWN_TICKS = 90; // ~1.5 s

const VIEW_H = Number.isFinite(Sim.VIEW_H) ? Sim.VIEW_H : 1080;
const STEP = Number.isFinite(TICK) && TICK > 0 ? TICK : 1 / 60;

/** The sim's bonk cooldown in ticks, if it exports one under any sensible name. */
const BONK_COOLDOWN_TICKS = (() => {
  for (const name of ["BONK_COOLDOWN_TICKS", "BONK_COOLDOWN", "BONK_CD", "BONK_COOLDOWN_T"]) {
    const v = Sim[name];
    if (Number.isFinite(v) && v > 0) {
      // A value under ~10 is almost certainly seconds, not ticks.
      return v < 10 ? Math.round(v / STEP) : v;
    }
  }
  if (Number.isFinite(Sim.BONK_COOLDOWN_S) && Sim.BONK_COOLDOWN_S > 0) {
    return Math.round(Sim.BONK_COOLDOWN_S / STEP);
  }
  return FALLBACK_BONK_COOLDOWN_TICKS;
})();

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// ── Module state ────────────────────────────────────────────────────────────────

/**
 * Long-lived things created once in setup() and shared by every round:
 * the canvas, its resize listener, and the sound engine (one AudioContext for
 * the lifetime of the page — creating one per round would leak them).
 */
let stage = null;

/** Per-round state, built in play(). Replaced wholesale when a new round starts. */
let round = null;

/** The latest play() call; a round whose character images are still loading checks it's still current. */
let playToken = null;
/** pause() called while a round's character images were loading (null = not called). */
let pendingPause = null;

// ── Canvas sizing ───────────────────────────────────────────────────────────────

/** Size the canvas backing store to the window × devicePixelRatio, then tell the renderer. */
function resizeCanvas() {
  if (!stage) return;
  const { canvas } = stage;
  const dpr = window.devicePixelRatio || 1; // same rule as render.js resize()
  const w = Math.max(1, Math.round(window.innerWidth * dpr));
  const h = Math.max(1, Math.round(window.innerHeight * dpr));
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;

  // Resizing clears the canvas: let the renderer recompute its scale and redraw the
  // last frame right away (matters while paused or after the round ended).
  if (round && round.renderer) {
    safeCall(() => round.renderer.resize(), "renderer.resize");
    drawFrame(round, [], round.lastAlpha);
    if (!round.ended) pushScreenPoints(round);
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

let reportedErrors = 0;
/** Run a cosmetic call (render / sfx) so a bug there can never stop the round. */
function safeCall(fn, label) {
  try {
    return fn();
  } catch (err) {
    if (reportedErrors++ < 10) console.error(`[sky-scramble] ${label} failed`, err);
    return undefined;
  }
}

function drawFrame(r, events, alpha) {
  safeCall(() => r.renderer.draw(r.state, events, alpha), "renderer.draw");
}

/** Resolve the { base, light, dark } colour set for a PlayerColorKey. */
function resolveColors(gameProperties, colorKey) {
  const palette = gameProperties?.player?.color ?? {};
  const entry = palette[colorKey] ?? palette.white ?? {};
  const hex = entry.hex ?? {};
  return {
    base: hex.base ?? "#ffffff",
    light: hex.light ?? hex.base ?? "#ffffff",
    dark: hex.dark ?? hex.base ?? "#888888",
  };
}

/** Height in whole metres above the starting cloud. */
function heightMetres(r, p) {
  if (typeof Sim.heightMetres === "function") {
    const m = Sim.heightMetres(r.state, p);
    if (Number.isFinite(m)) return Math.max(0, Math.floor(m));
  }
  const best = Number.isFinite(p.bestY) ? p.bestY : p.y;
  return Math.max(0, Math.floor((best - r.baseY) / UNITS_PER_METRE));
}

/** Bonk readiness 0..100 (100 = ready to bonk again). */
function bonkReadiness(r, p) {
  if (typeof Sim.bonkReadiness === "function") {
    const v = Sim.bonkReadiness(p);
    if (Number.isFinite(v)) return Math.round(clamp(v, 0, 100));
  }
  // Prefer an explicit per-player cooldown counter if the sim exposes one.
  for (const key of ["bonkCooldown", "bonkCd", "cooldown", "bonkCooldownTicks"]) {
    const v = p[key];
    if (Number.isFinite(v)) {
      return Math.round(clamp(100 * (1 - v / BONK_COOLDOWN_TICKS), 0, 100));
    }
  }
  // Otherwise infer it from when we last saw this player start a bonk dive.
  const last = r.lastBonkTick.get(p.playerId);
  if (last == null) return 100;
  const since = r.state.tick - last;
  return Math.round(clamp((100 * since) / BONK_COOLDOWN_TICKS, 0, 100));
}

/**
 * Current standings, best → worst: alive players by height, then eliminated players
 * by elimination tick (later = better). Once the sim has a final placement, use it.
 */
function currentStanding(r) {
  const { state } = r;
  if (state.finished && Array.isArray(state.placement)) {
    const byId = new Map(state.players.map((p) => [p.playerId, p]));
    const ordered = state.placement.map((id) => byId.get(id)).filter(Boolean);
    // Defensive: append anyone the placement left out.
    for (const p of state.players) if (!ordered.includes(p)) ordered.push(p);
    return ordered;
  }
  if (typeof Sim.rankPlayers === "function") {
    const ids = Sim.rankPlayers(state);
    if (Array.isArray(ids) && ids.length === state.players.length) {
      const byId = new Map(state.players.map((p) => [p.playerId, p]));
      const ordered = ids.map((id) => byId.get(id));
      if (ordered.every(Boolean)) return ordered;
    }
  }
  const best = (p) => (Number.isFinite(p.bestY) ? p.bestY : p.y);
  return [...state.players].sort((a, b) => {
    if (a.alive !== b.alive) return a.alive ? -1 : 1;
    if (!a.alive) {
      const ta = a.eliminatedTick ?? -1;
      const tb = b.eliminatedTick ?? -1;
      if (ta !== tb) return tb - ta;
    }
    const d = best(b) - best(a);
    if (d !== 0) return d;
    return a.playerId - b.playerId;
  });
}

/** Push hud.updatePlayers, but only when something shown actually changed. */
function pushPlayersHud(r) {
  const players = currentStanding(r).map((p, placement) => ({
    playerId: p.playerId,
    placement,
    eliminated: !p.alive,
    value: `${heightMetres(r, p)} m`,
    // Quantised to 5 % steps: smooth enough for a bar, ~5× fewer HUD updates.
    meter: p.alive ? Math.round(bonkReadiness(r, p) / 5) * 5 : -1,
  }));
  const key = JSON.stringify(players);
  if (key === r.lastHudKey) return;
  r.lastHudKey = key;
  safeCall(() => r.hud.updatePlayers({ players }), "hud.updatePlayers");
}

/** Push hud.updateScreenPoints: overhead anchors + position trackers for alive players. */
function pushScreenPoints(r) {
  const top = r.state.cameraY + VIEW_H;
  const points = [];
  for (const p of r.state.players) {
    if (!p.alive) continue;
    const radius = Number.isFinite(p.r) ? p.r : PLAYER_R;
    // Body height feet → top of head: 2·r for a puffball, taller for a drawn character.
    const bodyH = Number.isFinite(p.h) && p.h > 0 ? p.h : radius * 2;
    const feet = p.y - radius;
    const head = worldToNorm(r.state, p.x, feet + bodyH + OVERHEAD_GAP + (p.jet > 0 && p.jetKind === "C" ? JET_HAT_ROOM : 0));
    const body = worldToNorm(r.state, p.x, feet + bodyH / 2);
    const aboveTop = feet > top; // entirely above the visible area
    points.push({
      type: "playerOverhead",
      playerId: p.playerId,
      x: clamp(head.x, 0, 1),
      y: clamp(head.y, 0, 1),
      isOffScreen: aboveTop || head.y > 1,
    });
    points.push({
      type: "playerPosition",
      playerId: p.playerId,
      x: clamp(body.x, 0, 1),
      y: clamp(body.y, 0, 1),
      isOffScreen: aboveTop || !!body.isOffScreen,
    });
  }
  safeCall(() => r.hud.updateScreenPoints({ points }), "hud.updateScreenPoints");
}

/** Build this tick's sim inputs: humans from their controller, bots from the AI. */
function gatherInputs(r) {
  const out = {};
  for (const p of r.state.players) {
    if (!p.alive) continue;
    const ctl = r.controls.get(p.playerId);
    const latched = ctl ? ctl.bonkLatch : false;
    if (ctl) ctl.bonkLatch = false;

    // A bot follows its AI unless something is actively driving it (the dev harness
    // can "grab" a bot from the keyboard; on the platform bots never get input).
    const grabbed = ctl && (ctl.x !== 0 || ctl.bonk || latched);
    if (p.isBot && !grabbed) {
      const ai = botInput(r.state, p.playerId) || {};
      out[p.playerId] = { x: clamp(Number(ai.x) || 0, -1, 1), bonk: ai.bonk ? 1 : 0 };
    } else if (ctl) {
      out[p.playerId] = { x: ctl.x, bonk: ctl.bonk || latched ? 1 : 0 };
    }
  }
  return out;
}

// ── The loop ────────────────────────────────────────────────────────────────────

function frame(r, now) {
  r.raf = null;
  if (round !== r || !r.running || r.ended) return;

  const t = now / 1000;
  let dt = r.lastTime == null ? 0 : t - r.lastTime;
  r.lastTime = t;
  if (!(dt >= 0) || dt > MAX_FRAME_GAP) dt = STEP; // stall / clock oddity → one step
  r.acc += dt;

  const events = [];
  let steps = 0;
  try {
    while (r.acc >= STEP && steps < MAX_STEPS_PER_FRAME && !r.state.finished) {
      const inputs = gatherInputs(r);
      const evs = stepSim(r.state, inputs) || [];
      if (r.tap) r.tap(inputs); // multi-TV: this tick for the other TVs (multitv.js; never throws)
      for (const ev of evs) {
        if (ev && ev.type === "bonk") r.lastBonkTick.set(ev.playerId, r.state.tick);
        if (ev && JET_PHASE[ev.type]) tellJet(r, ev); // jetpack sounds on the flyer's phone (below)
        events.push(ev);
      }
      r.acc -= STEP;
      steps++;
    }
  } catch (err) {
    // A sim error would repeat every frame — stop the loop loudly instead of spamming.
    console.error("[sky-scramble] stepSim failed; stopping the loop", err);
    stopLoop(r);
    return;
  }
  // Too far behind: drop the backlog rather than spiralling.
  if (steps === MAX_STEPS_PER_FRAME && r.acc >= STEP) r.acc = 0;

  const alpha = r.state.finished ? 1 : clamp(r.acc / STEP, 0, 1);
  r.lastAlpha = alpha;

  for (const ev of events) safeCall(() => r.sfx && r.sfx.play(ev), "sfx.play");
  drawFrame(r, events, alpha);
  if (globalThis.__MTV_TRACE === true) traceDrawn(r.state, alpha); // QA trace (multitv.js)
  pushPlayersHud(r);

  if (r.state.finished) {
    endRound(r);
    return;
  }
  pushScreenPoints(r);
  r.raf = requestAnimationFrame((ts) => frame(r, ts));
}

function startLoop(r) {
  if (!r || r.running || r.ended || r.paused) return;
  r.running = true;
  r.lastTime = null; // never catch up on time spent paused
  r.acc = 0;
  r.raf = requestAnimationFrame((ts) => frame(r, ts));
}

function stopLoop(r) {
  if (!r) return;
  r.running = false;
  if (r.raf != null) {
    cancelAnimationFrame(r.raf);
    r.raf = null;
  }
}

/** The round is over: report the placement exactly once and stop (last frame stays drawn). */
function endRound(r) {
  if (r.ended) return;
  r.ended = true;
  stopLoop(r);
  // Clear the overhead/position points so no nametag floats over the results.
  safeCall(() => r.hud.updateScreenPoints({ points: [] }), "hud.updateScreenPoints");

  let placement = Array.isArray(r.state.placement) ? [...r.state.placement] : [];
  // Defensive: gameOver must list every player exactly once.
  const ids = r.state.players.map((p) => p.playerId);
  placement = placement.filter((id, i) => ids.includes(id) && placement.indexOf(id) === i);
  for (const p of currentStanding(r)) if (!placement.includes(p.playerId)) placement.push(p.playerId);

  r.gameOver(placement);
}

// ── Gaming Couch module ─────────────────────────────────────────────────────────

// ── Feel presets: Sky plays FEEL_DEFAULT (Lakota's pick). ?feel=classic|floaty|doodle in the TV's URL tries
// another one and brings back the corner tag + the 1 / 2 / 3 keys for switching while testing.
const FEEL_DEFAULT = "doodle";
const FEEL_KEYS = { Digit1: "classic", Digit2: "floaty", Digit3: "doodle" };
function initFeel() {
  if (typeof Sim.setFeel !== "function" || !Sim.FEELS) return;
  let want = null;
  try {
    want = new URLSearchParams(location.search).get("feel");
  } catch {}
  Sim.setFeel(want && Sim.FEELS[want] ? want : FEEL_DEFAULT);
  if (!want) return; // no tag, no feel keys on a normal TV
  const tag = document.createElement("div");
  tag.id = "sky-feel";
  Object.assign(tag.style, {
    position: "fixed", left: "18px", bottom: "16px", zIndex: "60", pointerEvents: "none",
    font: "14px 'FoxBox Pixel', ui-monospace, monospace", color: "#ffffff", textShadow: "3px 3px 0 #0a1428",
    transition: "font-size 0.15s steps(3)",
  });
  document.body.appendChild(tag);
  const show = () => { tag.textContent = `FEEL: ${Sim.FEELS[Sim.FEEL].label}  (keys 1 2 3)`; };
  show();
  window.addEventListener("keydown", (e) => {
    const name = FEEL_KEYS[e.code];
    if (!name || e.repeat) return;
    Sim.setFeel(name);
    show();
    tag.style.fontSize = "30px";
    clearTimeout(tag.flash);
    tag.flash = setTimeout(() => (tag.style.fontSize = "14px"), 1400);
  });
}

// ── Jetpack power-ups: on unless the page URL says ?jetpack=0 (sim.js "Jetpack"). For trying them out:
// ?jetpack=often brings one every few seconds, ?jetitem=A|C|D makes every one that item (A tanks, C hat,
// D balloons; the old ?jetlook= works the same).
const URL_OPTS = (() => {
  try {
    const q = new URLSearchParams(location.search);
    const often = q.get("jetpack") === "often", item = q.get("jetitem") || q.get("jetlook");
    return { jetpack: q.get("jetpack") === "0" ? false : often || item ? { often, item } : true };
  } catch {
    return { jetpack: true };
  }
})();

// ── Jetpack sounds on the flyer's phone (party mode; Lakota, Oct 31: "the Jetpack sound should play per
// player's phone, not on the TV"). Each flight's phase goes to the host's phones.jet(playerId, info) right at
// the tick it happens: info = { kind, phase: "fly" | "warn" | "end", t: the tick the flight began (its id),
// left: seconds of flight to go }. The host puts it in that player's status; their phone plays the sounds.
// On the Gaming Couch platform there is no phones.jet: nothing happens.
const JET_PHASE = { jetGet: "fly", jetSputter: "warn", jetEnd: "end" };
function tellJet(r, ev) {
  const phones = r.phones;
  if (!phones || typeof phones.jet !== "function") return;
  const p = r.state.players.find((q) => q.playerId === ev.playerId);
  if (!p) return;
  const total = Number.isFinite(Sim.JET_TICKS) ? Sim.JET_TICKS : 300;
  const info = { kind: ev.kind, phase: JET_PHASE[ev.type], t: r.state.tick - (total - p.jet), left: Math.round(p.jet * STEP * 10) / 10 };
  safeCall(() => phones.jet(ev.playerId, info), "phones.jet");
}

export default {
  gameProtocolVersion: 1,
  gcGameModuleVersion: "0.1.0",

  /**
   * setup — configure the HUD and create the full-window canvas, then signal ready.
   * Only hud.setup() is legal here (updatePlayers / updateScreenPoints throw).
   */
  setup(setupContext) {
    // Single minigame build — gameModeId is ignored.
    setupContext.hud.setup({ players: { valueType: "text", meterType: "bar" } });

    if (!stage) {
      const canvas = document.createElement("canvas");
      canvas.id = "sky-scramble";
      Object.assign(canvas.style, {
        position: "fixed",
        inset: "0",
        width: "100%",
        height: "100%",
        display: "block",
        touchAction: "none",
      });
      document.body.appendChild(canvas);
      stage = { canvas, sfx: null };
      window.addEventListener("resize", resizeCanvas);
      initFeel();
    }
    resizeCanvas();

    setupContext.setupDone();
  },

  /**
   * play — start a round (also called again for a replay after gameOver: everything
   * per-round is rebuilt from scratch and any previous loop is stopped first).
   */
  play(playContext) {
    if (!stage) throw new Error("[sky-scramble] play() called before setup()");
    stopMirror(); // multi-TV: a live view of another TV's round gives way

    // Tear down any previous round (stops its loop; stale rAF callbacks see round !== r).
    if (round) {
      stopLoop(round);
      round.ended = true;
    }
    round = null;
    reportedErrors = 0;
    const token = (playToken = {});
    pendingPause = null;

    // Party mode: load drawn characters before the round starts so the first frame
    // already shows them. Without any (the platform), start right away as always.
    const wanted = (playContext.players || []).filter((p) => p && p.character && typeof p.character === "object");
    if (wanted.length === 0) {
      startRound(playContext, {});
      return undefined;
    }
    return Promise.all(
      wanted.map((p) =>
        loadCharacterImage(p.character).then((img) => {
          if (!img) console.warn(`[sky-scramble] character for player ${p.playerId} failed to load; using the puffball`);
          return [p.playerId, img];
        }),
      ),
    ).then((loaded) => {
      if (playToken !== token) return; // a newer play() took over while we were loading
      const chars = {};
      for (const [id, img] of loaded) {
        if (!img) continue;
        const pl = wanted.find((q) => q.playerId === id);
        const fit = characterFit(pl.character.hitbox, img.naturalWidth, img.naturalHeight);
        chars[id] = { img, hitbox: fit.hitbox, h: fit.h };
      }
      startRound(playContext, chars);
    });
  },

  /** inputs — latest controller state: a0 = stick x (−1..1), b0 = Bonk button. */
  inputs(playerId, inputs) {
    if (!round || round.ended || !inputs) return;
    const ctl = round.controls.get(playerId);
    if (!ctl) return;
    const x = Number(inputs.a0);
    ctl.x = Number.isFinite(x) ? clamp(x, -1, 1) : 0;
    const bonk = inputs.b0 ? 1 : 0;
    // Latch presses so a tap shorter than one sim tick still registers.
    if (bonk && !ctl.bonk) ctl.bonkLatch = true;
    ctl.bonk = bonk;
  },

  /** pause — stop / restart the loop. The platform draws its own pause UI. */
  pause(isPaused) {
    if (pauseMirror(isPaused)) return; // multi-TV: this page shows another TV's round live
    if (!round) {
      if (playToken) pendingPause = !!isPaused; // a round is still loading its characters
      return;
    }
    round.paused = !!isPaused;
    if (round.paused) stopLoop(round);
    else startLoop(round);
  },

  /** playMirror — multi-TV: show the main TV's round here, own players live (multitv.js, MULTITV-SPEC.md). */
  playMirror(ctx) {
    if (!stage) throw new Error("[sky-scramble] playMirror() called before setup()");
    if (round) {
      stopLoop(round);
      round.ended = true;
    }
    round = playToken = pendingPause = null;
    return startLiveView(ctx, { stage, pushPlayersHud, pushScreenPoints, resolveColors });
  },
};

/**
 * Build and start a round. chars: { [playerId]: { img, hitbox, h } } for players with a
 * loaded drawn character (empty on the platform).
 */
function startRound(playContext, chars) {
  const { players, seed, gameProperties, hud, gameOver } = playContext;

  const colors = {};
  for (const p of players) colors[p.playerId] = resolveColors(gameProperties, p.color);

  const state = createSim({
    players: players.map((p) => {
      const pl = { playerId: p.playerId, isBot: p.type === "bot" };
      if (chars[p.playerId]) pl.h = chars[p.playerId].h;
      if (p.startItem) pl.startJet = p.startItem; // party extension: the doodle vote's winner starts flying their pick
      return pl;
    }),
    seed: Number(seed) >>> 0,
    jetpack: URL_OPTS.jetpack,
  });

  const characters = {};
  for (const id in chars) characters[id] = { img: chars[id].img, hitbox: chars[id].hitbox };
  const renderer = createRenderer(stage.canvas, colors, { characters });
  if (!stage.sfx) stage.sfx = safeCall(() => createSfx(), "createSfx") || null;

  const r = {
    state,
    renderer,
    sfx: stage.sfx,
    phones: playContext.phones || null, // party mode: the host's phone channel (jetpack sounds, tellJet)
    hud,
    gameOver,
    // Height 0 m = where the lowest player starts.
    baseY: Math.min(...state.players.map((p) => p.y)),
    // playerId → { x, bonk, bonkLatch } from the controller (humans, or a grabbed bot).
    controls: new Map(players.map((p) => [p.playerId, { x: 0, bonk: 0, bonkLatch: false }])),
    lastBonkTick: new Map(),
    lastHudKey: null,
    lastAlpha: 0,
    acc: 0,
    lastTime: null,
    raf: null,
    running: false,
    paused: pendingPause != null ? pendingPause : !!playContext.isPaused,
    ended: false,
  };
  round = r;
  pendingPause = null;
  // read-only peek for QA scripts (the round's live sim state; nothing in the game reads it)
  globalThis.__skySim = { get state() { return round ? round.state : null; } };
  // multi-TV (relay parties only): the header for the other TVs now, then every tick (multitv.js)
  if (playContext.onMirrorHeader || playContext.onMirrorTick) r.tap = bossTap(playContext, r, URL_OPTS, colors);

  // Standings first, then size + draw the first frame (+ screen points) immediately,
  // so a paused start still shows the scene.
  pushPlayersHud(r);
  resizeCanvas();

  startLoop(r);
}
