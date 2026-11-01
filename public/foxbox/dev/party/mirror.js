/**
 * mirror.js — multi-TV (web build + relay only): the bits host.js loads for an extra TV and for the
 * main TV it mirrors. See the "Multi-TV" section of host.js and MULTI-TV.md.
 *
 *   tickPlayer(view, {game, onOver})  an extra TV's replay buffer for MIRRORED games (Row, golf): the main
 *                                     TV's ticks go in (push(m:ticks)), view.applyTick(tick) comes out at
 *                                     60 a second about TARGET_MS behind, faster when the buffer runs full
 *                                     (up to 20 %, a jump past SKIP_MS), holding the last frame when it runs
 *                                     dry; view.draw() every animation frame
 *   livePlayer(view, {game, own, onOver})  the same for LIVE games (Sky, Snowball: view.live): every tick goes
 *                                     straight to view.push(tick, w) (the game predicts this TV's own players
 *                                     and smooths everyone else itself), this TV's phones' input to
 *                                     view.input(playerId, {a0, a1, b0, b1}) the moment it arrives
 *   screenUi({game})                  an extra TV's own notes: "CONNECTED TO …'S GAME" corner tag, the TV chip in the
 *                                     lobby, and a card for waiting / switching / ended
 *   bossBadge({lobby, room, party, tvs, max})  the main TV's lobby chip: public / private, the invite code + link
 *                                     for other TVs, and the TVs linked
 *
 * QA: globalThis.FOXBOX_MIRROR = {role, connected, game, ticksReceived, ticksApplied, bufferTicks,
 * delayMs, delays (recent), gaps, skipped, holds, tickBytes, firstTickAt, lastTickAt, live, inputs} on an extra TV
 * (live: the game view's own stats, inputs: own-phone inputs handed to it).
 */

const TICK_MS = 1000 / 60;
const TARGET_MS = 180; // how far behind the boss the second TV plays (absorbs the network's jitter)
const SKIP_MS = 1000; // further behind than this (a stall, a hidden tab): jump to the newest ticks
const MAX_DELAYS = 20000; // delay samples kept for QA (a whole race is ~6000 ticks)

export const stats = {
  role: "screen", connected: false, game: "", ticksReceived: 0, ticksApplied: 0, bufferTicks: 0,
  delayMs: null, delays: [], gaps: 0, skipped: 0, holds: 0, tickBytes: 0, firstTickAt: 0, lastTickAt: 0,
  live: null, inputs: 0, own: [],
};

/** The replay buffer for one round on the second TV. */
export function tickPlayer(view, { game = "", onOver = null } = {}) {
  // the stats are per round
  Object.assign(stats, { game, ticksReceived: 0, ticksApplied: 0, bufferTicks: 0, delayMs: null, gaps: 0, skipped: 0, holds: 0, tickBytes: 0, firstTickAt: 0, lastTickAt: 0, live: null, inputs: 0, own: [] });
  stats.delays.length = 0;
  const q = []; // { t: tick, w: the boss's wall-clock ms when it made that tick }
  let lastSeq = 0, acc = 0, last = 0, started = false, over = false, stopped = false, raf = 0;
  function push(m) {
    const k = Array.isArray(m && m.k) ? m.k : [];
    if (lastSeq && m.q !== lastSeq + 1) stats.gaps++; // fine: every tick carries the whole view
    lastSeq = m.q;
    k.forEach((t, i) => q.push({ t, w: (m.w || Date.now()) - (k.length - 1 - i) * TICK_MS }));
    stats.ticksReceived += k.length;
    stats.bufferTicks = q.length;
    stats.tickBytes += JSON.stringify(m).length; // ≈ what the relay carried to this TV
    stats.lastTickAt = Date.now();
    if (!stats.firstTickAt) stats.firstTickAt = stats.lastTickAt;
  }
  function frame(now) {
    if (stopped) return;
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(250, now - last) : 0;
    last = now;
    if (!started && q.length * TICK_MS >= TARGET_MS) started = true;
    if (started && !over) {
      if (q.length * TICK_MS > SKIP_MS) stats.skipped += q.splice(0, q.length - Math.ceil(TARGET_MS / TICK_MS)).length;
      // back toward the target: gently near it (a few %), up to 20 % faster after a burst or a stall
      // (100 ms over → 10 %), at most 5 % slower when it runs low
      const ahead = q.length * TICK_MS - TARGET_MS;
      const rate = ahead > 0 ? 1 + Math.min(0.2, ahead / 1000) : Math.max(0.95, 1 + ahead / 2000);
      acc += dt * rate;
      while (acc >= TICK_MS && q.length) {
        const { t, w } = q.shift();
        acc -= TICK_MS;
        view.applyTick(t);
        stats.ticksApplied++;
        stats.delayMs = Math.round(Date.now() - w); // the same clock when both TVs run on one machine
        stats.delays.push(stats.delayMs);
        if (stats.delays.length > MAX_DELAYS) stats.delays.shift();
        if (view.over) {
          over = true;
          if (onOver) onOver();
          break;
        }
      }
      if (!q.length && acc >= TICK_MS) {
        stats.holds++; // ran dry: hold this frame, don't bank the time
        acc = 0;
      }
      stats.bufferTicks = q.length;
    }
    view.draw();
  }
  raf = requestAnimationFrame(frame);
  return {
    push,
    stop() {
      stopped = true;
      cancelAnimationFrame(raf);
    },
  };
}

