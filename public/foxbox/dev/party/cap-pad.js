/**
 * The CAPTAIN's phone controller for Row Row Rumble v2 (pad.js shows it for the captain seat).
 *
 * Held sideways (landscape) like a game controller:
 *   - TILT steers the boat: the phone's left/right lean, from gravity in DEVICE coordinates relative
 *     to how the captain holds it (decided from gravity, either landscape side), so the browser
 *     auto-rotating mid-race can't flip the steering. Full lock at ~22°, dead zone ~5°.
 *   - The controls never flip: on a tap we ask for full screen + an orientation lock (Android);
 *     where that's not possible (iPhone) the whole controller is turned with CSS to match the
 *     physical hold whatever the window does — it also works with iOS Rotation Lock on.
 *   - LEFT thumb: aim stick (2D, up = -1).
 *   - RIGHT thumb: FIRE, with a reload ring (RELOAD_MS, a phone-side estimate of the game's reload).
 * Motion is required; setup offers a tilt test and host-confirmed Ready before the race.
 * In portrait it asks to turn the phone sideways.
 *
 *   createCapPad(el, { onInput({x, y, s, b}) }) -> { show(on), release(), setRole(text) }
 */

const RELOAD_MS = 4000;
const FULL_TILT = Math.sin((22 * Math.PI) / 180); // gravity share at full lock
const DEAD = Math.sin((5 * Math.PI) / 180);
const HOLD_SWITCH_MS = 800; // gravity must clearly point the other way this long to change sides
const AIM_DEAD = 0.12;
const AIM_FULL = 0.7; // fraction of the stick radius for full aim

