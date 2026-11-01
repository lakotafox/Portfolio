/**
 * row-train-pad.js — Row Row Rumble's TRAINING on the phone (the controls check before every race).
 *
 * The game (row-race, referee TV) sends every human {t:"game", m:{type:"rowTrain", v:1, phase, n, of, left, seat, mine,
 * done, strokes, need, tilt, auto, waiting}} on change and at least every 2 s (team-status/row-training-contract.md).
 * pad.js hands those here (mode.id === "row") and calls sync() from renderStatus. This module only draws an overlay on
 * top of the controller (pointer-events: none everywhere: FIRE, the aim stick and the tilt keep working); it never
 * changes the controllers themselves.
 *
 * Where the overlay sits (it lives inside #pad-screen, so cap-pad.js's .cap-rot and landscape.js's .land-rot turn it
 * with the controller):
 *   - first mate (#pad-screen.captain): at the top of the middle column (#cap-mid), between the aim stick and FIRE;
 *   - paddler, upright: inside the #status card, under the TRAINING line;
 *   - paddler, sideways (.land-rot or a landscape window): the empty left side of the paddle panel.
 *
 *   const rt = createRowTrainPad({ screen: #pad-screen, onChange })
 *   rt.onMessage(m)                      // a rowTrain message
 *   rt.sync({ state, seat, connected })  // every renderStatus (seat = "paddle" | "captain" | null)
 *   rt.on()                              // a training is running for this phone (state "playing", phase not "done")
 *   rt.statusLine()                      // the short line for pad.js's "playing" status (with S.status = TRAINING)
 * QA: window.__rowTrainPad = { last, visible(), on(), text() }.
 */

// ── every phone string, in one place. Seat ids are the game's: "paddle" = CAPTAIN (rows), "captain" = FIRST MATE. ──
export const S = {
  status: "TRAINING", // pad.js's big status line while a training is on
  tag: (n, of) => `TRAINING ${n}/${of}`,
  left: (s) => `${s}s`,
  mine: {
    paddle: { big: "PADDLE!", sub: "SWING YOUR PHONE LIKE A PADDLE", ok: "✓ PADDLE — NICE!", line: "Swing your phone like a paddle", okLine: "Nice! Waiting for the others" },
    steer: { big: "TILT TO STEER", sub: "TILT LEFT AND RIGHT", ok: "✓ STEER", line: "Tilt your phone left and right", okLine: "Nice! Waiting for the others" },
    fire: { big: "TAP FIRE!", sub: "THE BIG BUTTON", ok: "✓ FIRE", line: "Tap FIRE once", okLine: "Nice! Waiting for the others" },
  },
  other: {
    // a first mate while the captains paddle / a captain while the first mates steer or fire
    paddle: { big: "CAPTAINS ARE PRACTISING PADDLING…", sub: "YOU'RE NEXT", line: "Captains are paddling · you're next" },
    steer: { big: "FIRST MATES ARE PRACTISING STEERING", sub: "", line: "First mates are steering" },
    fire: { big: "FIRST MATES ARE PRACTISING FIRING", sub: "", line: "First mates are firing" },
  },
  waiting: (n) => `WAITING FOR ${n}`,
  auto: { away: "PASSED: PHONE AWAY", idle: "PASSED: NO MOVES SEEN", time: "PASSED: TIME UP", skip: "SKIPPED ON THE TV" },
  done: { big: "ALL SET!", sub: "WATCH THE TV", line: "Watch the TV 👀" },
};

const DONE_MS = 1800; // "ALL SET! WATCH THE TV" stays this long after phase "done"
const STALE_MS = 5000; // the game repeats its message every 2 s: nothing for this long = no training any more
const PHASES = ["paddle", "steer", "fire", "done"];
const SEATS = ["paddle", "captain"];

