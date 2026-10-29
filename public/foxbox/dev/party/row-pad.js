/**
 * Row Row Rumble's phone controller (pad.js shows it when the hub's game has stick: "motion").
 *
 * Motion = a kayak paddle: hold the phone in both hands like the middle of a double paddle and
 * pull on one side, then the other. A stroke is a peak in how hard the phone swings (rotation
 * rate or acceleration, whichever is bigger), with hysteresis and a 350 ms refractory. Its side
 * comes from which way the phone is rolled at that moment: gravity along the screen's
 * left-right axis, against a slowly-following neutral. A LEFT stroke is a 120 ms b0 pulse, a
 * RIGHT one a b1 pulse; a0 is always 0 (alternate sides to go straight, the game turns you).
 * Which roll direction means "left" differs between phones and grips, so the warm-up learns it
 * ("Paddle LEFT… now RIGHT"), and "Swap sides" flips it by hand.
 * Buttons: LEFT / RIGHT PADDLE (b0 / b1). Used when there are no motion sensors, when
 * permission is refused, on the plain-http home hub (browsers only give motion to https pages),
 * or when the player picks "Use buttons".
 *
 * In the lobby, strokes are a test only (left/right counters and a splash) until the player
 * taps "Ready!", so warming up doesn't start the round for everyone.
 *
 *   createRowPad(el, { onInput({x, b, c}), state() }) -> { show(on), release() }
 */

const STROKE_MS = 120; // how long a stroke holds its paddle button down
const REFRACTORY_MS = 350;
const HI = 0.55; // swing signal that counts as a stroke…
const LO = 0.25; // …and the level it must drop back under before the next one
const SIDE_WINDOW_MS = 350; // the strongest roll seen this recently decides the side
const PREF_KEY = "foxbox-row-input";
const FLIP_KEY = "foxbox-row-flip";

