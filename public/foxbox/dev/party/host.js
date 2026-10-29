/**
 * host.js — Sky Scramble PARTY MODE, the TV host page.
 *
 * Runs the real game module (build/gc.game.js) and plays the part of the Gaming Couch
 * platform around it, with phones as the controllers:
 *   - LOBBY: QR code + URL for /pad, joined players as coloured chips, "press BONK to start"
 *     (any joined player; also auto-starts AUTO_START_MS after someone is in the lobby)
 *   - ROUND: setup() once, play() per round with the joined players + bots (bots fill free
 *     slots so a round has at least MIN_ROUND_PLAYERS; type "bot" → the game drives them,
 *     exactly like dev/mock-platform.js), pad input → game.inputs(id, {a0, a1, b0, b1}),
 *     and a TV-sized mock of the platform HUD (scoreboard + overhead name tags)
 *   - RESULTS for RESULTS_MS, then back to the LOBBY with everyone still joined.
 *
 * Drawn characters: a phone can pick one (characters/index.json via /api/characters) and
 * joins with its id. The host preloads the image and passes the party-only player field
 * `character: { src, hitbox, img }` to play() (the real platform never sends it). The
 * lobby chips show a thumbnail of each player's pick.
 *
 * "Draw your own": while a phone is on its drawing screen it reports drawing=true (join /
 * {t:"state"}). Its chip says "drawing…", it sits out any round that starts meanwhile (no
 * half-finished drawings), and the lobby auto-start waits for it, up to DRAW_HOLD_MS past the
 * normal start time. A BONK from anyone else (or Enter on the TV) still starts right away.
 *
 * Talks to tools/party-server.ts over /ws?role=host (see the protocol in that file).
 * Each phone keeps a persistent client id, so a reconnecting phone gets its slot back.
 *
 * Host keyboard (optional): Enter/Space start · P pause · Esc abort round → lobby.
 */

import qrcodegen from "./vendor/qrcodegen.js";
import { isP2P, ready as netReady, openSocket, api } from "./net.js";

// ── The hub ────────────────────────────────────────────────────────────────────
// One name for the whole thing (TV page title, lobby heading, phone header): rename here.
export const HUB_NAME = "FoxBox"; // shown as FOXBOX on the TV title
const HUB_TAGLINE = "Party games on the big screen · your phone is the controller";
// The games in the hub. Each is a Gaming Couch game module driven through the same contract.
// stick: "x" = left/right only, "xy" = a 2D stick (sent as a0/a1). button = the action's name.
const GAMES = [
  {
    id: "sky", name: "Sky Scramble", gameId: "skyscramble", button: "BONK", stick: "x",
    module: "../../sky/gc.game.js", props: "../../sky/gc.properties.json",
    tagline: "Bounce up the clouds · BONK your friends · last one up wins!",
  },
  {
    id: "snowball", name: "Snowball Sumo", gameId: "snowballsumo", button: "SHOVE", stick: "xy",
    module: "../../games/snowball/gc.game.js", props: "../../games/snowball/gc.properties.json",
    tagline: "Roll and grow · SHOVE your friends off · last snowball on the island wins!",
  },
];
const GAME_KEY = "foxbox-game";
const GAME = (() => {
  let want = new URLSearchParams(location.search).get("game");
  if (!want) try { want = localStorage.getItem(GAME_KEY); } catch {}
  return GAMES.find((g) => g.id === want) || GAMES[0];
})();
/** The loaded game module (see boot()). */
let game = null;

// ── Tuning ─────────────────────────────────────────────────────────────────────
const MAX_PLAYERS = 8;
const MIN_ROUND_PLAYERS = 0; // bots fill up to this many (0: people only, no bots)…
const SOLO_BOTS = 0; // …except a lone player, who gets this many bots (0 = off; 3 for solo practice)
const roundTarget = (humanCount) => (humanCount === 1 ? 1 + SOLO_BOTS : MIN_ROUND_PLAYERS);
const AUTO_START_MS = 20_000;
const DRAW_HOLD_MS = 60_000; // auto-start waits at most this much longer while someone is drawing
const COUNTDOWN_MS = 3_000;
const RESULTS_MS = 8_000;
const LOBBY_DROP_MS = 90_000; // a phone gone this long (in the lobby) frees its slot
const REJOIN_GRACE_MS = 15_000; // a phone that dropped this recently still gets into the next round
const ROSTER_KEY = "sky-scramble-party-roster";

// Slot i → colour i (white = "unset" is never used). Same order as mock-platform.js.
const COLOR_KEYS = ["blue", "red", "green", "cyan", "yellow", "purple", "pink", "brown"];

