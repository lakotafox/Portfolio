/**
 * controller-look.js — the in-game phone controllers wear the same rolled look as the lobby
 * (web version only: pad.js imports it when globalThis.FOXBOX_LOBBY2 is set; it installs itself).
 *
 * What it does, all of it optional and fail-safe:
 *   - follows the lobby's look seed (FOXBOX_LOBBY_STATE.look.seed + the "foxbox:lobby" event)
 *     and hands it to window.FOXBOX_LOOK (the lobby2 bundle, loaded by lobby2-pad.js);
 *   - while a controller is on screen (#pad-screen showing and the lobby layer not covering it)
 *     mounts the rolled background behind it in "controller" mode (phone pool, half resolution,
 *     strong scrim, strict fps watchdog that goes calm on its own) and a rolled heading over the
 *     game name; unmounts both the moment the controller isn't showing;
 *   - while a game's own full-screen picture covers the controller (body.pad-covered: FOX BOWLING's walk view) the
 *     backdrop shows only in the pad's 12 px frame, so it is FROZEN there: a still copy of its last frame stays (same
 *     colours, same picture; clipped to the frame round [data-pad-cover]) and the live one is unmounted (its WebGL
 *     released). Rolled backdrops draw 1-12 Mpx a frame
 *     on a DPR 3 phone; behind the walk view that was the phone's biggest GPU cost for nothing (Nov 16 phone-perf).
 *     Uncovered: the live backdrop comes back;
 *   - recolours the controller's panels and buttons from the --fb-* palette variables: solid
 *     fills, strong outlines, contrast-checked label colour. The player's own colour stays on
 *     their stick knob and name ball so you can still find yourself.
 * If FOXBOX_LOOK never shows up, or anything here throws, the controller is left exactly as it was.
 */

const CSS = `
body.clook-on #pad-screen { background: var(--fb-bg, #0b1020); isolation: isolate; color: var(--fb-ink, #fff); }
body.clook-on #pad-screen > * { position: relative; z-index: 1; }
body.clook-on #pad-screen > #clook-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; border-radius: inherit; }
body.clook-on #clook-bg .fbx2-lookbg { position: absolute; inset: 0; }

/* panels: the rolled card colour, solid enough to read on any backdrop */
body.clook-on #status,
body.clook-on #boats,
body.clook-on #steer,
body.clook-on #cap-aim,
body.clook-on #row-motion,
body.clook-on #cap-mid {
  background: color-mix(in srgb, var(--fb-card, #1b2340) 88%, transparent);
  border: 3px solid var(--fb-border, rgba(255,255,255,.3));
  color: var(--fb-ink, #fff);
}
body.clook-on #cap-mid { border-radius: 18px; padding: 8px 6px; }
body.clook-on #row-motion { border-radius: 24px; padding: 10px; }
body.clook-on #steer.active,
body.clook-on #cap-aim.active { background: color-mix(in srgb, var(--fb-card, #1b2340) 70%, var(--fb-accent, #ff5a3c)); }
body.clook-on #status-small,
body.clook-on #steer-label,
body.clook-on #cap-aim > span,
body.clook-on #row-note,
body.clook-on #cap-note,
body.clook-on #boats-head { color: var(--fb-muted, #c8d0e8); opacity: 1; }
body.clook-on #track { background: color-mix(in srgb, var(--fb-ink, #fff) 22%, transparent); }
body.clook-on #steer .half.on { color: var(--fb-accent, #ff5a3c); }
body.clook-on #steer.xy::after,
body.clook-on #cap-aim-ring { border-color: color-mix(in srgb, var(--fb-ink, #fff) 45%, transparent); }

/* the stick knobs keep the player's colour, with the palette's strong outline */
body.clook-on #knob,
body.clook-on #cap-aim-knob { border-color: var(--fb-outline, #fff); }

/* big action buttons: solid accent fill, strong outline, readable label (never a rolled effect) */
body.clook-on #bonk,
body.clook-on #oar,
body.clook-on #cap-fire {
  background: var(--fb-btn, #ff5a3c);
  color: var(--fb-btn-ink, #fff);
  border-color: var(--fb-outline, #fff);
  text-shadow: none;
}
body.clook-on #bonk { box-shadow: inset 0 0 0 10px color-mix(in srgb, var(--c, #888) 75%, transparent), 0 10px 24px rgba(0,0,0,.45); }
body.clook-on #cap-fire-label { color: var(--fb-btn-ink, #fff); text-shadow: none; }
body.clook-on #row-enable,
body.clook-on #row-ready,
body.clook-on #cap-enable,
body.clook-on #status button:not(.row-link) {
  background: var(--fb-btn, #ff5a3c);
  color: var(--fb-btn-ink, #fff);
  border: 3px solid var(--fb-outline, #fff);
  box-shadow: 0 4px 0 color-mix(in srgb, var(--fb-btn, #ff5a3c) 60%, #000);
}
body.clook-on .row-link,
body.clook-on #edit-name,
body.clook-on #cap-left,
body.clook-on #cap-right {
  background: var(--fb-card, #1b2340);
  color: var(--fb-ink, #fff);
  border: 2px solid var(--fb-border, rgba(255,255,255,.3));
}
body.clook-on #conn { background: color-mix(in srgb, var(--fb-card, #1b2340) 85%, transparent); color: var(--fb-ink, #fff); }

/* the rolled heading sits over the game name line; the plain text stays as the fallback */
body.clook-on #clook-heading { display: block; font-size: clamp(16px, 5vw, 24px); line-height: 1.15; margin-top: 4px; min-height: 1.15em; max-width: 100%; white-space: nowrap; overflow: hidden; }
body.clook-on #clook-heading * { white-space: nowrap; }
body.clook-on #clook-heading { text-align: center; }
body.clook-on .clook-heading-fit { display: inline-block; transform-origin: 50% 50%; }
@media (orientation: landscape) { body.clook-on #clook-heading { font-size: clamp(14px, 2.6vw, 20px); flex: none; } }
body.clook-on #clook-heading:empty { display: none; }
body.clook-on #clook-heading:not(:empty) + #game-name { display: none; }
#clook-heading { display: none; }
`;

