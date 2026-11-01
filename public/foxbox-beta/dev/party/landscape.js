/**
 * landscape.js — the phone's sideways screens.
 *
 *  - In-game controllers stay sideways (full screen, landscape) while a round is on.
 *  - On the website (globalThis.FOXBOX_LANDSCAPE), every Sky Scramble screen once Sky is picked: the character picker,
 *    the selfie cropper, the drawing, READY / CHANGE CHARACTER, the controller and the results' countdown (pad.js
 *    syncExtras decides which; the FoxBox lobby before a pick stays as it is, upright or sideways).
 *
 * Android: the first tap asks for full screen and locks the screen to landscape.
 * iPhone (no orientation lock for web pages; often Rotation Lock is on, so the window stays portrait): the screen is
 * turned 90° with CSS so it always shows in landscape, and a pixel "TURN YOUR PHONE SIDEWAYS" hint says so
 * (createTurnHint; the same look as NONAME's setup). Which way it turns comes from how the phone is held (gravity, when
 * the sensor is available without asking), else the common grip (top of the phone to the left → turn clockwise). Every
 * turned screen shares that grip. The captain/first-mate controller (cap-pad.js) does its own turning and is left alone.
 *
 *   const land = createLandscape(el, { onLayout });   // onLayout(): after every (un)turn, e.g. the drawing's own layout
 *   land.set(true | false);       // sideways now / not
 *   land.angle                    // degrees this module turned the screen (clockwise), 0 if not
 *   land.local(ev, el)            // a pointer event → {dx, dy, halfW, halfH} in el's own (unturned) frame
 *   const hint = createTurnHint(); hint.show(ms) / hint.hide() / hint.visible   (also globalThis.FOXBOX_TURN_HINT)
 *
 * A turned screen gets .land-rot, .land-90 / .land-270 (which way: its safe-area padding follows the window's notch and
 * home bar), .land-short (its height ≤ 340 px, like pad.html's (max-height: 340px) rules), and --lw / --lh = its width /
 * height (use these, not vw / vh, which measure the portrait window).
 */
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