/**
 * A LIVE game's feed on an extra TV (view.live: Sky, Snowball): no buffering here — every tick goes to
 * view.push(tick, w) as it arrives (w = the main TV's clock when that tick was made: the batch's w minus one
 * tick per later tick in it), and this TV's own phones' input to view.input(). The view draws itself.
 */
export function livePlayer(view, { game = "", own = [], onOver = null } = {}) {
  Object.assign(stats, { game, ticksReceived: 0, ticksApplied: 0, bufferTicks: 0, delayMs: null, gaps: 0, skipped: 0, holds: 0, tickBytes: 0, firstTickAt: 0, lastTickAt: 0, inputs: 0, own: [...own] });
  stats.delays.length = 0;
  stats.live = view.stats || null;
  let lastSeq = 0, stopped = false, over = false;
  const watch = setInterval(() => {
    if (stopped) return;
    stats.live = view.stats || stats.live;
    if (!over && view.over) {
      over = true;
      if (onOver) onOver();
    }
  }, 50);
  return {
    push(m) {
      if (stopped) return;
      const k = Array.isArray(m && m.k) ? m.k : [];
      if (lastSeq && m.q !== lastSeq + 1) stats.gaps++;
      lastSeq = m.q;
      const w0 = m.w || Date.now();
      const now = Date.now();
      stats.ticksReceived += k.length;
      stats.tickBytes += JSON.stringify(m).length;
      stats.lastTickAt = now;
      if (!stats.firstTickAt) stats.firstTickAt = now;
      stats.delayMs = Math.round(now - w0); // one-way on one machine (both TVs share the clock)
      stats.delays.push(stats.delayMs);
      if (stats.delays.length > MAX_DELAYS) stats.delays.shift();
      k.forEach((t, i) => {
        try {
          view.push(t, w0 - (k.length - 1 - i) * TICK_MS);
          stats.ticksApplied++;
        } catch (e) {
          console.error("[mirror] view.push failed", e);
        }
      });
      if (!over && view.over) {
        over = true;
        if (onOver) onOver();
      }
    },
    input(pid, msg) {
      if (stopped || typeof view.input !== "function") return;
      stats.inputs++;
      try {
        view.input(pid, { a0: Number(msg.x) || 0, a1: Number(msg.y) || 0, b0: msg.b ? 1 : 0, b1: msg.c ? 1 : 0 });
      } catch (e) {
        console.error("[mirror] view.input failed", e);
      }
    },
    stop() {
      stopped = true;
      clearInterval(watch);
    },
  };
}

