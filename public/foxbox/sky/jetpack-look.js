/**
 * jetpack-look.js — how the jetpack items look. The rules live in sim.js ("Jetpack"); this is only art.
 *
 * The three items (Lakota's picks, Oct 31; same pixel maps as the pick-a-look page). Each one is its own
 * power-up now, the sim says which (item.kind / player.jetKind):
 *   A  backpack twin tanks   behind the body's middle, two flame jets under the tanks
 *   C  propeller beanie      on the head top, spinning propeller
 *   D  balloon bunch         three balloons tied to the head top
 * Every look is placed from the body box (feet line, middle, head top: what character.js gives every
 * player) at one fixed art-pixel size (a puffball is 16 art pixels wide). For a drawn doodle the head
 * top comes from the drawing itself (headAnchor: the top of the middle of the picture, so raised arms
 * or a tall hat don't lift the beanie off the head).
 *
 *   const jl = createJetLook(makeCanvas, () => res);
 *   jl.drawFlyer(ctx, kind, { x, feetY, bodyH, headX?, headY?, time, left, sputter, balloons, lean, layer: "back" | "front" })
 *   jl.drawBubble(ctx, kind, { x, y, time, age, armTicks, lifeTicks, id })        an item floating in in a bubble
 *   jl.drawCloudItem(ctx, kind, { x, baseY, time, age, armTicks, lifeTicks, id }) an item sitting on a cloud (baseY = its top)
 *   jl.drawLoose(ctx, kind, { x, y, rot, alpha })   a spent item falling away after the flight (tanks, hat)
 *   jl.exhaust(kind, bodyH) → [{ dx, dy }] world offsets from the feet point where jet flames come out
 *   headAnchor(canvas, axPx, ayPx, bodyWPx, bodyHPx) → { h, dx } in canvas px (see below)
 */
export const JET_LOOK_KEYS = ["A", "C", "D"];
const NAMES = { A: "A", C: "C", D: "D", TANKS: "A", PACK: "A", HAT: "C", BEANIE: "C", BALLOONS: "D" };
/** "A" | "C" | "D" (or a name) → a look key; anything else (the old rocket boots "B" too) → the tanks. */
export const jetLookKey = (v) => NAMES[String(v == null ? "" : v).trim().toUpperCase()] || "A";

const U = 92 / 16; // one art pixel in world units (a puffball is 16 art pixels wide)
const PAL = {
  O: "#0a1428", W: "#ffffff", L: "#fff3b0", Y: "#ffd23f", y: "#e3a51a", R: "#ff5a3c", B: "#4aa3ff",
  V: "#35d07f", v: "#1f9d57", K: "#ff8c9a", k: "#e0607a", G: "#c9d2e6", g: "#8f9bb5", n: "#5d6a86", S: "#d4eafa",
};

// ── the pixel maps (from the pick-a-look page) ──────────────────────────────────
const TANK = [".OOO.", "OWGgO", "OYYyO", "OWGgO", "OWGgO", "OWGgO", "OYYyO", "OGGgO", ".OnO.", "OnnnO"];
const STRAP = ["............", "............", "............", "............", "............", "OOOOOOOOOOOO", "nnnnnnnnnnnn", "OOOOOOOOOOOO", "............", "............"];
const PACK = TANK.map((t, i) => t + STRAP[i] + t);
const FLAME3 = [["YLY", "RLR", "RYR", "RYR", ".R.", ".R."], ["YLY", "RYR", "RYR", ".R.", "...", "..."]];
const BEANIE = ["....OOOO....", "...OYYBBO...", "..ORYYBBVO..", ".ORRYYBBVVO.", ".OyyyyyyyyO.", "..OOOOOOOO.."];
const STEM = [".....OO.....", ".....OO....."];
const PROP = ["ORRRRYYBBBBO", "...ORYYBO...", "OBBBBYYRRRRO", "...OBYYRO..."].map((top) => [top].concat(STEM));
const BALLOON = ["..OOO..", ".OWCCO.", "OWCCCCO", "OCCCCCO", "OCCCCDO", ".OCCDO.", "..OOO..", "...O..."];
const BALLOON_S = [".OOO.", "OWCCO", "OCCCO", "OCCDO", ".OOO.", "..O.."]; // the bubble icon's little ones
/**
 * A bunch of balloons tied to one knot: `shape` placed at `spots` [[x, y, colours]] (the first `n`), each
 * string from the balloon's tail to the knot (tx, ty) in a W × H grid.
 */
