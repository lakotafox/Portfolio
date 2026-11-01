/**
 * Row's CAPTAIN controller: motion-only paddling, local practice and host-confirmed readiness.
 *
 * The panel is the player's own boat, as the TV draws it (createBoatArt below): the tandem kayak in the boat's colour
 * with its crew on pixel water; every stroke this phone detects swings the paddle (left / right alternating like the TV),
 * splashes and surges the boat. A small chip keeps the stroke count; the TRAINING overlay (row-train-pad.js) sits on the
 * left. RELOADING / STUNNED are drawn from the game's {t:"game", m:{type:"rowBoat", v:1, reload, stun}} (seconds left,
 * sent on change to the boat's paddler: row-race game.js boatPhones, branch row-boat-msg; pad.js → boatState()).
 *
 *   createRowPad(el, { onInput, state, onReady }) -> { show(on), setSetup(next), release(), setColor(hex), boatState(m) }
 * QA: window.__rowBoat = { stroke(), state(m), info() }.
 */
const STROKE_MS = 120;
const REFRACTORY_MS = 280;
const SENS = { low: 0.75, med: 0.5, high: 0.32 };
const PEAK_DROP = 0.7;
const SENS_KEY = "foxbox-row-sens";
const finite = (v) => typeof v === "number" && Number.isFinite(v);
const number = (v) => finite(v) ? v : 0;

