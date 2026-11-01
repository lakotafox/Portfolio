/**
 * The CAPTAIN's phone controller for Row Row Rumble v2 (pad.js shows it for the captain seat).
 *
 * Held sideways (landscape) like a game controller:
 *   - TILT steers the boat: the phone's left/right lean, from gravity in screen coordinates, so it
 *     works held upright like a steering wheel or flat like a tray, in either landscape direction.
 *     Full lock at ~35°, dead zone ~6°. A meter across the top shows it.
 *   - LEFT thumb: aim stick (2D, up = -1).
 *   - RIGHT thumb: FIRE, with a reload ring (RELOAD_MS, a phone-side estimate of the game's reload).
 * Without motion (no sensor / permission refused / plain http) two ◀ ▶ buttons in the top bar steer.
 * In portrait it asks to turn the phone sideways.
 *
 *   createCapPad(el, { onInput({x, y, s, b}) }) -> { show(on), release(), setRole(text) }
 */

const RELOAD_MS = 4000;
const FULL_TILT = Math.sin((35 * Math.PI) / 180); // gravity share at full lock
const DEAD = Math.sin((6 * Math.PI) / 180);
const AIM_DEAD = 0.12;
const AIM_FULL = 0.7; // fraction of the stick radius for full aim

export function createCapPad(el, { onInput }) {
  let shown = false;
  let x = 0, y = 0, s = 0, b = 0;
  let tiltS = 0; // from motion
  let btnS = 0; // from the ◀ ▶ buttons
  let useButtons = false;
  let listening = false;
  let gotMotion = false;
  let lastFire = -1e9;
  let fallbackTimer = null;
  let manualButtons = false; // the player picked the ◀ ▶ buttons themselves

  const hasMotionApi = typeof window.DeviceMotionEvent !== "undefined";
  const needsPermission = hasMotionApi && typeof DeviceMotionEvent.requestPermission === "function";
  // iOS reports gravity the other way round from Android (and from Chrome's own sensor model)
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const iosSign = isIOS ? -1 : 1;

  const send = () => onInput({ x, y, s, b });
  const q = (v) => {
    v = Math.round(v * 20) / 20;
    return Object.is(v, -0) ? 0 : v;
  };

  // ── steering ──
  function setS(v) {
    v = q(Math.max(-1, Math.min(1, v)));
    el.steerFill.style.transform = `translateX(${v * 50}%)`;
    el.steerL.classList.toggle("on", v < 0);
    el.steerR.classList.toggle("on", v > 0);
    if (v !== s) {
      s = v;
      send();
    }
  }
  const updateSteer = () => setS(useButtons ? btnS : tiltS);

  function screenAngle() {
    const a = screen.orientation && typeof screen.orientation.angle === "number" ? screen.orientation.angle : window.orientation || 0;
    return ((a % 360) + 360) % 360;
  }

  function onMotion(e) {
    const g = e.accelerationIncludingGravity;
    if (!g || g.x == null) return;
    if (!gotMotion) {
      gotMotion = true;
      el.enable.hidden = true;
      clearTimeout(fallbackTimer);
      if (useButtons && !manualButtons) setButtons(false);
      render();
    }
    if (useButtons) return;
    // Android convention: the reading points UP (away from the floor) in device axes (x right, y top).
    const ax = g.x * iosSign, ay = g.y * iosSign;
    const a = screenAngle();
    // the screen's right-hand direction, in device axes
    const sx = a === 90 ? -ay : a === 270 ? ay : a === 180 ? -ax : ax;
    let v = -sx / 9.81; // lean the right edge down → the up-vector tips left → steer right
    v = Math.sign(v) * Math.max(0, Math.abs(v) - DEAD) / (FULL_TILT - DEAD);
    tiltS = tiltS * 0.4 + v * 0.6;
    updateSteer();
  }

  function listen() {
    if (listening) return;
    listening = true;
    window.addEventListener("devicemotion", onMotion);
    clearTimeout(fallbackTimer);
    fallbackTimer = setTimeout(() => {
      if (gotMotion) return;
      if (needsPermission && !asked) {
        el.enable.hidden = false;
        render();
        return;
      }
      setButtons(true, "No tilt sensor · steer with ◀ ▶");
    }, needsPermission ? 1000 : 2500);
  }

  let asked = false;
  async function enableMotion() {
    asked = true;
    try {
      const res = await DeviceMotionEvent.requestPermission();
      if (res !== "granted") return setButtons(true, "Motion wasn't allowed · steer with ◀ ▶ (reload to ask again)");
    } catch {
      return setButtons(true, "Couldn't turn on motion · steer with ◀ ▶");
    }
    el.enable.hidden = true;
    listen();
  }

  function setButtons(on, note) {
    useButtons = on;
    el.root.classList.toggle("buttons", on);
    el.note.textContent = note || "";
    btnS = 0;
    updateSteer();
    render();
  }

  function startMotion() {
    if (!hasMotionApi) return setButtons(true, "No tilt sensor · steer with ◀ ▶");
    if (!window.isSecureContext) return setButtons(true, "Tilt needs the https link · steer with ◀ ▶");
    listen();
  }

  // ◀ ▶ buttons (fallback)
  for (const [btn, dir] of [[el.steerL, -1], [el.steerR, 1]]) {
    let ptr = null;
    btn.addEventListener("pointerdown", (ev) => {
      if (!useButtons) return;
      ev.preventDefault();
      ptr = ev.pointerId;
      try {
        btn.setPointerCapture(ev.pointerId);
      } catch {}
      btnS = dir;
      updateSteer();
    });
    const end = (ev) => {
      if (ev.pointerId !== ptr) return;
      ptr = null;
      if (btnS === dir) btnS = 0;
      updateSteer();
    };
    btn.addEventListener("pointerup", end);
    btn.addEventListener("pointercancel", end);
    btn.addEventListener("lostpointercapture", end);
  }

  // ── aim stick ──
  {
    const pad = el.aim;
    let ptr = null;
    const from = (ev) => {
      const r = pad.getBoundingClientRect();
      const R = Math.min(r.width, r.height) / 2;
      let dx = (ev.clientX - (r.left + r.width / 2)) / (R * AIM_FULL);
      let dy = (ev.clientY - (r.top + r.height / 2)) / (R * AIM_FULL);
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
    const portrait = window.innerHeight > window.innerWidth;
    el.root.classList.toggle("portrait", portrait);
    el.steerHint.textContent = useButtons ? "hold ◀ ▶ to steer" : gotMotion ? "tilt to steer" : el.enable.hidden ? "getting tilt…" : "";
  }
  window.addEventListener("resize", () => shown && render());
  if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener("change", () => shown && render());

  el.enable.addEventListener("click", enableMotion);
  el.useButtons.addEventListener("click", () => {
    manualButtons = !useButtons;
    setButtons(!useButtons, "");
    if (!useButtons) startMotion();
  });

  function release() {
    x = y = b = 0;
    btnS = 0;
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
        try {
          screen.orientation?.unlock?.();
        } catch {}
      }
    },
    release,
    setRole(text) {
      el.role.textContent = text;
    },
  };
}
