/**
 * Row Row Rumble's phone controller (pad.js shows it when the hub's game has stick: "motion").
 *
 * Paddling only moves you forward — the kayaks steer themselves — so there are no sides here.
 * Motion: any clear swing or pull of the phone, in any direction, is one stroke: a peak in how
 * hard the phone swings (rotation rate or acceleration, whichever is bigger) over a threshold
 * set by the Low / Med / High sensitivity, with hysteresis and a 250 ms refractory. A stroke is a
 * 120 ms pulse of b0 AND b1 together; a0 is always 0.
 * Button: one big PADDLE button (tap = stroke). Used when there are no motion sensors, when
 * permission is refused, on the plain-http home hub (browsers only give motion to https pages),
 * or when the player picks "Use the button".
 *
 * In the lobby, motion strokes are a test only ("Paddle to test!" with a splash and a count)
 * until the player taps "Ready!", so warming up doesn't start the round for everyone.
 *
 *   createRowPad(el, { onInput({x, b, c}), state() }) -> { show(on), release() }
 */

const STROKE_MS = 120; // how long a stroke holds the paddle buttons down
const REFRACTORY_MS = 250;
const SENS = { low: 0.75, med: 0.5, high: 0.32 }; // swing signal that counts as a stroke
const REARM = 0.45; // …and it must drop under this fraction of that before the next one
const PREF_KEY = "foxbox-row-input";
const SENS_KEY = "foxbox-row-sens";

