/**
 * tennis-pad.js: FOX TENNIS's phone controller (same shape as TEE TIME's golf-pad.js; would sync to the package as
 * dev/party/tennis/tennis-pad.js + swing.js):
 *   const pad = createTennisPad(rootEl, { send(m), me() });
 *   pad.show(on, status)   // on = countdown / playing
 *   pad.onMessage(m)       // every {t:"game", m} from the TV ({type:"view"} / {type:"pong"})
 *   pad.release()          // window blur
 *
 * Flow (Lakota: simple): PLAY (a real click: iOS motion permission) -> hold the phone like a racket handle, hold still
 * -> READY. Then the gyro stays on for the match: every swing is sent with its moment on the TV's clock (ping/pong
 * offset), its power and forehand / backhand. Players run on their own; you only swing. No motion = a big tap button.
 * Test hook: window.__tennisPad (read-only + fakeSwing), DOM data-test ids: see CONTRACT.md.
 */
import { createSwingDetector, createClockSync, tuneFromUrl, SWING } from "./swing.js";

const fin = (v) => typeof v === "number" && Number.isFinite(v);
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const PT = ["0", "15", "30", "40"];
const SWING_HARD = 0.72; // power above this = a big hit (src/config.js POWER.hard)

// ── pixel sprites (inline SVG from character maps, like golf-pad.js) ──
const INK = "#0a1428";
const MAPS = {
  player: [ // front view, racket up on the right (C = your slot colour)
    "....OOOOOO......", "...OHHHHHHO.OOO.", "...OCCCCCCOOFFFO", "...OSOSSOSOOFGFO", "...OSSSSSSOOFGFO", "....OOSSOO.OFFO.",
    "...OCCCCCCO..OO.", "..OCCCCCCCCOOO..", "..OSCCCCCCSSO...", "..OSOWWWWO.O....", "...OOWWWWOO.....", "....OSSOSSO.....", "....OSO.OSO.....", "...OWWO.OWWO....", "...OOOO.OOOO....",
  ],
  grip: [ // a hand round a phone held upright, like a racket handle
    "....OOOOO....", "...OKKKKKO...", "...OKBBBKO...", "...OKBBBKO...", "...OKBBBKO...", "...OKBBBKO...", "..OOKBBBKOO..", ".OSSKKKKKSSO.",
    ".OSSSSSSSSSO.", "OSSOSSSSSSSO.", "OSSOSSSSSSO..", ".OSSSSSSSSO..", "..OSSSSSSO...", "...OCCCCO....", "...OCCCCO....", "...OOOOOO....",
  ],
  ball: [".OOO.", "OYYYO", "OYWYO", "OYYYO", ".OOO."],
};
const BASE = { O: INK, S: "#f2c79b", H: "#5b3a1e", W: "#ffffff", K: "#26304a", B: "#5bb2ff", F: "#cfe3ff", G: "#e9ecf4", Y: "#e8f53f" };
function shade(hex, amt) {
  const n = parseInt(String(hex).replace("#", ""), 16);
  if (!Number.isFinite(n)) return hex;
  const t = amt > 0 ? 255 : 0, k = Math.abs(amt), ch = (s) => Math.round(((n >> s) & 255) * (1 - k) + t * k);
  return "#" + [16, 8, 0].map((s) => ch(s).toString(16).padStart(2, "0")).join("");
}
/** A slot colour lifted toward white when it is too dark to read on navy (the TV's readable()). */
function readable(hex) {
  const n = parseInt(String(hex || "").replace("#", ""), 16);
  if (!Number.isFinite(n)) return hex || "#fff";
  const l = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return l >= 0.58 ? hex : shade(hex, Math.min(0.6, (0.58 - l) / (1 - l)));
}
function sprite(name, scale = 3, color = "#ff5a3c", cls = "") {
  const rows = MAPS[name];
  if (!rows) return "";
  const pal = { ...BASE, C: color, F: shade(color, 0.45) };
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
  return `<svg class="tp-px ${cls}" viewBox="0 0 ${w} ${h}" width="${w * scale}" height="${h * scale}" shape-rendering="crispEdges" aria-hidden="true">${paths}</svg>`;
}

