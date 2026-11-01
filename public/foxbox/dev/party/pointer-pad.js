/**
 * pointer-pad.js — USE CURSOR: the phone as a Wii-style pointer for its own TV (the lobby only, for now).
 *
 * lobby2-pad.js puts a USE CURSOR chip in the phone's lobby toolbar. Turned on, this pad covers the phone's lobby: the
 * whole screen is one big TAP area (a "click" on the TV where your cursor is), RECENTER (or hold anywhere) puts the
 * cursor back in the middle, SPEED picks how far a turn of the wrist moves it, and CURSOR: ON turns it off again.
 * Messages (through lobby2-pad.js → window.foxboxLobby.ptr → pad.js's {t:"game", m:{type:"ptr", …}}; the TV side is
 * pointer-tv.js, which has the list): {x, y} 0..10000 at most every SEND_MS while it moves (+ every HEARTBEAT_MS while
 * still), {d:1} / {d:0} finger down / up, {tap:1} with the position where the finger went down (a tap jolts the phone),
 * {rc:1} recentred, {off:1} off or out of the lobby.
 *
 * The gyro (createGyroPointer): relative motion from devicemotion's rotationRate, deg/s about the phone's x / y / z axes
 * (alpha / beta / gamma: today's spec and every browser), as a mouse (GyroWiki / JoyShockMapper "player space"):
 *   yaw   = the rate about gravity within the phone's forward / screen-normal plane, relaxed ×1.41 (holds up to ~45° of
 *           tilt: a phone held flat, tipped up or upright all turn the cursor the same way);
 *   pitch = the rate about the phone's own left-right axis;
 *   below TIGHT deg/s the input is scaled down ("tightening": hand shake stays put, slow aiming still moves);
 *   integrated into a spot on the TV (0..1, clamped at the edges like a mouse) and smoothed with a 1€ filter.
 * Gravity = accelerationIncludingGravity − acceleration (else a low-pass of the first); iOS reports it the other way
 * round (× −1, as golf-pad.js). Forward = the screen's up (portrait: the top edge; sideways: whichever side is up).
 * iPhone: DeviceMotionEvent.requestPermission() runs inside the tap that turns it on (iOS only asks from a click /
 * touchend, over https); after a reload a START tap asks again.
 */
const PIX = `"FoxBox Pixel", "Press Start 2P", ui-monospace, monospace`;
const CREAM = "#fff9f1", NAVY = "#101125", INK = "#0a1428", GOLD = "#ffd23f", SHADOW = "#04050e";

const fin = Number.isFinite;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const G_SIGN = isIOS ? -1 : 1; // iOS reports gravity the other way round from the W3C / Android signs (golf-pad.js)
const RELAX = 1.41; // player-space yaw: how much tilt it forgives (1.41 ≈ 45°)
const TIGHT = 4; // deg/s: below this the gyro is scaled down (hand shake)
const ASPECT = 16 / 9; // the TV: the same degrees move the cursor as far up / down as sideways
/** Degrees of wrist turn per TV screen width. */
export const SPEEDS = [
  { id: "slow", label: "Slow", deg: 45 },
  { id: "mid", label: "Mid", deg: 32 },
  { id: "fast", label: "Fast", deg: 22 },
];
const SPEED_KEY = "foxbox-pointer-speed"; // localStorage (this phone's choice)
const ON_KEY = "foxbox-pointer"; // sessionStorage (this tab: a reload keeps USE CURSOR on, a new visit starts off)
const SEND_MS = 25; // ≤ 40 position messages a second
const HEARTBEAT_MS = 1000; // while the cursor is still (the TV hides a cursor it hasn't heard from in 3.5 s)
const NO_DATA_MS = 2000;
const LONG_MS = 650; // hold this long = recenter
const SLOP = 28; // px a finger may slide and still tap

