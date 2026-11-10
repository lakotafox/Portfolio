/**
 * pad-skin.js — FoxBox's pixel gamepads: one shared skin for every game's phone controller.
 *
 * Lakota (Nov 1) picked five pixel-art pads (scratchpad controllers/controller-looks-r2.html) and asked for the pad to be
 * part of the player's profile, chosen next to the name. CLASSIC = today's controllers, untouched: a game that sees
 * skinId() === "classic" must not create a skin at all (a true pass-through).
 *
 * The look is drawn into a small pixel buffer (≈ 200×96 "art pixels") that is scaled up by a whole number of DEVICE
 * pixels with nearest-neighbour, so the pixels stay square and crisp on any phone. The grid grows/shrinks with the
 * phone's shape (iPhone SE ≈ 191×107, iPhone 15 213×99, 20:9 Android ≈ 219×99) and every layout is anchored to the
 * safe area (notch / Dynamic Island sides, home bar), so no control sits under them.
 *
 *   import { createPadSkin, skinId } from "./pad-skin.js";
 *   const pad = createPadSkin(hostEl, { style: skinId(), game: "sky", onInput(ev) { … } });
 *     ev = { type: "press", name, down }                       // a button / key / pill / cross arm
 *        | { type: "move", name, x, y, active }                // a slider ("slide": x −1..1) or stick ("stick": x, y −1..1)
 *   pad.set({ name, color, label, … })   // what the layout shows (per game, see LAYOUTS); redraws only if it changed
 *   pad.hold(name, on)                    // show a button pressed from outside (keyboard, the game's own state)
 *   pad.setStyle(id) / pad.setGame(id) / pad.release() / pad.layout() / pad.destroy()
 *   pad.regions                           // the current hit regions (grid coords) — what the touch code uses
 *   pad.el                                // the canvas (absolutely positioned over hostEl, which should be the full screen)
 *
 * Input runs in the pointer handlers (the callback fires before anything is drawn); drawing waits for the next
 * animation frame and only happens when something changed. The body art (the slow part) is cached per size+style.
 *
 * The profile: skinId() / setSkinId(id) (localStorage "foxbox-pad-skin", default FOXBOX), "foxbox:pad-skin" event on
 * window when it changes. mountSkinPicker(el, { value, onChange }) is the CONTROLLER choice for the name screens.
 */

// ── the profile ─────────────────────────────────────────────────────────────────────────────────────────────
export const SKIN_KEY = "foxbox-pad-skin";
export const DEFAULT_SKIN = "foxbox";
export const SKINS = [
  { id: "foxbox", name: "FOXBOX" },
  { id: "brick", name: "BRICK" },
  { id: "sixteen", name: "SIXTEEN" },
  { id: "homecomp", name: "HOME COMPUTER" },
  { id: "smoke", name: "SMOKE" },
  { id: "classic", name: "CLASSIC" },
];
const SKIN_IDS = SKINS.map((s) => s.id);
export const validSkin = (id) => (SKIN_IDS.includes(id) ? id : DEFAULT_SKIN);
export function skinId() {
  try {
    const v = new URLSearchParams(location.search).get("pad"); // ?pad=brick — tests and previews
    if (v && SKIN_IDS.includes(v)) return v;
  } catch {}
  try {
    return validSkin(localStorage.getItem(SKIN_KEY));
  } catch {
    return DEFAULT_SKIN;
  }
}
export function setSkinId(id) {
  id = validSkin(id);
  try {
    localStorage.setItem(SKIN_KEY, id);
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent("foxbox:pad-skin", { detail: { id } }));
  } catch {}
  return id;
}
/** true when the player wants a pixel pad (anything but CLASSIC). */
export const skinOn = (id = skinId()) => id !== "classic";

// ── the pixel buffer (module-level while one surface draws; drawing is synchronous) ─────────────────────────
let W = 208, H = 96, BUF = null;
const CC = new Map();
const col = (h) => {
  let v = CC.get(h);
  if (v === undefined) {
    const n = parseInt(h.slice(1), 16);
    v = ((255 << 24) | ((n & 255) << 16) | (((n >> 8) & 255) << 8) | ((n >> 16) & 255)) >>> 0;
    CC.set(h, v);
  }
  return v;
};
const P = (x, y, c) => {
  x |= 0; y |= 0;
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  BUF[y * W + x] = col(c);
};
const R = (x, y, w, h, c) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) P(i, j, c); };
const each = (m, bb, fn) => {
  const y0 = Math.max(0, bb[1] | 0), y1 = Math.min(H, Math.ceil(bb[3])), x0 = Math.max(0, bb[0] | 0), x1 = Math.min(W, Math.ceil(bb[2]));
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (m(x, y)) fn(x, y);
};
const fill = (m, bb, c) => { const v = col(c); each(m, bb, (x, y) => { BUF[y * W + x] = v; }); };
const disc = (x0, y0, d) => { const cx = x0 + d / 2, cy = y0 + d / 2, rr = (d / 2) * (d / 2) - d * 0.1; return (x, y) => { const dx = x + .5 - cx, dy = y + .5 - cy; return dx * dx + dy * dy <= rr; }; };
const rrect = (x0, y0, w, h, r) => (x, y) => { if (x < x0 || y < y0 || x >= x0 + w || y >= y0 + h) return false; const px = x + .5, py = y + .5; const qx = Math.max(x0 + r - px, 0, px - (x0 + w - r)), qy = Math.max(y0 + r - py, 0, py - (y0 + h - r)); return qx * qx + qy * qy <= r * r - r * .2; };
const shift = (m, dx, dy) => (x, y) => m(x - dx, y - dy);
const grow = (m) => (x, y) => m(x, y) || m(x - 1, y) || m(x + 1, y) || m(x, y - 1) || m(x, y + 1);
const bbD = (x0, y0, d, p = 4) => [Math.floor(x0) - p, Math.floor(y0) - p, Math.ceil(x0 + d) + p, Math.ceil(y0 + d) + p];
const bbR = (x, y, w, h, p = 4) => [x - p, y - p, x + w + p, y + h + p];
const all = () => [0, 0, W, H];