export function createCapPad(el, { onInput, state = () => "playing", onReady = () => {} }) {
  let shown = false;
  let x = 0, y = 0, s = 0, b = 0;
  let tiltS = 0; // from motion
  let setup = null, pending = false, permissionGranted = false, testedTilt = false;
  let phase = state();
  let listening = false;
  let gotMotion = false;
  let lastFire = -1e9, lastMotionAt = -Infinity;
  let fallbackTimer = null;

  const hasMotionApi = typeof window.DeviceMotionEvent !== "undefined";
  const needsPermission = hasMotionApi && typeof DeviceMotionEvent.requestPermission === "function";
  // iOS reports gravity the other way round from Android (and from Chrome's own sensor model)
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const iosSign = isIOS ? -1 : 1;

  const send = () => { if (shown && gotMotion && window.isSecureContext && state() === "playing") onInput({ x, y, s, b }); };
  const preparing = () => !!(shown && setup?.active);
  const report = (ready = false) => {
    if (shown && setup && (preparing() || (!ready && state() === "countdown")))
      onReady({ motionReady: gotMotion, ready: !!ready && gotMotion && testedTilt });
  };

  // ── how the phone is physically held ──
  // holdAngle: which device edge points up, in screen.orientation.angle terms (90 = the device's
  // right edge up = landscape-primary on phones, 270 = left edge up, 0 = portrait), or null until known.
  let holdAngle = null;
  let flipSince = 0;
  let rotDeg = 0; // CSS rotation applied to the controller (clockwise), so it matches the hold
  const padScreen = el.root.closest("#pad-screen") || document.getElementById("pad-screen");
  injectCss();
  const tip = document.createElement("div");
  tip.className = "cap-tip";
  tip.textContent = "Tip: turn on Rotation Lock (Control Center) for the steadiest controls";
  tip.hidden = !isIOS;
  (el.note.parentNode || el.root).insertBefore(tip, el.note.nextSibling);

  function holdFromGravity(ux, uy) {
    const ax = Math.abs(ux), ay = Math.abs(uy);
    if (Math.max(ax, ay) < 4.5) return null; // lying flat: can't tell
    if (ax >= ay) return ux > 0 ? 90 : 270;
    return uy > 0 ? 0 : 180;
  }
  function updateHold(ux, uy, now) {
    const h = holdFromGravity(ux, uy);
    if (h == null) return;
    if (holdAngle == null) {
      holdAngle = h;
      layout();
      lockOrientation();
      return;
    }
    if (h === holdAngle) { flipSince = 0; return; }
    // only a clear, sustained change of grip moves it (steering tilt never gets near this)
    const clear = h === 90 || h === 270 ? Math.abs(ux) > 7 : Math.abs(uy) > 7;
    if (!clear) { flipSince = 0; return; }
    if (!flipSince) flipSince = now;
    else if (now - flipSince > HOLD_SWITCH_MS) {
      holdAngle = h;
      flipSince = 0;
      layout();
      lockOrientation();
    }
  }

  // turn the whole controller screen so "up" is the physical up, whatever the window is doing
  function layout() {
    if (!shown) return clearRot();
    const want = holdAngle == null ? screenAngle() : holdAngle === 180 ? 0 : holdAngle;
    rotDeg = (((want - screenAngle()) % 360) + 360) % 360;
    const portraitHold = holdAngle === 0 || holdAngle === 180 || (holdAngle == null && window.innerHeight > window.innerWidth);
    el.root.classList.toggle("portrait", portraitHold);
    if (!padScreen) return;
    if (!rotDeg) return clearRot();
    const side = rotDeg === 90 || rotDeg === 270;
    const w = side ? window.innerHeight : window.innerWidth;
    const h = side ? window.innerWidth : window.innerHeight;
    padScreen.classList.add("cap-rot");
    Object.assign(padScreen.style, {
      position: "fixed", left: "50%", top: "50%", right: "auto", bottom: "auto",
      width: w + "px", height: h + "px", transform: `translate(-50%, -50%) rotate(${rotDeg}deg)`,
    });
  }
  function clearRot() {
    rotDeg = 0;
    if (!padScreen || !padScreen.classList.contains("cap-rot")) return;
    padScreen.classList.remove("cap-rot");
    for (const k of ["position", "left", "top", "right", "bottom", "width", "height", "transform"]) padScreen.style[k] = "";
  }

  // Android: full screen + lock to the side it's held on (needs a tap; failures are fine)
  let wentFull = false;
  function lockOrientation() {
    const o = screen.orientation;
    if (!o || !o.lock || holdAngle == null || holdAngle === 0 || holdAngle === 180) return;
    const type = holdAngle === 90 ? "landscape-primary" : "landscape-secondary";
    try {
      o.lock(type).catch(() => o.lock("landscape").catch(() => {}));
    } catch {}
  }
  function goFull() {
    if (isIOS || document.fullscreenElement || !document.documentElement.requestFullscreen) return lockOrientation();
    try {
      document.documentElement
        .requestFullscreen({ navigationUI: "hide" })
        .then(() => { wentFull = true; lockOrientation(); })
        .catch(() => lockOrientation());
    } catch {
      lockOrientation();
    }
  }
  el.root.addEventListener("pointerdown", () => { if (shown) goFull(); }, true);
  const q = (v) => {
    v = Math.round(v * 20) / 20;
    return Object.is(v, -0) ? 0 : v;
  };

  // ── steering ──
  function setS(v) {
    v = q(Math.max(-1, Math.min(1, v)));
    el.steerFill.style.transform = `translateX(${v * 50}%)`;
    if (v !== s) {
      s = v;
      send();
    }
  }
  const updateSteer = () => setS(tiltS);

  function screenAngle() {
    const a = screen.orientation && typeof screen.orientation.angle === "number" ? screen.orientation.angle : window.orientation || 0;
    return ((a % 360) + 360) % 360;
  }

  function onMotion(e) {
    if (!shown || document.hidden || !window.isSecureContext || !hasMotionApi || (needsPermission && !permissionGranted)) return;
    const g = e.accelerationIncludingGravity;
    if (!g || !Number.isFinite(g.x) || !Number.isFinite(g.y)) return;
    lastMotionAt = performance.now();
    if (!gotMotion) {
      gotMotion = permissionGranted = true;
      el.enable.hidden = true;
      clearTimeout(fallbackTimer);
      el.note.textContent = "";
      report(false);
      render();
    }
    // Android convention: the reading points UP (away from the floor) in device axes (x right, y top).
    const ax = g.x * iosSign, ay = g.y * iosSign;
    updateHold(ax, ay, performance.now());
    // steer relative to the physical hold (not the window), so auto-rotate can't flip it
    const a = holdAngle == null ? screenAngle() : holdAngle === 180 ? 180 : holdAngle;
    // the screen's right-hand direction, in device axes
    const sx = a === 90 ? -ay : a === 270 ? ay : a === 180 ? -ax : ax;
    let v = -sx / 9.81; // lean the right edge down → the up-vector tips left → steer right
    v = Math.sign(v) * Math.max(0, Math.abs(v) - DEAD) / (FULL_TILT - DEAD);
    if (!testedTilt && Math.abs(v) > 0.15) { testedTilt = true; render(); }
    tiltS = tiltS * 0.4 + v * 0.6;
    updateSteer();
  }

  function unavailable(note) {
    release();
    gotMotion = false;
    testedTilt = false;
    pending = false;
    el.note.textContent = note;
    report(false);
    render();
  }
  function startMotion() {
    if (!window.isSecureContext) {
      el.enable.hidden = true;
      return unavailable("Tilt needs a secure HTTPS controller link. Rejoin using that link.");
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
    clearTimeout(fallbackTimer);
    fallbackTimer = setTimeout(() => {
      if (shown && !gotMotion && (!needsPermission || permissionGranted)) unavailable("No tilt readings yet. Check motion access, then try again.");
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
      goFull();
    } catch { unavailable("Motion access could not be enabled. Check this site's motion permission and retry."); }
  }

  // ── aim stick ──
  {
    const pad = el.aim;
    let ptr = null;
    const from = (ev) => {
      const r = pad.getBoundingClientRect();
      const R = Math.min(r.width, r.height) / 2;
      const vx = (ev.clientX - (r.left + r.width / 2)) / (R * AIM_FULL);
      const vy = (ev.clientY - (r.top + r.height / 2)) / (R * AIM_FULL);
      // the controller may be turned with CSS: undo that rotation (clockwise rotDeg)
      const t = (rotDeg * Math.PI) / 180, c = Math.round(Math.cos(t)), sn = Math.round(Math.sin(t));
      let dx = vx * c + vy * sn;
      let dy = -vx * sn + vy * c;
      const m = Math.hypot(dx, dy);
      if (m < AIM_DEAD) dx = dy = 0;
      else if (m > 1) { dx /= m; dy /= m; }
      setAim(dx, dy);
    };
    pad.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      ptr = ev.pointerId;
      try {
        pad.setPointerCapture(ev.pointerId);
      } catch {}
      pad.classList.add("active");
      from(ev);
    });
    pad.addEventListener("pointermove", (ev) => {
      if (ev.pointerId !== ptr) return;
      ev.preventDefault();
      from(ev);
    });
    const end = (ev) => {
      if (ev.pointerId !== ptr) return;
      ptr = null;
      pad.classList.remove("active");
      setAim(0, 0);
    };
    pad.addEventListener("pointerup", end);
    pad.addEventListener("pointercancel", end);
    pad.addEventListener("lostpointercapture", end);
  }
  function setAim(vx, vy) {
    vx = q(vx);
    vy = q(vy);
    const r = el.aim.getBoundingClientRect();
    const R = (Math.min(r.width, r.height) / 2) * AIM_FULL;
    el.aimKnob.style.transform = `translate(${vx * R}px, ${vy * R}px)`;
    el.aimArrow.style.opacity = vx || vy ? "1" : "0";
    el.aimArrow.style.transform = `rotate(${Math.atan2(vy, vx)}rad)`;
    if (vx !== x || vy !== y) {
      x = vx;
      y = vy;
      send();
    }
  }

  // ── FIRE ──
  {
    const btn = el.fire;
    let ptr = null;
    btn.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      ptr = ev.pointerId;
      try {
        btn.setPointerCapture(ev.pointerId);
      } catch {}
      btn.classList.add("down");
      const now = performance.now();
      if (now - lastFire >= RELOAD_MS) {
        lastFire = now;
        btn.classList.remove("shot");
        void btn.offsetWidth;
        btn.classList.add("shot");
        if (navigator.vibrate) {
          try {
            navigator.vibrate(45);
          } catch {}
        }
      } else {
        btn.classList.remove("nope");
        void btn.offsetWidth;
        btn.classList.add("nope");
      }
      b = 1;
      send();
    });
    const end = (ev) => {
      if (ev.pointerId !== ptr) return;
      ptr = null;
      btn.classList.remove("down");
      b = 0;
      send();
    };
    btn.addEventListener("pointerup", end);
    btn.addEventListener("pointercancel", end);
    btn.addEventListener("lostpointercapture", end);
  }

  // the reload ring: 0 → 1 over RELOAD_MS after a shot
  function tickRing() {
    if (shown) {
      const k = Math.min(1, (performance.now() - lastFire) / RELOAD_MS);
      el.ring.style.setProperty("--k", k.toFixed(3));
      el.fire.classList.toggle("loaded", k >= 1);
      el.fireLabel.textContent = k >= 1 ? "FIRE" : "reloading";
    }
    requestAnimationFrame(tickRing);
  }
  requestAnimationFrame(tickRing);

  function render() {
    el.root.classList.toggle("motion-setup", preparing());
    layout();
    el.steerHint.textContent = gotMotion ? (state() === "playing" ? "tilt to steer" : "Tilt to test your steering") : "Enable motion to steer";
    el.ready.hidden = !preparing();
    el.ready.disabled = !gotMotion || !testedTilt || !!setup?.ready || pending;
    el.ready.textContent = setup?.ready ? "Ready ✓" : pending ? "Waiting for TV…" : "Ready!";
  }
  window.addEventListener("resize", () => shown && render());
  window.addEventListener("orientationchange", () => shown && setTimeout(render, 50));
  if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener("change", () => shown && render());

  const canInvalidate = () => shown && setup && (state() === "lobby" || state() === "countdown");
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) return;
    release();
    if (canInvalidate()) unavailable("Motion paused while this page was hidden. Return, test your tilt, and tap Ready again.");
  });
  setInterval(() => {
    if (canInvalidate() && gotMotion && performance.now() - lastMotionAt > 2500)
      unavailable("Tilt readings stopped. Move your phone to reconnect, then tap Ready again.");
  }, 500);
  el.enable.addEventListener("click", enableMotion);
  el.ready.addEventListener("click", () => {
    if (!preparing() || !gotMotion || !testedTilt || setup.ready || pending) return;
    pending = true;
    report(true);
    render();
  });

  function release() {
    x = y = b = 0;
    el.fire.classList.remove("down");
    el.aim.classList.remove("active");
    el.aimKnob.style.transform = "";
    el.aimArrow.style.opacity = "0";
    s = 0;
    tiltS = 0;
    send();
  }

  return {
    show(on) {
      if (on === shown) return;
      shown = on;
      el.root.hidden = !on;
      if (on) {
        render();
        startMotion();
        // ask the browser for landscape where it's allowed (Android, full screen); harmless elsewhere
        try {
          screen.orientation?.lock?.("landscape").catch(() => {});
        } catch {}
      } else {
        release();
        clearTimeout(fallbackTimer);
        clearRot();
        holdAngle = null;
        try {
          screen.orientation?.unlock?.();
        } catch {}
        if (wentFull && document.fullscreenElement) {
          wentFull = false;
          document.exitFullscreen().catch(() => {});
        }
      }
    },
    setSetup(next) {
      const nextPhase = state();
      if (nextPhase !== phase && nextPhase === "playing") { release(); lastFire = -1e9; }
      phase = nextPhase;
      const changed = next?.key !== setup?.key;
      if (changed) {
        release();
        gotMotion = false;
        testedTilt = false;
        tiltS = 0;
        lastFire = -1e9;
        lastMotionAt = -Infinity;
      }
      setup = next;
      pending = false;
      if (shown && changed && !gotMotion) startMotion();
      render();
    },
    release,
    setRole(text) {
      el.role.textContent = text;
    },
  };
}