const $ = (id) => document.getElementById(id);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// ── State ──────────────────────────────────────────────────────────────────────
let gameProperties = null;
let setupDone = false;
let hudConfig = {};

/** "boot" | "lobby" | "countdown" | "playing" | "results" */
let phase = "boot";
let isPaused = false;

/**
 * Everyone who joined from a phone: clientId → {
 *   id, slot (0..7), name, connected, goneAt, x, b (latest input), lastB,
 *   drawing (true while that phone is on its "Draw your own" screen)
 * }
 */
const roster = new Map();

/** The round in progress / just finished, or null. */
let round = null;

let autoStartAt = null;
/** While someone is drawing, the auto-start is held until they finish or this time passes. */
let drawHoldUntil = null;
let countdownTimer = null;
let resultsTimer = null;
let padUrl = `http://${location.host}/pad`;

const stats = { rounds: 0, gameOvers: 0, lastPlacement: null, inputsForwarded: 0, lastPoints: null, contractErrors: [] };

// ── Drawn characters ──────────────────────────────────────────────────────────
/** id → { id, name, src, hitbox } from /api/characters. */
let characters = new Map();
/** src → preloaded <img>, so play() doesn't wait on the network. */
const charImgs = new Map();
let charFetch = null;
let charFetchAgain = false;

function refreshCharacters() {
  if (charFetch) {
    // the list may have changed after that request went out (a selfie just saved): ask again after it
    charFetchAgain = true;
    return charFetch;
  }
  charFetch = api("/api/characters", { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && Array.isArray(data.characters)) characters = new Map(data.characters.map((c) => [c.id, c]));
      for (const p of roster.values()) preloadCharacter(p.character);
      renderLobby();
    })
    .catch(() => {})
    .finally(() => {
      charFetch = null;
      if (charFetchAgain) {
        charFetchAgain = false;
        refreshCharacters();
      }
    });
  return charFetch;
}

function preloadCharacter(id) {
  const c = id && characters.get(id);
  if (!c || charImgs.has(c.src)) return;
  const im = new Image();
  im.decoding = "async";
  im.src = c.src;
  charImgs.set(c.src, im);
}

/** CSS background that shows a ball character's hitbox circle filling a round box. */
function circleCropCss(c) {
  const { x, y, w, h } = c.hitbox;
  const pos = (o, s) => (s >= 1 ? 50 : (o / (1 - s)) * 100);
  return `background-image:url("${c.src}");background-size:${100 / w}% ${100 / h}%;background-position:${pos(x, w)}% ${pos(y, h)}%`;
}

/** The play-context `character` field for a roster player, or undefined (puffball). */
function characterField(p) {
  const c = p.character && characters.get(p.character);
  if (!c) return undefined;
  const im = charImgs.get(c.src);
  return { src: c.src, hitbox: c.hitbox, ...(im && im.complete && im.naturalWidth > 0 ? { img: im } : {}) };
}

function colorSet(slot) {
  const hex = gameProperties?.player?.color?.[COLOR_KEYS[slot]]?.hex ?? {};
  return { base: hex.base ?? "#888", light: hex.light ?? hex.base ?? "#aaa", dark: hex.dark ?? hex.base ?? "#555" };
}
const colorVars = (c) => `--c:${c.base};--l:${c.light};--d:${c.dark}`;

function saveRoster() {
  try {
    const list = [...roster.values()].map(({ id, slot, name, character }) => ({ id, slot, name, character }));
    localStorage.setItem(ROSTER_KEY, JSON.stringify(list));
  } catch {}
}
function loadRoster() {
  try {
    const list = JSON.parse(localStorage.getItem(ROSTER_KEY)) || [];
    const now = Date.now();
    for (const p of list) {
      if (typeof p.id !== "string" || !(p.slot >= 0 && p.slot < MAX_PLAYERS)) continue;
      if ([...roster.values()].some((q) => q.slot === p.slot)) continue;
      const character = typeof p.character === "string" ? p.character : null;
      roster.set(p.id, { id: p.id, slot: p.slot, name: p.name || `Player ${p.slot + 1}`, character, connected: false, goneAt: now, x: 0, b: 0, lastB: 0, drawing: false });
    }
  } catch {}
}

// ── Server connection ─────────────────────────────────────────────────────────
let ws = null;
let wsReplaced = false;

function connect() {
  if (wsReplaced) return;
  const sock = openSocket("host");
  ws = sock;
  sock.onopen = () => setNet(true);
  sock.onmessage = (ev) => {
    let msg;
    try {
      msg = JSON.parse(ev.data);
    } catch {
      return;
    }
    onServer(msg);
  };
  sock.onclose = () => {
    if (ws !== sock) return;
    ws = null;
    setNet(false);
    // Everyone's input goes neutral while we can't hear them.
    for (const p of roster.values()) markGone(p);
    renderLobby();
    setTimeout(connect, 1000);
  };
  sock.onerror = () => {};
}