// ── bitmap fonts: 5×7 (big) and 3×5 (small), rows as bit masks ──────────────────────────────────────────────
const FB = {A:[14,17,17,31,17,17,17],B:[30,17,17,30,17,17,30],C:[14,17,16,16,16,17,14],D:[30,17,17,17,17,17,30],E:[31,16,16,30,16,16,31],F:[31,16,16,30,16,16,16],G:[14,17,16,23,17,17,15],H:[17,17,17,31,17,17,17],I:[14,4,4,4,4,4,14],J:[7,2,2,2,2,18,12],K:[17,18,20,24,20,18,17],L:[16,16,16,16,16,16,31],M:[17,27,21,21,17,17,17],N:[17,17,25,21,19,17,17],O:[14,17,17,17,17,17,14],P:[30,17,17,30,16,16,16],Q:[14,17,17,17,21,18,13],R:[30,17,17,30,20,18,17],S:[15,16,16,14,1,1,30],T:[31,4,4,4,4,4,4],U:[17,17,17,17,17,17,14],V:[17,17,17,17,17,10,4],W:[17,17,17,21,21,21,10],X:[17,17,10,4,10,17,17],Y:[17,17,10,4,4,4,4],Z:[31,1,2,4,8,16,31],"0":[14,17,19,21,25,17,14],"1":[4,12,4,4,4,4,14],"2":[14,17,1,2,4,8,31],"3":[31,2,4,2,1,17,14],"4":[2,6,10,18,31,2,2],"5":[31,16,30,1,1,17,14],"6":[6,8,16,30,17,17,14],"7":[31,1,2,4,8,8,8],"8":[14,17,17,14,17,17,14],"9":[14,17,17,15,1,2,12],"!":[4,4,4,4,4,0,4],"?":[14,17,1,2,4,0,4],"'":[4,4,8,0,0,0,0],".":[0,0,0,0,0,12,12],":":[0,12,12,0,12,12,0],"-":[0,0,0,31,0,0,0],"/":[1,1,2,4,8,16,16],"+":[0,4,4,31,4,4,0]};
const FS = {A:[2,5,7,5,5],B:[6,5,6,5,6],C:[3,4,4,4,3],D:[6,5,5,5,6],E:[7,4,6,4,7],F:[7,4,6,4,4],G:[3,4,5,5,3],H:[5,5,7,5,5],I:[7,2,2,2,7],J:[1,1,1,5,2],K:[5,5,6,5,5],L:[4,4,4,4,7],M:[5,7,7,5,5],N:[6,5,5,5,5],O:[2,5,5,5,2],P:[6,5,6,4,4],Q:[2,5,5,6,3],R:[6,5,6,5,5],S:[3,4,2,1,6],T:[7,2,2,2,2],U:[5,5,5,5,7],V:[5,5,5,5,2],W:[5,5,7,7,5],X:[5,5,2,5,5],Y:[5,5,2,2,2],Z:[7,1,2,4,7],"0":[7,5,5,5,7],"1":[2,6,2,2,7],"2":[6,1,2,4,7],"3":[6,1,2,1,6],"4":[5,5,7,1,1],"5":[7,4,6,1,6],"6":[3,4,7,5,7],"7":[7,1,2,2,2],"8":[7,5,7,5,7],"9":[7,5,7,1,6],":":[0,2,0,2,0],"/":[1,1,2,4,4],".":[0,0,0,0,2],"-":[0,0,7,0,0],"!":[2,2,2,0,2],"?":[6,1,2,0,2],"'":[2,2,0,0,0],",":[0,0,0,2,4],"+":[0,2,7,2,0],"#":[5,7,5,7,5],"&":[2,5,2,5,3],"<":[1,2,4,2,1],">":[4,2,1,2,4]};
/** Text the fonts can draw: upper case, unknown characters dropped. */
export const pixelText = (s) => String(s ?? "").toUpperCase().replace(/[^A-Z0-9 :/.\-!?',+#&]/g, "");
function textW(str, f, o = {}) {
  const big = f === FB, gw = big ? 5 : 3, s = o.scale || 1, adv = (gw + (o.bold ? 1 : 0) + 1) * s;
  return str.length * adv - s;
}
function text(str, cx, y, f, c, o = {}) {
  str = pixelText(str);
  const big = f === FB, gw = big ? 5 : 3, gh = big ? 7 : 5, s = o.scale || 1, bold = !!o.bold, adv = (gw + (bold ? 1 : 0) + 1) * s;
  const tot = str.length * adv - s;
  let x = o.align === "l" ? cx : o.align === "r" ? cx - tot : Math.round(cx - tot / 2);
  for (const ch of str) {
    const g = f[ch];
    if (g) for (let r = 0; r < gh; r++) for (let k = 0; k < gw; k++) if ((g[r] >> (gw - 1 - k)) & 1)
      for (let sy = 0; sy < s; sy++) for (let sx = 0; sx < s; sx++) { P(x + k * s + sx, y + r * s + sy, c); if (bold) P(x + (k + 1) * s + sx, y + r * s + sy, c); }
    x += adv;
  }
  return tot;
}
/** The longest prefix of str that fits maxW (small font), for names. */
const fitText = (str, maxW, f = FS) => { str = pixelText(str); while (str.length && textW(str, f) > maxW) str = str.slice(0, -1); return str.trim(); };
function sprite(rows, x, y, map) { rows.forEach((row, j) => [...row].forEach((ch, i) => { if (map[ch]) P(x + i, y + j, map[ch]); })); }

// ── primitives ─────────────────────────────────────────────────────────────────────────────────────────────
/** recessed area: dark lip top-left, light lip bottom-right */
function recess(m, bb, S, c = S.well) { fill(m, bb, c); each(m, bb, (x, y) => { if (!m(x, y - 1) || !m(x - 1, y)) P(x, y, S.wellLo); else if (!m(x, y - 2)) P(x, y, S.wellMid || c); else if (!m(x, y + 1) || !m(x + 1, y)) P(x, y, S.wellHi); }); }
/** raised shape: plinth shadow, 1px outline, convex bevel */
function raised(m, bb, S, pal, pressed, shadow = S.shadow) {
  fill(shift(grow(m), 0, pressed ? 1 : 2), bb, shadow);
  const mm = pressed ? shift(m, 0, 1) : m;
  fill(grow(mm), bb, S.ink);
  fill(mm, bb, pressed ? pal.mid : pal.base);
  each(mm, bb, (x, y) => {
    if (!mm(x, y - 1) || !mm(x - 1, y)) P(x, y, pressed ? pal.dk : pal.lt);
    else if (!mm(x, y + 1) || (!pressed && !mm(x, y + 2))) P(x, y, pal.dk);
    else if (!mm(x + 1, y)) P(x, y, pal.mid);
  });
  return mm;
}
/** A round concave button. o.hit grows the touch circle (grid px). o.dim = disabled look. */
function button(st, S, name, x0, y0, d, pal, label, font, o = {}) {
  const pr = st.isDown(name), off = pr ? 1 : 0, bb = bbD(x0, y0, d);
  if (o.dim) pal = S.x;
  fill(disc(x0 - 1, y0 + (pr ? 0 : 1), d + 2), bb, o.shadow || S.shadow);
  fill(disc(x0 - 1, y0 - 1 + off, d + 2), bb, S.ink);
  const rim = disc(x0, y0 + off, d); fill(rim, bb, pal.dk);
  each(rim, bb, (x, y) => { if (!rim(x, y - 1) || !rim(x - 1, y)) P(x, y, pal.mid); });
  const dish = disc(x0 + 2, y0 + 2 + off, d - 4); fill(dish, bb, pr ? pal.mid : pal.base);
  each(dish, bb, (x, y) => {
    if (!dish(x, y - 1) || !dish(x - 1, y)) P(x, y, pal.dk);
    else if (!dish(x, y - 2) || !dish(x - 2, y) || (d >= 34 && !dish(x, y - 3))) P(x, y, pal.mid);
    else if (!dish(x, y + 1) || !dish(x + 1, y) || (d >= 34 && !dish(x, y + 2))) P(x, y, pr ? pal.base : pal.lt);
  });
  if (!pr) { const rc = d / 2 - 1, cx0 = x0 + d / 2, cy0 = y0 + d / 2; [-.22, 0, .22].forEach((t) => P(Math.floor(cx0 + rc * Math.cos(3.93 + t)), Math.floor(cy0 + rc * Math.sin(3.93 + t)), pal.lt)); }
  if (label) {
    const big = font !== FS, gh = big ? 7 : 5;
    let lab = pixelText(label);
    const f = big && textW(lab, FB, { bold: d >= 50 }) > d - 8 ? FS : font || FB; // a long label on a small button: the small font
    const b2 = f === FB && d >= 50;
    text(lab, x0 + d / 2, Math.round(y0 + off + d / 2 - (f === FB ? 7 : 5) / 2), f, o.dim ? S.x.arrow : pal.txt, { bold: b2 });
    void gh;
  }
  st.region({ n: name, t: "c", cx: x0 + d / 2, cy: y0 + d / 2, r: d / 2 + (o.hit ?? 2) });
}
/** A tall rounded key (FOX KART's ITEM / GAS). */
function key(st, S, name, x, y, w, h, pal) {
  const pr = st.isDown(name), bb = bbR(x, y, w, h);
  const m = rrect(x, y, w, h, 5);
  raised(m, bb, S, pal, pr);
  const face = rrect(x + 3, y + 3 + (pr ? 1 : 0), w - 6, h - 8, 3);
  each(face, bb, (px, py) => { if (!face(px, py - 1) || !face(px - 1, py)) P(px, py, pal.mid); else if (!face(px, py + 1) || !face(px + 1, py)) P(px, py, pal.lt); });
  st.region({ n: name, t: "r", x: x - 2, y: y - 2, w: w + 4, h: h + 4 });
  return pr ? 1 : 0;
}
/** The cross pad. arms: which arms are live (default ["l","r"]); pressed arms sink. */
function cross(st, S, cx, cy, size, arm, pal, arms = ["l", "r"]) {
  const h = size / 2, a = arm / 2;
  const m = (x, y) => { const dx = Math.abs(x + .5 - cx), dy = Math.abs(y + .5 - cy);
    if (!((dx < a && dy < h) || (dy < a && dx < h))) return false;
    if ((dx > a - 1 && dy > h - 1) || (dy > a - 1 && dx > h - 1)) return false; return true; };
  const bb = [cx - h - 8, cy - h - 8, cx + h + 8, cy + h + 8];
  recess(disc(cx - h - 6, cy - h - 6, size + 12), bb, S);
  fill(shift(grow(m), 0, 2), bb, S.wellLo);
  fill(grow(m), bb, S.ink);
  fill(m, bb, pal.base);
  each(m, bb, (x, y) => { if (!m(x, y - 1) || !m(x - 1, y)) P(x, y, pal.lt); else if (!m(x, y + 1) || !m(x, y + 2)) P(x, y, pal.dk); else if (!m(x + 1, y)) P(x, y, pal.mid); });
  const armM = (side) => (x, y) => m(x, y) && (side === "l" ? x + .5 < cx - a : side === "r" ? x + .5 > cx + a : side === "u" ? y + .5 < cy - a : y + .5 > cy + a);
  for (const side of arms) { if (!st.isDown(side)) continue; const am = armM(side); fill(am, bb, pal.mid); each(am, bb, (x, y) => { if (!m(x, y - 1)) P(x, y, pal.dk); }); }
  const tri = (tx, dir, c) => { for (let i = 0; i < 5; i++) for (let j = -i; j <= i - 1; j++) P(tx + dir * i, cy + j, c); };
  const triV = (ty, dir, c) => { for (let i = 0; i < 5; i++) for (let j = -i; j <= i - 1; j++) P(cx + j, ty + dir * i, c); };
  const off = Math.round(a + (h - a) / 2) + 2;
  if (arms.includes("l")) tri(cx - off - 1, 1, pal.arrow);
  if (arms.includes("r")) tri(cx + off, -1, pal.arrow);
  if (arms.includes("u")) triV(cy - off - 1, 1, pal.arrow);
  if (arms.includes("d")) triV(cy + off, -1, pal.arrow);
  const dm = disc(cx - 3, cy - 3, 6); fill(dm, bb, pal.mid); each(dm, bb, (x, y) => { if (!dm(x, y - 1) || !dm(x - 1, y)) P(x, y, pal.dk); else if (!dm(x, y + 1)) P(x, y, pal.lt); });
  // touch: each live arm's half of the pad (generous: the whole quadrant band, out to the recess edge and beyond)
  const g = h + 6;
  if (arms.includes("l")) st.region({ n: "l", t: "r", x: cx - g - 6, y: cy - g, w: g + 6 - a + 1, h: 2 * g, arm: true });
  if (arms.includes("r")) st.region({ n: "r", t: "r", x: cx + a - 1, y: cy - g, w: g + 6 - a + 1, h: 2 * g, arm: true });
  if (arms.includes("u")) st.region({ n: "u", t: "r", x: cx - a, y: cy - g, w: arm, h: g - a, arm: true });
  if (arms.includes("d")) st.region({ n: "d", t: "r", x: cx - a, y: cy + a, w: arm, h: g - a, arm: true });
}
function cap(S, cx, cy, d, pal) {
  const x0 = cx - d / 2, y0 = cy - d / 2, m = disc(x0, y0, d), bb = bbD(x0, y0, d);
  fill(shift(grow(m), 0, 2), bb, S.wellLo); fill(grow(m), bb, S.ink); fill(m, bb, pal.base);
  each(m, bb, (x, y) => { const dx = x + .5 - cx, dy = y + .5 - cy;
    if (!m(x, y - 1) || !m(x - 1, y) || (!m(x, y - 2) && dx < 0)) P(x, y, pal.lt);
    else if (!m(x, y + 1) || !m(x + 1, y) || !m(x, y + 2)) P(x, y, pal.dk);
    else { const dd = Math.sqrt(dx * dx + dy * dy); if (Math.abs(dd - (d / 2 - 4.5)) < .5) P(x, y, dy < 0 ? pal.dk : pal.lt); } });
  const dm = disc(cx - 2.5, cy - 2.5, 5); fill(dm, bb, pal.mid); each(dm, bb, (x, y) => { if (!dm(x, y - 1)) P(x, y, pal.dk); });
}
/** A 2D stick in a round well; zone = the touch rectangle (absolute: touching anywhere in it points from the well's centre). */
function stick(st, S, name, cx, cy, Rw, pal, zone, capPal) {
  const bb = [cx - Rw - 4, cy - Rw - 4, cx + Rw + 4, cy + Rw + 4];
  const well = disc(cx - Rw, cy - Rw, Rw * 2);
  fill(grow(well), bb, S.ink); recess(well, bb, S);
  const r2 = Rw * .62; each(well, bb, (x, y) => { const dx = x + .5 - cx, dy = y + .5 - cy, dd = Math.sqrt(dx * dx + dy * dy); if (Math.abs(dd - r2) < .5 && (Math.round(Math.atan2(dy, dx) * 12) % 2 === 0)) P(x, y, S.wellHi); });
  const max = Rw - 15, v = st.val(name);
  cap(S, Math.round(cx + v.x * max), Math.round(cy + v.y * max), 28, capPal || pal);
  st.region({ n: name, t: "r", ...zone, kind: "stick", cx, cy, max });
}
/** A left/right slider; zone = the touch rectangle (absolute: left of the slider's centre steers left). */
function slider(st, S, name, x, y, w, pal, zone, capPal) {
  const m = rrect(x, y, w, 9, 4), bb = bbR(x, y, w, 9, 14);
  fill(grow(m), bb, S.ink); recess(m, bb, S);
  for (let i = 0; i <= 8; i++) { const tx = Math.round(x + 4 + i * (w - 9) / 8); R(tx, y - 4, 1, i % 4 === 0 ? 3 : 2, S.label); R(tx, y + 11 + (i % 4 === 0 ? 0 : 1), 1, i % 4 === 0 ? 3 : 2, S.label); }
  const max = w / 2 - 4, v = st.val(name);
  cap(S, Math.round(x + w / 2 + v.x * max), y + 4.5, 18, capPal || pal);
  st.region({ n: name, t: "r", ...zone, kind: "slide", cx: x + w / 2, cy: y + 4.5, max });
}
function pill(st, S, name, cx, y, w, label) {
  const pr = st.isDown(name), x = Math.round(cx - w / 2), m = rrect(x, y, w, 9, 4), bb = bbR(x, y, w, 9);
  raised(m, bb, S, S.x, pr);
  text(label, cx, y + 2 + (pr ? 1 : 0), FS, S.x.arrow);
  st.region({ n: name, t: "r", x: x - 3, y: y - 4, w: w + 6, h: 17 });
}
function gauge(S, cx, cy, r, deg) {
  const bb = [cx - r - 5, cy - r - 5, cx + r + 5, cy + 3];
  if (S.g.bg) { const m = (x, y) => { const dx = x + .5 - cx, dy = y + .5 - cy; return dy <= .5 && dx * dx + dy * dy <= (r + 4) * (r + 4); }; fill(grow(m), bb, S.ink); fill(m, bb, S.g.bg); }
  each(() => true, bb, (x, y) => { const dx = x + .5 - cx, dy = y + .5 - cy; if (dy > 0) return; const dd = Math.sqrt(dx * dx + dy * dy), an = Math.atan2(dx, -dy) * 180 / Math.PI; if (Math.abs(dd - r) < .55 && Math.abs(an) <= 70) P(x, y, S.g.ink); });
  for (let a = -60; a <= 60; a += 20) { const len = a % 60 === 0 ? 4 : 2, rad = a * Math.PI / 180; for (let t = r - len; t <= r - .5; t += .5) P(Math.floor(cx + t * Math.sin(rad)), Math.floor(cy - t * Math.cos(rad)), S.g.ink); }
  const rad = deg * Math.PI / 180; for (let t = 0; t <= r - 3; t += .35) P(Math.floor(cx + t * Math.sin(rad)), Math.floor(cy - t * Math.cos(rad)), S.g.ndl);
  fill(disc(cx - 2, cy - 2, 4), bb, S.ink);
  text("L", cx - r + 3, cy - 6, FS, S.g.ink, { align: "l" }); text("R", cx + r - 3, cy - 6, FS, S.g.ink, { align: "r" });
}
/** A small flat label plate (a recessed LCD-ish strip) for status lines. */
function plate(S, x, y, w, h) {
  const m = rrect(x, y, w, h, 2), bb = bbR(x, y, w, h, 2);
  fill(grow(m), bb, S.ink); fill(m, bb, S.hud.bg);
  each(m, bb, (px, py) => { if (!m(px, py - 1)) P(px, py, S.ink); });
}
export const ICON = {
  heart: [".X.X.", "XXXXX", "XXXXX", ".XXX.", "..X.."],
  coin: [".XXX.", "XWXXX", "XXOXX", "XXXOX", ".XXX."],
  gem: ["..X..", ".XXX.", "XXOXX", ".XXX.", "..X.."],
  fox: ["X.......X", "XX.....XX", "XOXXXXXOX", "XOOOOOOOX", "XOKOOOKOX", ".XOWWWOX.", "..XWKWX..", "...XXX..."],
};

// ── the five pads ──────────────────────────────────────────────────────────────────────────────────────────
// paint(F): the body, full bleed. F = { W, H, L, R, top, bot, game, brand } — L / R = the content's left / right edge
// (inside the notch sides), bot = the lowest row a control may use (above the home bar).
export const STYLES = {
  brick: { id: "brick", name: "BRICK", home: "rgba(255,255,255,.5)",
    body: "#c9c7c1", tex: "#c0beb8", hi: "#e7e5df", lo: "#9b9993",
    ink: "#17181c", shadow: "#101114", well: "#1f2127", wellMid: "#1a1c21", wellLo: "#111216", wellHi: "#3c404a", label: "#c9c7c1", print: "#2a2d35", led: "#e0573c",
    panel: "#2a2d35", panelLo: "#1e2026", panelHi: "#3a3e48",
    a: { dk: "#94650f", mid: "#cc9224", base: "#eab43c", lt: "#ffe39a", txt: "#3a2408" },
    b: { dk: "#1b625b", mid: "#2b8a80", base: "#3faea3", lt: "#a4e8de", txt: "#0b2b28" },
    c: { dk: "#86291d", mid: "#b5412d", base: "#d9573c", lt: "#ffa088", txt: "#fff1e6" },
    x: { dk: "#0d0e11", mid: "#24262c", base: "#34363d", lt: "#5d6069", arrow: "#8e919a" },
    hud: { bg: "#14161a", ink: "#eab43c", dim: "#3a3d46", heart: "#e0573c", gold: "#eab43c", gem: "#3faea3" },
    g: { ink: "#c9c7c1", ndl: "#eab43c" },
    css: { bg: "#c9c7c1", panel: "#2a2d35", ink: "#17181c", text: "#eab43c", btn: "#eab43c", btnInk: "#3a2408" },
    paint(F) {
      each(() => true, all(), (x, y) => P(x, y, ((x * 3 + y * 5) % 9 === 0 && y % 2 === 0) ? this.tex : this.body));
      R(0, 0, W, 1, this.hi);
      const m = rrect(3, 16, W - 6, H - 19, 3);
      fill(shift(m, 0, -1), all(), this.lo); fill(m, all(), this.panel);
      each(m, all(), (x, y) => { if (!m(x, y - 1) || !m(x, y - 2)) P(x, y, this.panelLo); else if (!m(x, y + 1)) P(x, y, this.panelHi); });
      if (F.brand) { text("FOXBOX", F.L, 5, FS, this.print, { align: "l" }); const sx = F.L + 28, sw = Math.max(12, Math.min(100, F.headEnd - sx)); R(sx, 6, sw, 1, "#d39a28"); R(sx, 8, sw, 1, "#2e8c83"); }
    } },
  sixteen: { id: "sixteen", name: "SIXTEEN", home: "rgba(255,255,255,.45)",
    body: "#3c3f47", tex: "#393c43", hi: "#62666f", lo: "#2a2c32", out: "#17181c",
    ink: "#0f1013", shadow: "#1f2025", well: "#2a2c32", wellMid: "#25272c", wellLo: "#1a1b1f", wellHi: "#50545e", label: "#a2a6b2", print: "#a2a6b2", led: "#e8624a",
    tagY: 8, tagIn: 6,
    a: { dk: "#943021", mid: "#c6472e", base: "#e8624a", lt: "#ffa68e", txt: "#2a0c06" },
    b: { dk: "#277660", mid: "#3c9f82", base: "#5cc8a8", lt: "#b6f1df", txt: "#0d2d24" },
    c: { dk: "#9a6510", mid: "#cb8c1d", base: "#f0b43c", lt: "#ffe29a", txt: "#2e1d02" },
    x: { dk: "#0d0e10", mid: "#22242a", base: "#2d2f36", lt: "#535761", arrow: "#7a7e89" },
    hud: { bg: "#1d1f24", ink: "#dfe2ea", dim: "#3c3f47", heart: "#e8624a", gold: "#f0b43c", gem: "#5cc8a8", inset: 6, y: 5 },
    g: { bg: "#1d1f24", ink: "#dfe2ea", ndl: "#e8624a" },
    css: { bg: "#3c3f47", panel: "#1d1f24", ink: "#0f1013", text: "#dfe2ea", btn: "#e8624a", btnInk: "#2a0c06" },
    paint(F) {
      each(() => true, all(), (x, y) => P(x, y, (x + y) % 2 ? this.out : "#1b1c21"));
      const rr = rrect(3, 2, W - 6, H - 4, 26), mx = W / 2;
      const nT = (x, y) => F.brand && ((x + .5 - mx) / 36) ** 2 + ((y + .5 + 9) / 17) ** 2 <= 1;
      const nB = (x, y) => ((x + .5 - mx) / 36) ** 2 + ((y + .5 - (H + 11)) / 16) ** 2 <= 1;
      const m = (x, y) => rr(x, y) && !nT(x, y) && !nB(x, y);
      fill(shift(grow(m), 0, 1), all(), "#0b0b0e"); fill(grow(m), all(), this.ink);
      each(m, all(), (x, y) => P(x, y, ((x + y * 2) % 7 === 0 && y % 3 === 0) ? this.tex : this.body));
      each(m, all(), (x, y) => { if (!m(x, y - 1) || !m(x - 1, y)) P(x, y, this.hi); else if (!m(x, y - 2)) P(x, y, "#4a4d56"); else if (!m(x, y + 1) || !m(x + 1, y) || !m(x, y + 2)) P(x, y, this.lo); });
      if (F.brand) { const bx = Math.max(F.L, 24); text("FOXBOX", bx, 9, FS, this.print, { align: "l" }); R(bx + 26, 10, 8, 3, "#e8624a"); R(bx + 35, 10, 8, 3, "#f0b43c"); R(bx + 44, 10, 8, 3, "#5cc8a8"); }
    } },
  homecomp: { id: "homecomp", name: "HOME COMPUTER", home: "rgba(40,30,20,.35)",
    body: "#d9caa9", tex: "#cfbf9c", hi: "#eee3c8", lo: "#b4a382",
    ink: "#3a2c20", shadow: "#a8977a", well: "#4a3b2e", wellMid: "#43352a", wellLo: "#2f241b", wellHi: "#6b5844", label: "#6b5440", print: "#6b5440", led: "#c4532f",
    a: { dk: "#7e3016", mid: "#ab4424", base: "#cf5a32", lt: "#f59a72", txt: "#fff0dc" },
    b: { dk: "#2a2019", mid: "#3e3127", base: "#584634", lt: "#8c7457", txt: "#f1e4c6" },
    c: { dk: "#946510", mid: "#c08a22", base: "#e2a634", lt: "#ffd98a", txt: "#3a2808" },
    x: { dk: "#1c1511", mid: "#31271e", base: "#463729", lt: "#6f5a45", arrow: "#b39c79" },
    hud: { bg: "#3e3127", ink: "#f1e4c6", dim: "#5e4c3d", heart: "#e86a40", gold: "#e2a634", gem: "#a7c25c" },
    g: { bg: "#f4ecd8", ink: "#3a2c20", ndl: "#c4532f" },
    css: { bg: "#d9caa9", panel: "#f4ecd8", ink: "#3a2c20", text: "#3a2c20", btn: "#cf5a32", btnInk: "#fff0dc" },
    paint(F) {
      each(() => true, all(), (x, y) => P(x, y, (x * 31 + y * 17) % 23 === 0 ? this.tex : (x * 13 + y * 29) % 41 === 0 ? this.hi : this.body));
      R(0, 0, W, 1, this.hi); R(0, H - 1, W, 1, this.lo);
      if (F.brand) {
        const sx = F.L + 28, sw = Math.max(12, Math.min(92, F.headEnd - 6 - sx));
        [["#c4532f", 0], ["#e2a634", 2], ["#7e8f3c", 4]].forEach(([c, i]) => { R(sx, 4 + i, sw + i, 2, c); for (let k = 0; k < 2; k++) R(sx + sw + i + k, 4 + i + k, 1, 1, c); });
        text("FOXBOX", F.L, 5, FS, this.print, { align: "l" });
        if (F.game === "kart") text("FX-80", F.R, 5, FS, this.print, { align: "r" });
      }
    } },
  foxbox: { id: "foxbox", name: "FOXBOX", home: "rgba(16,17,37,.35)",
    body: "#ff9864", tex: "#f68d58", hi: "#ffc29a", lo: "#d9703f",
    ink: "#101125", shadow: "#d8c6a6", well: "#eadcc4", wellMid: "#e2d3b8", wellLo: "#c9b693", wellHi: "#fffdf7", label: "#101125", print: "#101125", led: "#ff5a3c",
    panel: "#fff9f1", panelLo: "#efe2cc",
    a: { dk: "#a87b00", mid: "#dcab18", base: "#ffd23f", lt: "#fff2a8", txt: "#101125" },
    b: { dk: "#11857c", mid: "#20ada2", base: "#2ed3c6", lt: "#a6f4ec", txt: "#101125" },
    c: { dk: "#9b2c19", mid: "#d6432a", base: "#ff5a3c", lt: "#ffaa96", txt: "#fff9f1" },
    x: { dk: "#05060f", mid: "#1a1c3a", base: "#262a52", lt: "#4b5088", arrow: "#fff9f1" },
    hud: { bg: "#101125", ink: "#fff9f1", dim: "#2c2f55", heart: "#ff5a3c", gold: "#ffd23f", gem: "#2ed3c6" },
    g: { ink: "#101125", ndl: "#ff5a3c" },
    css: { bg: "#ff9864", panel: "#fff9f1", ink: "#101125", text: "#101125", btn: "#ffd23f", btnInk: "#101125" },
    paint(F) {
      each(() => true, all(), (x, y) => P(x, y, ((x + y) % 6 === 0 && y % 2 === 0) ? this.tex : this.body));
      R(0, 0, W, 1, this.hi);
      const m = rrect(5, 16, W - 10, H - 20, 6);
      fill(shift(grow(m), 0, 1), all(), this.lo); fill(grow(m), all(), this.ink); fill(m, all(), this.panel);
      each(m, all(), (x, y) => { if (!m(x, y + 1)) P(x, y, this.panelLo); });
      if (F.brand) { sprite(ICON.fox, F.L, 4, { X: this.ink, K: this.ink, O: "#e8682f", W: "#fff9f1" }); text("FOXBOX", F.L + 12, 6, FS, this.ink, { align: "l" }); }
    } },
  smoke: { id: "smoke", name: "SMOKE", home: "rgba(255,255,255,.5)",
    body: "#2a2834", tex: "#2d2b38", hi: "#5a5772", lo: "#1b1a22",
    ink: "#0c0b10", shadow: "#16151c", well: "#1d1c25", wellMid: "#191820", wellLo: "#111016", wellHi: "#3c3a4c", label: "#9894b4", print: "#9894b4", led: "#d6435c",
    a: { dk: "#7a192b", mid: "#ad2b43", base: "#d6435c", lt: "#ff9aae", txt: "#fff0f3" },
    b: { dk: "#4b6878", mid: "#7a9cad", base: "#a8c8d8", lt: "#eef9ff", txt: "#12202a" },
    c: { dk: "#86570f", mid: "#b47a1b", base: "#dca33a", lt: "#ffe0a0", txt: "#20160a" },
    x: { dk: "#09080d", mid: "#1b1a23", base: "#25242f", lt: "#4c4960", arrow: "#8f8bab" },
    hud: { bg: "#14131a", ink: "#cdc9e4", dim: "#2f2d3b", heart: "#d6435c", gold: "#dca33a", gem: "#a8c8d8" },
    g: { bg: "#14131a", ink: "#cdc9e4", ndl: "#d6435c" },
    css: { bg: "#2a2834", panel: "#14131a", ink: "#0c0b10", text: "#cdc9e4", btn: "#d6435c", btnInk: "#fff0f3" },
    paint(F) {
      each(() => true, all(), (x, y) => P(x, y, (x + y) % 2 ? this.body : this.tex));
      const pw = W - 48, ph = H - 26, pcb = rrect(24, 18, pw, ph, 5);
      each(pcb, all(), (x, y) => { if (!pcb(x, y - 1) || !pcb(x, y + 1) || !pcb(x - 1, y) || !pcb(x + 1, y)) P(x, y, "#34514a"); else P(x, y, (x + y) % 2 ? "#22302f" : "#283a37"); });
      const tr = (pts) => { for (let k = 0; k < pts.length - 1; k++) { const [x1, y1] = pts[k], [x2, y2] = pts[k + 1], n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)); for (let i = 0; i <= n; i++) if (i % 2 === 0) P(Math.round(x1 + (x2 - x1) * i / n), Math.round(y1 + (y2 - y1) * i / n), "#7d7448"); } };
      const r0 = W - 24, b0 = H - 10;
      tr([[24, 30], [62, 30], [66, 26]]); tr([[r0 - 42, 26], [r0 - 38, 30], [r0, 30]]); tr([[r0 - 44, b0], [r0 - 38, b0 - 6], [r0, b0 - 6]]); tr([[30, 44], [30, H - 26]]); tr([[r0 - 6, 40], [r0 - 6, H - 26]]);
      [[30, 24], [r0 + 2 - 8, 24], [30, b0 - 4], [r0 + 2 - 8, b0 - 4]].forEach(([x, y]) => { fill(disc(x - 3, y - 3, 7), all(), "#4a475e"); fill(disc(x - 2, y - 2, 5), all(), "#17161e"); P(x, y, "#6e6a88"); });
      const e = rrect(2, 2, W - 4, H - 4, 14);
      each(e, all(), (x, y) => { if (!e(x, y - 1) || !e(x - 1, y)) P(x, y, this.hi); else if (!e(x, y + 1) || !e(x + 1, y)) P(x, y, this.lo); });
      if (F.brand) text("FOXBOX", F.L, 5, FS, this.print, { align: "l" });
    } },
};
export const STYLE_IDS = Object.keys(STYLES);