export function createRowTrainPad({ screen, onChange = () => {} }) {
  let last = null, lastAt = 0, doneUntil = 0, state = null, seat = null, connected = false;
  let el = null, place = "", shownKey = "", timer = null, prevOk = false;

  const now = () => Date.now();
  const on = () => !!(connected && state === "playing" && last && last.phase !== "done" && now() - lastAt < STALE_MS);
  const showingDone = () => !!(connected && (state === "playing" || state === "countdown") && now() < doneUntil);
  const visible = () => on() || showingDone();
  const mySeat = () => (SEATS.includes(last?.seat) ? last.seat : seat);
  const leftNow = () => (Number.isFinite(last?.left) ? Math.max(0, Math.round(last.left - (now() - lastAt) / 1000)) : null);
  const okMine = (m) => !!(m && m.done && m.done[m.phase] === 1);

  function statusLine() {
    if (!on()) return showingDone() ? S.done.line : "";
    const m = last;
    if (!m.mine) return (S.other[m.phase] || {}).line || "";
    const t = S.mine[m.phase] || {};
    return okMine(m) ? t.okLine : t.line;
  }

  function onMessage(m) {
    if (!m || typeof m !== "object" || !PHASES.includes(m.phase)) return;
    const wasOn = on();
    if (m.phase === "done" && last?.phase !== "done") doneUntil = now() + DONE_MS;
    last = m;
    lastAt = now();
    render();
    if (wasOn !== on()) onChange();
  }

  function sync(s) {
    const wasOn = on();
    if (s.state !== state && s.state !== "playing" && s.state !== "countdown") { last = null; doneUntil = 0; }
    if (s.state === "countdown" && state === "playing" && last && last.phase !== "done") last = null; // a new countdown: old training over
    state = s.state;
    seat = s.seat || null;
    connected = !!s.connected;
    render();
    if (wasOn !== on()) onChange();
  }

  // ── drawing ──
  function build() {
    injectCss();
    el = document.createElement("div");
    el.id = "rtp";
    el.dataset.test = "row-train";
    el.setAttribute("aria-live", "polite");
    el.innerHTML =
      '<div class="rtp-tag"><span class="rtp-n"></span><b class="rtp-left"></b></div>' +
      '<div class="rtp-anim" aria-hidden="true"><i class="rtp-phone"><i></i></i><i class="rtp-arrow">▶</i></div>' +
      '<div class="rtp-big"></div><div class="rtp-meter" aria-hidden="true"></div><div class="rtp-sub"></div><div class="rtp-note"></div>';
  }
  function placeFor() {
    if (screen.classList.contains("captain")) return "cap";
    if (screen.classList.contains("land-rot") || (!screen.classList.contains("cap-rot") && window.innerWidth > window.innerHeight)) return "side";
    return "status";
  }
  function mount(p) {
    const host = p === "cap" ? document.getElementById("cap-mid") : p === "status" ? document.getElementById("status") : screen;
    if (!host) return;
    if (p === "status") {
      const after = document.getElementById("status-small");
      if (el.parentNode !== host || el.previousElementSibling !== after) after && after.parentNode === host ? after.after(el) : host.append(el);
    } else if (p === "cap") {
      if (el.parentNode !== host || host.firstElementChild !== el) host.prepend(el);
    } else if (el.parentNode !== host) host.append(el);
    place = p;
    el.dataset.place = p;
  }
  function render() {
    const vis = visible();
    if (screen) screen.classList.toggle("rtp-on", vis);
    if (!vis) {
      if (el) el.hidden = true;
      clearInterval(timer);
      timer = null;
      shownKey = "";
      return;
    }
    if (!el) build();
    const p = placeFor();
    if (p !== place || !el.parentNode) mount(p);
    el.hidden = false;
    if (!timer) timer = setInterval(tick, 500);

    const m = last;
    const done = !on();
    const seatNow = mySeat();
    const phase = done ? "done" : m.phase;
    const mine = !done && !!m.mine;
    const ok = mine && okMine(m);
    el.dataset.phase = phase;
    el.dataset.seat = seatNow || "";
    el.dataset.mine = mine ? "1" : "0";
    el.dataset.ok = ok ? "1" : "0";
    el.classList.toggle("rtp-done", done);

    const q = (c) => el.querySelector(c);
    q(".rtp-n").textContent = done ? S.status : S.tag(m.n || 1, m.of || 1);
    const left = done ? null : leftNow();
    q(".rtp-left").textContent = left != null && left <= 10 ? S.left(left) : "";

    let big, sub, note = "";
    if (done) ({ big, sub } = S.done);
    else if (mine) {
      const t = S.mine[phase] || {};
      big = ok ? t.ok : t.big;
      sub = ok ? "" : t.sub;
    } else ({ big, sub } = S.other[phase] || { big: "", sub: "" });
    if (!done && m.auto && S.auto[m.auto]) note = S.auto[m.auto];
    else if (!done && Number(m.waiting) > 0 && (!mine || ok)) note = S.waiting(Number(m.waiting));
    setText(q(".rtp-big"), big, true);
    setText(q(".rtp-sub"), sub);
    setText(q(".rtp-note"), note);
    q(".rtp-note").classList.toggle("auto", !done && !!m.auto);

    // the meter: stroke dots (paddle) or ◀ ▶ (steer), lit by the referee's counts
    let meter = "";
    if (mine && phase === "paddle") {
      const need = Math.max(1, Math.min(9, Number(m.need) || 3)), got = Math.max(0, Math.min(need, Number(m.strokes) || 0));
      for (let i = 0; i < need; i++) meter += `<i class="dot${i < got ? " on" : ""}">${i < got ? "●" : "○"}</i>`;
    } else if (mine && phase === "steer") {
      meter = `<i class="lr${m.tilt?.l ? " on" : ""}">◀</i><i class="lr${m.tilt?.r ? " on" : ""}">▶</i>`;
    }
    const mt = q(".rtp-meter");
    if (mt.dataset.html !== meter) { mt.innerHTML = meter; mt.dataset.html = meter; }
    mt.hidden = !meter;

    // the ✓ pop when my check flips to done
    if (ok && !prevOk) {
      el.classList.remove("pop");
      void el.offsetWidth;
      el.classList.add("pop");
    }
    prevOk = ok;
    shownKey = `${phase}:${mine}:${ok}`;
  }
  function tick() {
    const wasOn = on();
    render();
    if (wasOn !== on() || !visible()) onChange();
  }

  const api = {
    onMessage, sync, on, visible, statusLine,
    get last() { return last; },
    text: () => (el && !el.hidden ? el.innerText.replace(/\s+/g, " ").trim() : ""),
  };
  window.__rowTrainPad = api;
  return api;
}