// When the window is portrait but a screen is turned sideways, pad.html's (orientation: portrait) rules still match, so
// mirror its (orientation: landscape) rules here for the turned screens (and undo the portrait-only ones). The captain
// controller is never turned by this module, so its rules aren't needed.
const CSS = `
#pad-screen.land-rot { gap: 8px; }
#pad-screen.land-rot #top { min-height: 36px; }
#pad-screen.land-rot #me-ball { width: 30px; height: 30px; }
#pad-screen.land-rot #me-name { font-size: 22px; }
#pad-screen.land-rot #status {
  flex: none; display: flex; flex-direction: row; align-items: baseline; justify-content: center;
  gap: 14px; padding: 6px 12px; border-radius: 16px;
}
#pad-screen.land-rot #status-big { font-size: clamp(22px, calc(var(--lw, 100vw) * 0.07), 34px); }
#pad-screen.land-rot #status-small { margin-top: 0; font-size: 17px; }
#pad-screen.land-rot #status #change-char { margin-top: 0; font-size: 15px; padding: 5px 10px; }
#pad-screen.land-rot #controls { flex: 1; height: auto; }
#pad-screen.land-rot #steer { flex: 1.15; }
#pad-screen.land-rot #steer .half { font-size: 44px; }
#pad-screen.land-rot.land-anim { transition: none; }
/* the results (Sky's round end, turned): keep pad.html's arcade column, not the controller's status row above */
#pad-screen.land-rot.results #status { flex: 1; flex-direction: column; align-items: center; justify-content: center; padding: 18px 14px; border-radius: 0; }
#pad-screen.land-rot.results #status-big { font-size: clamp(18px, calc(var(--lw, 100vw) * 0.06), 26px); }
#pad-screen.land-rot.results #status-small { margin-top: 10px; font-size: 10px; }

/* a turned screen's safe areas: its edges sit on the window's notch side / home bar (rotate 90 = clockwise) */
:is(#char-screen, #crop-screen, #draw-screen, #ready-screen, #pad-screen).land-rot.land-90 {
  padding: max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left)) max(12px, env(safe-area-inset-top));
}
:is(#char-screen, #crop-screen, #draw-screen, #ready-screen, #pad-screen).land-rot.land-270 {
  padding: max(12px, env(safe-area-inset-left)) max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom));
}
.land-rot .px-title { font-size: clamp(14px, calc(var(--lw, 100vw) * 0.043), 18px); }

/* Sky Scramble's picker, READY and selfie cropper, turned (pad.html's (orientation: landscape) and (max-height: 500px)) */
#char-screen.land-rot.show {
  display: grid; grid-template-columns: minmax(190px, 34%) minmax(0, 1fr); grid-template-rows: auto auto minmax(0, 1fr) auto;
  grid-template-areas: "head grid" "sub grid" "note grid" "make grid"; column-gap: 16px; row-gap: 8px;
}
#char-screen.land-rot #char-head { grid-area: head; grid-template-columns: auto minmax(0, 1fr); min-height: 44px; padding: 4px 4px 0; }
#char-screen.land-rot #char-title { grid-column: auto; font-size: clamp(11px, calc(var(--lw, 100vw) * 0.017), 14px); }
#char-screen.land-rot #char-back + #char-title { text-align: left; }
#char-screen.land-rot .sub { grid-area: sub; font-size: 15px; }
#char-screen.land-rot #char-note { grid-area: note; align-self: start; font-size: 14px; }
#char-screen.land-rot #char-grid { grid-area: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); padding: 12px 10px 16px; }
#char-screen.land-rot #char-make { grid-area: make; flex-direction: column; gap: 16px; padding: 4px 6px 10px; }
#char-screen.land-rot #char-make .pxbtn { flex: none; min-height: 46px; font-size: 12px; }

#ready-screen.land-rot.show {
  display: grid; grid-template-columns: minmax(0, 44%) minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr);
  grid-template-areas: "stage head" "stage side"; column-gap: 22px; row-gap: 6px;
}
#ready-screen.land-rot #rdy-head { grid-area: head; padding: 4px 4px 0; }
#ready-screen.land-rot #rdy-stage { grid-area: stage; min-height: 0; margin: 4px 4px 10px; }
#ready-screen.land-rot #rdy-side { grid-area: side; justify-content: center; gap: 8px; }
#ready-screen.land-rot #rdy-name { font-size: 24px; }
#ready-screen.land-rot #rdy-as { margin-top: -4px; }
#ready-screen.land-rot #rdy-go { min-height: 56px; font-size: 18px; }
#ready-screen.land-rot #rdy-change { min-height: 42px; margin-top: 4px; font-size: 10px; }
#ready-screen.land-rot #rdy-wait { margin-top: 2px; font-size: 9px; }
#ready-screen.land-rot.land-short #rdy-go { min-height: 48px; }
#ready-screen.land-rot.land-short #rdy-change { min-height: 38px; }

#crop-screen.land-rot { flex-flow: row wrap; justify-content: center; align-content: center; gap: 8px 16px; }
#crop-screen.land-rot h2, #crop-screen.land-rot .sub { display: none; }
#crop-screen.land-rot #crop-stage { width: auto; height: calc(var(--lh, 100vh) - 48px); }
#crop-screen.land-rot #crop-zoom, #crop-screen.land-rot .row { width: 100%; }
#crop-screen.land-rot #crop-side { display: flex; flex-direction: column; gap: 12px; width: 40%; }

/* the drawing picks its sideways layout itself (draw.js: .wide when its box is wider than tall); its short rules */
#draw-screen.land-rot.land-short.wide #draw-top { min-height: 36px; padding-top: 4px; }
#draw-screen.land-rot.land-short.wide .pxbtn-sm { min-height: 32px; }
#draw-screen.land-rot.land-short.wide #draw-panel { gap: 9px; }
#draw-screen.land-rot.land-short.wide .tbtn { height: 36px; gap: 3px; }
#draw-screen.land-rot.land-short.wide .tbtn .ico svg { height: 14px; width: auto; }
#draw-screen.land-rot.land-short.wide #draw-colors { grid-auto-rows: 18px; gap: 9px 9px; }
#draw-screen.land-rot.land-short.wide #draw-preview, #draw-screen.land-rot.land-short.wide #draw-paper-seg .tbtn,
#draw-screen.land-rot.land-short.wide #draw-done { height: 38px; min-height: 38px; }
#draw-screen.land-rot.land-short.wide #draw-note:empty { display: none; }

/* TURN YOUR PHONE SIDEWAYS (the same look as NONAME's setup hint, knight-pad.js .kp-turn) */
.fbx-turn { position: fixed; left: 50%; top: max(18px, env(safe-area-inset-top)); transform: translateX(-50%); z-index: 70;
  display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: #ffd23f; color: #0a1428;
  font: 400 11px/1.5 "FoxBox Pixel", "Press Start 2P", ui-monospace, monospace; letter-spacing: 0; white-space: nowrap;
  pointer-events: none; box-shadow: 0 0 0 3px #0a1428, 0 6px 0 0 #0a142899; }
.fbx-turn[hidden] { display: none; }
.fbx-turn i { display: block; width: 14px; height: 24px; border: 3px solid #0a1428; border-radius: 3px; animation: fbx-turn 1.6s ease-in-out infinite; }
@keyframes fbx-turn { 0%, 25% { transform: rotate(0); } 55%, 100% { transform: rotate(90deg); } }
@media (prefers-reduced-motion: reduce) { .fbx-turn i { animation: none; } }
`;
function injectCss() {
  if (document.getElementById("foxbox-landscape-css")) return;
  const st = document.createElement("style");
  st.id = "foxbox-landscape-css";
  st.textContent = CSS;
  document.head.append(st);
}