/** The player's badge, top right: an LED in their colour + their name (else "P1"). */
function badge(st, S, F) {
  const name = fitText(st.data.name || "", 44) || "";
  const tw = name ? textW(name, FS) : 0;
  const w = Math.max(19, tw + 12), tx = F.R - (S.tagIn ?? 0), ty = S.tagY ?? 3;
  const t = rrect(tx - w, ty, w, 9, 3);
  each(t, all(), (x, y) => { if (!t(x, y - 1) || !t(x, y + 1) || !t(x - 1, y) || !t(x + 1, y)) P(x, y, S.print); });
  const led = st.data.color || S.led;
  R(tx - w + 3, ty + 3, 3, 3, led);
  if (name) text(name, tx - w + 8, ty + 2, FS, S.print, { align: "l" });
  return tx - w;
}

// ── layouts: the real controllers, anchored to the safe area ─────────────────────────────────────────────────
// Coordinates come from the approved mockup (208×96, content 16..192, panel 16..93): lx() keeps a left-hand x's
// distance from the left content edge, rx() a right-hand x's distance from the right one, cy() centres vertically in
// the usable panel.
function anchors(F) {
  const dy = Math.round((16 + F.bot) / 2 - 54.5);
  return { lx: (x) => x + (F.L - 16), rx: (x) => x + (F.R - 192), mx: (x) => x + Math.round((F.L + F.R) / 2 - 104), cy: (y) => y + dy, dy };
}
export const LAYOUTS = {
  /** SKY SCRAMBLE: slider + BONK. data: { name, color, label, button } */
  sky(st, S, F) {
    const A = anchors(F);
    badge(st, S, F);
    const d = Math.max(48, Math.min(64, F.bot - 22, Math.floor((F.R - F.L) * 0.36)));
    const bx = F.R - d - 10, by = Math.round((16 + F.bot) / 2 - d / 2);
    const sx = F.L + 14, sEnd = bx - 30, sw = Math.max(36, sEnd - sx), sy = A.cy(49);
    const tri = (tx, dir) => { for (let i = 0; i < 5; i++) for (let j = -i; j <= i; j++) P(tx + dir * i, sy + 4 + j, S.label); };
    tri(sx - 12, 1); tri(sx + sw + 12, -1);
    slider(st, S, "slide", sx, sy, sw, S.x, { x: 0, y: 14, w: bx - 6, h: H - 14 });
    const lab = st.data.label != null ? st.data.label : "SLIDE TO STEER";
    if (lab) text(fitText(lab, sw + 30), sx + sw / 2, Math.min(F.bot - 6, sy + 27), FS, S.label);
    button(st, S, "a", bx, by, d, S.a, st.data.button || "BONK", FB, { hit: 6, dim: st.data.dim });
  },
  /** SNOWBALL SUMO: stick + SHOVE. data: { name, color, label, button, round, rounds, won } */
  snow(st, S, F) {
    const A = anchors(F);
    const left = badge(st, S, F);
    if (st.data.round) {
      const n = st.data.rounds || 3;
      text(`RD ${st.data.round}`, left - 7 - n * 6, (S.tagY ?? 3) + 2, FS, S.print, { align: "r" });
      for (let i = 0; i < n; i++) { const m = disc(left - 2 - (n - i) * 6, (S.tagY ?? 3) + 2, 5); fill(grow(m), all(), S.ink); fill(m, all(), (st.data.won || 0) > i ? S.a.base : S.wellHi); }
    }
    const d = Math.max(48, Math.min(64, F.bot - 22, Math.floor((F.R - F.L) * 0.36)));
    const bx = F.R - d - 10, by = Math.round((16 + F.bot) / 2 - d / 2);
    const Rw = Math.max(26, Math.min(33, Math.floor((F.bot - 18) / 2) - 3));
    const cx = Math.round(Math.min(A.lx(58), (F.L + bx) / 2)), cyy = Math.round((16 + F.bot) / 2);
    stick(st, S, "stick", cx, cyy, Rw, S.x, { x: 0, y: 14, w: bx - 6, h: H - 14 });
    if (st.data.label) text(fitText(st.data.label, bx - F.L - 8), (F.L + bx) / 2, F.bot - 5, FS, S.label);
    button(st, S, "a", bx, by, d, S.a, st.data.button || "SHOVE", FB, { hit: 6, dim: st.data.dim });
  },
  /** NONAME: HUD strip + cross (◀ ▶) + JUMP / DASH / SWORD.
   *  data: { hearts, maxHearts, coins, gems, score, combo, time, timeWarn, hint (lines), hintOn (a message on a plate), dimDash, dimSword, arms } */
  knight(st, S, F) {
    const A = anchors(F), D = st.data;
    const hx = F.L + (S.hud.inset || 0), hy = S.hud.y ?? 2, hw = F.R - F.L - 2 * (S.hud.inset || 0);
    const hm = rrect(hx, hy, hw, 12, 3); fill(grow(hm), all(), S.ink); fill(hm, all(), S.hud.bg);
    each(hm, all(), (x, y) => { if (!hm(x, y - 1)) P(x, y, S.ink); });
    const maxH = D.maxHearts ?? 3, hearts = D.hearts ?? 3;
    for (let i = 0; i < maxH; i++) sprite(ICON.heart, hx + 4 + i * 6, hy + 3, { X: i < hearts ? S.hud.heart : S.hud.dim });
    let cxp = hx + 7 + maxH * 6;
    sprite(ICON.coin, cxp, hy + 3, { X: S.hud.gold, O: "#9a6a14", W: "#fff6c8" }); cxp += 8; cxp += text(String(D.coins ?? 0), cxp, hy + 3, FS, S.hud.ink, { align: "l" }) + 5;
    sprite(ICON.gem, cxp, hy + 3, { X: S.hud.gem, O: "#ffffff" }); cxp += 7; cxp += text(String(D.gems ?? 0), cxp, hy + 3, FS, S.hud.ink, { align: "l" }) + 6;
    cxp += text(String(D.score ?? 0), cxp, hy + 3, FS, S.hud.ink, { align: "l" }) + 2; cxp += text("PTS", cxp, hy + 3, FS, S.hud.dim, { align: "l" });
    if (D.combo >= 2) text(`X${D.combo}`, cxp + 5, hy + 3, FS, S.hud.gold, { align: "l" });
    if (D.time) text(D.time, hx + hw - 4, hy + 3, FS, D.timeWarn ? S.hud.heart : S.hud.ink, { align: "r" });
    cross(st, S, A.lx(50), A.cy(55), 46, 16, S.x, D.arms || ["l", "r"]);
    // the hint / message lines: centred at the mockup's spot, or in the whole gap (cross … SWORD) when a line needs it
    const hint = D.hint != null ? D.hint : ["HOLD JUMP", "TO GO HIGH"];
    let lines = (Array.isArray(hint) ? hint : [hint]).map(pixelText).filter(Boolean);
    const gapL = A.lx(81), gapR = A.rx(142);
    let hcx = A.rx(107), hwid = 2 * Math.min(hcx - gapL, gapR - hcx);
    if (lines.some((ln) => textW(ln, FS) > hwid)) { hcx = Math.round((gapL + gapR) / 2); hwid = gapR - gapL; }
    lines = lines.map((ln) => fitText(ln, hwid - (D.hintOn ? 4 : 0)));
    const hy0 = A.cy(lines.length > 2 ? 26 : 28);
    if (D.hintOn && lines.length) { const pw = Math.max(...lines.map((ln) => textW(ln, FS))) + 6; plate(S, Math.round(hcx - pw / 2), hy0 - 3, pw, lines.length * 7 + 4); }
    lines.forEach((ln, i) => text(ln, hcx, hy0 + i * 7, FS, D.hintOn ? S.hud.ink : S.label));
    // a thumb slides between SWORD / DASH / JUMP (and the cross arms) like on NONAME's own pad: the face buttons join the arms' group
    const sl = { data: D, isDown: st.isDown, val: st.val, region: (r) => st.region({ ...r, arm: true }) };
    button(sl, S, "sword", A.rx(145), A.cy(20), 28, S.c, "SWORD", FS, { hit: 3, dim: D.dimSword });
    button(sl, S, "dash", A.rx(90), A.cy(53), 34, S.b, "DASH", FB, { hit: 3, dim: D.dimDash });
    button(sl, S, "jump", A.rx(139), A.cy(50), 38, S.a, "JUMP", FB, { hit: 4 });
  },
  /** FOX KART: ITEM key, place / lap, tilt gauge + CENTRE, GAS key.
   *  data: { place, lap, laps, lapText, tilt (−1..1), item, itemName, itemIcon ({ w, h, pal: [hex], px: one char per pixel,
   *  "." = clear, else String.fromCharCode(48 + palette index) }), lights (0..4: the start lights instead of place / lap;
   *  msg = lines under them until GO),
   *  slider (no tilt: a thumb slider "slide" instead of the gauge), motionSlot (leave the bottom centre free for the page's
   *  own TAP TO ENABLE TILT button), gasHint (lines under GAS) } */
  kart(st, S, F) {
    const A = anchors(F), D = st.data;
    const kh = Math.min(72, F.bot - 17 - 4);
    const ix = A.lx(16), iy = A.cy(17) + Math.round((72 - kh) / 2);
    const has = !!(D.item || D.itemIcon);
    const ipal = has ? S.b : S.x;
    const oi = key(st, S, "item", ix, iy, 46, kh, ipal);
    const ic = D.itemIcon;
    if (ic && ic.px && ic.w && ic.h) { // the held item's own pixel art
      const x0 = ix + 23 - (ic.w >> 1), y0 = iy + 4 + oi + Math.max(0, (27 - ic.h) >> 1);
      for (let j = 0; j < ic.h; j++) for (let i = 0; i < ic.w; i++) { const ch = ic.px.charCodeAt(j * ic.w + i) - 48; if (ch >= 0 && ic.pal[ch]) P(x0 + i, y0 + j, ic.pal[ch]); }
    } else if (D.item) {
      const sb = disc(ix + 17, iy + 11 + oi, 12); fill(grow(sb), all(), S.ink); fill(sb, all(), "#f4f8ff");
      each(sb, all(), (x, y) => { if ((x - ix - 17) + (y - iy - 11 - oi) > 15) P(x, y, "#a9c4e0"); });
    }
    const itxt = has ? ipal.txt : ipal.arrow;
    text("ITEM", ix + 23, iy + 33 + oi, FB, itxt);
    let nm = pixelText(D.itemName ?? (has ? "" : "NONE"));
    const nl = textW(nm, FS) > 40 && nm.includes(" ") ? [nm.slice(0, nm.indexOf(" ")), nm.slice(nm.indexOf(" ") + 1)] : [nm];
    nl.forEach((ln, i) => text(fitText(ln, 40), ix + 23, iy + 44 + i * 7 + oi, FS, itxt));
    const gx = A.rx(146), gy = iy;
    const og = key(st, S, "gas", gx, gy, 46, kh, S.a);
    for (let k = 0; k < 3; k++) for (let i = 0; i < 6; i++) { [gx + 22 - i, gx + 23 + i].forEach((x) => { P(x, gy + 9 + og + k * 5 + i, S.a.txt); P(x, gy + 10 + og + k * 5 + i, S.a.txt); }); }
    text("GAS", gx + 23, gy + 37 + og, FB, S.a.txt, { bold: true });
    (D.gasHint || []).forEach((ln, i) => text(fitText(ln, 40), gx + 23, gy + 50 + i * 7 + og, FS, S.a.txt));
    const mid = Math.round((ix + 46 + gx) / 2);
    if (D.lights != null) { // the start lights (the countdown): three lamps, all green at GO
      const go = D.lights >= 4;
      for (let i = 0; i < 3; i++) { const m = disc(mid - 16 + i * 12, A.cy(17), 9); fill(grow(m), all(), S.ink); fill(m, all(), go ? "#35ff8a" : D.lights > i ? "#ff3b3b" : "#3a1a20"); each(m, all(), (x, y) => { if (!m(x - 1, y - 1)) P(x, y, go ? "#c8ffd9" : D.lights > i ? "#ffb0a8" : "#5a2a30"); }); }
      if (go) text("GO!", mid, A.cy(31), FB, S.label, { bold: true });
      else (D.msg || []).forEach((ln, i) => text(fitText(ln, gx - ix - 50), mid, A.cy(31) + i * 7, FS, S.label));
    } else {
      if (D.place) { const suf = ["TH", "ST", "ND", "RD"][(D.place % 100 - 20) % 10] || ["TH", "ST", "ND", "RD"][D.place % 100] || "TH"; const pw = textW(String(D.place), FB, { scale: 2 }); text(String(D.place), mid - 6 - Math.round(pw / 2) + 6, A.cy(17), FB, S.label, { align: "l", scale: 2 }); text(suf, mid + Math.round(pw / 2) + 1, A.cy(18), FS, S.label, { align: "l" }); }
      if (D.lapText || D.lap) text(fitText(D.lapText || `LAP ${D.lap}/${D.laps || 3}`, gx - ix - 50), mid, A.cy(35), FS, S.label);
    }
    if (D.slider) { // no tilt: a thumb slider in the gauge's place (touch anywhere in the middle column below the lap)
      const colL = ix + 46 + 4, colR = gx - 4, sw = Math.max(36, Math.min(70, colR - colL - 12));
      slider(st, S, "slide", Math.round(mid - sw / 2), A.cy(62), sw, S.x, { x: colL, y: A.cy(44), w: colR - colL, h: H - A.cy(44) });
      if (!D.motionSlot) text(fitText("SLIDE TO STEER", colR - colL), mid, A.cy(79), FS, S.label);
    } else {
      gauge(S, mid, A.cy(70), 20, Math.max(-60, Math.min(60, (D.tilt || 0) * 60)));
      if (!D.motionSlot) pill(st, S, "centre", mid, A.cy(78), 30, "CENTRE");
    }
  },
};
export const LAYOUT_IDS = Object.keys(LAYOUTS);
const NO_BRAND = new Set(["knight"]); // layouts that draw their own header (no FOXBOX print)
const RESERVE = { snow: 108 }; // how much of the header's right side a layout uses (default: the name badge)

