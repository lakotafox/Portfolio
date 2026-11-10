/**
 * tennis-pad.js: FOX TENNIS's phone controller (same shape as TEE TIME's golf-pad.js; would sync to the package as
 * dev/party/tennis/tennis-pad.js + swing.js):
 *   const pad = createTennisPad(rootEl, { send(m), me() });
 *   pad.show(on, status)   // on = countdown / playing; status = the shell's status (its "lobby" state arms the intro)
 *   pad.onMessage(m)       // every {t:"game", m} from the TV ({type:"view"} / {type:"pong"})
 *   pad.release()          // window blur
 *
 * Flow (Lakota, Nov 9): every time tennis starts from the lobby each phone gets three cards, one tap each:
 *   1 MAKE ROOM (OK) -> 2 HOLD ON TIGHT (OK) -> 3 HOW TO SWING with the real PLAY button (a real click: iOS motion
 *   permission) and RIGHTY / LEFTY -> hold still -> READY. Then the gyro stays on for the match: every swing is sent with
 *   its moment on the TV's clock (ping/pong offset), its power and forehand / backhand. Players run on their own; you only
 *   swing. No motion = a big tap button. A phone that did not come through the lobby (a reload mid-match, a rematch
 *   without the lobby) skips cards 1-2: it gets card 3 only while it still needs PLAY.
 * Test hook: window.__tennisPad (read-only + fakeSwing), DOM data-test ids: see CONTRACT.md.
 */
import { createSwingDetector, createClockSync, tuneFromUrl, SWING } from "./swing.js";

const fin = (v) => typeof v === "number" && Number.isFinite(v);
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const PT = ["0", "15", "30", "40"];
const SWING_HARD = 0.72; // power above this = a big hit (src/config.js POWER.hard)

function shade(hex, amt) {
  const n = parseInt(String(hex).replace("#", ""), 16);
  if (!Number.isFinite(n)) return hex;
  const t = amt > 0 ? 255 : 0, k = Math.abs(amt), ch = (s) => Math.round(((n >> s) & 255) * (1 - k) + t * k);
  return "#" + [16, 8, 0].map((s) => ch(s).toString(16).padStart(2, "0")).join("");
}
/** A slot colour lifted toward white when it is too dark to read on navy (the TV's readable()). */
function readable(hex) {
  const n = parseInt(String(hex || "").replace("#", ""), 16);
  if (!Number.isFinite(n)) return hex || "#fff";
  const l = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return l >= 0.58 ? hex : shade(hex, Math.min(0.6, (0.58 - l) / (1 - l)));
}
// ── the intro cards' pictures: the "LCD SIGNS" look (cream sign people with plain circle hands on the dark screen, gold =
// your phone, red = warning, teal = tick). Drawn as vector shapes in art-pixel units and turned into clean pixel art (4x
// supersample, the majority palette colour per art pixel, no blends); one art pixel = 2 CSS px. Every picture is a pure
// function of loop time (one loop = 4 s). Lakota reviews this art: change the drawings only when asked. ──
const PIC_W = 152, PIC_H = 110, GY = 100, LOOP = 4, D2R = Math.PI / 180;
const hexRgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mixHex = (a, b, k) => { const A = hexRgb(a), B = hexRgb(b); return "#" + A.map((v, i) => Math.round(v * (1 - k) + B[i] * k).toString(16).padStart(2, "0")).join(""); };
const PAL = { bg: "#101125", cream: "#fff9f1", gold: "#ffd23f", teal: "#2ed3c6", red: "#ff5a3c", dim: "#2c2f55" };
PAL.soft = mixHex(PAL.cream, PAL.bg, 0.45); // the friend, the lamp
PAL.ghost = mixHex(PAL.gold, PAL.bg, 0.62); // where the phone just was
PAL.ink = PAL.bg;
/** makePic(W, H, palette) -> { canvas, render(fn) }: fn(ctx) draws in art-pixel units with normal canvas calls. */
function makePic(W, H, palette) {
  const SS = 4, canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const out = canvas.getContext("2d"), big = document.createElement("canvas");
  big.width = W * SS; big.height = H * SS;
  const ctx = big.getContext("2d", { willReadFrequently: true });
  const pal = Object.values(palette).map(hexRgb), cache = new Map(), img = out.createImageData(W, H), cnt = new Uint8Array(pal.length + 1);
  const nearest = (r, g, b) => {
    const key = (r << 16) | (g << 8) | b;
    let v = cache.get(key);
    if (v === undefined) {
      let best = 1e9;
      pal.forEach((p, i) => { const d = (p[0] - r) ** 2 + (p[1] - g) ** 2 + (p[2] - b) ** 2; if (d < best) { best = d; v = i; } });
      cache.set(key, v);
    }
    return v;
  };
  return { canvas, render(fn) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.clearRect(0, 0, W * SS, H * SS); ctx.setTransform(SS, 0, 0, SS, 0, 0);
    ctx.save(); fn(ctx); ctx.restore();
    // (one 32-bit read per sample, and a run of the same colour is looked up once: phones draw this every frame)
    const src = new Uint32Array(ctx.getImageData(0, 0, W * SS, H * SS).data.buffer), dst = img.data;
    let lastPx = -1, slot = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      cnt.fill(0);
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const px = src[(y * SS + sy) * W * SS + x * SS + sx];
        if (px !== lastPx) { lastPx = px; slot = px >>> 24 < 128 ? 0 : 1 + nearest(px & 255, (px >> 8) & 255, (px >> 16) & 255); }
        cnt[slot]++;
      }
      let b = 0;
      for (let k = 1; k < cnt.length; k++) if (cnt[k] > cnt[b]) b = k;
      const o = (y * W + x) * 4;
      if (b === 0) dst[o + 3] = 0;
      else { const p = pal[b - 1]; dst[o] = p[0]; dst[o + 1] = p[1]; dst[o + 2] = p[2]; dst[o + 3] = 255; }
    }
    out.putImageData(img, 0, 0);
  } };
}
// the small shape kit (all sizes in art pixels)
function shape(ctx, path, fill, ink, ow = 0) { // fill a path, with an optional outline of `ow` art px outside it
  ctx.beginPath(); path(ctx);
  if (ink && ow) { ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.lineWidth = ow * 2; ctx.strokeStyle = ink; ctx.stroke(); }
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
}
const circle = (ctx, x, y, r, fill, ink, ow) => shape(ctx, (c) => c.arc(x, y, r, 0, Math.PI * 2), fill, ink, ow);
const poly = (ctx, pts, fill, ink, ow) => shape(ctx, (c) => { pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); }, fill, ink, ow);
const rrect = (ctx, x, y, w, h, r, fill, ink, ow) => shape(ctx, (c) => {
  if (c.roundRect) return c.roundRect(x, y, w, h, r);
  const k = Math.min(r, w / 2, h / 2); // (Safari before 16 has no roundRect)
  c.moveTo(x + k, y); c.arcTo(x + w, y, x + w, y + h, k); c.arcTo(x + w, y + h, x, y + h, k); c.arcTo(x, y + h, x, y, k); c.arcTo(x, y, x + w, y, k); c.closePath();
}, fill, ink, ow);
function line(ctx, pts, w, color, ink, ow = 0) { // a round-capped line through points, with an optional outline
  const run = (lw, col) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.stroke(); };
  if (ink && ow) run(w + ow * 2, ink);
  run(w, color);
}
function curve(x0, y0, cx, cy, x1, y1, n = 12) { // points along a quadratic curve
  const pts = [];
  for (let i = 0; i <= n; i++) { const k = i / n, a = (1 - k) * (1 - k), b = 2 * k * (1 - k), c = k * k; pts.push([a * x0 + b * cx + c * x1, a * y0 + b * cy + c * y1]); }
  return pts;
}
function limbPts(ax, ay, bx, by, len) { // a limb of fixed length from a to b: it bends (elbow hanging down) when the ends are closer than its length
  const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 0.001, slack = Math.max(0, len * len - d * d), h = Math.sqrt(slack) * 0.5;
  let nx = -dy / d, ny = dx / d;
  if (ny < 0) { nx = -nx; ny = -ny; }
  return curve(ax, ay, (ax + bx) / 2 + nx * h * 1.3, (ay + by) / 2 + ny * h * 1.3, bx, by, 10);
}
function arrowHead(ctx, x, y, ang, size, color) {
  const p = (a, r) => [x + r * Math.cos(ang + a), y + r * Math.sin(ang + a)];
  poly(ctx, [p(0, size), p(2.45, size), p(-2.45, size)], color);
}
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const seg = (t, a, b) => ease((t - a) / (b - a));
const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
// the drawn parts. A pose = { x, gy (ground), lean, L: [dx, dy], R: [dx, dy], phone: { arm, ang } }: L / R = the arm on the
// picture's left / right, [dx, dy] = the hand measured from its own shoulder.
const PHONE_H = 18, GRIP = 7, DIM = { sy: 54, sx: 9, arm: 25, head: 70, tall: 78 }; // (the hand holds the phone low down)
/** The gold phone: centre (x, y), ang = lean from upright (rad); ghost = where it just was. */
function phonePic(ctx, x, y, ang = 0, ghost = false) {
  const w = 9, h = PHONE_H;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  if (ghost) rrect(ctx, -w / 2, -h / 2, w, h, 2, PAL.ghost);
  else {
    rrect(ctx, -w / 2, -h / 2, w, h, 2, PAL.gold, PAL.ink, 1.2);
    rrect(ctx, -w / 2 + 1.5, -h / 2 + 1.5, 3.5, 4, 1, PAL.ink); // the camera island, at its top end
  }
  ctx.restore();
}
/** The sign person with CIRCLE HANDS: each arm ends in a plain cream disc a bit wider than the arm (no fingers, no fist,
 *  no outline: only the usual navy gap where the arm crosses the body). The gold phone stands in the disc. */
