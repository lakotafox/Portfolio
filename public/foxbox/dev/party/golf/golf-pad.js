/**
 * golf-pad.js — TEE TIME's phone controller (synced to the package as dev/party/golf/golf-pad.js).
 *
 * pad.js imports it the first time golf is the hub's game and mounts it in #golf:
 *   const pad = createGolfPad(document.getElementById("golf"), { send(m), me() });
 *   pad.show(on, status)   // on = countdown / playing (pad.js hides its own status + buttons then)
 *   pad.onMessage(m)       // every {t:"game", m} from the TV game (m.type "view", see CONTRACT.md)
 *   pad.release()          // window blur: let go of a held aim arrow
 *   pad.setup(info | null) // golf's setup (before START): info = { el, lobby, picker }: the picker chooses the map
 *                          // (4 map cards + RANDOM) -> {type:"map", id}; everyone sees the choice
 *
 * On the aim screen the golfer up has a BIRD'S EYE button: {type:"birdseye", on} toggles the TV's overhead view
 * (the swing always cuts back behind the golfer). Both go through the {t:"game"} path, so the web build works too.
 *
 * The turn clock (Lakota, Nov 7): 90 s per turn on the TV, then the turn is skipped; no banner, no idle logic. In the
 * last 30 s the golfer up gets a tiny matching timer (view.timer {left, total}): "0:25" in the header (the plain
 * screens) or the pad LCD (skins). The page still tells the TV when it is hidden (locked / another app):
 * {type:"hidden", on} (and hello carries `hidden`), as info only.
 *
 * The turn, Lakota's design:
 *   1. AIM: the gyro is OFF; the arrow buttons turn the aim line on the TV (tap = 1 degree, hold = sweep).
 *   2. SWING (a real click: it asks iOS for motion access): the gyro turns ON and the phone teaches the
 *      address pose: hold the phone face down / pointing at the floor like a club. Held still = READY.
 *   3. The swing: the first big rotation spike after READY. Its peak picks a power tier (weak / good /
 *      great / huge); the TV adds the heavy RNG. The phone plays its own whoosh (never the TV).
 * Everyone else's phone shows who is up and their step (AIM / READY / SWING), the shot to beat in this mini-game
 * (view.best, nothing before anyone has scored), the scores, and "you're next" with the wind. No small golfer figure.
 *
 * The intro cards (Lakota, Nov 9): when golf is picked in the lobby every golfer's phone opens on three cards laid in
 * the pad's LCD: MAKE ROOM, HOLD ON TIGHT, HOW TO SWING (OK, OK, GOT IT; nothing moves on by itself). The TV says who
 * still has to see them (view.cards) and waits for that golfer meanwhile, 45 s at most: its camera stays up high
 * before their turn (only for a phone that said it is showing the cards: {type:"cards", on:true}), or it holds their
 * turn clock (view.hold). GOT IT sends {type:"cards"}. The hub drops phone messages during its READY... countdown, so
 * the phone says both again from the views (at most once a second) until the TV's view agrees (view.cardsSeen /
 * view.cards). Screen "cards": nothing else on the pad can be pressed.
 * The pictures (the cards, the swing screen) are the "LCD SIGNS" sign people: cream, plain circle hands, the phone
 * always gold; drawn as vectors and snapped to clean art pixels (PICS below).
 *
 * Upright only (Lakota, Nov 1: you hold the phone like a club to swing, so there's no sideways layout). A phone held
 * sideways on the aim screen sees TURN YOUR PHONE UPRIGHT instead of the aim controls (screen "upright"). That is
 * decided by the screen, not the orientation alone: once SWING is tapped (armed: the address pose, the swing) the
 * phone turns every which way and the overlay never comes back until the turn is over or BACK TO AIM.
 * Sideways = GRAVITY across the phone's short edge (devicemotion), never the window's shape (Lakota, Nov 7: TURN YOUR
 * PHONE UPRIGHT on an upright phone). A window can stay landscape on an upright phone (iOS keeps the last rotation while
 * the phone lies flat or after the swing's tumble; Android can keep a page's landscape lock), and iOS gives no readings
 * before motion access: no fresh readings = upright. A landscape window on the aim screen gets the upright aim layout
 * turned with CSS to face a phone held upright (#golf.gp-turned), so the aim controls are never blocked by a guess.
 *
 * Bad Wi-Fi (Lakota, Nov 7: the TV waited for a golfer who was on their phone): pad.js's send is fire-and-forget, so a
 * message sent while the link is dying is gone. The TV's views come every second, and the phone mends what got lost
 * from them: SWING again (arm), READY again, and the SWING ITSELF again (the phone sat on NICE SWING! while the TV
 * waited in "armed" and then skipped the golfer AWAY). Each resend is idempotent on the TV (it only acts in the right
 * phase, for the golfer up). The same for "I'm back" (Lakota, Nov 7: Don's turn opened as if he were away): a phone
 * unlocked while its link was down lost its {type:"hidden", on:false}, so the TV still had it as hidden (away). When a
 * view says the TV has this page as hidden (view.you.hidden) while it
 * is showing, the phone says {type:"hidden", on:false} again (at most once a second, so within ~1 s of the next view).
 *
 * Test hook: window.__golfPad (read-only, plus setClock for stepped capture), DOM data-test ids: see CONTRACT.md "Test hooks".
 */

// ── Swing detector tuning (CONTRACT.md "Swing detector") ─────────────────────────────
const POSE_G = 4.5; // m/s2 of gravity along -y (pointing down) or -z (face down), W3C signs
const STILL_DPS = 90; // rotation below this = held still
const STILL_MS = 400; // still in the address pose this long = READY
const GRACE_MS = 4000; // motion flowing this long without an address pose: any still pose counts
const UNREADY_MS = 700; // out of the pose (and not swinging) this long after READY = not ready any more
const SWING_DPS = 400; // a rotation spike above this starts the swing
const SETTLE_DPS = 120; // ... which ends once the rotation stays under this
const SETTLE_MS = 180;
const SWING_MAX_MS = 1500;
const SWING_LIN = 8; // m/s2: a real arm swing shakes the phone hard; a wrist flick barely does
const DPS_LO = 400, DPS_SPAN = 1400; // strength = (peak - 400) / 1400 -> weak < 680 < good < 1100 < great < 1520 < huge
const NO_DATA_MS = 1800; // no motion readings this long after SWING = tell the player

const tierOf = (s) => (s < 0.2 ? "weak" : s < 0.5 ? "good" : s < 0.8 ? "great" : "huge");
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const fin = (v) => typeof v === "number" && Number.isFinite(v);
const n0 = (v) => (fin(v) ? v : 0);
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const iosSign = isIOS ? -1 : 1; // iOS reports gravity the other way round from the W3C / Android signs
const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
const TIER_NAME = { weak: "SOFT", good: "GOOD", great: "GREAT", huge: "HUGE" };
/** A phone-sized landscape WINDOW (the same test as the CSS below; a desktop window or a tablet never is). Not the
 *  way the phone is held: that is gravity's (heldSideways in createGolfPad). */
const SIDEWAYS_MQ = "(orientation: landscape) and (max-height: 520px)";
const landWindow = () => {
  try { if (window.matchMedia) return window.matchMedia(SIDEWAYS_MQ).matches; } catch {}
  return innerWidth > innerHeight && innerHeight <= 520;
};
/** The window's rotation from the phone's natural (portrait) way up, degrees (90 / 270 when landscape). */
const screenAngle = () => {
  const o = globalThis.screen && globalThis.screen.orientation;
  if (o && typeof o.angle === "number") return ((o.angle % 360) + 360) % 360;
  return typeof window.orientation === "number" ? ((window.orientation % 360) + 360) % 360 : 0;
};

// ── Pixel sprites (inline SVG from character maps, like pixel-art.js) ────────────────
const INK = "#0a1428";
const MAPS = {
  arrowL: ["...OO", "..OWO", ".OWWO", "OWWWO", ".OWWO", "..OWO", "...OO"],
  eye: ["...OOOOO...", ".OOWWWWWOO.", "OWWWOOOWWWO", "OWWOCCCOWWO", "OWWWOOOWWWO", ".OOWWWWWOO.", "...OOOOO..."],
  arrowR: ["OO...", "OWO..", "OWWO.", "OWWWO", "OWWO.", "OWO..", "OO..."],
  wind: ["...OO...", "..OWWO..", ".OWWWWO.", "OWWWWWWO", "OOOWWOOO", "..OWWO..", "..OWWO..", "..OOOO.."], // points up (0 deg)
  windD: ["..OOOOOO", "..OWWWWO", "...OWWWO", "..OWWWWO", ".OWWWOWO", "OWWWO.OO", "OWWO....", ".OO....."], // points up-right (45 deg)
  flag: ["OOOOO.", "ORRRRO", "ORRRRRO", "ORRRRO", "OO.OO.", "OO....", "OO....", "OO...."],
  // TURN YOUR PHONE UPRIGHT: a phone with a cross (shown turned sideways) and one with a tick (upright)
  phoneNo: [".OOOOOOO.", "OKKKKKKKO", "OKKOOOKKO", "OKKKKKKKO", "OKCCCCCKO", "OKWCCCWKO", "OKCWCWCKO", "OKCCWCCKO", "OKCWCWCKO",
    "OKWCCCWKO", "OKCCCCCKO", "OKCCCCCKO", "OKKKKKKKO", "OKKKKKKKO", ".OOOOOOO."],
  phoneOk: [".OOOOOOO.", "OKKKKKKKO", "OKKOOOKKO", "OKKKKKKKO", "OKCCCCCKO", "OKCCCCCKO", "OKCCCCWKO", "OKCCCWWKO", "OKWCWWCKO",
    "OKWWWCCKO", "OKCWCCCKO", "OKCCCCCKO", "OKKKKKKKO", "OKKKKKKKO", ".OOOOOOO."],
};
const BASE = { O: INK, E: INK, S: "#f2c79b", P: "#e8e8f0", W: "#ffffff", K: "#26304a", G: "#35d07f", R: "#ff5a3c", Y: "#ffd23f" };
function mix(hex, amt) {
  const n = parseInt(String(hex).replace("#", ""), 16);
  if (!Number.isFinite(n)) return hex;
  const t = amt > 0 ? 255 : 0, k = Math.abs(amt);
  const ch = (s) => Math.round(((n >> s) & 255) * (1 - k) + t * k);
  return "#" + [16, 8, 0].map((s) => ch(s).toString(16).padStart(2, "0")).join("");
}
function sprite(name, scale = 3, color = "#ff5a3c", cls = "") {
  const rows = MAPS[name];
  if (!rows) return "";
  const pal = { ...BASE, C: color, D: mix(color, -0.3) };
  const w = Math.max(...rows.map((r) => r.length)), h = rows.length, runs = {};
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; ) {
      const c = row[x];
      if (c === "." || !pal[c]) { x++; continue; }
      let k = 1;
      while (x + k < row.length && row[x + k] === c) k++;
      (runs[pal[c]] ||= []).push(`M${x} ${y}h${k}v1h-${k}z`);
      x += k;
    }
  });
  const paths = Object.entries(runs).map(([f, d]) => `<path fill="${f}" d="${d.join("")}"></path>`).join("");
  return `<svg class="gp-px ${cls}" viewBox="0 0 ${w} ${h}" width="${w * scale}" height="${h * scale}" shape-rendering="crispEdges" aria-hidden="true">${paths}</svg>`;
}
/** The wind as an 8-way pixel arrow: 0 deg = blowing straight down the range (up on the phone). */
function windArrow(dir, scale = 3) {
  const k = ((Math.round(((dir % 360) + 360) % 360 / 45) % 8) + 8) % 8;
  const diag = k % 2 === 1, turn = Math.floor(k / 2) * 90;
  return `<span class="gp-wind-ar" style="transform:rotate(${turn}deg)">${sprite(diag ? "windD" : "wind", scale, "#fff")}</span>`;
}