const CSS = `
#pad-screen.tennis #controls { flex: 1 1 auto !important; height: auto !important; }
#tennis .tp { position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 10px; color: #fff;
  font-family: "FoxBox Pixel", ui-monospace, monospace; -webkit-user-select: none; user-select: none; }
#tennis .tp-px { display: block; image-rendering: pixelated; }
#tennis .tp-frame { background: #0a1428e6; box-shadow: 0 -4px 0 0 #0a1428, 0 4px 0 0 #0a1428, -4px 0 0 0 #0a1428, 4px 0 0 0 #0a1428,
  inset 0 0 0 3px var(--tp-edge, #ffffff2e); margin: 4px; padding: 10px 12px; }
#tennis .tp-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 10px; line-height: 1.4; color: #ffd23f; }
#tennis .tp-score { display: grid; grid-template-columns: 18px minmax(0,1fr) 34px 44px; gap: 6px 8px; align-items: center; font-size: 12px; }
#tennis .tp-score .nm { font-family: "FoxBox Soft", ui-rounded, system-ui, sans-serif; font-weight: 700; font-size: 17px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#tennis .tp-score .gm { text-align: center; }
#tennis .tp-score .pt { text-align: center; background: #ffd23f; color: #0a1428; padding: 4px 0; }
#tennis .tp-score .sv { width: 12px; height: 12px; background: #e8f53f; box-shadow: 0 0 0 2px #0a1428; justify-self: center; }
#tennis .tp-s { display: none; flex: 1; min-height: 0; flex-direction: column; gap: 12px; align-items: stretch; text-align: center; }
#tennis .tp-s::before { content: ""; margin-top: auto; }
#tennis .tp-s::after { content: ""; margin-bottom: auto; }
#tennis .tp[data-screen="wait"] .tp-wait, #tennis .tp[data-screen="ready"] .tp-ready, #tennis .tp[data-screen="play"] .tp-play,
#tennis .tp[data-screen="point"] .tp-point, #tennis .tp[data-screen="bracket"] .tp-bracket, #tennis .tp[data-screen="done"] .tp-bracket { display: flex; }
#tennis .tp-big { font-size: clamp(20px, 7vw, 32px); line-height: 1.3; color: #ffd23f; text-shadow: 3px 3px 0 #0a1428; }
#tennis .tp-mid { font-size: clamp(11px, 3.6vw, 15px); line-height: 1.6; }
#tennis .tp-small { font-size: 9px; line-height: 1.7; color: #c9d2e6; }
#tennis .tp-soft { font-family: "FoxBox Soft", ui-rounded, system-ui, sans-serif; font-weight: 700; font-size: 17px; line-height: 1.35; }
#tennis .tp-pic { display: flex; justify-content: center; }
#tennis .tp-pic .tp-px { width: min(34vw, 132px); height: auto; }
#tennis .tp-btn { appearance: none; border: 0; border-radius: 0; font: inherit; color: #0a1428; cursor: pointer; touch-action: manipulation;
  background: var(--tp-bg, #ffd23f); box-shadow: 0 -4px 0 0 #0a1428, 0 4px 0 0 #0a1428, -4px 0 0 0 #0a1428, 4px 0 0 0 #0a1428, inset 0 -6px 0 0 #0000003a, 0 10px 0 0 #0a142899; }
#tennis .tp-btn:active, #tennis .tp-btn.down { transform: translateY(5px); }
#tennis .tp-play-btn { min-height: 110px; font-size: clamp(26px, 9vw, 40px); --tp-bg: #35d07f; }
#tennis .tp-tap { min-height: 46vh; font-size: clamp(30px, 11vw, 48px); --tp-bg: #ffd23f; touch-action: none; }
#tennis .tp-link { --tp-bg: #c9d2e6; font-size: 11px; padding: 12px 14px; align-self: center; }
#tennis .tp-hand { display: flex; gap: 12px; justify-content: center; }
#tennis .tp-hand .tp-btn { font-size: 11px; padding: 12px 14px; --tp-bg: #c9d2e6; }
#tennis .tp-hand .tp-btn.on { --tp-bg: #ffd23f; }
#tennis .tp-state { font-size: clamp(16px, 5.5vw, 22px); line-height: 1.4; padding: 14px 10px; color: #c9d2e6; }
#tennis .tp-state.on { color: #0a1428; background: #35d07f; }
#tennis .tp-cue { font-size: clamp(30px, 11vw, 52px); line-height: 1.2; padding: 26px 8px; color: #fff; text-shadow: 4px 4px 0 #0a1428; }
#tennis .tp-cue.hot { background: #ffd23f; color: #0a1428; text-shadow: none; animation: tp-flash 0.3s steps(2, end) infinite; }
#tennis .tp-cue.serve { background: #35d07f; color: #0a1428; text-shadow: none; }
@keyframes tp-flash { 50% { background: #ffffff; } }
#tennis .tp-cue.smash { background: #ff5a3c; color: #ffffff; text-shadow: 4px 4px 0 #0a1428; animation: tp-flash 0.2s steps(2, end) infinite; }
/* the swing flash: the whole pad lights up in your colour, a power bar fills, then the TV's verdict */
#tennis .tp-fx { position: absolute; inset: 0; pointer-events: none; display: none; flex-direction: column; align-items: center; justify-content: center; gap: 18px; z-index: 5; }
#tennis .tp-fx.on { display: flex; }
#tennis .tp-fx.word-on { background: #0a1428eb; }
#tennis .tp-fx .bg { position: absolute; inset: 0; background: var(--tp-fx, #35d07f); opacity: 0.0; }
#tennis .tp-fx.on .bg { animation: tp-fxbg 0.42s steps(4, end) forwards; }
@keyframes tp-fxbg { 0% { opacity: 0.85; } 100% { opacity: 0; } }
#tennis .tp-fx .meter { position: relative; display: flex; gap: 6px; padding: 10px; background: #0a1428; box-shadow: 0 0 0 4px #ffffff; }
#tennis .tp-fx .meter i { width: 22px; height: 44px; background: #2a3550; }
#tennis .tp-fx .meter i.on { background: var(--c, #35d07f); }
#tennis .tp-fx .word { position: relative; font-size: clamp(30px, 11vw, 52px); line-height: 1.2; color: #ffffff; text-shadow: 4px 4px 0 #0a1428; padding: 8px 14px; background: #0a1428cc; }
#tennis .tp-fx .word:empty { display: none; }
#tennis .tp-fx .word.perfect { color: #ffd23f; }
#tennis .tp-fx .word.miss { color: #ff8a75; }
#tennis .tp-note { font-family: "FoxBox Soft", ui-rounded, system-ui, sans-serif; font-weight: 700; font-size: 15px; color: #ffb4a6; }
#tennis .tp-note:empty { display: none; }
#tennis .tp-br { display: flex; flex-direction: column; gap: 6px; font-size: 10px; text-align: left; }
#tennis .tp-br .rn { color: #ffd23f; margin-top: 6px; }
#tennis .tp-br .m { display: grid; grid-template-columns: minmax(0,1fr) 22px minmax(0,1fr) 44px; gap: 6px; align-items: baseline; }
#tennis .tp-br .m span { font-family: "FoxBox Soft", ui-rounded, system-ui, sans-serif; font-weight: 700; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#tennis .tp-br .m .lost { opacity: 0.45; text-decoration: line-through; }
#tennis .tp-br .m.me { background: #35d07f33; }
`;