function wsSend(obj) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
}
function toPad(id, m) {
  wsSend({ t: "to", id, m });
}

function setNet(ok) {
  const el = $("net-status");
  el.textContent = ok
    ? ""
    : wsReplaced
      ? "Another TV page took over — reload to use this one"
      : isP2P
        ? "Reconnecting to the FoxBox network…"
        : "Party server not reachable — is `bun tools/party-server.ts` running?";
  el.classList.toggle("bad", !ok);
}

function onServer(msg) {
  switch (msg.t) {
    case "pads": {
      const here = new Set(msg.pads.map((p) => p.id));
      for (const p of roster.values()) if (!here.has(p.id)) markGone(p);
      for (const p of msg.pads) onJoin(p.id, p.name, p.character, p.drawing);
      break;
    }
    case "join":
      onJoin(msg.id, msg.name, msg.character, msg.drawing);
      break;
    case "state": {
      const p = roster.get(msg.id);
      if (p) setDrawing(p, msg.drawing === true);
      break;
    }
    case "leave": {
      const p = roster.get(msg.id);
      if (p) {
        markGone(p);
        renderLobby();
      }
      break;
    }
    case "in":
      window.__foxboxLastInputAt = Date.now();
      onInput(msg.id, Number(msg.x) || 0, Number(msg.y) || 0, msg.b ? 1 : 0);
      break;
    case "pick":
      if (roster.get(msg.id)?.connected) switchGame(1);
      break;
    case "replaced":
      wsReplaced = true;
      setNet(false);
      break;
  }
}

// ── Players joining / leaving ─────────────────────────────────────────────────
function onJoin(id, name, character, drawing) {
  if (typeof id !== "string" || !id) return;
  let p = roster.get(id);
  if (!p) {
    const used = new Set([...roster.values()].map((q) => q.slot));
    let slot = [...Array(MAX_PLAYERS).keys()].find((s) => !used.has(s));
    if (slot === undefined) {
      // Full: recycle the slot of someone who has been gone a while and isn't mid-round.
      const victim = [...roster.values()]
        .filter((q) => !q.connected && !inRound(q) && Date.now() - q.goneAt > REJOIN_GRACE_MS)
        .sort((a, b) => a.goneAt - b.goneAt)[0];
      if (!victim) {
        toPad(id, { t: "status", state: "full" });
        return;
      }
      roster.delete(victim.id);
      slot = victim.slot;
    }
    p = { id, slot, name: "", character: null, connected: true, goneAt: 0, x: 0, b: 0, lastB: 0, drawing: false };
    roster.set(id, p);
  }
  p.connected = true;
  p.goneAt = 0;
  p.name = (typeof name === "string" && name.trim()) || p.name || `Player ${p.slot + 1}`;
  // The phone's pick (applies from the next round). Re-read the list: it may be a new drawing,
  // or a selfie that was just (re)taken — its image URL changes with every retake.
  p.character = typeof character === "string" && character ? character : null;
  if (p.character) refreshCharacters();
  p.drawing = drawing === true;
  // A rejoining phone starts neutral until it sends input again.
  p.x = 0;
  p.b = 0;
  p.lastB = 0;
  forwardInput(p);
  if (round && !round.ended) {
    const pid = p.slot + 1;
    if (round.humanIdByPid.get(pid) === p.id) round.nameById.set(pid, p.name);
  }
  saveRoster();
  sendStatus(p);
  if (phase === "lobby") broadcastLobby();
  renderLobby();
}

/** The phone opened / left its drawing screen (it keeps the flag while away: a locked phone mid-drawing). */
function setDrawing(p, on) {
  if (p.drawing === on) return;
  p.drawing = on;
  if (phase === "lobby") broadcastLobby();
  renderLobby();
}

/** Connected phones that are drawing right now (they hold the auto-start). */
function drawers() {
  return [...roster.values()].filter((p) => p.connected && p.drawing);
}

function markGone(p) {
  if (!p.connected) return;
  p.connected = false;
  p.goneAt = Date.now();
  p.x = 0;
  p.b = 0;
  p.lastB = 0;
  forwardInput(p); // neutral while disconnected
}

function inRound(p) {
  return !!(round && !round.ended && round.humanIdByPid.get(p.slot + 1) === p.id);
}