// 1€ filter (Casiez et al. 2012) on the 0..1 position: mincutoff 1.2 Hz, beta 12 (≈ 0.007 per pixel at 1920), dcutoff 1 Hz
const lpAlpha = (cutoff, dt) => 1 / (1 + 1 / (2 * Math.PI * cutoff * dt));
function oneEuro(minCutoff = 1.2, beta = 12, dCutoff = 1) {
  let x = null, dx = 0;
  return {
    reset() {
      x = null;
      dx = 0;
    },
    filter(v, dt) {
      if (x == null) {
        x = v;
        dx = 0;
        return v;
      }
      dx += lpAlpha(dCutoff, dt) * ((v - x) / dt - dx);
      x += lpAlpha(minCutoff + beta * Math.abs(dx), dt) * (v - x);
      return x;
    },
  };
}
/** How far the screen is turned from the phone's natural (portrait) way up, in degrees counter-clockwise: the frame the
 * motion sensors use. window.orientation first (iOS + Android: 0 / 90 / -90 / 180); screen.orientation.angle is the
 * same on real phones, but headless WebKit's iPhone emulation reports 90 for an upright phone. */
function screenAngle() {
  if (typeof window.orientation === "number") return window.orientation;
  try {
    const o = screen.orientation;
    if (o && typeof o.angle === "number") return o.angle;
  } catch {}
  return 0;
}

/**
 * The gyro as a pointer: onMove(x, y) after each motion event, x and y 0..1 across the TV (0, 0 = top left).
 * start() / stop() listen to devicemotion (the caller has any permission it needs).
 */
export function createGyroPointer({ onMove = null, deg = 32 } = {}) {
  let x = 0.5, y = 0.5, ox = 0.5, oy = 0.5;
  let perDeg = 1 / deg;
  const fx = oneEuro(), fy = oneEuro();
  let up = null; // the up direction, a unit vector in the phone's frame (W3C signs)
  let lastT = 0, listening = false, readings = 0;
  function gravity(e, dt) {
    const gi = e.accelerationIncludingGravity;
    if (!gi || !fin(gi.x) || !fin(gi.y) || !fin(gi.z)) return;
    let gx = gi.x, gy = gi.y, gz = gi.z, pure = false;
    const la = e.acceleration;
    if (la && fin(la.x) && fin(la.y) && fin(la.z)) {
      gx -= la.x;
      gy -= la.y;
      gz -= la.z;
      pure = true;
    }
    const n = Math.hypot(gx, gy, gz);
    if (!(n > 1)) return;
    gx = (G_SIGN * gx) / n;
    gy = (G_SIGN * gy) / n;
    gz = (G_SIGN * gz) / n;
    if (!up || pure) {
      up = { x: gx, y: gy, z: gz };
      return;
    }
    const k = 1 - Math.exp(-dt / 0.15); // a hand's shake rides on the accelerometer alone: smooth it
    const ux = up.x + (gx - up.x) * k, uy = up.y + (gy - up.y) * k, uz = up.z + (gz - up.z) * k;
    const m = Math.hypot(ux, uy, uz) || 1;
    up = { x: ux / m, y: uy / m, z: uz / m };
  }
  function onMotion(e) {
    const rr = e.rotationRate;
    if (!rr) return;
    const a = rr.alpha, b = rr.beta, c = rr.gamma; // about the phone's x (left-right), y (bottom-top), z (out of the screen)
    if (!fin(a) || !fin(b) || !fin(c)) return;
    const t = fin(e.timeStamp) && e.timeStamp > 0 ? e.timeStamp : performance.now();
    let dt = lastT ? (t - lastT) / 1000 : 1 / 60;
    lastT = t;
    if (!(dt > 0.001)) dt = 1 / 60;
    dt = Math.min(dt, 0.05);
    gravity(e, dt);
    readings++;
    // forward F = the screen's up (portrait: +y), Z = the screen's normal, P = F × Z = the left-right axis
    const ang = (screenAngle() * Math.PI) / 180;
    const Fx = Math.sin(ang), Fy = Math.cos(ang);
    const wF = a * Fx + b * Fy, wZ = c, wP = a * Fy - b * Fx;
    let yaw = wZ;
    if (up) {
      const w = wF * (up.x * Fx + up.y * Fy) + wZ * up.z;
      yaw = Math.sign(w) * Math.min(Math.abs(w) * RELAX, Math.hypot(wF, wZ));
    }
    let pitch = wP;
    const mag = Math.hypot(yaw, pitch);
    if (mag < TIGHT) {
      yaw *= mag / TIGHT;
      pitch *= mag / TIGHT;
    }
    // turning left (counter-clockwise from above) moves the cursor left; tipping the top up moves it up
    x = clamp(x - yaw * dt * perDeg, 0, 1);
    y = clamp(y - pitch * dt * perDeg * ASPECT, 0, 1);
    ox = fx.filter(x, dt);
    oy = fy.filter(y, dt);
    if (onMove) onMove(ox, oy);
  }
  return {
    start() {
      if (listening) return;
      listening = true;
      lastT = 0;
      window.addEventListener("devicemotion", onMotion);
    },
    stop() {
      if (!listening) return;
      listening = false;
      window.removeEventListener("devicemotion", onMotion);
    },
    recenter() {
      x = y = ox = oy = 0.5;
      fx.reset();
      fy.reset();
    },
    setDeg(d) {
      perDeg = 1 / clamp(Number(d) || 32, 5, 180);
    },
    get pos() {
      return { x: ox, y: oy };
    },
    get readings() {
      return readings;
    },
    get listening() {
      return listening;
    },
    /** QA: feed one reading by hand (the same path as a real devicemotion event). */
    _feed: (e) => onMotion(e),
  };
}