function person(ctx, o) {
  const { x, gy, lean = 0, col = PAL.cream } = o, D = DIM, sx = x + lean * 0.8, sy = gy - D.sy;
  const hands = { L: [sx - D.sx + o.L[0], sy + o.L[1]], R: [sx + D.sx + o.R[0], sy + o.R[1]] };
  line(ctx, [[x - 4.5, gy - 33], [x - 7, gy - 3.5]], 7, col);
  line(ctx, [[x + 4.5, gy - 33], [x + 7, gy - 3.5]], 7, col);
  line(ctx, [[sx, gy - 52], [x, gy - 37]], 17, col);
  circle(ctx, x + lean, gy - D.head, 8, col, PAL.ink, 1.5);
  const arm = (k) => {
    const s = [sx + (k === "L" ? -D.sx : D.sx), sy], h = hands[k], pts = limbPts(s[0], s[1], h[0], h[1], D.arm);
    line(ctx, pts, 10, PAL.ink); circle(ctx, h[0], h[1], 6.8, PAL.ink); // the gap (same navy as the screen, so no outline shows)
    line(ctx, pts, 6, col);
    if (o.phone && o.phone.arm === k) { const [px, py] = rot(0, -GRIP, o.phone.ang); phonePic(ctx, h[0] + px, h[1] + py, o.phone.ang); }
    circle(ctx, h[0], h[1], 4.8, col);
  };
  const first = o.phone && o.phone.arm === "L" ? "R" : "L";
  arm(first); arm(first === "L" ? "R" : "L");
}
function lampPic(ctx, x, gy, wob = 0) { // a floor lamp; wob (rad) rocks it about its foot
  ctx.save(); ctx.translate(x, gy); ctx.rotate(wob);
  line(ctx, [[-7, -1.5], [7, -1.5]], 3, PAL.soft); line(ctx, [[0, -2], [0, -52]], 2.5, PAL.soft);
  poly(ctx, [[-6, -68], [6, -68], [11, -50], [-11, -50]], PAL.soft);
  ctx.restore();
}
const tickPic = (ctx, x, y, s) => line(ctx, [[x - s, y], [x - s * 0.3, y + s * 0.7], [x + s, y - s * 0.8]], s * 0.5, PAL.teal, PAL.ink, 1.2);
function tickM(ctx, mirrored, x, y, s) { // a tick that still reads as a tick when the picture is shown mirrored
  if (!mirrored) return tickPic(ctx, x, y, s);
  ctx.save(); ctx.translate(2 * x, 0); ctx.scale(-1, 1); tickPic(ctx, x, y, s); ctx.restore();
}
function warnPic(ctx, x, y) { rrect(ctx, x - 2.2, y - 10, 4.4, 10, 1.5, PAL.red, PAL.ink, 1.2); circle(ctx, x, y + 4.5, 2.4, PAL.red, PAL.ink, 1.2); }
// the scenes. They are drawn with the phone hand on the picture's LEFT and shown mirrored for a righty, so on screen a
// righty's phone hand is on the right, like your player on the TV; LEFTY (card 3 only) is the picture unmirrored.
// Swing direction (swing.js): + yaw = counter-clockwise from above = a RIGHTY's FOREHAND, right -> left seen from behind.
const swingE = (s) => ease(Math.pow(clamp01(s), 0.6)); // quick off the mark, a long soft follow-through
const mixP = (a, b, k) => ({ off: [lerp(a.off[0], b.off[0], k), lerp(a.off[1], b.off[1], k)], ang: lerp(a.ang, b.ang, k) });
const mix2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const READY = { off: [-6, 12], ang: -0.15 }, REST_R = [4, 22], REST_L = [-4, 22];
function swingF(e) { // a swing seen from the front: the phone arm goes from out wide, down, and across
  const a = lerp(193, -17, e) * D2R, R = DIM.arm * lerp(0.95, 1.25, e * e);
  return { off: [R * Math.cos(a), R * Math.sin(a)], ang: lerp(-0.6, 0.9, e) };
}
function backdropPic(ctx) { ctx.fillStyle = PAL.bg; ctx.fillRect(0, 0, PIC_W, PIC_H); ctx.fillStyle = PAL.dim; ctx.fillRect(6, GY + 1, PIC_W - 12, 2); }
const fade = (t) => Math.min(seg(t, 0, 0.3), 1 - seg(t, 3.7, 4));
const zoom = (ctx, k) => { ctx.translate(PIC_W / 2, GY); ctx.scale(k, k); ctx.translate(-PIC_W / 2, -GY); }; // bigger figures, feet stay on the floor
function ghosts(ctx, armAt, t, x, from, to) {
  if (t < from || t > to) return;
  const sh = [x - DIM.sx, GY - DIM.sy];
  for (const ago of [0.15, 0.1, 0.05]) {
    const a = armAt(Math.max(from, t - ago)), [px, py] = rot(0, -GRIP, a.ang);
    phonePic(ctx, sh[0] + a.off[0] + px, sh[1] + a.off[1] + py, a.ang, true);
  }
}
// 1 MAKE ROOM: the wind-up taps the lamp, the swing stops a whisker from the friend; both step apart; a clean swing.
function sceneRoom(ctx, t, mirrored) {
  const C = { lamp: 17, x0: 66, gap: 40, d1: 8, d2: 20 };
  const armAt = (tt) => tt < 0.9 ? mixP(READY, swingF(0), seg(tt, 0.4, 0.8)) : tt < 1.7 ? swingF(0.8 * swingE((tt - 0.9) / 0.4))
    : tt < 2.6 ? mixP(swingF(0.8), READY, seg(tt, 1.7, 2.1)) : tt < 3.0 ? mixP(READY, swingF(0), seg(tt, 2.6, 2.95)) : swingF(swingE((tt - 3.0) / 0.4));
  const st = seg(t, 1.9, 2.5), hop = -2.5 * Math.sin(Math.PI * st), sx = C.x0 + C.d1 * st, fx = C.x0 + C.gap + C.d2 * st;
  const flinch = seg(t, 1.12, 1.3) * (1 - seg(t, 1.9, 2.4)), wave = seg(t, 3.3, 3.55);
  backdropPic(ctx);
  zoom(ctx, 1.08);
  const tw = t - 0.78;
  lampPic(ctx, C.lamp, GY, tw > 0 && tw < 1.4 ? -0.13 * Math.sin(tw * 13) * Math.exp(-tw * 3.2) : 0);
  ghosts(ctx, armAt, t, sx, 3.0, 3.5);
  const a = armAt(t);
  person(ctx, { x: fx, gy: GY + hop, lean: 7 * flinch, col: PAL.soft, L: mix2(REST_L, [-9, -14], flinch), R: mix2(mix2(REST_R, [10, -15], flinch), [4, -22], wave) });
  person(ctx, { x: sx, gy: GY + hop, lean: 0, L: a.off, R: REST_R, phone: { arm: "L", ang: a.ang } });
  const mx = (sx + fx) / 2 + 5, my = GY - DIM.tall - 2;
  if (t > 1.22 && t < 1.95) warnPic(ctx, mx, Math.max(13, my));
  if (t > 2.3 && t < 2.95) { // step apart
    const y = GY - 28, x0 = sx + 17, x1 = fx - 17;
    line(ctx, [[x0 + 3, y], [x1 - 3, y]], 2, PAL.cream); arrowHead(ctx, x0, y, Math.PI, 4.5, PAL.cream); arrowHead(ctx, x1, y, 0, 4.5, PAL.cream);
  }
  if (t > 3.38) tickM(ctx, mirrored, mx, Math.max(14, my + 2), 7);
  return fade(t);
}
// 2 HOLD ON TIGHT: a loose swing, the phone pops out and is caught; a squeeze; then a swing where it stays put.
function sceneGrip(ctx, t, mirrored) {
  const D = DIM, x = 72, T0 = 1.14, T1 = 2.08, cw = 4.5, cy0 = 13, lob = 13;
  const CATCH_L = { off: [D.sx - cw, cy0], ang: 0 }, CATCH_R = [-D.sx + cw, cy0];
  const armAt = (tt) => tt < 0.9 ? mixP(READY, swingF(0), seg(tt, 0.4, 0.8)) : tt < 1.5 ? swingF(swingE((tt - 0.9) / 0.4))
    : tt < 2.6 ? mixP(swingF(1), CATCH_L, seg(tt, 1.5, 2.0)) : tt < 3.0 ? mixP(CATCH_L, swingF(0), seg(tt, 2.6, 2.95)) : swingF(swingE((tt - 3.0) / 0.4));
  const sh = [x - D.sx, GY - D.sy], centre = (a) => { const [px, py] = rot(0, -GRIP, a.ang); return [sh[0] + a.off[0] + px, sh[1] + a.off[1] + py]; };
  const a = armAt(t), flying = t >= T0 && t < T1, two = seg(t, 1.5, 2.0) * (1 - seg(t, 2.6, 2.95));
  backdropPic(ctx);
  zoom(ctx, 1.12);
  ghosts(ctx, armAt, t, x, 3.0, 3.5);
  person(ctx, { x, gy: GY, lean: 0, L: a.off, R: mix2(REST_R, CATCH_R, two), phone: flying ? null : { arm: "L", ang: a.ang } });
  if (flying) {
    const k = (t - T0) / (T1 - T0), a0 = armAt(T0), p0 = centre(a0), p1 = centre(armAt(T1));
    phonePic(ctx, lerp(p0[0], p1[0], k) + 12 * Math.sin(Math.PI * k), lerp(p0[1], p1[1], k) - lob * 4 * k * (1 - k), lerp(a0.ang, Math.PI * 4, k));
  }
  if (t > 1.3 && t < 2.0) warnPic(ctx, x + 40, 24);
  if (t > 2.15 && t < 2.62) { // the squeeze: short marks round the hands, two calm steps
    const cx = x, cy = GY - D.sy + 9, r = Math.floor((t - 2.15) / 0.235) % 2 ? 15 : 13;
    for (const deg of [-150, -105, -75, -30, 30, 150]) { const d = deg * D2R; line(ctx, [[cx + r * Math.cos(d), cy + r * Math.sin(d)], [cx + (r + 4) * Math.cos(d), cy + (r + 4) * Math.sin(d)]], 1.8, PAL.cream); }
  }
  if (t > 3.38) tickM(ctx, mirrored, x + 40, 24, 7);
  return fade(t);
}
// 3 HOW TO SWING: just the sign person swinging, big, seen from behind. 0-2 s forehand and back to ready, 2-4 s backhand
// and back. The phone arm is always drawn on top.
const HALF = 2;
function sceneHow(ctx, t) {
  const x = 86, half = t < HALF ? 0 : 1, u = t - half * HALF;
  const RDY = { off: [-8, 13], ang: -0.1 }, arc = (deg, R, ang) => ({ off: [R * Math.cos(deg * D2R), R * Math.sin(deg * D2R)], ang });
  const prep = seg(u, 0.1, 0.5), e = swingE((u - 0.6) / 0.45), back = seg(u, 1.3, 1.85);
  // forehand: out wide and low on the racket side -> down and across the front -> up by the other shoulder
  // backhand: across the body on the other side -> down and out -> up and wide on the racket side
  const sw = half === 0 ? arc(lerp(160, -12, e), 25 * lerp(0.95, 1.22, e * e), lerp(-0.7, 0.9, e))
    : arc(lerp(20, 205, e), 25 * lerp(1.2, 1.22, e), lerp(0.7, -0.8, e));
  const a = u < 0.6 ? mixP(RDY, sw, prep) : mixP(sw, RDY, back), side = half === 0 ? -1 : 1;
  if (half === 0 && u >= 0.6) a.off[1] += 12 * Math.sin(Math.PI * back); // come back to ready across the chest, not past the face
  const lean = side * (u < 0.6 ? 2.5 * prep : lerp(2.5, -3, e) * (1 - back));
  const free = half === 0 ? mix2(REST_R, [11, 14], prep * (1 - e)) : mix2(REST_R, [1, 24], prep * (1 - back));
  backdropPic(ctx);
  zoom(ctx, 1.12);
  person(ctx, { x, gy: GY, lean, L: a.off, R: free, phone: { arm: "L", ang: a.ang } });
  return 1;
}
const SCENES = [sceneRoom, sceneGrip, sceneHow];
// the cards' words (Lakota approved these: keep them exactly)
const CARDS = [
  { title: "MAKE ROOM", words: "Swings go wide. Step away from friends, lamps and the TV." },
  { title: "HOLD ON TIGHT", words: "Squeeze the phone.<br>Don't let it fly!" },
  { title: "HOW TO SWING", words: "Hold it like a racket.<br>Swing across." },
];