// ── Inputs ────────────────────────────────────────────────────────────────────
function onInput(id, x, y, b) {
  const p = roster.get(id);
  if (!p || !p.connected) return;
  p.x = clamp(x, -1, 1);
  p.y = GAME.stick === "xy" ? clamp(y, -1, 1) : 0;
  p.b = b;
  const pressed = b && !p.lastB;
  p.lastB = b;
  if (phase === "playing") forwardInput(p);
  else if (phase === "lobby" && pressed) startCountdown(p);
}

function forwardInput(p) {
  if (phase !== "playing" || !inRound(p)) return;
  stats.inputsForwarded++;
  game.inputs(p.slot + 1, { a0: p.x, a1: p.y || 0, b0: p.b, b1: 0 });
}

// ── Status pushed to each phone ───────────────────────────────────────────────
function connectedCount() {
  return [...roster.values()].filter((p) => p.connected).length;
}

function statusFor(p) {
  const base = {
    t: "status",
    name: p.name,
    slot: p.slot,
    color: colorSet(p.slot),
    players: connectedCount(),
    game: { id: GAME.id, name: GAME.name, button: GAME.button, stick: GAME.stick, count: GAMES.length },
    hub: HUB_NAME,
  };
  if (phase === "lobby" || phase === "boot") {
    const held = drawHoldUntil != null && drawers().length > 0;
    return {
      ...base,
      state: "lobby",
      autoIn: autoStartAt && !held ? Math.max(0, Math.ceil((autoStartAt - Date.now()) / 1000)) : null,
      ...(held ? { hold: "drawing" } : {}),
    };
  }
  if (phase === "countdown") return { ...base, state: "countdown" };
  if (!round || round.humanIdByPid.get(p.slot + 1) !== p.id) return { ...base, state: "waiting" };
  const pid = p.slot + 1;
  if (phase === "results" && round.placement) {
    const place = round.placement.indexOf(pid) + 1;
    return { ...base, state: "results", place, total: round.placement.length, winner: round.nameById.get(round.placement[0]) };
  }
  if (round.out.has(pid)) return { ...base, state: "out" };
  return { ...base, state: "playing" };
}

function sendStatus(p) {
  if (p.connected) toPad(p.id, statusFor(p));
}
function broadcastLobby() {
  for (const p of roster.values()) sendStatus(p);
}

// ── Screens ───────────────────────────────────────────────────────────────────
// Optional lobby screen supplied by the page (the web version's FoxBox UI):
// globalThis.FOXBOX_LOBBY_UI = { visible(on), render(state), room({code, joinUrl}), onPick: set below }.
const lobbyUI = () => globalThis.FOXBOX_LOBBY_UI || null;

function show(id) {
  for (const s of ["lobby", "countdown", "results"]) $(s).classList.toggle("show", s === id);
  lobbyUI()?.visible(id === "lobby");
  $("hud").classList.toggle("show", phase === "playing" || phase === "results");
}

function renderLobby() {
  const list = [...roster.values()].sort((a, b) => a.slot - b.slot);
  const cells = list.map((p) => {
    const c = colorSet(p.slot);
    const tag = !p.connected ? `<span class="tag">away</span>` : p.drawing ? `<span class="tag drawing">drawing…</span>` : "";
    const ch = p.character && characters.get(p.character);
    const icon = !ch
      ? `<span class="ball"></span>`
      : ch.hitbox && ch.hitbox.ball
        ? `<span class="thumb round" style="${esc(circleCropCss(ch))}"></span>`
        : `<span class="thumb"><img src="${esc(ch.src)}" alt=""></span>`;
    return `<div class="chip${p.connected ? "" : " off"}" style="${colorVars(c)}">${icon}<span class="nm">${esc(p.name)}</span>${tag}</div>`;
  });
  for (let i = list.length; i < MAX_PLAYERS; i++) cells.push(`<div class="chip empty">${i === list.length ? "Scan to join!" : "free spot"}</div>`);
  const chipsHtml = cells.join("");
  if ($("chips").dataset.html !== chipsHtml) {
    $("chips").innerHTML = chipsHtml;
    $("chips").dataset.html = chipsHtml;
  }
  const n = connectedCount();
  $("count").textContent = `${list.length} / ${MAX_PLAYERS}`;
  const st = $("start-text");
  if (n > 0) {
    st.textContent = `Press ${GAME.button} on your phone to start!`;
    st.classList.remove("idle");
  } else {
    st.textContent = "Scan the code with your phone to join";
    st.classList.add("idle");
  }
  const connected = list.filter((p) => p.connected).length;
  const bots = Math.max(0, roundTarget(connected) - connected);
  const held = drawHoldUntil != null ? drawers() : [];
  const autoTxt = held.length
    ? `Waiting for ${held.length === 1 ? held[0].name : `${held.length} players`} to finish drawing… ${GAME.button} starts anyway`
    : autoStartAt
      ? `Starting by itself in ${Math.max(0, Math.ceil((autoStartAt - Date.now()) / 1000))} s`
      : "";
  const botTxt = n > 0 && bots > 0 ? `${bots} bot${bots > 1 ? "s" : ""} will join in` : "";
  $("auto-text").textContent = [autoTxt, botTxt].filter(Boolean).join("  ·  ");
  // ?autoplay=1: the TV Chrome is started with --autoplay-policy=no-user-gesture-required, so sound already works.
  const active = AUTOPLAY_OK || (navigator.userActivation ? navigator.userActivation.hasBeenActive : true);
  $("sound-hint").textContent = active ? "" : "Click once on this page to turn the sound on";
  lobbyUI()?.render({
    players: list.map((p) => ({
      slot: p.slot + 1,
      name: p.name,
      color: colorSet(p.slot).base,
      ready: p.connected,
      tag: !p.connected ? "away" : p.drawing ? "drawing…" : undefined,
    })),
    games: GAMES.map((g) => ({ id: g.id, name: g.name, button: g.button, blurb: g.tagline })),
    current: GAME.id,
    status: n > 0 ? [`Press ${GAME.button} on a phone to start!`, autoTxt, botTxt].filter(Boolean).join("  ·  ") : null,
  });
}