export function createRowPad(el, { onInput, state, onReady = () => {} }) {
  let shown = false, listening = false, gotMotion = false, permissionGranted = false;
  let setup = null, pending = false, count = 0, sens = "med", down = 0;
  let sig = 0, peak = 0, lastStroke = -1e9, lastMotionAt = -Infinity, timer = null, sensorTimer = null;
  const art = createBoatArt(el.boat);
  const hasMotionApi = typeof window.DeviceMotionEvent !== "undefined";
  const needsPermission = hasMotionApi && typeof DeviceMotionEvent.requestPermission === "function";
  try { if (SENS[localStorage.getItem(SENS_KEY)]) sens = localStorage.getItem(SENS_KEY); } catch {}
  const preparing = () => !!(shown && setup?.active);
  const report = (ready = false) => {
    if (shown && setup && (preparing() || (!ready && state() === "countdown")))
      onReady({ motionReady: gotMotion, ready: !!ready && gotMotion && count > 0 });
  };
  function render() {
    el.ready.hidden = !preparing();
    el.ready.disabled = !gotMotion || !count || !!setup?.ready || pending;
    el.ready.textContent = setup?.ready ? "Ready ✓" : pending ? "Waiting for TV…" : "Ready!";
    el.sens.hidden = !gotMotion || state() === "playing";
    el.count.textContent = String(count);
    el.sens.querySelectorAll("[data-s]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.s === sens)));
    el.hint.textContent = !gotMotion ? (el.enable.hidden ? "Waiting for motion…" : "Enable motion to use your phone as a paddle")
      : state() === "playing" ? "" // (the status line above says "Paddle! A steady beat is fastest")
      : setup?.ready ? `Ready — ${setup.readyCount || 0}/${setup.totalCount || 0} players ready`
      : count ? "Nice! Tap Ready! when it feels right" : "Paddle to test! Swing your phone like a paddle";
  }
  function pulse() {
    art.stroke();
    el.countWrap.classList.remove("hit");
    void el.countWrap.offsetWidth;
    el.countWrap.classList.add("hit");
    try { navigator.vibrate?.(30); } catch {}
  }
  function stroke() {
    count++;
    pulse();
    render();
    if (!shown || state() !== "playing") return;
    clearTimeout(timer);
    down = 1;
    onInput({ x: 0, b: 1, c: 1 });
    timer = setTimeout(() => { down = 0; onInput({ x: 0, b: 0, c: 0 }); }, STROKE_MS);
  }
  function onMotion(e) {
    if (!shown || document.hidden || !window.isSecureContext || !hasMotionApi || (needsPermission && !permissionGranted)) return;
    const gi = e.accelerationIncludingGravity || {}, rr = e.rotationRate || {}, ac = e.acceleration || {};
    if (![gi.x, gi.y, gi.z, rr.alpha, rr.beta, rr.gamma, ac.x, ac.y, ac.z].some(finite)) return;
    lastMotionAt = performance.now();
    if (!gotMotion) {
      gotMotion = permissionGranted = true;
      clearTimeout(sensorTimer);
      el.enable.hidden = true;
      el.note.textContent = "";
      report(false);
      render();
    }
    const rot = Math.hypot(number(rr.alpha), number(rr.beta), number(rr.gamma));
    const lin = [ac.x, ac.y, ac.z].some(finite)
      ? Math.hypot(number(ac.x), number(ac.y), number(ac.z))
      : [gi.x, gi.y, gi.z].some(finite) ? Math.abs(Math.hypot(number(gi.x), number(gi.y), number(gi.z)) - 9.81) : 0;
    sig = sig * 0.5 + Math.max(rot / 360, lin / 14) * 0.5;
    const hi = SENS[sens], now = performance.now();
    el.meter.style.transform = `scaleX(${Math.min(1, sig / (hi * 2))})`;
    if (sig > hi && sig > peak) peak = sig;
    if (peak > 0 && sig < peak * PEAK_DROP) {
      if (now - lastStroke > REFRACTORY_MS) { lastStroke = now; stroke(); }
      peak = 0;
    }
  }
  function unavailable(note) {
    release();
    gotMotion = false;
    count = 0;
    sig = peak = 0;
    pending = false;
    el.note.textContent = note;
    report(false);
    render();
  }
  function startMotion() {
    if (!window.isSecureContext) {
      el.enable.hidden = true;
      return unavailable("Motion needs the secure (https) link: scan the QR code on the TV again.");
    }
    if (!hasMotionApi) {
      el.enable.hidden = true;
      return unavailable("This device has no motion sensor. Join on a phone with motion support.");
    }
    el.enable.hidden = !needsPermission || permissionGranted;
    if (!listening) {
      listening = true;
      window.addEventListener("devicemotion", onMotion);
    }
    clearTimeout(sensorTimer);
    sensorTimer = setTimeout(() => {
      if (shown && !gotMotion && (!needsPermission || permissionGranted)) unavailable("No motion readings yet. Check motion access, then try again.");
    }, 3000);
    render();
  }
  async function enableMotion() {
    if (!shown || !window.isSecureContext || !hasMotionApi) return;
    try {
      if (needsPermission && await DeviceMotionEvent.requestPermission() !== "granted") {
        return unavailable("Motion access was denied. Allow Motion & Orientation for this site, then retry.");
      }
      permissionGranted = true;
      startMotion();
    } catch { unavailable("Motion access could not be enabled. Check this site's motion permission and retry."); }
  }
  const canInvalidate = () => shown && setup && (state() === "lobby" || state() === "countdown");
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) return;
    release();
    if (canInvalidate()) unavailable("Motion paused while this page was hidden. Return, test your paddle, and tap Ready again.");
  });
  setInterval(() => {
    if (canInvalidate() && gotMotion && performance.now() - lastMotionAt > 2500)
      unavailable("Motion readings stopped. Move your phone to reconnect, then tap Ready again.");
  }, 500);
  el.enable.addEventListener("click", enableMotion);
  el.ready.addEventListener("click", () => {
    if (!preparing() || !gotMotion || count < 1 || setup.ready || pending) return;
    pending = true;
    report(true);
    render();
  });
  el.sens.querySelectorAll("[data-s]").forEach((b) => b.addEventListener("click", () => {
    sens = b.dataset.s;
    try { localStorage.setItem(SENS_KEY, sens); } catch {}
    render();
  }));
  function release() {
    clearTimeout(timer);
    if (down) { down = 0; onInput({ x: 0, b: 0, c: 0 }); }
  }
  return {
    show(on) {
      if (on === shown) return;
      shown = on;
      el.root.hidden = !on;
      art.show(on);
      if (on) startMotion();
      else { release(); clearTimeout(sensorTimer); }
    },
    setSetup(next) {
      const changed = next?.key !== setup?.key;
      if (changed) {
        release();
        gotMotion = false;
        count = 0;
        sig = peak = 0;
        lastStroke = -1e9;
        lastMotionAt = -Infinity;
        el.meter.style.transform = "scaleX(0)";
      }
      setup = next;
      pending = false;
      if (shown && changed && !gotMotion) startMotion();
      render();
    },
    release,
    setColor: (hex) => art.setColor(hex),
    boatState: (m) => art.setState(m),
  };
}