// ── The pictures: "LCD SIGNS" (Lakota's pick, Nov 9) ─────────────────────────────────────────────────────────────
// Cream sign people with plain circle hands on the dark LCD; the phone is always gold. No hand close-ups: everything
// is taught with the whole figure. Drawn with ordinary canvas calls in ART-PIXEL units: makePic supersamples 4x and
// gives every art pixel the colour most of its samples snapped to, so there are no blended edge colours and nothing
// shimmers into a third colour when shapes overlap. Lines thinner than 2 art px can vanish: keep them 2+ and on whole
// pixels. Every scene is { W, H, loop (ms), draw(ctx, t, extra) }; draw is a pure function of t = ms into the loop, so
// a capture script can step the clock (window.__golfPad.setClock).
// Swing angle theta (radians): 0 = arms straight down, + = toward the viewer's right, - = left (front view).
const PICS = (() => {
  const rgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  function makePic(W, H, colours, SS = 4) {
    const hi = document.createElement("canvas");
    hi.width = W * SS; hi.height = H * SS;
    const hctx = hi.getContext("2d", { willReadFrequently: true });
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    canvas.className = "pc-cv";
    const octx = canvas.getContext("2d");
    const pal = [...new Set(colours.map((c) => c.toLowerCase()))].map(rgb);
    const packed = pal.map(([r, g, b]) => ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0);
    const cache = new Map();
    const near = (r, g, b) => {
      const k = (r << 16) | (g << 8) | b;
      let v = cache.get(k);
      if (v === undefined) {
        let bd = Infinity;
        for (let i = 0; i < pal.length; i++) {
          const p = pal[i], d = (p[0] - r) ** 2 + (p[1] - g) ** 2 + (p[2] - b) ** 2;
          if (d < bd) { bd = d; v = i; }
        }
        cache.set(k, v);
      }
      return v;
    };
    const votes = new Uint16Array(pal.length + 1);
    function render(fn) {
      hctx.setTransform(1, 0, 0, 1, 0, 0);
      hctx.clearRect(0, 0, hi.width, hi.height);
      hctx.setTransform(SS, 0, 0, SS, 0, 0);
      hctx.save(); fn(hctx); hctx.restore();
      const src = hctx.getImageData(0, 0, hi.width, hi.height).data;
      const img = octx.createImageData(W, H), dst = new Uint32Array(img.data.buffer), HW = W * SS;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        votes.fill(0);
        for (let sy = 0; sy < SS; sy++) {
          let i = ((y * SS + sy) * HW + x * SS) * 4;
          for (let sx = 0; sx < SS; sx++, i += 4) votes[src[i + 3] < 128 ? 0 : 1 + near(src[i], src[i + 1], src[i + 2])]++;
        }
        let bi = 0, bv = votes[0];
        for (let k = 1; k < votes.length; k++) if (votes[k] > bv) { bv = votes[k]; bi = k; }
        dst[y * W + x] = bi ? packed[bi - 1] : 0;
      }
      octx.putImageData(img, 0, 0);
    }
    return { canvas, render, W, H };
  }
  /** The small shape kit. Outlines sit OUTSIDE the shape (stroke first, fill on top), sw = their width in art px. */
  function kit(c) {
    const path = (pts, close) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (close) c.closePath(); };
    const fs = (fill, stroke, sw = 2) => {
      if (stroke) { c.lineJoin = "round"; c.lineWidth = sw * 2; c.strokeStyle = stroke; c.stroke(); }
      if (fill) { c.fillStyle = fill; c.fill(); }
    };
    const k = {
      line(pts, w, col) { c.lineCap = "round"; c.lineJoin = "round"; c.lineWidth = w; c.strokeStyle = col; path(pts); c.stroke(); },
      oline(pts, w, col, oc, ow = 2) { k.line(pts, w + ow * 2, oc); k.line(pts, w, col); },
      circ(x, y, r, fill, stroke, sw) { c.beginPath(); c.arc(x, y, r, 0, 7); fs(fill, stroke, sw); },
      rr(x, y, w, h, r, fill, stroke, sw) { c.beginPath(); c.roundRect(x, y, w, h, r); fs(fill, stroke, sw); },
      poly(pts, fill, stroke, sw) { path(pts, true); fs(fill, stroke, sw); },
      arc(cx, cy, r, a0, a1, w, col, dash) {
        c.beginPath(); c.arc(cx, cy, r, a0, a1);
        c.lineCap = "butt"; c.lineWidth = w; c.strokeStyle = col; c.setLineDash(dash || []); c.stroke(); c.setLineDash([]);
      },
    };
    return k;
  }
  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const ease = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
  /** 0 before a, 1 after b, eased in between */
  const seg = (t, a, b) => ease((t - a) / (b - a));
  const rad = (d) => (d * Math.PI) / 180;

  const A = { bg: "#101125", ink: "#fff9f1", gold: "#ffd23f", teal: "#2ed3c6", red: "#ff5a3c", dim: "#2c2f55", soft: "#b7b3b4" };
  /** The phone's back, centred on (x, y), len long, wid wide. ang 0 = upright (top end up), PI = top end down. The
   *  camera island marks the TOP end. */
  function phone(c, x, y, len, wid, ang) {
    const K = kit(c), r = Math.min(4, wid * 0.22);
    c.save(); c.translate(x, y); c.rotate(ang);
    K.rr(-wid / 2, -len / 2, wid, len, r, A.gold, A.bg, 1.5);
    const cs = Math.max(3, wid * 0.42), m = wid * 0.12;
    K.rr(-wid / 2 + m, -len / 2 + m, cs, cs, cs * 0.3, A.bg);
    if (cs >= 6) K.circ(-wid / 2 + m + cs / 2, -len / 2 + m + cs / 2, cs * 0.24, A.ink);
    c.restore();
  }
  /** The sign person. o.theta = swing angle holding the phone (null/undefined = arms at the sides), o.lean = lean
   *  about the feet (radians, + = to the right).
   *  CIRCLE HANDS: every arm ends in a plain filled circle in the body's cream, a bit wider than the arm; no fingers,
   *  no outline. Holding the phone = the two circles sit on the gold phone, one above the other.
   *  For the gag pictures: o.empty = the same arms with no phone in them, o.oops = both hands on the head,
   *  o.hop = art px off the floor. */
  function person(c, cx, footY, h, o = {}) {
    const K = kit(c), col = A.ink, bg = A.bg;
    c.save(); c.translate(cx, footY - (o.hop || 0)); if (o.lean) c.rotate(o.lean);
    const r = h * 0.115, shY = -h * 0.7, hipY = -h * 0.4, lw = h * 0.095, aw = h * 0.075, hr = h * 0.056;
    K.line([[-h * 0.05, hipY], [-h * 0.13, -lw / 2]], lw, col);
    K.line([[h * 0.05, hipY], [h * 0.13, -lw / 2]], lw, col);
    K.line([[0, shY + h * 0.07], [0, hipY]], h * 0.24, col);
    if (o.oops) {
      for (const m of [-1, 1]) K.oline([[m * h * 0.14, shY + h * 0.05], [m * h * 0.3, shY - h * 0.05], [m * (r + hr * 0.4), -h + r * 0.8]], aw, col, bg, 1.5);
    } else if (o.theta == null) {
      for (const m of [-1, 1]) {
        const hx = m * h * 0.21, hy = hipY + h * 0.02;
        K.oline([[m * h * 0.15, shY + h * 0.05], [hx, hy]], aw, col, bg, 1.5);
        K.circ(hx, hy, hr, col);
      }
    } else {
      const th = o.theta, dx = Math.sin(th), dy = Math.cos(th), cy = -0.64 * h, L = h * 0.36, pl = h * 0.34, pw = h * 0.14;
      const at = (d) => [dx * d, cy + dy * d], h1 = at(L), h2 = at(L + hr * 2.2), pc = at(L - hr * 1.1 + pl / 2);
      K.oline([[-h * 0.14, shY + h * 0.05], h1], aw, col, bg, 1.5);
      K.oline([[h * 0.14, shY + h * 0.05], h2], aw, col, bg, 1.5);
      if (!o.empty) phone(c, pc[0], pc[1], pl, pw, Math.PI - th); // top end away from the hands = face down at the bottom of the swing
      K.circ(h1[0], h1[1], hr, col);
      K.circ(h2[0], h2[1], hr, col);
    }
    K.circ(0, -h + r, r, col, bg, 1.5);
    if (o.oops) for (const m of [-1, 1]) K.circ(m * (r + hr * 0.4), -h + r * 0.8, hr, col, bg, 1.5);
    c.restore();
  }
  function lamp(c, x, footY, h) {
    const K = kit(c), top = footY - h;
    K.line([[x - 6, footY - 1], [x + 6, footY - 1]], 3, A.ink);
    K.line([[x, footY - 1], [x, top + 14]], 2.5, A.ink);
    K.poly([[x - 5, top], [x + 5, top], [x + 9, top + 15], [x - 9, top + 15]], A.ink);
  }
  function tick(c, x, y, s = 5) { kit(c).line([[x - s, y], [x - s * 0.3, y + s * 0.7], [x + s, y - s * 0.8]], 3, A.teal); }
  function warn(c, x, y) {
    const K = kit(c);
    K.line([[x, y - 7], [x, y]], 3.5, A.red);
    K.circ(x, y + 5.5, 2, A.red);
  }
  const W = 152, H = 110;
  const floor = (c, floorY) => kit(c).line([[4, floorY + 2], [W - 4, floorY + 2]], 2, A.dim);
  /** The whole golfer, front view: the same big figure on every teaching picture (no hand close-ups, no arrows, no
   *  trails). thD = swing angle in degrees, o.x = where they stand, o.ready = the small READY! with its tick. */
  function golfer(c, thD, o = {}) {
    const fy = 102, x = o.x == null ? 76 : o.x, h = 76;
    person(c, x, fy, h, { theta: rad(thD), lean: rad(thD) * 0.05 });
    if (o.ready) {
      c.font = '8px "FoxBox Pixel"'; c.textBaseline = "top"; c.textAlign = "center";
      c.fillStyle = A.gold; c.fillText("READY!", x - 6, 5);
      tick(c, x + 6 + c.measureText("READY!").width / 2, 9, 4);
      c.textAlign = "left";
    }
  }
  /** one calm golf swing in degrees: still until t0, back (750 ms), through (450 ms), hold the finish, come back (800 ms) */
  function swingDeg(t, t0, hold) {
    const a = t0 + 750, b = a + 450, d = b + hold;
    return t < t0 ? 0 : t < a ? -112 * ease((t - t0) / 750) : t < b ? -112 + 230 * ease((t - a) / 450) : t < d ? 118 : 118 * (1 - ease((t - d) / 800));
  }
  /** 3 HOW TO SWING: just the golfer doing it. Phone face down in both hands in front -> hold still (READY!) -> swing
   *  back and through -> back to the start. */
  const howto = { W, H, loop: 4200, draw(c, t) { floor(c, 102); golfer(c, swingDeg(t, 1500, 500), { ready: t >= 900 && t < 3200 }); } };
  /** the swing screen, after tapping SWING: the golfer stands over the phone, face down in both hands, almost still */
  const swing = { W, H, loop: 3000, draw(c, t) { floor(c, 102); golfer(c, 3 * Math.sin((t / 3000) * 2 * Math.PI)); } };
  /** READY! SWING!: the same golfer, set, with READY!. Still. */
  const ready = { W, H, loop: 3000, still: true, draw(c) { floor(c, 102); golfer(c, 0, { ready: true }); } };
  // ── THE GAG (Lakota, Nov 9: "make it funny they break the lamp and throw the phone into the tv") ──
  // One room, drawn once: a lit lamp at the left (inside the backswing), the golfer, a TV on the wall at the right. The
  // backswing takes the lamp's shade off (CRASH!); on the way through the phone leaves the hands and sticks in the TV
  // (CRACK!). Two pictures are cut from it (Lakota picked B, Nov 9): lampGag = the lamp (card 1), tvGag = the phone
  // into the TV (card 2, the lamp already broken). Same size as every other card picture (152 x 110), same seven colours.
  const GX = 66, GH = 70, FY = 100, LX = 20, LH = 64, FLY_MS = 200, GRAV = 0.00045; // (art px, ms, px/ms2)
  const TVB = { x: 110, y: 26, w: 38, h: 26, ix: 11, iy: 17 }; // the TV; (ix, iy) = where the phone goes in, from its corner
  const LATE = 1900; // ms after a hit: the last thing gives up (the bulb drops off, the TV sags)
  /** a comic-book bang: red spikes, gold middle */
  function burst(c, x, y, r, rot = 0) {
    const K = kit(c), n = 9;
    const star = (R, col) => { const pts = []; for (let i = 0; i < n * 2; i++) { const a = rot + (i * Math.PI) / n, q = i % 2 ? R * 0.45 : R; pts.push([x + Math.cos(a) * q, y + Math.sin(a) * q]); } K.poly(pts, col); };
    star(r, A.red); star(r * 0.52, A.gold);
  }
  function word(c, s, x, y, col) {
    c.font = '8px "FoxBox Pixel"'; c.textBaseline = "top"; c.textAlign = "center";
    c.fillStyle = col; c.fillText(s, x, y); c.textAlign = "left";
  }
  /** the picture jumps for a moment at each hit */
  function shake(c, t, hits) {
    for (const t0 of hits) {
      const d = t - t0;
      if (t0 != null && d >= 0 && d < 240) { const i = (d / 40) | 0; c.translate([2, -2, 1, -1, 1, 0][i], [-1, 1, -1, 1, 0, 0][i]); }
    }
  }
  // the shade's pieces: [where on the shade (dx, dy), speed (vx, vy), spin, size]
  const SHARDS = [[-6, 4, -0.018, -0.1, 0.012, 6], [5, 2, 0.016, -0.13, -0.015, 5], [-2, 9, -0.008, -0.06, 0.02, 4], [3, 10, 0.028, -0.085, -0.01, 6], [0, 5, 0.006, -0.15, 0.017, 5]];
  /** The lamp. d = ms since the phone hit it (< 0 = whole and lit). The shade bursts into pieces that fall to the
   *  floor and stay there, the pole wobbles, the bare bulb flickers and goes out, and a good while later drops off. */
  function gagLamp(c, x, fy, h, d, late = LATE) {
    const K = kit(c), top = fy - h;
    if (d < 0) {
      K.circ(x, top + 15, 3.2, A.gold);
      lamp(c, x, fy, h);
      return;
    }
    const wob = 0.3 * Math.exp(-d / 450) * Math.sin(d / 70), dl = d - late;
    K.line([[x - 6, fy - 1], [x + 6, fy - 1]], 3, A.ink);
    c.save(); c.translate(x, fy - 1); c.rotate(wob);
    K.line([[0, 0], [0, -(h - 15)]], 2.5, A.ink);
    if (dl < 0) K.circ(0, -(h - 13), 3.2, d < 700 && ((d / 70) | 0) % 2 === 0 ? A.gold : A.soft);
    c.restore();
    if (dl >= 0) { // the bulb lets go
      const y0 = top + 12, fall = Math.sqrt((2 * (fy - 3 - y0)) / GRAV), u = Math.min(1, dl / fall);
      K.circ(x + 7 * u, u < 1 ? y0 + 0.5 * GRAV * dl * dl : fy - 3, 3.2, A.soft);
    }
    for (const [dx, dy, vx, vy, spin, sz] of SHARDS) {
      const y0 = top + dy, land = (-vy + Math.sqrt(vy * vy + 2 * GRAV * (fy - 2 - y0))) / GRAV, q = Math.min(d, land);
      const px = x + dx + vx * q, py = d < land ? y0 + vy * q + 0.5 * GRAV * q * q : fy - 2;
      c.save(); c.translate(px, py); c.rotate(d < land ? spin * q : 0);
      K.poly([[-sz / 2, 1.5], [sz / 2, 1.5], [sz * 0.1, -sz * 0.55]], A.ink);
      c.restore();
    }
  }
  const CRACKS = [[[11, 17], [15, 13], [14, 9], [19, 3]], [[11, 17], [18, 16], [22, 19], [28, 15], [35, 17]], [[11, 17], [8, 12], [3, 10]], [[11, 17], [14, 21], [13, 23]]];
  const CRACK_LATE = [[14, 9], [22, 8], [27, 11], [35, 7]];
  /** The TV on the wall, showing golf. d = ms since the phone went in (< 0 = fine). The screen flickers and dies
   *  cracked, the phone stays stuck in it, the set swings and hangs crooked, and a good while later sags further. */
  function gagTv(c, d, late = LATE) {
    const K = kit(c), { x, y, w, h, ix, iy } = TVB;
    const hung = d < 0 ? 0 : 0.13 * (1 - Math.exp(-d / 160)) + 0.07 * Math.exp(-d / 380) * Math.sin(d / 55)
      + (d > late ? 0.2 * (1 - Math.exp(-(d - late) / 90)) + 0.06 * Math.exp(-(d - late) / 300) * Math.sin((d - late) / 50) : 0);
    c.save(); c.translate(x + w - 3, y + 2); c.rotate(-hung); c.translate(-(w - 3), -2); // it hangs from its top right corner
    K.rr(0, 0, w, h, 2, A.ink);
    const live = d < 0 || (d < 360 && ((d / 60) | 0) % 2 === 1);
    K.rr(3, 3, w - 6, h - 6, 1, live ? A.dim : A.bg);
    if (live) {
      c.fillStyle = A.teal; c.fillRect(3, h - 8, w - 6, 5);
      K.line([[25, 8], [25, h - 6]], 2, A.ink);
      K.poly([[26, 7], [32, 10], [26, 13]], A.red);
      K.circ(11, h - 8, 1.7, A.gold);
    }
    if (d >= 0) {
      c.save(); c.beginPath(); c.rect(3, 3, w - 6, h - 6); c.clip();
      for (const pts of CRACKS) K.line(pts, 2, A.ink);
      if (d > late) K.line(CRACK_LATE, 2, A.ink);
      c.restore();
      phone(c, ix - 0.7 * 9, iy + 0.7 * 9, GH * 0.34, GH * 0.14, STUCK); // stuck in the screen, top end in
    }
    c.restore();
  }
  const STUCK = Math.PI / 4; // the phone's angle in the TV: flying up and to the right
  /** the thrown phone on its way from the hands to the TV (u 0..1), spinning */
  function flyingPhone(c, thRel, u) {
    const R = GH * 0.4684, x0 = GX + Math.sin(thRel) * R, y0 = FY - 0.64 * GH + Math.cos(thRel) * R;
    const x1 = TVB.x + TVB.ix - 0.7 * 9, y1 = TVB.y + TVB.iy + 0.7 * 9, a0 = Math.PI - thRel, a1 = STUCK + 4 * Math.PI;
    phone(c, x0 + (x1 - x0) * u, y0 + (y1 - y0) * u - 5 * Math.sin(Math.PI * u), GH * 0.34, GH * 0.14, a0 + (a1 - a0) * u);
  }
  /** The room at time t. o.lamp = ms the lamp is hit (null = it is already broken), o.fly = ms the phone leaves the
   *  hands (null = it never does), o.tvLate = ms after the TV is hit that it sags, o.g = the golfer then:
   *  { th (deg), lean, hop, oops, bang }. */
  function gagRoom(c, t, o) {
    const tv = o.fly == null ? null : o.fly + FLY_MS, dLamp = o.lamp == null ? 1e6 : t - o.lamp, dTv = tv == null ? -1 : t - tv;
    const g = o.g, flown = o.fly != null && t >= o.fly, th = rad(g.th);
    c.save();
    shake(c, t, [o.lamp, tv]);
    floor(c, FY);
    gagLamp(c, LX, FY, LH, dLamp);
    gagTv(c, dTv, o.tvLate);
    person(c, GX, FY, GH, { theta: th, lean: g.lean || 0, hop: g.hop || 0, empty: flown, oops: g.oops });
    if (flown && dTv < 0) flyingPhone(c, rad(45), (t - o.fly) / FLY_MS);
    if (g.bang) warn(c, GX + Math.sin(g.lean || 0) * GH, FY - GH * Math.cos(g.lean || 0) - 12 - (g.hop || 0));
    if (dLamp >= 0 && dLamp < 200) burst(c, LX + 3, FY - LH + 8, 9 + dLamp / 40, dLamp / 300);
    if (dTv >= 0 && dTv < 200) burst(c, TVB.x + TVB.ix, TVB.y + TVB.iy, 9 + dTv / 40, dTv / 300);
    if (dLamp >= 0 && dLamp < 650) word(c, "CRASH!", 34, 12 - Math.min(6, dLamp / 40), A.red);
    if (dTv >= 0 && dTv < 650) word(c, "CRACK!", 112, 12 - Math.min(6, dTv / 40), A.red);
    c.restore();
  }
  const hopAt = (t, t0, px = 3, ms = 170) => (t >= t0 && t < t0 + ms ? px * Math.sin((Math.PI * (t - t0)) / ms) : 0);
  /** one full swing that starts at tb: back (650 ms), through (450 ms), hold the finish until td, arms down by td + 450 */
  const fullSwing = (t, tb, td) => (t < tb ? 0 : t < tb + 650 ? -112 * ease((t - tb) / 650) : t < tb + 1100 ? -112 + 230 * ease((t - tb - 650) / 450)
    : t < td ? 118 : 118 * (1 - ease((t - td) / 450)));
  /** 1 MAKE ROOM, THE LAMP: the backswing takes the lamp out; the golfer freezes at the top, slowly brings
   *  the phone down, looks; then the bulb drops off. The TV is fine (for now). */
  const lampGag = {
    W, H, loop: 4800,
    draw(c, t) {
      const tb = 600, hit = tb + 560, drop = hit + LATE + 440;
      const th = t < tb ? 0 : t < tb + 650 ? -112 * ease((t - tb) / 650) : t < 2200 ? -112 : -112 * (1 - ease((t - 2200) / 700));
      gagRoom(c, t, { lamp: hit, fly: null, g: {
        th, bang: (t >= hit + 150 && t < 2900) || (t >= drop && t < drop + 700), hop: hopAt(t, hit + 40, 4) + hopAt(t, drop, 3),
        lean: -0.13 * seg(t, 2900, 3200),
      } });
    },
  };
  /** 2 HOLD ON TIGHT, THE TV: the lamp is already in pieces; the swing lets the phone go and it sticks in the
   *  TV; a stare at the empty hands, hands on the head, the TV sags. */
  const tvGag = {
    W, H, loop: 5200,
    draw(c, t) {
      const tb = 500, fly = tb + 931, tvLate = 2400, sag = fly + FLY_MS + tvLate;
      gagRoom(c, t, { lamp: null, fly, tvLate, g: {
        th: fullSwing(t, tb, 2250), bang: t >= 2750 && t < 3200, oops: t >= 3200, hop: hopAt(t, 3200) + hopAt(t, sag + 60, 2),
        lean: 0.12 * seg(t, 3450, 3700),
      } });
    },
  };
  /** the drive to beat on a range strip: tee at the left, a mark every 50 yards, a flag in the leader's colour.
   *  (0 to 300 yd; a drive past 275 gets a 350 yd strip, so the flag never runs off the picture) */
  const bar = {
    W: 140, H: 24, loop: 1000, still: true,
    draw(c, t, o = {}) {
      const K = kit(c), x0 = 8, x1 = 132, y = 17, yds = Math.max(0, o.yards || 0), max = yds > 275 ? 350 : 300;
      const X = (yd) => Math.round(x0 + ((x1 - x0) * Math.min(yd, max)) / max);
      K.line([[x0, y], [x1, y]], 2, A.soft);
      for (let yd = 0; yd <= max; yd += 50) K.line([[X(yd), y], [X(yd), y + 4]], 2, A.soft);
      const fx = X(yds);
      K.line([[fx, y - 1], [fx, 3]], 2, A.ink);
      K.poly([[fx + 1, 2], [fx + 12, 6], [fx + 1, 10]], o.color || A.gold);
      K.circ(x0, y - 4, 2.6, A.ink);
    },
  };
  return { makePic, SCENES: { lampGag, tvGag, howto, swing, ready, bar }, PAL: Object.values(A) };
})();
/** The three intro cards (the words are Lakota's approved ones; "the TV" on card 1 is a thing to mind, not a place to look). */
const CARDS = [
  { pic: "lampGag", title: "MAKE ROOM", say: ["Nobody beside or behind you.", "Mind the lamp and the TV."], go: "OK" },
  { pic: "tvGag", title: "HOLD ON TIGHT", say: ["Both hands on your phone.", "Don't let go when you swing."], go: "OK" },
  { pic: "howto", title: "HOW TO SWING", say: ["Phone face down. Two hands.", "Hold still, then swing."], go: "GOT IT" },
];
const CARD_TAP_MS = 400; // a tap this soon after a card came up belongs to the card before (a double tap never skips one unseen)
const CARDS_RESEND_MS = 1000; // GOT IT again at most this often while the TV's views still ask for the cards
/** The wind as a small pixel arrow in the text colour, 8 ways: 0 deg = blowing straight down the range (up on the phone). */
const windSvg = (dir) => `<svg width="18" height="18" viewBox="0 0 9 9" shape-rendering="crispEdges" style="transform:rotate(${Math.round((((dir % 360) + 360) % 360) / 45) * 45}deg)" aria-hidden="true"><path fill="currentColor" d="M4 0h1v1h1v1h1v1h-2v6h-1v-6h-2v-1h1v-1h1z"/></svg>`;
/** The shot to beat in this mini-game as the waiting screens word it (view.best, null = nothing to show yet).
 *  Never "TO BEAT 40 PTS / KAI", which reads as Kai's total: the label says it is one shot, per mini-game. */
