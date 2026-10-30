// Backdrop: the little world behind the game. One starting scene (a town or some trees) sits
// under the starting cloud and scrolls away; above it, things float by in altitude bands
// (birds and kites, balloons and blimps, jets at sunset, satellites and UFOs in space).
//
// Each round rolls one version of every object from the round seed, so the TV and any
// re-render agree. Things are spaced ~22 m apart (a screen is 21.6 m tall), so there are
// only one or two on screen at a time. Everything is drawn live in the chunky pixel style
// (small offscreen canvas, palette-quantised, blown up without smoothing), re-rendered a
// few times a second for the little animations, and hazed toward the sky colour so it
// never reads as a cloud you can land on.
import * as A from './backdrop-art.js';

const VW = 1920, VH = 1080;
const M = 50; // world px per metre (the HUD's UNITS_PER_METRE)
const SCENE_K = 2.6; // scene units -> game px (a bit smaller than the picker board's 3.2, so it stays calm)
const THING_K = 2.9; // floating things (1.45 on the board)
const PIX = 8; // game px per chunky pixel (4 on the board)
const BASE_Y = 60; // world y of the street's ground line (the starting cloud's top is at 140)
const SCENE_PARALLAX = 0.75; // the street scrolls away a little slower than the clouds
const THING_PARALLAX = 0.85;
const SCENE_FPS = 8, THING_FPS = 12;
const HAZE_A = 0.28, SCENE_HAZE_A = 0.36, THING_ALPHA = 0.92;
const BANNER = 'GO GO GO!';

// Starting scenes and the street life that goes with each (one of the list per round).
const SCENES = [
  { id: 'brick', draw: A.cityBrick, life: ['cat'] },
  { id: 'downtown', draw: A.cityGlass, life: ['firetruck', 'icecream'] },
  { id: 'seaside', draw: A.citySeaside, life: ['bus'] },
  { id: 'park', draw: A.treesPark, life: ['icecream'] },
  { id: 'pines', draw: A.treesPines, life: [] },
  { id: 'blossom', draw: A.treesBlossom, life: [] },
];
// The starting cloud covers the middle of the street, so street life is shifted out to the
// right-hand side (dx, in scene widths) where you can see it.
const LIFE = {
  cat: { draw: (c, P, W, t) => A.streetCat(c, P, W, t, 0.86, 0.95), road: false, dx: 0 },
  firetruck: { draw: A.streetFireTruck, road: true, dx: 0.24 },
  icecream: { draw: A.streetVan, road: true, dx: 0.24 },
  bus: { draw: A.streetBus, road: true, dx: 0.4 },
};

// Things that float by: alt (m), x (0-1 across), vx (game px/s), s (size), versions to roll from.
const doubleRainbow = (c, P, t) => A.rainbowArc(c, P, t, true);
const LOW_MID_DUSK = [
  { id: 'birds', alt: 28, x: 0.72, vx: -32, s: 0.95, pool: [A.birdsSparrows] },
  { id: 'kites', alt: 50, x: 0.24, vx: 0, s: 0.9, pool: [A.kiteDiamond] },
  { id: 'drifters', alt: 72, x: 0.62, vx: 18, s: 0.95, pool: [A.drifterBalloon] },
  { id: 'balloon', alt: 94, x: 0.72, vx: 8, s: 1.0, pool: [A.balloonStriped, A.balloonPatch, A.balloonPair] },
  { id: 'blimp', alt: 116, x: 0.3, vx: 14, s: 1.0, pool: [A.blimpWhale, A.blimpClassic, A.blimpAirship] },
  { id: 'plane', alt: 138, x: 0.62, vx: -52, s: 0.95, pool: [A.bannerPlane, A.bannerSeaplane] },
  { id: 'copter', alt: 160, x: 0.2, vx: 22, s: 0.85, pool: [A.copterNews, A.copterRescue] },
  { id: 'jets', alt: 182, x: 0.5, vx: 68, s: 0.95, pool: [A.jetContrail, A.jetJumbo] },
  { id: 'flock', alt: 204, x: 0.3, vx: 24, s: 0.9, pool: [A.flockGeese, A.flockBats] },
  // the one big thing of the sunset stretch: nothing else within a screen of it
  { id: 'colours', alt: 234, x: 0.5, vx: 0, s: 1.5, pool: [doubleRainbow] },
];
const SPACE = [
  { id: 'sats', alt: 268, x: 0.76, vx: 10, s: 0.85, pool: [A.satDish, A.satBeeper, A.satCube] },
  { id: 'station', alt: 292, x: 0.34, vx: 8, s: 1.0, pool: [A.stationTruss, A.stationRing, A.stationTether] },
  { id: 'moon', alt: 316, x: 0.72, vx: 0, s: 1.0, pool: [A.moonSleepy, A.moonRinged, A.moonTiny] },
  { id: 'rocket', alt: 340, x: 0.24, vx: 0, s: 1.0, pool: [A.rocketClassic, A.rocketBox, A.rocketShuttle] },
  { id: 'ufo', alt: 364, x: 0.66, vx: -18, s: 0.95, pool: [A.ufoAlien, A.ufoCow, A.ufoDisco] },
  { id: 'stars', alt: 388, x: 0.42, vx: 0, s: 1.0, pool: [A.starsShooting, A.starsShower] },
];
const SPACE_REPEAT = 144; // metres: the space band repeats (re-rolled) for the rare very long round
const MAX_ALT = 3000;

