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
// stick: "x" = left/right only, "xy" = a 2D stick (sent as a0/a1), "motion" = paddling with the
// phone like a kayak paddle (b0 / b1 = a left / right stroke, a0 = 0). button = the action's name.
const GAMES = [
  {
    id: "sky", name: "Sky Scramble", gameId: "skyscramble", button: "BONK", stick: "x",
    module: "../../sky/gc.game.js", props: "../../sky/gc.properties.json",
    tagline: "Bounce up the clouds · BONK your friends · last one up wins!",
    minPlayers: 1, maxPlayers: 8, controls: "stick-x",
  },
  {
    id: "snowball", name: "Snowball Sumo", gameId: "snowballsumo", button: "SHOVE", stick: "xy",
    soloBots: 3,
    module: "../../games/snowball/gc.game.js", props: "../../games/snowball/gc.properties.json",
    tagline: "Roll and grow · SHOVE your friends off · last snowball on the island wins!",
    minPlayers: 1, maxPlayers: 8, controls: "stick-xy",
  },
  {
    id: "row", name: "Row Row Rumble", gameId: "rowrowrumble", button: "PADDLE", stick: "motion",
    seats: true, // two per boat: everyone picks a boat + seat in the lobby; bots fill the rest
    module: "../../games/row/gc.game.js", props: "../../games/row/gc.properties.json",
    tagline: "Captain rows · first mate steers and throws · first to the lighthouse wins!",
    minPlayers: 1, maxPlayers: 8, controls: "paddle",
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
// …except a lone player, who gets bots to play against: per game (GAME.soloBots), else SOLO_BOTS.
// Snowball Sumo needs rivals to push off; Sky Scramble can be climbed alone.
const SOLO_BOTS = 0;
const roundTarget = (humanCount) => (humanCount === 1 ? 1 + (GAME.soloBots ?? SOLO_BOTS) : MIN_ROUND_PLAYERS);
const AUTO_START_MS = 20_000;
const AUTO_START = false; // lobby v2: the game picker starts the round (no timers)
const DRAW_HOLD_MS = 60_000; // auto-start waits at most this much longer while someone is drawing
const COUNTDOWN_MS = 3_000;
const RESULTS_MS = 8_000;
const LOBBY_DROP_MS = 90_000; // a phone gone this long (in the lobby) frees its slot
const REJOIN_GRACE_MS = 15_000; // a phone that dropped this recently still gets into the next round
const ROSTER_KEY = "sky-scramble-party-roster";

// Slot i → colour i (white = "unset" is never used). Same order as mock-platform.js.
const COLOR_KEYS = ["blue", "red", "green", "cyan", "yellow", "purple", "pink", "brown"];

// ── Seats (games with `seats`: Row Row Rumble v2) ─────────────────────────────
// Always BOATS boats, two seats each. Seat ids stay "paddle" / "captain" (the game contract), but
// players see them as the CAPTAIN (rows, seat "paddle") and the FIRST MATE (steers by tilt, aims
// with a stick and fires, seat "captain"). People pick a seat in the lobby; on start the unseated
// get the first free seat (rowing seat first) and bots fill every seat that's still empty.
const BOATS = 4;
const BOAT_KEYS = ["red", "blue", "green", "yellow"];
const BOAT_NAMES = ["Red", "Blue", "Green", "Yellow"];
const SEATS = ["paddle", "captain"];
const SEAT_NAMES = { paddle: "Captain", captain: "First mate" }; // what players see
const validSeat = (st) => !!st && Number.isInteger(st.boat) && st.boat >= 0 && st.boat < BOATS && SEATS.includes(st.seat);

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
let countdownCueId = "";
let resultsTimer = null;
let padUrl = `http://${location.host}/pad`;
let roomCode = null;

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
    const list = [...roster.values()].map(({ id, slot, name, character, seat }) => ({ id, slot, name, character, seat }));
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
      const seat = validSeat(p.seat) && ![...roster.values()].some((q) => sameSeat(q.seat, p.seat)) ? { boat: p.seat.boat, seat: p.seat.seat } : null;
      roster.set(p.id, { id: p.id, slot: p.slot, name: p.name || `Player ${p.slot + 1}`, character, seat, connected: false, goneAt: now, x: 0, b: 0, lastB: 0, drawing: false });
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
      for (const p of msg.pads) onJoin(p.id, p.name, p.character, p.drawing, p.audioReady);
      break;
    }
    case "join":
      onJoin(msg.id, msg.name, msg.character, msg.drawing, msg.audioReady);
      break;
    case "state": {
      const p = roster.get(msg.id);
      if (p) {
        if (typeof msg.audioReady === "boolean") p.audioReady = msg.audioReady;
        setDrawing(p, msg.drawing === true);
      }
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
      onInput(msg.id, Number(msg.x) || 0, Number(msg.y) || 0, msg.b ? 1 : 0, msg.c ? 1 : 0, Number(msg.s) || 0);
      break;
    case "seat":
      onSeat(msg.id, msg.boat, msg.seat);
      break;
    case "pick": // legacy "Switch game" button: the game picker cycles the hub's game
      if (roster.get(msg.id)?.connected && mayPick(msg.id)) switchGame(1);
      break;
    case "browse":
    case "pickGame":
    case "roll":
    case "skipTurn":
    case "start":
      onLobbyMsg(msg);
      break;
    case "replaced":
      wsReplaced = true;
      setNet(false);
      break;
  }
}