export function createRowPad(el, { onInput, state }) {
  let shown = false;
  let input = "motion"; // "motion" | "buttons"
  let autoFallback = false; // the button because no sensor answered (switch back if one does)
  let listening = false;
  let gotMotion = false;
  let ready = false; // the lobby test is done
  let sens = "med";
  let count = 0;
  let down = 0; // 1 while a stroke pulse holds b0 + b1
  let sig = 0, armed = true, lastStroke = -1e9, timer = null, side = "l";
  let fallbackTimer = null;
  let asked = false; // the motion permission was asked for (iPhone)

  try {
    if (localStorage.getItem(PREF_KEY) === "buttons") input = "buttons";
    if (SENS[localStorage.getItem(SENS_KEY)]) sens = localStorage.getItem(SENS_KEY);
  } catch {}

  const hasMotionApi = typeof window.DeviceMotionEvent !== "undefined";
  const needsPermission = hasMotionApi && typeof DeviceMotionEvent.requestPermission === "function";

  const send = () => onInput({ x: 0, b: down, c: down });
  const warmUp = () => {
    const st = state();
    return (st === "lobby" || !st) && !ready;
  };

  // ── feedback ──
  function pulse() {
    side = side === "l" ? "r" : "l"; // the little boat alternates sides, just for the look
    el.boat.classList.remove("pull", "l", "r");
    el.countWrap.classList.remove("hit");
    void el.boat.offsetWidth; // restart the animations
    el.boat.classList.add("pull", side);
    el.countWrap.classList.add("hit");
    if (navigator.vibrate) {
      try {
        navigator.vibrate(30);
      } catch {}
    }
  }
  function renderHint() {
    const lobby = warmUp() || state() === "lobby" || !state();
    const sensing = input === "motion" && listening && gotMotion;
    el.ready.hidden = !(sensing && warmUp());
    el.sens.hidden = !(input === "motion" && gotMotion && lobby);
    let h;
    if (input === "buttons") h = lobby ? "Tap PADDLE to start · keep a steady beat" : "Tap PADDLE · a steady beat is fastest";
    else if (!gotMotion) h = el.enable.hidden ? "Getting the motion sensor…" : "Tap Enable motion, then paddle with your phone";
    else if (warmUp()) h = count ? "Nice! Tap Ready! when it feels right" : "Paddle to test! Swing your phone like a paddle";
    else if (lobby) h = "Paddle to start the round!";
    else h = "Paddle! Paddle! A steady beat is fastest";
    if (el.hint.textContent !== h) el.hint.textContent = h;
    el.count.textContent = String(count);
    el.sens.querySelectorAll("[data-s]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.s === sens)));
  }

  function stroke() {
    count++;
    pulse();
    renderHint();
    if (warmUp()) return; // a test stroke: it doesn't start the round
    clearTimeout(timer);
    down = 1;
    send();
    timer = setTimeout(() => {
      down = 0;
      send();
    }, STROKE_MS);
  }

  // ── motion ──
  function onMotion(e) {
    // browsers without a sensor still fire events, with every value null
    const gi = e.accelerationIncludingGravity, rr = e.rotationRate;
    if (!(gi && gi.x != null) && !(rr && rr.alpha != null)) return;
    if (!gotMotion) {
      gotMotion = true;
      clearTimeout(fallbackTimer);
      if (autoFallback) {
        autoFallback = false;
        setInput("motion", false);
      }
      renderHint();
    }
    if (input !== "motion") return;
    const now = performance.now();
    const g = gi || {};
    const r = rr || {};
    const rot = Math.hypot(r.alpha || 0, r.beta || 0, r.gamma || 0); // deg/s
    let lin;
    const ac = e.acceleration;
    if (ac && ac.x != null) lin = Math.hypot(ac.x, ac.y || 0, ac.z || 0);
    else lin = Math.abs(Math.hypot(g.x || 0, g.y || 0, g.z || 0) - 9.81);
    sig = sig * 0.5 + Math.max(rot / 360, lin / 14) * 0.5;
    const hi = SENS[sens];
    el.meter.style.transform = `scaleX(${Math.min(1, sig / (hi * 2))})`;
    if (armed && sig > hi && now - lastStroke > REFRACTORY_MS) {
      armed = false;
      lastStroke = now;
      stroke();
    } else if (!armed && sig < hi * REARM) armed = true;
  }

  // Desktops (and some phones) have the API but never send anything: fall back to the button.
  function armFallback(ms) {
    clearTimeout(fallbackTimer);
    fallbackTimer = setTimeout(() => {
      if (gotMotion || input !== "motion") return;
      if (needsPermission && !asked) {
        el.enable.hidden = false; // iPhone: nothing comes until a tap asks for it
        renderHint();
        return;
      }
      autoFallback = true;
      setInput("buttons", false, "No motion sensor found · using the button");
    }, ms);
  }

  function listen() {
    if (listening) return;
    listening = true;
    window.addEventListener("devicemotion", onMotion);
    armFallback(needsPermission ? 1000 : 2500);
    renderHint();
  }

  async function enableMotion() {
    asked = true;
    try {
      const res = await DeviceMotionEvent.requestPermission();
      if (res !== "granted") {
        setInput("buttons", false, "Motion wasn't allowed · using the button (reload the page to ask again)");
        return;
      }
    } catch {
      setInput("buttons", false, "Couldn't turn on motion · using the button");
      return;
    }
    el.enable.hidden = true;
    listen();
    armFallback(2500);
  }

  function startMotion() {
    if (!hasMotionApi) return setInput("buttons", false, "This phone has no motion sensor · using the button");
    if (!window.isSecureContext) return setInput("buttons", false, "Motion needs the https link · using the button");
    listen(); // Android sends right away; an iPhone needs "Enable motion" first (see armFallback)
  }

  // ── the button ──
  {
    const btn = el.oar;
    let ptr = null;
    btn.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      ptr = ev.pointerId;
      try {
        btn.setPointerCapture(ev.pointerId);
      } catch {}
      btn.classList.add("down");
      clearTimeout(timer);
      down = 1;
      send();
      count++;
      pulse();
      renderHint();
    });
    const end = (ev) => {
      if (ev.pointerId !== ptr) return;
      ptr = null;
      btn.classList.remove("down");
      down = 0;
      send();
    };
    btn.addEventListener("pointerup", end);
    btn.addEventListener("pointercancel", end);
    btn.addEventListener("lostpointercapture", end);
  }

  function setInput(kind, remember, note) {
    input = kind;
    if (remember) {
      autoFallback = false;
      try {
        localStorage.setItem(PREF_KEY, kind);
      } catch {}
    }
    el.motion.hidden = kind !== "motion";
    el.buttons.hidden = kind !== "buttons";
    el.useMotion.hidden = !hasMotionApi || !window.isSecureContext;
    el.note.textContent = note || "";
    release();
    if (kind === "motion") startMotion();
    renderHint();
  }

  el.useButtons.addEventListener("click", () => setInput("buttons", true));
  el.useMotion.addEventListener("click", () => setInput("motion", true));
  el.enable.addEventListener("click", enableMotion);
  el.ready.addEventListener("click", () => {
    ready = true;
    renderHint();
  });
  el.sens.querySelectorAll("[data-s]").forEach((b) =>
    b.addEventListener("click", () => {
      sens = b.dataset.s;
      try {
        localStorage.setItem(SENS_KEY, sens);
      } catch {}
      renderHint();
    }),
  );

  function release() {
    clearTimeout(timer);
    el.oar.classList.remove("down");
    if (down) {
      down = 0;
      send();
    }
  }

  setInterval(() => shown && renderHint(), 500);

  return {
    show(on) {
      if (on === shown) return;
      shown = on;
      el.root.hidden = !on;
      if (on) setInput(input, false);
      else release();
    },
    release,
  };
}