// the arrow (as on the TV, pointer-tv.js): "X" outline, "#" your colour
const ARROW = [
  "X...........", "XX..........", "X#X.........", "X##X........", "X###X.......", "X####X......", "X#####X.....",
  "X######X....", "X#######X...", "X########X..", "X#########X.", "X######XXXXX", "X###X##X....", "X##X.X##X...",
  "X#X..X##X...", "XX....X##X..", "X.....X##X..", ".......XX...",
];
function arrowSvg() {
  let line = "", fill = "";
  ARROW.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === "X") line += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
      else if (row[x] === "#") fill += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
  });
  return `<svg viewBox="0 0 12 18" shape-rendering="crispEdges" aria-hidden="true"><g fill="${CREAM}">${line}</g><g class="fbx2-ptr-f">${fill}</g></svg>`;
}

function injectCss() {
  if (document.getElementById("fbx2-ptr-css")) return;
  const css = document.createElement("style");
  css.id = "fbx2-ptr-css";
  css.textContent = `
.fbx2-ptr { position: absolute; inset: 0; z-index: 8; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px;
  padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
  background: #070814; color: ${CREAM}; font: 400 10px/1.5 ${PIX}; letter-spacing: 0.04em; text-transform: uppercase;
  touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent;
  --ptr-c: #888888; }
.fbx2-ptr[hidden] { display: none; }
.fbx2-ptr-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
.fbx2-ptr .fbx2-tb[data-act="off"] { background: ${GOLD}; color: ${INK}; }
.fbx2-ptr .fbx2-tb[data-act="off"]:active { background: #e8bd2a; }
.fbx2-ptr-bars { display: inline-flex; align-items: flex-end; gap: 2px; height: 12px; }
.fbx2-ptr-bars i { display: block; width: 4px; background: #3a3c66; }
.fbx2-ptr-bars i:nth-child(1) { height: 5px; } .fbx2-ptr-bars i:nth-child(2) { height: 8px; } .fbx2-ptr-bars i:nth-child(3) { height: 12px; }
.fbx2-ptr-bars i[data-on="1"] { background: ${GOLD}; }
.fbx2-ptr-pad { flex: 1 1 auto; min-height: 0; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 14px; padding: 14px; text-align: center; background: ${NAVY}; border: 3px solid var(--ptr-c); box-shadow: 0 5px 0 ${SHADOW}, inset 0 0 0 3px ${SHADOW};
  transition: background 0.08s; }
.fbx2-ptr-pad.down { background: #1d1f42; }
.fbx2-ptr-pad.tapped { background: #2a2d5c; }
.fbx2-ptr-art svg { display: block; width: 60px; height: 90px; filter: drop-shadow(5px 5px 0 ${SHADOW}); }
.fbx2-ptr-f { fill: var(--ptr-c); }
.fbx2-ptr-pad.down .fbx2-ptr-art svg { transform: scale(0.88); transform-origin: 5px 5px; }
.fbx2-ptr-msg { margin: 0; color: ${GOLD}; font-size: 14px; line-height: 1.5; max-width: 20em; }
.fbx2-ptr-hint { margin: 0; color: #c9c8df; font-size: 9px; line-height: 2; max-width: 30em; }
.fbx2-ptr-hint b { color: ${CREAM}; font-weight: 400; }
.fbx2-ptr-start { min-height: 48px; padding: 0 18px; font-size: 11px; background: #ff9864; color: #20152c; }
.fbx2-ptr-start[hidden] { display: none; }
.fbx2-ptr-bottom { display: flex; justify-content: center; }
.fbx2-ptr .fbx2-ptr-rc { min-height: 52px; padding: 0 22px; font-size: 11px; }
.fbx2-ptr .fbx2-ptr-rc[disabled] { opacity: 0.45; }
@media (orientation: landscape) and (max-height: 520px) {
  .fbx2-ptr { gap: 8px; }
  .fbx2-ptr-pad { gap: 8px; padding: 8px; }
  .fbx2-ptr-art svg { width: 40px; height: 60px; }
  .fbx2-ptr-msg { font-size: 12px; }
  .fbx2-ptr .fbx2-ptr-rc { min-height: 40px; }
}
`;
  document.head.append(css);
}