export function createTennisPad(root, { send, me }) {
  if (!document.getElementById("tennis-pad-css")) {
    const st = document.createElement("style");
    st.id = "tennis-pad-css";
    st.textContent = CSS;
    document.head.append(st);
  }
  root.innerHTML = `
  <div class="tp" data-test="tennis-screen" data-screen="wait">
    <div class="tp-head tp-frame"><span class="tp-label">FOX TENNIS</span><span class="tp-you"></span></div>
    <div class="tp-score tp-frame" data-test="tennis-score" hidden></div>
    <section class="tp-s tp-wait">
      <div class="tp-pic tp-wait-pic"></div>
      <div class="tp-big tp-wait-title">GET READY!</div>
      <div class="tp-mid tp-wait-sub">LOOK AT THE TV</div>
    </section>
    <section class="tp-s tp-ready">
      <div class="tp-pic tp-ready-pic"></div>
      <div class="tp-mid tp-ready-title">HOLD YOUR PHONE LIKE A RACKET</div>
      <div class="tp-soft">Tight grip, screen facing sideways. Swing it like a forehand or a backhand!</div>
      <button type="button" class="tp-btn tp-play-btn" data-test="tennis-play" data-native>PLAY</button>
      <div class="tp-state tp-frame" data-test="tennis-ready" hidden>HOLD STILL...</div>
      <div class="tp-hand"><button type="button" class="tp-btn" data-hand="right" data-native data-test="tennis-righty">RIGHTY</button><button type="button" class="tp-btn" data-hand="left" data-native data-test="tennis-lefty">LEFTY</button></div>
      <div class="tp-note"></div>
      <button type="button" class="tp-btn tp-link tp-tapmode" data-test="tennis-tapmode" data-native hidden>USE TAP TO SWING</button>
    </section>
    <section class="tp-s tp-play">
      <div class="tp-pic tp-play-pic"></div>
      <div class="tp-cue tp-frame" data-test="tennis-cue">GET READY</div>
      <div class="tp-mid tp-play-sub"></div>
      <button type="button" class="tp-btn tp-tap" data-test="tennis-tap" hidden>SWING!</button>
    </section>
    <div class="tp-fx" data-test="tennis-fx"><div class="bg"></div><div class="meter"></div><div class="word" data-test="tennis-verdict"></div></div>
    <section class="tp-s tp-point">
      <div class="tp-mid tp-pt-who"></div>
      <div class="tp-big tp-pt-title"></div>
      <div class="tp-mid tp-pt-call"></div>
    </section>
    <section class="tp-s tp-bracket">
      <div class="tp-big tp-br-title">TOURNAMENT</div>
      <div class="tp-br tp-frame"></div>
      <div class="tp-mid tp-br-me"></div>
    </section>
  </div>`;
  const $ = (s) => root.querySelector(s);
  const el = {
    tp: $(".tp"), label: $(".tp-label"), you: $(".tp-you"), score: $(".tp-score"),
    waitPic: $(".tp-wait-pic"), waitTitle: $(".tp-wait-title"), waitSub: $(".tp-wait-sub"),
    readyPic: $(".tp-ready-pic"), play: $(".tp-play-btn"), state: $(".tp-state"), note: $(".tp-note"), tapmode: $(".tp-tapmode"), hands: [...root.querySelectorAll("[data-hand]")],
    playPic: $(".tp-play-pic"), cue: $(".tp-cue"), playSub: $(".tp-play-sub"), tap: $(".tp-tap"),
    fx: $(".tp-fx"), meter: $(".tp-fx .meter"), word: $(".tp-fx .word"),
    ptWho: $(".tp-pt-who"), ptTitle: $(".tp-pt-title"), ptCall: $(".tp-pt-call"), brTitle: $(".tp-br-title"), br: $(".tp-br"), brMe: $(".tp-br-me"),
  };
  let shown = false, status = null, view = null, screen = "off";
  let motion = "off"; // off | asking | on | denied | unavailable | insecure | nodata | tap
  let ready = false, lastSwing = null, swings = 0, hand = "right";
  try { hand = localStorage.getItem("fox-tennis-hand") === "left" ? "left" : "right"; } catch {}
  const tuned = tuneFromUrl(); // ?swing.OPEN_DPS=350 ... (phone/swing.js SWING)
  const sync = createClockSync();
  const det = createSwingDetector({ ios: isIOS, hand, onSwing: (s) => swingOut(s), onStill: () => setReady(true) });

  // ── sound: a whoosh for the swing, a tick on READY, a chime when the ball is yours (the phone only) ──
  let ac = null;
  function audio() {
    const Cx = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Cx) return null;
    try { if (!ac) ac = new Cx(); if (ac.state === "suspended") ac.resume().catch(() => {}); } catch { return null; }
    return ac;
  }
  function tone(f, dur, { type = "square", gain = 0.05, delay = 0 } = {}) {
    const c = audio();
    if (!c || c.state !== "running") return;
    const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function whoosh(power) {
    const c = audio();
    if (!c || c.state !== "running") return;
    const dur = 0.26, t = c.currentTime, buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / d.length);
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf; f.type = "bandpass"; f.Q.value = 1.2;
    f.frequency.setValueAtTime(600, t); f.frequency.exponentialRampToValueAtTime(1800 + power * 2400, t + dur * 0.6);
    g.gain.setValueAtTime(0.25 + power * 0.35, t);
    src.connect(f).connect(g).connect(c.destination); src.start(t); src.stop(t + dur + 0.02);
  }
  const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch {} };
  // ── swing feedback: a flash in your colour + a power bar the moment the phone sees the swing, then the TV's verdict
  // (PERFECT! / EARLY / LATE / MISS) when it comes back. Haptics where the phone has them (Android; iPhones have none
  // for the web, so the flash is the main cue). ──
  const BAR = ["#5bb2ff", "#5bb2ff", "#35d07f", "#35d07f", "#ffd23f", "#ffd23f", "#ff9b3d", "#ff5a3c"];
  let fxTimer = 0, lastCueId = null, verdict = null;
  function flash(power, word = "", cls = "") {
    el.fx.style.setProperty("--tp-fx", view?.you?.color || "#35d07f");
    const n = Math.max(1, Math.round(power * 8));
    el.meter.innerHTML = BAR.map((c, i) => `<i class="${i < n ? "on" : ""}" style="--c:${c}"></i>`).join("");
    el.meter.hidden = power <= 0;
    el.word.textContent = word;
    el.word.className = `word ${cls}`;
    el.fx.classList.toggle("word-on", !!word);
    el.fx.classList.remove("on");
    void el.fx.offsetWidth; // restart the flash animation
    el.fx.classList.add("on");
    clearTimeout(fxTimer);
    fxTimer = setTimeout(() => el.fx.classList.remove("on"), word ? 1300 : 650);
  }
  function showVerdict(c) {
    const cls = c.quality === "perfect" ? "perfect" : c.quality === "early" || c.quality === "late" ? "" : "miss";
    verdict = { ...c };
    flash(c.power || 0, c.text, cls);
    buzz(cls === "perfect" ? [20, 40, 20, 40, 60] : cls === "miss" ? [140] : [35]);
  }
  for (const ev of ["touchend", "pointerup", "click"]) root.addEventListener(ev, () => audio(), { passive: true });

  // ── the TV's clock: ping every 2 s (5 quick ones after show), keep the shortest round trip ──
  let pingTimer = null;
  const ping = () => send({ type: "ping", c: performance.now() });
  function pings(on) {
    clearInterval(pingTimer);
    pingTimer = null;
    if (!on) return;
    for (let i = 0; i < 5; i++) setTimeout(ping, i * 150);
    pingTimer = setInterval(ping, 2000);
  }
  const tvTime = (phoneMs) => (sync.offset == null ? null : phoneMs + sync.offset);

  // ── motion ──
  const hasMotion = typeof window.DeviceMotionEvent !== "undefined";
  const needsPermission = hasMotion && typeof DeviceMotionEvent.requestPermission === "function";
  let permission = needsPermission ? "unknown" : "granted", listening = false, gotData = false, noDataTimer = null;
  function setMotion(m) {
    if (motion === m) return;
    motion = m;
    const st = { on: "granted", denied: "denied", unavailable: "unavailable", insecure: "insecure", asking: "prompt", tap: "tap" }[m];
    if (st) send({ type: "motion", state: st });
    render();
  }
  function onMotion(e) {
    if (document.hidden) return;
    const gi = e.accelerationIncludingGravity || {}, rr = e.rotationRate || {}, acc = e.acceleration;
    if (![gi.x, gi.y, gi.z, rr.alpha, rr.beta, rr.gamma].some(fin)) return;
    if (!gotData) { gotData = true; clearTimeout(noDataTimer); if (motion !== "on") setMotion("on"); }
    det.feed({ t: fin(e.timeStamp) && e.timeStamp > 0 ? e.timeStamp : performance.now(), gi, rr, acc: acc && [acc.x, acc.y, acc.z].some(fin) ? acc : null });
  }
  function listen(on) {
    if (on && !listening) { listening = true; window.addEventListener("devicemotion", onMotion); }
    else if (!on && listening) { listening = false; window.removeEventListener("devicemotion", onMotion); }
  }
  function motionOn() {
    gotData = false;
    clearTimeout(noDataTimer);
    if (!window.isSecureContext && location.hostname !== "127.0.0.1" && location.hostname !== "localhost") return setMotion("insecure");
    if (!hasMotion) return setMotion("unavailable");
    const go = () => {
      setMotion("on");
      listen(true);
      det.resetStill();
      noDataTimer = setTimeout(() => { if (!gotData) setMotion("nodata"); }, 1800);
    };
    if (permission === "granted") return go();
    setMotion("asking");
    let p;
    try { p = DeviceMotionEvent.requestPermission(); } catch { return setMotion("denied"); } // must run inside the click
    Promise.resolve(p).then((res) => { permission = res === "granted" ? "granted" : "denied"; permission === "granted" ? go() : setMotion("denied"); }, () => setMotion("denied"));
  }
  function setReady(on) {
    if (ready === on) return;
    ready = on;
    send({ type: "ready", ready: on });
    if (on) { tone(1320, 0.07, { gain: 0.06 }); tone(1760, 0.09, { gain: 0.05, delay: 0.08 }); buzz(40); }
    render();
  }
  function swingOut(s) {
    // the TV only cares while we're on court; the moment goes out on the TV's clock
    if (!view || !view.you?.playing || !["serve", "serve2", "rally"].includes(view.phase)) return;
    const at = tvTime(s.t);
    lastSwing = { ...s, at, offset: sync.offset, rtt: sync.rtt };
    swings++;
    send({ type: "swing", at, power: s.power, stroke: s.stroke, peakDps: s.peakDps, peakLin: s.peakLin, yaw: s.yaw, tap: !!s.tap });
    whoosh(s.power);
    buzz(s.power > SWING_HARD ? [70, 30, 45] : s.power > 0.35 ? [50] : [25]);
    flash(s.power);
    render();
  }

  // ── buttons ──
  el.play.addEventListener("click", () => {
    audio();
    send({ type: "hand", hand });
    motionOn();
    render();
  });
  for (const b of el.hands) b.addEventListener("click", () => {
    hand = b.dataset.hand === "left" ? "left" : "right";
    try { localStorage.setItem("fox-tennis-hand", hand); } catch {}
    det.setHand(hand);
    send({ type: "hand", hand });
    render();
  });
  el.tapmode.addEventListener("click", () => { listen(false); setMotion("tap"); setReady(true); });
  el.tap.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    el.tap.classList.add("down");
    swingOut({ t: performance.now(), power: 0.55, stroke: null, peakDps: 0, peakLin: 0, yaw: 0, tap: true });
  });
  for (const t of ["pointerup", "pointercancel"]) el.tap.addEventListener(t, () => el.tap.classList.remove("down"));

  // ── the TV's view -> the screen ──
  let lastBallKey = "";
  function onView(v) {
    if (view && v.roundId === view.roundId && v.seq <= view.seq) return;
    if (!view || v.roundId !== view.roundId) { /* a new game: keep the gyro + READY (you're still holding it) */ }
    view = v;
    const key = v.yourBall ? `${v.match?.no}:${v.match?.games}:${v.match?.points}:${v.stroke}` : "";
    if (key && key !== lastBallKey) { tone(988, 0.06, { gain: 0.04 }); buzz(25); }
    lastBallKey = key;
    if (v.cue && v.cue.id !== lastCueId) { lastCueId = v.cue.id; showVerdict(v.cue); }
    render();
  }
  function screenNow() {
    if (!shown) return "off";
    const v = view;
    if (!v || !status || status.state === "countdown") return "wait";
    if (v.phase === "done") return "done";
    if (v.phase === "bracket") return "bracket";
    if (!v.you?.playing) return v.bracket ? "bracket" : "wait";
    const needReady = !ready && motion !== "tap";
    if (v.phase === "intro" || needReady && ["serve", "serve2"].includes(v.phase)) return needReady ? "ready" : "wait";
    if (v.phase === "point" || v.phase === "game" || v.phase === "matchEnd") return "point";
    return "play";
  }
  function render() {
    const next = screenNow();
    screen = next;
    el.tp.dataset.screen = screen === "off" ? "wait" : screen;
    const v = view;
    const set = (n, t) => { if (n.textContent !== t) n.textContent = t; };
    const html = (n, h) => { if (n.dataset.h !== h) { n.innerHTML = h; n.dataset.h = h; } };
    const myColor = v?.you?.color || getComputedStyle(document.documentElement).getPropertyValue("--c").trim() || "#35d07f";
    set(el.you, v?.you ? v.you.name : "");
    const m = v?.match;
    set(el.label, m ? m.label : v?.gameName || "FOX TENNIS");
    el.score.hidden = !m || screen === "bracket" || screen === "done";
    if (m) {
      const deuce = m.points[0] >= 3 && m.points[1] >= 3;
      const pt = (i) => (m.pointsText ? m.pointsText[i] : deuce ? "40" : PT[Math.min(3, m.points[i])]);
      html(el.score, m.teams.map((t, i) => `<i class="${m.server.side === i ? "sv" : ""}"></i><span class="nm" style="color:${esc(readable(t.players[0].color))}">${esc(t.name)}</span><span class="gm">${m.games[i]}</span><span class="pt">${esc(pt(i))}</span>`).join(""));
    }
    if (screen === "wait") {
      html(el.waitPic, sprite("player", 6, myColor));
      if (!v || !status || status.state === "countdown") { set(el.waitTitle, "GET READY!"); set(el.waitSub, "LOOK AT THE TV"); }
      else { set(el.waitTitle, v.you?.playing ? "GET READY!" : "WATCHING"); set(el.waitSub, m ? `${m.teams[0].name} VS ${m.teams[1].name}` : "LOOK AT THE TV"); }
    } else if (screen === "ready") {
      html(el.readyPic, sprite("grip", 7, myColor));
      const on = motion === "on" && gotData;
      el.play.hidden = motion === "on" || motion === "asking";
      el.state.hidden = !(motion === "on" || motion === "asking");
      el.state.classList.toggle("on", ready);
      el.state.dataset.ready = ready ? "1" : "0";
      set(el.state, ready ? "READY!" : motion === "asking" ? "TAP ALLOW..." : on ? "HOLD STILL..." : "WAITING FOR MOTION...");
      for (const b of el.hands) b.classList.toggle("on", b.dataset.hand === hand);
      set(el.note, motion === "denied" ? "Motion is blocked. Tap PLAY again, or play with taps." : motion === "insecure" ? "Motion needs the secure link: scan the TV's QR code again."
        : motion === "unavailable" ? "No motion sensor here: play with taps!" : motion === "nodata" ? "No motion readings (Settings > Safari > Motion & Orientation Access)." : "");
      el.tapmode.hidden = !["denied", "insecure", "unavailable", "nodata"].includes(motion);
    } else if (screen === "play") {
      html(el.playPic, sprite("player", 5, myColor));
      let cue = "GET READY", cls = "", sub = "";
      if (v.yourServe) { cue = "YOUR SERVE: SWING!"; cls = "serve"; sub = v.match.serveN === 2 ? "SECOND SERVE" : "SWING WHEN THE BALL IS UP"; }
      else if (v.yourBall && v.smash) { cue = "▲ SMASH IT! ▲"; cls = "smash"; sub = "HIGH BALL: SWING HARD"; }
      else if (v.yourBall) {
        // the side only matters when the TV says so (src/config.js WRONG_SIDE); the arrow still shows where the ball is
        cue = v.sideMatters ? (v.stroke === "backhand" ? "◀ BACKHAND!" : "FOREHAND! ▶") : v.stroke === "backhand" ? "◀ SWING!" : "SWING! ▶";
        cls = "hot"; sub = "SWING AS IT REACHES YOU";
      }
      else if (v.phase === "serve" || v.phase === "serve2") { cue = `${esc(v.match.server.name)} SERVES`; sub = "GET READY"; }
      else if (v.phase === "rally") { cue = "RALLY!"; sub = "WATCH THE BALL"; }
      set(el.cue, cue);
      el.cue.className = `tp-cue tp-frame ${cls}`;
      set(el.playSub, sub);
      el.tap.hidden = motion !== "tap";
    } else if (screen === "point") {
      const last = v.last;
      set(el.ptWho, last ? (last.wonByYou ? "YOUR POINT!" : "THEIR POINT") : "");
      set(el.ptTitle, v.banner?.title || last?.title || "");
      set(el.ptCall, v.banner?.sub || last?.call || "");
      el.ptWho.style.color = last?.wonByYou ? "#35d07f" : "#ff8a75";
    } else if (screen === "bracket" || screen === "done") {
      const b = v.bracket;
      set(el.brTitle, screen === "done" ? (b?.champion ? `${b.champion} WINS!` : "GAME OVER") : b ? "TOURNAMENT" : "WATCHING");
      if (b) {
        const pid = v.you?.playerId;
        html(el.br, b.rounds.map((r) => `<div class="rn">${esc(r.name)}</div>` + r.matches.filter((x) => !x.bye).map((x) => {
          const cl = (id) => (x.winner != null && x.winner !== id ? "lost" : "");
          return `<div class="m${x.aId === pid || x.bId === pid ? " me" : ""}"><span class="${cl(x.aId)}" style="color:${esc(readable(x.ac || "#8d9bbb"))}">${esc(x.a || "...")}</span><b>VS</b><span class="${cl(x.bId)}" style="color:${esc(readable(x.bc || "#8d9bbb"))}">${esc(x.b || "...")}</span><b>${esc(x.score || (x.now ? "NOW" : x.next ? "NEXT" : ""))}</b></div>`;
        }).join("")).join(""));
      }
      set(el.brMe, "");
    }
  }

  window.__tennisPad = {
    get screen() { return screen; }, get motion() { return motion; }, get ready() { return ready; }, get hand() { return hand; },
    get lastSwing() { return lastSwing && { ...lastSwing }; }, get swings() { return swings; },
    get offset() { return sync.offset; }, get verdict() { return verdict && { ...verdict }; }, get tune() { return { ...SWING, changed: tuned }; }, get rtt() { return sync.rtt; }, get view() { return view && JSON.parse(JSON.stringify(view)); },
    /** QA: a swing through the same path as the detector (timed now on this phone's clock). */
    fakeSwing({ power = 0.6, stroke = "forehand" } = {}) { swingOut({ t: performance.now(), power, stroke, peakDps: 0, peakLin: 0, yaw: 0, fake: true }); },
    /** QA: feed a raw reading to the detector. */
    feed(s) { det.feed(s); },
  };

  return {
    onMessage(m) {
      if (!m) return;
      if (m.type === "pong") sync.pong(m.c, m.s, performance.now());
      else if (m.type === "view") onView(m);
    },
    show(on, st) {
      status = st || null;
      const was = shown;
      shown = !!on;
      if (shown && !was) { send({ type: "hello" }); pings(true); }
      if (!shown && was) { pings(false); listen(false); }
      if (shown) render();
      else screen = "off";
    },
    release() {},
  };
}
