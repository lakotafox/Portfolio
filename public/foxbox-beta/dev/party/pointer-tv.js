/**
 * pointer-tv.js — USE CURSOR on the TV: one Wii-style pixel cursor per phone over the lobby (the lobby only, for now).
 *
 * The phone (pointer-pad.js) turns its gyro into a cursor position and sends it to its own TV as
 *   {t:"game", m:{type:"ptr", x, y}}       x, y = 0..10000 across the whole TV screen (≤ 40 a second + a 1 s heartbeat)
 *   … + d:1 | d:0                          finger down / up (the cursor squishes while it's down)
 *   … + tap:1                              a tap: a "click" at x, y (where the finger went down, before the tap jolted
 *                                          the phone)
 *   … + rc:1                               recentred (the cursor jumps to the middle of the screen)
 *   {t:"game", m:{type:"ptr", off:1}}      USE CURSOR off, or the phone left the lobby
 * host.js hands each one here with its player: update(id, m, {name, base, light, dark, picker}). A tap asks host.js
 * what it does — onTap(id, hit) → "pick" | "select" | "ping" — with hit = the game card under the cursor:
 * {kind:"card", gameId, offset} on lobby2's carousel (offset 0 = the middle card), {kind:"mini", gameId} on its grid,
 * or null. Everything is drawn on a layer of its own (no pointer events, above the lobby). A cursor not heard from for
 * STALE_MS fades out (its phone locked, or the page hidden) and comes back with its next message.
 */
const PIX = `"FoxBox Pixel", "Press Start 2P", ui-monospace, monospace`;
const CREAM = "#fff9f1", SHADOW = "#04050e", GOLD = "#ffd23f", INK = "#0a1428";
const STALE_MS = 3500;
const FOLLOW = 30; // 1/s: how fast the drawn cursor catches up with the phone's position (smooth between packets)
const HIT_EVERY_MS = 50; // hover check per cursor
const FX_MS = 700;

// The arrow, 12 x 18: "X" = the outline, "#" = the player's colour (its light shade down the left edge). A cream
// halo is added around the outline so it reads on light and dark looks alike. The tip is the top-left "X".
const ARROW = [
  "X...........",
  "XX..........",
  "X#X.........",
  "X##X........",
  "X###X.......",
  "X####X......",
  "X#####X.....",
  "X######X....",
  "X#######X...",
  "X########X..",
  "X#########X.",
  "X######XXXXX",
  "X###X##X....",
  "X##X.X##X...",
  "X#X..X##X...",
  "XX....X##X..",
  "X.....X##X..",
  ".......XX...",
];
/** The arrow as SVG rects (crisp pixels), 1 unit per pixel, with the 1-pixel halo: (w + 2) x (h + 2) units. */
function arrowSvg() {
  const h = ARROW.length, w = ARROW[0].length;
  const at = (x, y) => (y >= 0 && y < h && x >= 0 && x < w ? ARROW[y][x] : ".");
  const runs = { halo: "", line: "", fill: "", lite: "" };
  for (let y = -1; y <= h; y++) {
    for (let x = -1; x <= w; x++) {
      const ch = at(x, y);
      let k = null;
      if (ch === "X") k = "line";
      else if (ch === "#") k = x === 1 ? "lite" : "fill";
      else {
        let near = false;
        for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) if (at(x + dx, y + dy) === "X") { near = true; break; }
        if (near) k = "halo";
      }
      if (k) runs[k] += `<rect x="${x + 1}" y="${y + 1}" width="1" height="1"/>`;
    }
  }
  return `<svg class="ptr-arrow" viewBox="0 0 ${w + 2} ${h + 2}" shape-rendering="crispEdges" aria-hidden="true">` +
    `<g fill="${CREAM}">${runs.halo}</g><g fill="${SHADOW}">${runs.line}</g>` +
    `<g class="ptr-f">${runs.fill}</g><g class="ptr-l">${runs.lite}</g></svg>`;
}