// ── Players joining / leaving ─────────────────────────────────────────────────
function onJoin(id, name, character, drawing, audioReady) {
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
    p = { id, slot, name: "", character: null, seat: null, connected: true, goneAt: 0, x: 0, b: 0, lastB: 0, drawing: false };
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
  p.audioReady = audioReady === true;
  // A rejoining phone starts neutral until it sends input again.
  p.x = 0;
  p.b = 0;
  p.c = 0;
  p.lastB = 0;
  forwardInput(p);
  if (round && !round.ended) {
    const pid = p.slot + 1;
    if (round.humanIdByPid.get(pid) === p.id) round.nameById.set(pid, p.name);
  }
  saveRoster();
  if (!lob.order.includes(p.id)) lob.order.push(p.id);
  lob.names[p.id] = p.name;
  fixRoles();
  saveLobby();
  sendStatus(p);
  toPad(p.id, { t: "lobby", s: lobbyState() }); // a (re)joining phone gets the lobby state right away
  if (phase === "lobby") broadcastLobby();
  else publishLobby();
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
  p.c = 0;
  p.lastB = 0;
  forwardInput(p); // neutral while disconnected
}

function inRound(p) {
  return !!(round && !round.ended && round.humanIdByPid.get(p.slot + 1) === p.id);
}

// ── Inputs ────────────────────────────────────────────────────────────────────
function onInput(id, x, y, b, c = 0, s = 0) {
  const p = roster.get(id);
  if (!p || !p.connected) return;
  p.x = clamp(x, -1, 1);
  p.y = GAME.stick === "xy" || GAME.seats ? clamp(y, -1, 1) : 0; // a captain's aim stick is 2D too
  p.s = GAME.seats ? clamp(s, -1, 1) : 0; // a captain's tilt steering
  p.b = b;
  p.c = GAME.stick === "motion" ? c : 0; // the second button (right paddle) only matters for rowing
  const down = b || p.c ? 1 : 0;
  const pressed = down && !p.lastB;
  p.lastB = down;
  if (phase === "playing") forwardInput(p);
  else if (phase === "lobby" && pressed) startCountdown(p);
}

function forwardInput(p) {
  if (phase !== "playing" || !inRound(p)) return;
  stats.inputsForwarded++;
  const pid = p.slot + 1;
  const seat = round.seatByPid && round.seatByPid.get(pid);
  if (seat === "captain") game.inputs(pid, { a0: p.x || 0, a1: p.y || 0, a2: p.s || 0, b0: p.b ? 1 : 0, b1: 0 });
  else if (seat === "paddle") game.inputs(pid, { a0: 0, a1: 0, a2: 0, b0: p.b ? 1 : 0, b1: p.c ? 1 : 0 });
  else game.inputs(pid, { a0: p.x, a1: p.y || 0, b0: p.b, b1: p.c || 0 });
}