function bunchArt(shape, spots, W, H, tx, ty, n) {
  const g = Array.from({ length: H }, () => Array(W).fill("."));
  const put = (x, y, c) => { if (g[y] && x >= 0 && x < W) g[y][x] = c; };
  const line = (x0, y0, x1, y1) => {
    const ax = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, ay = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = ax + ay;
    for (;;) {
      put(x0, y0, "n");
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= ay) { err += ay; x0 += sx; }
      if (e2 <= ax) { err += ax; y0 += sy; }
    }
  };
  const tail = shape.length, mid = (shape[0].length - 1) / 2;
  const balloons = spots.slice(0, n);
  balloons.forEach(([x, y]) => line(x + mid, y + tail, tx, ty - 1));
  balloons.forEach(([x, y, swap]) => shape.forEach((row, j) => [...row].forEach((c, i) => { if (c !== ".") put(x + i, y + j, swap[c] || c); })));
  put(tx, ty, "O");
  return g.map((r) => r.join(""));
}
const PINK = { C: "K", D: "k" }, GREEN = { C: "V", D: "v" }, YELLOW = { C: "Y", D: "y" };
/** The worn balloon bunch (21 × 22; the knot at column 10, row 21), leaning by dx (−2..2), with the first n balloons. */
const bunch = (dx, n) => bunchArt(BALLOON, [[1 + dx, 3, PINK], [13 + dx, 3, GREEN], [7 + dx, 0, YELLOW]], 21, 22, 10, 21, n);
const LEANS = [-2, -1, 0, 1, 2];
const BUNCH = [1, 2, 3].map((n) => LEANS.map((dx) => bunch(dx, n))); // BUNCH[n - 1][dx + 2]

// the bubble's icons, one per item (they fill most of a 16-pixel bubble, so you can tell them apart)
const ICONS = {
  A: [".OOO..OOO.", "OWGgOOWGgO", "OYYyOOYYyO", "OWGgOOWGgO", "OWGgOOWGgO", "OYYyOOYYyO", ".OnO..OnO.", ".YLY..YLY.", ".RYR..RYR.", "..R....R.."],
  C: [PROP[0][0], ...STEM, ...BEANIE],
  D: bunchArt(BALLOON_S, [[0, 3, PINK], [6, 3, GREEN], [3, 0, YELLOW]], 11, 13, 5, 12, 3),
};
const ICON_U = { A: 0.95, C: 0.86, D: 0.92 }; // icon art pixel, in U
// on a cloud: the item itself (the tanks standing, the beanie, the balloons tied down)
const TANKS_STAND = ICONS.A.slice(0, 7);
// a 16 × 16 pixel bubble: white ring, a highlight
const BUBBLE = (() => {
  const rows = [];
  for (let y = 0; y < 16; y++) {
    let r = "";
    for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x - 7.5, y - 7.5);
      r += d > 7.9 ? "." : d > 6.7 ? "W" : (x === 3 && y >= 4 && y <= 6) || (y === 3 && x >= 4 && x <= 6) ? "W" : ".";
    }
    rows.push(r);
  }
  return rows;
})();

/** frame i of an n-frame loop of `period` s, `lag` s behind */
const frameAt = (t, n, period, lag = 0) => Math.floor((((t - lag) % period) + period) % period / period * n) % n;