function injectCss() {
  if (document.getElementById("ptr-tv-css")) return;
  const css = document.createElement("style");
  css.id = "ptr-tv-css";
  // sizes in rem: the TV page's root font follows the window (16 px at 1920 x 1080), so a pixel = 0.25rem = 4 px there
  css.textContent = `
#ptr-tv { position: fixed; inset: 0; z-index: 95; pointer-events: none; overflow: hidden; contain: strict; }
#ptr-tv .ptr { position: absolute; left: 0; top: 0; width: 0; height: 0; will-change: transform; transition: opacity 0.25s; }
#ptr-tv .ptr[data-shown="0"] { opacity: 0; }
#ptr-tv .ptr-arrow { position: absolute; left: -0.25rem; top: -0.25rem; width: 3.5rem; height: 5rem; display: block;
  filter: drop-shadow(0.25rem 0.375rem 0 rgba(4, 5, 14, 0.45)); transform-origin: 0.25rem 0.25rem; transition: transform 0.08s; }
#ptr-tv .ptr-f { fill: var(--c); }
#ptr-tv .ptr-l { fill: var(--l); }
#ptr-tv .ptr[data-down="1"] .ptr-arrow { transform: scale(0.8); }
#ptr-tv .ptr-tag { position: absolute; left: 2.25rem; top: 4.25rem; box-sizing: border-box; max-width: 16rem; overflow: hidden;
  text-overflow: ellipsis; padding: 0.45rem 0.55rem 0.35rem; border: 0.19rem solid ${CREAM}; background: var(--c); color: var(--ink);
  box-shadow: 0 0.25rem 0 ${SHADOW}; font: 400 0.8rem/1 ${PIX}; letter-spacing: 0.04em; text-transform: uppercase; white-space: nowrap; }
#ptr-tv .ptr[data-down="1"] .ptr-tag { transform: translateY(0.19rem); box-shadow: 0 0.06rem 0 ${SHADOW}; }
#ptr-tv .ptr[data-fx="1"] .ptr-tag { left: auto; right: 0.6rem; }
#ptr-tv .ptr[data-fy="1"] .ptr-tag { top: auto; bottom: 0.9rem; }
#ptr-tv .ptr-frame { position: absolute; left: 0; top: 0; box-sizing: border-box; border: 0.375rem solid var(--c);
  box-shadow: 0 0 0 0.19rem ${CREAM}, 0 0 0 0.375rem ${SHADOW}, 0 0.75rem 0 0.375rem rgba(4, 5, 14, 0.3); }
#ptr-tv .ptr-frame[hidden] { display: none; }
#ptr-tv .ptr-frame[data-flash="1"] { border-color: ${GOLD}; }
#ptr-tv .ptr-frame-l { position: absolute; left: 50%; top: -0.19rem; transform: translate(-50%, -50%); padding: 0.5rem 0.7rem 0.4rem;
  border: 0.19rem solid ${CREAM}; background: ${GOLD}; color: ${INK}; box-shadow: 0 0.25rem 0 ${SHADOW};
  font: 400 0.85rem/1 ${PIX}; letter-spacing: 0.04em; text-transform: uppercase; white-space: nowrap; }
#ptr-tv .ptr-frame-l:empty { display: none; }
#ptr-tv .ptr-ring { position: absolute; left: 0; top: 0; box-sizing: border-box; border: 0.375rem solid var(--c);
  box-shadow: 0 0 0 0.19rem ${CREAM}; animation: ptr-ring 0.55s steps(7, end) forwards; }
#ptr-tv .ptr-ring.big { border-color: ${GOLD}; animation-duration: 0.65s; --s: 12rem; }
#ptr-tv .ptr-ring.late { animation-delay: 0.12s; opacity: 0; }
@keyframes ptr-ring {
  from { width: 1.5rem; height: 1.5rem; margin: -0.75rem 0 0 -0.75rem; opacity: 1; }
  to { width: var(--s, 7rem); height: var(--s, 7rem); margin: calc(var(--s, 7rem) / -2) 0 0 calc(var(--s, 7rem) / -2); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) { #ptr-tv .ptr-ring { animation-duration: 0.01s; } }
`;
  document.head.append(css);
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/** Dark ink on light slot colours (yellow, cyan), cream on dark ones. */
function inkFor(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ""));
  if (!m) return INK;
  const n = parseInt(m[1], 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? INK : CREAM;
}

/** lobby2's game cards on this TV, the ones a cursor can point at: the carousel's three visible cards (the middle one
 * first: it's drawn on top) or the grid's minis (in the lobby state's games order). Empty when the lobby is hidden. */