function bestWords(v) {
  const b = v && v.best, id = v && v.game && v.game.id;
  if (!b) return null;
  const by = { name: b.name, color: b.color };
  if (id === "drive") return { ...by, label: "LONGEST SO FAR", short: "LONGEST", num: String(b.yards), unit: "YD", yards: b.yards };
  if (id === "pin") return b.hio ? { ...by, label: "CLOSEST SO FAR", short: "CLOSEST", num: "HOLE", unit: "IN ONE", wide: "IN THE HOLE" }
    : { ...by, label: "CLOSEST SO FAR", short: "CLOSEST", num: (+b.yards).toFixed(1), unit: "YD" };
  return { ...by, label: "BEST SHOT SO FAR", short: "BEST SHOT", num: String(b.points), unit: "PTS" };
}

// ── Styles (house pixel look: FoxBox Pixel caps, FoxBox Soft names, stepped 4px frames, hard shadows) ──
const CSS = `
#pad-screen.golf #controls { flex: 1 1 auto !important; height: auto !important; }
#golf .gp { position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 10px; color: #fff;
  font-family: "FoxBox Pixel", ui-monospace, monospace; -webkit-user-select: none; user-select: none; }
#golf .gp-px { display: block; image-rendering: pixelated; }
#golf .gp-frame { background: #0a1428e6; box-shadow: 0 -4px 0 0 #0a1428, 0 4px 0 0 #0a1428, -4px 0 0 0 #0a1428, 4px 0 0 0 #0a1428,
  inset 0 0 0 3px var(--gp-edge, #ffffff2e); margin: 4px; padding: 10px 12px; }
#golf .gp-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 10px; line-height: 1.4; color: #ffd23f; }
#golf .gp-head .gp-score { color: #fff; white-space: nowrap; }
#golf .gp-head .gp-timer { color: #cfe3ff; white-space: nowrap; opacity: 0.9; }
#golf .gp-head .gp-timer.low { color: #ff9a7a; }
#golf .gp-head .gp-timer[hidden] { display: none; }
#golf .gp-s { display: none; flex: 1; min-height: 0; flex-direction: column; gap: 12px; align-items: stretch; justify-content: flex-start; text-align: center; }
/* centred when it fits, top-aligned when it doesn't (auto margins on two spacers) */
#golf .gp-s::before, #golf .gp-s::after { content: ""; flex: none; }
#golf .gp-s::before { margin-top: auto; }
#golf .gp-s::after { margin-bottom: auto; }
#golf .gp[data-screen="wait"] .gp-wait, #golf .gp[data-screen="intro"] .gp-intro, #golf .gp[data-screen="aim"] .gp-aim,
#golf .gp[data-screen="armed"] .gp-armed, #golf .gp[data-screen="flight"] .gp-flight, #golf .gp[data-screen="result"] .gp-result,
#golf .gp[data-screen="standings"] .gp-standings, #golf .gp[data-screen="done"] .gp-standings, #golf .gp[data-screen="upright"] .gp-upright,
#golf .gp[data-screen="cards"] .gp-cards { display: flex; }
#golf .gp-big { font-size: clamp(18px, 6.2vw, 28px); line-height: 1.35; color: #ffd23f; text-shadow: 3px 3px 0 #0a1428; }
#golf .gp-mid { font-size: clamp(11px, 3.6vw, 15px); line-height: 1.6; }
#golf .gp-small { font-size: 9px; line-height: 1.7; color: #c9d2e6; }
#golf .gp-soft { font-family: "FoxBox Soft", ui-rounded, system-ui, sans-serif; font-weight: 700; }
#golf .gp-name { font-family: "FoxBox Soft", ui-rounded, system-ui, sans-serif; font-weight: 700; font-size: clamp(22px, 7vw, 32px); line-height: 1.1; text-shadow: 3px 3px 0 #0a1428; }
#golf .gp-row { display: flex; align-items: center; justify-content: center; gap: 14px; }
#golf .gp-btn { appearance: none; border: 0; border-radius: 0; font: inherit; color: #0a1428; cursor: pointer; touch-action: manipulation;
  background: var(--gp-bg, #ffd23f); box-shadow: 0 -4px 0 0 #0a1428, 0 4px 0 0 #0a1428, -4px 0 0 0 #0a1428, 4px 0 0 0 #0a1428, inset 0 -6px 0 0 #0000003a, 0 10px 0 0 #0a142899;
  transition: transform 0.04s; }
#golf .gp-btn.down, #golf .gp-btn:active { transform: translateY(5px); box-shadow: 0 -4px 0 0 #0a1428, 0 4px 0 0 #0a1428, -4px 0 0 0 #0a1428, 4px 0 0 0 #0a1428, inset 0 5px 0 0 #00000033; }
#golf .gp-btn[disabled] { filter: grayscale(0.8) brightness(0.7); }
#golf .gp-arrow { flex: 1; min-height: 120px; display: grid; place-items: center; --gp-bg: #ffffff; touch-action: none; }
#golf .gp-arrow .gp-px { width: 40px; height: auto; }
#golf .gp-aimval { min-width: 92px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
#golf .gp-aimval b { font-size: 26px; color: #fff; text-shadow: 3px 3px 0 #0a1428; font-weight: 400; }
#golf .gp-swing { width: 100%; min-height: 128px; font-size: clamp(26px, 9vw, 40px); letter-spacing: 0.06em; --gp-bg: #35d07f; }
#golf .gp-info { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 10px; font-size: 10px; line-height: 1.5; }
#golf .gp-info .gp-aim-goal { text-align: center; }
#golf .gp-wind { display: flex; align-items: center; gap: 8px; }
#golf .gp-wind-ar { display: inline-block; }
#golf .gp-goal { font-size: 11px; line-height: 1.6; color: #ffd23f; }
#golf .gp-ready { font-size: clamp(16px, 5.5vw, 24px); line-height: 1.4; padding: 14px 10px; color: #c9d2e6; }
#golf .gp-ready.on { color: #0a1428; background: #ffd23f; }
#golf .gp-note { font-family: "FoxBox Soft", ui-rounded, system-ui, sans-serif; font-weight: 700; font-size: 16px; line-height: 1.35; color: #ffb4a6; }
#golf .gp-note:empty { display: none; }
#golf .gp-link { --gp-bg: #c9d2e6; font-size: 11px; padding: 14px 16px; align-self: center; }
#golf .gp-board { display: flex; flex-direction: column; gap: 8px; font-size: 10px; text-align: left; }
#golf .gp-board .r { display: grid; grid-template-columns: 44px minmax(0, 1fr) auto; gap: 8px; align-items: baseline; }
#golf .gp-board .r.me { color: #35d07f; }
#golf .gp-board .r .nm { font-family: "FoxBox Soft", ui-rounded, system-ui, sans-serif; font-weight: 700; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#golf .gp-board .r .gn { color: #ffd23f; font-size: 9px; margin-left: 6px; }
#golf .gp-next { color: #0a1428; background: #35d07f; padding: 10px; font-size: 12px; line-height: 1.5; align-self: center; }
#golf .gp-pts { font-size: clamp(22px, 7.5vw, 34px); color: #35d07f; text-shadow: 3px 3px 0 #0a1428; }
#golf .gp-pts.zero { color: #ff5a3c; }
#golf .gp-result.perfect .gp-big { animation: gp-flash 0.5s steps(2, end) infinite; }
#golf .gp-eye { display: flex; width: 100%; margin: 0 0 14px; align-items: center; justify-content: center; gap: 10px; font-size: 11px; padding: 12px 10px; --gp-bg: #c9d2e6; }
#golf .gp-eye .gp-px { width: 33px; height: auto; }
#golf .gp-eye.on { --gp-bg: #ffd23f; }
/* TURN YOUR PHONE UPRIGHT (the aim screen on a sideways phone; never while addressing or swinging) */
#golf .gp-up-pic { display: flex; align-items: center; justify-content: center; gap: 14px; }
#golf .gp-up-from { display: grid; place-items: center; width: 75px; height: 75px; transform: rotate(90deg); opacity: 0.6; }
#golf .gp-up-to { display: grid; place-items: center; animation: gp-up-hop 0.9s steps(1, end) infinite; }
#golf .gp-up-ar { width: 20px; height: auto; animation: gp-up-nudge 0.9s steps(1, end) infinite; }
#golf .gp-up-big { font-size: clamp(16px, 5.2vw, 26px); }
#golf .gp-up-tip { font-size: 16px; line-height: 1.35; color: #c9d2e6; }
@keyframes gp-up-hop { 50% { transform: translateY(-4px); } }
@keyframes gp-up-nudge { 50% { transform: translateX(4px); } }
@media (prefers-reduced-motion: reduce) { #golf .gp-up-to, #golf .gp-up-ar { animation: none; } }
/* golf setup (before START): the picker chooses the map; everyone sees the choice (pad.js gives us #golf-setup) */
#golf-setup { margin: 4px 0; padding: 10px; background: #0a1428e6; color: #fff; font-family: "FoxBox Pixel", ui-monospace, monospace;
  box-shadow: 0 -4px 0 0 #0a1428, 0 4px 0 0 #0a1428, -4px 0 0 0 #0a1428, 4px 0 0 0 #0a1428, inset 0 0 0 3px #ffffff2e; }
#golf-setup[hidden] { display: none; }
#golf-setup .gs-head { font-size: 11px; line-height: 1.5; color: #ffd23f; text-align: center; margin-bottom: 8px; }
#golf-setup .gs-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
#golf-setup .gs-card { appearance: none; border: 0; border-radius: 0; margin: 0; padding: 4px 4px 6px; font: inherit; color: #fff; background: #1b2540;
  display: flex; flex-direction: column; gap: 4px; align-items: stretch; cursor: pointer; touch-action: manipulation;
  box-shadow: 0 -3px 0 0 #0a1428, 0 3px 0 0 #0a1428, -3px 0 0 0 #0a1428, 3px 0 0 0 #0a1428; }
#golf-setup .gs-card img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; image-rendering: pixelated; background: #0a1428; }
#golf-setup .gs-card span { font-size: 7px; line-height: 1.35; min-height: 2.8em; display: flex; align-items: center; justify-content: center; text-align: center; overflow-wrap: anywhere; }
#golf-setup .gs-card.on { background: #ffd23f; color: #0a1428; box-shadow: 0 -3px 0 0 #0a1428, 0 3px 0 0 #0a1428, -3px 0 0 0 #0a1428, 3px 0 0 0 #0a1428, 0 0 0 6px #ffd23f; }
#golf-setup .gs-card[disabled] { cursor: default; }
#golf-setup .gs-card[disabled]:not(.on) { opacity: 0.55; }
#golf-setup .gs-note { font-size: 9px; line-height: 1.6; color: #c9d2e6; text-align: center; margin-top: 8px; }
#pad-screen.golf-setup #status { padding-top: 6px; padding-bottom: 6px; }
#pad-screen.golf-setup #status-big { font-size: 22px; }
#pad-screen.golf-setup #game-name { display: none !important; }
#pad-screen.golf-setup #controls { flex: 1 1 0 !important; min-height: 96px; height: auto !important; }
@media (orientation: landscape) and (max-height: 520px) {
  #golf-setup { margin: 2px 0; padding: 5px 8px; }
  #golf-setup .gs-head { margin-bottom: 4px; font-size: 10px; }
  #golf-setup .gs-card { padding: 3px 3px 4px; gap: 2px; }
  #golf-setup .gs-card img { aspect-ratio: 3 / 1; }
  #golf-setup .gs-card span { min-height: 0; }
  #golf-setup .gs-note { display: none; }
  #pad-screen.golf-setup #status { padding-top: 2px !important; padding-bottom: 2px !important; min-height: 0 !important; }
  #pad-screen.golf-setup #status-small, #pad-screen.golf-setup #game-name { display: none !important; }
  #pad-screen.golf-setup #status-big { font-size: 16px !important; margin: 0 !important; }
  #pad-screen.golf-setup #bonk { font-size: 26px !important; }
}
@keyframes gp-flash { 50% { color: #ffffff; } }
/* SKINS: the pixel pad (only with a pad: #golf.gp-skin-on; the plain screens never get these classes) */
#golf .gp-skin { position: fixed; inset: 0; z-index: 3; background: var(--sk-body, #000); touch-action: none; }
#golf .gp-skin-host { position: absolute; left: 0; right: 0; bottom: 0; top: var(--gp-safe-t, 0px); overflow: hidden; }
#golf .gp.gp-skinned { position: fixed; z-index: 4; left: var(--gp-sx, 8px); top: var(--gp-sy, 80px); width: var(--gp-sw, calc(100% - 16px)); height: var(--gp-sh, 70%);
  box-sizing: border-box; padding: calc(var(--u) * 2) calc(var(--u) * 3); gap: 8px; overflow: hidden; color: var(--sk-lcd-ink); pointer-events: none; }
#golf .gp.gp-skinned:not(.gp-placed), #golf .gp.gp-skinned[data-screen="aim"] { visibility: hidden; }
#golf .gp.gp-skinned .gp-btn { pointer-events: auto; }
#golf .gp.gp-skinned .gp-head { display: none; }
#golf .gp.gp-skinned .gp-s { gap: 10px; }
#golf .gp.gp-skinned .gp-frame { background: transparent; margin: 2px; box-shadow: inset 0 0 0 2px var(--sk-lcd-dim); }
#golf .gp.gp-skinned .gp-big, #golf .gp.gp-skinned .gp-name, #golf .gp.gp-skinned .gp-pts, #golf .gp.gp-skinned .gp-aimval b { text-shadow: none; }
#golf .gp.gp-skinned .gp-big, #golf .gp.gp-skinned .gp-goal, #golf .gp.gp-skinned .gp-board .r .gn { color: var(--sk-lcd-gold); }
#golf .gp.gp-skinned .gp-small, #golf .gp.gp-skinned .gp-ready, #golf .gp.gp-skinned .gp-up-tip { color: var(--sk-lcd-soft); }
#golf .gp.gp-skinned .gp-next { background: var(--sk-lcd-good); color: var(--sk-lcd); }
#golf .gp.gp-skinned .gp-pts, #golf .gp.gp-skinned .gp-board .r.me { color: var(--sk-lcd-good); }
#golf .gp.gp-skinned .gp-pts.zero, #golf .gp.gp-skinned .gp-note { color: var(--sk-lcd-bad); }
#golf .gp.gp-skinned .gp-ready.on { color: var(--sk-lcd); background: var(--sk-lcd-gold); box-shadow: none; }
#golf .gp.gp-skinned .gp-board .r .nm { text-shadow: none; }
@keyframes gp-skflash { 50% { filter: brightness(1.25); } }
/* the DOM buttons as the pad's raised pixel buttons (one art pixel = --u), palette per role */
#golf .gp.gp-skinned .gp-btn { --pb: var(--sk-x-base); --pm: var(--sk-x-mid); --pl: var(--sk-x-lt); --pd: var(--sk-x-dk); color: var(--sk-x-txt);
  display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 10px 14px; background: var(--pb);
  box-shadow: inset var(--u) var(--u) 0 0 var(--pl), inset calc(var(--u) * -1) calc(var(--u) * -2) 0 0 var(--pd),
    0 calc(var(--u) * -1) 0 0 var(--sk-ink), 0 var(--u) 0 0 var(--sk-ink), calc(var(--u) * -1) 0 0 0 var(--sk-ink), var(--u) 0 0 0 var(--sk-ink),
    0 calc(var(--u) * 3) 0 0 #00000088; transition: none; }
#golf .gp.gp-skinned .gp-btn:active, #golf .gp.gp-skinned .gp-btn.down { transform: translateY(calc(var(--u) * 2)); background: var(--pm);
  box-shadow: inset var(--u) var(--u) 0 0 var(--pd), 0 calc(var(--u) * -1) 0 0 var(--sk-ink), 0 var(--u) 0 0 var(--sk-ink),
    calc(var(--u) * -1) 0 0 0 var(--sk-ink), var(--u) 0 0 0 var(--sk-ink), 0 var(--u) 0 0 #00000088; }
#golf .gp.gp-skinned .gp-enable { --pb: var(--sk-b-base); --pm: var(--sk-b-mid); --pl: var(--sk-b-lt); --pd: var(--sk-b-dk); color: var(--sk-b-txt); }
#golf .gp.gp-skinned .gp-pass { --pb: var(--sk-c-base); --pm: var(--sk-c-mid); --pl: var(--sk-c-lt); --pd: var(--sk-c-dk); color: var(--sk-c-txt); }
#golf .gp.gp-skinned .gp-btn[hidden] { display: none; }
#golf .gp-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (orientation: landscape) and (max-height: 520px) {
  #golf .gp.gp-skinned { gap: 4px; padding: var(--u) calc(var(--u) * 2); }
  #golf .gp.gp-skinned .gp-s { gap: 6px; }
  #golf .gp.gp-skinned .gp-btn { min-height: 44px; padding: 6px 12px; }
  #golf .gp.gp-skinned .gp-board { gap: 3px; }
  #golf .gp.gp-skinned .gp-board .r .nm { font-size: 14px; }
}
@media (orientation: landscape) and (max-height: 520px) {
  /* sideways: no aim controls (the aim screen is TURN YOUR PHONE UPRIGHT); the address screen still fits, since the
     club grip turns the phone every which way */
  #golf .gp { gap: 6px; }
  #golf .gp-upright { gap: 8px; }
  #golf .gp-up-pic .gp-up-phone { width: auto; height: 90px; }
  #golf .gp-up-from { width: 90px; height: 90px; }
  #golf .gp-up-ar { width: auto; height: 32px; }
  #golf .gp-up-tip { font-size: 14px; }
  #golf .gp[data-screen="armed"] .gp-armed { flex-direction: row; flex-wrap: wrap; align-content: center; }
  #golf .gp-armed .gp-pose-pic { flex: 0 0 auto; }
  #golf .gp-armed .gp-arm-text { flex: 1 1 50%; display: flex; flex-direction: column; gap: 8px; }
  #golf .gp-big { font-size: clamp(16px, 3.6vw, 24px); }
}
/* THE INTRO CARDS and the waiting / swing screens ("LCD SIGNS", Lakota Nov 9): the sections with .pc, laid in the pad's
   LCD like every other text screen. The --sk-* colours come from the pixel pad; the fallbacks are the plain screens'. */
#golf .gp > .gp-s.pc { gap: 12px; }
#golf .pc .pc-pic { display: flex; justify-content: center; flex: none; }
#golf .pc .pc-pic[hidden] { display: none; }
#golf .pc .pc-cv { display: block; image-rendering: pixelated; }
#golf .pc .pc-title { font-size: clamp(17px, 5.6vw, 23px); line-height: 1.3; }
#golf .pc .gp-next.pc-head { font-size: clamp(17px, 5.6vw, 23px); line-height: 1.3; padding: 10px 12px; } /* "YOU'RE NEXT" is the headline */
#golf .pc .pc-say { font-size: 19px; line-height: 1.3; }
#golf .pc .pc-kick { letter-spacing: 0.04em; }
#golf .pc .pc-go { align-self: stretch; min-height: 58px; margin: 4px 8px 14px; font-size: 18px; --gp-bg: #ffd23f; }
#golf .gp.gp-skinned .pc .pc-go { --pb: var(--sk-a-base); --pm: var(--sk-a-mid); --pl: var(--sk-a-lt); --pd: var(--sk-a-dk); color: var(--sk-a-txt, #101125); }
#golf .pc .gp-arm-text { display: flex; flex-direction: column; gap: 12px; }
#golf .pc .gp-back { margin-bottom: 14px; }
#golf .pc .pc-up { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; }
#golf .pc .pc-up > i { width: 22px; height: 22px; background: var(--pc); box-shadow: 0 0 0 3px var(--sk-lcd-ink, #fff); }
#golf .pc .pc-up .gp-name { font-size: clamp(30px, 10vw, 40px); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#golf .pc .pc-up small { flex-basis: 100%; font-size: 9px; line-height: 1.6; }
#golf .pc .pc-track { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin: 0 2px; }
#golf .pc .pc-track span { font-size: 10px; line-height: 1; padding: 10px 0; color: var(--sk-lcd-soft, #c9d2e6); box-shadow: inset 0 0 0 2px var(--sk-lcd-dim, #ffffff2e); }
#golf .pc .pc-track span.done { color: var(--sk-lcd-ink, #fff); box-shadow: inset 0 0 0 2px var(--sk-lcd-ink, #fff); }
#golf .pc .pc-track span.on { color: #101125; background: var(--sk-lcd-gold, #ffd23f); box-shadow: none; }
#golf .pc .pc-status { display: flex; align-items: center; justify-content: center; gap: 8px; }
#golf .pc .pc-status > i, #golf .pc .pc-who > i { display: inline-block; width: 12px; height: 12px; background: var(--pc); box-shadow: 0 0 0 2px var(--sk-lcd-ink, #fff); margin-right: 8px; }
#golf .pc .pc-num { font-size: clamp(24px, 8vw, 32px); line-height: 1.3; color: var(--sk-lcd-gold, #ffd23f); }
#golf .pc .pc-num.sm { font-size: clamp(15px, 5vw, 20px); line-height: 1.6; }
#golf .pc .pc-who { font-size: 20px; line-height: 1.2; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#golf .pc .pc-beat { display: flex; flex-direction: column; gap: 6px; align-items: center; }
#golf .pc .pc-two { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; }
#golf .pc .pc-two.one { grid-template-columns: 1fr; }
#golf .pc .pc-two .gp-frame { display: flex; flex-direction: column; gap: 5px; align-items: center; padding: 10px 4px; min-width: 0; }
#golf .pc .pc-wind { display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 10px; line-height: 1.5; flex-wrap: wrap; }
#golf .pc .pc-wind svg { display: block; }
#golf .pc .gp-board { font-size: 11px; gap: 7px; padding: 0 6px; }
#golf .pc .gp-board .r { grid-template-columns: 46px minmax(0, 1fr) auto; }
#golf .pc .gp-board .r .nm { font-size: 19px; }
#golf .pc .gp-board .r .nm i { display: inline-block; width: 10px; height: 10px; background: var(--pc); margin-right: 8px; }
#golf .pc .gp-board .more { font-size: 9px; line-height: 1.6; text-align: center; color: var(--sk-lcd-soft, #c9d2e6); }
/* a short phone (375 x 667): tighter */
@media (max-height: 700px) {
  #golf .gp > .gp-s.pc { gap: 8px; }
  #golf .pc .pc-say { font-size: 17px; }
  #golf .pc .pc-go { min-height: 48px; margin-bottom: 12px; }
  #golf .pc .gp-arm-text { gap: 8px; }
  #golf .pc .gp-board { gap: 3px; }
  #golf .pc .pc-up .gp-name { font-size: 30px; }
}
/* a sideways window: the picture beside the words (cards, like the swing screen), the waiting screens in two columns */
@media (orientation: landscape) and (max-height: 520px) {
  #golf .gp > .gp-s.pc { gap: 6px; }
  #golf .gp[data-screen="cards"] .gp-cards, #golf .gp[data-screen="wait"] .gp-wait { display: grid; grid-template-columns: auto minmax(0, 1fr); column-gap: 14px; row-gap: 6px; align-content: center; align-items: center; }
  #golf .gp-cards::before, #golf .gp-cards::after, #golf .gp-wait::before, #golf .gp-wait::after { display: none; }
  #golf .gp-cards .pc-pic { grid-column: 1; grid-row: 1 / span 4; }
  #golf .gp-cards > :not(.pc-pic) { grid-column: 2; }
  #golf .gp[data-screen="wait"] .gp-wait { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  #golf .gp-wait > * { grid-column: 1; }
  #golf .gp-wait > .pc-beat, #golf .gp-wait > .gp-board, #golf .gp-wait > .pc-two, #golf .gp-wait > .pc-wind { grid-column: 2; }
  #golf .gp-wait > .pc-beat, #golf .gp-wait > .pc-two { grid-row: 1 / span 2; }
  #golf .gp-wait > .gp-board, #golf .gp-wait > .pc-wind { grid-row: 3 / span 2; }
  #golf .pc .pc-say { font-size: 15px; }
  #golf .pc .pc-go { min-height: 44px; margin: 2px 8px 8px; }
  #golf .pc .gp-arm-text { gap: 6px; }
  #golf .pc .gp-back { margin-bottom: 8px; }
  #golf .pc .gp-board { gap: 2px; }
  #golf .pc .gp-board .r .nm { font-size: 15px; }
  #golf .pc .pc-up .gp-name { font-size: 26px; }
  #golf .pc .pc-num { font-size: 22px; }
  #golf .pc .pc-who { font-size: 16px; }
  #golf .pc .pc-two .gp-frame { padding: 6px 4px; gap: 2px; }
}
`;