// The landscape-only captain layout from pad.html, also applied while the controller is turned
// with CSS inside a portrait window (iPhone, or Rotation Lock on), plus the iPhone tip line.
function injectCss() {
  if (document.getElementById("cap-rot-css")) return;
  const st = document.createElement("style");
  st.id = "cap-rot-css";
  st.textContent = `
  #pad-screen.cap-rot { transform-origin: 50% 50%; z-index: 20; }
  #pad-screen.cap-rot.captain #status, #pad-screen.cap-rot.captain #boats, #pad-screen.cap-rot.captain.seated-play #top { display: none; }
  #pad-screen.cap-rot.captain.picking #boats { display: block; position: absolute; z-index: 5; left: 12px; right: 12px; top: 60px; background: rgba(11, 16, 32, 0.96); }
  #pad-screen.cap-rot.captain #boats-grid { grid-template-columns: repeat(4, 1fr); }
  #pad-screen.cap-rot.captain #top { min-height: 36px; }
  #pad-screen.cap-rot.captain #me-ball { width: 30px; height: 30px; }
  #pad-screen.cap-rot.captain #me-name { font-size: 20px; }
  #cap .cap-tip { font-size: 12px; line-height: 1.3; opacity: 0.7; text-align: center; max-width: 22em; }
  #cap .cap-tip[hidden] { display: none; }`;
  document.head.append(st);
}