// ── a surface: one canvas, one style, one layout ─────────────────────────────────────────────────────────────
const REF_H = 96, REF_W = 200; // art pixels the short side / long side aim for
/** Safe-area insets of the window (CSS px), read once per layout from a probe. */
let probe = null;
function windowInsets() {
  const t = globalThis.FOXBOX_SAFE_TEST; // QA: a phone's insets (headless browsers report none)
  if (t && typeof t === "object") return { t: +t.t || 0, r: +t.r || 0, b: +t.b || 0, l: +t.l || 0 };
  if (!probe) {
    probe = document.createElement("div");
    probe.style.cssText = "position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)";
    document.body.append(probe);
  }
  const cs = getComputedStyle(probe);
  return { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 };
}
/** The clockwise rotation (0/90/180/270) the page's CSS puts on el (landscape.js turns whole screens). */
function rotationOf(el) {
  let deg = 0;
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    const t = getComputedStyle(n).transform;
    if (t && t !== "none") {
      try { const m = new DOMMatrixReadOnly(t); deg += Math.atan2(m.b, m.a) * 180 / Math.PI; } catch {}
    }
  }
  return ((Math.round(deg / 90) * 90) % 360 + 360) % 360;
}

/**
 * createPadSkin(host, opts) — see the top of the file.
 * opts: { style, game, onInput, data, interactive = true, fixed: {W, H, k} (a fixed grid, for previews), safe: {l,r,t,b} (CSS px,
 *         overrides the window's), brand = true }
 */