const look = () => {
  const L = globalThis.FOXBOX_LOOK;
  return L && typeof L.mountBackground === "function" && typeof L.setSeed === "function" ? L : null;
};

let started = false;
let bg = null; // { el, handle }
let heading = null; // { el, handle, text }
let lastSeed = null;

function safe(fn) {
  try {
    return fn();
  } catch (e) {
    console.warn("[controller-look]", e);
    return undefined;
  }
}

function lobbyState() {
  return globalThis.FOXBOX_LOBBY_STATE || null;
}

function gameName(st) {
  if (!st) return "";
  const id = st.currentGameId || st.selectedGameId;
  const g = (st.games || []).find((x) => x && x.id === id);
  return g ? String(g.name || "") : "";
}

function followSeed() {
  const L = look();
  const st = lobbyState();
  const seed = st && st.look && Number(st.look.seed);
  if (!L || !Number.isFinite(seed) || seed === lastSeed) return;
  lastSeed = seed;
  safe(() => L.setSeed(seed, "phone"));
  safe(() => L.applyVars && L.applyVars());
}

function controllerShowing() {
  const pad = document.getElementById("pad-screen");
  if (!pad || !pad.classList.contains("show")) return false;
  if (document.body.classList.contains("fbx2-lobby-on")) return false; // the lobby layer covers it
  if (pad.classList.contains("skin-on")) return false; // SKINS: the player's pixel pad is the look (no rolled background under it)
  if (pad.classList.contains("lobby-skin")) return false; // LOBBY LOOK: the shell's own screens are on the player's pad too
  return true;
}

function mountAll() {
  const L = look();
  const pad = document.getElementById("pad-screen");
  if (!L || !pad || !L.current) return false;
  if (!bg) {
    const el = document.createElement("div");
    el.id = "clook-bg";
    el.setAttribute("aria-hidden", "true");
    pad.prepend(el);
    const handle = safe(() => L.mountBackground(el, { mode: "controller" }));
    if (!handle) {
      el.remove();
      return false;
    }
    bg = { el, handle };
  }
  syncHeading();
  document.body.classList.add("clook-on");
  return true;
}