// Local box every floating thing is drawn into (units, origin inside it).
const T_W = 420, T_H = 260, T_OX = 210, T_OY = 140;
// Street scene box: W wide (= VW / SCENE_K), ground line at S_GY.
const S_W = VW / SCENE_K, S_H = 240, S_GY = 232;

function hash01(a, b, c) {
  let h = (a ^ Math.imul(b + 0x9e3779b9, 0x85ebca6b) ^ Math.imul(c + 0x27d4eb2f, 0xc2b2ae35)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d); h = Math.imul(h ^ (h >>> 15), 0x846ca68b); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
const pick = (arr, u) => arr[Math.min(arr.length - 1, Math.floor(u * arr.length))];

/** The round's backdrop: which scene, which street life, and where each floating thing goes. */
export function rollBackdrop(seed) {
  seed = (Number(seed) >>> 0) || 1;
  const scene = pick(SCENES, hash01(seed, 1, 11));
  const life = scene.life.length ? LIFE[pick(scene.life, hash01(seed, 2, 12))] : null;
  const things = [];
  const place = (def, altM, k) => things.push({
    key: def.id + ':' + k,
    draw: pick(def.pool, hash01(seed, 100 + things.length, 13)),
    y: (altM + (hash01(seed, 200 + things.length, 14) - 0.5) * 6) * M,
    x: def.x + (hash01(seed, 300 + things.length, 15) - 0.5) * 0.3,
    vx: def.vx, s: def.s,
  });
  for (const d of LOW_MID_DUSK) place(d, d.alt, 0);
  for (let k = 0; ; k++) {
    if (SPACE[0].alt + k * SPACE_REPEAT > MAX_ALT) break;
    for (const d of SPACE) place(d, d.alt + k * SPACE_REPEAT, k);
  }
  return { seed, scene, life, things };
}

export function createBackdrop() {
  let roll = null;
  const layers = new Map(); // key -> { canvas, overlays, at, hazeKey }
  const pixel = A.STYLES.pixel;

  // Draws fn into a small offscreen layer (Wl x Hl units at k game px per unit), runs the
  // pixel pass and the haze, and keeps it until it's due for another animation frame.
  function layer(key, Wl, Hl, k, fps, time, haze, fn) {
    let L = layers.get(key);
    if (L && time - L.at < 1 / fps && L.haze === haze) return L;
    const w = Math.max(1, Math.round((Wl * k) / PIX)), h = Math.max(1, Math.round((Hl * k) / PIX));
    if (!L) { L = { canvas: document.createElement('canvas') }; layers.set(key, L); }
    const cv = L.canvas;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.setTransform(w / Wl, 0, 0, h / Hl, 0, 0);
    const P = A.painter(pixel, 7);
    P.base = g.getTransform();
    fn(g, P);
    g.setTransform(1, 0, 0, 1, 0, 0);
    const img = g.getImageData(0, 0, w, h), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 90) { d[i + 3] = 0; continue; }
      d[i + 3] = d[i + 3] > 200 ? 255 : 150;
      for (let c = 0; c < 3; c++) d[i + c] = Math.min(255, Math.round(d[i + c] / 34) * 34);
    }
    g.putImageData(img, 0, 0);
    if (haze) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = haze; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over'; }
    L.overlays = P.overlays; L.at = time; L.haze = haze;
    return L;
  }

  // ctx is in game units (1920 x 1080 box). Puts layer L with its top-left at (gx, gy).
  function blit(ctx, L, gx, gy, Wl, Hl, k, a) {
    ctx.save();
    ctx.translate(gx, gy); ctx.scale(k, k);
    ctx.globalAlpha = a; ctx.imageSmoothingEnabled = false;
    ctx.drawImage(L.canvas, 0, 0, Wl, Hl);
    ctx.imageSmoothingEnabled = true;
    for (const f of L.overlays) f(ctx);
    ctx.restore();
  }

  /**
   * Draw the backdrop for this frame. camY: camera world y (screen bottom); time: seconds;
   * skyMid: CSS colour of the sky's middle band (for the haze); seed: the round seed.
   */
  function draw(ctx, camY, time, skyMid, seed) {
    if (!roll || roll.seed !== ((Number(seed) >>> 0) || 1)) { roll = rollBackdrop(seed); layers.clear(); }
    const haze = hazeOf(skyMid), sceneHaze = withAlpha(skyMid, SCENE_HAZE_A);

    // ---- the street scene
    const groundY = VH - SCENE_PARALLAX * (BASE_Y - camY);
    if (groundY - S_GY * SCENE_K < VH && groundY > -40) {
      const { scene, life } = roll;
      const L = layer('scene', S_W, S_H, SCENE_K, SCENE_FPS, time, sceneHaze, (c, P) => A.at(c, 0, S_GY, 1, () => {
        scene.draw(c, P, S_W, time);
        if (life && life.road) A.pavement(c, P, S_W);
        if (life) A.at(c, life.dx * S_W, 0, 1, () => life.draw(c, P, S_W, time));
      }));
      blit(ctx, L, 0, groundY - S_GY * SCENE_K, S_W, S_H, SCENE_K, 1);
      if (groundY < VH) { ctx.fillStyle = groundColour(skyMid); ctx.fillRect(0, groundY, VW, VH - groundY + 2); }
    }

    // ---- things floating by
    for (const th of roll.things) {
      const k = THING_K * th.s;
      const cy = VH - THING_PARALLAX * (th.y - camY);
      if (cy + (T_H - T_OY) * k < 0 || cy - T_OY * k > VH) continue;
      const half = T_OX * k, span = VW + half * 2;
      const cx = ((((th.x * VW + th.vx * time) + half) % span) + span) % span - half;
      const L = layer(th.key, T_W, T_H, k, THING_FPS, time, haze, (c, P) => A.at(c, T_OX, T_OY, 1, () => th.draw(c, P, time, BANNER)));
      blit(ctx, L, cx - T_OX * k, cy - T_OY * k, T_W, T_H, k, THING_ALPHA);
    }
  }

  let hazeIn = null, hazeOut = null;
  function hazeOf(skyMid) {
    if (skyMid !== hazeIn) { hazeIn = skyMid; hazeOut = withAlpha(skyMid, HAZE_A); }
    return hazeOut;
  }

  return { draw, roll: () => roll };
}

function parseRgb(css) {
  const m = /rgba?\(([^)]+)\)/.exec(css || '');
  if (m) return m[1].split(',').slice(0, 3).map((v) => +v);
  if (css && css[0] === '#') { const h = css.slice(1); return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16)); }
  return [160, 200, 240];
}
function withAlpha(css, a) { const [r, g, b] = parseRgb(css); return `rgba(${r},${g},${b},${a})`; }
function groundColour(skyMid) {
  const s = parseRgb(skyMid), gr = [92, 184, 92];
  return `rgb(${gr.map((v, i) => Math.round(v + (s[i] - v) * 0.3)).join(',')})`;
}