export function createPadSkin(host, opts = {}) {
  let styleId = STYLES[opts.style] ? opts.style : DEFAULT_SKIN;
  let game = LAYOUTS[opts.game] ? opts.game : "sky";
  let data = { ...(opts.data || {}) };
  const onInput = opts.onInput || (() => {});
  const interactive = opts.interactive !== false;

  const cv = document.createElement("canvas");
  cv.className = "pad-skin";
  cv.dataset.test = "pad-skin";
  cv.setAttribute("aria-hidden", "true");
  cv.style.cssText = "position:absolute;left:0;top:0;display:block;image-rendering:pixelated;image-rendering:crisp-edges;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;z-index:1;";
  host.append(cv);
  const ctx = cv.getContext("2d", { alpha: false });

  // state the layouts read
  const touchDown = new Map(); // pointerId → region name (buttons)
  const held = new Set(); // pressed from outside
  const vals = new Map(); // name → {x, y} (sliders / sticks)
  const drags = new Map(); // pointerId → region (sliders / sticks)
  let regions = [];
  const st = {
    get data() { return data; },
    isDown: (n) => held.has(n) || [...touchDown.values()].includes(n),
    val: (n) => vals.get(n) || { x: 0, y: 0 },
    region: (r) => regions.push(r),
    rect: (n, r) => { rects[n] = r; }, // a named area for the page (e.g. Row's boat window): opts.onRects gets it in CSS px
  };
  let rects = {}, rectsSent = "";

  let G = null; // { W, H, k, dpr, rot, F, img, buf, bg, bgKey }
  let raf = 0, tmo = 0, dirty = false, dead = false;

  function measure() {
    const dpr = window.devicePixelRatio || 1;
    let cw = host.clientWidth, ch = host.clientHeight;
    if (!cw || !ch) return null;
    if (opts.fixed) { // a preview: about fixed.H rows, whole device pixels per art pixel, the width follows the box
      const k = Math.max(1, Math.floor((ch * dpr) / opts.fixed.H));
      const fw = Math.ceil((cw * dpr) / k), fh = Math.ceil((ch * dpr) / k);
      return { W: fw, H: fh, k, dpr, rot: 0, safe: { l: 0, r: 0, t: 0, b: 0 }, cssW: (fw * k) / dpr, cssH: (fh * k) / dpr };
    }
    const long = Math.max(cw, ch), short = Math.min(cw, ch);
    const k = Math.max(1, Math.round(Math.min((short * dpr) / REF_H, (long * dpr) / REF_W)));
    const gw = Math.ceil((cw * dpr) / k), gh = Math.ceil((ch * dpr) / k);
    const rot = rotationOf(host);
    // safe areas: the window's insets, minus how far the host already sits from each window edge, turned into our frame
    let safe = opts.safe;
    if (!safe) {
      const wi = windowInsets(), r = host.getBoundingClientRect();
      const win = { t: Math.max(0, wi.t - r.top), r: Math.max(0, wi.r - (innerWidth - r.right)), b: Math.max(0, wi.b - (innerHeight - r.bottom)), l: Math.max(0, wi.l - r.left) };
      safe = rot === 90 ? { t: win.r, r: win.b, b: win.l, l: win.t } : rot === 270 ? { t: win.l, r: win.t, b: win.r, l: win.b } : rot === 180 ? { t: win.b, r: win.l, b: win.t, l: win.r } : win;
    }
    return { W: gw, H: gh, k, dpr, rot, safe, cssW: (gw * k) / dpr, cssH: (gh * k) / dpr };
  }

  function frame(M) {
    const toGrid = (v) => Math.ceil((v * M.dpr) / M.k);
    const sl = toGrid(M.safe.l), sr = toGrid(M.safe.r), sb = toGrid(M.safe.b);
    const L = Math.max(sl + 2, 10), R = M.W - Math.max(sr + 2, 10);
    const reserve = RESERVE[game] ?? 64; // the header's right side: the name badge (+ Snowball's round pips)
    return { W: M.W, H: M.H, L, R, top: 16, bot: M.H - Math.max(sb + 1, 3), game, brand: !NO_BRAND.has(game) && opts.brand !== false, headEnd: R - reserve };
  }

  function layout() {
    if (dead) return;
    const M = measure();
    if (!M) return;
    const same = G && G.W === M.W && G.H === M.H && G.k === M.k && G.dpr === M.dpr && G.rot === M.rot && JSON.stringify(G.safe) === JSON.stringify(M.safe);
    if (!same) {
      cv.width = M.W; cv.height = M.H;
      cv.style.width = M.cssW + "px"; cv.style.height = M.cssH + "px";
      const img = ctx.createImageData(M.W, M.H);
      G = { ...M, img, buf: new Uint32Array(img.data.buffer), bg: null, bgKey: "" };
    }
    G.F = frame(G);
    paintNow();
  }

  function paintNow() {
    if (dead) return;
    if (!G) return void layout(); // (made while hidden or detached: size it now)
    const t0 = performance.now();
    W = G.W; H = G.H;
    const S = STYLES[styleId];
    const key = `${styleId}|${game}|${G.W}x${G.H}|${G.F.L},${G.F.R},${G.F.bot}`;
    if (G.bgKey !== key) {
      BUF = new Uint32Array(G.W * G.H);
      S.paint(G.F);
      G.bg = BUF;
      G.bgKey = key;
    }
    G.buf.set(G.bg);
    BUF = G.buf;
    regions = [];
    rects = {};
    try { LAYOUTS[game](st, S, G.F); } catch (e) { console.warn("[pad-skin] layout", e); }
    ctx.putImageData(G.img, 0, 0);
    if (opts.onRects) {
      const sc = G.k / G.dpr, css = {};
      for (const [n, r] of Object.entries(rects)) css[n] = { x: r.x * sc, y: r.y * sc, w: r.w * sc, h: r.h * sc };
      const sig = JSON.stringify(css);
      if (sig !== rectsSent) { rectsSent = sig; try { opts.onRects(css); } catch (e) { console.warn("[pad-skin] onRects", e); } }
    }
    api.lastDrawMs = performance.now() - t0;
  }

  function redraw() {
    if (dead) return;
    dirty = true;
    if (raf) return;
    // the next frame, or 60 ms at most (a background / throttled page doesn't run frames, but the pad must still show)
    const run = () => { cancelAnimationFrame(raf); clearTimeout(tmo); raf = 0; if (dirty) { dirty = false; paintNow(); } };
    raf = requestAnimationFrame(run);
    tmo = setTimeout(run, 60);
  }

  // ── touch → grid → regions ──
  let rotNow = 0;
  function toGrid(ev) {
    const r = cv.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const vx = ev.clientX - cx, vy = ev.clientY - cy;
    const a = (-rotNow * Math.PI) / 180;
    const dx = vx * Math.cos(a) - vy * Math.sin(a), dy = vx * Math.sin(a) + vy * Math.cos(a);
    const s = G.k / G.dpr; // CSS px per art px
    return [(dx + G.cssW / 2) / s, (dy + G.cssH / 2) / s];
  }
  function hit(x, y) {
    for (let i = regions.length - 1; i >= 0; i--) {
      const g = regions[i];
      if (g.t === "c" ? (x - g.cx) ** 2 + (y - g.cy) ** 2 <= g.r * g.r : x >= g.x && x < g.x + g.w && y >= g.y && y < g.y + g.h) return g;
    }
    return null;
  }
  function dragTo(g, x, y) {
    let vx = (x - g.cx) / g.max, vy = g.kind === "stick" ? (y - g.cy) / g.max : 0;
    const m = Math.hypot(vx, vy);
    if (m > 1) { vx /= m; vy /= m; }
    vals.set(g.n, { x: vx, y: vy });
    onInput({ type: "move", name: g.n, x: vx, y: vy, active: true });
    redraw();
  }
  const trace = (ev, what) => { if (globalThis.FOXBOX_SKIN_TRACE) (api.trace ||= []).push(`${ev.type}:${ev.pointerId}:${what || ""}`); };
  function down(ev) {
    trace(ev);
    if (!G || !interactive) return;
    rotNow = G.rot;
    const [x, y] = toGrid(ev), g = hit(x, y);
    if (!g) return;
    ev.preventDefault();
    try { cv.setPointerCapture(ev.pointerId); } catch {}
    if (g.kind) { drags.set(ev.pointerId, g); dragTo(g, x, y); return; }
    const was = st.isDown(g.n);
    touchDown.set(ev.pointerId, g.n);
    if (!was) { onInput({ type: "press", name: g.n, down: true }); buzz(); }
    redraw();
  }
  function move(ev) {
    if (!G) return;
    const g = drags.get(ev.pointerId);
    if (g) { ev.preventDefault(); const [x, y] = toGrid(ev); dragTo(g, x, y); return; }
    // a thumb sliding across the cross pad changes arms (walking left → right without lifting)
    const n = touchDown.get(ev.pointerId);
    if (n == null) return;
    const [x, y] = toGrid(ev), h = hit(x, y);
    if (h && !h.kind && h.n !== n && regions.find((r) => r.n === n)?.arm && h.arm) {
      touchDown.set(ev.pointerId, h.n);
      if (!st.isDown(n)) onInput({ type: "press", name: n, down: false });
      onInput({ type: "press", name: h.n, down: true });
      redraw();
    }
  }
  function up(ev) {
    trace(ev, touchDown.get(ev.pointerId));
    const g = drags.get(ev.pointerId);
    if (g) {
      drags.delete(ev.pointerId);
      vals.set(g.n, { x: 0, y: 0 });
      onInput({ type: "move", name: g.n, x: 0, y: 0, active: false });
      redraw();
      return;
    }
    const n = touchDown.get(ev.pointerId);
    if (n == null) return;
    touchDown.delete(ev.pointerId);
    if (!st.isDown(n)) onInput({ type: "press", name: n, down: false });
    redraw();
  }
  function buzz() {
    if (opts.vibrate === false || !navigator.vibrate) return;
    try { navigator.vibrate(12); } catch {}
  }
  cv.addEventListener("pointerdown", down);
  cv.addEventListener("pointermove", move);
  cv.addEventListener("pointerup", up);
  cv.addEventListener("pointercancel", up);
  cv.addEventListener("lostpointercapture", up);
  for (const t of ["touchstart", "touchmove", "touchend", "contextmenu"]) cv.addEventListener(t, (e) => { if (e.cancelable) e.preventDefault(); }, { passive: false });

  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => layout()) : null;
  ro?.observe(host);
  const onResize = () => layout();
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", onResize);

  const api = {
    el: cv,
    lastDrawMs: 0,
    get regions() { return regions.slice(); },
    get debug() { return { down: [...touchDown.entries()], held: [...held], raf, dirty, dead }; },
    get grid() { return G ? { W: G.W, H: G.H, k: G.k, dpr: G.dpr, rot: G.rot, F: G.F, safe: G.safe } : null; },
    get style() { return styleId; },
    get game() { return game; },
    set(d) {
      let changed = false;
      for (const k of Object.keys(d || {})) if (JSON.stringify(data[k]) !== JSON.stringify(d[k])) { data[k] = d[k]; changed = true; }
      if (changed) redraw();
      return changed;
    },
    hold(name, on) {
      if (on ? held.has(name) : !held.has(name)) return;
      if (on) held.add(name); else held.delete(name);
      redraw();
    },
    /** Show a slider / stick at a value from outside (a keyboard, a tilt). */
    show(name, x, y = 0) { vals.set(name, { x, y }); redraw(); },
    setStyle(id) { if (!STYLES[id] || id === styleId) return; styleId = id; if (G) G.bgKey = ""; redraw(); },
    setGame(id) { if (!LAYOUTS[id] || id === game) return; game = id; if (G) { G.F = frame(G); G.bgKey = ""; } redraw(); },
    /** Let go of everything (window blur, a screen change): sends the releases. */
    release() {
      for (const [, n] of touchDown) if (!held.has(n)) onInput({ type: "press", name: n, down: false });
      touchDown.clear();
      for (const [, g] of drags) { vals.set(g.n, { x: 0, y: 0 }); onInput({ type: "move", name: g.n, x: 0, y: 0, active: false }); }
      drags.clear();
      redraw();
    },
    layout,
    redraw,
    paintNow,
    destroy() {
      dead = true;
      cancelAnimationFrame(raf);
      clearTimeout(tmo);
      ro?.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      cv.remove();
    },
  };
  layout();
  return api;
}

