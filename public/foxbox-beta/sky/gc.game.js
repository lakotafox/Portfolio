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
    const head = worldToNorm(r.state, p.x, feet + bodyH + OVERHEAD_GAP);
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
      for (const ev of evs) {
        if (ev && ev.type === "bonk") r.lastBonkTick.set(ev.playerId, r.state.tick);
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
    if (!round) {
      if (playToken) pendingPause = !!isPaused; // a round is still loading its characters
      return;
    }
    round.paused = !!isPaused;
    if (round.paused) stopLoop(round);
    else startLoop(round);
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
      return pl;
    }),
    seed: Number(seed) >>> 0,
  });

  const characters = {};
  for (const id in chars) characters[id] = { img: chars[id].img, hitbox: chars[id].hitbox };
  const renderer = createRenderer(stage.canvas, colors, { characters });
  if (!stage.sfx) stage.sfx = safeCall(() => createSfx(), "createSfx") || null;

  const r = {
    state,
    renderer,
    sfx: stage.sfx,
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

  // Standings first, then size + draw the first frame (+ screen points) immediately,
  // so a paused start still shows the scene.
  pushPlayersHud(r);
  resizeCanvas();

  startLoop(r);
}