const AUTOPLAY_OK = new URLSearchParams(location.search).has("autoplay");

function drawQr(text) {
  const qr = qrcodegen.QrCode.encodeText(text, qrcodegen.QrCode.Ecc.MEDIUM);
  const border = 3;
  const n = qr.size + border * 2;
  const scale = Math.max(4, Math.floor(480 / n));
  const cv = $("qr");
  cv.width = cv.height = n * scale;
  const g = cv.getContext("2d");
  g.fillStyle = "#fff";
  g.fillRect(0, 0, cv.width, cv.height);
  g.fillStyle = "#0b1a33";
  for (let y = 0; y < qr.size; y++)
    for (let x = 0; x < qr.size; x++) if (qr.getModule(x, y)) g.fillRect((x + border) * scale, (y + border) * scale, scale, scale);
  cv.dataset.text = text;
}

async function refreshInfo() {
  try {
    const res = await api("/api/info", { cache: "no-store" });
    if (res.ok) {
      const info = await res.json();
      if (info.padUrl) padUrl = info.padUrl;
      // web version: a room code to type in, and where to type it
      if (info.room) {
        $("room-code").hidden = false;
        $("room-code").textContent = info.room;
        $("room-code").dataset.roomCode = info.room;
        $("join-hint").hidden = false;
        $("join-hint").textContent = info.joinText || "";
        $("join-title").textContent = "Scan or enter the code";
        lobbyUI()?.room({ code: info.room, joinUrl: padUrl });
        $("pad-url").hidden = true; // the long link is in the QR; people type the short code
        document.querySelector(".join-card").classList.add("web");
      }
    }
  } catch {}
  $("pad-url").textContent = padUrl.replace(/^https?:\/\//, "");
  if ($("qr").dataset.text !== padUrl) drawQr(padUrl);
}

// ── Lobby → countdown → round ─────────────────────────────────────────────────
function toLobby() {
  clearTimeout(resultsTimer);
  clearInterval(countdownTimer);
  if (round && !round.ended) {
    // Aborted mid-round: freeze the game; the next play() tears it down.
    round.ended = true;
    game.pause(true);
  }
  phase = "lobby";
  isPaused = false;
  $("paused").classList.remove("show");
  refreshCharacters(); // pick up drawings added since the last round
  autoStartAt = connectedCount() > 0 ? Date.now() + AUTO_START_MS : null;
  drawHoldUntil = null;
  show("lobby");
  renderLobby();
  broadcastLobby();
}

function startCountdown(byPlayer) {
  if (phase !== "lobby" || !setupDone) return;
  if (connectedCount() === 0) return;
  // Somebody has to be able to play: not everyone may be busy drawing.
  if (![...roster.values()].some((p) => p.connected && !p.drawing)) return;
  phase = "countdown";
  autoStartAt = null;
  drawHoldUntil = null;
  const ends = Date.now() + COUNTDOWN_MS;
  $("cd-sub").textContent = byPlayer ? `${byPlayer.name} pressed ${GAME.button} — get ready!` : "Get ready!";
  const tick = () => {
    const left = Math.ceil((ends - Date.now()) / 1000);
    if (left <= 0) {
      clearInterval(countdownTimer);
      startRound();
      return;
    }
    if ($("cd-num").textContent !== String(left)) {
      $("cd-num").textContent = String(left);
      // restart the pop animation
      $("cd-num").style.animation = "none";
      void $("cd-num").offsetWidth;
      $("cd-num").style.animation = "";
    }
  };
  $("cd-num").textContent = "";
  tick();
  countdownTimer = setInterval(tick, 100);
  show("countdown");
  broadcastLobby();
}

function startRound() {
  const now = Date.now();
  // Someone still drawing sits this round out (they'd play a half-finished drawing).
  const humans = [...roster.values()]
    .filter((p) => !p.drawing && (p.connected || now - p.goneAt < REJOIN_GRACE_MS))
    .sort((a, b) => a.slot - b.slot);
  if (humans.length === 0) {
    toLobby();
    return;
  }
  const usedSlots = new Set(humans.map((p) => p.slot));
  const nameById = new Map();
  const colorById = new Map();
  const humanIdByPid = new Map();
  const players = [];
  for (const p of humans) {
    const pl = { type: "player", playerId: p.slot + 1, color: COLOR_KEYS[p.slot] };
    const character = characterField(p);
    if (character) pl.character = character; // party-mode extra; absent = puffball
    players.push(pl);
    nameById.set(p.slot + 1, p.name);
    humanIdByPid.set(p.slot + 1, p.id);
  }
  let botN = 0;
  const target = roundTarget(humans.length);
  for (let s = 0; s < MAX_PLAYERS && players.length < target; s++) {
    if (usedSlots.has(s)) continue;
    // Also skip slots reserved by roster members sitting this round out (keeps colours unique).
    if ([...roster.values()].some((q) => q.slot === s)) continue;
    players.push({ type: "bot", playerId: s + 1, color: COLOR_KEYS[s] });
    nameById.set(s + 1, `Bot ${++botN}`);
  }
  // If reserved slots blocked the bot fill, use them anyway (round size beats colour reservation).
  for (let s = 0; s < MAX_PLAYERS && players.length < target; s++) {
    if (players.some((q) => q.playerId === s + 1)) continue;
    players.push({ type: "bot", playerId: s + 1, color: COLOR_KEYS[s] });
    nameById.set(s + 1, `Bot ${++botN}`);
  }
  players.sort((a, b) => a.playerId - b.playerId);
  for (const pl of players) colorById.set(pl.playerId, colorSet(pl.playerId - 1));

  round = {
    players,
    nameById,
    colorById,
    humanIdByPid,
    out: new Set(),
    hudById: new Map(),
    placement: null,
    ended: false,
    seed: Math.floor(Math.random() * 0x7fffffff),
  };
  const r = round;
  stats.rounds++;
  phase = "playing";
  isPaused = false;
  $("scoreboard").innerHTML = "";
  $("screen-points").innerHTML = "";

  const started = game.play({
    isPaused: false,
    seed: r.seed,
    players,
    gameProperties,
    hud: {
      setup() {
        throw new Error("hud.setup is not available during play");
      },
      updatePlayers(data) {
        if (round !== r) return;
        onHudPlayers(r, data.players || []);
      },
      updateScreenPoints(data) {
        if (round !== r) return;
        renderScreenPoints(r, data.points || []);
      },
    },
    gameOver(ids) {
      if (round !== r || r.ended) {
        stats.contractErrors.push("gameOver after round ended");
        return;
      }
      onGameOver(r, ids);
    },
  });
  // With drawn characters play() first loads their images and returns a Promise: keep the
  // countdown up until the round is really running, so the TV never shows a stale frame.
  const go = () => {
    if (round !== r || phase !== "playing") return;
    show(null);
    // Push whatever the phones are holding right now.
    for (const p of humans) forwardInput(p);
  };
  if (started && typeof started.then === "function") started.then(go, go);
  else go();
  broadcastLobby();
}

function onHudPlayers(r, list) {
  r.hudById.clear();
  for (const p of list) r.hudById.set(p.playerId, p);
  for (const p of list) {
    if (p.eliminated && !r.out.has(p.playerId)) {
      r.out.add(p.playerId);
      const hid = r.humanIdByPid.get(p.playerId);
      const hp = hid && roster.get(hid);
      if (hp) sendStatus(hp);
    }
  }
  const ordered = [...list].sort((a, b) => a.placement - b.placement);
  $("scoreboard").innerHTML = ordered
    .map((p) => {
      const c = r.colorById.get(p.playerId) || colorSet(0);
      const name = r.nameById.get(p.playerId) ?? `#${p.playerId}`;
      const meter = typeof p.meter === "number" && p.meter >= 0 ? `<div class="meter"><div class="meter-fill" style="width:${p.meter}%"></div></div>` : "";
      const value = p.value != null && p.value !== "" ? `<span class="score">${esc(p.value)}</span>` : "";
      return `<div class="player-box${p.eliminated ? " eliminated" : ""}" style="${colorVars(c)}"><span class="name">${esc(name)}</span>${value}${meter}</div>`;
    })
    .join("");
}

function renderScreenPoints(r, points) {
  stats.lastPoints = points;
  const html = [];
  for (const pt of points) {
    const c = r.colorById.get(pt.playerId) || colorSet(0);
    const name = esc(r.nameById.get(pt.playerId) ?? `#${pt.playerId}`);
    if (pt.type === "playerOverhead" && !pt.isOffScreen) {
      const d = r.hudById.get(pt.playerId);
      const meter = d && typeof d.meter === "number" && d.meter >= 0 ? `<div class="oh-meter"><div class="oh-meter-fill" style="width:${d.meter}%"></div></div>` : "";
      html.push(`<div class="overhead" style="left:${pt.x * 100}%;top:${(1 - pt.y) * 100}%;${colorVars(c)}"><div class="oh-name">${name}</div>${meter}</div>`);
    } else if (pt.type === "playerPosition" && pt.isOffScreen) {
      const left = clamp(pt.x, 0.05, 0.95) * 100;
      const top = clamp(1 - pt.y, 0.04, 0.96) * 100;
      html.push(`<div class="offscreen" style="left:${left}%;top:${top}%;${colorVars(c)}">${name}</div>`);
    }
  }
  $("screen-points").innerHTML = html.join("");
}

function onGameOver(r, ids) {
  r.ended = true;
  r.placement = [...ids];
  stats.gameOvers++;
  stats.lastPlacement = [...ids];
  phase = "results";
  $("screen-points").innerHTML = "";

  const winnerId = ids[0];
  const wc = r.colorById.get(winnerId) || colorSet(0);
  const wname = r.nameById.get(winnerId) ?? "Someone";
  $("res-title").innerHTML = `<span class="w" style="${colorVars(wc)}">${esc(wname)}</span> wins!`;
  $("res-list").innerHTML = ids
    .map((id, i) => {
      const c = r.colorById.get(id) || colorSet(0);
      const isBot = !r.humanIdByPid.has(id);
      return `<div class="res-row${i === 0 ? " first" : ""}" style="${colorVars(c)}"><span class="pl">${i === 0 ? "👑" : ordinal(i + 1)}</span><span class="nm">${esc(r.nameById.get(id) ?? `#${id}`)}</span>${isBot ? '<span class="bot">BOT</span>' : ""}</div>`;
    })
    .join("");
  $("res-list").style.gridTemplateRows = `repeat(${Math.min(4, Math.ceil(ids.length / 2) || 1)}, auto)`;
  const ends = Date.now() + RESULTS_MS;
  const upd = () => {
    const left = Math.max(0, Math.ceil((ends - Date.now()) / 1000));
    $("res-sub").textContent = `Back to the lobby in ${left}…  then ${GAME.button} for a rematch!`;
  };
  upd();
  clearInterval(countdownTimer);
  countdownTimer = setInterval(upd, 250);
  show("results");
  for (const p of roster.values()) sendStatus(p);
  resultsTimer = setTimeout(() => {
    clearInterval(countdownTimer);
    toLobby();
  }, RESULTS_MS);
}

// ── Housekeeping tick ─────────────────────────────────────────────────────────
let lastAutoShown = null;
setInterval(() => {
  if (phase !== "lobby") return;
  const now = Date.now();
  let changed = false;
  for (const p of [...roster.values()]) {
    if (!p.connected && now - p.goneAt > LOBBY_DROP_MS) {
      roster.delete(p.id);
      changed = true;
    }
  }
  if (changed) saveRoster();
  const n = connectedCount();
  if (n === 0) autoStartAt = null;
  else if (autoStartAt == null) autoStartAt = now + AUTO_START_MS;
  if (autoStartAt != null && now >= autoStartAt) {
    // Hold the auto-start (up to DRAW_HOLD_MS) while someone is drawing; BONK still starts.
    const busy = drawers().length > 0;
    if (busy && drawHoldUntil == null) {
      drawHoldUntil = autoStartAt + DRAW_HOLD_MS;
      changed = true; // tell the phones the countdown is on hold
    }
    if (!busy || now >= drawHoldUntil) {
      if (drawHoldUntil != null && !busy) drawHoldUntil = null;
      startCountdown(null);
      if (phase === "countdown") return;
      // nobody free to play (everyone's drawing): try again shortly
      autoStartAt = now + 5_000;
      drawHoldUntil = null;
    }
  }
  renderLobby();
  // Keep the phones' "starts in N s" honest every few seconds (they count down locally).
  const autoIn = autoStartAt ? Math.ceil((autoStartAt - now) / 1000) : null;
  if (changed || (autoIn !== lastAutoShown && (autoIn == null || autoIn % 5 === 0))) broadcastLobby();
  lastAutoShown = autoIn;
}, 250);

setInterval(() => {
  if (phase === "lobby") refreshInfo();
}, 30_000);

// ── Host keyboard ─────────────────────────────────────────────────────────────
window.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  if (e.code === "KeyG" && phase === "lobby") {
    switchGame(e.shiftKey ? -1 : 1);
  } else if ((e.key === "Enter" || e.code === "Space") && phase === "lobby") {
    e.preventDefault();
    startCountdown(null);
  } else if (e.key === "Enter" && phase === "results") {
    toLobby();
  } else if (e.code === "KeyP" && phase === "playing") {
    isPaused = !isPaused;
    game.pause(isPaused);
    $("paused").classList.toggle("show", isPaused);
  } else if (e.key === "Escape" && (phase === "playing" || phase === "countdown" || phase === "results")) {
    toLobby();
  }
});
window.addEventListener("pointerdown", () => renderLobby());