// ── CLASSIC's preview: today's controller, drawn smooth (not pixel art) ─────────────────────────────────────
function drawClassicPreview(cv, game = "sky", color = "#f0436a") {
  const ctx = cv.getContext("2d"), w = cv.width, h = cv.height, u = h / 96;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#7a1a34"); g.addColorStop(0.55, "#1d1426"); g.addColorStop(1, "#0b1020");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const rr = (x, y, ww, hh, r) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, ww, hh, r); else ctx.rect(x, y, ww, hh); };
  // the status strip
  rr(4 * u, 3 * u, w - 8 * u, 11 * u, 5 * u); ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fill(); ctx.lineWidth = 1 * u; ctx.strokeStyle = "#ff7a92"; ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = `800 ${7 * u}px system-ui, -apple-system, sans-serif`; ctx.fillText("GO GO GO!", w * 0.3, 9 * u);
  ctx.font = `600 ${5 * u}px system-ui, -apple-system, sans-serif`; ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.fillText(game === "snow" ? "Drag to roll · SHOVE to bump" : "Steer ◀ ▶ · BONK = dive on heads", w * 0.62, 9.3 * u);
  // the steer panel
  const px = 4 * u, py = 18 * u, pw = w * 0.52, ph = h - 22 * u;
  rr(px, py, pw, ph, 9 * u); ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 0.8 * u; ctx.stroke();
  const cy = py + ph / 2;
  rr(px + 16 * u, cy - 3 * u, pw - 32 * u, 6 * u, 3 * u); ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.35)";
  ctx.beginPath(); ctx.moveTo(px + 6 * u, cy); ctx.lineTo(px + 13 * u, cy - 4 * u); ctx.lineTo(px + 13 * u, cy + 4 * u); ctx.fill();
  ctx.beginPath(); ctx.moveTo(px + pw - 6 * u, cy); ctx.lineTo(px + pw - 13 * u, cy - 4 * u); ctx.lineTo(px + pw - 13 * u, cy + 4 * u); ctx.fill();
  const ball = (x, y, r) => { const rg = ctx.createRadialGradient(x - r * .3, y - r * .4, r * .1, x, y, r); rg.addColorStop(0, "#ffd0da"); rg.addColorStop(.45, color); rg.addColorStop(1, "#b8203f"); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = rg; ctx.fill(); ctx.lineWidth = r * .1; ctx.strokeStyle = "#fff"; ctx.stroke(); };
  ball(px + pw / 2, cy, 9 * u);
  ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.font = `600 ${5 * u}px system-ui, -apple-system, sans-serif`; ctx.fillText(game === "snow" ? "drag to roll" : "slide to steer", px + pw / 2, py + ph - 6 * u);
  // the big button
  const bx = w * 0.77, br = Math.min(ph / 2, w * 0.2);
  ball(bx, cy, br);
  ctx.fillStyle = "#fff"; ctx.font = `900 ${12 * u}px system-ui, -apple-system, sans-serif`; ctx.fillText(game === "snow" ? "SHOVE" : "BONK", bx, cy + u);
}

/**
 * The CONTROLLER choice (the name screens): ◀ [live pad] ▶, the pad's name, dots; swipe the pad or tap the arrows/dots.
 * mountSkinPicker(el, { value, onChange(id), game = "sky", name }) → { value, set(id), destroy() }
 * Tapping the pad's buttons presses them (it's a live preview). onChange runs on every change; the caller saves
 * (setSkinId) when the screen is confirmed, or straight away.
 */