// ── the grip (shared by every turned screen) ─────────────────────────────────────────────────────────────
// 90 = device's right edge up (top of the phone to the left), 270 = the other way; a change must hold for HOLD_MS
const HOLD_MS = 600;
const grip = { hold: null, cand: null, since: 0, listening: false, users: new Set() };
function onMotion(e) {
  const g = e.accelerationIncludingGravity;
  if (!g || g.x == null) return;
  // device coordinates: x points right along the short edge; when held sideways gravity pulls along x
  const ux = (isIOS ? -1 : 1) * g.x, uy = (isIOS ? -1 : 1) * g.y;
  if (Math.abs(ux) < 6 || Math.abs(ux) < Math.abs(uy)) return; // not clearly sideways
  const h = ux > 0 ? 90 : 270;
  if (h === grip.hold) {
    grip.cand = null;
    return;
  }
  const now = performance.now();
  if (grip.hold == null) {
    grip.hold = h; // first reading: use it straight away
    for (const u of grip.users) u.layout();
    return;
  }
  if (grip.cand !== h) {
    grip.cand = h;
    grip.since = now;
    return;
  }
  if (now - grip.since >= HOLD_MS) {
    grip.hold = h;
    grip.cand = null;
    for (const u of grip.users) u.layout();
  }
}
function gripUse(user, on) {
  if (on) grip.users.add(user);
  else grip.users.delete(user);
  const want = grip.users.size > 0;
  if (want === grip.listening) return;
  grip.listening = want;
  if (want) window.addEventListener("devicemotion", onMotion);
  else window.removeEventListener("devicemotion", onMotion);
}
const screenAngle = () => (screen.orientation && typeof screen.orientation.angle === "number" ? screen.orientation.angle : typeof window.orientation === "number" ? (window.orientation + 360) % 360 : 0);