/**
 * Where to put a hat on a drawn doodle: the top of the MIDDLE of the picture, not the top of its box
 * (raised arms, a flag or bunny ears would lift a box-top hat into the air). The canvas is the doodle's
 * sprite, (axPx, ayPx) its feet point and bodyWPx × bodyHPx its body box, all in canvas pixels.
 * Returns { h, dx }: the head top's height above the feet and its centre's offset from the feet point
 * (facing right), canvas px; null when the picture can't be read.
 */
export function headAnchor(canvas, axPx, ayPx, bodyWPx, bodyHPx) {
  try {
    const W = canvas.width, H = canvas.height;
    const d = canvas.getContext("2d").getImageData(0, 0, W, H).data;
    const solid = (x, y) => d[(y * W + x) * 4 + 3] > 140;
    const band = Math.max(3, bodyWPx * 0.2);
    const x0 = Math.max(0, Math.floor(axPx - band)), x1 = Math.min(W - 1, Math.ceil(axPx + band));
    let top = -1;
    for (let y = 0; y < Math.min(H, ayPx) && top < 0; y++) {
      let c = 0;
      for (let x = x0; x <= x1; x++) if (solid(x, y) && ++c >= 2) { top = y; break; }
    }
    if (top < 0 || ayPx - top < bodyHPx * 0.45) return { h: bodyHPx, dx: 0 }; // nothing up the middle: the box top
    // the head's middle: the solid pixels of the first few rows from there, within a wider band
    const wide = Math.max(4, bodyWPx * 0.36), rows = Math.max(3, Math.min(bodyHPx * 0.12, bodyWPx * 0.3));
    let sx = 0, n = 0;
    for (let y = top; y < Math.min(H, top + rows); y++)
      for (let x = Math.max(0, Math.floor(axPx - wide)); x <= Math.min(W - 1, Math.ceil(axPx + wide)); x++) if (solid(x, y)) { sx += x; n++; }
    const dx = n ? Math.max(-bodyWPx * 0.25, Math.min(bodyWPx * 0.25, sx / n - axPx)) : 0;
    return { h: ayPx - top, dx };
  } catch {
    return null;
  }
}