const PICKER_CSS = `
.fbx-skinpick { --ink: #101125; display: grid; gap: 8px; justify-items: center; width: 100%; max-width: 420px; margin: 0 auto;
  font: 400 10px/1.4 "FoxBox Pixel", "Press Start 2P", ui-monospace, monospace; color: inherit; touch-action: pan-y; user-select: none; -webkit-user-select: none; }
.fbx-skinpick-head { display: flex; align-items: baseline; justify-content: space-between; width: 100%; gap: 8px; letter-spacing: .06em; }
.fbx-skinpick-head b { font-weight: 400; opacity: .7; }
.fbx-skinpick-row { display: grid; grid-template-columns: 44px minmax(0, 1fr) 44px; align-items: center; gap: 6px; width: 100%; }
.fbx-skinpick-arrow { appearance: none; width: 44px; height: 44px; padding: 0; border: 0; border-radius: 3px; background: #101125; color: #fff9f1; cursor: pointer;
  display: grid; place-items: center; box-shadow: 0 3px 0 0 #00000066; -webkit-tap-highlight-color: transparent; }
.fbx-skinpick-arrow:active { transform: translateY(2px); box-shadow: 0 1px 0 0 #00000066; }
.fbx-skinpick-arrow svg { width: 12px; height: 14px; display: block; }
.fbx-skinpick-arrow:focus-visible, .fbx-skinpick-dot:focus-visible { outline: 3px solid #ffd23f; outline-offset: 2px; }
.fbx-skinpick-phone { position: relative; width: 100%; aspect-ratio: 208 / 96; padding: 4px; box-sizing: content-box; border-radius: 14px;
  background: linear-gradient(160deg, #4a4d55, #1b1c21 38%, #2b2d33 75%, #141518); box-shadow: inset 0 0 0 1.5px #6a6d74, 0 6px 14px rgba(0,0,0,.28); margin-left: -4px; }
.fbx-skinpick-scr { position: absolute; inset: 4px; border-radius: 10px; overflow: hidden; background: #000; isolation: isolate; }
.fbx-skinpick-scr > canvas.fbx-classic { position: absolute; inset: 0; width: 100%; height: 100%; }
.fbx-skinpick-name { font-size: 12px; letter-spacing: .08em; min-height: 1.4em; text-align: center; }
.fbx-skinpick-dots { display: flex; gap: 0; }
.fbx-skinpick-dot { appearance: none; width: 28px; height: 28px; padding: 0; border: 0; background: none; color: inherit; cursor: pointer; display: grid; place-items: center; -webkit-tap-highlight-color: transparent; }
.fbx-skinpick-dot i { width: 8px; height: 8px; background: currentColor; opacity: .3; }
.fbx-skinpick-dot[aria-current="true"] i { opacity: 1; width: 10px; height: 10px; }
`;
export function mountSkinPicker(root, { value = skinId(), onChange = () => {}, game = "sky", name = "" } = {}) {
  if (!document.getElementById("fbx-skinpick-css")) {
    const s = document.createElement("style");
    s.id = "fbx-skinpick-css";
    s.textContent = PICKER_CSS;
    document.head.append(s);
  }
  let i = Math.max(0, SKIN_IDS.indexOf(validSkin(value)));
  const el = document.createElement("div");
  el.className = "fbx-skinpick";
  el.dataset.test = "skin-picker";
  const arrow = (dir) => `<svg viewBox="0 0 6 7" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="${dir < 0 ? "M5 0h1v7H5V6H4V5H3V4H2V3h1V2h1V1h1z" : "M0 0h1v1h1v1h1v1h1v1H3v1H2v1H1v1H0z"}"/></svg>`;
  el.innerHTML = `
    <div class="fbx-skinpick-head"><span>CONTROLLER</span><b class="fbx-skinpick-count"></b></div>
    <div class="fbx-skinpick-row">
      <button type="button" class="fbx-skinpick-arrow" data-d="-1" aria-label="Previous controller" data-test="skin-prev">${arrow(-1)}</button>
      <div class="fbx-skinpick-phone" data-test="skin-preview"><div class="fbx-skinpick-scr"></div></div>
      <button type="button" class="fbx-skinpick-arrow" data-d="1" aria-label="Next controller" data-test="skin-next">${arrow(1)}</button>
    </div>
    <div class="fbx-skinpick-name" aria-live="polite" data-test="skin-name"></div>
    <div class="fbx-skinpick-dots" role="tablist" aria-label="Controllers">${SKINS.map((s, k) => `<button type="button" class="fbx-skinpick-dot" role="tab" data-k="${k}" aria-label="${s.name}" data-test="skin-dot-${s.id}"><i></i></button>`).join("")}</div>`;
  root.append(el);
  const scr = el.querySelector(".fbx-skinpick-scr");
  let pad = null, classic = null;
  const show = () => {
    const id = SKINS[i].id;
    el.dataset.skin = id;
    el.querySelector(".fbx-skinpick-name").textContent = SKINS[i].name;
    el.querySelector(".fbx-skinpick-count").textContent = `${i + 1}/${SKINS.length}`;
    el.querySelectorAll(".fbx-skinpick-dot").forEach((d, k) => d.setAttribute("aria-current", String(k === i)));
    if (id === "classic") {
      if (pad) { pad.destroy(); pad = null; }
      if (!classic) { classic = document.createElement("canvas"); classic.className = "fbx-classic"; scr.append(classic); }
      const r = scr.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      classic.width = Math.max(208, Math.round(r.width * dpr)); classic.height = Math.max(96, Math.round(r.height * dpr));
      drawClassicPreview(classic, game);
    } else {
      if (classic) { classic.remove(); classic = null; }
      if (!pad) pad = createPadSkin(scr, { style: id, game, fixed: { W: 208, H: 96 }, data: { name, label: "SLIDE TO STEER" }, vibrate: false, onInput() {} });
      else pad.setStyle(id);
    }
  };
  const go = (k, user = true) => {
    i = ((k % SKINS.length) + SKINS.length) % SKINS.length;
    show();
    if (user) onChange(SKINS[i].id);
  };
  el.addEventListener("click", (e) => {
    const a = e.target.closest(".fbx-skinpick-arrow");
    if (a) return go(i + Number(a.dataset.d));
    const d = e.target.closest(".fbx-skinpick-dot");
    if (d) go(Number(d.dataset.k));
  });
  // swipe the pad (a sideways drag of ≥ 28 px); a tap presses its buttons (the canvas handles that itself)
  const phone = el.querySelector(".fbx-skinpick-phone");
  let sx = null, sy = 0, sid = null;
  phone.addEventListener("pointerdown", (e) => { sx = e.clientX; sy = e.clientY; sid = e.pointerId; }, true);
  phone.addEventListener("pointerup", (e) => {
    if (e.pointerId !== sid || sx == null) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    sx = null;
    if (Math.abs(dx) >= 28 && Math.abs(dx) > Math.abs(dy) * 1.3) go(i + (dx < 0 ? 1 : -1));
  }, true);
  phone.addEventListener("pointercancel", () => { sx = null; }, true);
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => { if (classic) show(); }) : null;
  ro?.observe(scr);
  show();
  return {
    el,
    get value() { return SKINS[i].id; },
    set(id) { go(Math.max(0, SKIN_IDS.indexOf(validSkin(id))), false); },
    setName(n) { name = n; pad?.set({ name: n }); },
    /** Size + draw again (call after the picker's screen shows: it may have been made hidden or detached). */
    refresh() { if (pad) pad.layout(); else if (classic) show(); },
    destroy() { ro?.disconnect(); pad?.destroy(); el.remove(); },
  };
}

// ── for the game modules' own layouts (NONAME, FOX KART, TEE TIME, …) ────────────────────────────────────────
/** The drawing kit, for a layout written next to its game: every function draws into the surface being painted. */
export const PX = {
  P, R, each, fill, disc, rrect, shift, grow, bbD, bbR, all, text, textW, fitText, sprite, FB, FS, ICON,
  recess, raised, button, key, cross, cap, stick, slider, pill, gauge, plate, badge, anchors,
  get W() { return W; }, get H() { return H; },
};
/**
 * Add (or replace) a layout: fn(st, S, F) like the ones in LAYOUTS — st.data / st.isDown(name) / st.val(name) /
 * st.region({...}); S = the style (palettes a/b/c/x, hud, g, ink, label, print, …); F = { W, H, L, R, top, bot, game, brand, headEnd }.
 * opts.brand = false: no FOXBOX print in the header (a layout that uses the header itself, like NONAME's HUD).
 */
export function registerLayout(id, fn, opts = {}) {
  LAYOUTS[id] = fn;
  if (opts.brand === false) NO_BRAND.add(id); else NO_BRAND.delete(id);
  if (opts.reserve) RESERVE[id] = opts.reserve;
}

// ── ROW ROW RUMBLE ─────────────────────────────────────────────────────────────────────────────────────────────
/** The CAPTAIN (paddler): the pad frames the phone's own boat view (row-pad.js draws it in the DOM): a bezel window the
 *  page lays #row-motion into (st.rect "window"), the player's LED + a label printed on the bezel. data: { name, color, label } */
registerLayout("frame", (st, S, F) => {
  badge(st, S, F);
  const x = F.L - 4, y = 17, w = F.R - F.L + 8, h = F.bot - 17;
  const outer = rrect(x, y, w, h, 5), bb = bbR(x, y, w, h, 3);
  fill(shift(grow(outer), 0, 1), bb, S.shadow); fill(grow(outer), bb, S.ink); fill(outer, bb, S.x.base);
  each(outer, bb, (px, py) => { if (!outer(px, py - 1) || !outer(px - 1, py)) P(px, py, S.x.lt); else if (!outer(px, py + 1) || !outer(px + 1, py)) P(px, py, S.x.dk); });
  const side = 4, foot = 9;
  const win = { x: x + side, y: y + side, w: w - 2 * side, h: h - side - foot };
  R(win.x - 1, win.y - 1, win.w + 2, win.h + 2, S.ink);
  R(win.x, win.y, win.w, win.h, "#0b1424");
  const ly = y + h - foot + 2;
  R(x + side + 1, ly + 1, 3, 3, st.data.color || S.led);
  text(fitText(st.data.label ?? "SWING TO PADDLE", w - 20), x + side + 7, ly, FS, S.x.arrow, { align: "l" });
  // two grip ridges on the bezel's right foot
  for (let i = 0; i < 3; i++) R(x + w - side - 4 - i * 3, ly, 1, 5, S.x.dk);
  st.rect("window", win);
});
/** The FIRST MATE: tilt steers (the gauge shows it), the left thumb aims (stick "aim"), the right fires ("fire", with the
 *  reload bar). data: { name, color, tilt (−1..1), reload (0..1, 1 = loaded), label, train (TRAINING prompts up: no gauge),
 *  turn (the phone is upright: the TURN YOUR PHONE SIDEWAYS card instead of the controls), turnF (the card's frame, 0 / 1) } */
registerLayout("mate", (st, S, F) => {
  const D = st.data;
  if (D.turn) return void mateTurnCard(st, S, F);
  badge(st, S, F);
  const mid = (16 + F.bot) / 2;
  const d = Math.max(46, Math.min(54, F.bot - 30));
  const fx = F.R - d - 6, fy = Math.round(mid - d / 2) - 3;
  const loaded = (D.reload ?? 1) >= 1;
  const Rw = Math.max(25, Math.min(30, Math.floor((F.bot - 18) / 2) - 4));
  const scx = F.L + Rw + 6, scy = Math.round(mid);
  const gx = Math.round((scx + Rw + fx) / 2);
  stick(st, S, "aim", scx, scy, Rw, S.x, { x: 0, y: 14, w: gx - 14, h: H - 14 });
  if (!D.train) { // (the TRAINING prompts use the middle while they're up)
    gauge(S, gx, Math.round(mid) + 6, 17, Math.max(-60, Math.min(60, (D.tilt || 0) * 60)));
    text(D.label ?? "TILT", gx, Math.round(mid) + 12, FS, S.label);
    text("TO STEER", gx, Math.round(mid) + 19, FS, S.label);
  }
  button(st, S, "fire", fx, fy, d, S.c, loaded ? "FIRE" : "WAIT", FB, { hit: 6, dim: !loaded });
  // the reload bar under FIRE: 8 cells fill as it reloads
  const bw = d - 8, bx0 = fx + 4, by0 = fy + d + 4, n = 8, k = Math.max(0, Math.min(1, D.reload ?? 1));
  plate(S, bx0 - 1, by0 - 1, bw + 2, 6);
  for (let i = 0; i < n; i++) { const cw = Math.floor((bw - (n - 1)) / n), cx0 = bx0 + i * (cw + 1); R(cx0, by0 + 1, cw, 2, i < Math.round(k * n) ? (loaded ? S.c.base : S.c.dk) : S.hud.dim); }
});
/** Lines of str no wider than maxW in font f (o: text()'s bold / scale): the fewest lines, then the most even ones. */
function wrapText(str, maxW, f, o = {}) {
  const words = pixelText(str).split(" ").filter(Boolean), n = words.length;
  let best = [words.join(" ")], bestScore = Infinity;
  for (let mask = 0; mask < 1 << Math.max(0, n - 1); mask++) {
    const lines = [words[0] || ""];
    for (let i = 1; i < n; i++) { if ((mask >> (i - 1)) & 1) lines.push(words[i]); else lines[lines.length - 1] += " " + words[i]; }
    const ws = lines.map((ln) => textW(ln, f, o)), widest = Math.max(...ws);
    const score = Math.max(0, widest - maxW) * 1e6 + lines.length * 1e3 + widest - Math.min(...ws);
    if (score < bestScore) { bestScore = score; best = lines; }
  }
  return best;
}
/** The FIRST MATE with the phone upright: the stick and FIRE can't sit side by side in a tall pad, so there are NO controls
 *  (no touch regions: every touch is dead) — just TURN YOUR PHONE SIDEWAYS on the pad's own LCD, with a phone that turns
 *  (an upright phone → a sideways one; data.turnF = 1 lights the upright one for the two-frame blink). */