const CSS = `
#pad-screen.tennis #controls { flex: 1 1 auto !important; height: auto !important; }
#tennis .tp { position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 10px; color: #fff;
  font-family: "FoxBox Pixel", ui-monospace, monospace; -webkit-user-select: none; user-select: none; }
#tennis .tp-frame { background: #0a1428e6; box-shadow: 0 -4px 0 0 #0a1428, 0 4px 0 0 #0a1428, -4px 0 0 0 #0a1428, 4px 0 0 0 #0a1428,
  inset 0 0 0 3px var(--tp-edge, #ffffff2e); margin: 4px; padding: 10px 12px; }
#tennis .tp-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 10px; line-height: 1.4; color: #ffd23f; }
#tennis .tp-score { display: grid; grid-template-columns: 18px minmax(0,1fr) 34px 44px; gap: 6px 8px; align-items: center; font-size: 12px; }
#tennis .tp-score .nm { font-family: "FoxBox Soft", ui-rounded, system-ui, sans-serif; font-weight: 700; font-size: 17px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#tennis .tp-score .gm { text-align: center; }
#tennis .tp-score .pt { text-align: center; background: #ffd23f; color: #0a1428; padding: 4px 0; }
#tennis .tp-score .sv { width: 12px; height: 12px; background: #e8f53f; box-shadow: 0 0 0 2px #0a1428; justify-self: center; }
#tennis .tp-s { display: none; flex: 1; min-height: 0; flex-direction: column; gap: 12px; align-items: stretch; text-align: center; }
#tennis .tp-s::before { content: ""; margin-top: auto; }
#tennis .tp-s::after { content: ""; margin-bottom: auto; }
#tennis .tp[data-screen="wait"] .tp-wait, #tennis .tp[data-screen="play"] .tp-play,
#tennis .tp[data-screen="point"] .tp-point, #tennis .tp[data-screen="bracket"] .tp-bracket, #tennis .tp[data-screen="done"] .tp-bracket { display: flex; }
#tennis .tp-big { font-size: clamp(20px, 7vw, 32px); line-height: 1.3; color: #ffd23f; text-shadow: 3px 3px 0 #0a1428; }
#tennis .tp-mid { font-size: clamp(11px, 3.6vw, 15px); line-height: 1.6; }
#tennis .tp-wait-title:empty, #tennis .tp-wait-sub:empty, #tennis .tp-cue:empty, #tennis .tp-play-sub:empty { display: none; } /* an empty line still costs one gap: hidden, the rest stays centred */
#tennis .tp-small { font-size: 9px; line-height: 1.7; color: #c9d2e6; }
#tennis .tp-soft { font-family: "FoxBox Soft", ui-rounded, system-ui, sans-serif; font-weight: 700; font-size: 17px; line-height: 1.35; }
#tennis .tp-btn { appearance: none; border: 0; border-radius: 0; font: inherit; color: #0a1428; cursor: pointer; touch-action: manipulation;
  background: var(--tp-bg, #ffd23f); box-shadow: 0 -4px 0 0 #0a1428, 0 4px 0 0 #0a1428, -4px 0 0 0 #0a1428, 4px 0 0 0 #0a1428, inset 0 -6px 0 0 #0000003a, 0 10px 0 0 #0a142899; }
#tennis .tp-btn:active, #tennis .tp-btn.down { transform: translateY(5px); }
#tennis .tp-play-btn { min-height: 110px; font-size: clamp(26px, 9vw, 40px); --tp-bg: #35d07f; }
#tennis .tp-tap { min-height: 46vh; font-size: clamp(30px, 11vw, 48px); --tp-bg: #ffd23f; touch-action: none; }
#tennis .tp-link { --tp-bg: #c9d2e6; font-size: 11px; padding: 12px 14px; align-self: center; }
#tennis .tp-hand { display: flex; gap: 12px; justify-content: center; }
#tennis .tp-hand .tp-btn { font-size: 11px; padding: 12px 14px; --tp-bg: #c9d2e6; }
#tennis .tp-hand .tp-btn.on { --tp-bg: #ffd23f; }
#tennis .tp-state { font-size: clamp(16px, 5.5vw, 22px); line-height: 1.4; padding: 14px 10px; color: #c9d2e6; }
#tennis .tp-state.on { color: #0a1428; background: #35d07f; }
#tennis .tp-cue { font-size: clamp(30px, 11vw, 52px); line-height: 1.2; padding: 26px 8px; color: #fff; text-shadow: 4px 4px 0 #0a1428; }
#tennis .tp-cue.hot { background: #ffd23f; color: #0a1428; text-shadow: none; animation: tp-flash 0.3s steps(2, end) infinite; }
#tennis .tp-cue.serve { background: #35d07f; color: #0a1428; text-shadow: none; }
@keyframes tp-flash { 50% { background: #ffffff; } }
#tennis .tp-cue.smash { background: #ff5a3c; color: #ffffff; text-shadow: 4px 4px 0 #0a1428; animation: tp-flash 0.2s steps(2, end) infinite; }
/* the swing flash: the whole pad lights up in your colour, a power bar fills, then the TV's verdict */
#tennis .tp-fx { position: absolute; inset: 0; pointer-events: none; display: none; flex-direction: column; align-items: center; justify-content: center; gap: 18px; z-index: 5; }
#tennis .tp-fx.on { display: flex; }
#tennis .tp-fx.word-on { background: #0a1428eb; }
#tennis .tp-fx .bg { position: absolute; inset: 0; background: var(--tp-fx, #35d07f); opacity: 0.0; }
#tennis .tp-fx.on .bg { animation: tp-fxbg 0.42s steps(4, end) forwards; }
@keyframes tp-fxbg { 0% { opacity: 0.85; } 100% { opacity: 0; } }
#tennis .tp-fx .meter { position: relative; display: flex; gap: 6px; padding: 10px; background: #0a1428; box-shadow: 0 0 0 4px #ffffff; }
#tennis .tp-fx .meter i { width: 22px; height: 44px; background: #2a3550; }
#tennis .tp-fx .meter i.on { background: var(--c, #35d07f); }
#tennis .tp-fx .word { position: relative; font-size: clamp(30px, 11vw, 52px); line-height: 1.2; color: #ffffff; text-shadow: 4px 4px 0 #0a1428; padding: 8px 14px; background: #0a1428cc; }
#tennis .tp-fx .word:empty { display: none; }
#tennis .tp-fx .word.perfect { color: #ffd23f; }
#tennis .tp-fx .word.miss { color: #ff8a75; }
#tennis .tp-note { font-family: "FoxBox Soft", ui-rounded, system-ui, sans-serif; font-weight: 700; font-size: 15px; color: #ffb4a6; }
#tennis .tp-note:empty { display: none; }
#tennis .tp-br { display: flex; flex-direction: column; gap: 6px; font-size: 10px; text-align: left; }
#tennis .tp-br .rn { color: #ffd23f; margin-top: 6px; }
#tennis .tp-br .m { display: grid; grid-template-columns: minmax(0,1fr) 22px minmax(0,1fr) 44px; gap: 6px; align-items: baseline; }
#tennis .tp-br .m span { font-family: "FoxBox Soft", ui-rounded, system-ui, sans-serif; font-weight: 700; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#tennis .tp-br .m .lost { opacity: 0.45; text-decoration: line-through; }
#tennis .tp-br .m.me { background: #35d07f33; }
/* the intro cards (1 MAKE ROOM, 2 HOLD ON TIGHT, 3 HOW TO SWING + PLAY): one dark panel in place of every other screen */
#tennis .ti { display: none; flex: 1; min-height: 0; flex-direction: column; align-items: center; justify-content: center; gap: 14px; margin: 4px;
  padding: 14px 12px 22px; text-align: center; box-sizing: border-box; background: #101125; color: #fff9f1;
  box-shadow: 0 -4px 0 0 #0a1428, 0 4px 0 0 #0a1428, -4px 0 0 0 #0a1428, 4px 0 0 0 #0a1428, inset 0 0 0 3px #ffffff2e; }
#tennis .tp[data-screen="card1"] .ti, #tennis .tp[data-screen="card2"] .ti, #tennis .tp[data-screen="ready"] .ti { display: flex; }
#tennis .ti [hidden] { display: none !important; }
#tennis .ti-step { font-size: 9px; line-height: 1.4; color: #a4a1a7; }
#tennis .ti-title { font-size: clamp(18px, 5.8vw, 23px); line-height: 1.3; color: #ffd23f; }
#tennis .ti-pic { background: #101125; max-width: 100%; }
#tennis .ti-pic canvas { display: block; width: ${PIC_W * 2}px; max-width: 100%; height: auto; aspect-ratio: ${PIC_W} / ${PIC_H}; image-rendering: pixelated; }
#tennis .ti-label { font-size: 12px; line-height: 1.4; color: #ffd23f; }
#tennis .ti-words { font-family: "FoxBox Soft", ui-rounded, system-ui, sans-serif; font-weight: 700; font-size: 20px; line-height: 1.3; max-width: 320px; }
#tennis .ti .tp-btn { align-self: stretch; margin: 0 6px; }
#tennis .ti-ok { min-height: 64px; font-size: 24px; }
#tennis .ti .tp-state { align-self: stretch; margin: 0 6px; min-height: 110px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; }
#tennis .ti .tp-hand { margin-top: 6px; }
#tennis .ti .tp-hand .tp-btn, #tennis .ti .tp-link { align-self: auto; margin: 0; }
#tennis .ti .tp-link { align-self: center; }
@media (max-height: 700px) {
  #tennis .ti { gap: 9px; padding: 8px 12px 16px; }
  #tennis .ti .tp-play-btn, #tennis .ti .tp-state { min-height: 68px; }
  #tennis .ti-words { font-size: 18px; }
}
/* fit only (nothing is redrawn): motion blocked adds a note + a button to card 3, so the words make way on all but tall
   phones; a short phone (an iPhone SE inside Safari is ~550 px tall) shows the same picture at 1.5 px per art pixel */
@media (max-height: 780px) {
  #tennis .ti.trouble .ti-words { display: none; }
}
@media (max-height: 600px) {
  #tennis .ti-pic canvas { width: ${PIC_W * 1.5}px; }
  #tennis .ti.trouble .ti-step, #tennis .ti.trouble .ti-label { display: none; }
}
`;

