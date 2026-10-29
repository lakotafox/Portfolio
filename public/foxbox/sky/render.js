// Sky Scramble — renderer (Art agent).
//
// Asset-driven: loads PNG/JPG art from build/assets/ (see ASSETS below) and falls
// back to simple procedural canvas drawing for anything missing, so the game always
// runs. Particles, trails, wrap ghosts, the out animation and squash & stretch are
// always procedural.
//
//   createRenderer(canvas, colors, opts?) -> { draw(state, events, alpha), resize(), assetsStatus(), setCharacters(map) }
//     opts.assets = false  → skip loading build/assets/ (pure procedural)
//     opts.now()           → custom clock in seconds (tests / headless capture)
//     opts.characters      → { [playerId]: { img, hitbox } } drawn characters (party mode): those players
//                            are drawn as their (loaded) image instead of a puffball, sized by
//                            characterFit() from character.js, feet on the hitbox's bottom-centre,
//                            outlined in their player colour. setCharacters(map) replaces the map.
//                            hitbox.ball = true: a round character — the image is clipped to the
//                            hitbox circle, which is drawn as the puffball (ring in the player colour).
//   worldToNorm(state, x, y) -> { x, y, isOffScreen }
//
// Coordinates: world units = 1920x1080 virtual screen pixels, y UP, state.cameraY is
// the world y of the screen's bottom edge, horizontal wrap at 1920.

import { characterFit } from './character.js';
import { PLAYER_R } from './sim.js';
import { createBackdrop } from './backdrop.js';

const VW = 1920, VH = 1080, TAU = Math.PI * 2;
const HUD_LEFT = 200, HUD_TOP = 90; // platform HUD lives here: keep calm

// ---------------------------------------------------------------------------
// ASSETS — every image the renderer can use. Tweak the metadata once real art lands.
//   file        : name inside build/assets/
//   char_*      : square images with the character centred, facing RIGHT.
//                 radiusFrac = body radius / image width (0.40 → body is 80% of width).
//                 cx, cy     = body centre as a fraction of the image.
//                 tint       = 'multiply' (grey art × player colour, alpha restored)
//                              | 'none'
//                 tintLift   = 0..1, re-adds some of the original light shading on top
//                              of the tint (keeps highlights white-ish).
//   plat_*      : top walkable surface at topFrac of the image height; the image spans
//                 the platform's full sim width (scaled with aspect kept, unless
//                 heightScale is set: multiplier on the aspect height).
//   bg_sky_*    : opaque 1920x1080 backdrops, cover-fit, crossfaded by altitude (SKY).
//   bg_far/near : 1920-wide transparent layers tiled in x and y. parallax = fraction of
//                 camera motion; driftX = horizontal drift in px/s; alpha = opacity.
// ---------------------------------------------------------------------------
export const ASSETS = {
  char_body: { file: 'char_body.png', radiusFrac: 0.40, cx: 0.5, cy: 0.5, tint: 'multiply', tintLift: 0.25 },
  char_face: { file: 'char_face.png' },
  char_face_out: { file: 'char_face_out.png' },
  char_out: { file: 'char_out.png' }, // whole knocked-out player, same framing as char_body; spun by drawOuts

  fx_bonk: { file: 'fx_bonk.png' }, // comic bursts, one per word (BONK! / BOP! / WHAM! / BONK!!)
  fx_bop: { file: 'fx_bop.png' },
  fx_wham: { file: 'fx_wham.png' },
  fx_bonk2: { file: 'fx_bonk2.png' },

  plat_cloud: { file: 'plat_cloud.png', topFrac: 0.30, heightScale: 1, pixelated: true },
  plat_puff: { file: 'plat_puff.png', topFrac: 0.30, heightScale: 1, pixelated: true },
  plat_drift: { file: 'plat_drift.png', topFrac: 0.30, heightScale: 1, pixelated: true },
  plat_spring: { file: 'plat_spring.png', topFrac: 93 / 170, heightScale: 1 }, // the coil stands above the cloud
  plat_spring_squashed: { file: 'plat_spring_squashed.png', topFrac: 93 / 170, heightScale: 1 },
  // coil only (200 x 90 units, foot 11 units under the cloud surface): drawn on a normal cloud
  // so spring clouds match the rest; preferred over plat_spring when present
  spring_coil: { file: 'spring_coil.png' },
  spring_coil_squashed: { file: 'spring_coil_squashed.png' },

  bg_sky_morning: { file: 'bg_sky_morning.jpg', pixelated: true }, // pixel-art skies: scale without smoothing
  bg_sky_sunset: { file: 'bg_sky_sunset.jpg' },
  bg_sky_night: { file: 'bg_sky_night.jpg' },

  bg_far: { file: 'bg_far.png', parallax: 0.18, driftX: 6, alpha: 0.35 },
  bg_near: { file: 'bg_near.png', parallax: 0.42, driftX: 14, alpha: 0.55 },
};

// Sky phase by altitude (camera y, world units): phase 0 = morning, 1 = sunset,
// 2 = night (procedural sky continues to a deeper night past 2). Piecewise linear.
// Tuned to the real sim with 8 bots: camera ≈ 5.5k @15 s, 11k @30 s, rounds end 15–21k.
export const SKY = {
  phases: [[0, 0], [2500, 0], [7500, 1], [8800, 1], [13000, 2], [22000, 2.6]],
  proceduralStars: false, // twinkling stars over the night sky; off: the pixel night sky has its own
};

const ASSET_BASE = new URL('./assets/', import.meta.url);
const imgRecs = {}; // shared by all renderers: key -> { img, ok, failed }
let assetVersion = 0;

function loadAssets() {
  for (const key in ASSETS) {
    if (imgRecs[key]) continue;
    const rec = (imgRecs[key] = { img: null, ok: false, failed: false });
    try {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => { rec.img = im; rec.ok = im.naturalWidth > 0; assetVersion++; };
      im.onerror = () => { rec.failed = true; };
      im.src = new URL(ASSETS[key].file, ASSET_BASE).href;
    } catch (e) {
      rec.failed = true;
    }
  }
}
const img = (key) => (imgRecs[key] && imgRecs[key].ok ? imgRecs[key].img : null);

// ---------------------------------------------------------------------------
// small utils
// ---------------------------------------------------------------------------
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const wrapX = (x) => ((x % VW) + VW) % VW;