// ── Seats ─────────────────────────────────────────────────────────────────────
const sameSeat = (a, b) => !!a && !!b && a.boat === b.boat && a.seat === b.seat;
const seatHolders = () => [...roster.values()].filter((q) => q.seat && (q.connected || Date.now() - q.goneAt < REJOIN_GRACE_MS));

/** A phone tapped a seat (boat 0..3 + "paddle"|"captain"), or boat null = stand up. Lobby only. */
function onSeat(id, boat, seat) {
  const p = roster.get(id);
  if (!p || !p.connected || !GAME.seats) return;
  if (phase !== "lobby" && phase !== "boot") return sendStatus(p);
  const want = boat == null ? null : { boat: Number(boat), seat: String(seat) };
  if (want && !validSeat(want)) return sendStatus(p);
  if (!want || sameSeat(p.seat, want)) p.seat = null; // tapping your own seat again stands you up
  else if (seatHolders().some((q) => q !== p && sameSeat(q.seat, want))) return sendStatus(p); // taken
  else p.seat = want;
  saveRoster();
  broadcastLobby();
  renderLobby();
}

/** Who sits where: [{ paddle: {name, me?}|null, captain: … } × BOATS] for the lobby screens. */
function boatsView(forId) {
  const view = Array.from({ length: BOATS }, () => ({ paddle: null, captain: null }));
  for (const q of seatHolders()) view[q.seat.boat][q.seat.seat] = { name: q.name, away: !q.connected, ...(q.id === forId ? { me: true } : {}) };
  return view;
}

/** Give everyone in `humans` a seat (keep valid unique picks; the rest get the first free seat, paddler first). */
function assignSeats(humans) {
  const taken = new Set();
  const key = (st) => `${st.boat}:${st.seat}`;
  for (const p of humans) {
    if (validSeat(p.seat) && !taken.has(key(p.seat))) taken.add(key(p.seat));
    else p.seat = null;
  }
  for (const p of humans) {
    if (p.seat) continue;
    outer: for (let boat = 0; boat < BOATS; boat++)
      for (const seat of SEATS)
        if (!taken.has(`${boat}:${seat}`)) {
          p.seat = { boat, seat };
          taken.add(`${boat}:${seat}`);
          break outer;
        }
  }
  saveRoster();
}