// ── Boot ──────────────────────────────────────────────────────────────────────
window.__party = {
  stats,
  get phase() {
    return phase;
  },
  get roster() {
    return [...roster.values()].map(({ id, slot, name, character, connected, x, b, drawing }) => ({ id, slot, name, character, connected, x, b, drawing }));
  },
  get round() {
    return round && { players: round.players.map(({ character, ...p }) => (character ? { ...p, character: character.src } : p)), names: Object.fromEntries(round.nameById), out: [...round.out], placement: round.placement, ended: round.ended };
  },
  get padUrl() {
    return padUrl;
  },
  get autoStartAt() {
    return autoStartAt;
  },
  get drawHoldUntil() {
    return drawHoldUntil;
  },
  start: () => startCountdown(null),
  lobby: () => toLobby(),
};

/** Lobby only: switch the hub to the next (dir 1) / previous game. Reloads the TV page with
 *  ?game=<id>; the roster is saved and the phones stay connected through the server. */
function switchGame(dir, toId) {
  if (phase !== "lobby" && phase !== "boot") return;
  const next = (toId && GAMES.find((g) => g.id === toId)) || GAMES[(GAMES.indexOf(GAME) + dir + GAMES.length) % GAMES.length];
  if (next === GAME) return;
  try { localStorage.setItem(GAME_KEY, next.id); } catch {}
  saveRoster();
  const q = new URLSearchParams(location.search);
  q.set("game", next.id);
  location.search = q.toString();
}