function hexToRgb(h) {
  h = String(h || '#ffffff').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgbStr = (c, a = 1) =>
  a >= 1 ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mixRgb = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const lum = (c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;

// deterministic hash -> [0,1)
function hash(a, b = 0) {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

// Normalise a { base, light, dark } colour triple so every colour reads on TV
// (e.g. the 'white' palette entry has white as its dark colour).
function normColor(c) {
  c = c || {};
  const base = hexToRgb(c.base || '#cccccc');
  let light = hexToRgb(c.light || c.base || '#ffffff');
  let dark = hexToRgb(c.dark || '#333333');
  if (lum(dark) > 0.45) dark = mixRgb(base, [30, 34, 60], 0.72);
  if (lum(light) < lum(base)) light = mixRgb(base, [255, 255, 255], 0.6);
  return { base, light, dark, shade: mixRgb(base, dark, 0.35) };
}
const GREY = normColor({ base: '#a9aeb9', light: '#e4e7ec', dark: '#4b5060' });

// ---------------------------------------------------------------------------
// procedural sky (fallback, and source of letterbox / tint colours)
// ---------------------------------------------------------------------------
const SKY_KEYS = [
  { ph: 0.0, top: '#3d97e6', mid: '#7cc3f3', bot: '#d8f2ff', ct: '#ffffff', cb: '#d3e6fb' },
  { ph: 0.5, top: '#3a84d6', mid: '#93c6ec', bot: '#ffeec0', ct: '#fffaf0', cb: '#e9dccd' },
  { ph: 1.0, top: '#5658b0', mid: '#ec8a86', bot: '#ffc45c', ct: '#ffe0c4', cb: '#ee9a9c' },
  { ph: 1.5, top: '#1c2265', mid: '#5c3e8e', bot: '#de6c86', ct: '#c49bd0', cb: '#6a4b94' },
  { ph: 2.0, top: '#070b26', mid: '#111a4d', bot: '#2b2c6e', ct: '#3d4789', cb: '#1d2459' },
  { ph: 2.6, top: '#02030c', mid: '#080c2c', bot: '#161a4a', ct: '#2c3470', cb: '#141a46' },
].map((k) => ({
  ph: k.ph,
  top: hexToRgb(k.top), mid: hexToRgb(k.mid), bot: hexToRgb(k.bot),
  ct: hexToRgb(k.ct), cb: hexToRgb(k.cb),
}));

function phaseAt(alt) {
  const P = SKY.phases;
  if (alt <= P[0][0]) return P[0][1];
  for (let i = 1; i < P.length; i++) {
    if (alt <= P[i][0]) {
      const t = (alt - P[i - 1][0]) / (P[i][0] - P[i - 1][0]);
      return lerp(P[i - 1][1], P[i][1], smooth(t));
    }
  }
  return P[P.length - 1][1];
}
function skyAt(ph) {
  let a = SKY_KEYS[0], b = SKY_KEYS[0];
  for (let i = 0; i < SKY_KEYS.length; i++) {
    if (SKY_KEYS[i].ph <= ph) a = SKY_KEYS[i];
    if (SKY_KEYS[i].ph >= ph) { b = SKY_KEYS[i]; break; }
    b = SKY_KEYS[i];
  }
  const t = b.ph === a.ph ? 0 : (ph - a.ph) / (b.ph - a.ph);
  return {
    top: mixRgb(a.top, b.top, t), mid: mixRgb(a.mid, b.mid, t), bot: mixRgb(a.bot, b.bot, t),
    ct: mixRgb(a.ct, b.ct, t), cb: mixRgb(a.cb, b.cb, t),
  };
}

// ---------------------------------------------------------------------------
// procedural shapes
// ---------------------------------------------------------------------------
function puffPath(r) {
  // a round body with soft scalloped edge
  const p = new Path2D();
  const L = 12, N = 120;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * TAU;
    const rr = r - 1.2 + 2.4 * Math.sqrt(Math.abs(Math.sin((a * L) / 2)));
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
    i ? p.lineTo(x, y) : p.moveTo(x, y);
  }
  p.closePath();
  return p;
}

function starPath(g, R, inner = 0.48, pts = 5) {
  g.beginPath();
  for (let i = 0; i < pts * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / pts;
    const rr = i & 1 ? R * inner : R;
    i ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  g.closePath();
}

// lobed cloud: lobes = [{x,y,r}], drawn in sprite space (y down). cols {top, shade, outline|null, hi|null}
function drawLobes(g, lobes, cols, outlineW) {
  if (cols.outline) {
    g.fillStyle = cols.outline;
    for (const l of lobes) { g.beginPath(); g.arc(l.x, l.y, l.r + outlineW, 0, TAU); g.fill(); }
  }
  g.fillStyle = cols.shade;
  for (const l of lobes) { g.beginPath(); g.arc(l.x, l.y, l.r, 0, TAU); g.fill(); }
  g.fillStyle = cols.top;
  for (const l of lobes) { g.beginPath(); g.arc(l.x - l.r * 0.06, l.y - l.r * 0.22, l.r * 0.86, 0, TAU); g.fill(); }
  if (cols.hi) {
    g.fillStyle = cols.hi;
    for (const l of lobes) {
      if (l.y > 4) continue;
      g.beginPath();
      g.ellipse(l.x - l.r * 0.32, l.y - l.r * 0.5, l.r * 0.3, l.r * 0.16, -0.4, 0, TAU);
      g.fill();
    }
  }
}

function platformLobes(w, kind, seed) {
  const R = rng(seed * 9973 + w);
  const lobes = [];
  const small = kind === 'puff';
  const n = Math.max(3, Math.round(w / (small ? 30 : 38)));
  const span = w;
  const rTop = clamp((span / n) * 0.66, 13, small ? 20 : 27);
  // body/bottom lobes
  const nb = Math.max(2, n - 1);
  for (let i = 0; i < nb; i++) {
    const t = nb === 1 ? 0.5 : i / (nb - 1);
    const x = lerp(-span / 2 + rTop * 0.9, span / 2 - rTop * 0.9, t);
    lobes.push({ x, y: rTop * 0.55 + 6, r: rTop * (0.72 + R() * 0.15) });
  }
  // top lobes: tops poke ~8-12 px above the walkable surface (y = 0)
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const x = lerp(-span / 2 + rTop * 0.75, span / 2 - rTop * 0.75, t);
    const mid = 1 - Math.abs(t - 0.5) * 2; // bigger in the middle
    const r = rTop * (0.82 + 0.28 * mid + R() * 0.12);
    lobes.push({ x, y: r * 0.62 - 2, r });
  }
  return lobes;
}

const PLAT_COLS = {
  cloud: { top: '#ffffff', shade: '#cfdcf2', outline: '#7f95c4', hi: 'rgba(255,255,255,0.9)' },
  spring: { top: '#ffffff', shade: '#d6d9f2', outline: '#7f86c4', hi: 'rgba(255,255,255,0.9)' },
  drift: { top: '#e2f2ff', shade: '#9fc6f0', outline: '#4b82c8', hi: 'rgba(255,255,255,0.85)' },
  puff: { top: '#fbf1ff', shade: '#e2cdf3', outline: '#a98ad0', hi: 'rgba(255,255,255,0.8)' },
};

const RAINBOW = ['#ff5a6e', '#ff9f43', '#ffd93d', '#5ad66f', '#45b7ff', '#8c6bff'];

// ---------------------------------------------------------------------------
// HUD mapping (module level: uses the most recent renderer's viewport)
// ---------------------------------------------------------------------------
let view = null; // { ox, oy, scale, cw, ch }

export function worldToNorm(state, x, y) {
  const camY = state && typeof state.cameraY === 'number' ? state.cameraY : 0;
  const vx = wrapX(x);
  const vy = VH - (y - camY);
  const isOffScreen = vy < 0 || vy > VH;
  if (!view || !view.cw || !view.ch) {
    return { x: vx / VW, y: 1 - vy / VH, isOffScreen };
  }
  const px = view.ox + vx * view.scale;
  const py = view.oy + vy * view.scale;
  return { x: px / view.cw, y: 1 - py / view.ch, isOffScreen };
}

// ---------------------------------------------------------------------------
// renderer
// ---------------------------------------------------------------------------
export function createRenderer(canvas, colors, opts = {}) {
  const ctx = canvas.getContext('2d');
  if (opts.assets !== false) loadAssets();
  const backdrop = opts.backdrop === false ? null : createBackdrop();

  let dpr = 1, cw = 1, ch = 1, scale = 1, ox = 0, oy = 0, res = 1;
  let builtAssetVersion = -1;

  // caches (cleared on resize / asset load)
  let bodySprites = new Map(); // key -> {canvas, half, s}  (half = half size in virtual units)
  let faceSprites = {}; // 'face' | 'out' -> canvas
  let platSprites = new Map();
  let bgCloudSprites = new Map();
  let hillSprites = null;
  let starSprites = new Map();
  let dotSprite = null;
  let charSprites = new Map(); // playerId|res -> drawn-character sprite (or null)

  // drawn characters: playerId -> { img, hitbox }
  let chars = {};
  function setCharacters(map) {
    chars = {};
    for (const id in map || {}) {
      const c = map[id];
      const im = c && c.img;
      if (im && (im.naturalWidth || im.width) > 0) chars[id] = { img: im, hitbox: c.hitbox };
    }
    charSprites = new Map();
  }
  setCharacters(opts.characters);

  const playerCols = {};
  function colOf(id) {
    if (!playerCols[id]) {
      const c = colors && (colors[id] || colors[String(id)]);
      playerCols[id] = normColor(c);
    }
    return playerCols[id];
  }

  // ---- per-round render state ----
  let recs = new Map(); // playerId -> record
  let platFx = new Map(); // platformId -> { hit, spring }
  let parts = []; // particles
  let bursts = []; // comic bursts
  let outs = []; // eliminated players' fall animations (screen space)
  let shooting = null;
  let lastTick = -1, lastState = null;
  let camPrev = 0, camCur = 0;
  let time = 0, lastNow = 0;
  let shake = 0;

  function resetRound() {
    recs = new Map(); platFx = new Map(); parts = []; bursts = []; outs = [];
    lastTick = -1;
  }

  // ---------------------------------------------------------------- resize
  function resize() {
    dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    const cssW = canvas.clientWidth, cssH = canvas.clientHeight;
    if (cssW > 0 && cssH > 0) {
      const w = Math.round(cssW * dpr), h = Math.round(cssH * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        // an unstyled canvas's CSS size follows its attributes: pin it so it can't grow
        if (canvas.clientWidth !== cssW || canvas.clientHeight !== cssH) {
          canvas.style.width = cssW + 'px';
          canvas.style.height = cssH + 'px';
        }
      }
    }
    cw = canvas.width || 1; ch = canvas.height || 1;
    scale = Math.min(cw / VW, ch / VH);
    ox = (cw - VW * scale) / 2;
    oy = (ch - VH * scale) / 2;
    const newRes = clamp(Math.ceil(scale * 2) / 2, 1, 3);
    if (newRes !== res) { res = newRes; clearCaches(); }
    view = { ox, oy, scale, cw, ch };
  }

  function clearCaches() {
    bodySprites = new Map(); faceSprites = {}; platSprites = new Map();
    bgCloudSprites = new Map(); hillSprites = null; starSprites = new Map(); dotSprite = null;
    charSprites = new Map();
  }

  function checkSize() {
    const d = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    const w = Math.round(canvas.clientWidth * d), h = Math.round(canvas.clientHeight * d);
    if (d !== dpr || (w > 0 && h > 0 && (Math.abs(w - canvas.width) > 1 || Math.abs(h - canvas.height) > 1)) ||
        canvas.width !== cw || canvas.height !== ch) {
      resize();
    }
  }

  // ---------------------------------------------------------------- sprites
  // body sprite for a colour (procedural puffball or tinted char_body.png)
  function bodySprite(col, r, grey) {
    const key = (grey ? 'g' : rgbStr(col.base)) + '|' + r;
    let s = bodySprites.get(key);
    if (s) return s;
    const c = grey ? GREY : col;
    const im = img('char_body');
    if (im) {
      const meta = ASSETS.char_body;
      const vSize = r / meta.radiusFrac; // image width in virtual units
      const px = Math.ceil(vSize * res);
      const pxH = Math.ceil(px * im.naturalHeight / im.naturalWidth);
      const cv = makeCanvas(px, pxH);
      const g = cv.getContext('2d');
      g.imageSmoothingQuality = 'high';
      g.drawImage(im, 0, 0, px, pxH);
      if (meta.tint === 'multiply') {
        g.globalCompositeOperation = 'multiply';
        g.fillStyle = rgbStr(c.base);
        g.fillRect(0, 0, px, pxH);
        g.globalCompositeOperation = 'destination-in';
        g.drawImage(im, 0, 0, px, pxH);
        if (meta.tintLift > 0) {
          g.globalCompositeOperation = 'screen';
          g.globalAlpha = meta.tintLift;
          g.drawImage(im, 0, 0, px, pxH);
          g.globalCompositeOperation = 'destination-in';
          g.globalAlpha = 1;
          g.drawImage(im, 0, 0, px, pxH);
        }
        g.globalCompositeOperation = 'source-over';
      }
      s = { canvas: cv, w: vSize, h: vSize * pxH / px, ax: meta.cx, ay: meta.cy, img: true };
    } else {
      const pad = 10;
      const vSize = r * 2 + pad * 2;
      const px = Math.ceil(vSize * res);
      const cv = makeCanvas(px, px);
      const g = cv.getContext('2d');
      g.scale(px / vSize, px / vSize);
      g.translate(vSize / 2, vSize / 2);
      const path = puffPath(r);
      g.lineJoin = 'round';
      // sticker halo: reads on any sky
      g.strokeStyle = 'rgba(255,255,255,0.92)';
      g.lineWidth = 11;
      g.stroke(path);
      const grad = g.createRadialGradient(-r * 0.35, -r * 0.45, r * 0.08, -r * 0.1, -r * 0.1, r * 1.3);
      grad.addColorStop(0, rgbStr(c.light));
      grad.addColorStop(0.38, rgbStr(c.base));
      grad.addColorStop(1, rgbStr(c.shade));
      g.fillStyle = grad;
      g.fill(path);
      g.save();
      g.clip(path);
      g.fillStyle = rgbStr(c.dark, 0.16);
      g.beginPath(); g.ellipse(r * 0.2, r * 1.05, r * 1.15, r * 0.6, 0, 0, TAU); g.fill();
      g.restore();
      g.strokeStyle = rgbStr(c.dark);
      g.lineWidth = 4.5;
      g.stroke(path);
      // gloss
      g.fillStyle = 'rgba(255,255,255,0.78)';
      g.beginPath(); g.ellipse(-r * 0.4, -r * 0.52, r * 0.3, r * 0.15, -0.55, 0, TAU); g.fill();
      g.beginPath(); g.arc(-r * 0.7, -r * 0.18, r * 0.07, 0, TAU); g.fill();
      s = { canvas: cv, w: vSize, h: vSize, ax: 0.5, ay: 0.5, img: false };
    }
    bodySprites.set(key, s);
    return s;
  }

  // ---- drawn characters --------------------------------------------------------
  // Prerendered once per player per resolution: { n, g, w, h, ax, ay, bodyH, halfW }
  //   n = the drawing with a ring outline in the player colour (+ a thin dark edge so it reads on
  //       any sky), g = the same in greyscale (knocked out). w/h = canvas size in virtual units,
  //   (ax, ay) = the feet anchor (hitbox bottom-centre) inside it, bodyH = feet → head top.
  const CHAR_OUTLINE = 5; // virtual px: colour ring width around the drawing
  const CHAR_EDGE = 2.5; // virtual px: thin dark edge outside the colour ring

  // Downscale big drawings in halving steps (one big drawImage step aliases thin pen lines).
  function scaledArt(im, w, h) {
    w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
    let src = im, sw = im.naturalWidth || im.width, sh = im.naturalHeight || im.height;
    while (sw > w * 2 && sh > h * 2) {
      const nw = Math.ceil(sw / 2), nh = Math.ceil(sh / 2);
      const c = makeCanvas(nw, nh);
      const g = c.getContext('2d');
      g.imageSmoothingQuality = 'high';
      g.drawImage(src, 0, 0, nw, nh);
      src = c; sw = nw; sh = nh;
    }
    const out = makeCanvas(w, h);
    const g = out.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(src, 0, 0, w, h);
    return out;
  }
  function silhouette(art, color) {
    const c = makeCanvas(art.width, art.height);
    const g = c.getContext('2d');
    g.drawImage(art, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    return c;
  }
  function greyscaled(art) {
    const c = makeCanvas(art.width, art.height);
    const g = c.getContext('2d');
    g.drawImage(art, 0, 0);
    try {
      const d = g.getImageData(0, 0, c.width, c.height), a = d.data;
      for (let i = 0; i < a.length; i += 4) {
        const l = 0.2126 * a[i] + 0.7152 * a[i + 1] + 0.0722 * a[i + 2];
        const v = 60 + l * 0.68; // a washed-out grey: clearly "out"
        a[i] = a[i + 1] = a[i + 2] = v;
      }
      g.putImageData(d, 0, 0);
    } catch (e) {
      // tainted canvas (cross-origin image): desaturate with a blend mode instead
      g.globalCompositeOperation = 'saturation';
      g.fillStyle = '#808080';
      g.fillRect(0, 0, c.width, c.height);
      g.globalCompositeOperation = 'destination-in';
      g.drawImage(art, 0, 0);
    }
    return c;
  }
  function outlined(art, pad, ring, edge) {
    // the silhouette stamped in a ring of directions, then the drawing on top
    // (ring null: no outline at all, just the drawing padded)
    const c = makeCanvas(art.width + pad * 2, art.height + pad * 2);
    const g = c.getContext('2d');
    if (!ring) { g.drawImage(art, pad, pad); return c; }
    const stamp = (sil, rad, n) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        g.drawImage(sil, pad + Math.cos(a) * rad, pad + Math.sin(a) * rad);
      }
    };
    const oR = CHAR_OUTLINE * res, eR = (CHAR_OUTLINE + CHAR_EDGE) * res;
    const silE = silhouette(art, edge), silR = silhouette(art, ring);
    stamp(silE, eR, 14);
    stamp(silR, oR, 10);
    stamp(silR, oR * 0.5, 8); // fills the gaps between the outer stamps on thin strokes
    g.drawImage(art, pad, pad);
    return c;
  }
  // Ball mode: the image clipped to the hitbox circle on a white disc, a thin white sticker
  // ring inside the edge, then the player-colour ring and a thin dark edge around it.
  function ballArt(im, fit) {
    const R = fit.h / 2; // = PLAYER_R
    const D = Math.max(2, Math.round(2 * R * res));
    // crop the circle's square at up to 4× the target size, then downscale in steps
    const srcD = 2 * fit.rad;
    const cD = Math.max(D, Math.min(Math.ceil(srcD), D * 4));
    const crop = makeCanvas(cD, cD);
    const cg = crop.getContext('2d');
    cg.imageSmoothingQuality = 'high';
    const f = cD / srcD; // crop px per image px
    cg.drawImage(im, (-fit.cx + fit.rad) * f, (-fit.cy + fit.rad) * f, (im.naturalWidth || im.width) * f, (im.naturalHeight || im.height) * f);
    const art = scaledArt(crop, D, D);
    const g = art.getContext('2d');
    g.globalCompositeOperation = 'destination-over'; // white behind see-through parts of the photo
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, D, D);
    g.globalCompositeOperation = 'destination-in'; // clip to the circle
    g.beginPath(); g.arc(D / 2, D / 2, D / 2, 0, TAU); g.fill();
    g.globalCompositeOperation = 'source-over';
    return art;
  }
  function ballOutlined(art, pad, ring, edge) {
    const c = makeCanvas(art.width + pad * 2, art.height + pad * 2);
    const g = c.getContext('2d');
    const cx = c.width / 2, cy = c.height / 2, r = art.width / 2;
    g.fillStyle = edge;
    g.beginPath(); g.arc(cx, cy, r + (CHAR_OUTLINE + CHAR_EDGE) * res, 0, TAU); g.fill();
    g.fillStyle = ring;
    g.beginPath(); g.arc(cx, cy, r + CHAR_OUTLINE * res, 0, TAU); g.fill();
    g.drawImage(art, pad, pad);
    g.strokeStyle = 'rgba(255,255,255,0.9)';
    g.lineWidth = 2.5 * res;
    g.beginPath(); g.arc(cx, cy, r - 1.25 * res, 0, TAU); g.stroke();
    return c;
  }
  function charSprite(id) {
    const c = chars[id];
    if (!c) return null;
    const key = id + '|' + res;
    let s = charSprites.get(key);
    if (s !== undefined) return s;
    s = null;
    try {
      const im = c.img;
      const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
      const fit = characterFit(c.hitbox, iw, ih);
      if (fit.ball) {
        const art = ballArt(im, fit);
        const pad = Math.ceil((CHAR_OUTLINE + CHAR_EDGE + 1) * res);
        const col = colOf(id);
        const n = ballOutlined(art, pad, rgbStr(col.base), rgbStr(col.dark));
        const g = ballOutlined(greyscaled(art), pad, rgbStr(GREY.base), rgbStr(GREY.dark));
        const w = n.width / res, h = n.height / res;
        s = { n, g, w, h, ax: w / 2, ay: (pad + art.height) / res, bodyH: fit.h, halfW: w / 2, ball: true };
        charSprites.set(key, s);
        return s;
      }
      const px = fit.k * res; // canvas px per image px
      const art = scaledArt(im, iw * px, ih * px);
      const pad = Math.ceil((CHAR_OUTLINE + CHAR_EDGE + 1) * res);
      const col = colOf(id);
      // No colour outline on whole-body drawings: it buried thin pen lines. The player colour
      // shows as a coloured spot under their feet instead (drawFeetMark).
      const n = outlined(art, pad, null, null);
      const g = outlined(greyscaled(art), pad, null, null);
      const ax = (pad + fit.ax * px) / res, ay = (pad + fit.ay * px) / res;
      const w = n.width / res, h = n.height / res;
      s = { n, g, w, h, ax, ay, bodyH: fit.h, halfW: Math.max(ax, w - ax) };
    } catch (e) {
      s = null; // a broken image falls back to the puffball
    }
    charSprites.set(key, s);
    return s;
  }
  // Draw a character sprite with its feet at (fx, fy) in virtual screen space (y down).
  // o: { scX, scY, rot, facing, alpha }   variant: 'n' | 'g'
  // Player-colour spot under a drawn character's feet (their colour without covering the drawing).
  function drawFeetMark(id, s, fx, fy) {
    const col = colOf(id);
    const w = clamp(s.halfW * 0.85, 22, 60);
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = rgbStr(col.dark);
    ctx.beginPath(); ctx.ellipse(fx, fy + 1.5, w + 3, 10, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = rgbStr(col.base);
    ctx.beginPath(); ctx.ellipse(fx, fy, w, 7.5, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function drawChar(s, fx, fy, o, variant = 'n') {
    ctx.save();
    ctx.translate(fx, fy);
    if (o.rot) ctx.rotate(o.rot);
    ctx.scale(o.scX, o.scY);
    if ((o.facing || 1) < 0) ctx.scale(-1, 1); // drawings face right
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    ctx.drawImage(variant === 'g' ? s.g : s.n, -s.ax, -s.ay, s.w, s.h);
    ctx.restore();
  }

  function faceSprite(kind, r) {
    const key = kind + '|' + r;
    if (faceSprites[key] !== undefined) return faceSprites[key];
    const im = img(kind === 'out' ? 'char_face_out' : 'char_face');
    let out = null;
    if (im) {
      const vSize = r / ASSETS.char_body.radiusFrac;
      const px = Math.ceil(vSize * res);
      const pxH = Math.ceil(px * im.naturalHeight / im.naturalWidth);
      const cv = makeCanvas(px, pxH);
      const g = cv.getContext('2d');
      g.imageSmoothingQuality = 'high';
      g.drawImage(im, 0, 0, px, pxH);
      out = { canvas: cv, w: vSize, h: vSize * pxH / px };
    }
    faceSprites[key] = out;
    return out;
  }

  function platSprite(kind, w, variant, squashed) {
    const wq = Math.max(40, Math.round(w / 8) * 8);
    const key = kind + '|' + wq + '|' + variant + (squashed ? '|s' : '');
    let s = platSprites.get(key);
    if (s) return s;
    const aKey = squashed ? 'plat_spring_squashed' : 'plat_' + kind;
    const im = img(aKey) || (squashed ? img('plat_spring') : null);
    if (im) {
      const meta = ASSETS[aKey] || ASSETS.plat_spring;
      const vh = (wq * im.naturalHeight / im.naturalWidth) * (meta.heightScale || 1);
      const cv = makeCanvas(wq * res, vh * res);
      const g = cv.getContext('2d');
      if (meta.pixelated) g.imageSmoothingEnabled = false;
      else g.imageSmoothingQuality = 'high';
      g.drawImage(im, 0, 0, cv.width, cv.height);
      s = { canvas: cv, w: wq, h: vh, top: (meta.topFrac || 0.3) * vh, img: true };
    } else {
      const lobes = platformLobes(wq, kind, variant + 1);
      let minY = 0, maxY = 0;
      for (const l of lobes) { minY = Math.min(minY, l.y - l.r); maxY = Math.max(maxY, l.y + l.r); }
      const pad = 8;
      const vw = wq + pad * 2 + 24, vh = maxY - minY + pad * 2;
      const cv = makeCanvas(vw * res, vh * res);
      const g = cv.getContext('2d');
      g.scale(res, res);
      g.translate(vw / 2, -minY + pad);
      drawLobes(g, lobes, PLAT_COLS[kind] || PLAT_COLS.cloud, 3.5);
      if (kind === 'puff') {
        // a few tiny sparkle-dots: "this one is fragile"
        g.fillStyle = 'rgba(169,138,208,0.55)';
        for (let i = 0; i < 3; i++) {
          g.beginPath(); g.arc(-wq * 0.25 + i * wq * 0.25, 14, 2.6, 0, TAU); g.fill();
        }
      }
      s = { canvas: cv, w: vw, h: vh, top: -minY + pad, img: false };
    }
    platSprites.set(key, s);
    return s;
  }

  function bgCloudSprite(variant, tintKey, cols) {
    const key = variant + '|' + tintKey;
    let s = bgCloudSprites.get(key);
    if (s) return s;
    const R = rng(variant * 7919 + 13);
    const lobes = [];
    const n = 5 + Math.floor(R() * 4);
    const W = 300 + R() * 220;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const mid = 1 - Math.abs(t - 0.5) * 2;
      const r = 34 + mid * 46 + R() * 20;
      lobes.push({ x: lerp(-W / 2, W / 2, t), y: -r * 0.55 + 40, r });
    }
    for (let i = 0; i < n - 1; i++) lobes.push({ x: lerp(-W / 2, W / 2, (i + 0.5) / (n - 1)), y: 46, r: 30 });
    let minY = 0, maxY = 0, minX = 0, maxX = 0;
    for (const l of lobes) {
      minY = Math.min(minY, l.y - l.r); maxY = Math.max(maxY, l.y + l.r);
      minX = Math.min(minX, l.x - l.r); maxX = Math.max(maxX, l.x + l.r);
    }
    const r2 = Math.max(0.5, res * 0.6); // soft background: lower res is fine
    const vw = maxX - minX + 8, vh = maxY - minY + 8;
    const cv = makeCanvas(vw * r2, vh * r2);
    const g = cv.getContext('2d');
    g.scale(r2, r2);
    g.translate(-minX + 4, -minY + 4);
    drawLobes(g, lobes, { top: rgbStr(cols.ct), shade: rgbStr(cols.cb), outline: null, hi: null }, 0);
    s = { canvas: cv, w: vw, h: vh };
    bgCloudSprites.set(key, s);
    return s;
  }

  function buildHills() {
    // two strips of rolling hills, pre-rendered once (only seen near the ground)
    const H = 420;
    const mk = (seed, cols, base, amp, bushes) => {
      const cv = makeCanvas(VW * res, H * res);
      const g = cv.getContext('2d');
      g.scale(res, res);
      const R = rng(seed);
      const f1 = 1 + Math.floor(R() * 2), f2 = 3 + Math.floor(R() * 2), p1 = R() * TAU, p2 = R() * TAU;
      const yAt = (x) => base - amp * (0.6 * Math.sin((x / VW) * TAU * f1 + p1) + 0.4 * Math.sin((x / VW) * TAU * f2 + p2));
      g.beginPath();
      g.moveTo(0, H);
      for (let x = 0; x <= VW; x += 16) g.lineTo(x, yAt(x));
      g.lineTo(VW, H);
      g.closePath();
      const grad = g.createLinearGradient(0, base - amp, 0, H);
      grad.addColorStop(0, cols[0]);
      grad.addColorStop(1, cols[1]);
      g.fillStyle = grad;
      g.fill();
      g.lineWidth = 4;
      g.strokeStyle = cols[2];
      g.stroke();
      if (bushes) {
        for (let i = 0; i < 16; i++) {
          const x = R() * VW, y = yAt(x) + 6;
          const rr = 14 + R() * 16;
          g.fillStyle = cols[2];
          g.beginPath(); g.arc(x, y, rr + 3, 0, TAU); g.arc(x + rr * 0.9, y + 4, rr * 0.8 + 3, 0, TAU); g.fill();
          g.fillStyle = cols[3];
          g.beginPath(); g.arc(x, y, rr, 0, TAU); g.arc(x + rr * 0.9, y + 4, rr * 0.8, 0, TAU); g.fill();
          g.fillStyle = 'rgba(255,255,255,0.25)';
          g.beginPath(); g.arc(x - rr * 0.3, y - rr * 0.35, rr * 0.35, 0, TAU); g.fill();
        }
      }
      return cv;
    };
    hillSprites = {
      far: mk(11, ['#9fd6d0', '#b9e4e3', '#86c2c0'], 210, 70, false),
      near: mk(23, ['#7ccf74', '#5fb46a', '#4b9a59', '#6cc46b'], 260, 60, true),
      H,
    };
  }

  function starSprite(color) {
    let s = starSprites.get(color);
    if (s) return s;
    const R = 16;
    const cv = makeCanvas((R * 2 + 8) * res, (R * 2 + 8) * res);
    const g = cv.getContext('2d');
    g.scale(res, res);
    g.translate(R + 4, R + 4);
    g.lineJoin = 'round';
    starPath(g, R);
    g.fillStyle = color;
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = 'rgba(40,30,70,0.85)';
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.55)';
    g.beginPath(); g.arc(-R * 0.18, -R * 0.2, R * 0.2, 0, TAU); g.fill();
    s = { canvas: cv, size: R * 2 + 8 };
    starSprites.set(color, s);
    return s;
  }

  function getDot() {
    if (dotSprite) return dotSprite;
    const S = 24;
    const cv = makeCanvas(S * res, S * res);
    const g = cv.getContext('2d');
    g.scale(res, res);
    const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.18, 'rgba(255,255,240,0.95)');
    grad.addColorStop(0.45, 'rgba(220,230,255,0.25)');
    grad.addColorStop(1, 'rgba(220,230,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, S, S);
    dotSprite = { canvas: cv, size: S };
    return dotSprite;
  }

  // ---------------------------------------------------------------- particles
  // kinds: 0 dust, 1 star, 2 ring, 3 confetti(screen), 4 spark line
  function addPart(p) {
    if (parts.length > 700) parts.shift();
    p.t = 0;
    parts.push(p);
  }
  const R = Math.random; // visual-only randomness (the sim stays deterministic)

  function dust(x, y, n, col = '#ffffff', spread = 1) {
    for (let i = 0; i < n; i++) {
      const s = (i / (n - 1 || 1)) * 2 - 1;
      addPart({ k: 0, x: x + s * 26 * spread, y: y + R() * 4, vx: s * (120 + R() * 80) * spread, vy: 30 + R() * 60,
        g: -60, drag: 3.5, life: 0.35 + R() * 0.2, size: 9 + R() * 7, grow: 14, col });
    }
  }
  function stars(x, y, n, cols, speed = 380, up = 0) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + R() * 0.5;
      const sp = speed * (0.6 + R() * 0.6);
      addPart({ k: 1, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp + up, g: 700, drag: 1.6,
        life: 0.55 + R() * 0.35, size: 9 + R() * 8, rot: R() * TAU, vr: (R() - 0.5) * 10,
        col: cols[i % cols.length] });
    }
  }
  function ring(x, y, col, maxR = 70, life = 0.35, w = 5) {
    addPart({ k: 2, x, y, vx: 0, vy: 0, g: 0, drag: 0, life, size: maxR, col, lw: w });
  }
  function sparks(x, y, n, col, speed = 700, dirY = 1, spreadA = 0.6) {
    for (let i = 0; i < n; i++) {
      const a = Math.PI / 2 * dirY + (R() - 0.5) * spreadA * 2;
      const sp = speed * (0.6 + R() * 0.6);
      addPart({ k: 4, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 900, drag: 2,
        life: 0.3 + R() * 0.2, size: 4, col });
    }
  }
  function confetti(cols) {
    for (let i = 0; i < 160; i++) {
      addPart({ k: 3, x: HUD_LEFT + R() * (VW - HUD_LEFT), y: -20 - R() * 400, vx: (R() - 0.5) * 140,
        vy: 160 + R() * 220, g: 0, drag: 0, life: 3.2 + R() * 1.5, size: 8 + R() * 8,
        rot: R() * TAU, vr: (R() - 0.5) * 12, sway: R() * TAU, col: cols[i % cols.length] });
    }
  }

  function findPlatform(state, x, y, preferKind) {
    let best = null, bestD = 1e9;
    for (const p of state.platforms || []) {
      if (p.broken && preferKind !== 'puff') continue;
      let dx = Math.abs(wrapX(x) - wrapX(p.x));
      if (dx > VW / 2) dx = VW - dx;
      if (dx > p.w / 2 + 50) continue;
      const dy = Math.min(Math.abs(y - p.y), Math.abs(y - PLAYER_R - p.y));
      if (dy > 90) continue;
      const d = dy + (preferKind && p.kind === preferKind ? -40 : 0);
      if (d < bestD) { bestD = d; best = p; }
    }
    return best;
  }

  function handleEvents(state, events) {
    if (!events || !events.length) return;
    for (const ev of events) {
      if (!ev || !ev.type) continue;
      const x = ev.x || 0, y = ev.y || 0;
      const rec = ev.playerId != null ? recs.get(ev.playerId) : null;
      const col = ev.playerId != null ? colOf(ev.playerId) : GREY;
      switch (ev.type) {
        case 'bounce': {
          const p = findPlatform(state, x, y);
          const fy = p ? p.y : y - PLAYER_R;
          if (p) fxOf(p.id).hit = time;
          dust(x, fy + 2, 5, '#ffffff');
          if (ev.boost > 0.05) {
            // updraft-assisted bounce: a gust of air rising
            sparks(x, fy, 2 + Math.round(ev.boost * 5), 'rgba(255,255,255,0.8)', 500 + 400 * ev.boost, 1, 0.25);
          }
          break;
        }
        case 'springLoad': {
          const p = (state.platforms || []).find((q) => q.id === ev.platformId);
          if (p) fxOf(p.id).hit = time;
          dust(x, (p ? p.y : y) + 2, 6, '#ffffff');
          break;
        }
        case 'spring': {
          const p = findPlatform(state, x, y, 'spring');
          const fy = p ? p.y : y - PLAYER_R;
          if (p) { const f = fxOf(p.id); f.spring = time; f.hit = time; }
          sparks(x, fy + 20, 10, null, 900, 1, 0.35);
          stars(x, fy + 10, 6, RAINBOW, 320, 250);
          ring(x, fy, '#fff6b0', 90, 0.4, 6);
          break;
        }
        case 'pop': {
          const p = (state.platforms || []).find((q) => q.id === ev.platformId);
          const w = p ? p.w : 120;
          for (let i = 0; i < 12; i++) {
            const t = i / 11 - 0.5;
            addPart({ k: 0, x: x + t * w * 0.9, y: y - 8 + R() * 16, vx: t * 260 + (R() - 0.5) * 80,
              vy: 40 + R() * 160, g: 380, drag: 2.5, life: 0.45 + R() * 0.25, size: 12 + R() * 10, grow: 6,
              col: i & 1 ? '#fbf1ff' : '#e2cdf3' });
          }
          ring(x, y, '#e9d8ff', w * 0.55, 0.3, 4);
          break;
        }
        case 'bonk': {
          ring(x, y, rgbStr(col.light), 60, 0.25, 6);
          sparks(x, y + 20, 6, rgbStr(col.light), 500, 1, 0.5);
          if (rec) rec.diveFx = time;
          break;
        }
        case 'stomp': {
          const big = !!ev.bonk;
          stars(x, y, big ? 14 : 9, ['#ffe14d', '#ffffff', rgbStr(col.base)], big ? 620 : 460, 120);
          ring(x, y, '#ffffff', big ? 150 : 110, 0.35, 8);
          const words = ['BONK!', 'BONK!', 'BOP!', 'WHAM!'];
          // comic burst: at most 3 on screen, and never stacked on a fresh one
          const crowded = bursts.some((b) => time - b.t0 < 0.45 && Math.abs(b.x - x) < 260 && Math.abs(b.y - y) < 200);
          if (!crowded || big) {
            bursts.push({ x: x + (R() < 0.5 ? -1 : 1) * 70, y: y + 50, t0: time, text: big ? 'BONK!!' : words[(R() * words.length) | 0],
              rot: (R() - 0.5) * 0.35, seed: (R() * 1e6) | 0, col: rgbStr(col.base), size: big ? 1.15 : 0.85 });
            while (bursts.length > 3) bursts.shift();
          }
          const other = ev.otherId != null ? recs.get(ev.otherId) : null;
          if (other) other.dizzy = time;
          shake = Math.min(1, shake + (big ? 1 : 0.55));
          break;
        }
        case 'out':
          // the fall animation itself is started from the alive→false transition
          break;
        case 'finish': {
          const cols = Object.keys(playerCols).map((k) => rgbStr(playerCols[k].base));
          for (const p of state.players || []) cols.push(rgbStr(colOf(p.playerId).base));
          confetti(cols.length ? cols.concat(['#ffffff', '#ffe14d']) : RAINBOW);
          break;
        }
      }
    }
  }

  function fxOf(id) {
    let f = platFx.get(id);
    if (!f) { f = { hit: -9, spring: -9 }; platFx.set(id, f); }
    return f;
  }

  // ---------------------------------------------------------------- state sync
  function syncState(state) {
    const tick = state.tick | 0;
    if (state !== lastState && lastState && tick < lastTick) resetRound();
    if (lastState && tick < lastTick) resetRound();
    lastState = state;
    const dtTicks = lastTick < 0 ? 0 : tick - lastTick;
    if (dtTicks !== 0 || lastTick < 0) {
      camPrev = dtTicks === 1 ? camCur : state.cameraY;
      camCur = state.cameraY;
      for (const p of state.players || []) {
        let rec = recs.get(p.playerId);
        if (!rec) {
          rec = { px: p.x, py: p.y, cx: p.x, cy: p.y, vt: 0, dxt: 0, hist: [], wasAlive: p.alive,
            blinkAt: time + 1 + R() * 3, dizzy: -9, diveFx: -9, spin: 0 };
          recs.set(p.playerId, rec);
        }
        let dx = p.x - rec.cx;
        if (dx > VW / 2) dx -= VW; else if (dx < -VW / 2) dx += VW;
        const n = Math.max(1, dtTicks);
        rec.vt = (p.y - rec.cy) / n;
        rec.dxt = dx / n;
        if (dtTicks === 1) { rec.px = rec.cx; rec.py = rec.cy; } else { rec.px = p.x; rec.py = p.y; }
        rec.cx = p.x; rec.cy = p.y;
        if (rec.wasAlive && !p.alive) startOut(p, rec);
        rec.wasAlive = p.alive;
      }
      lastTick = tick;
    }
  }

  function startOut(p, rec) {
    const r = p.r || PLAYER_R;
    const cs = charSprite(p.playerId);
    if (cs) {
      // drawn character: the animation spins around the middle of the body
      const half = cs.bodyH / 2;
      const sy = VH - (p.y - r + half - camCur);
      outs.push({ id: p.playerId, x: wrapX(p.x), y: Math.min(sy, VH + half), vx: (R() - 0.5) * 160, vy: -1250,
        rot: 0, vr: (R() < 0.5 ? -1 : 1) * (5 + R() * 3), t: 0, r: Math.max(r, cs.h * 0.6), facing: p.facing || 1, cs, half });
    } else {
      const sy = VH - (p.y - camCur);
      outs.push({ id: p.playerId, x: wrapX(p.x), y: Math.min(sy, VH + r), vx: (R() - 0.5) * 160, vy: -1250,
        rot: 0, vr: (R() < 0.5 ? -1 : 1) * (7 + R() * 4), t: 0, r, facing: p.facing || 1 });
    }
    // a puff of grey at the screen bottom
    const wx = wrapX(p.x), wy = camCur + 10;
    for (let i = 0; i < 8; i++) {
      addPart({ k: 0, x: wx + (R() - 0.5) * 60, y: wy, vx: (R() - 0.5) * 300, vy: 120 + R() * 200, g: 300,
        drag: 2.5, life: 0.5 + R() * 0.3, size: 12 + R() * 10, grow: 10, col: '#c9cdd6' });
    }
  }

  // ---------------------------------------------------------------- drawing: background
  function drawSky(alt, ph, sk, extL, extR) {
    // procedural gradient always (fills letterbox, and shows through missing images)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const grad = ctx.createLinearGradient(0, oy, 0, oy + VH * scale);
    grad.addColorStop(0, rgbStr(sk.top));
    grad.addColorStop(0.55, rgbStr(sk.mid));
    grad.addColorStop(1, rgbStr(sk.bot));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);

    // image skies: crossfade morning→sunset→night by phase
    const names = ['bg_sky_morning', 'bg_sky_sunset', 'bg_sky_night'];
    const pc = clamp(ph, 0, 2);
    const i0 = Math.min(1, Math.floor(pc)), t = pc - i0;
    const A = img(names[i0]), B = img(names[i0 + 1]);
    const anyImg = !!(img(names[0]) || img(names[1]) || img(names[2]));
    const cover = (im, a) => {
      if (!im || a <= 0.003) return;
      const s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
      const w = im.naturalWidth * s, h = im.naturalHeight * s;
      ctx.globalAlpha = a;
      ctx.imageSmoothingEnabled = !ASSETS.bg_sky_morning.pixelated;
      ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
      ctx.imageSmoothingEnabled = true;
      ctx.globalAlpha = 1;
    };
    if (A && t < 0.999) cover(A, 1);
    if (B && t > 0.001) cover(B, t);
    if (!A && !B && anyImg) {
      // only some of the skies exist: use the nearest one we have
      cover(img(names[Math.round(pc)]), 1);
    }

    ctx.setTransform(scale, 0, 0, scale, ox, oy);
    const night = smooth(clamp((ph - 1.25) / 0.7, 0, 1));
    if (SKY.proceduralStars && night > 0.02) drawStars(alt, night, extL, extR);
    if (!anyImg) drawSunMoon(ph);
    if (night > 0.3) drawShootingStar(night);
  }

  function drawStars(alt, night, extL, extR) {
    const d = getDot();
    const tileH = 1500;
    const off = (alt * 0.04) % tileH;
    const N = 170;
    for (let i = 0; i < N; i++) {
      const hx = hash(i, 1), hy = hash(i, 2), hs = hash(i, 3);
      const x = lerp(extL, extR, hx);
      let y = hy * tileH + off;
      y = ((y % tileH) + tileH) % tileH - 100;
      if (y > VH + 20) continue;
      if (x < HUD_LEFT && y < 300 && hs < 0.6) continue; // fewer stars under the HUD
      const tw = 0.55 + 0.45 * Math.sin(time * (1.2 + hs * 2.5) + i * 1.7);
      const big = hs > 0.9;
      const sz = (big ? 22 : 8 + hs * 9) * (0.85 + 0.15 * tw);
      ctx.globalAlpha = night * (0.45 + 0.55 * tw) * (y > VH * 0.75 ? 0.6 : 1);
      ctx.drawImage(d.canvas, x - sz / 2, y - sz / 2, sz, sz);
      if (big) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - sz * 0.6, y - 0.75, sz * 1.2, 1.5);
        ctx.fillRect(x - 0.75, y - sz * 0.6, 1.5, sz * 1.2);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawShootingStar(night) {
    if (!shooting && R() < 0.004) {
      shooting = { x: 700 + R() * 1000, y: 120 + R() * 250, t: 0, dir: R() < 0.5 ? -1 : 1 };
    }
    if (!shooting) return;
    shooting.t += lastDt;
    const t = shooting.t / 0.7;
    if (t >= 1) { shooting = null; return; }
    const x = shooting.x + shooting.dir * t * 520, y = shooting.y + t * 220;
    const tail = 160;
    const g = ctx.createLinearGradient(x, y, x - shooting.dir * tail, y - tail * 0.42);
    g.addColorStop(0, `rgba(255,255,255,${0.9 * night * (1 - t)})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = g;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - shooting.dir * tail, y - tail * 0.42);
    ctx.stroke();
  }

  function drawSunMoon(ph) {
    // sun: high on the right in the morning, sinks and swells at sunset
    if (ph < 1.45) {
      const t = clamp(ph / 1.3, 0, 1);
      const x = lerp(1560, 1430, t), y = lerp(250, 1000, smooth(t));
      const rad = lerp(70, 120, t);
      const core = mixRgb([255, 247, 210], [255, 120, 70], smooth(t));
      const a = 1 - smooth(clamp((ph - 1.15) / 0.3, 0, 1));
      ctx.globalAlpha = a;
      const g = ctx.createRadialGradient(x, y, rad * 0.6, x, y, rad * 3.2);
      g.addColorStop(0, rgbStr(core, 0.55));
      g.addColorStop(1, rgbStr(core, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, rad * 3.2, 0, TAU); ctx.fill();
      const disc = ctx.createRadialGradient(x - rad * 0.25, y - rad * 0.3, rad * 0.1, x, y, rad);
      disc.addColorStop(0, rgbStr(mixRgb(core, [255, 255, 255], 0.55)));
      disc.addColorStop(1, rgbStr(core));
      ctx.fillStyle = disc;
      ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
    // moon: rises at night
    if (ph > 1.5) {
      const t = smooth(clamp((ph - 1.5) / 0.6, 0, 1));
      const x = 1580, y = lerp(700, 230, t), rad = 62;
      ctx.globalAlpha = t;
      const g = ctx.createRadialGradient(x, y, rad, x, y, rad * 3);
      g.addColorStop(0, 'rgba(220,230,255,0.28)');
      g.addColorStop(1, 'rgba(220,230,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, rad * 3, 0, TAU); ctx.fill();
      ctx.fillStyle = '#f6f1dc';
      ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(190,182,160,0.55)';
      for (const [cx, cy, cr] of [[-0.3, -0.2, 0.2], [0.25, 0.15, 0.14], [0.05, -0.42, 0.1], [-0.15, 0.4, 0.12], [0.45, -0.25, 0.08]]) {
        ctx.beginPath(); ctx.arc(x + cx * rad, y + cy * rad, cr * rad, 0, TAU); ctx.fill();
      }
      // terminator shading
      ctx.fillStyle = 'rgba(40,50,110,0.22)';
      ctx.beginPath(); ctx.arc(x, y, rad, -Math.PI / 2, Math.PI / 2); ctx.ellipse(x, y, rad * 0.5, rad, 0, Math.PI / 2, -Math.PI / 2, true); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawImageLayer(key, alt) {
    const im = img(key);
    const meta = ASSETS[key];
    if (!im) return false;
    const H = (im.naturalHeight * VW) / im.naturalWidth;
    const off = (((alt * meta.parallax) % H) + H) % H;
    const dx = (((time * (meta.driftX || 0)) % VW) + VW) % VW;
    ctx.globalAlpha = meta.alpha == null ? 1 : meta.alpha;
    for (let y = VH - H + off - H * Math.ceil((VH + H) / H); y < VH; y += H) {
      if (y + H < 0) continue;
      ctx.drawImage(im, dx, y, VW, H);
      if (dx > 0) ctx.drawImage(im, dx - VW, y, VW, H);
    }
    ctx.globalAlpha = 1;
    return true;
  }

  function drawCloudLayer(alt, sk, layer) {
    // procedural background clouds; layer 0 = far, 1 = near
    const p = layer ? 0.42 : 0.18;
    const cellH = layer ? 520 : 360;
    const base = alt * p;
    const tintKey = Math.round(phaseAt(alt) * 12);
    const cols = skyAt(tintKey / 12);
    const k0 = Math.floor((base - 300) / cellH), k1 = Math.floor((base + VH + 300) / cellH);
    const a = layer ? 0.5 : 0.36;
    for (let k = Math.max(2, k0); k <= k1; k++) {
      const hx = hash(k, 11 + layer), hy = hash(k, 21 + layer), hv = hash(k, 31 + layer);
      const sc = (layer ? 0.75 : 0.45) + hv * 0.35;
      const s = bgCloudSprite((hv * 6) | 0, tintKey + '|' + layer, cols);
      const ly = k * cellH + hy * cellH * 0.6;
      const y = VH - (ly - base);
      const span = VW + s.w * sc;
      let x = ((hx * span + time * (layer ? 9 : 4)) % span) - s.w * sc * 0.5;
      ctx.globalAlpha = a;
      ctx.drawImage(s.canvas, x - (s.w * sc) / 2, y - (s.h * sc) / 2, s.w * sc, s.h * sc);
    }
    ctx.globalAlpha = 1;
  }

  function drawHills(alt, which) {
    if (!hillSprites) buildHills();
    const p = which === 'far' ? 0.3 : 0.6;
    const shift = alt * p;
    const H = hillSprites.H;
    const y = VH - H + shift + (which === 'far' ? -40 : 30);
    if (y > VH) return;
    ctx.drawImage(hillSprites[which], 0, y, VW, H);
  }

  // ---------------------------------------------------------------- drawing: platforms
  function drawPlatforms(state, camY) {
    // springs someone is sitting on (loaded) stay squashed until the launch
    const loaded = new Set();
    for (const q of state.players || []) if (q.alive && q.springHold > 0) loaded.add(q.springY);
    for (const p of state.platforms || []) {
      if (p.broken) continue;
      const sy = VH - (p.y - camY);
      if (sy < -120 || sy > VH + 120) continue;
      const f = platFx.get(p.id);
      let dip = 0;
      if (f) {
        const t = time - f.hit;
        if (t >= 0 && t < 0.35) dip = Math.sin((t / 0.35) * Math.PI) * 7 * (1 - t / 0.35);
      }
      let springC = 0;
      if (p.kind === 'spring' && f) {
        const t = time - f.spring;
        if (t >= 0 && t < 0.7) {
          springC = t < 0.06 ? t / 0.06 : Math.exp(-(t - 0.06) * 7) * Math.cos((t - 0.06) * 24);
        }
      }
      if (p.kind === 'spring' && loaded.has(p.y)) springC = 1;
      drawPlatformAt(p, p.x, sy, dip, springC);
      // wrap copies if the platform pokes past an edge
      if (p.x - p.w / 2 < 0) drawPlatformAt(p, p.x + VW, sy, dip, springC);
      else if (p.x + p.w / 2 > VW) drawPlatformAt(p, p.x - VW, sy, dip, springC);
    }
  }

  function drawPlatformAt(p, x, sy, dip, springC) {
    const kind = PLAT_COLS[p.kind] ? p.kind : 'cloud';
    const variant = Math.abs(p.id | 0) % 3;
    const coil = kind === 'spring' ? img(springC > 0.35 ? 'spring_coil_squashed' : 'spring_coil') : null;
    const s = platSprite(coil ? 'cloud' : kind, p.w, variant, !coil && kind === 'spring' && springC > 0.35);
    let sx = 1, sY = 1, alpha = 1;
    if (kind === 'puff') {
      // wobbly and see-through
      const ph = (p.id | 0) * 1.3;
      sx = 1 + 0.035 * Math.sin(time * 5.2 + ph);
      sY = 1 + 0.06 * Math.sin(time * 6.1 + ph + 1);
      alpha = 0.72;
    }
    // image sprites span exactly the platform width; procedural ones carry 40 px of padding
    const k = p.w / (s.img ? s.w : s.w - 40);
    const w = s.w * k * sx;
    const h = s.h * k * sY;
    const top = s.top * k * sY;
    ctx.globalAlpha = alpha;
    ctx.drawImage(s.canvas, x - w / 2, sy - top + dip, w, h);
    ctx.globalAlpha = 1;
    if (kind === 'drift') {
      // speed streaks on the trailing side
      const dir = p.vx ? Math.sign(p.vx) : Math.sin(time * 0.8 + p.id) > 0 ? 1 : -1;
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      const bx = x - dir * (p.w / 2 + 14);
      for (let i = 0; i < 3; i++) {
        const yy = sy + 2 + i * 10 + dip;
        const len = 26 + 10 * Math.sin(time * 9 + i * 2 + p.id);
        ctx.beginPath(); ctx.moveTo(bx - dir * i * 4, yy); ctx.lineTo(bx - dir * (len + i * 4), yy); ctx.stroke();
      }
    }
    if (coil) {
      const k2 = clamp(p.w / 200, 0.8, 1.3);
      const shake = springC === 1 ? Math.sin(time * 70) * 1.5 : 0;
      ctx.drawImage(coil, x - 100 * k2 + shake, sy + dip - 75 * k2, 200 * k2, 90 * k2);
    } else if (kind === 'spring' && !s.img) drawSpring(x, sy + dip, springC);
  }

  function drawSpring(x, sy, c) {
    // coiled rainbow spring standing on the cloud's top (helix: back halves, then fronts)
    const H0 = 40;
    const h = H0 * (1 - 0.6 * clamp(c, -0.45, 1));
    const coils = 5, rx = 19, ry = 6;
    const baseY = sy + 2;
    const yOf = (i) => baseY - (i / (coils - 1)) * h;
    ctx.lineCap = 'round';
    // back halves
    for (let i = 0; i < coils; i++) {
      ctx.strokeStyle = '#3a2a6a';
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.ellipse(x, yOf(i), rx, ry, 0, Math.PI, TAU); ctx.stroke();
      ctx.strokeStyle = rgbStr(mixRgb(hexToRgb(RAINBOW[i % 6]), [40, 30, 90], 0.45));
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(x, yOf(i), rx, ry, 0, Math.PI, TAU); ctx.stroke();
    }
    // front halves
    for (let i = 0; i < coils; i++) {
      ctx.strokeStyle = '#3a2a6a';
      ctx.lineWidth = 9;
      ctx.beginPath(); ctx.ellipse(x, yOf(i), rx, ry, 0, 0, Math.PI); ctx.stroke();
      ctx.strokeStyle = RAINBOW[i % 6];
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.ellipse(x, yOf(i), rx, ry, 0, 0, Math.PI); ctx.stroke();
    }
    // pad
    const py = yOf(coils - 1) - 6;
    ctx.fillStyle = '#3a2a6a';
    roundRect(x - 29, py - 8, 58, 16, 8); ctx.fill();
    ctx.fillStyle = '#ff5a8a';
    roundRect(x - 26.5, py - 5.5, 53, 11, 5.5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    roundRect(x - 19, py - 4, 22, 3.5, 2); ctx.fill();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---------------------------------------------------------------- drawing: players
  // Draws one puffball centred at (sx, sy) in virtual screen space.
  function drawBall(col, r, sx, sy, o) {
    const grey = !!o.grey;
    const s = bodySprite(col, r, false);
    const sG = grey || o.greyMix > 0 ? bodySprite(col, r, true) : null;
    ctx.save();
    // anchor at the bottom of the ball so squash looks grounded
    ctx.translate(sx, sy + r);
    if (o.rot) ctx.rotate(o.rot);
    ctx.scale(o.scX, o.scY);
    ctx.translate(0, -r);
    const mirror = s.img && o.facing < 0;
    if (mirror) ctx.scale(-1, 1);
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    const dx = -s.w * s.ax, dy = -s.h * s.ay;
    if (!grey) ctx.drawImage(s.canvas, dx, dy, s.w, s.h);
    if (sG) {
      const a0 = ctx.globalAlpha;
      ctx.globalAlpha = a0 * (grey ? 1 : o.greyMix);
      ctx.drawImage(sG.canvas, dx, dy, s.w, s.h);
      ctx.globalAlpha = a0;
    }
    if (!o.noFace) {
      const mode = o.mode || 'normal';
      const faceImg = faceSprite(mode === 'out' || mode === 'dizzy' ? 'out' : 'face', r);
      if (s.img && faceImg) {
        ctx.drawImage(faceImg.canvas, dx, dy, faceImg.w, faceImg.h);
      } else {
        if (mirror) ctx.scale(-1, 1);
        drawFace(col, r, o.facing || 1, o.look || 0, mode, o.blink);
      }
    }
    ctx.restore();
  }

  function drawFace(col, r, facing, look, mode, blink) {
    const fx = facing * r * 0.2;
    const fy = -r * 0.1;
    const dark = rgbStr(grayIf(mode, col).dark);
    const eyes = [-1, 1];
    ctx.lineCap = 'round';
    for (const e of eyes) {
      const near = e === facing ? 1 : 0.86; // far eye a touch smaller
      const ex = fx + e * r * 0.32 * (e === facing ? 1 : 0.88);
      const ey = fy;
      const rx = r * 0.235 * near, ry = r * 0.3 * near;
      if (mode === 'out') {
        ctx.strokeStyle = dark; ctx.lineWidth = 4.5;
        const k = rx * 0.75;
        ctx.beginPath();
        ctx.moveTo(ex - k, ey - k); ctx.lineTo(ex + k, ey + k);
        ctx.moveTo(ex + k, ey - k); ctx.lineTo(ex - k, ey + k);
        ctx.stroke();
        continue;
      }
      if (mode === 'dizzy') {
        ctx.strokeStyle = dark; ctx.lineWidth = 3.2;
        ctx.beginPath();
        const rot = time * 9 * e;
        for (let i = 0; i <= 26; i++) {
          const a = rot + (i / 26) * TAU * 2;
          const rr = (i / 26) * rx;
          const px = ex + Math.cos(a) * rr, py = ey + Math.sin(a) * rr;
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.stroke();
        continue;
      }
      const squint = mode === 'dive' ? 0.62 : 1;
      const bl = blink ? 0.12 : 1;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = dark;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(ex, ey, rx, ry * squint * bl, 0, 0, TAU); ctx.fill(); ctx.stroke();
      if (!blink) {
        const px = ex + facing * rx * 0.32, py = ey + clamp(-look, -1, 1) * ry * 0.35 * squint;
        ctx.fillStyle = dark;
        ctx.beginPath(); ctx.arc(px, py, rx * 0.58, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(px - rx * 0.18, py - rx * 0.22, rx * 0.2, 0, TAU); ctx.fill();
      }
      if (mode === 'dive') {
        ctx.strokeStyle = dark; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(ex - rx * 1.05, ey - ry * 0.95 - (e === 1 ? 0 : 5));
        ctx.lineTo(ex + rx * 1.05, ey - ry * 0.95 - (e === 1 ? 5 : 0));
        ctx.stroke();
      }
    }
    // cheeks
    if (mode !== 'out') {
      ctx.fillStyle = 'rgba(255,110,140,0.32)';
      for (const e of eyes) {
        ctx.beginPath(); ctx.ellipse(fx + e * r * 0.5, fy + r * 0.32, r * 0.13, r * 0.08, 0, 0, TAU); ctx.fill();
      }
    }
    // mouth
    ctx.strokeStyle = dark;
    ctx.lineWidth = 3.2;
    const mx = fx * 1.1, my = fy + r * 0.36;
    ctx.beginPath();
    if (mode === 'out' || mode === 'dizzy') {
      ctx.ellipse(mx, my + 2, r * 0.09, r * 0.11, 0, 0, TAU);
      ctx.fillStyle = dark; ctx.fill();
    } else if (mode === 'dive') {
      ctx.moveTo(mx - r * 0.12, my + 2); ctx.lineTo(mx + r * 0.12, my);
      ctx.stroke();
    } else if (look > 0.5) {
      // big grin when launching up fast
      ctx.moveTo(mx - r * 0.16, my - 2);
      ctx.quadraticCurveTo(mx, my + r * 0.24, mx + r * 0.16, my - 2);
      ctx.closePath();
      ctx.fillStyle = dark; ctx.fill();
    } else {
      ctx.arc(mx, my - r * 0.06, r * 0.13, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    }
  }
  const grayIf = (mode, col) => (mode === 'out' ? GREY : col);

  function drawPlayers(state, camY, alpha) {
    const players = state.players || [];
    // trails first (under everyone)
    for (const p of players) {
      if (!p.alive) continue;
      const rec = recs.get(p.playerId);
      if (!rec || rec.hist.length < 2 || !(p.bonkTicks > 0)) continue;
      const col = colOf(p.playerId);
      const r = p.r || PLAYER_R;
      const cs = charSprite(p.playerId);
      if (cs) {
        // drawn character: shrinking ghosts scaled around the middle of the body
        for (let i = 0; i < rec.hist.length - 1; i++) {
          const h = rec.hist[i];
          const k = (i + 1) / rec.hist.length;
          const feetY = VH - (h.y - r - camY);
          const sc = 0.45 + 0.45 * k;
          ctx.save();
          ctx.globalAlpha = 0.32 * k;
          ctx.translate(0, feetY - cs.bodyH / 2);
          drawChar(cs, h.x, cs.bodyH / 2 * sc, { scX: sc, scY: sc, facing: p.facing });
          ctx.restore();
        }
        ctx.globalAlpha = 1;
        continue;
      }
      const s = bodySprite(col, r, false);
      for (let i = 0; i < rec.hist.length - 1; i++) {
        const h = rec.hist[i];
        const k = (i + 1) / rec.hist.length;
        const sy = VH - (h.y - camY);
        const sc = 0.45 + 0.45 * k;
        ctx.globalAlpha = 0.32 * k;
        const w = s.w * sc, hh = s.h * sc;
        ctx.drawImage(s.canvas, h.x - w * s.ax, sy - hh * s.ay, w, hh);
      }
      ctx.globalAlpha = 1;
    }

    for (const p of players) {
      if (!p.alive) continue;
      const rec = recs.get(p.playerId);
      const col = colOf(p.playerId);
      const r = p.r || PLAYER_R;
      let x = p.x, y = p.y;
      if (rec) {
        let dx = rec.cx - rec.px;
        if (dx > VW / 2) dx -= VW; else if (dx < -VW / 2) dx += VW;
        x = rec.px + dx * alpha;
        y = rec.py + (rec.cy - rec.py) * alpha;
      }
      x = wrapX(x);
      const sy = VH - (y - camY);
      const bodyH = p.h > 0 ? p.h : r * 2;
      const cs = charSprite(p.playerId);
      if (cs) {
        // drawn character: feet at (x, sy + r), head top bodyH above
        const feetY = sy + r;
        if (feetY < -40 || feetY - cs.h > VH + 40) continue;
        const o = playerLook(p, rec);
        if (!cs.ball) o.rot *= 0.6; // a tall body leans less
        if (o.mode === 'dizzy') o.rot += Math.sin(time * 15) * 0.14; // wobble while dazed
        if (!cs.ball) drawFeetMark(p.playerId, cs, x, feetY);
        drawChar(cs, x, feetY, o);
        const m = cs.halfW + 14;
        if (x < m) drawChar(cs, x + VW, feetY, o);
        else if (x > VW - m) drawChar(cs, x - VW, feetY, o);
        if (o.mode === 'dizzy') drawDizzyStars(x, feetY - bodyH - 10, r);
        continue;
      }
      if (sy < -r * 3 || sy > VH + r * 3) continue;
      const o = playerLook(p, rec);
      drawBall(col, r, x, sy, o);
      // wrap ghost
      const m = r + 14;
      if (x < m) drawBall(col, r, x + VW, sy, o);
      else if (x > VW - m) drawBall(col, r, x - VW, sy, o);
      if (o.mode === 'dizzy') drawDizzyStars(x, sy - r - 10, r);
    }
  }

  function playerLook(p, rec) {
    const vt = rec ? rec.vt : 0;
    const st = clamp(Math.abs(vt) / 18, 0, 1);
    const sq = clamp(p.squash || 0, 0, 1);
    let scX = (1 + 0.34 * sq) * (1 - 0.08 * st);
    let scY = (1 - 0.3 * sq) * (1 + 0.12 * st);
    let mode = 'normal';
    if (p.bonkTicks > 0) { mode = 'dive'; scX *= 0.9; scY *= 1.12; }
    if (typeof p.dazedTicks === 'number' ? p.dazedTicks > 0 : rec && time - rec.dizzy < 1.1) mode = 'dizzy';
    let blink = false;
    if (rec) {
      if (time > rec.blinkAt + 0.13) rec.blinkAt = time + 2 + R() * 3.5;
      blink = time > rec.blinkAt && mode === 'normal';
    }
    const rot = rec ? clamp(rec.dxt * 0.025, -0.25, 0.25) : 0;
    // post-stomp immunity (sim extra): flicker
    const alpha = p.stompSafeTicks > 0 && ((p.stompSafeTicks >> 2) & 1) ? 0.55 : 1;
    return { scX, scY, rot, facing: p.facing || 1, mode, blink, look: clamp(vt / 12, -1, 1), greyMix: 0, alpha };
  }

  function drawDizzyStars(x, y, r) {
    const s = starSprite('#ffe14d');
    for (let i = 0; i < 3; i++) {
      const a = time * 6 + (i * TAU) / 3;
      const px = x + Math.cos(a) * r * 0.9, py = y + Math.sin(a) * r * 0.25;
      const sz = 16;
      ctx.drawImage(s.canvas, px - sz / 2, py - sz / 2, sz, sz);
    }
  }

  function drawOuts(dt) {
    for (let i = outs.length - 1; i >= 0; i--) {
      const o = outs[i];
      o.t += dt;
      o.vy += 2600 * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.rot += o.vr * dt;
      if (o.t > 0.3 && o.y > VH + o.r * 2) { outs.splice(i, 1); continue; }
      const col = colOf(o.id);
      const gm = clamp(o.t / 0.35, 0, 1);
      if (o.cs) {
        // drawn character: colour fades to the greyscale prerender while it spins and falls
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.rotate(o.rot);
        const lk = { scX: 1, scY: 1, facing: o.facing };
        if (gm < 1) { ctx.globalAlpha = 1 - gm; drawChar(o.cs, 0, o.half, lk, 'n'); }
        ctx.globalAlpha = gm;
        drawChar(o.cs, 0, o.half, lk, 'g');
        ctx.restore();
        ctx.globalAlpha = 1;
        continue;
      }
      const look = { scX: 1, scY: 1, rot: o.rot, facing: o.facing, mode: 'out', greyMix: gm };
      // rotate around the centre rather than the base
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.rot);
      look.rot = 0;
      const outImg = img('char_out');
      if (outImg) {
        // fade from the player's own look to the knocked-out sprite over the first moment
        if (gm < 1) { ctx.globalAlpha = 1 - gm; drawBall(col, o.r, 0, 0, { ...look, mode: 'dizzy', greyMix: 0 }); ctx.globalAlpha = 1; }
        const size = o.r / ASSETS.char_body.radiusFrac;
        ctx.globalAlpha = gm;
        ctx.drawImage(outImg, -size / 2, -size / 2, size, size * outImg.naturalHeight / outImg.naturalWidth);
        ctx.globalAlpha = 1;
      } else drawBall(col, o.r, 0, 0, look);
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- drawing: particles & bursts
  function updateDrawParticles(dt, camY) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt;
      if (p.t >= p.life) { parts[i] = parts[parts.length - 1]; parts.pop(); continue; }
      const d = p.drag ? Math.exp(-p.drag * dt) : 1;
      p.vx *= d; p.vy *= d;
      if (p.k === 3) {
        p.sway += dt * 4;
        p.x += (p.vx + Math.sin(p.sway) * 60) * dt;
        p.y += p.vy * dt;
      } else {
        p.vy -= p.g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      if (p.rot != null) p.rot += p.vr * dt;
    }
    for (const p of parts) {
      const k = p.t / p.life;
      if (p.k === 3) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.sway * 1.7));
        ctx.globalAlpha = k > 0.8 ? (1 - k) / 0.2 : 1;
        ctx.fillStyle = p.col;
        ctx.fillRect(-p.size / 2, -p.size * 0.3, p.size, p.size * 0.6);
        ctx.restore();
        continue;
      }
      const sx = wrapX(p.x), sy = VH - (p.y - camY);
      if (sy < -60 || sy > VH + 60) continue;
      if (p.k === 0) {
        ctx.globalAlpha = (1 - k) * 0.9;
        ctx.fillStyle = p.col;
        ctx.beginPath(); ctx.arc(sx, sy, p.size + p.grow * k, 0, TAU); ctx.fill();
      } else if (p.k === 1) {
        const s = starSprite(p.col);
        const sz = p.size * 2 * (k < 0.15 ? k / 0.15 : 1);
        ctx.globalAlpha = k > 0.6 ? (1 - k) / 0.4 : 1;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(p.rot);
        ctx.drawImage(s.canvas, -sz / 2, -sz / 2, sz, sz);
        ctx.restore();
      } else if (p.k === 2) {
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = p.col;
        ctx.lineWidth = p.lw * (1 - k) + 1;
        ctx.beginPath(); ctx.ellipse(sx, sy, p.size * smooth(Math.min(1, k * 1.4)), p.size * 0.42 * smooth(Math.min(1, k * 1.4)), 0, 0, TAU); ctx.stroke();
      } else if (p.k === 4) {
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = p.col || RAINBOW[(p.x | 0) % RAINBOW.length];
        ctx.lineWidth = p.size;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - p.vx * 0.035, sy + p.vy * 0.035); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  const BURST_ART = { 'BONK!': 'fx_bonk', 'BOP!': 'fx_bop', 'WHAM!': 'fx_wham', 'BONK!!': 'fx_bonk2' };
  function drawBursts(camY) {
    const FONT = '900 {S}px "Arial Rounded MT Bold", "Trebuchet MS", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      const t = time - b.t0;
      if (t > 0.95) { bursts.splice(i, 1); continue; }
      let sx = wrapX(b.x), sy = VH - (b.y - camY);
      // keep the comic text out of the HUD corners
      sx = clamp(sx, HUD_LEFT + 120, VW - 130);
      sy = clamp(sy, HUD_TOP + 90, VH - 70);
      const pop = t < 0.1 ? smooth(t / 0.1) * 1.25 : t < 0.18 ? lerp(1.25, 1, (t - 0.1) / 0.08) : 1;
      const a = t > 0.75 ? 1 - (t - 0.75) / 0.2 : 1;
      ctx.save();
      ctx.translate(sx, sy - t * 30);
      ctx.rotate(b.rot);
      ctx.scale(pop * (b.size || 1), pop * (b.size || 1));
      ctx.globalAlpha = a;
      const fx = img(BURST_ART[b.text]);
      if (fx) {
        const w = 330, h = (w * fx.naturalHeight) / fx.naturalWidth;
        ctx.drawImage(fx, -w / 2, -h / 2, w, h);
        ctx.restore();
        continue;
      }
      // spiky burst
      const Rr = rng(b.seed);
      const n = 14;
      ctx.beginPath();
      for (let k = 0; k < n * 2; k++) {
        const ang = (k / (n * 2)) * TAU;
        const rr = k & 1 ? 52 + Rr() * 8 : 84 + Rr() * 18;
        const px = Math.cos(ang) * rr * 1.35, py = Math.sin(ang) * rr * 0.85;
        k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath();
      ctx.lineJoin = 'round';
      ctx.fillStyle = '#ffe14d';
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#2b1a4a';
      ctx.stroke();
      ctx.font = FONT.replace('{S}', 54);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 11;
      ctx.strokeStyle = '#2b1a4a';
      ctx.strokeText(b.text, 3, 7);
      ctx.strokeText(b.text, 0, 3);
      ctx.fillStyle = '#ff3d5e';
      ctx.fillText(b.text, 0, 3);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- frame
  let lastDt = 0;
  function draw(state, events, alpha) {
    if (!state) return;
    checkSize();
    if (assetVersion !== builtAssetVersion) {
      builtAssetVersion = assetVersion;
      bodySprites = new Map(); faceSprites = {}; platSprites = new Map();
    }
    const now = opts.now ? opts.now() : (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
    const dt = lastNow ? clamp(now - lastNow, 0, 0.05) : 1 / 60;
    lastNow = now;
    time += dt;
    lastDt = dt;
    alpha = alpha == null || !isFinite(alpha) ? 1 : clamp(alpha, 0, 1);

    syncState(state);
    handleEvents(state, events);

    const camY = camPrev + (camCur - camPrev) * alpha;
    const ph = phaseAt(camY);
    const sk = skyAt(ph);
    const extL = -ox / scale, extR = (cw - ox) / scale;

    // trail history (render-frame rate)
    for (const p of state.players || []) {
      const rec = recs.get(p.playerId);
      if (!rec) continue;
      if (p.alive && p.bonkTicks > 0) {
        rec.hist.push({ x: wrapX(p.x), y: p.y });
        if (rec.hist.length > 7) rec.hist.shift();
        // drop history across a wrap jump
        const h = rec.hist;
        if (h.length > 1 && Math.abs(h[h.length - 1].x - h[h.length - 2].x) > VW / 2) rec.hist = [h[h.length - 1]];
      } else if (rec.hist.length) rec.hist.length = 0;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true;
    drawSky(camY, ph, sk, extL, extR);

    // everything else lives in the 16:9 box
    ctx.setTransform(scale, 0, 0, scale, ox, oy);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VW, VH);
    ctx.clip();
    if (shake > 0.01) {
      const s = shake * 7;
      ctx.translate((R() - 0.5) * s, (R() - 0.5) * s);
      shake *= Math.exp(-dt * 10);
    }

    if (!drawImageLayer('bg_far', camY)) { drawCloudLayer(camY, sk, 0); drawHills(camY, 'far'); }
    // the town at the start and the things floating by (backdrop.js), behind the near cloud layer
    if (backdrop) backdrop.draw(ctx, camY, time, rgbStr(sk.mid), state.seed);
    if (!drawImageLayer('bg_near', camY)) { drawCloudLayer(camY, sk, 1); drawHills(camY, 'near'); }

    drawPlatforms(state, camY);
    drawBursts(camY); // comic bursts sit behind the players so nobody is hidden
    drawPlayers(state, camY, alpha);
    updateDrawParticles(dt, camY);
    drawOuts(dt);

    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function assetsStatus() {
    const out = {};
    for (const k in ASSETS) {
      const r = imgRecs[k];
      out[k] = !r ? 'off' : r.ok ? 'loaded' : r.failed ? 'missing' : 'loading';
    }
    return out;
  }

  resize();
  return { draw, resize, assetsStatus, setCharacters };
}