// ── Lobby v2: roles, turns, party scoreboard, look ────────────────────────────
// Two rotating roles: the GAME PICKER chooses the next game, the THEME ROLLER rolls the lobby
// look. Different people when there are ≥2 players; both pass to the next player (join order,
// skipping anyone away) after every round. No timers: anyone can skip either turn. Party points:
// 3/2/1 for 1st/2nd/3rd (people only; boat crews share their boat's place). The whole state goes
// to the TV UI (globalThis.FOXBOX_LOBBY_STATE + a "foxbox:lobby" event) and to every phone
// ({t:"lobby", s}). It survives the TV page reloading to another game (sessionStorage).
const LOBBY_KEY = "foxbox-lobby";
const POINTS = [0, 3, 2, 1];
const randSeed = () => Math.floor(Math.random() * 0x7fffffff);
const lob = {
  order: [], // player ids in join order
  names: {}, // id -> last known name (for the scoreboard after someone leaves)
  pickerId: null,
  rollerId: null,
  points: {}, // id -> party points
  look: { seed: randSeed(), rollCount: 0 },
  browse: { gameId: GAME.id, view: "cards", flipped: false },
  selectedGameId: null,
  lastResults: [],
};
function saveLobby() {
  try {
    sessionStorage.setItem(LOBBY_KEY, JSON.stringify(lob));
  } catch {}
}
function loadLobby() {
  try {
    const v = JSON.parse(sessionStorage.getItem(LOBBY_KEY));
    if (!v || typeof v !== "object") return;
    for (const k of Object.keys(lob)) if (k in v && v[k] != null) lob[k] = v[k];
    if (!GAMES.some((g) => g.id === lob.selectedGameId)) lob.selectedGameId = null;
    if (!GAMES.some((g) => g.id === lob.browse?.gameId)) lob.browse = { gameId: GAME.id, view: "cards", flipped: false };
  } catch {}
}
/** Present (connected, or dropped only a moment ago) — a role holder keeps their turn through a reload. */
function present(id) {
  const p = id && roster.get(id);
  return !!p && (p.connected || Date.now() - p.goneAt < REJOIN_GRACE_MS);
}
const presentOrder = () => lob.order.filter((id) => roster.get(id)?.connected);
/** The next connected player after `id` in join order (wrapping), avoiding `avoid` when possible. */
function nextAfter(id, avoid) {
  const live = presentOrder();
  if (!live.length) return null;
  const all = lob.order;
  const start = all.indexOf(id);
  for (let k = 1; k <= all.length; k++) {
    const cand = all[(start + k + all.length) % all.length];
    if (live.includes(cand) && (cand !== avoid || live.length === 1)) return cand;
  }
  return live[0];
}
/** Fill / repair the roles. Returns true if anything changed. */
function fixRoles() {
  const before = lob.pickerId + "|" + lob.rollerId;
  // "present" includes phones that dropped a moment ago (a TV reload reconnects them one by one:
  // don't treat the first one back as a solo player and hand them both roles)
  const live = lob.order.filter(present);
  if (!presentOrder().length) return false;
  if (!present(lob.pickerId)) lob.pickerId = lob.pickerId && lob.order.includes(lob.pickerId) ? nextAfter(lob.pickerId, lob.rollerId) : live[0];
  if (!present(lob.rollerId)) lob.rollerId = lob.rollerId && lob.order.includes(lob.rollerId) ? nextAfter(lob.rollerId, lob.pickerId) : nextAfter(lob.pickerId, lob.pickerId);
  if (live.length >= 2 && lob.rollerId === lob.pickerId) lob.rollerId = nextAfter(lob.pickerId, lob.pickerId);
  if (live.length === 1) lob.pickerId = lob.rollerId = live[0]; // solo: both
  return before !== lob.pickerId + "|" + lob.rollerId;
}
function rotateRoles() {
  const p0 = lob.pickerId, r0 = lob.rollerId;
  lob.pickerId = nextAfter(p0, null);
  lob.rollerId = nextAfter(r0, lob.pickerId);
  fixRoles();
  lob.browse = { gameId: GAME.id, view: "cards", flipped: false };
}
function newLook() {
  lob.look = { seed: randSeed(), rollCount: (lob.look.rollCount || 0) + 1 };
}
const mayPick = (id) => id === lob.pickerId || !present(lob.pickerId);
/** Party points for a finished round: place = finish place (boat place for crews), people only. */
function awardPoints(r) {
  const placeByPid = new Map();
  if (GAME.seats) {
    const boatOf = new Map(r.players.map((pl) => [pl.playerId, pl.boat]));
    const boatRank = new Map();
    for (const pid of r.placement) {
      const b = boatOf.get(pid);
      if (!boatRank.has(b)) boatRank.set(b, boatRank.size + 1);
      placeByPid.set(pid, boatRank.get(b));
    }
  } else r.placement.forEach((pid, i) => placeByPid.set(pid, i + 1));
  const results = [];
  for (const [pid, place] of placeByPid) {
    const id = r.humanIdByPid.get(pid);
    if (!id) continue;
    const pts = POINTS[place] || 0;
    lob.points[id] = (lob.points[id] || 0) + pts;
    results.push({ id, name: r.nameById.get(pid) || lob.names[id] || "?", place, points: pts });
  }
  results.sort((a, b) => a.place - b.place);
  lob.lastResults = results;
  saveLobby();
}
function leaderId() {
  let best = null;
  for (const id of lob.order) if ((lob.points[id] || 0) > 0 && (best == null || lob.points[id] > lob.points[best])) best = id;
  return best;
}
function lobbyState() {
  const placeOf = new Map(lob.lastResults.map((x) => [x.id, x.place]));
  const lobbyish = phase === "lobby" || phase === "boot";
  return {
    phase: lobbyish ? (lob.selectedGameId === GAME.id ? "setup" : "lobby") : phase,
    room: roomCode,
    joinUrl: padUrl,
    currentGameId: GAME.id,
    players: lob.order
      .filter((id) => roster.has(id))
      .map((id) => {
        const p = roster.get(id);
        return {
          id, name: p.name, color: colorSet(p.slot).base, slot: p.slot + 1, connected: p.connected,
          points: lob.points[id] || 0, isPicker: id === lob.pickerId, isRoller: id === lob.rollerId,
          ...(placeOf.has(id) ? { place: placeOf.get(id) } : {}),
        };
      }),
    pickerId: lob.pickerId,
    rollerId: lob.rollerId,
    leaderId: leaderId(),
    games: GAMES.map((g) => ({
      id: g.id, name: g.name, tagline: g.tagline, button: g.button, minPlayers: g.minPlayers, maxPlayers: g.maxPlayers,
      controls: g.controls, teams: !!g.seats, loop: `lobby2/media/${g.id}.mp4`, poster: `lobby2/media/${g.id}.jpg`,
    })),
    browse: lob.browse,
    selectedGameId: lob.selectedGameId,
    look: lob.look,
    lastResults: lob.lastResults,
  };
}
let lastPublished = "";
function publishLobby() {
  const st = lobbyState();
  const json = JSON.stringify(st);
  if (json === lastPublished) return;
  lastPublished = json;
  globalThis.FOXBOX_LOBBY_STATE = st;
  try {
    window.dispatchEvent(new CustomEvent("foxbox:lobby", { detail: st }));
  } catch {}
  wsSend({ t: "all", m: { t: "lobby", s: st } });
}
/** The picker chose a game: the hub switches to it (the TV page reloads) and waits in setup. */
function pickGame(gameId) {
  if (phase !== "lobby" && phase !== "boot") return;
  const g = GAMES.find((q) => q.id === gameId);
  if (!g) return;
  lob.selectedGameId = g.id;
  lob.browse = { ...lob.browse, gameId: g.id };
  saveLobby();
  if (g !== GAME) return switchGame(0, g.id);
  broadcastLobby();
  renderLobby();
}
function onLobbyMsg(msg) {
  const p = roster.get(msg.id);
  if (!p || !p.connected) return;
  const lobbyish = phase === "lobby" || phase === "boot";
  switch (msg.t) {
    case "browse":
      if (!lobbyish || msg.id !== lob.pickerId) return;
      if (!GAMES.some((g) => g.id === msg.gameId)) return;
      lob.browse = { gameId: msg.gameId, view: msg.view === "grid" ? "grid" : "cards", flipped: !!msg.flipped };
      publishLobby();
      break;
    case "pickGame":
      if (lobbyish && mayPick(msg.id)) pickGame(msg.gameId);
      break;
    case "roll":
      if (!lobbyish || msg.id !== lob.rollerId) return;
      newLook();
      saveLobby();
      publishLobby();
      break;
    case "skipTurn": {
      const role = msg.role === "roller" ? "roller" : "picker";
      if (role === "picker") lob.pickerId = nextAfter(lob.pickerId, lob.rollerId);
      else lob.rollerId = nextAfter(lob.rollerId, lob.pickerId);
      if (presentOrder().length >= 2 && lob.pickerId === lob.rollerId) {
        if (role === "picker") lob.rollerId = nextAfter(lob.pickerId, lob.pickerId);
        else lob.pickerId = nextAfter(lob.rollerId, lob.rollerId);
      }
      if (role === "picker") lob.browse = { gameId: GAME.id, view: "cards", flipped: false };
      saveLobby();
      broadcastLobby();
      renderLobby();
      break;
    }
    case "start":
      if (!lobbyish || !mayPick(msg.id)) return;
      if (lob.selectedGameId && lob.selectedGameId !== GAME.id) return pickGame(lob.selectedGameId);
      if (!lob.selectedGameId) {
        lob.selectedGameId = GAME.id;
        saveLobby();
      }
      startCountdown(p);
      break;
  }
}
/** One line for the fallback lobby: who picks, who rolls, who leads. */
function roleLine() {
  const nm = (id) => (id && (roster.get(id)?.name || lob.names[id])) || "—";
  const parts = [];
  if (lob.pickerId) parts.push(`🎮 ${nm(lob.pickerId)} picks the game`);
  if (lob.rollerId) parts.push(`🎲 ${nm(lob.rollerId)} rolls the look`);
  const lead = leaderId();
  if (lead) parts.push(`👑 ${nm(lead)} ${lob.points[lead]} pts`);
  return parts.join("  ·  ");
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
    game: { id: GAME.id, name: GAME.name, button: GAME.button, stick: GAME.stick, count: GAMES.length, ...(GAME.seats ? { seats: true } : {}) },
    hub: HUB_NAME,
    ...(GAME.seats ? { seat: p.seat ? { ...p.seat, color: colorSet(COLOR_KEYS.indexOf(BOAT_KEYS[p.seat.boat])), boatName: BOAT_NAMES[p.seat.boat] } : null, boats: boatsView(p.id), boatColors: BOAT_KEYS.map((k) => colorSet(COLOR_KEYS.indexOf(k)).base) } : {}),
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
    // Crew members share their boat's outcome even though placement lists each seat separately.
    const winnerBoat = GAME.seats ? round.players.find((pl) => pl.playerId === round.placement[0])?.boat : null;
    const won = GAME.seats ? winnerBoat != null && round.players.find((pl) => pl.playerId === pid)?.boat === winnerBoat : place === 1;
    return { ...base, state: "results", place, won, total: round.placement.length, winner: round.nameById.get(round.placement[0]) };
  }
  if (round.out.has(pid)) return { ...base, state: "out" };
  return { ...base, state: "playing" };
}

