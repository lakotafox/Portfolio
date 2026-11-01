/** Row's CAPTAIN controller: motion-only paddling, local practice and host-confirmed readiness. */
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
  let sig = 0, peak = 0, lastStroke = -1e9, lastMotionAt = -Infinity, timer = null, sensorTimer = null, side = "l";
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
      : state() === "playing" ? "Paddle! A steady beat is fastest"
      : setup?.ready ? `Ready — ${setup.readyCount || 0}/${setup.totalCount || 0} players ready`
      : count ? "Nice! Tap Ready! when it feels right" : "Paddle to test! Swing your phone like a paddle";
  }
  function pulse() {
    side = side === "l" ? "r" : "l";
    el.boat.classList.remove("pull", "l", "r");
    el.countWrap.classList.remove("hit");
    void el.boat.offsetWidth;
    el.boat.classList.add("pull", side);
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
  };
}
