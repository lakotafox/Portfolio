/**
 * landscape.js — in-game controllers stay sideways (full screen, landscape) while a round is on.
 *
 * Android: the first tap during play asks for full screen and locks the screen to landscape.
 * iPhone (no orientation lock for web pages; often Rotation Lock is on, so the window stays
 * portrait): the controller screen is turned 90° with CSS so it always shows in landscape.
 * Which way it turns comes from how the phone is held (gravity, when the sensor is available
 * without asking), else the common grip (top of the phone to the left → turn clockwise).
 * The captain/first-mate controller (cap-pad.js) does its own turning and is left alone.
 *
 *   const land = createLandscape(document.getElementById("pad-screen"));
 *   land.set(true | false);       // during play / not
 *   land.local(ev, el)            // a pointer event → {dx, dy, halfW, halfH} in el's own (unturned) frame
 */
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

// When the window is portrait but the controller is turned sideways, pad.html's
// (orientation: portrait) rules still match, so mirror its (orientation: landscape) rules here
// for the turned screen (and undo the portrait-only ones). The captain controller is never turned
// by this module, so its rules aren't needed.
const CSS = `
#pad-screen.land-rot { gap: 8px; }
#pad-screen.land-rot #top { min-height: 36px; }
#pad-screen.land-rot #me-ball { width: 30px; height: 30px; }
#pad-screen.land-rot #me-name { font-size: 22px; }
#pad-screen.land-rot #status {
  flex: none; display: flex; flex-direction: row; align-items: baseline; justify-content: center;
  gap: 14px; padding: 6px 12px; border-radius: 16px;
}
#pad-screen.land-rot #status-big { font-size: clamp(22px, 7vw, 34px); }
#pad-screen.land-rot #status-small { margin-top: 0; font-size: 17px; }
#pad-screen.land-rot #status #change-char { margin-top: 0; font-size: 15px; padding: 5px 10px; }
#pad-screen.land-rot #controls { flex: 1; height: auto; }
#pad-screen.land-rot #steer { flex: 1.15; }
#pad-screen.land-rot #steer .half { font-size: 44px; }
#pad-screen.land-rot.land-anim { transition: none; }
`;
function injectCss() {
  if (document.getElementById("foxbox-landscape-css")) return;
  const st = document.createElement("style");
  st.id = "foxbox-landscape-css";
  st.textContent = CSS;
  document.head.append(st);
}

export function createLandscape(screenEl) {
  injectCss();
  let want = false;
  let rotDeg = 0;
  let hold = null; // 90 = device's right edge up (top of the phone to the left), 270 = the other way
  let listening = false;
  let cand = null, candSince = 0; // a grip change must hold for HOLD_MS before the screen turns over
  const HOLD_MS = 600;

  const screenAngle = () => (screen.orientation && typeof screen.orientation.angle === "number" ? screen.orientation.angle : typeof window.orientation === "number" ? (window.orientation + 360) % 360 : 0);

  function onMotion(e) {
    const g = e.accelerationIncludingGravity;
    if (!g || g.x == null) return;
    // device coordinates: x points right along the short edge; when held sideways gravity pulls along x
    const ux = (isIOS ? -1 : 1) * g.x, uy = (isIOS ? -1 : 1) * g.y;
    if (Math.abs(ux) < 6 || Math.abs(ux) < Math.abs(uy)) return; // not clearly sideways
    const h = ux > 0 ? 90 : 270;
    if (h === hold) {
      cand = null;
      return;
    }
    const now = performance.now();
    if (hold == null) {
      hold = h; // first reading: use it straight away
      layout();
      return;
    }
    if (cand !== h) {
      cand = h;
      candSince = now;
      return;
    }
    if (now - candSince >= HOLD_MS) {
      hold = h;
      cand = null;
      layout();
    }
  }
  function listen(on) {
    if (on === listening) return;
    listening = on;
    if (on) window.addEventListener("devicemotion", onMotion);
    else window.removeEventListener("devicemotion", onMotion);
  }

  function clear() {
    rotDeg = 0;
    if (!screenEl.classList.contains("land-rot")) return;
    screenEl.classList.remove("land-rot");
    for (const k of ["position", "left", "top", "right", "bottom", "width", "height", "transform"]) screenEl.style[k] = "";
  }
  function layout() {
    if (!want || screenEl.classList.contains("cap-rot") || screenEl.classList.contains("captain")) return clear();
    const portraitWindow = window.innerHeight > window.innerWidth;
    if (!portraitWindow) return clear(); // the window is already landscape: nothing to turn
    const h = hold ?? 90;
    rotDeg = (((h - screenAngle()) % 360) + 360) % 360 || 90;
    screenEl.classList.add("land-rot");
    Object.assign(screenEl.style, {
      position: "fixed", left: "50%", top: "50%", right: "auto", bottom: "auto",
      width: window.innerHeight + "px", height: window.innerWidth + "px",
      transform: `translate(-50%, -50%) rotate(${rotDeg}deg)`,
    });
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

  return {
    set(on) {
      on = !!on;
      if (on === want) {
        if (on) layout();
        return;
      }
      want = on;
      listen(on);
      if (on) layout();
      else {
        clear();
        unlock();
      }
    },
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
}

function parseRot(t) {
  const m = /rotate\((-?\d+(?:\.\d+)?)deg\)/.exec(t || "");
  return m ? Number(m[1]) : 0;
}