function targets() {
  const out = [];
  const root = document.querySelector('.fbc[data-mode="tv"]');
  if (!root) return out;
  for (const s of root.querySelectorAll(".fbc-slot")) {
    const off = Number(s.dataset.offset);
    if (!Number.isFinite(off) || Math.abs(off) > 1 || !s.dataset.gameId) continue;
    const op = s.style.opacity === "" ? 1 : Number(s.style.opacity);
    if (!(op >= 0.5)) continue;
    const r = s.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    out.push({ kind: "card", gameId: s.dataset.gameId, offset: off, el: s, r });
  }
  out.sort((a, b) => Math.abs(a.offset) - Math.abs(b.offset));
  const games = (globalThis.FOXBOX_LOBBY_STATE && globalThis.FOXBOX_LOBBY_STATE.games) || [];
  root.querySelectorAll(".fbc-grid .fbc-mini").forEach((m, i) => {
    const r = m.getBoundingClientRect();
    if (r.width >= 4 && r.height >= 4 && games[i] && games[i].id) out.push({ kind: "mini", gameId: games[i].id, offset: null, el: m, r });
  });
  return out;
}
const inside = (r, x, y) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
const hitIn = (list, x, y) => list.find((t) => inside(t.r, x, y)) || null;

export function createPointerTv({ onTap = null } = {}) {
  injectCss();
  const layer = document.createElement("div");
  layer.id = "ptr-tv";
  layer.dataset.test = "pointer-layer";
  layer.setAttribute("aria-hidden", "true");
  document.body.append(layer);
  const svg = arrowSvg();
  const cursors = new Map(); // id → cursor
  let raf = 0, lastT = 0;

  function make(id) {
    const el = document.createElement("div");
    el.className = "ptr";
    el.dataset.player = id;
    el.dataset.shown = "0";
    el.innerHTML = `${svg}<div class="ptr-tag"></div>`;
    const frame = document.createElement("div");
    frame.className = "ptr-frame";
    frame.hidden = true;
    frame.dataset.player = id;
    frame.innerHTML = `<span class="ptr-frame-l"></span>`;
    layer.append(frame, el);
    const c = { id, el, tag: el.querySelector(".ptr-tag"), frame, label: frame.querySelector(".ptr-frame-l"), who: {}, x: 0.5, y: 0.5,
      tx: 0.5, ty: 0.5, px: -1, py: -1, placed: false, seen: 0, shown: false, down: false, hover: null, hitAt: 0, flashUntil: 0 };
    cursors.set(id, c);
    return c;
  }
  function dress(c, who) {
    const w = { name: String(who.name || "?"), base: who.base || "#888888", light: who.light || who.base || "#aaaaaa", picker: !!who.picker };
    if (w.name !== c.who.name) c.tag.textContent = w.name;
    if (w.base !== c.who.base || w.light !== c.who.light) {
      for (const n of [c.el, c.frame]) {
        n.style.setProperty("--c", w.base);
        n.style.setProperty("--l", w.light);
        n.style.setProperty("--ink", inkFor(w.base));
      }
    }
    c.who = w;
  }
  function setShown(c, on) {
    if (c.shown === on) return;
    c.shown = on;
    c.el.dataset.shown = on ? "1" : "0";
    if (!on) setHover(c, null);
  }
  function setHover(c, hit) {
    const same = !!(c.hover && hit && c.hover.el === hit.el);
    c.hover = hit;
    if (same) return;
    c.frame.hidden = !hit;
    c.frame.dataset.game = hit ? hit.gameId : "";
  }
  function ring(c, kind, x, y) {
    const mk = (cls) => {
      const r = document.createElement("div");
      r.className = `ptr-ring${cls}`;
      r.style.setProperty("--c", c.who.base || "#888888");
      r.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      layer.append(r);
      setTimeout(() => r.remove(), FX_MS + 200);
    };
    if (kind === "pick") {
      mk(" big");
      mk(" big late");
    } else {
      mk("");
      if (kind === "select") mk(" late");
    }
  }

  function frameLoop(t) {
    raf = 0;
    const dt = lastT ? clamp((t - lastT) / 1000, 0.001, 0.1) : 1 / 60;
    lastT = t;
    const now = performance.now();
    const W = window.innerWidth, H = window.innerHeight;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const k = 1 - Math.exp(-FOLLOW * dt);
    let list = null;
    let live = false;
    for (const c of cursors.values()) {
      if (c.shown && now - c.seen > STALE_MS) setShown(c, false);
      if (!c.shown) continue;
      live = true;
      c.x += (c.tx - c.x) * k;
      c.y += (c.ty - c.y) * k;
      if (Math.abs(c.tx - c.x) * W < 0.25) c.x = c.tx;
      if (Math.abs(c.ty - c.y) * H < 0.25) c.y = c.ty;
      const px = clamp(Math.round(c.x * W), 0, W - 1), py = clamp(Math.round(c.y * H), 0, H - 1);
      if (px !== c.px || py !== c.py) {
        c.px = px;
        c.py = py;
        c.el.style.transform = `translate3d(${px}px, ${py}px, 0)`;
        // near the right / bottom edge the name tag goes to the arrow's left / above it
        const fx = px > W - rem * 19 ? "1" : "0", fy = py > H - rem * 7.5 ? "1" : "0";
        if (c.el.dataset.fx !== fx) c.el.dataset.fx = fx;
        if (c.el.dataset.fy !== fy) c.el.dataset.fy = fy;
      }
      if (now - c.hitAt >= HIT_EVERY_MS) {
        c.hitAt = now;
        list ||= targets();
        setHover(c, hitIn(list, px, py));
      }
    }
    // the hover frames: around the card each cursor points at (it may be moving: the carousel springs), nested when
    // several cursors point at the same card; the picker's says what a tap does
    const nest = new Map();
    for (const c of cursors.values()) {
      if (!c.shown || !c.hover) continue;
      const r = c.hover.el.getBoundingClientRect();
      if (r.width < 4) {
        setHover(c, null);
        continue;
      }
      const n = nest.get(c.hover.el) || 0;
      nest.set(c.hover.el, n + 1);
      const pad = rem * (0.5 + n * 0.875);
      const f = c.frame.style;
      f.left = `${Math.round(r.left - pad)}px`;
      f.top = `${Math.round(r.top - pad)}px`;
      f.width = `${Math.round(r.width + pad * 2)}px`;
      f.height = `${Math.round(r.height + pad * 2)}px`;
      const say = c.who.picker ? (c.hover.kind === "card" && c.hover.offset === 0 ? "Tap to pick" : "Tap to select") : "";
      if (c.label.textContent !== say) c.label.textContent = say;
      const flash = now < c.flashUntil ? "1" : "0";
      if (c.frame.dataset.flash !== flash) c.frame.dataset.flash = flash;
    }
    if (live) raf = requestAnimationFrame(frameLoop);
    else lastT = 0;
  }
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(frameLoop);
  };

  const api = {
    /** One phone's message (see the top of this file); who = {name, base, light, picker}. */
    update(id, m, who = {}) {
      if (!id || !m || typeof m !== "object") return;
      if (m.off) return api.remove(id);
      const c = cursors.get(id) || make(id);
      dress(c, who);
      const x = Number(m.x), y = Number(m.y);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        c.tx = clamp(x / 10000, 0, 1);
        c.ty = clamp(y / 10000, 0, 1);
        // the first sighting, a recentre and a tap (the click lands where the finger went down) jump there at once
        if (!c.placed || m.rc || m.tap || !c.shown) {
          c.x = c.tx;
          c.y = c.ty;
          c.placed = true;
        }
      }
      if (!c.placed) return;
      c.seen = performance.now();
      setShown(c, true);
      if (m.d === 1 || m.d === 0) {
        c.down = m.d === 1;
        c.el.dataset.down = c.down ? "1" : "0";
      }
      const W = window.innerWidth, H = window.innerHeight;
      const px = clamp(Math.round(c.tx * W), 0, W - 1), py = clamp(Math.round(c.ty * H), 0, H - 1);
      if (m.rc) ring(c, "rc", px, py);
      if (m.tap) {
        const hit = hitIn(targets(), px, py);
        let what = "ping";
        try {
          what = (onTap && onTap(id, hit)) || "ping";
        } catch (e) {
          console.warn("[pointer] tap failed", e);
        }
        ring(c, what, px, py);
        if (hit && what !== "ping") {
          c.hitAt = 0;
          c.flashUntil = performance.now() + 450;
        }
        api.taps.push({ id, what, gameId: hit ? hit.gameId : null, at: Date.now() });
        if (api.taps.length > 40) api.taps.shift();
      }
      kick();
    },
    /** This player's cursor goes (USE CURSOR off, the phone left, the lobby ended). */
    remove(id) {
      const c = cursors.get(id);
      if (!c) return;
      cursors.delete(id);
      c.el.remove();
      c.frame.remove();
    },
    clear() {
      for (const id of [...cursors.keys()]) api.remove(id);
    },
    /** QA / debugging: every cursor as drawn now. */
    list() {
      return [...cursors.values()].map((c) => ({ id: c.id, x: c.x, y: c.y, tx: c.tx, ty: c.ty, px: c.px, py: c.py, shown: c.shown,
        down: c.down, name: c.who.name, color: c.who.base, hover: c.hover ? { kind: c.hover.kind, gameId: c.hover.gameId, offset: c.hover.offset } : null,
        label: c.label.textContent }));
    },
    taps: [], // the last taps and what they did (QA)
  };
  globalThis.__pointerTv = api;
  return api;
}