// ── SKINS: the player's pixel gamepad (FoxBox couch-games dev/party/pad-skin.js, Lakota Nov 1) ───────────────────
// pad.js's sibling ../pad-skin.js has the five pads; without it (e.g. this repo's own dev page) there is no skin
// at all: the screens above exactly as before. With a pad, the aim screen is drawn as the pad (HUD strip, an LCD with the
// wind / goal / aim, the cross pad = the aim arrows, a BIRD'S EYE toggle, a big SWING button: layout "golf", upright
// only); the other screens (whose turn, the address pose, TURN YOUR PHONE UPRIGHT, the result, the standings) keep their
// DOM, laid into the pad's LCD screen (st.rect "screen", a wide one on a sideways phone) and coloured from the style. Every touch runs the same functions
// as the DOM buttons (aimStart / aimStop / doSwing / doEye).
let skinLoad = null;
function loadSkin() {
  if (!skinLoad) {
    let url = "";
    try { url = new URL("../pad-skin.js", import.meta.url).href; } catch {}
    skinLoad = (url ? import(url) : Promise.reject(new Error("no url")))
      .then((m) => (m && typeof m.createPadSkin === "function" && typeof m.registerLayout === "function" && m.PX ? (registerGolfLayouts(m), m) : null))
      .catch(() => null);
  }
  return skinLoad;
}
const rotCW = (rows) => [...rows[0]].map((_, i) => rows.map((r) => r[i] || ".").reverse().join(""));
/** the 8-way wind arrow as rows (0 deg = up the phone, like windArrow) */
function windRows(dir) {
  const k = ((Math.round((((dir % 360) + 360) % 360) / 45) % 8) + 8) % 8;
  let rows = k % 2 ? MAPS.windD : MAPS.wind;
  for (let t = 0; t < Math.floor(k / 2); t++) rows = rotCW(rows);
  return rows;
}
/** Where things go (grid px). side = a sideways phone's text screens (it never gets the aim controls). */
function golfGeom(F, side) {
  const { W, H, bot } = F;
  if (!side) {
    const cl = 8, cw = W - 16, top = 20, avail = bot - 2 - top;
    const lcdH = 26, crossH = 58, pillH = 11, fixed = lcdH + crossH + pillH;
    const d = Math.max(40, Math.min(64, cw - 6, avail - fixed - 12));
    const g = Math.max(3, Math.min(12, Math.floor((avail - fixed - d) / 3)));
    const lcd = { x: cl, y: top, w: cw, h: lcdH };
    const ccy = lcd.y + lcdH + g + 29;
    const pill = { cx: Math.round(W / 2), y: ccy + 29 + g, w: Math.min(cw, 66) };
    return {
      hud: { x: 5, y: 2, w: W - 10, h: 12 }, panel: { x: 5, y: 16, w: W - 10, h: H - 20 }, lcd, lines: 3,
      cross: { cx: Math.round(W / 2), cy: ccy }, pill, swing: { x: Math.round(W / 2 - d / 2), y: pill.y + pillH + g, d },
      scr: { x: cl - 1, y: top, w: cw + 2, h: bot - 2 - top },
    };
  }
  const L = F.L, R = F.R; // inside the notch
  return { hud: { x: L, y: 2, w: R - L, h: 12 }, scr: { x: L, y: 18, w: R - L, h: bot - 1 - 18 } };
}
let golfLayoutsDone = false;
let skinLcdNow = null; // what the pad's aim LCD shows now (QA: window.__golfPad.skinLcd)
function registerGolfLayouts(M) {
  if (golfLayoutsDone) return;
  golfLayoutsDone = true;
  const X = M.PX;
  const { P, R, each, fill, rrect, grow, all, text, textW, fitText, FB, FS, button, cross, plate, raised, key, bbR } = X;
  const hexOk = (c) => (/^#[0-9a-f]{6}$/i.test(String(c || "")) ? c : null);
  const fitFirst = (list, w) => { for (const s of list) if (s && textW(X.pixelText ? X.pixelText(s) : s, FS) <= w) return s; return fitText(list[list.length - 1] || "", w); };
  function hud(S, r, D, side) {
    const m = rrect(r.x, r.y, r.w, r.h, 3);
    fill(grow(m), all(), S.ink); fill(m, all(), S.hud.bg);
    each(m, all(), (x, y) => { if (!m(x, y - 1)) P(x, y, S.ink); });
    R(r.x + 4, r.y + 4, 3, 3, hexOk(D.color) || S.led);
    let right = r.x + r.w - 4;
    if (side && D.score) right -= text(D.score, right, r.y + 3, FS, S.hud.gold, { align: "r" }) + 6;
    text(fitText(D.title || "TEE TIME", right - r.x - 10), r.x + 10, r.y + 3, FS, S.hud.ink, { align: "l" });
  }
  /** rows: [{ l, r, lc, rc, icon }] on an LCD plate */
  function lcd(S, r, rows) {
    plate(S, r.x, r.y, r.w, r.h);
    const y0 = r.y + Math.round((r.h - rows.length * 7 + 2) / 2);
    rows.forEach((row, i) => {
      const y = y0 + i * 7;
      let x = r.x + 3, right = r.x + r.w - 3;
      if (row.r) right -= text(fitText(row.r, r.w - 6), right, y, FS, row.rc || S.hud.gold, { align: "r" }) + 4;
      if (row.icon) { row.icon.forEach((ln, j) => [...ln].forEach((ch, k) => { if (ch === "W") P(x + k, y - 1 + j, row.ic || S.hud.ink); })); x += row.icon[0].length + 2; }
      if (row.l) text(fitText(row.l, right - x), x, y, FS, row.lc || S.hud.ink, { align: "l" });
    });
  }
  function toggle(st, S, name, cx, y, w, label, on) {
    const pr = st.isDown(name), sunk = pr || on, x = Math.round(cx - w / 2), h = 11, bb = bbR(x, y, w, h);
    const pal = on ? S.b : S.x, m = rrect(x, y, w, h, 4);
    raised(m, bb, S, pal, sunk);
    const off = sunk ? 1 : 0, tw = textW(label, FS), led = w - tw >= 12;
    const tx = Math.round(cx - tw / 2 + (led ? 3 : 0));
    if (led) R(tx - 6, y + 4 + off, 3, 3, on ? S.led : S.x.dk);
    text(label, tx, y + 3 + off, FS, on ? pal.txt : S.x.arrow, { align: "l" });
    st.region({ n: name, t: "r", x: x - 3, y: y - 4, w: w + 6, h: h + 8 });
  }
  function draw(st, S, F) {
    // the aim controls are upright only; a sideways phone's screens (TURN YOUR PHONE UPRIGHT, the address pose...) are text
    const D = st.data, side = D.screen !== "aim" && F.W > F.H, g = golfGeom(F, side);
    if (!side && X.tallBody) X.tallBody(S, F, { panel: g.panel });
    hud(S, g.hud, D, side);
    if (D.screen !== "aim") {
      plate(S, g.scr.x, g.scr.y, g.scr.w, g.scr.h);
      st.rect?.("screen", { x: g.scr.x + 1, y: g.scr.y + 2, w: g.scr.w - 2, h: g.scr.h - 3 });
      return;
    }
    // the info LCD
    const w = g.lcd.w - 6, wind = { icon: windRows(D.windDir || 0), l: `${D.windMph ?? 0} MPH` };
    const ga = fitFirst(D.goalA || [], D.timer ? w - 30 : w), gb = fitFirst(D.goalB || [], w - 32);
    // the turn clock's last 30 s sits small at the right of the goal row (the golfer up only)
    const rows = [{ ...wind, r: `AIM ${D.aim || "0"}` }, { l: ga, r: D.timer || "" }, { l: gb, r: D.score || "", rc: S.hud.ink }];
    lcd(S, g.lcd, rows);
    skinLcdNow = { goal: [ga, gb].filter(Boolean).join(" "), aim: D.aim || "0", wind: `${D.windMph ?? 0} MPH`, timer: D.timer || "" };
    // the cross = the aim arrows (an arm at its limit shows no arrow)
    const { cx, cy } = g.cross;
    cross(st, S, cx, cy, 46, 16, S.x, ["l", "r"]);
    const tri = (tx, dir, c) => { for (let i = 0; i < 5; i++) for (let j = -i; j <= i - 1; j++) P(tx + dir * i, cy + j, c); };
    if (D.lmin) tri(cx - 18 - 1, 1, st.isDown("l") ? S.x.mid : S.x.base);
    if (D.rmax) tri(cx + 18, -1, st.isDown("r") ? S.x.mid : S.x.base);
    toggle(st, S, "eye", g.pill.cx, g.pill.y, g.pill.w, D.eye ? "BIRD'S EYE ON" : "BIRD'S EYE", !!D.eye);
    const sw = g.swing;
    button(st, S, "swing", sw.x, sw.y, sw.d, S.a, "SWING", FB, { hit: 4 });
  }
  M.registerLayout("golf", draw, { brand: false });
}

export function createGolfPad(root, { send, me }) {
  if (!document.getElementById("golf-pad-css")) {
    const st = document.createElement("style");
    st.id = "golf-pad-css";
    st.textContent = CSS;
    document.head.append(st);
  }
  root.innerHTML = `
  <div class="gp" data-test="golf-screen" data-screen="wait">
    <div class="gp-head gp-frame"><span class="gp-game">TEE TIME</span><span class="gp-timer" data-test="golf-timer" hidden></span><span class="gp-score" data-test="golf-score"></span></div>
    <section class="gp-s gp-cards pc" data-test="golf-cards">
      <div class="gp-small pc-kick"></div>
      <div class="gp-big pc-title"></div>
      <div class="pc-pic" data-pic="lampGag"></div>
      <div class="gp-soft pc-say"></div>
      <button type="button" class="gp-btn pc-go" data-test="golf-card-ok" data-native>OK</button>
    </section>
    <section class="gp-s gp-wait pc" data-test="golf-wait"></section>
    <section class="gp-s gp-intro">
      <div class="gp-small gp-intro-no"></div>
      <div class="gp-big gp-intro-name"></div>
      <div class="gp-soft gp-intro-sub" style="font-size:17px;line-height:1.35"></div>
      <div class="gp-goal gp-intro-hint"></div>
      <div class="gp-mid gp-intro-first"></div>
    </section>
    <section class="gp-s gp-aim">
      <div class="gp-info gp-frame">
        <span class="gp-wind"></span>
        <span class="gp-goal gp-aim-goal"></span>
      </div>
      <div class="gp-row">
        <button type="button" class="gp-btn gp-arrow" data-test="golf-left" aria-label="Aim left">${sprite("arrowL", 6)}</button>
        <div class="gp-aimval"><span class="gp-small">AIM</span><b class="gp-aim-deg">0</b></div>
        <button type="button" class="gp-btn gp-arrow" data-test="golf-right" aria-label="Aim right">${sprite("arrowR", 6)}</button>
      </div>
      <div class="gp-swingbox">
        <button type="button" class="gp-btn gp-eye" data-test="golf-birdseye" data-native aria-pressed="false">${sprite("eye", 3, "#35d07f")}<span class="gp-eye-txt">BIRD'S EYE</span></button>
        <button type="button" class="gp-btn gp-swing" data-test="golf-swing" data-native>SWING</button>
        <div class="gp-small gp-aim-tip">Aim on the TV, then tap SWING</div>
      </div>
    </section>
    <section class="gp-s gp-upright" data-test="golf-upright" role="status">
      <div class="gp-up-pic" aria-hidden="true">
        <span class="gp-up-from">${sprite("phoneNo", 5, "#ff5a3c", "gp-up-phone")}</span>
        ${sprite("arrowR", 4, "#fff", "gp-up-ar")}
        <span class="gp-up-to">${sprite("phoneOk", 5, "#35d07f", "gp-up-phone")}</span>
      </div>
      <div class="gp-big gp-up-big">TURN YOUR PHONE UPRIGHT</div>
      <div class="gp-soft gp-up-tip">Hold it tall, like a golf club. Your aim and SWING are waiting.</div>
    </section>
    <section class="gp-s gp-armed pc">
      <div class="pc-pic gp-pose-pic" data-test="golf-pose-pic" data-pic="swing"></div>
      <div class="gp-arm-text">
        <div class="gp-mid gp-arm-head">TURN YOUR PHONE FACE DOWN</div>
        <div class="gp-soft pc-say gp-arm-say">Both hands, like a golf club.<br>Hold still, then swing!</div>
        <div class="gp-ready gp-frame" data-test="golf-pose">WAITING FOR MOTION...</div>
        <div class="gp-note"></div>
        <button type="button" class="gp-btn gp-link gp-enable" data-test="golf-enable" data-native hidden>TRY MOTION AGAIN</button>
        <button type="button" class="gp-btn gp-link gp-pass" data-test="golf-pass" data-native hidden>SKIP MY TURN</button>
        <button type="button" class="gp-btn gp-link gp-back" data-test="golf-back" data-native>BACK TO AIM</button>
      </div>
    </section>
    <section class="gp-s gp-flight">
      <div class="gp-big">NICE SWING!</div>
      <div class="gp-mid gp-flight-tier"></div>
    </section>
    <section class="gp-s gp-result">
      <div class="gp-mid gp-res-who"></div>
      <div class="gp-big gp-res-label"></div>
      <div class="gp-mid gp-res-detail"></div>
      <div class="gp-pts gp-res-pts"></div>
    </section>
    <section class="gp-s gp-standings">
      <div class="gp-big gp-st-title"></div>
      <div class="gp-board gp-frame"></div>
      <div class="gp-mid gp-st-me"></div>
    </section>
  </div>`;
  const $ = (sel) => root.querySelector(sel);
  const el = {
    gp: $(".gp"), game: $(".gp-game"), score: $(".gp-score"), timer: $(".gp-timer"),
    cards: $(".gp-cards"), cardKick: $(".gp-cards .pc-kick"), cardTitle: $(".gp-cards .pc-title"), cardPic: $(".gp-cards .pc-pic"), cardSay: $(".gp-cards .pc-say"), cardGo: $(".gp-cards .pc-go"),
    wait: $(".gp-wait"), armHead: $(".gp-arm-head"), armSay: $(".gp-arm-say"),
    introNo: $(".gp-intro-no"), introName: $(".gp-intro-name"), introSub: $(".gp-intro-sub"), introHint: $(".gp-intro-hint"), introFirst: $(".gp-intro-first"),
    wind: $(".gp-wind"), goal: $(".gp-aim-goal"), aimDeg: $(".gp-aim-deg"), left: $('[data-test="golf-left"]'), right: $('[data-test="golf-right"]'),
    swing: $(".gp-swing"), eye: $(".gp-eye"), eyeTxt: $(".gp-eye-txt"), posePic: $(".gp-pose-pic"), ready: $(".gp-ready"), note: $(".gp-note"), enable: $(".gp-enable"), pass: $(".gp-pass"), back: $(".gp-back"),
    flightTier: $(".gp-flight-tier"), resWho: $(".gp-res-who"), resLabel: $(".gp-res-label"), resDetail: $(".gp-res-detail"), resPts: $(".gp-res-pts"),
    resSec: $(".gp-result"), stTitle: $(".gp-st-title"), board: $(".gp-board"), stMe: $(".gp-st-me"),
  };

  let shown = false, status = null, view = null, roundId = null;
  let screen = "off";
  let armed = false; // I tapped SWING this turn (until the shot, BACK, or the turn ends)
  let swung = false; // my swing went out this turn
  let turnKey = ""; // roundId:gameIndex:turnIndex of my current turn
  let lastSwing = null, swings = 0;
  let armSentAt = 0; // when SWING last sent {type:"arm"}
  const ARM_RESEND_MS = 1500;
  // bad Wi-Fi: the swing / READY sent again when the TV's views show it never arrived (see the top)
  let swingMsg = null, swingSentAt = 0, readySentAt = 0, backSentAt = 0;
  const BACK_RESEND_MS = 900; // "I'm back" again at most this often (the TV's views come once a second)
  const SWING_RESEND_MS = 2000; // > a slow link's round trip + the TV's 1 s view beat (a view from before the swing landed)
  const READY_RESEND_MS = 1500;
  // the intro cards: which card, GOT IT tapped (this round), when the card came up, when {type:"cards"} last went out;
  // staleRound = the round whose views were on this phone when the pad was last put away (never shown during a countdown)
  let cardIdx = 0, cardsDone = false, cardAt = 0, cardsSentAt = 0, cardsOnAt = 0, staleRound = null;
  const cardsUp = () => !!(view && view.cards && !cardsDone && view.phase !== "done" && !(status && status.state === "countdown" && view.roundId === staleRound));
  // the pictures: box -> { key, scene, pic, extra }; the clock they are drawn at (ms; picClock = a test's stepped clock)
  const pics = new Map();
  let picT0 = performance.now(), picClock = null, picRaf = 0, picDrawn = 0;

  // ── which way the phone is held: gravity (see the top). Signs don't matter (iOS reports them the other way round). ──
  const TILT_ON = 6.5, TILT_OFF = 4.5; // m/s2 of gravity across the short edge: sideways from ~42 deg, back under ~27 deg
  const TILT_HOLD_MS = 350; // a change must hold this long (the swing's tumble never shows the overlay: aim only anyway)
  const TILT_FRESH_MS = 1500; // older readings = no readings = upright
  const tilt = { side: false, cand: null, since: 0, at: 0, n: 0, listening: false };
  function onTilt(e) {
    const g = e.accelerationIncludingGravity;
    if (!g || !fin(g.x) || !fin(g.y)) return;
    const ax = Math.abs(g.x), ay = Math.abs(g.y), now = performance.now();
    const was = heldSideways();
    tilt.at = now;
    tilt.n++;
    const side = tilt.side ? ax > TILT_OFF && ax > ay : ax > TILT_ON && ax > ay * 1.5;
    if (side === tilt.side) tilt.cand = null;
    else if (tilt.cand !== side) { tilt.cand = side; tilt.since = now; }
    else if (now - tilt.since >= TILT_HOLD_MS) { tilt.side = side; tilt.cand = null; }
    if (heldSideways() !== was && shown) render();
  }
  function tiltListen(on) {
    if (on === tilt.listening) return;
    tilt.listening = on;
    if (on) window.addEventListener("devicemotion", onTilt);
    else {
      window.removeEventListener("devicemotion", onTilt);
      tilt.side = false;
      tilt.cand = null;
    }
  }
  const heldSideways = () => tilt.side && performance.now() - tilt.at < TILT_FRESH_MS;

  // ── a landscape window on the aim screen: the upright aim layout, turned to face a phone held upright ──
  let turnDeg = 0;
  function applyTurn() {
    const want = shown && screen === "aim" && landWindow() ? (screenAngle() === 270 ? 90 : 270) : 0;
    if (want !== turnDeg) {
      turnDeg = want;
      root.classList.toggle("gp-turned", !!want);
      if (!want) for (const k of ["position", "left", "top", "width", "height", "transform", "zIndex"]) root.style[k] = "";
    }
    if (want) Object.assign(root.style, { position: "fixed", left: "50%", top: "50%", width: `${innerHeight}px`, height: `${innerWidth}px`, transform: `translate(-50%, -50%) rotate(${want}deg)`, zIndex: "3" });
  }
  // SKINS (the pixel pad): pad-skin.js once loaded, the pad, its layer + host, the style shown ("" = none)
  let skinMod = null, skin = null, skinLayer = null, skinHost = null, skinStyle = "", skinProbe = null;

  // ── sound: a whoosh for the swing, a tick when READY, a chime when it's your turn (phone only) ──
  let ac = null;
  function audio() {
    const C = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!C) return null;
    try {
      if (!ac) ac = new C();
      if (ac.state === "suspended") ac.resume().catch(() => {});
    } catch {
      return null;
    }
    return ac;
  }
  function tone(f, dur, { type = "square", gain = 0.05, delay = 0, slide = 0 } = {}) {
    const c = audio();
    if (!c || c.state !== "running") return;
    const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.linearRampToValueAtTime(Math.max(40, f + slide), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  function whoosh(power) {
    const c = audio();
    if (!c || c.state !== "running") return;
    const dur = 0.32, t = c.currentTime;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / d.length);
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf;
    f.type = "bandpass";
    f.Q.value = 1.2;
    f.frequency.setValueAtTime(500, t);
    f.frequency.exponentialRampToValueAtTime(1800 + power * 2200, t + dur * 0.6);
    g.gain.setValueAtTime(0.25 + power * 0.35, t);
    src.connect(f).connect(g).connect(c.destination);
    src.start(t);
    src.stop(t + dur + 0.02);
  }
  const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch {} };
  for (const ev of ["touchend", "pointerup", "click"]) root.addEventListener(ev, () => audio(), { passive: true });

  // ── aim arrows: press = 1 degree, hold = sweep (the TV turns the line; re-sent every 250 ms) ──
  let aimDir = 0, aimTimer = null, aimPointer = null;
  function aimStart(dir, ev) {
    if (screen !== "aim") return;
    ev?.preventDefault?.();
    aimPointer = ev?.pointerId ?? null;
    if (aimDir === dir) return;
    aimDir = dir;
    (dir < 0 ? el.left : el.right).classList.add("down");
    send({ type: "aim", dir });
    clearInterval(aimTimer);
    aimTimer = setInterval(() => aimDir && send({ type: "aim", dir: aimDir }), 250);
  }
  function aimStop() {
    clearInterval(aimTimer);
    aimTimer = null;
    el.left.classList.remove("down");
    el.right.classList.remove("down");
    if (aimDir) send({ type: "aim", dir: 0 });
    aimDir = 0;
    aimPointer = null;
  }
  for (const [btn, dir] of [[el.left, -1], [el.right, 1]]) {
    btn.addEventListener("pointerdown", (e) => {
      try { btn.setPointerCapture(e.pointerId); } catch {}
      aimStart(dir, e);
    });
    for (const t of ["pointerup", "pointercancel", "lostpointercapture"]) btn.addEventListener(t, (e) => {
      if (aimPointer == null || e.pointerId === aimPointer) aimStop();
    });
    btn.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  // ── motion: OFF while aiming, ON from SWING until the shot (or BACK) ──
  let motion = "off"; // off | asking | on | denied | unavailable | insecure | nodata
  let listening = false, gotData = false, noDataTimer = null;
  const hasMotion = typeof window.DeviceMotionEvent !== "undefined";
  const needsPermission = hasMotion && typeof DeviceMotionEvent.requestPermission === "function";
  let permission = needsPermission ? "unknown" : "granted";
  // detector state
  let armedAt = 0, firstDataAt = 0, ready = false, pose = null, stillSince = 0, poseOffSince = 0;
  let sw = null; // the swing being measured: { t0, peak, lin, twist, n, quietSince }

  function setMotion(m) {
    if (motion === m) return;
    motion = m;
    const st = { on: "granted", denied: "denied", unavailable: "unavailable", insecure: "insecure", asking: "prompt" }[m];
    if (st) send({ type: "motion", state: st });
    render();
  }
  function listen(on) {
    if (on && !listening) {
      listening = true;
      window.addEventListener("devicemotion", onMotion);
    } else if (!on && listening) {
      listening = false;
      window.removeEventListener("devicemotion", onMotion);
    }
  }
  function resetDetector() {
    armedAt = performance.now();
    firstDataAt = 0;
    ready = false;
    pose = null;
    stillSince = 0;
    poseOffSince = 0;
    sw = null;
  }
  /** Gyro on (from the SWING click, so iOS may show its permission prompt). */
  function motionOn() {
    resetDetector();
    gotData = false;
    clearTimeout(noDataTimer);
    if (!window.isSecureContext) return setMotion("insecure");
    if (!hasMotion) return setMotion("unavailable");
    const go = () => {
      setMotion("on");
      listen(true);
      noDataTimer = setTimeout(() => {
        if (armed && !gotData) setMotion("nodata");
      }, NO_DATA_MS);
    };
    if (permission === "granted") return go();
    setMotion("asking");
    let p;
    try {
      p = DeviceMotionEvent.requestPermission(); // must run inside the click
    } catch {
      return setMotion("denied");
    }
    Promise.resolve(p).then(
      (res) => {
        permission = res === "granted" ? "granted" : "denied";
        if (!armed) return;
        if (permission === "granted") go();
        else setMotion("denied");
      },
      () => {
        permission = "unknown";
        if (armed) setMotion("denied");
      },
    );
  }
  function motionOff() {
    listen(false);
    clearTimeout(noDataTimer);
    if (motion !== "denied" && motion !== "insecure" && motion !== "unavailable") motion = "off";
    sw = null;
    ready = false;
  }

  function onMotion(e) {
    if (!armed || swung || document.hidden) return;
    const gi = e.accelerationIncludingGravity || {}, rr = e.rotationRate || {}, ac2 = e.acceleration || {};
    if (![gi.x, gi.y, gi.z, rr.alpha, rr.beta, rr.gamma].some(fin)) return;
    const now = performance.now();
    if (!gotData) {
      gotData = true;
      firstDataAt = now;
      clearTimeout(noDataTimer);
      if (motion !== "on") setMotion("on");
    }
    const rot = Math.hypot(n0(rr.alpha), n0(rr.beta), n0(rr.gamma));
    const gy = n0(gi.y) * iosSign, gz = n0(gi.z) * iosSign; // W3C signs: upright y = +9.8, face up z = +9.8
    const lin = [ac2.x, ac2.y, ac2.z].some(fin) ? Math.hypot(n0(ac2.x), n0(ac2.y), n0(ac2.z)) : Math.abs(Math.hypot(n0(gi.x), n0(gi.y), n0(gi.z)) - 9.81);
    const linKnown = [ac2.x, ac2.y, ac2.z].some(fin) || [gi.x, gi.y, gi.z].some(fin);
    const down = gy < -POSE_G || gz < -POSE_G;
    const newPose = down ? (gz < -POSE_G ? "faceDown" : "pointDown") : gy > POSE_G ? "upright" : "other";
    if (newPose !== pose) {
      pose = newPose;
      render();
    }

    if (sw) {
      // measuring a swing: keep the peak until the phone settles
      sw.peak = Math.max(sw.peak, rot);
      sw.lin = Math.max(sw.lin, lin);
      if (rot > SWING_DPS * 0.5) {
        sw.twist += isIOS ? n0(rr.beta) : n0(rr.gamma);
        sw.n++;
      }
      if (rot < SETTLE_DPS) sw.quietSince ||= now;
      else sw.quietSince = 0;
      if ((sw.quietSince && now - sw.quietSince >= SETTLE_MS) || now - sw.t0 >= SWING_MAX_MS) finishSwing(linKnown);
      return;
    }
    if (!ready) {
      const still = rot < STILL_DPS;
      const okPose = down || (firstDataAt && now - firstDataAt > GRACE_MS);
      if (still && okPose) {
        stillSince ||= now;
        if (now - stillSince >= STILL_MS) setReady(true);
      } else stillSince = 0;
      return;
    }
    // READY: the first big spike is the swing
    if (rot > SWING_DPS) {
      sw = { t0: now, peak: rot, lin, twist: 0, n: 0, quietSince: 0 };
      return;
    }
    // wandered out of the address pose (e.g. turned the phone up to look): not ready any more
    if (!down && rot < STILL_DPS && !(firstDataAt && now - firstDataAt > GRACE_MS)) {
      poseOffSince ||= now;
      if (now - poseOffSince > UNREADY_MS) setReady(false);
    } else poseOffSince = 0;
  }
  function setReady(on) {
    if (ready === on) return;
    ready = on;
    stillSince = 0;
    poseOffSince = 0;
    readySentAt = performance.now();
    send({ type: "ready", ready: on });
    if (on) {
      tone(1320, 0.07, { gain: 0.06 });
      tone(1760, 0.09, { gain: 0.05, delay: 0.08 });
      buzz(40);
    }
    render();
  }
  function finishSwing(linKnown) {
    const s = sw;
    sw = null;
    if (linKnown && s.lin < SWING_LIN) return; // a wrist flick, not a swing: keep waiting
    const strength = clamp((s.peak - DPS_LO) / DPS_SPAN, 0, 1);
    const tier = tierOf(strength);
    const wrist = clamp((s.n ? s.twist / s.n : 0) / 400, -1, 1);
    lastSwing = { peakDps: Math.round(s.peak), strength: Math.round(strength * 100) / 100, tier, wrist: Math.round(wrist * 100) / 100, lin: Math.round(s.lin), at: Date.now() };
    swings++;
    swung = true;
    swingMsg = { key: turnKey, m: { type: "swing", strength: lastSwing.strength, tier, wrist: lastSwing.wrist, peakDps: lastSwing.peakDps } };
    swingSentAt = performance.now();
    send(swingMsg.m);
    whoosh(strength);
    buzz(60);
    motionOff();
    render();
  }

  // ── buttons ──
  let eyeOn = false, eyeSentAt = 0; // BIRD'S EYE: what we asked for (the TV's view echoes it back as view.birdseye)
  // (named, so the pixel pad's buttons run exactly these: SKINS below)
  function doEye() {
    if (screen !== "aim" || !view?.isYourTurn) return;
    eyeOn = !(performance.now() - eyeSentAt < 1500 ? eyeOn : !!view.birdseye);
    eyeSentAt = performance.now();
    send({ type: "birdseye", on: eyeOn });
    buzz(15);
    render();
  }
  el.eye.addEventListener("click", doEye);
  el.cardGo.addEventListener("click", () => {
    const now = performance.now();
    if (screen !== "cards" || now - cardAt < CARD_TAP_MS) return;
    buzz(12);
    cardAt = picT0 = now;
    if (cardIdx < CARDS.length - 1) cardIdx++;
    else {
      cardsDone = true;
      cardsSentAt = now;
      send({ type: "cards" });
    }
    render();
  });
  function doSwing() {
    if (screen !== "aim" || !view?.isYourTurn) return;
    aimStop();
    audio();
    armed = true;
    swung = false;
    armSentAt = performance.now();
    send({ type: "arm" });
    motionOn(); // (inside the tap: iOS only asks for motion access from a user gesture)
    render();
  }
  el.swing.addEventListener("click", doSwing);
  el.back.addEventListener("click", () => {
    if (!armed) return;
    armed = false;
    motionOff();
    send({ type: "disarm" });
    render();
  });
  el.pass.addEventListener("click", () => {
    if (!armed) return;
    armed = false;
    motionOff();
    send({ type: "pass" });
    render();
  });
  el.enable.addEventListener("click", () => {
    if (!armed) return;
    permission = needsPermission ? "unknown" : "granted";
    motionOn();
  });
  // the page hidden (phone locked / another app) or back: info for the TV (it waits either way)
  document.addEventListener("visibilitychange", () => {
    if (shown) send({ type: "hidden", on: !!document.hidden });
  });

  // ── the TV's view → the screen ──
  function myTurnKey(v) {
    return v && v.isYourTurn && v.turn ? `${v.roundId}:${v.game?.index}:${v.turn.index}` : "";
  }
  function onView(v) {
    if (view && v.roundId === view.roundId && v.seq <= view.seq) return; // stale
    if (v.roundId !== roundId) {
      roundId = v.roundId;
      armed = swung = false;
      motionOff();
      cardIdx = 0; // a new round: the cards (if the TV asks for them) start over
      cardsDone = false;
    }
    const key = myTurnKey(v);
    if (key && key !== turnKey) {
      // a new turn of mine: fresh controls + a little chime
      turnKey = key;
      armed = swung = false;
      motionOff();
      tone(784, 0.1, { gain: 0.05 });
      tone(1047, 0.14, { gain: 0.05, delay: 0.1 });
      buzz(80);
    }
    if (!key) turnKey = "";
    view = v;
    // the TV has this page as hidden (away) but it is showing: the "I'm back" got lost (unlocked while the link was
    // down). Say it again; idempotent on the TV, and any connected phone that talks is not away.
    const tvAway = v.you?.hidden === true;
    if (tvAway && shown && !document.hidden && performance.now() - backSentAt > BACK_RESEND_MS) {
      backSentAt = performance.now();
      send({ type: "hidden", on: false });
    }
    // GOT IT never arrived (the hub drops phone messages during its READY... countdown; bad Wi-Fi): say it again.
    // Idempotent on the TV; it answers with a view that no longer asks for the cards.
    if (v.cards && cardsDone && performance.now() - cardsSentAt > CARDS_RESEND_MS) {
      cardsSentAt = performance.now();
      send({ type: "cards" });
    }
    // The cards are on this screen: tell the TV (its camera only waits up high for a phone that said so; a TV without
    // view.cardsSeen is not asked). Said again the same way until the view agrees.
    if (v.cardsSeen === false && shown && cardsUp() && performance.now() - cardsOnAt > CARDS_RESEND_MS) {
      cardsOnAt = performance.now();
      send({ type: "cards", on: true });
    }
    // the TV moved on (shot taken, time up, turn over): follow it
    if (!v.isYourTurn || !["aim", "armed"].includes(v.phase)) {
      if (armed || listening) motionOff();
      armed = false;
      if (aimDir) aimStop();
    } else if (v.phase === "aim" && armed && !swung && performance.now() - armSentAt > ARM_RESEND_MS) {
      // still "aim" on the TV well after SWING: the arm got lost (a Wi-Fi blip), say it again. (An "aim" view
      // right after BACK + a quick SWING is just late news, not a reason to drop the re-arm.)
      armSentAt = performance.now();
      send({ type: "arm" });
    } else if (swung && swingMsg && swingMsg.key === key && performance.now() - swingSentAt > SWING_RESEND_MS) {
      // my swing went out but the TV is still waiting for it (aim / armed, my turn): it got lost on the way (bad Wi-Fi,
      // a link that died as it went). Send it again, after an arm if the TV isn't armed: the TV takes a swing only
      // while armed, and once it has the shot it is in flight, so a late duplicate does nothing.
      swingSentAt = performance.now();
      if (v.phase === "aim") send({ type: "arm" });
      send(swingMsg.m);
    } else if (v.phase === "armed" && armed && !swung && v.ready !== ready && performance.now() - readySentAt > READY_RESEND_MS) {
      readySentAt = performance.now(); // READY (or not) got lost: the TV's PHONE FACE DOWN... / READY... SWING! follows the phone
      send({ type: "ready", ready });
    }
    render();
  }

  /** The aim screen on a sideways phone is TURN YOUR PHONE UPRIGHT (only "aim": never armed / flight, see the top). */
  function screenNow() {
    const s = screenOf();
    return s === "aim" && heldSideways() ? "upright" : s;
  }
  function screenOf() {
    if (!shown) return "off";
    const v = view;
    if (cardsUp()) return "cards"; // before anything else (the countdown too): nothing else is on the pad meanwhile
    if (!v || !status || status.state === "countdown") return "wait";
    switch (v.phase) {
      case "intro": return "intro";
      case "aim": return v.isYourTurn ? (swung ? "flight" : armed ? "armed" : "aim") : "wait";
      case "armed": return v.isYourTurn ? (swung ? "flight" : armed ? "armed" : "aim") : "wait";
      case "flight": return v.isYourTurn ? "flight" : "wait";
      case "result": return "result";
      case "standings": return "standings";
      case "done": return "done";
      default: return "wait";
    }
  }

  function render() {
    renderDom();
    syncSkin(); // SKINS
  }
  function renderDom() {
    const next = screenNow();
    if (next !== screen) {
      if (screen === "aim" && aimDir) aimStop();
      if (next === "cards" || next === "armed") picT0 = performance.now(); // the picture starts its loop with the screen
      if (next === "cards") cardAt = picT0;
      screen = next;
    }
    applyTurn();
    el.gp.dataset.screen = screen === "off" ? "wait" : screen;
    const v = view;
    const set = (node, txt) => { if (node.textContent !== txt) node.textContent = txt; };
    const html = (node, h) => { if (node.dataset.h !== h) { node.innerHTML = h; node.dataset.h = h; } };
    const pre = !v || !status || status.state === "countdown";
    const g = (v && v.game) || {};
    if (pre) {
      set(el.game, "TEE TIME");
      set(el.score, "");
      el.timer.hidden = true;
    } else {
      set(el.game, `${(g.index ?? 0) + 1}/${g.count || 3} ${g.name || ""}`);
      set(el.score, v.you ? `${v.you.total} PTS ${ordinal(v.you.rank).toUpperCase()}` : "");
      // the turn clock's last 30 s, small, for the golfer up only
      const tmr = myTimer(v);
      el.timer.hidden = !tmr;
      set(el.timer, tmr || "");
      el.timer.classList.toggle("low", !!tmr && (v.timer.left | 0) <= 5);
    }

    if (screen === "cards") {
      const cd = CARDS[cardIdx];
      el.cards.dataset.card = String(cardIdx + 1);
      set(el.cardKick, `BEFORE YOU SWING  ${cardIdx + 1}/${CARDS.length}`);
      set(el.cardTitle, cd.title);
      if (el.cardPic.dataset.pic !== cd.pic) el.cardPic.dataset.pic = cd.pic;
      html(el.cardSay, `${esc(cd.say[0])}<br>${esc(cd.say[1])}`);
      if (el.cardGo.dataset.label !== cd.go) { el.cardGo.textContent = cd.go; el.cardGo.dataset.label = cd.go; } // (the pixel pad re-letters it: syncSkin)
    } else if (pre) {
      html(el.wait, ""); // the hub's countdown: nothing to say yet, so nothing is shown (no filler line)
    } else if (screen === "wait") {
      html(el.wait, waitHtml(v));
    } else {
      html(el.wait, ""); // not showing: no stale score rows left in the page under another screen
    }
    if (screen === "intro") {
      set(el.introNo, `CHALLENGE ${(g.index ?? 0) + 1} OF ${g.count || 3}${g.map?.name ? ` · ${g.map.name}` : ""}`);
      set(el.introName, g.name || "");
      set(el.introSub, g.sub || "");
      set(el.introHint, g.hint || "");
      set(el.introFirst, v.youreNext ? "YOU'RE FIRST!" : "");
    } else if (screen === "aim") {
      html(el.wind, `${windArrow(v.wind?.dir || 0, 3)}<span>${Math.round(v.wind?.mph || 0)} MPH</span>`);
      const tg = v.aim?.target, pin = v.aim?.pin;
      html(el.goal, tg ? `TARGET ${tg.yards} YD<br>${tg.pts} PTS` : pin ? `PIN ${pin.yards} YD<br>${esc(g.hint || "")}` : esc(g.hint || ""));
      const d = v.aim?.deg || 0;
      set(el.aimDeg, Math.abs(d) < 0.5 ? "0" : `${d < 0 ? "L" : "R"}${Math.round(Math.abs(d))}`);
      el.left.disabled = d <= (v.aim?.min ?? -25) + 0.01;
      el.right.disabled = d >= (v.aim?.max ?? 25) - 0.01;
      const on = performance.now() - eyeSentAt < 1500 ? eyeOn : !!v.birdseye; // our tap wins until the TV echoes it
      el.eye.classList.toggle("on", on);
      el.eye.setAttribute("aria-pressed", on ? "true" : "false");
      el.eye.dataset.on = on ? "1" : "0";
      set(el.eyeTxt, on ? "BIRD'S EYE: ON" : "BIRD'S EYE");
    } else if (screen === "armed") {
      el.ready.classList.toggle("on", ready);
      el.ready.dataset.ready = ready ? "1" : "0";
      set(el.ready, ready ? "READY! SWING!" : motion === "asking" ? "TAP ALLOW..." : motion === "on" ? (gotData ? "FACE DOWN + HOLD STILL" : "WAITING FOR MOTION...") : "MOTION IS OFF");
      const note = motion === "denied" ? "Motion is blocked. Tap TRY MOTION AGAIN; if nothing pops up, close this tab, scan the TV's QR code again and tap Allow."
        : motion === "insecure" ? "Motion needs the secure link: scan the QR code on the TV again."
        : motion === "unavailable" ? "This phone has no motion sensor, so it can't swing. Ask for a pass!"
        : motion === "nodata" ? "No motion readings. Check Settings > Safari > Motion & Orientation Access, then try again."
        : "";
      set(el.note, note);
      // the picture and the words follow READY (the phone is face down then: its sound / buzz and the TV carry it);
      // with a motion problem the picture makes way for the note and its buttons
      const pic = ready ? "ready" : "swing";
      if (el.posePic.dataset.pic !== pic) el.posePic.dataset.pic = pic;
      el.posePic.hidden = !!note;
      set(el.armHead, ready ? "NOW SWING!" : "TURN YOUR PHONE FACE DOWN");
      html(el.armSay, ready ? "Swing it like a golf club.<br>Hold on tight!" : "Both hands, like a golf club.<br>Hold still, then swing!");
      el.enable.hidden = !(motion === "denied" || motion === "nodata");
      el.pass.hidden = !["denied", "nodata", "unavailable", "insecure"].includes(motion);
    } else if (screen === "flight") {
      set(el.flightTier, lastSwing ? `SWING: ${TIER_NAME[lastSwing.tier] || ""}` : "");
    } else if (screen === "result") {
      const last = v.last;
      const mine = !!last && last.playerId === v.you?.playerId;
      set(el.resWho, last ? (mine ? "YOUR SHOT" : `${last.name}'S SHOT`) : "");
      set(el.resLabel, last?.label || "");
      set(el.resDetail, last && !last.skipped ? `${last.detail}${mine && last.swingTier ? ` · SWING ${TIER_NAME[last.swingTier]}` : ""}` : "");
      set(el.resPts, last ? `+${last.points} PTS` : "");
      el.resPts.classList.toggle("zero", !last?.points);
      el.resSec.classList.toggle("perfect", !!last?.perfect || last?.label === "HOLE IN ONE!");
    } else if (screen === "standings" || screen === "done") {
      set(el.stTitle, screen === "done" ? "FINAL SCORES" : `AFTER ${g.name || ""}`);
      const rows = (v.scores || []).map((s) => `<div class="r${s.playerId === v.you?.playerId ? " me" : ""}"><span>${ordinal(s.rank).toUpperCase()}</span><span class="nm" style="color:${esc(s.color)}">${esc(s.name)}</span><span>${s.total}${s.last != null ? `<span class="gn">+${s.last}</span>` : ""}</span></div>`).join("");
      html(el.board, rows);
      set(el.stMe, v.you ? `YOU: ${ordinal(v.you.rank).toUpperCase()} · ${v.you.total} PTS` : "");
    }
    syncPics();
  }

  // ── the waiting screens: who is up and their step, the shot to beat, the scores; "you're next" with the wind ──
  const chip = (c) => `<i style="--pc:${esc(c)}"></i>`;
  const ORD = (n) => ordinal(n).toUpperCase();
  const BOARD_ROWS = 4; // what fits under the shot to beat on a short phone: the top rows, and always your own
  function waitHtml(v) {
    const up = v.turn, g = v.game || {};
    if (!up) return ""; // no turn yet: nothing useful to show, so nothing (no filler line)
    // (hold: the TV is waiting for the golfer up to finish the intro cards; no step is lit yet)
    const word = v.hold ? "MAKING ROOM..." : v.phase === "armed" ? (v.ready ? "READY TO SWING..." : "LINING UP...") : v.phase === "flight" ? "THERE IT GOES!" : "AIMING...";
    const stage = v.hold ? -1 : v.phase === "aim" ? 0 : v.phase === "armed" && !v.ready ? 1 : 2;
    const b = bestWords(v), meId = v.you && v.you.playerId;
    const sr = `<span class="gp-sr" data-test="golf-turn">${esc(up.name)} IS UP</span>`;
    if (v.youreNext) {
      const best = b ? `<div class="gp-frame" data-test="golf-best" data-best="${esc(`${b.num} ${b.unit}`)}" data-by="${esc(b.name)}"><div class="gp-small">${b.short}</div><div class="pc-num">${esc(b.num)}</div><div class="gp-small">${b.unit}</div><div class="gp-soft pc-who">${chip(b.color)}${esc(b.name)}</div></div>` : "";
      const mine = v.you ? `<div class="gp-frame" data-test="golf-mine"><div class="gp-small">YOUR TOTAL</div><div class="pc-num">${v.you.total}</div><div class="gp-small">PTS</div><div class="gp-soft pc-who">${ORD(v.you.rank)} PLACE</div></div>` : "";
      return `<div class="gp-next pc-head" data-test="golf-next">YOU'RE NEXT</div>
        <div class="gp-small pc-status">${chip(up.color)}${esc(up.name)} IS UP: ${word}</div>${sr}
        ${best || mine ? `<div class="pc-two${best && mine ? "" : " one"}">${best}${mine}</div>` : ""}
        <div class="gp-frame pc-wind">${windSvg(v.wind?.dir || 0)}<span>WIND ${Math.round(v.wind?.mph || 0)} MPH</span><span class="gp-goal">${esc(g.hint || "")}</span></div>
        <div class="gp-soft pc-say">Stand up and make room.</div>`;
    }
    const col = /^#[0-9a-f]{6}$/i.test(b?.color || "") ? b.color : "";
    const best = b ? `<div class="gp-frame pc-beat" data-test="golf-best" data-best="${esc(b.wide || `${b.num} ${b.unit}`)}" data-by="${esc(b.name)}"><div class="gp-small">${b.label}</div><div class="pc-num${b.wide ? " sm" : ""}">${esc(b.wide || `${b.num} ${b.unit}`)}</div>${
      b.yards != null ? `<div class="pc-pic" data-pic="bar" data-yards="${+b.yards || 0}" data-color="${col}"></div>` : ""}<div class="gp-soft pc-who">${chip(b.color)}${esc(b.name)}</div></div>` : "";
    // the scores: the top rows; with more golfers than fit, the last row is always your own
    const all = v.scores || [], mineAt = all.findIndex((x) => x.playerId === meId);
    let rows = all;
    if (all.length > BOARD_ROWS) rows = mineAt >= BOARD_ROWS ? [...all.slice(0, BOARD_ROWS - 1), all[mineAt]] : all.slice(0, BOARD_ROWS);
    const board = rows.map((x) => `<div class="r${x.playerId === meId ? " me" : ""}"><span>${ORD(x.rank)}</span><span class="nm">${chip(x.color)}${esc(x.name)}${x.playerId === meId ? " (YOU)" : ""}</span><span>${x.total} PTS</span></div>`).join("");
    return `<div class="pc-up" style="--pc:${esc(up.color)}"><small class="gp-small">GOLFER ${(up.index | 0) + 1} OF ${up.count || all.length || 1}</small><i></i><span class="gp-name">${esc(up.name)}</span><span class="gp-mid">IS UP</span></div>${sr}
      <div class="pc-track" data-test="golf-track" data-stage="${stage}">${["AIM", "READY", "SWING"].map((w, i) => `<span class="${i < stage ? "done" : i === stage ? "on" : ""}">${w}</span>`).join("")}</div>
      <div class="gp-small pc-status" data-test="golf-status">${word}</div>
      ${best}
      <div class="gp-board" data-test="golf-board">${board}${all.length > rows.length ? `<div class="more">${all.length} GOLFERS</div>` : ""}</div>`;
  }

  // ── the pictures: one small canvas per [data-pic] box, redrawn ~30 times a second while a moving one shows ──
  const picScale = () => { // CSS px per art pixel: whole device pixels, smaller on a short or sideways screen
    const dpr = window.devicePixelRatio || 1, land = landWindow();
    return Math.max(land ? 1 : 2, Math.floor((land ? 1 : innerHeight >= 780 ? 2 : 1.5) * dpr)) / dpr;
  };
  const picTime = () => (picClock != null ? picClock : performance.now() - picT0);
  const picMoving = () => shown && (screen === "cards" || (screen === "armed" && !ready));
  function drawPic(e, t) {
    const L = e.scene.loop;
    try { e.pic.render((c) => e.scene.draw(c, ((t % L) + L) % L, e.extra || undefined)); } catch {}
  }
  function drawPics(all) {
    const t = picTime();
    for (const [box, e] of pics) if (all || (!e.scene.still && box.getClientRects().length)) drawPic(e, t);
  }
  function syncPics() {
    const k = picScale();
    for (const box of [...pics.keys()]) if (!box.isConnected) pics.delete(box);
    for (const box of el.gp.querySelectorAll("[data-pic]")) {
      const name = box.dataset.pic, scene = PICS.SCENES[name];
      if (!scene) continue;
      const key = `${name}|${k}|${box.dataset.yards || ""}|${box.dataset.color || ""}`;
      let e = pics.get(box);
      if (e && e.key === key) continue;
      const extra = name === "bar" ? { yards: +box.dataset.yards || 0, color: box.dataset.color || "" } : null;
      const pic = PICS.makePic(scene.W, scene.H, [...PICS.PAL, ...(extra && extra.color ? [extra.color] : [])]);
      pic.canvas.style.width = `${scene.W * k}px`;
      pic.canvas.style.height = `${scene.H * k}px`;
      box.replaceChildren(pic.canvas);
      e = { key, scene, pic, extra, k };
      pics.set(box, e);
      drawPic(e, picTime());
    }
    if (picMoving() && !picRaf) picRaf = requestAnimationFrame(picFrame);
  }
  function picFrame(ts) {
    picRaf = 0;
    if (!picMoving()) return;
    if (picClock == null && ts - picDrawn >= 30) { picDrawn = ts; drawPics(false); }
    picRaf = requestAnimationFrame(picFrame);
  }
  try { document.fonts?.load?.('8px "FoxBox Pixel"').then(() => drawPics(true)).catch(() => {}); } catch {} // (READY! in the pictures)

  // ── SKINS: the pixel pad over this screen (see loadSkin above; nothing here runs without pad-skin.js) ──
  function skinWanted() {
    return !!(shown && skinMod);
  }
  function safeTop() {
    const t = globalThis.FOXBOX_SAFE_TEST; // QA: a phone's insets (headless browsers report none)
    if (t && typeof t === "object") return +t.t || 0;
    if (!skinProbe) {
      skinProbe = document.createElement("div");
      skinProbe.style.cssText = "position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top,0px)";
      document.body.append(skinProbe);
    }
    return parseFloat(getComputedStyle(skinProbe).paddingTop) || 0;
  }
  const myColor = () => getComputedStyle(document.documentElement).getPropertyValue("--c").trim();
  /** "0:25" while the TV's turn clock shows (last 30 s) and it's my turn, else "" */
  function myTimer(v) {
    if (!v || !v.isYourTurn || !v.timer || !["aim", "armed"].includes(v.phase)) return "";
    return `0:${String(Math.max(0, v.timer.left | 0)).padStart(2, "0")}`;
  }
  function skinData() {
    const v = view, g = (v && v.game) || {}, s = el.gp.dataset.screen;
    const d = { screen: screen === "aim" && s === "aim" ? "aim" : "text", color: myColor(), title: "TEE TIME", score: "" };
    if (!v || !status || status.state === "countdown") return d;
    d.title = `${(g.index ?? 0) + 1}/${g.count || 3} ${String(g.name || "").replace(/ THE /g, " ")}`;
    d.score = v.you ? `${v.you.total} ${ordinal(v.you.rank).toUpperCase()}` : "";
    if (d.screen !== "aim") return d;
    const tg = v.aim?.target, pin = v.aim?.pin, hint = String(g.hint || "");
    d.windDir = v.wind?.dir || 0;
    d.windMph = Math.round(v.wind?.mph || 0);
    d.goalA = tg ? [`TARGET ${tg.yards} YD`, `TGT ${tg.yards} YD`, `${tg.yards} YD`] : pin ? [`PIN ${pin.yards} YD`, `${pin.yards} YD`] : [hint, hint.split(" ")[0]];
    d.goalB = tg ? [`${tg.pts} PTS`] : pin ? [hint, hint.split(" ")[0]] : [""];
    d.aim = el.aimDeg.textContent || "0";
    d.timer = myTimer(v);
    d.lmin = el.left.disabled;
    d.rmax = el.right.disabled;
    d.eye = el.eye.dataset.on === "1";
    return d;
  }
  function skinInput(ev) {
    if (ev.type !== "press") return;
    const n = ev.name;
    if (n === "l" || n === "r") { // the cross = the aim arrows: press = 1 degree, hold = sweep
      const dir = n === "l" ? -1 : 1;
      if (ev.down) { if (!(dir < 0 ? el.left.disabled : el.right.disabled)) aimStart(dir, null); }
      else if (aimDir === dir) aimStop();
      return;
    }
    if (ev.down) { audio(); buzz(12); return; }
    // the rest act on release, like a click (iOS shows its motion prompt only from a tap's end)
    if (n === "swing") doSwing();
    else if (n === "eye") doEye();
  }
  /** the DOM text screens sit in the pad's LCD (CSS px from the pad, which sits at the top of skinHost) */
  function placeScreen(rects) {
    const r = rects && rects.screen;
    if (!r || !skinHost) return;
    const hb = skinHost.getBoundingClientRect();
    const st = el.gp.style;
    st.setProperty("--gp-sx", `${hb.left + r.x}px`);
    st.setProperty("--gp-sy", `${hb.top + r.y}px`);
    st.setProperty("--gp-sw", `${r.w}px`);
    st.setProperty("--gp-sh", `${r.h}px`);
    el.gp.classList.add("gp-placed");
  }
  /** a DOM button's label in the pad's bitmap font (the text stays, hidden, for screen readers and tests) */
  function pixelButton(btn, on) {
    const lab0 = btn.querySelector(".fbx-plabel"), sr = btn.querySelector(".gp-sr");
    const txt = lab0 && sr ? sr.textContent : btn.textContent; // render() may have set plain text since
    if (!on) {
      if (lab0) btn.textContent = txt;
      delete btn.dataset.plk;
      return;
    }
    const k = `${skinStyle}|${txt}|${btn.clientWidth}`;
    if (lab0 && btn.dataset.plk === k) return;
    const maxW = Math.max(40, btn.clientWidth - 16), u = skinMod.artPx(), color = getComputedStyle(btn).color;
    let lab = null;
    for (const [font, px] of [["big", u], ["big", u * 0.75], ["small", u], ["big", u / 2], ["small", u * 0.75]]) {
      lab = skinMod.pixelLabel(txt, { font, px, color });
      if (lab && parseFloat(lab.style.width) <= maxW) break;
    }
    btn.dataset.plk = k;
    btn.innerHTML = `<span class="gp-sr">${esc(txt)}</span>`;
    if (lab) btn.append(lab);
  }
  function syncSkin() {
    if (!skinWanted()) {
      if (skin) { skin.release(); skin.destroy(); skin = null; }
      if (skinLayer) { skinLayer.remove(); skinLayer = skinHost = null; }
      if (skinStyle) {
        skinStyle = "";
        root.classList.remove("gp-skin-on");
        el.gp.classList.remove("gp-skinned", "gp-placed");
        for (const b of root.querySelectorAll(".gp-btn")) pixelButton(b, false);
      }
      return;
    }
    const style = skinMod.skinId();
    if (!skinLayer) {
      skinLayer = document.createElement("div");
      skinLayer.className = "gp-skin";
      skinLayer.innerHTML = `<div class="gp-skin-host" data-test="golf-skin"></div>`;
      skinHost = skinLayer.firstChild;
      root.prepend(skinLayer);
    }
    skinLayer.style.setProperty("--gp-safe-t", `${safeTop()}px`);
    if (style !== skinStyle) {
      skinStyle = style;
      skinMod.applySkinVars?.(root, style);
      root.style.setProperty("--u", `${skinMod.artPx ? skinMod.artPx() : 4}px`);
      root.classList.add("gp-skin-on");
      el.gp.classList.add("gp-skinned");
    }
    if (!skin) skin = skinMod.createPadSkin(skinHost, { style, game: "golf", vibrate: false, onInput: skinInput, onRects: placeScreen });
    skin.setStyle(style);
    const d = skinData();
    skin.set(d);
    if (screen !== "aim" && skinMod.pixelLabel) for (const b of el.gp.querySelectorAll(".gp-btn:not([hidden])")) if (b.offsetParent || b.getClientRects().length) pixelButton(b, true);
  }
  loadSkin().then((m) => {
    skinMod = m;
    if (m) syncSkin();
  });
  window.addEventListener("foxbox:pad-skin", () => { if (skin) skin.release(); syncSkin(); });
  // the phone turned: aim <-> TURN YOUR PHONE UPRIGHT (render() also re-lays the pixel pad)
  const onTurn = () => { if (shown) render(); else if (skinLayer) syncSkin(); };
  window.addEventListener("resize", onTurn);
  try { window.matchMedia?.(SIDEWAYS_MQ).addEventListener?.("change", onTurn); } catch {}

  // read-only test hook (CONTRACT.md)
  window.__golfPad = {
    get screen() { return screen; },
    get phase() { return view?.phase || null; },
    get isYourTurn() { return !!view?.isYourTurn; },
    get held() { return { sideways: heldSideways(), readings: tilt.n, fresh: performance.now() - tilt.at < TILT_FRESH_MS, landWindow: landWindow(), turned: turnDeg }; },
    get motion() { return motion; },
    get armed() { return armed; },
    get ready() { return ready; },
    get pose() { return pose; },
    get lastSwing() { return lastSwing && { ...lastSwing }; },
    get swings() { return swings; },
    get view() { return view && JSON.parse(JSON.stringify(view)); },
    get birdseye() { return !!view?.birdseye; },
    get skin() { return skin; }, // SKINS: the pixel pad (null = no pad up): regions, grid, style
    get skinLcd() { return skin ? skinLcdNow && { ...skinLcdNow } : null; }, // SKINS: the aim LCD's lines (goal, aim, wind)
    get setup() { return setupInfo ? { picker: setupInfo.picker, map: setupInfo.lobby?.golf?.map ?? null } : null; },
    get cards() { return { on: screen === "cards", index: cardIdx, done: cardsDone, tv: !!view?.cards }; }, // the intro cards
    get pics() { return [...pics].filter(([box]) => box.getClientRects().length).map(([box, e]) => ({ name: box.dataset.pic, loop: e.scene.still ? 0 : e.scene.loop, k: e.k })); },
    /** stepped capture: draw the pictures at ms into their loop and stop their own clock; null = run again */
    setClock(ms) {
      picClock = ms == null ? null : +ms || 0;
      if (picClock == null) picT0 = performance.now();
      drawPics(true);
    },
  };

  // ── golf setup: the map choice (Lakota: "let whoever is picking the game pick the map") ──
  const MAP_CARDS = [["sunny", "SUNNY RANGE"], ["sunset", "SUNSET LINKS"], ["night", "NIGHT LIGHTS"], ["candy", "CANDY COURSE"], ["random", "RANDOM"]];
  let setupInfo = null, setupHtml = "", setupWant = null, setupSentAt = 0;
  const imgOf = (id) => { try { return new URL(`./map-${id}.png`, import.meta.url).href; } catch { return `map-${id}.png`; } };
  function renderSetup() {
    const info = setupInfo;
    if (!info || !info.el) return;
    const lob = info.lobby || {}, cards = (lob.golf && lob.golf.maps) || MAP_CARDS.map(([id, name]) => ({ id, name }));
    const list = cards.some((c) => c.id === "random") ? cards : [...cards, { id: "random", name: "RANDOM" }];
    const chosen = performance.now() - setupSentAt < 1500 && setupWant ? setupWant : (lob.golf && lob.golf.map) || "random";
    const picker = (lob.players || []).find((p) => p.id === lob.pickerId);
    const name = (list.find((c) => c.id === chosen) || {}).name || "RANDOM";
    const head = info.picker ? "PICK THE MAP" : `${esc((picker && picker.name) || "THE PICKER")} PICKS THE MAP`;
    const htmlNow = `<div class="gs-head">${head}</div><div class="gs-grid" data-test="golf-maps">${list.map((c) =>
      `<button type="button" class="gs-card${c.id === chosen ? " on" : ""}" data-test="golf-map-${esc(c.id)}" data-map="${esc(c.id)}"${info.picker ? "" : " disabled"} aria-pressed="${c.id === chosen}"><img alt="" src="${esc(imgOf(c.id))}"><span>${esc(c.name)}</span></button>`).join("")}</div>
      <div class="gs-note" data-test="golf-map-chosen">MAP: ${esc(name)}${info.picker ? " · THEN START" : ""}</div>`;
    if (htmlNow !== setupHtml) { info.el.innerHTML = htmlNow; setupHtml = htmlNow; }
  }
  function onSetupClick(e) {
    const b = e.target.closest && e.target.closest("[data-map]");
    if (!b || !setupInfo || !setupInfo.picker || b.disabled) return;
    setupWant = b.dataset.map;
    setupSentAt = performance.now();
    send({ type: "map", id: setupWant });
    buzz(15);
    renderSetup();
  }

  return {
    onMessage(m) {
      if (m && m.type === "view") onView(m);
    },
    show(on, st) {
      status = st || null;
      const was = shown;
      shown = !!on;
      if (shown && !was) send({ type: "hello", hidden: !!document.hidden }); // the game answers with this phone's view at once
      tiltListen(shown); // which way the phone is held (Android: at once; iOS: once SWING got motion access)
      if (!shown && was) {
        aimStop();
        motionOff();
        armed = false;
        staleRound = roundId; // (the next countdown must not put this round's leftover view on the pad: cardsUp)
      }
      if (shown) render();
      else {
        screen = "off";
        applyTurn();
        syncSkin(); // SKINS: the pad goes with the round
      }
    },
    release() {
      aimStop();
      if (skin) skin.release(); // SKINS
    },
    /** golf's setup screen (pad.js): null = hidden, else { el, lobby, picker } */
    setup(info) {
      const el2 = info && info.el;
      if (setupInfo && setupInfo.el && setupInfo.el !== el2) setupInfo.el.removeEventListener("click", onSetupClick);
      if (el2 && (!setupInfo || setupInfo.el !== el2)) el2.addEventListener("click", onSetupClick);
      setupInfo = info || null;
      if (!info) { setupHtml = ""; return; }
      renderSetup();
    },
  };
}