function renderHub() {
  document.title = `${HUB_NAME} — ${GAME.name}`;
  $("hub-title").textContent = HUB_NAME.toUpperCase();
  $("tagline").textContent = HUB_TAGLINE;
  $("game-blurb").textContent = GAME.tagline;
  $("game-pick").innerHTML =
    `<span class="gp-label">Game</span>` +
    GAMES.map((g) => `<span class="gp-game${g === GAME ? " on" : ""}">${esc(g.name)}</span>`).join("") +
    `<span class="gp-hint">“Switch game” on any phone</span>`;
}

async function boot() {
  await netReady; // the web version first sets up (or rejoins) its room
  if (lobbyUI()) lobbyUI().onPick = (id) => switchGame(1, id);
  renderHub();
  loadRoster();
  renderLobby();
  const mod = await import(new URL(GAME.module, import.meta.url).href);
  game = mod.default;
  await Promise.all([refreshInfo(), refreshCharacters()]);
  const res = await fetch(new URL(GAME.props, import.meta.url));
  gameProperties = (await res.json()).properties;
  game.setup({
    clientId: 0,
    gameId: GAME.gameId,
    gameModeId: "classic",
    isHost: true,
    isDevMode: true,
    gameProperties,
    hud: {
      setup(cfg) {
        hudConfig = cfg || {};
      },
      updatePlayers() {
        throw new Error("hud.updatePlayers is not available during setup");
      },
      updateScreenPoints() {
        throw new Error("hud.updateScreenPoints is not available during setup");
      },
    },
    setupDone() {
      setupDone = true;
    },
  });
  phase = "lobby";
  show("lobby");
  renderLobby();
  connect();
}

boot().catch((err) => {
  console.error("[party] boot failed", err);
  $("net-status").textContent = `Boot failed: ${err && err.message}`;
  $("net-status").classList.add("bad");
});
