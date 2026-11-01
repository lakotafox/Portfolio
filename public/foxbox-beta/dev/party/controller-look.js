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

function unmountAll() {
  document.body.classList.remove("clook-on");
  if (bg) {
    safe(() => bg.handle.unmount());
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
        else syncHeading();
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