const readSpeed = () => {
  try {
    const i = SPEEDS.findIndex((s) => s.id === localStorage.getItem(SPEED_KEY));
    return i >= 0 ? i : 1;
  } catch {
    return 1;
  }
};
const readOn = () => {
  try {
    return sessionStorage.getItem(ON_KEY) === "1";
  } catch {
    return false;
  }
};

/**
 * The USE CURSOR pad inside lobby2-pad.js's lobby layer. send(m) = window.foxboxLobby.ptr (pad.js adds type "ptr").
 * icon(name) = lobby2-pad.js's pixel icons. onChange() whenever on / off changes (the toolbar chip repaints).
 * sync({show, color, picker}) from lobby2-pad.js's sync: show = the phone's lobby is up (and this phone can use it).
 */
export function createPointerPad({ layer, send, icon = () => "", onChange = () => {} }) {
  injectCss();
  const hasMotion = typeof window.DeviceMotionEvent !== "undefined";
  const needsPermission = hasMotion && typeof window.DeviceMotionEvent.requestPermission === "function";
  const touchy = (navigator.maxTouchPoints || 0) > 0 || "ontouchstart" in window;
  let granted = !needsPermission; // iPhone: once allowed, it stays allowed for this page
  let on = readOn(), shown = false;
  let motion = "off"; // off | needtap | asking | waiting | on | denied | insecure | unavailable | nodata
  let speed = readSpeed();
  let picker = false;
  let sentAt = 0, sent = { x: -1, y: -1 }, sendTimer = 0, beat = 0, noData = 0, live = false;
  let touch = null, wake = null;

  const gyro = createGyroPointer({
    deg: SPEEDS[speed].deg,
    onMove: () => (motion === "on" ? queueSend() : awake()),
  });
  /** Readings are coming in (after the permission, or iOS still remembers this site's grant): the cursor is live. */
  function awake() {
    if (!(on && shown) || motion === "on") return;
    granted = true;
    clearTimeout(noData);
    gyro.recenter(); // the cursor starts in the middle of the TV
    motion = "on";
    setLive(true);
    post({ rc: 1 });
    render();
  }

  const el = document.createElement("div");
  el.className = "fbx2-ptr";
  el.hidden = true;
  el.dataset.test = "pointer-pad";
  el.innerHTML = `
    <div class="fbx2-ptr-top">
      <button type="button" class="fbx2-tb" data-act="off" data-test="pointer-off" aria-pressed="true" aria-label="Turn the cursor off">${icon("cursor")}<span>Cursor: on</span>${icon("close")}</button>
      <button type="button" class="fbx2-tb" data-act="speed" data-test="pointer-speed" aria-label="Cursor speed"><span class="fbx2-ptr-sp">Speed</span><span class="fbx2-ptr-bars"><i></i><i></i><i></i></span></button>
    </div>
    <div class="fbx2-ptr-pad" data-test="pointer-tap">
      <div class="fbx2-ptr-art">${arrowSvg()}</div>
      <p class="fbx2-ptr-msg" data-test="pointer-msg" role="status" aria-live="polite"></p>
      <p class="fbx2-ptr-hint" data-test="pointer-hint"></p>
      <button type="button" class="fbx2-tb fbx2-ptr-start" data-act="start" data-test="pointer-start" hidden>Start cursor</button>
    </div>
    <div class="fbx2-ptr-bottom">
      <button type="button" class="fbx2-tb fbx2-ptr-rc" data-act="rc" data-test="pointer-recenter">${icon("target")}<span>Recenter</span></button>
    </div>`;
  layer.append(el);
  const pad = el.querySelector(".fbx2-ptr-pad");
  const msgEl = el.querySelector(".fbx2-ptr-msg"), hintEl = el.querySelector(".fbx2-ptr-hint");
  const startBtn = el.querySelector('[data-act="start"]'), rcBtn = el.querySelector('[data-act="rc"]');
  const spLabel = el.querySelector(".fbx2-ptr-sp"), bars = [...el.querySelectorAll(".fbx2-ptr-bars i")];

  const enc = (v) => Math.round(clamp(v, 0, 1) * 10000);
  function post(extra = {}, at = null) {
    const p = at || gyro.pos;
    const m = { x: enc(p.x), y: enc(p.y), ...extra };
    sent = { x: m.x, y: m.y };
    sentAt = performance.now();
    clearTimeout(sendTimer);
    sendTimer = 0;
    try {
      send(m);
    } catch {}
  }
  function queueSend() {
    if (!live) return;
    const p = gyro.pos;
    if (enc(p.x) === sent.x && enc(p.y) === sent.y) return;
    const wait = SEND_MS - (performance.now() - sentAt);
    if (wait <= 0) post();
    else if (!sendTimer) sendTimer = setTimeout(() => live && post(), wait);
  }
  function setLive(v) {
    if (live === v) return;
    live = v;
    clearInterval(beat);
    beat = 0;
    if (v) {
      beat = setInterval(() => {
        if (live && motion === "on" && performance.now() - sentAt >= HEARTBEAT_MS - 50) post();
      }, HEARTBEAT_MS / 2);
    } else {
      clearTimeout(sendTimer);
      sendTimer = 0;
      try {
        send({ off: 1 });
      } catch {}
    }
  }
  function keepAwake(v) {
    if (v && !wake && navigator.wakeLock && document.visibilityState === "visible") {
      navigator.wakeLock.request("screen").then((w) => {
        wake = w;
        w.addEventListener("release", () => { if (wake === w) wake = null; });
        if (!(on && shown)) keepAwake(false);
      }, () => {});
    } else if (!v && wake) {
      const w = wake;
      wake = null;
      w.release().catch(() => {});
    }
  }
  function setMotion(m) {
    motion = m;
    render();
  }
  /** Listen (or not) for what on / shown / the permission say now. */
  function apply() {
    const want = on && shown;
    el.hidden = !want;
    keepAwake(want);
    if (!want) {
      gyro.stop();
      clearTimeout(noData);
      setLive(false);
      if (motion === "on" || motion === "waiting") motion = "off";
      return render();
    }
    if (!window.isSecureContext) return setMotion("insecure");
    if (!hasMotion || !touchy) return setMotion("unavailable");
    if (motion === "on") {
      setLive(true);
      return render();
    }
    if (!gyro.listening) gyro.start(); // also before a permission: iOS may still remember this site's grant
    if (!granted) {
      if (motion !== "asking" && motion !== "denied") motion = "needtap";
      return render();
    }
    motion = "waiting"; // the first reading makes it live (awake)
    clearTimeout(noData);
    noData = setTimeout(() => { if (on && shown && motion === "waiting") setMotion("nodata"); }, NO_DATA_MS);
    render();
  }
  /** From a click / touchend (iPhone: the only place its motion prompt may come from). */
  function askMotion() {
    if (!needsPermission || granted) return apply();
    if (!window.isSecureContext) return setMotion("insecure");
    setMotion("asking");
    let p;
    try {
      p = window.DeviceMotionEvent.requestPermission(); // must run inside the gesture, before anything async
    } catch {
      return setMotion("denied");
    }
    Promise.resolve(p).then(
      (res) => {
        if (res !== "granted") return motion === "on" ? undefined : setMotion("denied");
        granted = true;
        if (motion !== "on") motion = "off";
        apply();
      },
      () => setMotion("denied"),
    );
  }
  function recenter() {
    if (motion !== "on") return;
    gyro.recenter();
    post({ rc: 1 });
    pad.classList.add("tapped");
    setTimeout(() => pad.classList.remove("tapped"), 160);
    try { navigator.vibrate && navigator.vibrate(25); } catch {}
  }
  function render() {
    const show = on && shown;
    el.hidden = !show;
    if (!show) return;
    const say = (m, h) => {
      if (msgEl.textContent !== m) msgEl.textContent = m;
      if (hintEl.innerHTML !== h) hintEl.innerHTML = h;
    };
    let start = "";
    if (motion === "on") {
      if (picker) say("You pick: point at a game card", "Tap a card = <b>select</b><br>Tap the middle card = <b>pick</b><br>Hold anywhere = <b>recenter</b>");
      else say("Point at the TV", "Tap = <b>click</b><br>Hold anywhere = <b>recenter</b>");
    } else if (motion === "waiting") say("Point your phone at the TV", "Waiting for motion…");
    else if (motion === "asking") say("Tap Allow…", "Your phone asks if this page may use motion");
    else if (motion === "needtap" || motion === "off") {
      say("Tap to start the cursor", needsPermission ? "Your phone will ask to use motion: tap Allow" : "Then point your phone at the TV");
      start = "Start cursor";
    } else if (motion === "denied") {
      say("Motion is blocked", "Tap TRY AGAIN. If nothing pops up, close this tab, scan the TV's QR code again and tap Allow");
      start = "Try again";
    } else if (motion === "nodata") {
      say("No motion readings", "Check Settings &gt; Safari &gt; Motion &amp; Orientation Access, then try again");
      start = "Try again";
    } else if (motion === "insecure") say("Motion needs the secure link", "Scan the QR code on the TV again");
    else if (motion === "unavailable") say("This phone has no motion sensor", "Turn the cursor off and use the cards on your phone");
    startBtn.hidden = !start;
    if (start && startBtn.textContent !== start) startBtn.textContent = start;
    rcBtn.disabled = motion !== "on";
    const s = SPEEDS[speed];
    if (spLabel.textContent !== `Speed: ${s.label}`) spLabel.textContent = `Speed: ${s.label}`;
    bars.forEach((b, i) => { b.dataset.on = i <= speed ? "1" : "0"; });
    el.dataset.motion = motion;
  }
  function setOn(v, fromGesture = false) {
    v = !!v;
    if (on !== v) {
      on = v;
      try {
        if (on) sessionStorage.setItem(ON_KEY, "1");
        else sessionStorage.removeItem(ON_KEY);
      } catch {}
      onChange(on);
    }
    if (on && fromGesture && needsPermission && !granted) return askMotion(); // inside the tap on USE CURSOR
    apply();
  }

  // the buttons (clicks) and the big tap area (touches)
  el.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("button[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    if (act === "off") setOn(false);
    else if (act === "rc") recenter();
    else if (act === "start") askMotion();
    else if (act === "speed") {
      speed = (speed + 1) % SPEEDS.length;
      try { localStorage.setItem(SPEED_KEY, SPEEDS[speed].id); } catch {}
      gyro.setDeg(SPEEDS[speed].deg);
      render();
    }
  });
  const find = (list) => (touch ? [...list].find((q) => q.identifier === touch.id) : null);
  el.addEventListener("touchstart", (e) => {
    if (e.target.closest && e.target.closest("button")) return; // the buttons click
    e.preventDefault(); // no zoom, no text selection, no ghost click
    if (touch || motion !== "on") return;
    const t = e.changedTouches[0];
    const p = gyro.pos;
    touch = { id: t.identifier, x0: t.clientX, y0: t.clientY, at: performance.now(), p, long: false, moved: false, timer: 0 };
    touch.timer = setTimeout(() => {
      if (!touch || touch.moved) return;
      touch.long = true;
      recenter();
    }, LONG_MS);
    pad.classList.add("down");
    post({ d: 1 }, p);
  }, { passive: false });
  el.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const t = find(e.changedTouches);
    if (t && Math.hypot(t.clientX - touch.x0, t.clientY - touch.y0) > SLOP) {
      touch.moved = true;
      clearTimeout(touch.timer);
    }
  }, { passive: false });
  const release = (e, cancelled) => {
    const t = find(e.changedTouches);
    if (!t) return;
    const tt = touch;
    touch = null;
    clearTimeout(tt.timer);
    pad.classList.remove("down");
    if (motion !== "on") return;
    const tap = !cancelled && !tt.long && !tt.moved && performance.now() - tt.at < LONG_MS;
    if (tap) {
      post({ d: 0, tap: 1 }, tt.p); // the click lands where the finger went down
      pad.classList.add("tapped");
      setTimeout(() => pad.classList.remove("tapped"), 120);
    } else post({ d: 0 });
  };
  el.addEventListener("touchend", (e) => release(e, false));
  el.addEventListener("touchcancel", (e) => release(e, true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && on && shown) keepAwake(true);
  });

  render();
  const api = {
    /** USE CURSOR can work on this phone (a motion API and a touch screen). */
    supported: hasMotion && touchy,
    get on() {
      return on;
    },
    /** The pad covers the phone's lobby now (lobby2-pad.js keeps the cards under it from following the picker). */
    get active() {
      return on && shown;
    },
    get motion() {
      return motion;
    },
    /** The toolbar chip (a click: iPhone may ask for motion here). */
    toggle() {
      setOn(!on, true);
    },
    setOn,
    sync({ show = false, color = null, picker: isPicker = false } = {}) {
      if (color) el.style.setProperty("--ptr-c", color);
      const changed = picker !== !!isPicker;
      picker = !!isPicker;
      if (shown !== !!show) {
        shown = !!show;
        apply();
      } else if (changed) render();
    },
    /** QA: the gyro (feed readings by hand), the pad's element and a long press. */
    _gyro: gyro,
    _el: el,
    _hold: () => {
      if (motion === "on") recenter();
    },
  };
  globalThis.__pointerPad = api;
  return api;
}
