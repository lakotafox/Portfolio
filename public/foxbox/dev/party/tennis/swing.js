// swing.js: FOX TENNIS's racket-swing detector (pure: no DOM; tennis-pad.js feeds it devicemotion readings,
// tests feed it synthetic ones). Built on TEE TIME's golf detector and USE CURSOR's yaw (see CONTRACT.md):
//   - gravity is normalised to the W3C sign: g = accelerationIncludingGravity * (iOS ? -1 : 1)
//   - rotationRate alpha / beta / gamma = deg/s about the phone's x / y / z (every browser today)
//   - yaw = rotation about gravity (grip-proof): + = counter-clockwise seen from above = a right-hander's forehand
//   - a swing opens above OPEN_DPS and is measured until the phone settles (or slows to a fraction of its peak),
//     so the backswing + the stroke don't double count; a peak with < MIN_LIN m/s2 of arm shake = a wrist flick
//   - the swing's moment = the time of its PEAK rotation (the racket meets the ball at full speed). The caller
//     converts it to the TV's clock with the ping/pong offset; the TV judges the hit against it.
// ── TUNING (real-phone tuning lives here; a dev phone can try values with ?swing.OPEN_DPS=350&swing.MIN_LIN=6 ...,
// see tuneFromUrl; window.__tennisPad.tune shows the live values) ──
export const SWING = {
  OPEN_DPS: 400, // deg/s of rotation that starts a swing (lower = gentler swings count; too low = fidgets count)
  SETTLE_DPS: 120, // a swing ends when rotation drops below max(SETTLE_DPS, SETTLE_FRAC x its peak) ...
  SETTLE_FRAC: 0.35,
  SETTLE_MS: 70, // ... for this long
  MAX_MS: 800, // or after this long, whatever happens
  MIN_LIN: 8, // m/s2 of arm movement a swing needs (less = a wrist flick, ignored)
  STILL_DPS: 90, // READY = rotation below this ...
  STILL_MS: 400, // ... for this long
  POWER_DPS: [400, 1800], // peak rotation that maps to power 0 .. 1 (60 % of power)
  POWER_LIN: [8, 38], // peak arm movement that maps to power 0 .. 1 (40 % of power)
  STROKE_YAW: 60, // deg/s of mean yaw needed to call it a forehand / backhand (less = unknown, the TV doesn't mind)
};
const DEFAULT_SWING = JSON.parse(JSON.stringify(SWING));
/** Dev / real-phone tuning: ?swing.OPEN_DPS=350 (numbers; POWER_DPS=300,1600 for the pairs). Returns the changed keys. */
export function tuneFromUrl(search) {
  const changed = {};
  let q;
  try { q = new URLSearchParams(search ?? (globalThis.location ? location.search : "")); } catch { return changed; }
  for (const [k, v] of q) {
    if (!k.startsWith("swing.")) continue;
    const key = k.slice(6);
    if (!(key in SWING)) continue;
    const nums = v.split(",").map(Number);
    if (!nums.every(Number.isFinite)) continue;
    SWING[key] = Array.isArray(DEFAULT_SWING[key]) ? [nums[0], nums[1] ?? DEFAULT_SWING[key][1]] : nums[0];
    changed[key] = SWING[key];
  }
  return changed;
}
export function resetSwing() { Object.assign(SWING, JSON.parse(JSON.stringify(DEFAULT_SWING))); }
const fin = (v) => typeof v === "number" && Number.isFinite(v);
const n0 = (v) => (fin(v) ? v : 0);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Power 0..1 from the peak rotation + the peak arm shake (src/rules.js swingPower = the same with the default numbers). */
export function powerOf(peakDps, peakLin) {
  const [r0, r1] = SWING.POWER_DPS, [l0, l1] = SWING.POWER_LIN;
  const rot = clamp((n0(peakDps) - r0) / (r1 - r0), 0, 1);
  const lin = peakLin == null ? rot : clamp((n0(peakLin) - l0) / (l1 - l0), 0, 1);
  return Math.round((0.6 * rot + 0.4 * lin) * 100) / 100;
}

/**
 * createSwingDetector({ ios, hand, onSwing(sw), onStill() })
 *   feed({ t, gi:{x,y,z}, rr:{alpha,beta,gamma}, acc:{x,y,z} | null })   t = ms (event timeStamp)
 * sw = { t (peak time, phone ms), power, peakDps, peakLin, yaw (mean deg/s), stroke "forehand"|"backhand"|null }
 */