export function createLandscape(screenEl, { onLayout = null } = {}) {
  injectCss();
  let want = false;
  let rotDeg = 0;
  const after = () => {
    if (onLayout) try { onLayout(); } catch (e) { console.warn("[landscape] onLayout", e); }
  };

  function clear() {
    rotDeg = 0;
    if (!screenEl.classList.contains("land-rot")) return;
    screenEl.classList.remove("land-rot", "land-90", "land-270", "land-short");
    for (const k of ["position", "left", "top", "right", "bottom", "width", "height", "transform"]) screenEl.style[k] = "";
    screenEl.style.removeProperty("--lw");
    screenEl.style.removeProperty("--lh");
  }
  function layout() {
    const was = rotDeg;
    if (!want || screenEl.classList.contains("cap-rot") || screenEl.classList.contains("captain")) clear();
    else if (window.innerHeight <= window.innerWidth) clear(); // the window is already landscape: nothing to turn
    else {
      const h = grip.hold ?? 90;
      rotDeg = (((h - screenAngle()) % 360) + 360) % 360 || 90;
      const w = window.innerHeight, ht = window.innerWidth; // the turned box
      screenEl.classList.add("land-rot");
      screenEl.classList.toggle("land-90", rotDeg === 90);
      screenEl.classList.toggle("land-270", rotDeg === 270);
      screenEl.classList.toggle("land-short", ht <= 340);
      Object.assign(screenEl.style, {
        position: "fixed", left: "50%", top: "50%", right: "auto", bottom: "auto",
        width: w + "px", height: ht + "px",
        transform: `translate(-50%, -50%) rotate(${rotDeg}deg)`,
      });
      screenEl.style.setProperty("--lw", `${w}px`);
      screenEl.style.setProperty("--lh", `${ht}px`);
    }
    if (rotDeg !== was || rotDeg) after();
  }

  function lock() {
    const o = screen.orientation;
    const doLock = () => {
      if (!o || !o.lock) return;
      try {
        o.lock("landscape").catch(() => {});
      } catch {}
    };
    if (isIOS || document.fullscreenElement || !document.documentElement.requestFullscreen) return doLock();
    try {
      document.documentElement.requestFullscreen({ navigationUI: "hide" }).then(doLock, doLock);
    } catch {
      doLock();
    }
  }
  function unlock() {
    try {
      screen.orientation && screen.orientation.unlock && screen.orientation.unlock();
    } catch {}
  }
  // the lock needs a user gesture: the first tap while we want landscape
  screenEl.addEventListener("pointerdown", () => {
    if (want && !screenEl.classList.contains("captain")) lock();
  }, true);
  window.addEventListener("resize", () => want && layout());
  window.addEventListener("orientationchange", () => want && setTimeout(layout, 50));

  const api = {
    set(on) {
      on = !!on;
      if (on === want) {
        if (on) layout();
        return;
      }
      want = on;
      gripUse(api, on);
      if (on) layout();
      else {
        const was = rotDeg;
        clear();
        if (was) after();
        if (![...grip.users].length) unlock();
      }
    },
    layout,
    /** turned by this module (degrees, clockwise), 0 if not */
    get angle() {
      return rotDeg;
    },
    /** A pointer event in el's own frame (el lives inside the turned screen). */
    local(ev, el) {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const vx = ev.clientX - cx, vy = ev.clientY - cy;
      const capDeg = screenEl.classList.contains("cap-rot") ? parseRot(screenEl.style.transform) : 0;
      const deg = rotDeg || capDeg;
      const a = (-deg * Math.PI) / 180;
      const dx = vx * Math.cos(a) - vy * Math.sin(a);
      const dy = vx * Math.sin(a) + vy * Math.cos(a);
      return { dx, dy, halfW: el.offsetWidth / 2, halfH: el.offsetHeight / 2 };
    },
  };
  return api;
}

/** A movement (dx, dy) in client pixels → the same movement in a turned screen's own frame (el inside it). */
export function turnedDelta(el, dx, dy) {
  const t = el && el.closest && el.closest(".land-rot");
  const deg = t ? parseRot(t.style.transform) : 0;
  if (!deg) return { dx, dy };
  const a = (-deg * Math.PI) / 180;
  return { dx: dx * Math.cos(a) - dy * Math.sin(a), dy: dx * Math.sin(a) + dy * Math.cos(a) };
}

/**
 * The pixel "TURN YOUR PHONE SIDEWAYS" hint (one per page, in the window's own upright frame, over everything): show(ms)
 * for a while (or until the next tap anywhere), hide(). Shared: globalThis.FOXBOX_TURN_HINT (Sky's screens here;
 * NONAME's knight pad can call it too).
 */
let hintApi = null;
export function createTurnHint() {
  if (hintApi) return hintApi;
  injectCss();
  const el = document.createElement("div");
  el.className = "fbx-turn";
  el.dataset.test = "turn-hint";
  el.hidden = true;
  el.setAttribute("role", "status");
  el.innerHTML = "<i></i><span>TURN YOUR PHONE SIDEWAYS</span>";
  const mount = () => document.body ? document.body.append(el) : addEventListener("DOMContentLoaded", () => document.body.append(el), { once: true });
  mount();
  let timer = 0;
  const hide = () => {
    clearTimeout(timer);
    timer = 0;
    el.hidden = true;
  };
  addEventListener("pointerdown", () => { if (!el.hidden) hide(); }, true);
  hintApi = {
    show(ms = 4500) {
      clearTimeout(timer);
      el.hidden = false;
      timer = setTimeout(hide, ms);
    },
    hide,
    get visible() {
      return !el.hidden;
    },
  };
  globalThis.FOXBOX_TURN_HINT = hintApi;
  return hintApi;
}

function parseRot(t) {
  const m = /rotate\((-?\d+(?:\.\d+)?)deg\)/.exec(t || "");
  return m ? Number(m[1]) : 0;
}