function syncHeading() {
  const L = look();
  const name = document.getElementById("game-name");
  if (!L || typeof L.mountHeading !== "function" || !name) return;
  const text = gameName(lobbyState());
  if (heading && heading.text === text) return;
  if (heading) {
    safe(() => heading.stop());
    safe(() => heading.handle.unmount());
    heading.el.remove();
    heading = null;
  }
  if (!text) return;
  const el = document.createElement("div");
  el.id = "clook-heading";
  const inner = document.createElement("span");
  inner.className = "clook-heading-fit";
  el.append(inner);
  name.before(el);
  const handle = safe(() => L.mountHeading(inner, { text }));
  if (!handle) {
    el.remove();
    return;
  }
  // rolled title effects size themselves; shrink the whole heading to fit the line instead of clipping
  const fit = () =>
    safe(() => {
      inner.style.transform = "";
      // the effect's letters can overflow their own box (big type, transforms, svg), so measure the
      // painted extent of everything inside rather than the box itself
      let lo = Infinity, hi = -Infinity;
      const nodes = inner.querySelectorAll("*");
      for (let i = 0; i < nodes.length && i < 300; i++) {
        const r = nodes[i].getBoundingClientRect();
        if (r.width > 0) { lo = Math.min(lo, r.left); hi = Math.max(hi, r.right); }
      }
      const w = Math.max(inner.scrollWidth, hi > lo ? hi - lo : 0), room = el.clientWidth;
      if (w > 0 && room > 0 && w > room) inner.style.transform = `scale(${(room / w).toFixed(3)})`;
    });
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(fit) : null;
  if (ro) {
    ro.observe(el);
    ro.observe(inner);
  }
  const t = setInterval(fit, 500);
  setTimeout(() => clearInterval(t), 4000);
  fit();
  heading = { el, handle, text, stop: () => (ro && ro.disconnect(), clearInterval(t)) };
}

// ── the frozen backdrop (body.pad-covered) ──
function covered() {
  return document.body.classList.contains("pad-covered");
}
/** a still of the backdrop in `host`: its elements cloned (classes and inline styles come along; what an animation moves
 *  right now is copied over and the animation stopped there), its canvases copied. Cheap on purpose (a phone, mid-game):
 *  one small read-back a canvas to see it is not blank. -> { box, canvases, painted } */
const MOVED = ["transform", "opacity", "filter", "background-position", "background-color", "clip-path", "translate", "scale", "rotate"];
function stillOf(host) {
  const box = document.createElement("div");
  box.className = "clook-still";
  box.style.cssText = "position:absolute;inset:0;";
  let canvases = 0, painted = 0;
  const probe = document.createElement("canvas");
  probe.width = probe.height = 6;
  const pg = probe.getContext("2d", { willReadFrequently: true });
  for (const child of host.children) {
    const clone = child.cloneNode(true);
    const src = [child, ...child.querySelectorAll("*")], dst = [clone, ...clone.querySelectorAll("*")];
    src.forEach((s, i) => {
      const d = dst[i];
      if (s.getAnimations && s.getAnimations().length) { const cs = getComputedStyle(s); for (const p of MOVED) d.style.setProperty(p, cs.getPropertyValue(p)); }
      d.style.setProperty("animation", "none", "important");
      d.style.setProperty("transition", "none", "important");
      if (s.tagName === "CANVAS" && s.width > 2 && s.height > 2 && s.getClientRects().length) {   // (a backdrop's hidden 1x1 helper canvas is no picture)
        canvases++;
        try {
          d.getContext("2d").drawImage(s, 0, 0);   // (a WebGL canvas: what it shows, when it drew this frame)
          pg.clearRect(0, 0, 6, 6);
          pg.drawImage(s, 0, 0, 6, 6);
          const px = pg.getImageData(0, 0, 6, 6).data;
          for (let k = 3; k < px.length; k += 4) if (px[k] > 0) { painted++; break; }
        } catch {}
      }
    });
    box.append(clone);
  }
  return { box, canvases, painted };
}
function freeze() {
  if (!bg || bg.still || bg.freezing) return;
  bg.freezing = true;
  let tries = 0;
  const again = (ms) => (ms ? setTimeout(() => requestAnimationFrame(capture), ms) : requestAnimationFrame(capture));
  function capture() {
    if (!bg) return;
    if (!covered() || bg.still) { bg.freezing = false; return; }
    // only a backdrop that is up: the rolled piece drawn (its chunk loads lazily; the calm look meanwhile), or the calm
    // look for good (data-bg "calm": nothing rolled, or the fps watchdog turned it off)
    const lb = bg.el.querySelector(".fbx2-lookbg"), calm = !!lb && lb.dataset.bg === "calm";
    if (!lb || (!calm && !bg.el.querySelector(".fbx2-rolled"))) { again(300); return; }
    const st = safe(() => stillOf(bg.el));
    if (st && (calm || (st.canvases && st.painted === st.canvases) || (!st.canvases && !bg.el.querySelector(".fbx2-rolled canvas")))) {
      safe(() => bg.handle.unmount());
      bg.el.replaceChildren(st.box);
      clipStill();
      bg.still = true; bg.freezing = false; bg.seed = look() && look().current ? look().current.seed : null;
      return;
    }
    // (a WebGL backdrop's picture is only there in a frame it drew: the next frames, then a pause, never a blank still)
    again(++tries % 8 ? 0 : 300);
  }
  again(0);
}
/** the still is only seen round the cover ([data-pad-cover]: the game's opaque picture): it is clipped to that frame
 *  (the cover's box less its rounded corners), so the phone does not composite a full-screen picture under the game */