function sendStatus(p) {
  if (p.connected) toPad(p.id, statusFor(p));
}
function broadcastLobby() {
  for (const p of roster.values()) sendStatus(p);
  publishLobby();
}

// ── Screens ───────────────────────────────────────────────────────────────────
// Optional lobby screen supplied by the page (the web version's FoxBox UI):
// globalThis.FOXBOX_LOBBY_UI = { visible(on), render(state), room({code, joinUrl}), onPick: set below }.
const lobbyUI = () => globalThis.FOXBOX_LOBBY_UI || null;

function show(id) {
  queueMicrotask(publishLobby);
  for (const s of ["lobby", "countdown", "results"]) $(s).classList.toggle("show", s === id);
  lobbyUI()?.visible(id === "lobby");
  $("hud").classList.toggle("show", phase === "playing" || phase === "results");
}

function renderLobby() {
  const list = [...roster.values()].sort((a, b) => a.slot - b.slot);
  if (GAME.seats) return renderSeatLobby(list);
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
  $("auto-text").textContent = [roleLine(), autoTxt, botTxt].filter(Boolean).join("  ·  ");
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
    status: n > 0 ? [`Press ${GAME.button} on a phone to start!`, roleLine(), autoTxt, botTxt].filter(Boolean).join("  ·  ") : null,
  });
}