// ── on-screen bits ─────────────────────────────────────────────────────────────
const CSS = `
.fbx-tv2 { position: fixed; z-index: 95; pointer-events: none; font-family: "FoxBox Pixel", "Press Start 2P", ui-monospace, monospace;
  color: #fff9f1; background: #101125e6; border: 0.25rem solid #fff9f1; box-shadow: 0 0.35rem 0 #08091980; text-transform: uppercase; letter-spacing: 0.04em; }
.fbx-tv2[hidden] { display: none; }
.fbx-tv2-chip { left: 1.5rem; top: 1.5rem; padding: 0.7rem 1rem; font-size: 0.85rem; line-height: 1.5; max-width: 34rem; }
.fbx-tv2-chip b { color: #ffd23f; font-weight: 400; }
.fbx-tv2-live { left: 1.5rem; top: 1.5rem; padding: 0.55rem 0.9rem; font-size: 0.75rem; }
.fbx-tv2-live.fbx-tv2-top { left: 50%; top: 0.8rem; transform: translateX(-50%); }
body.golf-overhead .fbx-tv2-live.fbx-tv2-top { top: calc(8.4vh + 0.4rem); } /* golf's BIRD'S EYE label has the top middle (its screen view sets the class) */
.fbx-tv2-live::before { content: ""; display: inline-block; width: 0.7rem; height: 0.7rem; margin-right: 0.6rem; background: #ff5a3c; vertical-align: -0.05rem; }
.fbx-tv2-card { left: 50%; top: 50%; transform: translate(-50%, -50%); padding: 2.2rem 2.8rem; font-size: 1.5rem; line-height: 1.6; text-align: center; max-width: 70rem; pointer-events: auto; }
.fbx-tv2-card small { display: block; margin-top: 1rem; font-size: 0.8rem; color: #c9c8df; }
.fbx-tv2-card a { display: inline-block; margin-top: 1.4rem; padding: 0.8rem 1.2rem; background: #ff9864; color: #20152c; text-decoration: none; font-size: 0.9rem; box-shadow: 0 0.3rem 0 #552849; }
.fbx-tv2-chip .fbx-tv2-row { display: block; }
.fbx-tv2-chip .fbx-tv2-dim { color: #c9c8df; font-size: 0.7rem; letter-spacing: 0.02em; }
.fbx-tv2-chip [data-test="tv2-link"] { text-transform: none; }
.fbx-tv2-chip .fbx-tv2-pub { color: #7be4dc; }
.fbx-tv2-chip .fbx-tv2-priv { color: #c9a7ff; }
`;
function el(cls) {
  if (!document.getElementById("fbx-tv2-css")) {
    const s = document.createElement("style");
    s.id = "fbx-tv2-css";
    s.textContent = CSS;
    document.head.append(s);
  }
  const d = document.createElement("div");
  d.className = `fbx-tv2 ${cls}`;
  d.hidden = true;
  document.body.append(d);
  return d;
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/**
 * The main TV's lobby chip (multi-TV): public / private with the group's name, the invite for other TVs (a
 * code to type on JOIN GAME, or the ?join= link), and how many TVs are linked.
 */
let badge = null;
const fmtInvite = (c) => (c && c.length > 5 ? `${c.slice(0, 5)}-${c.slice(5)}` : c || "");
export function bossBadge({ lobby, room, party = null, tvs = [], max = 8 }) {
  if (!badge) badge = el("fbx-tv2-chip");
  badge.dataset.test = "tv2-badge";
  badge.dataset.linked = tvs.length ? "1" : "";
  badge.dataset.tvs = String(1 + tvs.length);
  if (party && party.invite) badge.dataset.invite = party.invite;
  let html;
  if (!party || !party.invite) html = ""; // no relay room (P2P / local package): nothing to show
  else {
    const kind = party.pub ? `<b class="fbx-tv2-pub">PUBLIC</b>` : `<b class="fbx-tv2-priv">PRIVATE</b>`;
    const link = String(party.tvLink || "").replace(/^https?:\/\//, "");
    const linked = tvs.length ? ` · ${1 + tvs.length}/${max} TVS` : "";
    html = `<span class="fbx-tv2-row">${kind} · ${esc(party.group || "")}${linked}</span>` +
      `<span class="fbx-tv2-row">ANOTHER TV? JOIN GAME · <b data-test="tv2-invite">${esc(fmtInvite(party.invite))}</b></span>` +
      (link ? `<span class="fbx-tv2-row fbx-tv2-dim" data-test="tv2-link">${esc(link)}</span>` : "");
  }
  if (badge.innerHTML !== html) badge.innerHTML = html;
  badge.hidden = !lobby || !room || !html;
}

/** An extra TV's own notes. */
export function screenUi({ game = "" } = {}) {
  globalThis.FOXBOX_MIRROR = stats;
  stats.game = game;
  const chip = el("fbx-tv2-chip"), live = el("fbx-tv2-live"), card = el("fbx-tv2-card");
  chip.dataset.test = "tv2-chip";
  live.dataset.test = "tv2-live";
  card.dataset.test = "tv2-card";
  let waitTimer = 0, cardWhy = "", ended = false;
  const showCard = (why, html) => {
    if (ended && why !== "ended") return;
    cardWhy = why;
    card.innerHTML = html;
    card.hidden = false;
  };
  const hideCard = (why) => {
    if (cardWhy !== why || ended) return;
    cardWhy = "";
    card.hidden = true;
  };
  // net-p2p.js: the party's room is gone (the boss TV closed it, or was away too long)
  window.addEventListener("foxbox:screen", (e) => {
    if (!e.detail || e.detail.ended !== true) return;
    const why = e.detail.why === "tv-full" ? "That party already has 8 TVs." : "The main TV closed its party.";
    showCard("ended", `Party ended<small>${why}</small><a href="${esc(new URL(".", location.href).pathname)}">Start your own party</a>`);
    ended = true;
    stats.connected = false;
  });
  return {
    waiting(on) {
      clearTimeout(waitTimer);
      stats.connected = !on;
      if (!on) return hideCard("waiting");
      // a reload of the boss (it switches games that way) takes a few seconds: only say so if it lasts
      waitTimer = setTimeout(() => showCard("waiting", `Waiting for the main TV…<small>It may be switching games.</small>`), 2500);
    },
    say(text) {
      showCard("say", esc(text));
    },
    elsewhere(on, text) { // KNIGHT: text = a game's own line (host.js GAMES[].elsewhere), else the usual one
      if (on) showCard("elsewhere", text ? `${esc(text)}<small>Phones still play · the game shows on the host's TV</small>` : `Playing on the main TV<small>This game shows on the main TV only</small>`);
      else hideCard("elsewhere");
    },
    lobby({ room, players = [], lobby, me = "", party = null, tvs = [] }) {
      const here = players.filter((p) => p.house === me && me && p.connected).length;
      const mine = tvs.find((t) => t.id === me);
      const n = mine ? mine.n : 2;
      const host = party && party.host ? `${esc(String(party.host).toUpperCase())}’S PARTY` : "THE MAIN TV’S PARTY";
      const html = `<span class="fbx-tv2-row">TV ${n} OF ${1 + tvs.length} · <b>${esc((party && party.group) || room || "")}</b></span>` +
        `<span class="fbx-tv2-row fbx-tv2-dim">${host}${here ? ` · ${here} PLAYING FROM THIS TV` : " · SCAN THE QR TO PLAY FROM THIS TV"}</span>`;
      chip.dataset.tvn = String(n);
      if (chip.innerHTML !== html) chip.innerHTML = html;
      chip.hidden = !lobby || !room;
    },
    /** at: "corner" (top left) or "top" (top middle, for a game whose HUD has the corner: golf) */
    playing(name, { at = "corner" } = {}) {
      live.hidden = name == null;
      if (name == null) return;
      chip.hidden = true;
      live.classList.toggle("fbx-tv2-top", at === "top");
      // Lakota: "CONNECTED TO <HOST NAME>'S GAME" (the host's name from the HOST steps)
      live.textContent = name ? `CONNECTED TO ${String(name).toUpperCase()}’S GAME` : "CONNECTED TO THE HOST’S GAME";
    },
  };
}