// ── The boat art: the TV's tandem kayak on pixel water ─────────────────────────────────────────────────────────────
// Ported from Row Row Rumble's src/render.js (row-race-training f2b3092: drawTandem, hull, drawFace, drawSling,
// paddlePose / bladeEnds, drawDizzy, drawReloadBar, drawWakes, strokeFx + the ripple / droplet / foam particles), so the
// phone's boat is the TV's: the same shapes in the TV's virtual px, drawn at 1/K into a small buffer with hard alpha
// edges, then blown up by a whole number of device pixels with no smoothing. Keep the two in step when the TV's kayak
// changes. The water is the TV river's middle: its colours in dithered bands, glint flecks drifting downstream.
// Cheap on purpose (the motion sensing shares the thread): one small canvas (~150×80 px), requestAnimationFrame only
// while the panel is on screen and the page visible, and a frame is only drawn when something in it moved.
const K = 4; // TV virtual px per pixel (render.js STYLE.pixel)
const TAU = Math.PI * 2;
const HULL_HL = 112, HULL_HB = 27, PADDLE_HL = 84;
const SEAT = { paddle: 36, captain: -36 };
const PIVOT_Y = SEAT.paddle;
const STROKE_T = 0.5;
const RELOAD_T = 4;
const BOX_W = 56, BOX_H = 64; // the boat + paddle + dizzy stars, in pixels (what has to fit the panel)
const PAL = {
  outline: "#0b1f33", shaft: "#8a6a3a", blade: "#f6e7b8", bladeWet: "#2f8fbf", sling: "#8a6a3a", band: "#e3384f",
  star: "#f2b51d", foam: "#ffffff", eye: "#0b1f33", blush: "#ff8c9a", lamp: "#f2b51d", drop: "#ffffff", dropFar: "#bfeaf2",
  ripple: "#bfeaf2", glint: "#bfeaf2", balloon: "#ff4fa3", water: ["#62c3e0", "#2f8fbf", "#1f5f8b"],
};
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
function hash(x, y) { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function hexRgb(h) { const n = parseInt(String(h).replace("#", "").padEnd(6, "0").slice(0, 6), 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mixHex(a, b, t) { const A = hexRgb(a), B = hexRgb(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(",")})`; }

// render.js paddlePose: the paddle angle ψ for the latest stroke (side 0 = left, 1 = right)
function paddlePose(stroke, time) {
  const u = time - stroke.t;
  if (stroke.side < 0 || u < 0 || u > STROKE_T) return { psi: 0, wet: [0, 0], lift: 0, lean: 0 };
  const sgn = stroke.side === 0 ? 1 : -1;
  let psi, wet = 0, lift = 0;
  if (u < 0.07) psi = lerp(0, 0.8, ease(u / 0.07));
  else if (u < 0.3) { psi = lerp(0.8, -0.45, ease((u - 0.07) / 0.23)); wet = 1; }
  else if (u < 0.38) { psi = -0.45; lift = (u - 0.3) / 0.08; }
  else { psi = lerp(-0.45, 0, ease((u - 0.38) / (STROKE_T - 0.38))); lift = 1 - (u - 0.38) / (STROKE_T - 0.38); }
  return { psi: psi * sgn, wet: stroke.side === 0 ? [wet, 0] : [0, wet], lift, lean: sgn * (wet ? 1 : lift * 0.5) };
}
function bladeEnds(psi) {
  const c = Math.cos(psi), s = Math.sin(psi);
  return [{ x: -PADDLE_HL * c, y: PIVOT_Y - PADDLE_HL * s }, { x: PADDLE_HL * c, y: PIVOT_Y + PADDLE_HL * s }];
}

function createBoatArt(stage) {
  const canvas = document.createElement("canvas");
  canvas.className = "row-art";
  canvas.setAttribute("aria-hidden", "true");
  const tag = document.createElement("div"); // RELOADING / STUNNED!, over the boat like the TV's nametag line
  tag.className = "row-tag";
  tag.dataset.test = "row-boat-tag";
  tag.hidden = true;
  tag.innerHTML = '<span></span><i><b></b></i>';
  stage.prepend(canvas);
  stage.append(tag);
  const g = canvas.getContext("2d");
  const spr = document.createElement("canvas"); // the sprite layer (hard alpha edges, like the TV's)
  const sg = spr.getContext("2d", { willReadFrequently: true });
  const bg = document.createElement("canvas"); // the water's dithered bands, drawn once per size
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  let W = 0, H = 0, N = 1, shown = false, raf = 0, last = 0, lastKey = "", frames = 0;
  let color = "#2f6fe8", side = Math.random() < 0.5 ? 0 : 1, stroke = { side: -1, t: -9 }, fireT = -9;
  let flow = 0, boost = 0, surge = 0, reload = null, stun = null; // reload / stun: { left (s), at (ms) }
  const fx = [];
  const now = () => performance.now() / 1000;

  let sized = false; // the panel's size is re-read only after a resize (ResizeObserver), not every frame
  const hasRO = typeof ResizeObserver === "function";
  function fit() {
    if (sized && hasRO) return stage.offsetWidth > 0; // (hidden by CSS, e.g. the results: stop until it's back)
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return false;
    sized = true;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const n = Math.max(2, Math.floor(Math.min((h * dpr * 0.84) / BOX_H, (w * dpr * 0.92) / BOX_W)));
    const nw = Math.ceil((w * dpr) / n), nh = Math.ceil((h * dpr) / n);
    if (nw === W && nh === H && n === N) return true;
    W = nw; H = nh; N = n;
    canvas.width = spr.width = bg.width = W;
    canvas.height = spr.height = bg.height = H;
    const cw = (W * n) / dpr, ch = (H * n) / dpr;
    canvas.style.width = cw + "px";
    canvas.style.height = ch + "px";
    canvas.style.left = Math.floor((w - cw) / 2) + "px";
    canvas.style.top = Math.floor((h - ch) / 2) + "px";
    paintWater();
    lastKey = "";
    return true;
  }
  // the TV river's middle: banks' light blue → mid blue → deep blue in the centre, broken up by the same 4×4 ordered
  // dither the TV's palette snap uses (no smooth gradient: every pixel is one of the three water colours)
  function paintWater() {
    const b = bg.getContext("2d"), img = b.createImageData(W, H), d = img.data;
    const C = PAL.water.map(hexRgb), half = W / 2;
    for (let x = 0; x < W; x++) {
      const t = Math.abs(x + 0.5 - half) / half; // 0 mid → 1 edge
      const depth = clamp(1.25 - t * 1.25, 0, 1) * 2; // 0..2: light → mid → deep
      for (let y = 0; y < H; y++) {
        const th = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
        const lo = Math.floor(depth), f = depth - lo, ci = clamp(lo + (f > th ? 1 : 0), 0, 2);
        const c = C[ci], i = (y * W + x) * 4;
        d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
      }
    }
    b.putImageData(img, 0, 0);
  }

  const boatX = () => Math.round(W / 2), boatY = () => Math.round(H * 0.5 - surge);
  const left = (s) => (s ? s.left - (performance.now() - s.at) / 1000 : 0);

  function frame() {
    raf = 0;
    if (!shown || document.hidden || !fit()) return;
    const t = now(), dt = last ? Math.min(0.1, t - last) : 1 / 60;
    last = t;
    // the boat's speed through the water: each stroke adds a surge that fades (the water slides past faster)
    boost *= Math.exp(-dt * 1.9);
    const still = reduce?.matches;
    const speed = (still ? 0 : 2.5) + boost; // pixels per second (a slow drift when idle, like the river's current)
    flow += speed * dt;
    surge = lerp(surge, Math.min(5, boost * 0.16), Math.min(1, dt * 9));
    ageFx(dt, speed);
    const stunLeft = left(stun), reloadLeft = left(reload);
    const busy = t - stroke.t < STROKE_T + 0.1 || fx.length > 0 || stunLeft > 0 || Math.abs(surge - Math.min(5, boost * 0.16)) > 0.05;
    // only draw when something moved: the water by a whole pixel, the flag (6 flaps/s), a blink, the reload bar
    const key = `${Math.floor(flow)}|${Math.round(surge)}|${Math.floor(t * 6) % 2}|${(t * 0.7) % 4 < 0.1}|${reloadLeft > 0 ? Math.ceil(reloadLeft * 4.5) : 0}`;
    if (busy || key !== lastKey) {
      lastKey = key;
      draw(t, stunLeft, reloadLeft);
      frames++;
    }
    syncTag(stunLeft, reloadLeft);
    raf = requestAnimationFrame(frame);
  }
  function wake() { if (!raf && shown && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }

  function draw(t, stunLeft, reloadLeft) {
    g.imageSmoothingEnabled = false;
    g.drawImage(bg, 0, 0);
    // glint flecks drifting downstream (the TV's: a pixel, sometimes a second one two pixels on)
    const off = Math.floor(flow), rows = Math.ceil(H / 12) + 2;
    for (let r = -1; r < rows; r++) {
      const gy = r - Math.floor(off / 12);
      for (let k = 0; k < Math.max(3, Math.round(W / 26)); k++) {
        const h = hash(gy, k);
        if (h > 0.62) continue;
        const y = Math.round(gy * 12 + hash(k, gy) * 11 + off), x = Math.round(hash(k + 3, gy) * (W - 4)) + 1;
        if (y < 0 || y >= H) continue;
        g.fillStyle = (k + Math.floor(t * 3)) % 3 ? PAL.glint : PAL.foam;
        g.fillRect(x, y, 1, 1);
        if (h < 0.25) g.fillRect(x + 2, y, 1, 1);
      }
    }
    const bx = boatX(), by = boatY();
    // the wake: thin V-lines behind the moving kayak (render.js drawWakes, the boat's own speed)
    const sp = boost * 9;
    if (sp > 30) {
      const n = Math.min(6, 2 + Math.round(sp / 40));
      for (const sd of [-1, 1]) for (let i = 1; i <= n; i++) {
        if (hash(i, Math.floor(t * 12) + sd) < 0.2) continue;
        g.fillStyle = i < 3 ? PAL.foam : PAL.glint;
        g.fillRect(bx + Math.round((sd * (10 + i * 9)) / K), by + Math.round((HULL_HL - 6 + i * 22) / K), 2, 1);
      }
    }
    drawFx(g, false);
    // sprites: the kayak, the crew, the paddle, the reload bar, the dizzy stars → hard alpha edges
    sg.setTransform(1, 0, 0, 1, 0, 0);
    sg.clearRect(0, 0, W, H);
    sg.setTransform(1 / K, 0, 0, 1 / K, bx, by);
    drawKayak(sg, t, stunLeft > 0, reloadLeft);
    if (reloadLeft > 0) drawReloadBar(sg, reloadLeft);
    if (stunLeft > 0) drawDizzy(sg, t, stunLeft);
    sg.setTransform(1, 0, 0, 1, 0, 0);
    const x0 = clamp(bx - 34, 0, W), y0 = clamp(by - 40, 0, H), x1 = clamp(bx + 34, 0, W), y1 = clamp(by + 40, 0, H);
    if (x1 > x0 && y1 > y0) {
      const img = sg.getImageData(x0, y0, x1 - x0, y1 - y0), d = img.data;
      for (let i = 3; i < d.length; i += 4) d[i] = d[i] > 100 ? 255 : 0;
      sg.putImageData(img, x0, y0);
    }
    g.drawImage(spr, 0, 0);
    drawFx(g, true);
  }

  // ── the kayak (render.js drawKayak / drawTandem / hull / drawFace / drawSling), local frame: nose up = −y ──
  function drawKayak(c, t, dizzy, reloadLeft) {
    const pose = paddlePose(stroke, t);
    drawTandem(c, t);
    const ends = bladeEnds(pose.psi);
    if (pose.lift > 0) {
      c.fillStyle = "rgba(11,31,51,0.4)";
      for (const e of ends) { c.beginPath(); c.ellipse(e.x + 6, e.y + 6, 13, 7, pose.psi, 0, TAU); c.fill(); }
    }
    c.lineCap = "butt";
    c.strokeStyle = PAL.outline; c.lineWidth = 2.6 * K;
    c.beginPath(); c.moveTo(ends[0].x, ends[0].y); c.lineTo(ends[1].x, ends[1].y); c.stroke();
    c.strokeStyle = PAL.shaft; c.lineWidth = 1.2 * K;
    c.beginPath(); c.moveTo(ends[0].x, ends[0].y); c.lineTo(ends[1].x, ends[1].y); c.stroke();
    for (let k = 0; k < 2; k++) {
      const wet = pose.wet[k] > 0, e = ends[k];
      c.save(); c.translate(e.x, e.y); c.rotate(pose.psi);
      const lift = wet ? 0 : pose.lift * 1.1;
      c.scale(1 + lift * 0.15, 1 + lift * 0.15);
      c.fillStyle = PAL.outline; c.beginPath(); c.ellipse(0, 0, 18, 10, 0, 0, TAU); c.fill();
      c.fillStyle = wet ? PAL.bladeWet : PAL.blade; c.beginPath(); c.ellipse(0, 0, 14, 6.5, 0, 0, TAU); c.fill();
      c.restore();
    }
    drawSling(c, t, reloadLeft);
    drawFace(c, 0, SEAT.captain - 2, 20, 0, t, 1.3, dizzy, true); // the first mate up front, with the captain's hat (as the TV)
    drawFace(c, pose.lean * 5, PIVOT_Y - 4, 22, pose.lean * 0.12, t, 0, dizzy); // this phone's paddler, leaning into the stroke
  }
  function hull(c, w, h) {
    c.beginPath();
    c.moveTo(0, -h);
    c.bezierCurveTo(w * 1.3, -h * 0.55, w * 1.3, h * 0.55, 0, h);
    c.bezierCurveTo(-w * 1.3, h * 0.55, -w * 1.3, -h * 0.55, 0, -h);
    c.closePath();
  }
  function drawTandem(c, t) {
    const Wd = HULL_HB, L = HULL_HL, col = color, dark = mixHex(col, "#0b1f33", 0.28), lite = mixHex(col, "#ffffff", 0.45);
    c.fillStyle = "rgba(11,31,51,0.45)"; c.save(); c.translate(6, 8); hull(c, Wd, L); c.fill(); c.restore();
    c.fillStyle = PAL.outline; hull(c, Wd + K, L + K); c.fill();
    c.fillStyle = col; hull(c, Wd, L); c.fill();
    c.save(); hull(c, Wd, L); c.clip(); c.fillStyle = dark; c.fillRect(K / 2, -L, Wd * 2, 2 * L); c.restore();
    c.fillStyle = lite;
    c.fillRect(-K / 2, -L + 12, K, SEAT.captain - 30 + L - 12);
    c.fillRect(-K / 2, SEAT.captain + 30, K, SEAT.paddle - SEAT.captain - 60);
    c.fillRect(-K / 2, SEAT.paddle + 30, K, L - SEAT.paddle - 42);
    for (const sy of [SEAT.captain, SEAT.paddle]) {
      c.fillStyle = PAL.outline; c.beginPath(); c.ellipse(0, sy, 17, 27, 0, 0, TAU); c.fill();
      c.fillStyle = mixHex(col, "#0b1f33", 0.7); c.beginPath(); c.ellipse(0, sy, 13, 23, 0, 0, TAU); c.fill();
    }
    const f = Math.floor(t * 6) % 2, fy = L - 6; // the stern flag (flaps every 1/6 s)
    c.fillStyle = PAL.outline; c.fillRect(-K, fy - 12 * K, 2 * K, 13 * K);
    for (let i = 0; i < 6; i++) {
      const len = (7 - i) * K * 1.3, yy = fy - 12 * K + i * K - (f && i > 2 ? K : 0);
      c.fillStyle = PAL.outline; c.fillRect(K, yy - K / 2, len + K, 2 * K);
      c.fillStyle = i === 0 ? lite : col; c.fillRect(K, yy, len, K);
    }
  }
  function drawFace(c, x, y, R, lean, t, seed, dizzy, hat) {
    c.save();
    c.translate(x, y);
    c.rotate(lean);
    c.fillStyle = PAL.outline; c.beginPath(); c.arc(0, 0, R + 4, 0, TAU); c.fill();
    c.fillStyle = mixHex(color, "#ffffff", seed ? 0.32 : 0.15); c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();
    c.fillStyle = mixHex(color, "#ffffff", 0.6); c.fillRect(-R * 0.55, -R * 0.64, 2 * K, K); c.fillRect(-R * 0.64, -R * 0.45, K, K);
    c.fillStyle = PAL.eye;
    if (dizzy) {
      for (const ex of [-8, 6]) { c.fillRect(ex - 2, -6, K / 2 + 1, K / 2 + 1); c.fillRect(ex + 2, -2, K / 2 + 1, K / 2 + 1); c.fillRect(ex - 2, -2, K / 2 + 1, K / 2 + 1); c.fillRect(ex + 2, -6, K / 2 + 1, K / 2 + 1); }
    } else {
      const blink = (t * 0.7 + seed) % 4 < 0.1;
      for (const ex of [-8, 6]) c.fillRect((ex * R) / 22, -4, (2 * K) / 2 + K / 2, blink ? K / 2 : 2 * K);
    }
    c.fillStyle = PAL.blush; c.fillRect(-R * 0.68, R * 0.27, K, K); c.fillRect(R * 0.55, R * 0.27, K, K);
    c.fillStyle = PAL.eye; c.fillRect(-3, R * 0.4, 2 * K - 2, K / 2 + 1);
    if (hat) {
      c.fillStyle = PAL.outline; c.fillRect(-R - 2, -R - 2, 2 * R + 4, 2 * K); c.fillRect(-R * 0.6, -R - 2 - 2 * K, R * 1.2, 2 * K);
      c.fillStyle = PAL.lamp; c.fillRect(-K / 2, -R - 2 - K * 1.5, K, K);
    }
    c.restore();
  }
  // the slingshot pointing ahead: band pulled back with a balloon when loaded, slack while it reloads
  function drawSling(c, t, reloadLeft) {
    const ready = !(reloadLeft > 0), kick = clamp(1 - (t - fireT) / 0.18, 0, 1);
    c.save();
    c.translate(0, SEAT.captain - 2);
    c.rotate(-Math.PI / 2);
    const L = 40 - kick * 8, P = 20, F = 16;
    const fork = () => { c.beginPath(); c.moveTo(14, 0); c.lineTo(L, 0); c.moveTo(L, 0); c.lineTo(L + P, -F); c.moveTo(L, 0); c.lineTo(L + P, F); };
    c.lineCap = "square";
    c.strokeStyle = PAL.outline; c.lineWidth = 2.6 * K; fork(); c.stroke();
    c.strokeStyle = PAL.sling; c.lineWidth = 1.2 * K; fork(); c.stroke();
    c.strokeStyle = PAL.band; c.lineWidth = K;
    c.beginPath();
    if (ready) { c.moveTo(L + P, -F); c.lineTo(L - 4, 0); c.lineTo(L + P, F); }
    else { c.moveTo(L + P, -F); c.lineTo(L + P - 6, 0); c.lineTo(L + P, F); }
    c.stroke();
    if (ready) { c.fillStyle = PAL.outline; c.fillRect(L - 14, -2.5 * K, 5 * K, 5 * K); c.fillStyle = PAL.balloon; c.fillRect(L - 14 + K / 2, -2 * K, 4 * K, 4 * K); c.fillStyle = "#ffffff"; c.fillRect(L - 14 + K, -1.5 * K, K, K); }
    c.restore();
  }
  // the TV's reload bar under the kayak: fills gold while reloading
  function drawReloadBar(c, reloadLeft) {
    const f = clamp(1 - reloadLeft / RELOAD_T, 0, 1), X = -10 * K, Y = HULL_HL + 4 * K;
    c.fillStyle = PAL.outline; c.fillRect(X, Y, 20 * K, 4 * K);
    c.fillStyle = PAL.lamp; c.fillRect(X + K, Y + K, Math.round(18 * f) * K, 2 * K);
  }
  function drawDizzy(c, t, stunLeft) { // three big gold stars circling over the crew
    for (let k = 0; k < 3; k++) {
      const a = t * 5 + (k / 3) * TAU;
      const px = Math.round((Math.cos(a) * 50) / K) * K, py = Math.round((-40 + Math.sin(a) * 16) / K) * K;
      c.fillStyle = PAL.outline; c.fillRect(px - 2 * K, py - K, 5 * K, 3 * K); c.fillRect(px - K, py - 2 * K, 3 * K, 5 * K);
      c.fillStyle = PAL.star; c.fillRect(px - K, py, 3 * K, K); c.fillRect(px, py - K, K, 3 * K);
      c.fillStyle = PAL.foam; c.fillRect(px, py, K, K);
      if (stunLeft > 0.4 && (Math.floor(t * 8) + k) % 2) { c.fillStyle = PAL.star; c.fillRect(px - 3 * K, py, K, K); c.fillRect(px + 3 * K, py, K, K); }
    }
  }

  // ── the stroke's splash (render.js strokeFx): a ripple ring where the blade goes in, droplets arcing up and back,
  // foam along the drive. Positions in TV virtual px from the boat's centre; the water carries them downstream. ──
  function splash(sd) {
    const e = bladeEnds(sd === 0 ? 0.8 : -0.8)[sd], out = sd === 0 ? -1 : 1;
    fx.push({ k: "ripple", x: e.x, y: e.y, life: 0.45, max: 0.45 });
    for (let k = 0; k < 6; k++) fx.push({ k: "droplet", x: e.x + out * 6, y: e.y, vx: out * (40 + Math.random() * 60) + (Math.random() - 0.5) * 30, vy: 20 + Math.random() * 30, z: 2, vz: 160 + Math.random() * 120, life: 0.6 });
    const d = bladeEnds(sd === 0 ? 0.1 : -0.1)[sd];
    for (let k = 0; k < 3; k++) fx.push({ k: "foam", x: d.x + (Math.random() - 0.5) * 10, y: d.y + k * 12, vx: 0, vy: 0, life: 0.3 + Math.random() * 0.15 });
    if (fx.length > 80) fx.splice(0, fx.length - 80);
  }
  function ageFx(dt, speed) {
    const carry = speed * K * dt; // the water (and what floats on it) slides down past the boat
    for (let i = fx.length - 1; i >= 0; i--) {
      const p = fx[i];
      p.life -= dt;
      if (p.life <= 0) { fx.splice(i, 1); continue; }
      p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt + carry;
      if (p.k === "droplet") { p.z += p.vz * dt; p.vz -= 1100 * dt; if (p.z <= 0) fx.splice(i, 1); }
      else if (p.vx || p.vy) { p.vx *= 1 - 2 * dt; p.vy *= 1 - 2 * dt; }
    }
  }
  function drawFx(c, top) {
    const bx = boatX(), by = boatY();
    for (const p of fx) {
      if ((p.k === "droplet") !== top) continue;
      const X = bx + Math.round(p.x / K), Y = by + Math.round(p.y / K);
      if (p.k === "droplet") { c.fillStyle = p.z > 14 ? PAL.drop : PAL.dropFar; c.fillRect(X, Y - Math.round(p.z / K), 1, 1); continue; }
      if (p.k === "ripple") {
        const a = 1 - p.life / p.max, rr = (8 + a * 26) / K, n = 12;
        c.fillStyle = PAL.ripple;
        for (let k = 0; k < n; k++) { if ((k + Math.floor(a * 6)) % (a > 0.6 ? 3 : 2)) continue; const ang = (k / n) * TAU; c.fillRect(X + Math.round(Math.cos(ang) * rr), Y + Math.round(Math.sin(ang) * rr * 0.7), 1, 1); }
        continue;
      }
      c.fillStyle = PAL.foam;
      c.fillRect(X, Y, 1, 1);
    }
  }

  function syncTag(stunLeft, reloadLeft) {
    const what = stunLeft > 0 ? "stun" : reloadLeft > 0 ? "reload" : "";
    if (tag.dataset.what !== what) {
      tag.dataset.what = what;
      tag.hidden = !what;
      tag.firstChild.textContent = what === "stun" ? "STUNNED!" : what === "reload" ? "RELOADING" : "";
    }
    if (what === "reload") tag.querySelector("b").style.transform = `scaleX(${clamp(1 - reloadLeft / RELOAD_T, 0, 1).toFixed(2)})`;
  }

  if (hasRO) new ResizeObserver(() => { sized = false; lastKey = ""; wake(); }).observe(stage);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) wake(); });
  const api = {
    show(on) { shown = !!on; if (shown) wake(); },
    setColor(hex) { if (typeof hex === "string" && /^#[0-9a-f]{3,8}$/i.test(hex) && hex !== color) { color = hex; lastKey = ""; } },
    /** a real stroke: the paddle swings on the next side (left / right alternating, like the TV), a splash, a surge */
    stroke() {
      side = 1 - side;
      stroke = { side, t: now() };
      splash(side);
      if (!(left(stun) > 0)) boost = Math.min(boost + 9, 22); // stunned: the paddle swings, the boat doesn't surge (as the TV)
      wake();
    },
    /** the game's {type:"rowBoat", reload, stun} (seconds left; 0 / missing = loaded / not stunned) */
    setState(m) {
      if (!m || typeof m !== "object") return;
      const at = performance.now();
      const was = left(reload) > 0;
      reload = Number.isFinite(m.reload) && m.reload > 0 ? { left: Math.min(RELOAD_T, m.reload), at } : null;
      stun = Number.isFinite(m.stun) && m.stun > 0 ? { left: Math.min(10, m.stun), at } : null;
      if (reload && !was) fireT = now();
      lastKey = "";
      wake();
    },
    info: () => ({ W, H, N, frames, shown, running: !!raf, color, fx: fx.length }),
  };
  window.__rowBoat = { stroke: api.stroke, state: api.setState, info: api.info };
  return api;
}