/** The lobby for a seats game: 4 boats × (paddler, captain), names or "bot". */
function renderSeatLobby(list) {
  const view = boatsView();
  const seated = seatHolders().length;
  const cells = [];
  const web = [];
  for (let boat = 0; boat < BOATS; boat++) {
    const c = colorSet(COLOR_KEYS.indexOf(BOAT_KEYS[boat]));
    for (const seat of SEATS) {
      const who = view[boat][seat];
      cells.push(
        `<div class="chip seat${who ? "" : " botseat"}${who && who.away ? " off" : ""}" style="${colorVars(c)}"><span class="ball"></span>` +
          `<span class="nm">${esc(who ? who.name : "Bot")}</span><span class="tag">${esc(SEAT_NAMES[seat])}</span></div>`,
      );
      // the card's colour says which boat; the tag just says which seat
      web.push({ slot: boat * 2 + (seat === "paddle" ? 1 : 2), name: who ? who.name : "Bot", color: c.base, ready: !!who && !who.away, tag: who && who.away ? "away" : SEAT_NAMES[seat] });
    }
  }
  const chipsHtml = cells.join("");
  if ($("chips").dataset.html !== chipsHtml) {
    $("chips").innerHTML = chipsHtml;
    $("chips").dataset.html = chipsHtml;
  }
  const n = connectedCount();
  $("count").textContent = `${seated} / ${BOATS * 2} seats`;
  const unseated = list.filter((p) => p.connected && !p.seat).length;
  const st = $("start-text");
  if (n > 0) {
    st.textContent = `Pick a boat on your phone · ${GAME.button} or FIRE starts!`;
    st.classList.remove("idle");
  } else {
    st.textContent = "Scan the code with your phone to join";
    st.classList.add("idle");
  }
  const autoTxt = autoStartAt ? `Starting by itself in ${Math.max(0, Math.ceil((autoStartAt - Date.now()) / 1000))} s` : "";
  const seatTxt = unseated ? `${unseated} still picking a seat` : n > 0 ? "Bots take the empty seats" : "";
  $("auto-text").textContent = [roleLine(), autoTxt, seatTxt].filter(Boolean).join("  ·  ");
  const active = AUTOPLAY_OK || (navigator.userActivation ? navigator.userActivation.hasBeenActive : true);
  $("sound-hint").textContent = active ? "" : "Click once on this page to turn the sound on";
  lobbyUI()?.render({
    players: web,
    games: GAMES.map((g) => ({ id: g.id, name: g.name, button: g.button, blurb: g.tagline })),
    current: GAME.id,
    status: n > 0 ? [`Pick a boat on your phone · ${GAME.button} or FIRE starts!`, roleLine(), autoTxt].filter(Boolean).join("  ·  ") : null,
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
        roomCode = info.room;
        $("room-code").hidden = false;
        $("room-code").textContent = info.room;
        // test hook only when this page's lobby is the one on screen (the web lobby UI shows its own)
        if (!lobbyUI()) $("room-code").dataset.roomCode = info.room;
        else delete $("room-code").dataset.roomCode;
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
function toLobby(afterRound = false) {
  if (afterRound) {
    rotateRoles();
    lob.selectedGameId = null;
    lob.browse = { gameId: GAME.id, view: "cards", flipped: false };
    saveLobby();
  }
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
  autoStartAt = AUTO_START && connectedCount() > 0 ? Date.now() + AUTO_START_MS : null;
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
  countdownCueId = `${Date.now()}-${stats.rounds + 1}`;
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
      const available = [...roster.values()]
        .filter((p) => p.connected && !p.drawing && (!globalThis.FOXBOX_LOBBY2 || p.audioReady))
        .sort((a, b) => a.slot - b.slot).map((p) => p.id);
      const cue = { 3: "three", 2: "two", 1: "one" }[left];
      if (cue && available.length) {
        const targetId = available[(3 - left) % available.length];
        wsSend({ t: "all", m: { t: "soundCue", id: `${countdownCueId}-${cue}`, cue, targetId } });
      }
      // restart the pop animation
      $("cd-num").style.animation = "none";
      void $("cd-num").offsetWidth;
      $("cd-num").style.animation = "";
    }
  };
  $("cd-num").textContent = "";
  show("countdown");
  broadcastLobby();
  tick();
  countdownTimer = setInterval(tick, 100);
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
  const seatByPid = new Map();
  const players = [];
  if (GAME.seats) {
    // Every seat of every boat is filled: people where they sat (or the first free seat), bots elsewhere.
    assignSeats(humans);
    const taken = new Map(humans.map((p) => [`${p.seat.boat}:${p.seat.seat}`, p]));
    const freeIds = [...Array(MAX_PLAYERS).keys()].map((i) => i + 1).filter((id) => !usedSlots.has(id - 1));
    let botN = 0;
    for (let boat = 0; boat < BOATS; boat++)
      for (const seat of SEATS) {
        const p = taken.get(`${boat}:${seat}`);
        if (p) {
          // both crew members (and bot fillers) wear the BOAT's colour, so HUD cards, nametags and boats match
          players.push({ type: "player", playerId: p.slot + 1, color: BOAT_KEYS[boat], boat, seat, name: p.name });
          nameById.set(p.slot + 1, p.name);
          humanIdByPid.set(p.slot + 1, p.id);
          seatByPid.set(p.slot + 1, seat);
        } else {
          const pid = freeIds.shift();
          players.push({ type: "bot", playerId: pid, color: BOAT_KEYS[boat], boat, seat });
          nameById.set(pid, `Bot ${++botN}`);
          seatByPid.set(pid, seat);
        }
      }
  }
  for (const p of GAME.seats ? [] : humans) {
    const pl = { type: "player", playerId: p.slot + 1, color: COLOR_KEYS[p.slot] };
    const character = characterField(p);
    if (character) pl.character = character; // party-mode extra; absent = puffball
    players.push(pl);
    nameById.set(p.slot + 1, p.name);
    humanIdByPid.set(p.slot + 1, p.id);
  }
  let botN = 0;
  const target = GAME.seats ? 0 : roundTarget(humans.length);
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
  if (!GAME.seats) players.sort((a, b) => a.playerId - b.playerId);
  // seats games: the HUD / results colour a player by their BOAT
  for (const pl of players) colorById.set(pl.playerId, GAME.seats ? colorSet(COLOR_KEYS.indexOf(BOAT_KEYS[pl.boat])) : colorSet(pl.playerId - 1));

  round = {
    players,
    nameById,
    colorById,
    humanIdByPid,
    seatByPid,
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
  // A game can ask for no player panel (Snowball Sumo: hud.setup({players:{hidden:true}})).
  $("scoreboard").style.display = hudPanelHidden() ? "none" : "";
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
    $("cd-num").textContent = "GO!";
    $("cd-sub").textContent = "";
    show("countdown");
    wsSend({ t: "all", m: { t: "soundCue", id: `${countdownCueId}-go`, cue: "go" } });
    setTimeout(() => { if (round === r && phase === "playing") show(null); }, 350);
    // Push whatever the phones are holding right now.
    for (const p of humans) forwardInput(p);
  };
  if (started && typeof started.then === "function") started.then(go, go);
  else go();
  broadcastLobby();
}

const hudPanelHidden = () => !!(hudConfig && hudConfig.players && hudConfig.players.hidden);

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
  if (hudPanelHidden()) return; // eliminations/placement above still count; just no panel
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
  awardPoints(r);
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
    toLobby(true);
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
      lob.order = lob.order.filter((id) => id !== p.id);
      changed = true;
    }
  }
  if (changed) saveRoster();
  if (fixRoles()) {
    saveLobby();
    changed = true;
  }
  const n = connectedCount();
  if (n === 0) autoStartAt = null;
  else if (autoStartAt == null && AUTO_START) autoStartAt = now + AUTO_START_MS;
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
    toLobby(true);
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
    return [...roster.values()].map(({ id, slot, name, character, connected, x, b, drawing, seat }) => ({ id, slot, name, character, connected, x, b, drawing, seat }));
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
  get lobbyState() {
    return lobbyState();
  },
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
  if (lobbyUI()) lobbyUI().onPick = (id) => pickGame(id);
  loadLobby();
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
  publishLobby();
  connect();
}

boot().catch((err) => {
  console.error("[party] boot failed", err);
  $("net-status").textContent = `Boot failed: ${err && err.message}`;
  $("net-status").classList.add("bad");
});