export function createRowPad(el, { onInput, state }) {
  let shown = false;
  let input = "motion"; // "motion" | "buttons"
  let autoFallback = false; // buttons because no sensor answered (switch back if one does)
  let listening = false;
  let gotMotion = false;
  let ready = false; // the lobby warm-up is done
  let calib = "left"; // warm-up step: "left" → "right" → "done"
  let flip = false; // this phone/grip rolls the other way
  let leftN = 0, rightN = 0;
  let b = 0, c = 0;
  let sig = 0, armed = true, lastStroke = -1e9, timerL = null, timerR = null;
  let roll = 0, neutral = 0, haveNeutral = false;
  let recent = []; // [time, roll - neutral]
  let fallbackTimer = null;
  let asked = false; // the motion permission was asked for (iPhone)

  try {
    if (localStorage.getItem(PREF_KEY) === "buttons") input = "buttons";
    flip = localStorage.getItem(FLIP_KEY) === "1";
    if (localStorage.getItem(FLIP_KEY) != null) calib = "done"; // learned on an earlier visit
  } catch {}

  const hasMotionApi = typeof window.DeviceMotionEvent !== "undefined";
  const needsPermission = hasMotionApi && typeof DeviceMotionEvent.requestPermission === "function";

  const send = () => onInput({ x: 0, b, c });
  const warmUp = () => {
    const st = state();
    return (st === "lobby" || !st) && !ready;
  };

  // ── feedback ──
  function pulse(side) {
    el.boat.classList.remove("pull", "l", "r");
    void el.boat.offsetWidth; // restart the animation
    el.boat.classList.add("pull", side);
    if (navigator.vibrate) {
      try {
        navigator.vibrate(30);
      } catch {}
    }
  }
  function renderHint() {
    const lobby = warmUp() || state() === "lobby" || !state();
    const sensing = input === "motion" && listening && gotMotion;
    el.ready.hidden = !(sensing && warmUp() && calib === "done");
    el.swap.hidden = !(input === "motion" && lobby);
    let h;
    if (input === "buttons") h = lobby ? "Tap a paddle to start · alternate LEFT and RIGHT" : "Alternate LEFT and RIGHT to paddle";
    else if (!gotMotion) h = el.enable.hidden ? "Getting the motion sensor…" : "Tap Enable motion, then paddle with your phone";
    else if (warmUp() && calib === "left") h = "Hold it like a paddle · paddle on your LEFT";
    else if (warmUp() && calib === "right") h = "Now paddle on your RIGHT";
    else if (warmUp()) h = "Left and right both work? Tap Ready! (Swap sides if they're backwards)";
    else if (lobby) h = "Paddle to start the round!";
    else h = "Paddle left, right, left… · more on one side turns you";
    if (el.hint.textContent !== h) el.hint.textContent = h;
    el.leftN.textContent = String(leftN);
    el.rightN.textContent = String(rightN);
    el.boat.dataset.step = warmUp() ? calib : "";
  }

  // ── motion ──
  function hold(side) {
    if (side === "l") {
      clearTimeout(timerL);
      b = 1;
      send();
      timerL = setTimeout(() => {
        b = 0;
        send();
      }, STROKE_MS);
    } else {
      clearTimeout(timerR);
      c = 1;
      send();
      timerR = setTimeout(() => {
        c = 0;
        send();
      }, STROKE_MS);
    }
  }

  function stroke(now) {
    // the strongest roll in the last moment says which side the paddle went in
    let best = 0;
    for (const [t, d] of recent) if (now - t <= SIDE_WINDOW_MS && Math.abs(d) > Math.abs(best)) best = d;
    let side = best >= 0 ? "r" : "l";
    if (warmUp() && calib !== "done") {
      // learn this phone's direction from the first prompted strokes
      if (calib === "left") {
        flip = side !== "l";
        side = "l";
        calib = "right";
      } else {
        side = (best >= 0) !== flip ? "r" : "l";
        if (side === "r") {
          calib = "done";
          try {
            localStorage.setItem(FLIP_KEY, flip ? "1" : "0");
          } catch {}
        }
      }
    } else if (flip) side = side === "l" ? "r" : "l";
    if (side === "l") leftN++;
    else rightN++;
    pulse(side);
    renderHint();
    if (!warmUp()) hold(side);
  }

  function screenAngle() {
    const a = screen.orientation && typeof screen.orientation.angle === "number" ? screen.orientation.angle : window.orientation || 0;
    return ((a % 360) + 360) % 360;
  }

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
    // roll: gravity along the screen's left-right axis (in g), whichever way round it's held
    const g = e.accelerationIncludingGravity || {};
    const a = screenAngle();
    const gx = (a === 90 ? g.y : a === 270 ? -(g.y || 0) : a === 180 ? -(g.x || 0) : g.x) || 0;
    roll = roll * 0.7 + (gx / 9.81) * 0.3;
    if (!haveNeutral) {
      neutral = roll;
      haveNeutral = true;
    }
    const dev = roll - neutral;
    recent.push([now, dev]);
    while (recent.length && now - recent[0][0] > SIDE_WINDOW_MS) recent.shift();
    // swing strength
    const r = e.rotationRate || {};
    const rot = Math.hypot(r.alpha || 0, r.beta || 0, r.gamma || 0); // deg/s
    let lin;
    const ac = e.acceleration;
    if (ac && ac.x != null) lin = Math.hypot(ac.x, ac.y || 0, ac.z || 0);
    else lin = Math.abs(Math.hypot(g.x || 0, g.y || 0, g.z || 0) - 9.81);
    sig = sig * 0.5 + Math.max(rot / 360, lin / 14) * 0.5;
    if (armed) neutral = neutral * 0.985 + roll * 0.015; // follow the grip slowly between strokes
    el.meter.style.transform = `scaleX(${Math.min(1, sig / 1.2)})`;
    el.rollDot.style.left = `${50 + Math.max(-1, Math.min(1, (flip ? -dev : dev) * 2.5)) * 45}%`;
    if (armed && sig > HI && now - lastStroke > REFRACTORY_MS) {
      armed = false;
      lastStroke = now;
      stroke(now);
    } else if (!armed && sig < LO) armed = true;
  }

  // Desktops (and some phones) have the API but never send anything: fall back to buttons.
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
      setInput("buttons", false, "No motion sensor found · using buttons");
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
        setInput("buttons", false, "Motion wasn't allowed · using buttons (reload the page to ask again)");
        return;
      }
    } catch {
      setInput("buttons", false, "Couldn't turn on motion · using buttons");
      return;
    }
    el.enable.hidden = true;
    listen();
    armFallback(2500);
  }

  function startMotion() {
    if (!hasMotionApi) return setInput("buttons", false, "This phone has no motion sensor · using buttons");
    if (!window.isSecureContext) return setInput("buttons", false, "Motion needs the https link · using buttons");
    listen(); // Android sends right away; an iPhone needs "Enable motion" first (see armFallback)
  }

  // ── buttons ──
  function paddle(btn, side) {
    let ptr = null;
    btn.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      ptr = ev.pointerId;
      try {
        btn.setPointerCapture(ev.pointerId);
      } catch {}
      btn.classList.add("down");
      if (side === "l") b = 1;
      else c = 1;
      send();
      if (side === "l") leftN++;
      else rightN++;
      pulse(side);
      renderHint();
    });
    const end = (ev) => {
      if (ev.pointerId !== ptr) return;
      ptr = null;
      btn.classList.remove("down");
      if (side === "l") b = 0;
      else c = 0;
      send();
    };
    btn.addEventListener("pointerup", end);
    btn.addEventListener("pointercancel", end);
    btn.addEventListener("lostpointercapture", end);
  }
  paddle(el.left, "l");
  paddle(el.right, "r");

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
  el.swap.addEventListener("click", () => {
    flip = !flip;
    calib = "done";
    try {
      localStorage.setItem(FLIP_KEY, flip ? "1" : "0");
    } catch {}
    renderHint();
  });

  function release() {
    clearTimeout(timerL);
    clearTimeout(timerR);
    el.left.classList.remove("down");
    el.right.classList.remove("down");
    if (b || c) {
      b = c = 0;
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