function mateTurnCard(st, S, F) {
  if (H > W) tallBody(S, F, { panel: { x: 5, y: 16, w: W - 10, h: F.bot - 17 } });
  badge(st, S, F);
  const hud = S.hud, cx = Math.round((F.L + F.R) / 2), top = 17, room = F.bot - 2 - top;
  const pw = Math.min(F.R - F.L - 4, 124), px0 = Math.round(cx - pw / 2), iw = pw - 8;
  const big = wrapText("TURN YOUR PHONE SIDEWAYS", iw, FB, { bold: true });
  const small = [...wrapText("TILT TO STEER", iw, FS), ...wrapText("THUMBS TO AIM & FIRE", iw, FS)];
  const bigH = big.length * 10 - 3, smallH = small.length * 7 - 2;
  const ph = Math.max(14, Math.min(30, room - (bigH + smallH + 9 + 8 + 18))), pwid = Math.round(ph * 0.56); // the upright phone
  const plH = Math.min(room, ph + 9 + bigH + 8 + smallH + 18), py0 = Math.round(top + (room - plH) / 2);
  plate(S, px0, py0, pw, plH);
  // the icon: upright phone → sideways phone (the lit one has the bright bezel + the gold screen)
  const phone = (x, y, w, h, on) => {
    const m = rrect(x, y, w, h, 3), bb = bbR(x, y, w, h, 1), tall = h > w;
    fill(m, bb, on ? hud.ink : hud.dim);
    const [sx, sy, sw, sh] = tall ? [x + 2, y + 3, w - 4, h - 8] : [x + 3, y + 2, w - 8, h - 4];
    R(sx, sy, sw, sh, on && hud.ink !== hud.gold ? hud.gold : hud.bg);
    if (on && hud.ink === hud.gold) R(sx + 1, sy + 1, sw - 2, sh - 2, hud.gold); // one-colour LCDs (BRICK): a dark line keeps the screen apart from the bezel
    if (tall) R(x + (w >> 1) - 1, y + h - 4, 2, 2, hud.bg); else R(x + w - 4, y + (h >> 1) - 1, 2, 2, hud.bg);
  };
  const up = st.data.turnF === 1, iy = py0 + 9, ix = Math.round(cx - (pwid + 5 + 9 + 5 + ph) / 2), ay = iy + (ph >> 1);
  phone(ix, iy, pwid, ph, up);
  R(ix + pwid + 5, ay - 1, 6, 2, hud.ink);
  for (let i = 0; i < 4; i++) R(ix + pwid + 5 + 5 + i, ay - 4 + i, 1, 8 - 2 * i, hud.ink);
  phone(ix + pwid + 19, iy + ((ph - pwid) >> 1), ph, pwid, !up);
  let y = iy + ph + 9;
  // the fonts' bold is a double strike, which fills a W in: the headline draws its own 7-wide W (one pixel wider than the rest)
  const headline = (ln, y) => {
    let x = Math.round(cx - (textW(ln, FB, { bold: true }) + (ln.split("W").length - 1)) / 2);
    for (const ch of ln) {
      if (ch === "W") { [99, 99, 99, 107, 127, 119, 99].forEach((row, r) => { for (let k = 0; k < 7; k++) if ((row >> (6 - k)) & 1) P(x + k, y + r, hud.gold); }); x++; }
      else text(ch, x, y, FB, hud.gold, { bold: true, align: "l" });
      x += 7;
    }
  };
  big.forEach((ln, i) => headline(ln, y + i * 10));
  y += bigH + 8;
  small.forEach((ln, i) => text(ln, cx, y + i * 7, FS, hud.ink));
}

// ── helper GW: TEE TIME + WHO'S THE FOX? (portrait bodies + DOM theming) ──────────────────────────────────────────
// Both games have DOM screens (text, media, motion prompts) that can't all be canvas, so besides their canvas layouts
// they theme their DOM from the style: skinVars() (CSS custom properties from the palettes), pixelLabel() (a label in
// the pads' own bitmap font, crisp at whole device pixels) and artPx() (the size of one art pixel in CSS px, so DOM
// bevels match the canvas). tallBody() paints a portrait body (the five paints are drawn for a sideways pad).
const hex2 = (c) => {
  const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(String(c || ""));
  return m ? "#" + [m[1], m[2], m[3]].map((v) => (+v).toString(16).padStart(2, "0")).join("") : /^#[0-9a-f]{6}$/i.test(c) ? c : "#ffffff";
};
const mixHex = (a, b, t) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
/** CSS custom properties (--sk-…) for a style: palettes a/b/c/x (dk mid base lt txt), body, ink, the LCD (hud) colours. */
export function skinVars(id) {
  const S = STYLES[id] || STYLES[DEFAULT_SKIN], v = {};
  for (const p of ["a", "b", "c", "x"]) for (const k of ["dk", "mid", "base", "lt", "txt", "arrow"]) if (S[p][k]) v[`--sk-${p}-${k}`] = S[p][k];
  v["--sk-x-txt"] = S.x.arrow;
  Object.assign(v, {
    "--sk-body": S.body, "--sk-tex": S.tex, "--sk-hi": S.hi, "--sk-lo": S.lo, "--sk-ink": S.ink, "--sk-shadow": S.shadow,
    "--sk-label": S.label, "--sk-print": S.print, "--sk-led": S.led, "--sk-well": S.well, "--sk-well-lo": S.wellLo, "--sk-well-hi": S.wellHi,
    "--sk-lcd": S.hud.bg, "--sk-lcd-ink": S.hud.ink, "--sk-lcd-dim": S.hud.dim, "--sk-lcd-gold": S.hud.gold, "--sk-lcd-good": S.hud.gem,
    "--sk-lcd-bad": S.hud.heart, "--sk-lcd-soft": mixHex(S.hud.ink, S.hud.bg, 0.3),
  });
  return v;
}
export function applySkinVars(el, id) { for (const [k, val] of Object.entries(skinVars(id))) el.style.setProperty(k, val); }
/** One art pixel in CSS px for this window (what createPadSkin would pick for a full-screen pad). */
export function artPx() {
  const dpr = window.devicePixelRatio || 1, w = innerWidth || 390, h = innerHeight || 844;
  const k = Math.max(1, Math.round(Math.min((Math.min(w, h) * dpr) / REF_H, (Math.max(w, h) * dpr) / REF_W)));
  return k / dpr;
}
/**
 * A label in the pads' bitmap font as a crisp <canvas> (whole device pixels per art pixel), for DOM buttons.
 * o: { font: "big" (5×7) | "small" (3×5), px (CSS px per art pixel, default artPx()), color (hex or rgb()), bold }
 */
export function pixelLabel(str, o = {}) {
  const f = o.font === "small" ? FS : FB, s = pixelText(str).trim();
  if (!s) return null;
  const bold = !!o.bold && f === FB, w = textW(s, f, { bold }) + (bold ? 1 : 0), h = f === FB ? 7 : 5;
  const dpr = window.devicePixelRatio || 1, k = Math.max(1, Math.round((o.px || artPx()) * dpr));
  const sW = W, sH = H, sB = BUF, art = new Uint32Array(w * h);
  W = w; H = h; BUF = art; // (drawing is synchronous: borrow the module's buffer and give it back)
  try { text(s, 0, 0, f, hex2(o.color), { align: "l", bold }); } finally { W = sW; H = sH; BUF = sB; }
  const cv = document.createElement("canvas");
  cv.width = w * k; cv.height = h * k;
  const ctx = cv.getContext("2d"), img = ctx.createImageData(w * k, h * k), out = new Uint32Array(img.data.buffer);
  for (let y = 0; y < h * k; y++) for (let x = 0; x < w * k; x++) out[y * w * k + x] = art[((y / k) | 0) * w + ((x / k) | 0)];
  ctx.putImageData(img, 0, 0);
  cv.className = "fbx-plabel";
  cv.setAttribute("aria-hidden", "true");
  cv.style.cssText = `display:block;flex:none;width:${(w * k) / dpr}px;height:${(h * k) / dpr}px;image-rendering:pixelated;pointer-events:none`;
  return cv;
}
const TALL_TEX = {
  foxbox: (x, y) => (x + y) % 6 === 0 && y % 2 === 0, brick: (x, y) => (x * 3 + y * 5) % 9 === 0 && y % 2 === 0,
  sixteen: (x, y) => (x + y * 2) % 7 === 0 && y % 3 === 0, homecomp: (x, y) => (x * 31 + y * 17) % 23 === 0, smoke: (x, y) => (x + y) % 2 === 0,
};
/**
 * A portrait body for style S, full bleed (draw it first in a layout: it covers the sideways paint). o.panel = { x, y, w, h }
 * draws the style's own panel there (FOXBOX's cream plate, BRICK's dark one, SMOKE's circuit board); without it, just the shell.
 */
function tallBody(S, F, o = {}) {
  const tex = TALL_TEX[S.id] || (() => false);
  if (S.id === "sixteen") {
    each(() => true, all(), (x, y) => P(x, y, (x + y) % 2 ? S.out : "#1b1c21"));
    const m = rrect(2, 1, W - 4, H - 2, 16);
    fill(shift(grow(m), 0, 1), all(), "#0b0b0e"); fill(grow(m), all(), S.ink);
    each(m, all(), (x, y) => P(x, y, tex(x, y) ? S.tex : S.body));
    each(m, all(), (x, y) => { if (!m(x, y - 1) || !m(x - 1, y)) P(x, y, S.hi); else if (!m(x, y - 2)) P(x, y, "#4a4d56"); else if (!m(x, y + 1) || !m(x + 1, y) || !m(x, y + 2)) P(x, y, S.lo); });
  } else {
    each(() => true, all(), (x, y) => P(x, y, tex(x, y) ? S.tex : S.id === "homecomp" && (x * 13 + y * 29) % 41 === 0 ? S.hi : S.body));
    R(0, 0, W, 1, S.hi); R(0, H - 1, W, 1, S.lo);
    if (S.id === "smoke") { const e = rrect(2, 2, W - 4, H - 4, 12); each(e, all(), (x, y) => { if (!e(x, y - 1) || !e(x - 1, y)) P(x, y, S.hi); else if (!e(x, y + 1) || !e(x + 1, y)) P(x, y, S.lo); }); }
  }
  const p = o.panel;
  if (!p) return;
  if (S.id === "foxbox") {
    const m = rrect(p.x, p.y, p.w, p.h, 6);
    fill(shift(grow(m), 0, 1), all(), S.lo); fill(grow(m), all(), S.ink); fill(m, all(), S.panel);
    each(m, all(), (x, y) => { if (!m(x, y + 1)) P(x, y, S.panelLo); });
  } else if (S.id === "brick") {
    const m = rrect(p.x, p.y, p.w, p.h, 3);
    fill(shift(m, 0, -1), all(), S.lo); fill(m, all(), S.panel);
    each(m, all(), (x, y) => { if (!m(x, y - 1) || !m(x, y - 2)) P(x, y, S.panelLo); else if (!m(x, y + 1)) P(x, y, S.panelHi); });
  } else if (S.id === "smoke") {
    const pcb = rrect(p.x, p.y, p.w, p.h, 5);
    each(pcb, all(), (x, y) => { if (!pcb(x, y - 1) || !pcb(x, y + 1) || !pcb(x - 1, y) || !pcb(x + 1, y)) P(x, y, "#34514a"); else P(x, y, (x + y) % 2 ? "#22302f" : "#283a37"); });
    const x1 = p.x + p.w - 1, y1 = p.y + p.h - 1;
    for (let y = p.y + 14; y < y1 - 14; y += 2) { P(p.x + 4, y, "#7d7448"); P(x1 - 4, y, "#7d7448"); }
    [[p.x + 5, p.y + 5], [x1 - 5, p.y + 5], [p.x + 5, y1 - 5], [x1 - 5, y1 - 5]].forEach(([x, y]) => { fill(disc(x - 3, y - 3, 7), all(), "#4a475e"); fill(disc(x - 2, y - 2, 5), all(), "#17161e"); P(x, y, "#6e6a88"); });
  }
}
PX.tallBody = tallBody;
PX.pixelText = pixelText;
/** "body": just the portrait shell (WHO'S THE FOX?'s DOM screens sit on it). */
registerLayout("body", (st, S, F) => tallBody(S, F), { brand: false });