export function createJetLook(makeCanvas, getRes) {
  const cache = new Map();
  /** A crisp canvas for a pixel map: { canvas, w, h } in world units (u = world units per art pixel). */
  function art(key, rows, u = U, pal) {
    const res = getRes();
    const ck = key + "|" + res + "|" + u;
    let s = cache.get(ck);
    if (s) return s;
    const w = rows[0].length, h = rows.length;
    const px = Math.max(1, Math.round(u * res));
    const c = makeCanvas(w * px, h * px);
    const g = c.getContext("2d");
    rows.forEach((row, y) => {
      for (let x = 0; x < w; x++) {
        const ch = row[x];
        if (ch === ".") continue;
        g.fillStyle = (pal && pal[ch]) || PAL[ch] || "#ff00ff";
        g.fillRect(x * px, y * px, px, px);
      }
    });
    s = { canvas: c, w: w * u, h: h * u };
    cache.set(ck, s);
    return s;
  }
  function blit(ctx, s, x, y) {
    const sm = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(s.canvas, Math.round(x), Math.round(y), s.w, s.h);
    ctx.imageSmoothingEnabled = sm;
  }
  // the jets cough in the last second: on and off in a broken rhythm
  const coughOn = (t) => [1, 1, 0, 1, 0, 0, 1, 0][Math.floor(t * 14) % 8] === 1;

  /**
   * Draw a flyer's item. x = body centre, feetY = the feet line, bodyH = feet → head top (screen,
   * world units, y down); headX / headY = where the head top really is (a drawn doodle's, from
   * headAnchor), default (x, feetY − bodyH). balloons = how many are still up (sim jetBalloons),
   * lean = −1..1 (the balloons trail behind a sideways move). layer "back" goes under the body, "front" over it.
   */
  function drawFlyer(ctx, kind, { x, feetY, bodyH, headX = x, headY = feetY - bodyH, time: t, left, sputter, balloons = 3, lean = 0, layer }) {
    const k = jetLookKey(kind);
    if (k === "A") {
      if (layer !== "back") return;
      // on the back: the middle of the body (a little higher on a tall one)
      const mid = bodyH > 130 ? bodyH * 0.56 : bodyH / 2;
      const top = feetY - mid - 5 * U;
      blit(ctx, art("pack", PACK), x - 11 * U, top);
      if (sputter && !coughOn(t)) return;
      const f = (lag) => (sputter ? 1 : frameAt(t, 2, 0.3, lag));
      blit(ctx, art("f3-" + f(0), FLAME3[f(0)]), x - 10 * U, top + 10 * U);
      blit(ctx, art("f3-" + f(0.11), FLAME3[f(0.11)]), x + 7 * U, top + 10 * U);
    } else if (k === "C") {
      if (layer !== "front") return;
      // winding down: the propeller slows right down and the hat wobbles
      const wob = sputter ? Math.round(Math.sin(t * 22) * (left / 60)) * U : 0;
      const period = sputter ? 0.36 + (1 - left / 60) * 1.4 : 0.36;
      blit(ctx, art("beanie", BEANIE), headX - 6 * U + wob, headY - 4 * U);
      const f = frameAt(t, 4, period);
      blit(ctx, art("prop-" + f, PROP[f]), headX - 6 * U + wob, headY - 7 * U);
    } else {
      if (layer !== "back" || balloons <= 0) return;
      const n = Math.max(1, Math.min(3, balloons));
      const dx = Math.max(-2, Math.min(2, Math.round(lean * 2 + Math.sin(t * 2.6) * 0.6)));
      blit(ctx, art("bunch-" + n + "-" + dx, BUNCH[n - 1][dx + 2]), headX - 10.5 * U, headY - 21.5 * U);
    }
  }

  /** Where the flames come out (world offsets from the feet point, y up), for exhaust particles. */
  function exhaust(kind, bodyH) {
    if (jetLookKey(kind) !== "A") return [];
    const mid = bodyH > 130 ? bodyH * 0.56 : bodyH / 2;
    return [{ dx: -8.5 * U, dy: mid - 9 * U }, { dx: 8.5 * U, dy: mid - 9 * U }];
  }

  /** New items pop in (can't be taken yet), old ones blink in their last 1.5 s: the scale + skip. */
  function lifeLook(t, age, armTicks, lifeTicks) {
    const grow = Math.min(1, age / armTicks);
    return { grow, hide: lifeTicks - age < 90 && Math.floor(t * 8) % 2 === 0 };
  }

  /**
   * The item in a pixel bubble with its icon, bobbing; pops in when new (it can't be taken yet),
   * blinks in its last 1.5 s. (x, y) = its centre on screen.
   */
  function drawBubble(ctx, kind, { x, y, time: t, age, armTicks, lifeTicks, id }) {
    const k = jetLookKey(kind);
    const { grow, hide } = lifeLook(t, age, armTicks, lifeTicks);
    if (hide) return;
    const bob = Math.round(Math.sin(t * 2.6 + id) * 1.2) * U;
    const sc = 0.45 + 0.55 * grow;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y + bob));
    ctx.scale(sc, sc);
    ctx.globalAlpha *= 0.6 + 0.4 * grow;
    // soft glow + the bubble's see-through fill
    ctx.fillStyle = "rgba(255, 243, 176, 0.28)";
    ctx.beginPath();
    ctx.arc(0, 0, 9.5 * U, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(212, 234, 250, 0.45)";
    ctx.beginPath();
    ctx.arc(0, 0, 7.4 * U, 0, Math.PI * 2);
    ctx.fill();
    const icon = art("icon-" + k, ICONS[k], U * ICON_U[k]);
    blit(ctx, icon, -icon.w / 2, -icon.h / 2);
    const b = art("bubble", BUBBLE);
    blit(ctx, b, -b.w / 2, -b.h / 2);
    twinkle(ctx, t, id, 5 * U, -6 * U);
    ctx.restore();
  }

  /** a yellow four-point twinkle, on every third beat */
  function twinkle(ctx, t, id, sx, sy) {
    if (Math.floor(t * 3 + id) % 3 !== 0) return;
    ctx.fillStyle = "#ffd23f";
    ctx.fillRect(sx - U / 2, sy - 1.5 * U, U, 3 * U);
    ctx.fillRect(sx - 1.5 * U, sy - U / 2, 3 * U, U);
  }

  /**
   * The item sitting on a cloud: the tanks standing, the beanie with its propeller turning, the balloons
   * tied down and swaying; a warm glow behind so it reads as something to grab. (x, baseY) = the middle
   * of where it sits on the cloud's top.
   */
  function drawCloudItem(ctx, kind, { x, baseY, time: t, age, armTicks, lifeTicks, id }) {
    const k = jetLookKey(kind);
    const { grow, hide } = lifeLook(t, age, armTicks, lifeTicks);
    if (hide) return;
    const sc = 0.45 + 0.55 * grow;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(baseY));
    ctx.scale(sc, sc);
    ctx.globalAlpha *= 0.6 + 0.4 * grow;
    const hop = k === "D" ? 0 : Math.round(Math.max(0, Math.sin(t * 3.2 + id)) * 1.5) * U; // a little hop
    // the glow: a warm halo where it sits, brightest in the middle (it reads as "grab me", not as a disc)
    const gy = k === "D" ? -12 * U : -6 * U, gr = k === "D" ? 13 * U : 10 * U;
    const glow = ctx.createRadialGradient(0, gy, 0, 0, gy, gr);
    glow.addColorStop(0, "rgba(255, 246, 190, 0.75)");
    glow.addColorStop(0.55, "rgba(255, 236, 150, 0.35)");
    glow.addColorStop(1, "rgba(255, 236, 150, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, gy, gr, 0, Math.PI * 2);
    ctx.fill();
    if (k === "A") {
      const s = art("tanks-stand", TANKS_STAND, U * 1.15);
      blit(ctx, s, -s.w / 2, -s.h - hop);
      twinkle(ctx, t, id, 6 * U, -11 * U);
    } else if (k === "C") {
      const u = U * 1.05;
      const hat = art("beanie-c", BEANIE, u);
      blit(ctx, hat, -hat.w / 2, -hat.h - hop);
      const f = frameAt(t, 4, 0.9);
      const prop = art("prop-c-" + f, PROP[f], u);
      blit(ctx, prop, -prop.w / 2, -hat.h - 3 * u - hop);
      twinkle(ctx, t, id, 6 * U, -12 * U);
    } else {
      const u = U * 0.82;
      const dx = Math.round(Math.sin(t * 1.9 + id) * 1.4);
      const s = art("bunch-c-" + dx, BUNCH[2][dx + 2], u);
      blit(ctx, s, -10.5 * u, -s.h + u); // the knot on the cloud
      twinkle(ctx, t, id, 7 * U, -19 * U);
    }
    ctx.restore();
  }

  /** A spent item falling away after the flight (the empty tanks, the hat flying off). (x, y) = its middle. */
  function drawLoose(ctx, kind, { x, y, rot = 0, alpha = 1 }) {
    const k = jetLookKey(kind);
    if (k === "D") return; // the balloons are all popped
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (rot) ctx.rotate(rot);
    ctx.globalAlpha *= alpha;
    if (k === "A") {
      const s = art("pack", PACK);
      blit(ctx, s, -s.w / 2, -s.h / 2);
    } else {
      const hat = art("beanie", BEANIE);
      blit(ctx, hat, -hat.w / 2, -hat.h / 2 + 1.5 * U);
      const prop = art("prop-0", PROP[0]);
      blit(ctx, prop, -prop.w / 2, -hat.h / 2 - 1.5 * U);
    }
    ctx.restore();
  }

  return { drawFlyer, drawBubble, drawCloudItem, drawLoose, exhaust, U };
}