export function createTennisPad(root, { send, me }) {
  if (!document.getElementById("tennis-pad-css")) {
    const st = document.createElement("style");
    st.id = "tennis-pad-css";
    st.textContent = CSS;
    document.head.append(st);
  }
  root.innerHTML = `
  <div class="tp" data-test="tennis-screen" data-screen="wait">
    <div class="tp-head tp-frame"><span class="tp-label">FOX TENNIS</span><span class="tp-you"></span></div>
    <div class="tp-score tp-frame" data-test="tennis-score" hidden></div>
    <section class="tp-s tp-wait">
      <div class="tp-big tp-wait-title"></div>
      <div class="tp-mid tp-wait-sub"></div>
    </section>
    <section class="ti" data-test="tennis-intro" data-card="0">
      <div class="ti-step" data-test="tennis-step"></div>
      <div class="ti-title" data-test="tennis-card-title"></div>
      <div class="ti-pic"></div>
      <div class="ti-label" hidden>FOREHAND</div>
      <div class="ti-words" data-test="tennis-words"></div>
      <button type="button" class="tp-btn ti-ok" data-test="tennis-ok" data-native>OK</button>
      <button type="button" class="tp-btn tp-play-btn" data-test="tennis-play" data-native hidden>PLAY</button>
      <div class="tp-state tp-frame" data-test="tennis-ready" hidden>HOLD STILL...</div>
      <div class="tp-hand" hidden><button type="button" class="tp-btn" data-hand="right" data-native data-test="tennis-righty">RIGHTY</button><button type="button" class="tp-btn" data-hand="left" data-native data-test="tennis-lefty">LEFTY</button></div>
      <div class="tp-note"></div>
      <button type="button" class="tp-btn tp-link tp-tapmode" data-test="tennis-tapmode" data-native hidden>USE TAP TO SWING</button>
    </section>
    <section class="tp-s tp-play">
      <div class="tp-cue tp-frame" data-test="tennis-cue"></div>
      <div class="tp-mid tp-play-sub"></div>
      <button type="button" class="tp-btn tp-tap" data-test="tennis-tap" hidden>SWING!</button>
    </section>
    <div class="tp-fx" data-test="tennis-fx"><div class="bg"></div><div class="meter"></div><div class="word" data-test="tennis-verdict"></div></div>
    <section class="tp-s tp-point">
      <div class="tp-mid tp-pt-who"></div>
      <div class="tp-big tp-pt-title"></div>
      <div class="tp-mid tp-pt-call"></div>
    </section>
    <section class="tp-s tp-bracket">
      <div class="tp-big tp-br-title">TOURNAMENT</div>
      <div class="tp-br tp-frame"></div>
      <div class="tp-mid tp-br-me"></div>
    </section>
  </div>`;
  const $ = (s) => root.querySelector(s);
  const el = {
    tp: $(".tp"), label: $(".tp-label"), you: $(".tp-you"), score: $(".tp-score"),
    waitTitle: $(".tp-wait-title"), waitSub: $(".tp-wait-sub"),
    ti: $(".ti"), step: $(".ti-step"), cardTitle: $(".ti-title"), pic: $(".ti-pic"), cardLabel: $(".ti-label"), words: $(".ti-words"), ok: $(".ti-ok"), handRow: $(".tp-hand"),
    play: $(".tp-play-btn"), state: $(".tp-state"), note: $(".tp-note"), tapmode: $(".tp-tapmode"), hands: [...root.querySelectorAll("[data-hand]")],
    cue: $(".tp-cue"), playSub: $(".tp-play-sub"), tap: $(".tp-tap"),
    fx: $(".tp-fx"), meter: $(".tp-fx .meter"), word: $(".tp-fx .word"),
    ptWho: $(".tp-pt-who"), ptTitle: $(".tp-pt-title"), ptCall: $(".tp-pt-call"), brTitle: $(".tp-br-title"), br: $(".tp-br"), brMe: $(".tp-br-me"),
  };
  let shown = false, status = null, view = null, screen = "off";
  let motion = "off"; // off | asking | on | denied | unavailable | insecure | nodata | tap
  let ready = false, lastSwing = null, swings = 0, hand = "right";
  // the intro: a "lobby" status arms it; the next time the pad shows, the cards run 1 -> 2 -> 3 (card = the one showing, 0 = none)
  let armed = false, card = 0;
  try { hand = localStorage.getItem("fox-tennis-hand") === "left" ? "left" : "right"; } catch {}
  const tuned = tuneFromUrl(); // ?swing.OPEN_DPS=350 ... (phone/swing.js SWING)
  const sync = createClockSync();
  const det = createSwingDetector({ ios: isIOS, hand, onSwing: (s) => swingOut(s), onStill: () => setReady(true) });

  // ── sound: a whoosh for the swing, a tick on READY, a chime when the ball is yours (the phone only) ──
  let ac = null;
  function audio() {
    const Cx = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Cx) return null;
    try { if (!ac) ac = new Cx(); if (ac.state === "suspended") ac.resume().catch(() => {}); } catch { return null; }
    return ac;
  }
  function tone(f, dur, { type = "square", gain = 0.05, delay = 0 } = {}) {
    const c = audio();
    if (!c || c.state !== "running") return;
    const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function whoosh(power) {
    const c = audio();
    if (!c || c.state !== "running") return;
    const dur = 0.26, t = c.currentTime, buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / d.length);
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf; f.type = "bandpass"; f.Q.value = 1.2;
    f.frequency.setValueAtTime(600, t); f.frequency.exponentialRampToValueAtTime(1800 + power * 2400, t + dur * 0.6);
    g.gain.setValueAtTime(0.25 + power * 0.35, t);
    src.connect(f).connect(g).connect(c.destination); src.start(t); src.stop(t + dur + 0.02);
  }
  const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch {} };
  // ── swing feedback: a flash in your colour + a power bar the moment the phone sees the swing, then the TV's verdict
  // (PERFECT! / EARLY / LATE / MISS) when it comes back. Haptics where the phone has them (Android; iPhones have none
  // for the web, so the flash is the main cue). ──
  const BAR = ["#5bb2ff", "#5bb2ff", "#35d07f", "#35d07f", "#ffd23f", "#ffd23f", "#ff9b3d", "#ff5a3c"];
  let fxTimer = 0, lastCueId = null, verdict = null;
  function flash(power, word = "", cls = "") {
    el.fx.style.setProperty("--tp-fx", view?.you?.color || "#35d07f");
    const n = Math.max(1, Math.round(power * 8));
    el.meter.innerHTML = BAR.map((c, i) => `<i class="${i < n ? "on" : ""}" style="--c:${c}"></i>`).join("");
    el.meter.hidden = power <= 0;
    el.word.textContent = word;
    el.word.className = `word ${cls}`;
    el.fx.classList.toggle("word-on", !!word);
    el.fx.classList.remove("on");
    void el.fx.offsetWidth; // restart the flash animation
    el.fx.classList.add("on");
    clearTimeout(fxTimer);
    fxTimer = setTimeout(() => el.fx.classList.remove("on"), word ? 1300 : 650);
  }
  function showVerdict(c) {
    const cls = c.quality === "perfect" ? "perfect" : c.quality === "early" || c.quality === "late" ? "" : "miss";
    verdict = { ...c };
    flash(c.power || 0, c.text, cls);
    buzz(cls === "perfect" ? [20, 40, 20, 40, 60] : cls === "miss" ? [140] : [35]);
  }
  for (const ev of ["touchend", "pointerup", "click"]) root.addEventListener(ev, () => audio(), { passive: true });

  // ── the TV's clock: ping every 2 s (5 quick ones after show), keep the shortest round trip ──
  let pingTimer = null;
  const ping = () => send({ type: "ping", c: performance.now() });
  function pings(on) {
    clearInterval(pingTimer);
    pingTimer = null;
    if (!on) return;
    for (let i = 0; i < 5; i++) setTimeout(ping, i * 150);
    pingTimer = setInterval(ping, 2000);
  }
  const tvTime = (phoneMs) => (sync.offset == null ? null : phoneMs + sync.offset);

  // ── motion ──
  const hasMotion = typeof window.DeviceMotionEvent !== "undefined";
  const needsPermission = hasMotion && typeof DeviceMotionEvent.requestPermission === "function";
  let permission = needsPermission ? "unknown" : "granted", listening = false, gotData = false, noDataTimer = null;
  const MOTION_MSG = { on: "granted", denied: "denied", unavailable: "unavailable", insecure: "insecure", asking: "prompt", tap: "tap" };
  function setMotion(m) {
    if (motion === m) return;
    motion = m;
    if (m === "on" || m === "tap") card = 0; // PLAY did its job: the intro is over
    if (MOTION_MSG[m]) send({ type: "motion", state: MOTION_MSG[m] });
    render();
  }
  function onMotion(e) {
    if (document.hidden) return;
    const gi = e.accelerationIncludingGravity || {}, rr = e.rotationRate || {}, acc = e.acceleration;
    if (![gi.x, gi.y, gi.z, rr.alpha, rr.beta, rr.gamma].some(fin)) return;
    if (!gotData) { gotData = true; clearTimeout(noDataTimer); if (motion !== "on") setMotion("on"); }
    det.feed({ t: fin(e.timeStamp) && e.timeStamp > 0 ? e.timeStamp : performance.now(), gi, rr, acc: acc && [acc.x, acc.y, acc.z].some(fin) ? acc : null });
  }
  function listen(on) {
    if (on && !listening) { listening = true; window.addEventListener("devicemotion", onMotion); }
    else if (!on && listening) { listening = false; window.removeEventListener("devicemotion", onMotion); }
  }
  function motionOn() {
    gotData = false;
    clearTimeout(noDataTimer);
    if (!window.isSecureContext && location.hostname !== "127.0.0.1" && location.hostname !== "localhost") return setMotion("insecure");
    if (!hasMotion) return setMotion("unavailable");
    const go = () => {
      setMotion("on");
      listen(true);
      det.resetStill();
      noDataTimer = setTimeout(() => { if (!gotData) setMotion("nodata"); }, 1800);
    };
    if (permission === "granted") return go();
    setMotion("asking");
    let p;
    try { p = DeviceMotionEvent.requestPermission(); } catch { return setMotion("denied"); } // must run inside the click
    Promise.resolve(p).then((res) => { permission = res === "granted" ? "granted" : "denied"; permission === "granted" ? go() : setMotion("denied"); }, () => setMotion("denied"));
  }
  function setReady(on) {
    if (ready === on) return;
    ready = on;
    send({ type: "ready", ready: on });
    if (on) { tone(1320, 0.07, { gain: 0.06 }); tone(1760, 0.09, { gain: 0.05, delay: 0.08 }); buzz(40); }
    render();
  }
  function swingOut(s) {
    // the TV only cares while we're on court; the moment goes out on the TV's clock
    if (!view || !view.you?.playing || !["serve", "serve2", "rally"].includes(view.phase)) return;
    const at = tvTime(s.t);
    lastSwing = { ...s, at, offset: sync.offset, rtt: sync.rtt };
    swings++;
    send({ type: "swing", at, power: s.power, stroke: s.stroke, peakDps: s.peakDps, peakLin: s.peakLin, yaw: s.yaw, tap: !!s.tap });
    whoosh(s.power);
    buzz(s.power > SWING_HARD ? [70, 30, 45] : s.power > 0.35 ? [50] : [25]);
    flash(s.power);
    render();
  }

  // ── buttons ──
  el.ok.addEventListener("click", () => { if (card === 1 || card === 2) { card++; render(); } }); // cards move on by a tap only
  el.play.addEventListener("click", () => {
    audio();
    send({ type: "hand", hand });
    motionOn();
    render();
  });
  for (const b of el.hands) b.addEventListener("click", () => {
    hand = b.dataset.hand === "left" ? "left" : "right";
    try { localStorage.setItem("fox-tennis-hand", hand); } catch {}
    det.setHand(hand);
    send({ type: "hand", hand });
    render();
  });
  el.tapmode.addEventListener("click", () => { listen(false); setMotion("tap"); setReady(true); });
  el.tap.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    el.tap.classList.add("down");
    swingOut({ t: performance.now(), power: 0.55, stroke: null, peakDps: 0, peakLin: 0, yaw: 0, tap: true });
  });
  for (const t of ["pointerup", "pointercancel"]) el.tap.addEventListener(t, () => el.tap.classList.remove("down"));

  // ── the intro cards' picture: one canvas, drawn every frame while a card shows; each card's loop starts when it appears ──
  let pic = null, picCard = 0, picT0 = 0, picRaf = 0;
  function drawCard(n, tSec) {
    const t = ((tSec % LOOP) + LOOP) % LOOP, mirrored = n === 3 ? hand !== "left" : true; // cards 1-2 are drawn for a righty; card 3 follows RIGHTY / LEFTY
    try {
      if (!pic) { pic = makePic(PIC_W, PIC_H, PAL); el.pic.append(pic.canvas); }
      let alpha = 1;
      pic.render((ctx) => { alpha = SCENES[n - 1](ctx, t, mirrored); });
      pic.canvas.style.opacity = String(Math.round(alpha * 100) / 100);
      pic.canvas.style.transform = mirrored ? "scaleX(-1)" : "";
    } catch {} // (a phone that cannot draw it still gets the words and the buttons)
    if (n === 3) { const word = t < HALF ? "FOREHAND" : "BACKHAND"; if (el.cardLabel.textContent !== word) el.cardLabel.textContent = word; }
  }
  function picFrame() {
    picRaf = 0;
    if (!picCard) return;
    drawCard(picCard, (performance.now() - picT0) / 1000);
    picRaf = requestAnimationFrame(picFrame);
  }
  function showCard(n) {
    if (n === picCard) return;
    picCard = n;
    el.ti.dataset.card = String(n);
    if (picRaf) cancelAnimationFrame(picRaf);
    picRaf = 0;
    if (n) { picT0 = performance.now(); picFrame(); }
  }

  // ── the TV's view -> the screen ──
  let lastBallKey = "";
  function onView(v) {
    if (view && v.roundId === view.roundId && v.seq <= view.seq) return;
    const fresh = !view || v.roundId !== view.roundId;
    view = v;
    // a new game on the TV knows nothing about this phone: after PLAY (a rematch without the lobby keeps the gyro + READY,
    // you're still holding it; or PLAY tapped before the first view) tell it the hand, the motion state and READY again.
    // Not while armed: a round from the lobby opens with the cards, and its first view can arrive before the pad is shown.
    if (fresh && motion !== "off" && !armed) {
      send({ type: "hand", hand });
      if (MOTION_MSG[motion]) send({ type: "motion", state: MOTION_MSG[motion] });
      if (ready) send({ type: "ready", ready: true });
    }
    const key = v.yourBall ? `${v.match?.no}:${v.match?.games}:${v.match?.points}:${v.stroke}` : "";
    if (key && key !== lastBallKey) { tone(988, 0.06, { gain: 0.04 }); buzz(25); }
    lastBallKey = key;
    if (v.cue && v.cue.id !== lastCueId) { lastCueId = v.cue.id; showVerdict(v.cue); }
    render();
  }
  function screenNow() {
    if (!shown) return "off";
    const v = view;
    if (v && v.phase === "done") return "done";
    if (card) return card < 3 ? `card${card}` : "ready"; // the intro: on every phone, whatever the TV is doing ("ready" = card 3, with PLAY)
    if (!v || !status || status.state === "countdown") return "wait";
    if (v.phase === "bracket") return "bracket";
    if (!v.you?.playing) return v.bracket ? "bracket" : "wait";
    const needReady = !ready && motion !== "tap";
    if (needReady && motion !== "on") return "ready"; // no PLAY yet (a reload mid-match) or motion is blocked: card 3 stays up, the play screens would be a lie
    if (v.phase === "intro" || needReady && ["serve", "serve2"].includes(v.phase)) return needReady ? "ready" : "wait";
    if (v.phase === "point" || v.phase === "game" || v.phase === "matchEnd") return "point";
    return "play";
  }
  function render() {
    const next = screenNow();
    screen = next;
    el.tp.dataset.screen = screen === "off" ? "wait" : screen;
    const v = view;
    const set = (n, t) => { if (n.textContent !== t) n.textContent = t; };
    const html = (n, h) => { if (n.dataset.h !== h) { n.innerHTML = h; n.dataset.h = h; } };
    set(el.you, v?.you ? v.you.name : "");
    const m = v?.match;
    set(el.label, m ? m.label : v?.gameName || "FOX TENNIS");
    const cardNo = screen === "card1" ? 1 : screen === "card2" ? 2 : screen === "ready" ? 3 : 0;
    el.score.hidden = !m || screen === "bracket" || screen === "done" || cardNo > 0;
    showCard(cardNo);
    if (m) {
      const deuce = m.points[0] >= 3 && m.points[1] >= 3;
      const pt = (i) => (m.pointsText ? m.pointsText[i] : deuce ? "40" : PT[Math.min(3, m.points[i])]);
      html(el.score, m.teams.map((t, i) => `<i class="${m.server.side === i ? "sv" : ""}"></i><span class="nm" style="color:${esc(readable(t.players[0].color))}">${esc(t.name)}</span><span class="gm">${m.games[i]}</span><span class="pt">${esc(pt(i))}</span>`).join(""));
    }
    if (screen === "wait") {
      // a waiting phone says what it knows, or nothing: no filler lines, nothing that sends you to the TV (Lakota, Nov 9).
      // A player waits here before a match's first serve: who serves first + who plays whom; someone sitting out: WATCHING.
      const sv = v?.phase === "intro" ? m?.server : null, mine = !!sv && sv.playerId === v.you?.playerId;
      set(el.waitTitle, !m ? "" : v.you?.playing ? (mine ? "YOU SERVE FIRST" : sv ? `${sv.name} SERVES FIRST` : "") : "WATCHING");
      set(el.waitSub, m ? `${m.teams[0].name} VS ${m.teams[1].name}` : "");
    } else if (cardNo) {
      const c = CARDS[cardNo - 1], last = cardNo === 3;
      html(el.step, `BEFORE YOU SWING&nbsp;&nbsp;${cardNo}/3`);
      set(el.cardTitle, c.title);
      html(el.words, c.words);
      const on = motion === "on" && gotData, asked = motion === "on" || motion === "asking";
      el.ok.hidden = last;
      el.cardLabel.hidden = !last;
      el.play.hidden = !last || asked;
      el.state.hidden = !last || !asked;
      el.handRow.hidden = !last;
      el.state.classList.toggle("on", ready);
      el.state.dataset.ready = ready ? "1" : "0";
      set(el.state, ready ? "READY!" : motion === "asking" ? "TAP ALLOW..." : on ? "HOLD STILL..." : "WAITING FOR MOTION...");
      for (const b of el.hands) b.classList.toggle("on", b.dataset.hand === hand);
      const trouble = last && ["denied", "insecure", "unavailable", "nodata"].includes(motion);
      set(el.note, !trouble ? "" : motion === "denied" ? "Motion is blocked. Tap PLAY again, or play with taps." : motion === "insecure" ? "Motion needs the secure link: scan the TV's QR code again."
        : motion === "unavailable" ? "No motion sensor here: play with taps!" : "No motion readings (Settings > Safari > Motion & Orientation Access).");
      el.tapmode.hidden = !trouble;
      el.ti.classList.toggle("trouble", trouble);
    } else if (screen === "play") {
      let cue = "", cls = "", sub = "";
      if (v.yourServe) { cue = "YOUR SERVE: SWING!"; cls = "serve"; sub = v.match.serveN === 2 ? "SECOND SERVE" : "SWING WHEN THE BALL IS UP"; }
      else if (v.yourBall && v.smash) { cue = "▲ SMASH IT! ▲"; cls = "smash"; sub = "HIGH BALL: SWING HARD"; }
      else if (v.yourBall) {
        // the side only matters when the TV says so (src/config.js WRONG_SIDE); the arrow still shows where the ball is
        cue = v.sideMatters ? (v.stroke === "backhand" ? "◀ BACKHAND!" : "FOREHAND! ▶") : v.stroke === "backhand" ? "◀ SWING!" : "SWING! ▶";
        cls = "hot"; sub = "SWING AS IT REACHES YOU";
      }
      else if (v.phase === "serve" || v.phase === "serve2") cue = `${esc(v.match.server.name)} SERVES`; // (stands alone: no line under it)
      else if (v.phase === "rally") cue = "RALLY!"; // (stands alone: no line under it)
      set(el.cue, cue);
      el.cue.className = `tp-cue tp-frame ${cls}`;
      set(el.playSub, sub);
      el.tap.hidden = motion !== "tap";
    } else if (screen === "point") {
      const last = v.last;
      set(el.ptWho, last ? (last.wonByYou ? "YOUR POINT!" : "THEIR POINT") : "");
      set(el.ptTitle, v.banner?.title || last?.title || "");
      set(el.ptCall, v.banner?.sub || last?.call || "");
      el.ptWho.style.color = last?.wonByYou ? "#35d07f" : "#ff8a75";
    } else if (screen === "bracket" || screen === "done") {
      const b = v.bracket;
      set(el.brTitle, screen === "done" ? (b?.champion ? `${b.champion} WINS!` : "GAME OVER") : b ? "TOURNAMENT" : "WATCHING");
      if (b) {
        const pid = v.you?.playerId;
        html(el.br, b.rounds.map((r) => `<div class="rn">${esc(r.name)}</div>` + r.matches.filter((x) => !x.bye).map((x) => {
          const cl = (id) => (x.winner != null && x.winner !== id ? "lost" : "");
          return `<div class="m${x.aId === pid || x.bId === pid ? " me" : ""}"><span class="${cl(x.aId)}" style="color:${esc(readable(x.ac || "#8d9bbb"))}">${esc(x.a || "...")}</span><b>VS</b><span class="${cl(x.bId)}" style="color:${esc(readable(x.bc || "#8d9bbb"))}">${esc(x.b || "...")}</span><b>${esc(x.score || (x.now ? "NOW" : x.next ? "NEXT" : ""))}</b></div>`;
        }).join("")).join(""));
      }
      set(el.brMe, "");
    }
  }

  window.__tennisPad = {
    get screen() { return screen; }, get motion() { return motion; }, get ready() { return ready; }, get hand() { return hand; },
    /** the intro card showing (1 / 2 / 3, 0 = none), whether the next show starts the cards, whether the gyro is being read */
    get card() { return picCard; }, get armed() { return armed; }, get listening() { return listening; },
    /** QA: draw the showing card's picture at loop time t (seconds). */
    drawCard(t) { if (picCard) drawCard(picCard, t); },
    get lastSwing() { return lastSwing && { ...lastSwing }; }, get swings() { return swings; },
    get offset() { return sync.offset; }, get verdict() { return verdict && { ...verdict }; }, get tune() { return { ...SWING, changed: tuned }; }, get rtt() { return sync.rtt; }, get view() { return view && JSON.parse(JSON.stringify(view)); },
    /** QA: a swing through the same path as the detector (timed now on this phone's clock). */
    fakeSwing({ power = 0.6, stroke = "forehand" } = {}) { swingOut({ t: performance.now(), power, stroke, peakDps: 0, peakLin: 0, yaw: 0, fake: true }); },
    /** QA: feed a raw reading to the detector. */
    feed(s) { det.feed(s); },
  };

  return {
    onMessage(m) {
      if (!m) return;
      if (m.type === "pong") sync.pong(m.c, m.s, performance.now());
      else if (m.type === "view") onView(m);
    },
    show(on, st) {
      status = st || null;
      if (status && status.state === "lobby") armed = true; // tennis was picked in the lobby: the next round opens with the cards
      const was = shown;
      shown = !!on;
      if (shown && !was) {
        if (armed) {
          // a round from the lobby = a new game on the TV: card 1, and PLAY (on card 3) turns the gyro on again
          armed = false; card = 1; view = null; ready = false; motion = "off"; gotData = false;
          clearTimeout(noDataTimer);
        } else if (motion === "on") listen(true); // back on screen in the same round, or a rematch without the lobby: keep swinging
        send({ type: "hello" });
        pings(true);
      }
      if (!shown && was) { pings(false); listen(false); }
      if (shown) render();
      else { screen = "off"; showCard(0); }
    },
    release() {},
  };
}