export function createSwingDetector({ ios = false, hand = "right", onSwing = () => {}, onStill = () => {} } = {}) {
  const sign = ios ? -1 : 1;
  let up = null, sw = null, stillSince = 0, lastT = 0;
  const st = { hand, readings: 0 };
  function feed({ t, gi = {}, rr = {}, acc = null }) {
    st.readings++;
    const dt = lastT ? clamp((t - lastT) / 1000, 0.001, 0.05) : 1 / 60;
    lastT = t;
    // gravity (up) in the phone's frame: a low-pass of the W3C-signed reading (minus the linear part if known)
    let gx = n0(gi.x), gy = n0(gi.y), gz = n0(gi.z);
    const accKnown = !!acc && [acc.x, acc.y, acc.z].some(fin);
    if (accKnown) { gx -= n0(acc.x); gy -= n0(acc.y); gz -= n0(acc.z); }
    const gn = Math.hypot(gx, gy, gz);
    if (gn > 1) {
      const u = { x: (sign * gx) / gn, y: (sign * gy) / gn, z: (sign * gz) / gn };
      if (!up || accKnown) up = u;
      else {
        const k = 1 - Math.exp(-dt / 0.15);
        const ux = up.x + (u.x - up.x) * k, uy = up.y + (u.y - up.y) * k, uz = up.z + (u.z - up.z) * k, m = Math.hypot(ux, uy, uz) || 1;
        up = { x: ux / m, y: uy / m, z: uz / m };
      }
    }
    const wx = n0(rr.alpha), wy = n0(rr.beta), wz = n0(rr.gamma);
    const rot = Math.hypot(wx, wy, wz);
    const yaw = up ? wx * up.x + wy * up.y + wz * up.z : wz;
    const linKnown = accKnown || [gi.x, gi.y, gi.z].some(fin);
    const lin = accKnown ? Math.hypot(n0(acc.x), n0(acc.y), n0(acc.z)) : Math.abs(Math.hypot(n0(gi.x), n0(gi.y), n0(gi.z)) - 9.81);
    if (sw) {
      if (rot > sw.peak) { sw.peak = rot; sw.peakT = t; }
      sw.lin = Math.max(sw.lin, lin);
      if (rot > SWING.OPEN_DPS * 0.5) { sw.yaw += yaw * rot; sw.w += rot; }
      const quiet = rot < Math.max(SWING.SETTLE_DPS, sw.peak * SWING.SETTLE_FRAC);
      if (quiet) sw.quietSince ||= t;
      else sw.quietSince = 0;
      if ((sw.quietSince && t - sw.quietSince >= SWING.SETTLE_MS) || t - sw.t0 >= SWING.MAX_MS) finish(linKnown);
      return;
    }
    if (rot > SWING.OPEN_DPS) {
      sw = { t0: t, peak: rot, peakT: t, lin, yaw: yaw * rot, w: rot, quietSince: 0 };
      stillSince = 0;
      return;
    }
    if (rot < SWING.STILL_DPS) {
      stillSince ||= t;
      if (t - stillSince >= SWING.STILL_MS) { stillSince = t + 1e9; onStill(); }
    } else stillSince = 0;
  }
  function finish(linKnown) {
    const s = sw;
    sw = null;
    if (linKnown && s.lin < SWING.MIN_LIN) return; // a wrist flick
    const yaw = s.w ? s.yaw / s.w : 0;
    let stroke = null;
    if (Math.abs(yaw) >= SWING.STROKE_YAW) stroke = (st.hand === "left" ? yaw < 0 : yaw > 0) ? "forehand" : "backhand";
    onSwing({ t: s.peakT, power: powerOf(s.peak, linKnown ? s.lin : null), peakDps: Math.round(s.peak), peakLin: Math.round(s.lin), yaw: Math.round(yaw), stroke });
  }
  return {
    feed,
    setHand(h) { st.hand = h === "left" ? "left" : "right"; },
    resetStill() { stillSince = 0; },
    get busy() { return !!sw; },
    get up() { return up && { ...up }; },
    get readings() { return st.readings; },
  };
}

/** Clock sync: keep the ping/pong sample with the smallest round trip. offset = tvTime - phoneTime (ms). */
export function createClockSync() {
  const samples = [];
  return {
    pong(c, s, now) {
      const rtt = now - c;
      if (!(rtt >= 0) || rtt > 3000) return;
      samples.push({ rtt, off: s + rtt / 2 - now });
      if (samples.length > 10) samples.shift();
    },
    get offset() {
      if (!samples.length) return null;
      return samples.reduce((a, b) => (b.rtt < a.rtt ? b : a)).off;
    },
    get rtt() {
      return samples.length ? Math.min(...samples.map((x) => x.rtt)) : null;
    },
    get count() { return samples.length; },
  };
}