function clipStill() {
  const box = bg && bg.still && bg.el.querySelector(".clook-still"), cover = document.querySelector("[data-pad-cover]");
  if (!box) return;
  box.style.clipPath = "";
  if (!cover) return;
  const a = bg.el.getBoundingClientRect(), c = cover.getBoundingClientRect(), cs = getComputedStyle(cover);
  const r = Math.max(...["borderTopLeftRadius", "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius"].map((k) => parseFloat(cs[k]) || 0)) + 2;
  const x0 = c.left - a.left + r, y0 = c.top - a.top + r, x1 = c.right - a.left - r, y1 = c.bottom - a.top - r;
  if (!(x1 - x0 > 40 && y1 - y0 > 40)) return;
  box.style.clipPath = `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${x0}px ${y0}px, ${x1}px ${y0}px, ${x1}px ${y1}px, ${x0}px ${y1}px, ${x0}px ${y0}px)`;
}
function thaw() {
  if (!bg || !bg.still) return;
  const L = look();
  bg.still = false;
  bg.el.replaceChildren();
  const handle = L && safe(() => L.mountBackground(bg.el, { mode: "controller" }));
  if (handle) bg.handle = handle;
  else { bg.el.remove(); bg = null; }
}

function unmountAll() {
  document.body.classList.remove("clook-on");
  if (bg) {
    if (!bg.still) safe(() => bg.handle.unmount());
    bg.el.remove();
    bg = null;
  }
  if (heading) {
    safe(() => heading.stop());
    safe(() => heading.handle.unmount());
    heading.el.remove();
    heading = null;
  }
}

let syncQueued = false;
function sync() {
  if (syncQueued) return;
  syncQueued = true;
  requestAnimationFrame(() => {
    syncQueued = false;
    safe(() => {
      followSeed();
      if (look() && controllerShowing()) {
        if (!mountAll()) unmountAll();
        else {
          syncHeading();
          // a new roll while frozen: the live one again (frozen again below while still covered)
          if (bg && bg.still && (!covered() || (look().current && look().current.seed !== bg.seed))) thaw();
          if (bg && covered()) freeze();
        }
      } else unmountAll();
    });
  });
}

function start() {
  if (started) return;
  started = true;
  const style = document.createElement("style");
  style.id = "clook-css";
  style.textContent = CSS;
  document.head.append(style);
  window.addEventListener("foxbox:lobby", sync);
  window.addEventListener("foxbox:look", sync);
  window.addEventListener("resize", () => safe(clipStill));
  // the pad switches screens by class; the lobby layer toggles a body class
  const mo = new MutationObserver(sync);
  mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  const watchPad = () => {
    const pad = document.getElementById("pad-screen");
    if (pad) mo.observe(pad, { attributes: true, attributeFilter: ["class"] });
  };
  watchPad();
  // FOXBOX_LOOK arrives when lobby2-pad.js has loaded the bundle; check until it does
  let tries = 0;
  const wait = setInterval(() => {
    tries++;
    if (look() || tries > 240) {
      clearInterval(wait);
      sync();
    }
  }, 250);
  sync();
}

safe(start);

export {};