function setText(n, t, check = false) {
  if (n.dataset.t !== t) {
    n.dataset.t = t;
    // a leading ✓ in its own span: the pixel font has no ✓ glyph (the fallback font draws it bigger + bolder)
    if (check && t.startsWith("✓ ")) {
      n.textContent = "";
      const ck = document.createElement("span");
      ck.className = "ck";
      ck.textContent = "✓";
      n.append(ck, " " + t.slice(2));
    } else n.textContent = t;
  }
  n.hidden = !t;
}

// The look: the phone UI's pixel font + palette (pad.html's --px-* tokens), hard ink shadows like the round cue.
function injectCss() {
  if (document.getElementById("rtp-css")) return;
  const st = document.createElement("style");
  st.id = "rtp-css";
  st.textContent = `
#rtp, #rtp * { pointer-events: none !important; }
#rtp[hidden], #rtp [hidden] { display: none !important; }
#rtp {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  font-family: var(--px-font, "FoxBox Pixel", ui-monospace, monospace); color: #fff9f1; text-align: center;
  text-transform: uppercase; line-height: 1.35; letter-spacing: 0; overflow-wrap: anywhere;
  -webkit-user-select: none; user-select: none;
}
#rtp .rtp-tag { display: inline-flex; gap: 8px; align-items: center; padding: 4px 7px; font-size: 9px; color: var(--px-ink, #0a1428);
  background: var(--px-gold, #ffd23f); box-shadow: 0 3px 0 var(--px-gold-d, #e3a51a), 0 5px 0 var(--px-drop, #050a16); }
#rtp .rtp-left { color: var(--px-red-d, #c7361d); font-weight: 400; text-transform: none; }
#rtp .rtp-left:empty { display: none; }
#rtp .rtp-big { font-size: 16px; color: var(--px-gold, #ffd23f); text-shadow: 3px 3px 0 var(--px-ink, #0a1428); }
#rtp[data-mine="0"] .rtp-big { font-size: 11px; color: #fff9f1; }
#rtp[data-ok="1"] .rtp-big { color: var(--px-green, #35d07f); }
#rtp.rtp-done .rtp-big { font-size: 18px; color: var(--px-green, #35d07f); }
#rtp .rtp-sub { font-size: 9px; color: #c9d2e6; }
#rtp .rtp-note { font-size: 8px; padding: 3px 6px; color: #c9d2e6; background: rgba(5, 10, 22, 0.55); }
#rtp .rtp-note.auto { color: var(--px-gold-l, #fff3b0); }
#rtp .rtp-meter { display: flex; gap: 10px; justify-content: center; font-size: 20px; line-height: 1; }
#rtp .rtp-meter i { font-style: normal; color: rgba(255, 255, 255, 0.35); text-shadow: 2px 2px 0 var(--px-ink, #0a1428); }
#rtp .rtp-meter i.on { color: var(--px-gold, #ffd23f); }
#rtp .rtp-meter i.lr { font-size: 22px; padding: 4px 8px; background: rgba(5, 10, 22, 0.5); box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.25); }
#rtp .rtp-meter i.lr.on { color: var(--px-ink, #0a1428); background: var(--px-green, #35d07f); box-shadow: inset 0 0 0 3px var(--px-green-d, #1f9d5c); }

/* the little looping picture: a pixel phone (swung like a paddle / tilted / pointing at FIRE) */
#rtp .rtp-anim { position: relative; height: 46px; width: 76px; display: flex; align-items: center; justify-content: center; }
#rtp .rtp-phone { position: relative; display: block; width: 18px; height: 34px; background: var(--px-paper, #f4f7ff);
  box-shadow: 0 0 0 3px var(--px-ink, #0a1428), 3px 3px 0 3px var(--px-drop, #050a16); transform-origin: 50% 100%; }
#rtp .rtp-phone > i { position: absolute; inset: 3px 3px 6px; background: var(--c, #4a82e8); }
#rtp .rtp-arrow { display: none; position: absolute; right: -4px; font-style: normal; font-size: 18px; color: var(--px-gold, #ffd23f);
  text-shadow: 2px 2px 0 var(--px-ink, #0a1428); }
#rtp[data-phase="paddle"][data-mine="1"] .rtp-phone { animation: rtp-paddle 1.1s ease-in-out infinite; }
#rtp[data-phase="steer"][data-mine="1"] .rtp-phone { width: 34px; height: 18px; transform-origin: 50% 50%; animation: rtp-tilt 1.6s ease-in-out infinite; }
#rtp[data-phase="fire"][data-mine="1"] .rtp-phone,
#rtp[data-mine="0"] .rtp-phone, #rtp.rtp-done .rtp-phone { width: 34px; height: 18px; }
#rtp[data-phase="fire"][data-mine="1"] .rtp-arrow { display: block; animation: rtp-nudge 0.8s ease-in-out infinite; }
#rtp[data-phase="fire"][data-mine="1"] .rtp-phone { margin-right: 22px; }
#rtp[data-ok="1"] .rtp-phone, #rtp[data-ok="1"] .rtp-arrow { animation: none !important; }
#rtp[data-ok="1"] .rtp-arrow { display: none; }
#rtp[data-mine="0"] .rtp-anim, #rtp.rtp-done .rtp-anim { height: 26px; }
#rtp[data-mine="0"] .rtp-phone, #rtp.rtp-done .rtp-phone { opacity: 0.6; transform: scale(0.8); }
#rtp.pop .rtp-big { animation: rtp-pop 0.45s ease-out; }
#rtp .rtp-big .ck { font-family: ui-rounded, system-ui, sans-serif; font-weight: 900; font-size: 1.5em; line-height: 0.8; vertical-align: -0.1em; }
@keyframes rtp-paddle { 0%, 100% { transform: translateX(-14px) rotate(-32deg); } 50% { transform: translateX(14px) rotate(32deg); } }
@keyframes rtp-tilt { 0%, 100% { transform: rotate(-22deg); } 50% { transform: rotate(22deg); } }
@keyframes rtp-nudge { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(6px); } }
@keyframes rtp-pop { 0% { transform: scale(0.4); } 60% { transform: scale(1.25); } 100% { transform: scale(1); } }
@media (prefers-reduced-motion: reduce) {
  #rtp .rtp-phone, #rtp .rtp-arrow, #rtp.pop .rtp-big { animation: none !important; }
  #rtp[data-phase="paddle"][data-mine="1"] .rtp-phone { transform: rotate(-24deg); }
  #rtp[data-phase="steer"][data-mine="1"] .rtp-phone { transform: rotate(-16deg); }
}

/* paddler, upright: under the TRAINING line in the status card */
#status #rtp { margin: 8px auto 0; gap: 6px; }
#status #rtp .rtp-anim { height: 38px; }
#status #rtp[data-mine="0"] .rtp-anim, #status #rtp.rtp-done .rtp-anim { height: 22px; }
@media (max-height: 600px) { #status #rtp .rtp-anim { display: none; } }
#status #rtp .rtp-big { font-size: 20px; }
#status #rtp[data-mine="0"] .rtp-big { font-size: 13px; }
#status #rtp .rtp-sub { display: none; } /* the status line above says it already */

/* paddler, sideways: the empty left side of the paddle panel (the boat + count stay in the middle) */
#pad-screen #rtp[data-place="side"] { position: absolute; z-index: 30; left: 26px; top: 76px; bottom: 26px;
  width: calc(50% - 190px); min-width: 120px; }

/* first mate: the top of the middle column, between the aim stick and FIRE; its role line + tip make room */
#cap-mid #rtp { width: 100%; gap: 6px; }
#cap-mid #rtp .rtp-big { font-size: 12px; }
#cap-mid #rtp[data-mine="0"] .rtp-big { font-size: 9px; }
#cap-mid #rtp.rtp-done .rtp-big { font-size: 14px; }
#cap-mid #rtp .rtp-sub, #cap-mid #rtp .rtp-tag { font-size: 8px; }
#cap-mid #rtp .rtp-note { font-size: 7px; }
#cap-mid #rtp .rtp-anim { height: 38px; }
#cap-mid #rtp[data-mine="0"] .rtp-anim, #cap-mid #rtp.rtp-done .rtp-anim { height: 22px; }
/* its role line, status line (TRAINING · …, the same words) and tip make room while the overlay is up */
#pad-screen.rtp-on #cap-role, #pad-screen.rtp-on #cap-status, #pad-screen.rtp-on #cap .cap-tip { display: none; }
`;
  document.head.append(st);
}
