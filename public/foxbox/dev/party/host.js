/**
 * host.js — Sky Scramble PARTY MODE, the TV host page.
 *
 * Runs the real game module (build/gc.game.js) and plays the part of the Gaming Couch
 * platform around it, with phones as the controllers:
 *   - LOBBY: QR code + URL for /pad, joined players as coloured chips, "press BONK to start"
 *     (any joined player; also auto-starts AUTO_START_MS after someone is in the lobby)
 *   - ROUND: setup() once, play() per round with the joined players + bots (the host's BOTS setting:
 *     FILL = bots take every free slot up to the game's maxPlayers, OFF = people only; type "bot" → the game drives them,
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
 * Sky Scramble setup (lobby phase "setup": Sky picked): every phone goes straight to its character
 * picker, then a READY screen; the phone reports {t:"skyReady", setupId, picked, ready}. The TV
 * lists who's ready (#sky-ready) and the countdown starts once every connected player is. Enter /
 * Space on the TV still starts right away (everyone not drawing plays).
 *
 * Talks to tools/party-server.ts over /ws?role=host (see the protocol in that file).
 * Each phone keeps a persistent client id, so a reconnecting phone gets its slot back.
 *
 * Host keyboard (optional): Enter/Space start · P pause · Esc abort round → lobby.
 */

import qrcodegen from "./vendor/qrcodegen.js";
import { crownedPuff, sprite } from "./pixel-art.js";
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
    tagline: "Bounce up the clouds · BONK your friends · last doodle standing!",
    minPlayers: 1, maxPlayers: 8, controls: "stick-x",
  },
  {
    id: "snowball", name: "Snowball Sumo", gameId: "snowballsumo", button: "SHOVE", stick: "xy",
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
  {
    // TEE TIME (topgolf-range): turn-based golf. The phone UI is its own module (dev/party/golf/, see
    // pad.js) and talks to the game through {t:"game"} messages: play() ctx.phones + the module's
    // fromPhone(). button = the lobby's start button (the swing itself is motion only, never a tap).
    id: "golf", name: "TEE TIME", gameId: "teetime", button: "START", stick: "golf",
    module: "../../games/golf/gc.game.js", props: "../../games/golf/gc.properties.json",
    tagline: "Swing your phone like a club!",
    minPlayers: 1, maxPlayers: 8, controls: "Aim with the arrows · swing your phone like a club",
    intro: "ready", // turn-based: a short READY… GO! over the range (the in-game countdown, see beginIntro)
    // TEE TIME's setup: the game picker chooses the map on their phone (golf-pad.js setup cards, {t:"game", m:{type:"map"}});
    // the TV shows it (#golf-map) and play() gets it as ctx.options.map ("random" = the game draws one)
    maps: [{ id: "sunny", name: "SUNNY RANGE" }, { id: "sunset", name: "SUNSET LINKS" }, { id: "night", name: "NIGHT LIGHTS" }, { id: "candy", name: "CANDY COURSE" }, { id: "random", name: "RANDOM" }],
    // the lobby card's back (lobby2's infoFor: these fields win over its built-in copy)
    card: {
      chip: "Aim + Swing",
      motion: true,
      rules: [
        "Take turns: one golfer swings, everyone watches the TV",
        "Aim with the arrows, tap SWING, then swing your phone like a club",
        "Longest Drive, Target Range, then Closest to the Pin",
        "Watch the wind flag!",
      ],
      win: "Most points after three challenges wins",
    },
  },
  // ── KNIGHT (Knight Platformer) ──
  {
    // Knight Platformer (knight-platformer repo; players see the working title "NONAME"): a co-op platformer, the
    // phones are sideways gamepads. The phone UI is its own module (dev/party/knight/knight-pad.js, see pad.js): the
    // setup (knight + sword, READY, the picker's LEVEL) and the round. It talks to the game through {t:"game"} messages
    // (knight-platformer CONTRACT.md "Phone protocol"); the setup's own messages (kpick / klevel / kother) are handled
    // here (see "Knight Platformer setup" below).
    id: "knight", name: "NONAME", gameId: "knightplatformer", button: "START", stick: "knight",
    module: "../../games/knight/gc.game.js", props: "../../games/knight/gc.properties.json",
    tagline: "Run, jump, dash and swing · grab the coins · first to the flag!",
    minPlayers: 1, maxPlayers: 8, controls: "◀ ▶ run · JUMP · DASH · SWORD (phone sideways)",
    // the picker's level cards (knight-platformer src/levels/index.js PICKS; Lakota, Nov 1: "I like Night and Day, let's
    // just have those 2 options"): the castle's NIGHT and DAY looks are two levels, the same map (level) in its look
    // (castle). Forest / Caves wait here, hidden (not built: not on the phones' cards nor the TV panel).
    levels: [
      { id: "castle-night", name: "CASTLE RAMPARTS · NIGHT", level: "castle", castle: "night", open: true },
      { id: "castle-day", name: "CASTLE RAMPARTS · DAY", level: "castle", castle: "day", open: true },
      { id: "forest", name: "ENCHANTED FOREST", open: false, hidden: true },
      { id: "caves", name: "CRYSTAL CAVES", open: false, hidden: true },
    ],
    knights: ["A", "B", "C", "D", "E", "F", "G", "I"], // the art's ids (CONTRACT "Art APIs"); default = by slot, like game.js
    // multi-TV: the module's playMirror shows the round live on every TV (own knights predicted on their own TV); its
    // phones' {type:"in"} reach that TV's view first (FOXBOX_HOUSE_GAME, see mirrorGameInput) and the main TV with m.at
    swords: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
    card: {
      chip: "Co-op Platformer",
      rules: [
        "Run, jump, wall-run, dash and swing your sword",
        "Everyone plays the same level together",
        "Coins +1, gems +5, first to the flag gets a bonus",
        "Pits, spikes and monsters cost a heart: keep your three!",
      ],
      win: "Most points at the flag wins",
    },
  },
  // ── end KNIGHT ──
  // ── KART (FOX KART) ──
  {
    // FOX KART (fox-kart repo): an original retro kart racer, 1–8 racers (bots fill), the phones held sideways as tilt
    // wheels with GAS + ITEM. The phone UI is its own module (dev/party/kart/kart-pad.js, see pad.js): the setup (a racer,
    // READY) and the race. It talks to the game through {t:"game"} messages (fox-kart CONTRACT.md "Phone protocol"); the
    // setup's own messages (fkpick / fktrack / fkother) are handled here (see "FOX KART setup" below).
    id: "kart", name: "FOX KART", gameId: "foxkart", button: "START", stick: "kart",
    module: "../../games/kart/gc.game.js", props: "../../games/kart/gc.properties.json",
    tagline: "Tilt to steer · grab FOX BOXES · first across the line!",
    minPlayers: 1, maxPlayers: 8, controls: "Tilt to steer · GAS · ITEM (phone sideways)",
    racers: ["fox", "puff", "cat", "frog", "knight", "penguin", "bunny", "raccoon"], // the art's ids (CONTRACT "Art APIs"); default = by slot, like game.js
    tracks: [{ id: "rampart", name: "RAMPART RUN", laps: 3, open: true }],
    // ONE countdown (the game runs its own grid swoop + start lights): intro "own" = no shell countdown at all (no
    // 3-2-1, no phone cues, no GO! card): play() starts unpaused and the start lights are the countdown
    intro: "own",
    card: {
      chip: "Kart Racer",
      motion: true,
      rules: [
        "Tilt your phone to steer, hold GAS",
        "Drive through FOX BOXES, tap ITEM to use it",
        "3 laps around the castle — watch for shortcuts",
        "THUNDER PUFF hunts whoever is 1st!",
      ],
      win: "First across the line after 3 laps wins",
    },
  },
  // ── end KART ──
  // ── WHOSFOX (WHO'S THE FOX?) ──
  {
    // WHO'S THE FOX? (whos-the-fox repo, Lakota's design): a social game. Every phone gets a secret task (a photo, a
    // 5 s clip, a 10 s voice take, a doodle, a few typed words, or something done live); one player is secretly THE FOX
    // and fakes it. The TV shows a cosy meeting room (who's done), then the SHOWCASE of everyone's takes (never the
    // tasks), the vote (WHO'S THE FOX? + EMPLOYEE OF THE MONTH) and the reveal; every vote sends one player out until two
    // are left. The phone UI is its own module (dev/party/whosfox/whosfox-pad.js); everything rides {t:"game", m}.
    // People only (bots: false: BOTS FILL leaves it alone); 3+ players (see "WHOSFOX setup" below).
    id: "whosfox", name: "WHO'S THE FOX?", gameId: "whosthefox", button: "START", stick: "whosfox",
    module: "../../games/whosfox/gc.game.js", props: "../../games/whosfox/gc.properties.json",
    tagline: "Secret tasks on your phone · one of you is faking it · find the fox!",
    minPlayers: 3, maxPlayers: 8, bots: false, controls: "Your phone: a secret task, the camera, the mic, DONE, then vote",
    // not a reflex game, and its round opens with its own title sweep (WHO'S THE FOX? + the rules): that IS its start
    // (a held first frame froze the sweep half-drawn under READY…), so no shell countdown, like FOX KART's lights
    intro: "own",
    card: {
      chip: "Secret Tasks + Vote",
      rules: [
        "Everyone gets a secret task: a photo, a clip, a voice take, a doodle...",
        "One of you is the fox and has to fake it",
        "Watch the takes on the TV, then vote: who's the fox?",
        "Every vote sends someone out, until two are left",
      ],
      win: "Most points wins: survive, spot the fox, or fool everyone",
    },
  },
  // ── end WHOSFOX ──
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
// ── BOTS: FILL / OFF (Lakota, day 2) ──────────────────────────────────────────────────────────────────────
// One host setting for every game. FILL: bots take every free player slot up to the game's maxPlayers (8 in
// all, across every TV of a party). OFF: people only, no bots at all (Snowball's old 3 bots for a lone player
// and Row's bot crews follow it too: a Row boat with one person keeps its game-driven autopilot partner, but
// boats with nobody aboard sit out). Where it's set (Lakota): the web HOST steps' last step; the TV lobby's
// "BOTS: FILL / OFF" label by the party info (click it on a TV with a mouse, or press B); and the HOST'S PHONE
// only (its lobby screen; web: the HOST person's phone, else / package: the oldest phone here). The TV keeps the
// last choice (localStorage). Bots run on the main TV only (the referee) and show on every TV like any other
// player; they never score FoxBox points (see awardPoints).
// Bot players reach play() as { type: "bot", bot: true, playerId, color, name } — a game drives its own bots
// from that (Sky: sim.js botInput; Snowball + Row: their bots; TEE TIME: its bot golfers). A game that can't
// drive bots says `bots: false` in GAMES (FILL then leaves it people-only): the hook for games folded in later.
const BOTS_KEY = "foxbox-bots";
let botsMode = "off"; // "fill" | "off" (read in boot(), after the web HOST steps)
function loadBotsMode() {
  try {
    return localStorage.getItem(BOTS_KEY) === "fill" ? "fill" : "off";
  } catch {
    return "off";
  }
}
const botsOn = () => botsMode === "fill" && GAME.bots !== false;
/** Players a round gets: everyone here, plus (FILL) bots up to the game's maxPlayers. */
const roundTarget = (humanCount) => (botsOn() ? Math.max(humanCount, Math.min(MAX_PLAYERS, GAME.maxPlayers || MAX_PLAYERS)) : humanCount);
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
/** Why the countdown is running: "ready" (Sky: everyone tapped READY) | "start" (anything else). */
let countdownWhy = "start";
let resultsTimer = null;
/** When the results screen goes back to the lobby (the phones count down to it too). */
let resultsEndsAt = 0;
let padUrl = `http://${location.host}/pad`;
let roomCode = null;
let rowSetupId = newRowSetupId();
// Multi-TV (web build + relay only; see the "Multi-TV" section below and mirror.js)
let mirror = null; // set when THIS page is an extra TV (JOIN GAME / ?join=INVITE) showing someone else's party
let mirrorKit = null; // ./mirror.js, loaded on a relay party (the main TV) or on an extra TV
const linkedTvs = new Map(); // the main TV: the extra TVs linked to this party, id → {at}

const stats = { rounds: 0, gameOvers: 0, lastPlacement: null, inputsForwarded: 0, lastPoints: null, contractErrors: [] };

// ── Drawn characters ──────────────────────────────────────────────────────────
/** id → { id, name, src, hitbox } from /api/characters. */
let characters = new Map();
/** src → preloaded <img>, so play() doesn't wait on the network. */
const charImgs = new Map();
let charFetch = null;
let charFetchAgain = false;

function refreshCharacters() {
  if (mirror) return Promise.resolve(); // an extra TV: its pictures come from the main TV ({t:"m:pic"}, mirrorPic)
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
      sendTvPics(); // multi-TV: a new picture goes to the extra TVs
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
    if (mirror) {
      if (!mirror.full) mirror.ui.waiting(true); // a second TV: the boss's page is reloading or gone
    } else {
      // Everyone's input goes neutral while we can't hear them.
      for (const p of roster.values()) markGone(p);
    }
    renderLobby();
    setTimeout(connect, 1000);
  };
  sock.onerror = () => {};
}

function wsSend(obj) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
}
function toPad(id, m) {
  if (!mirror) wsSend({ t: "to", id, m }); // a second TV has no phones of its own
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
  if (mirror) return mirrorMsg(msg); // a second TV only listens to the boss
  switch (msg.t) {
    case "pads": {
      const here = new Set(msg.pads.map((p) => p.id));
      for (const p of roster.values()) if (!here.has(p.id)) markGone(p);
      for (const p of msg.pads) onJoin(p.id, p.name, p.character, p.drawing, p.audioReady, p.house);
      break;
    }
    case "join":
      onJoin(msg.id, msg.name, msg.character, msg.drawing, msg.audioReady, msg.house);
      break;
    case "screen": // an extra TV linked / left (web build + relay)
      onTvB(msg);
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
    case "rowReady":
      onRowReady(msg);
      break;
    case "skyReady":
      onSkyReady(msg);
      break;
    case "game": // FoxBox party extension: a phone's message for the running game (TEE TIME)
      onGameMsg(msg);
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
function onJoin(id, name, character, drawing, audioReady, house) {
  if (typeof id !== "string" || !id) return;
  let p = roster.get(id);
  const isNew = !p;
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
  // multi-TV: the id of the extra TV whose QR this phone scanned ("" = this TV's own QR)
  p.house = typeof house === "string" ? house.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 24) : "";
  p.rowSetupNonce = newRowSetupId();
  p.rowReady = false;
  p.motionReady = false;
  p.rowSetupId = null;
  cancelRowCountdown();
  // Sky: someone new during the everyone's-ready countdown picks a character and readies up too
  // (a phone that only reconnected keeps its pick and its READY)
  if (isNew) cancelSkyCountdown();
  if (isNew) cancelKnightCountdown(); // KNIGHT: the same for the knight setup's everyone's-ready countdown
  if (isNew) cancelKartCountdown(); // KART: the same for the kart setup's everyone's-ready countdown
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
  if (on && GAME.id === "row") {
    p.rowReady = false;
    cancelRowCountdown();
  }
  if (on && lob.sky?.ready[p.id]) {
    // drawing a new character: not ready any more (the phone says so too, from its picker)
    delete lob.sky.ready[p.id];
    saveLobby();
  }
  if (phase === "lobby") broadcastLobby();
  renderLobby();
}

/** Connected phones that are drawing right now (they hold the auto-start). */
function drawers() {
  return [...roster.values()].filter((p) => p.connected && p.drawing);
}

function markGone(p) {
  if (!p.connected) return;
  if (ptrTv) ptrTv.remove(p.id); // USE CURSOR: its cursor goes with it
  p.connected = false;
  p.goneAt = Date.now();
  p.x = 0;
  p.b = 0;
  p.c = 0;
  p.lastB = 0;
  p.rowReady = false;
  p.motionReady = false;
  p.rowSetupId = null;
  cancelRowCountdown();
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
  else if (phase === "lobby" && pressed && GAME.id !== "row") {
    // Sky's setup goes by READY; a BONK there (a phone still on the old controller page) counts as
    // that player's READY with the character they have
    if (skySetupActive()) skySet(p, true, true);
    else startCountdown(p);
  }
}

/** {t:"game", id, m} → game.fromPhone(playerId, m): only while a round runs, only from that round's people. */
/** TEE TIME's setup is on: golf is the hub's game and the picked one, in the lobby. */
function golfSetupActive() {
  return GAME.id === "golf" && lob.selectedGameId === "golf" && !!lob.golf && (phase === "lobby" || phase === "boot");
}
/** TEE TIME: the picker's phone chose the map (setup only; the TV shows it, play() gets it). */
function onGolfMap(msg) {
  const p = roster.get(msg.id);
  if (!p || !p.connected || !golfSetupActive() || !mayPick(msg.id)) return;
  const id = String(msg.m.id || "");
  if (!(GAME.maps || []).some((m) => m.id === id)) return;
  lob.golf = { map: id };
  saveLobby();
  publishLobby();
  renderGolfMap();
}
function onGameMsg(msg) {
  if (msg.m && typeof msg.m === "object" && msg.m.type === "ptr") return onPointerMsg(msg); // USE CURSOR (the lobby's pointers)
  if (msg.m && typeof msg.m === "object" && msg.m.type === "map") return onGolfMap(msg); // TEE TIME's setup
  if (msg.m && typeof msg.m === "object" && msg.m.type === "bots") return onBotsMsg(msg); // the host phone's BOTS toggle
  if (msg.m && typeof msg.m === "object" && msg.m.type === "party") return onPartyMsg(msg); // web TV mode: the host phone's group name / public
  // Sky's doodle vote — only while Sky is the game: WHO'S THE FOX? sends its own {type:"vote"} to its game (fromPhone)
  if (GAME.id === "sky" && msg.m && typeof msg.m === "object" && (msg.m.type === "vote" || msg.m.type === "vitem")) return onSkyVoteMsg(msg);
  if (onKnightMsg(msg)) return; // KNIGHT: the knight setup's kpick / klevel / kother (the module isn't running yet)
  if (onKartMsg(msg)) return; // KART: the kart setup's fkpick / fktrack / fkother (the module isn't running yet)
  const p = roster.get(msg.id);
  if (!p || !p.connected || phase !== "playing" || !inRound(p) || !msg.m || typeof msg.m !== "object") return;
  if (!game || typeof game.fromPhone !== "function") return;
  stats.gameMsgs = (stats.gameMsgs || 0) + 1;
  try {
    game.fromPhone(p.slot + 1, msg.m);
  } catch (err) {
    stats.contractErrors.push(`fromPhone threw: ${(err && err.message) || err}`);
    console.error("[party] fromPhone threw", err);
  }
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
  p.rowSetupNonce = newRowSetupId();
  p.rowReady = false;
  p.motionReady = false;
  p.rowSetupId = null;
  saveRoster();
  broadcastLobby();
  renderLobby();
}

/** Who sits where: [{ paddle: {name, me?}|null, captain: … } × BOATS] for the lobby screens. */
function boatsView(forId) {
  const view = Array.from({ length: BOATS }, () => ({ paddle: null, captain: null }));
  for (const q of seatHolders()) view[q.seat.boat][q.seat.seat] = { name: q.name, away: !q.connected, ready: rowPlayerReady(q), ...(q.house ? { house: q.house } : {}), ...(q.id === forId ? { me: true } : {}) };
  return view;
}

// Row starts only after every connected person has set up their own phone and
// explicitly readied in this setup. Bots fill spare seats without joining this gate.
function newRowSetupId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
function resetRowSetup() {
  rowSetupId = newRowSetupId();
  for (const p of roster.values()) {
    p.rowReady = false;
    p.motionReady = false;
    p.rowSetupId = null;
  }
}
function rowPlayerReady(p) {
  return !!(p.connected && !p.drawing && validSeat(p.seat) && p.rowReady && p.motionReady && p.rowSetupId === rowSetupToken(p));
}
function rowSetupToken(p) { return `${rowSetupId}:${p.rowSetupNonce || "0"}`; }
function rowReadiness() {
  const people = [...roster.values()].filter(p => p.connected);
  return { readyCount: people.filter(rowPlayerReady).length, totalCount: people.length };
}
function allRowReady() {
  const { readyCount, totalCount } = rowReadiness();
  return lob.selectedGameId === "row" && totalCount > 0 && readyCount === totalCount;
}
function cancelRowCountdown() {
  if (GAME.id !== "row" || phase !== "countdown") return;
  if (round && !round.ended) return; // IN-GAME COUNTDOWN: a round exists (training / 3-2-1): nothing to call off
  clearInterval(countdownTimer);
  phase = "lobby";
  autoStartAt = null;
  resetRowSetup();
  show("lobby");
  broadcastLobby();
  renderLobby();
}
function onRowReady(msg) {
  if (GAME.id !== "row" || lob.selectedGameId !== "row" || !["lobby", "countdown"].includes(phase)) return;
  const p = roster.get(msg.id);
  if (!p?.connected || msg.setupId !== rowSetupToken(p) || !validSeat(p.seat) ||
      msg.boat !== p.seat.boat || msg.seat !== p.seat.seat) return;
  p.motionReady = msg.motionReady === true;
  p.rowReady = msg.ready === true && p.motionReady && !p.drawing;
  p.rowSetupId = rowSetupToken(p);
  if (!rowPlayerReady(p)) cancelRowCountdown();
  broadcastLobby();
  renderLobby();
  if (phase === "lobby" && p.rowReady && allRowReady()) startCountdown(p);
}

// ── Sky Scramble setup: pick a character, then READY ─────────────────────────
// Once Sky is picked (lobby phase "setup") every phone shows its character picker, then a READY
// screen. lob.sky = { id, picked: {playerId: true}, ready: {playerId: true} }, saved with the lobby
// so a TV reload keeps everyone's progress; a new one each time Sky is picked. The countdown starts
// the moment every connected player is ready; CHANGE CHARACTER un-readies. Enter/Space overrides.
const SKY_DROP_WAIT_MS = 4000; // someone not ready dropped: wait this long before going without them
function skySetupActive() {
  return GAME.id === "sky" && lob.selectedGameId === "sky" && !!lob.sky && (phase === "lobby" || phase === "boot");
}
function newSkySetup() {
  lob.sky = { id: newRowSetupId(), picked: {}, ready: {} };
}
/** One player's step: "away" | "drawing" | "picking" | "chosen" (picked, not ready yet) | "ready". */
function skyState(p) {
  if (!p.connected) return "away";
  if (p.drawing) return "drawing";
  if (!lob.sky?.picked[p.id]) return "picking";
  return lob.sky.ready[p.id] ? "ready" : "chosen";
}
function skyReadiness() {
  const people = [...roster.values()].filter((p) => p.connected);
  return { readyCount: people.filter((p) => skyState(p) === "ready").length, totalCount: people.length };
}
function allSkyReady() {
  if (!skySetupActive()) return false;
  const { readyCount, totalCount } = skyReadiness();
  return totalCount > 0 && readyCount === totalCount;
}
/** A not-ready player dropped only a moment ago (a Wi-Fi blip, a phone locking): give them a chance. */
function skyWaitingOnDrop() {
  return [...roster.values()].some((p) => !p.connected && Date.now() - p.goneAt < SKY_DROP_WAIT_MS && !lob.sky?.ready[p.id]);
}
/** Record a player's step (ready needs a pick and no drawing open); everyone ready → countdown. */
function skySet(p, picked, ready) {
  if (!skySetupActive()) return;
  if (picked) lob.sky.picked[p.id] = true;
  else delete lob.sky.picked[p.id];
  if (picked && ready && !p.drawing) lob.sky.ready[p.id] = true;
  else delete lob.sky.ready[p.id];
  saveLobby();
  broadcastLobby();
  renderLobby();
  maybeStartSky();
}
/** Everyone connected is ready (and nobody not-ready dropped a moment ago): the doodle vote first when 2+ people play
 * their own drawing (once per setup), then the countdown. */
function maybeStartSky() {
  if (!(phase === "lobby" && allSkyReady() && !skyWaitingOnDrop())) return;
  const v = lob.sky.vote;
  if (v && v.step !== "done") return; // the vote is on: it comes back here when it's over
  if (!v) {
    const cands = skyVoteCands();
    if (cands.length >= 2) return startSkyVote(cands);
  }
  startCountdown(null, "ready");
}

// ── Sky Scramble: the doodle vote (Lakota, Nov 1) ──────────────────────────────────────────────────────
// Everyone's ready and at least 2 people play their own DRAWING (a drawing whose owner is that player): before the
// countdown every phone votes for its favourite doodle, never its own (puffball and selfie players vote too; bots aren't
// people here, so they neither vote nor count). The TV shows the doodles in a pixel gallery with the votes ticking in,
// SKY_VOTE_MS or until everyone has voted. A tie: a random one of the tied, after a drumroll. The winner picks a free
// starting item on their phone from Sky's power-ups (the jetpack items) and starts the round flying it (round player
// startItem → sim.js startJet). The referee (this TV) decides; phones on any TV vote ({t:"game"} reaches it through
// their TV), and the extra TVs draw the same gallery from lob.sky.vote (m:lobby carries lob).
// lob.sky.vote = { id, step: "vote" | "tie" | "pick" | "won" | "done", cands: [{ id, char }], votes: { voterId: candId },
//   ends, allAt, counts, tied, tieEnds, winner, pickEnds, item, wonUntil }   (saved with the lobby)
const SKY_VOTE_MS = 15000, SKY_TIE_MS = 2600, SKY_PICK_MS = 12000, SKY_WON_MS = 3200, SKY_AWAY_PICK_MS = 3000;
const SKY_ITEMS = ["tanks", "hat", "balloons"]; // Sky's power-ups: the jetpack items (build/sim.js JET_KINDS)
const SKY_ITEM_LABEL = { tanks: "TANKS", hat: "HAT", balloons: "BALLOONS" };
/** The people here playing their own drawing (the vote's doodles). */
function skyVoteCands() {
  return [...roster.values()]
    .filter((p) => p.connected && lob.sky?.picked[p.id] && p.character && characters.get(p.character)?.owner === p.id)
    .sort((a, b) => a.slot - b.slot)
    .map((p) => ({ id: p.id, char: p.character }));
}
/** The people who can vote: here, and with a doodle that isn't theirs to vote for. */
function skyVoters(v) {
  return [...roster.values()].filter((p) => p.connected && v.cands.some((c) => c.id !== p.id)).map((p) => p.id);
}
function startSkyVote(cands) {
  lob.sky.vote = { id: newRowSetupId(), step: "vote", cands, votes: {}, ends: Date.now() + SKY_VOTE_MS, tied: [], winner: null, item: null };
  skyVoteChanged();
}
function skyVoteChanged() {
  saveLobby();
  broadcastLobby();
  renderLobby();
  renderSkyVote();
}
/** The vote's steps move on with the clock (the lobby loop, every 250 ms; a TV reload carries on from lob). */
function skyVoteTick() {
  const v = lob.sky && lob.sky.vote;
  if (!v || v.step === "done" || mirror || !skySetupActive() || phase !== "lobby") return;
  const now = Date.now();
  if (v.step === "vote") {
    const voters = skyVoters(v);
    const all = voters.length > 0 && voters.every((id) => v.votes[id]);
    if (all && !v.allAt) v.allAt = now;
    if (now >= v.ends || (all && now - v.allAt >= 900)) finishSkyVote(now); // (the last vote ticks in first)
    else renderSkyVote();
  } else if (v.step === "tie") {
    if (now >= v.tieEnds) {
      v.step = "pick";
      v.pickEnds = now + SKY_PICK_MS;
      skyVoteChanged();
    } else renderSkyVote();
  } else if (v.step === "pick") {
    const w = roster.get(v.winner);
    const away = !w || !w.connected; // the winner's phone is gone: a random item after a moment
    if (now >= v.pickEnds || (away && now >= v.pickEnds - SKY_PICK_MS + SKY_AWAY_PICK_MS)) skyItemPicked(SKY_ITEMS[Math.floor(Math.random() * SKY_ITEMS.length)]);
    else renderSkyVote();
  } else if (v.step === "won" && now >= v.wonUntil) {
    v.step = "done";
    skyVoteChanged();
    maybeStartSky(); // everyone ready → the countdown (someone who joined meanwhile readies up first)
  }
}
function finishSkyVote(now) {
  const v = lob.sky.vote;
  const counts = Object.fromEntries(v.cands.map((c) => [c.id, 0]));
  for (const [voter, to] of Object.entries(v.votes)) if (to in counts && voter !== to) counts[to]++;
  const max = Math.max(...Object.values(counts));
  const top = v.cands.map((c) => c.id).filter((id) => counts[id] === max);
  v.counts = counts;
  v.winner = top[Math.floor(Math.random() * top.length)]; // a tie: a random one of the tied (shown after the drumroll)
  if (top.length > 1) {
    v.step = "tie";
    v.tied = top;
    v.tieEnds = now + SKY_TIE_MS;
  } else {
    v.step = "pick";
    v.pickEnds = now + SKY_PICK_MS;
  }
  skyVoteChanged();
}
function skyItemPicked(item) {
  const v = lob.sky.vote;
  v.item = item;
  v.step = "won";
  v.wonUntil = Date.now() + SKY_WON_MS;
  skyVoteChanged();
}
/** {t:"game", m:{type:"vote", vote, for}} (a phone's vote) / {type:"vitem", vote, item} (the winner's free item). */
function onSkyVoteMsg(msg) {
  const v = lob.sky && lob.sky.vote, p = roster.get(msg.id), m = msg.m;
  if (mirror || !v || !p || !p.connected || m.vote !== v.id || !skySetupActive()) return;
  if (m.type === "vote") {
    const to = String(m.for || "");
    if (v.step !== "vote" || to === p.id || !v.cands.some((c) => c.id === to) || v.votes[p.id] === to) return;
    v.votes[p.id] = to;
    v.allAt = 0;
    skyVoteChanged();
  } else if (m.type === "vitem") {
    if (v.step !== "pick" || p.id !== v.winner || !SKY_ITEMS.includes(m.item)) return;
    skyItemPicked(m.item);
  }
}
/** The vote as one phone sees it (in its status): the doodles (not the running counts: the TV shows those), its vote. */
function skyVoteFor(p) {
  const v = lob.sky.vote, now = Date.now();
  const name = (id) => roster.get(id)?.name || "?";
  const shown = v.step !== "vote"; // the counts once the vote is over
  return {
    id: v.id, step: v.step,
    cands: v.cands.map((c) => ({ id: c.id, char: c.char, name: name(c.id), mine: c.id === p.id, ...(shown && v.counts ? { n: v.counts[c.id] || 0 } : {}) })),
    my: v.votes[p.id] || null,
    voted: Object.keys(v.votes).length, voters: skyVoters(v).length,
    left: Math.max(0, ((v.step === "vote" ? v.ends : v.step === "pick" ? v.pickEnds : now) - now) / 1000),
    tied: v.tied || [],
    winner: v.step === "tie" ? null : v.winner || null,
    winnerName: v.step !== "tie" && v.winner ? name(v.winner) : "",
    item: v.item || null, items: SKY_ITEMS,
  };
}
/** The round's start item: the vote's winner (if they play this round) gets their pick. */
function skyStartItem(p) {
  const v = GAME.id === "sky" && lob.sky && lob.sky.vote;
  return v && v.step === "done" && v.item && v.winner === p.id ? v.item : null;
}

/** The TV's gallery (every TV: the extra TVs draw it from lob too): the doodles, votes ticking in, the drumroll, the win. */
const SKY_VOTE_CSS = `
#sky-vote { position: fixed; inset: 0; z-index: 97; display: flex; align-items: center; justify-content: center; background: #050611c7;
  font-family: "FoxBox Pixel", ui-monospace, monospace; color: #fff9f1; pointer-events: none; }
#sky-vote[hidden] { display: none; }
#sky-vote .sv-panel { width: min(108rem, 94vw); max-height: 90vh; box-sizing: border-box; padding: 2.2rem 2.6rem 2rem; background: #101125;
  border: 0.32rem solid #fff9f1; box-shadow: 0 0.6rem 0 #04050e, 0 1.8rem 4rem #000a; display: flex; flex-direction: column; gap: 1.6rem; }
#sky-vote .sv-head { display: flex; align-items: center; justify-content: space-between; gap: 2rem; }
#sky-vote .sv-title { font-size: 2.2rem; line-height: 1.3; color: #ffd23f; text-shadow: 0.25rem 0.25rem 0 #0a1428; }
#sky-vote .sv-time { min-width: 5.6rem; padding: 0.7rem 1rem; text-align: center; font-size: 2.2rem; color: #0a1428; background: #ffd23f;
  box-shadow: 0 0 0 0.25rem #0a1428; }
#sky-vote .sv-time:empty { visibility: hidden; }
#sky-vote .sv-gal { list-style: none; margin: 0; padding: 2.8rem 0.4rem 0.4rem; display: flex; flex-wrap: wrap; justify-content: center; gap: 1.6rem; }
#sky-vote .sv-card { position: relative; width: 17rem; display: flex; flex-direction: column; align-items: center; gap: 0.8rem; padding: 1rem 1rem 1.1rem;
  background: #1b1d3a; box-shadow: 0 0 0 0.25rem #fff9f1, 0 0.5rem 0 0.25rem #04050e; transition: transform 0.15s; }
#sky-vote .sv-pic { width: 15rem; height: 15rem; display: flex; align-items: center; justify-content: center; background: #fff;
  background-image: linear-gradient(45deg, #e8edf4 25%, transparent 25%, transparent 75%, #e8edf4 75%), linear-gradient(45deg, #e8edf4 25%, transparent 25%, transparent 75%, #e8edf4 75%);
  background-size: 1.6rem 1.6rem; background-position: 0 0, 0.8rem 0.8rem; }
#sky-vote .sv-pic img { max-width: 92%; max-height: 92%; image-rendering: auto; }
#sky-vote .sv-name { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: "FoxBox Soft", ui-rounded, sans-serif;
  font-size: 1.9rem; color: #fff9f1; }
#sky-vote .sv-votes { display: flex; align-items: center; gap: 0.6rem; min-height: 2.2rem; font-size: 1.5rem; color: #ffd23f; }
#sky-vote .sv-votes i { width: 1rem; height: 1rem; background: #ffd23f; box-shadow: 0 0 0 0.18rem #0a1428; animation: sv-pop 0.35s steps(3, end); }
#sky-vote .sv-crown { position: absolute; top: -2.6rem; left: 50%; transform: translateX(-50%); }
#sky-vote .sv-card.lead { box-shadow: 0 0 0 0.25rem #ffd23f, 0 0.5rem 0 0.25rem #04050e; }
#sky-vote .sv-card.win { background: #2a2410; box-shadow: 0 0 0 0.4rem #ffd23f, 0 0.6rem 0 0.4rem #04050e; transform: scale(1.06); }
#sky-vote .sv-card.out { opacity: 0.45; }
#sky-vote .sv-card.drum { animation: sv-drum calc(var(--n, 2) * 0.22s) steps(1, end) infinite; animation-delay: calc(var(--i, 0) * 0.22s); }
#sky-vote .sv-foot { display: flex; align-items: center; justify-content: center; gap: 1.4rem; font-size: 1.1rem; line-height: 1.6; color: #c9c8df; text-align: center; }
#sky-vote .sv-foot .px-sprite { flex: none; }
@keyframes sv-pop { 0% { transform: scale(0.2); } 70% { transform: scale(1.35); } 100% { transform: scale(1); } }
@keyframes sv-drum { 0% { box-shadow: 0 0 0 0.4rem #ffd23f, 0 0.5rem 0 0.4rem #04050e; background: #2a2410; } 50% { box-shadow: 0 0 0 0.25rem #fff9f1, 0 0.5rem 0 0.25rem #04050e; background: #1b1d3a; } }
@media (prefers-reduced-motion: reduce) { #sky-vote .sv-card.drum, #sky-vote .sv-votes i { animation: none; } }
`;
// an extra TV's phones ask it for the pictures (net-p2p.js screenApi /api/characters): its small copies (m:pic)
globalThis.FOXBOX_SCREEN_CHARS = () => (mirror ? [...characters.values()].filter((c) => c && c.src).map((c) => ({ id: c.id, name: c.name || "", src: c.src, hitbox: c.hitbox || null })) : []);
let svBox = null;
function renderSkyVote() {
  const v = lob.sky && lob.sky.vote;
  const on = !!v && v.step !== "done" && skySetupActive() && phase === "lobby";
  if (!svBox) {
    if (!on) return;
    const st = document.createElement("style");
    st.id = "sky-vote-css";
    st.textContent = SKY_VOTE_CSS;
    document.head.append(st);
    svBox = document.createElement("div");
    svBox.id = "sky-vote";
    svBox.dataset.test = "sky-vote";
    svBox.innerHTML = '<div class="sv-panel"><div class="sv-head"><span class="sv-title"></span><span class="sv-time"></span></div><ol class="sv-gal"></ol><div class="sv-foot"></div></div>';
    document.body.append(svBox);
  }
  if (svBox.hidden === on) svBox.hidden = !on;
  if (!on) return;
  const clock = globalThis.FOXBOX_CLOCK && typeof globalThis.FOXBOX_CLOCK.bossNow === "function" ? globalThis.FOXBOX_CLOCK : null;
  const now = mirror && clock ? clock.bossNow() : Date.now();
  const name = (id) => roster.get(id)?.name || "?";
  const counts = v.counts || Object.fromEntries(v.cands.map((c) => [c.id, Object.values(v.votes || {}).filter((to) => to === c.id).length]));
  const max = Math.max(0, ...Object.values(counts));
  const winName = v.winner ? name(v.winner).toUpperCase() : "";
  const title = v.step === "vote" ? "VOTE FOR THE BEST DOODLE" : v.step === "tie" ? "IT'S A TIE! DRUMROLL..."
    : v.step === "pick" ? `${winName}'S DOODLE WINS!` : `${winName}'S DOODLE WINS · picks ${SKY_ITEM_LABEL[v.item] || ""}`;
  const left = v.step === "vote" ? v.ends - now : v.step === "pick" ? v.pickEnds - now : 0;
  const time = left > 0 ? String(Math.ceil(left / 1000)) : "";
  const cards = v.cands.map((c, i) => {
    const ch = characters.get(c.char);
    const pic = ch && ch.src ? `<img src="${esc(ch.src)}" alt="">` : sprite("puff", 6, { color: colorSet(roster.get(c.id)?.slot ?? 0).base });
    const n = counts[c.id] || 0;
    const tiedI = v.step === "tie" ? (v.tied || []).indexOf(c.id) : -1;
    const cls = v.step === "vote" ? (n > 0 && n === max ? "lead" : "")
      : v.step === "tie" ? (tiedI >= 0 ? "drum" : "out")
      : c.id === v.winner ? "win" : "out";
    const crown = (v.step === "pick" || v.step === "won") && c.id === v.winner ? `<span class="sv-crown">${sprite("crown", 4)}</span>` : "";
    const style = tiedI >= 0 ? ` style="--i:${tiedI};--n:${(v.tied || []).length}"` : "";
    return `<li class="sv-card ${cls}" data-player="${esc(c.id)}" data-votes="${n}"${style}>${crown}<span class="sv-pic">${pic}</span><span class="sv-name">${esc(name(c.id))}</span><span class="sv-votes">${n ? `${n} ${"<i></i>".repeat(Math.min(n, 8))}` : "&nbsp;"}</span></li>`;
  }).join("");
  const voters = mirror ? (v.cands.length ? [...roster.values()].filter((p) => p.connected).length : 0) : skyVoters(v).length;
  const foot = v.step === "vote" ? `${Object.keys(v.votes || {}).length} OF ${voters} VOTED · VOTE ON YOUR PHONE · NOT FOR YOUR OWN`
    : v.step === "tie" ? "A RANDOM ONE OF THE TIED WINS"
    : v.step === "pick" ? `${sprite("tanks", 3)}${sprite("hat", 3)}${sprite("balloons", 3)} ${esc(winName)} PICKS A FREE ITEM TO START WITH`
    : `${sprite(v.item || "balloons", 4)} ${esc(winName)} STARTS THE ROUND WITH ${esc(SKY_ITEM_LABEL[v.item] || "")}`;
  const html = `${title}|${time}|${cards}|${foot}`;
  if (svBox.dataset.html === html) return;
  svBox.dataset.html = html;
  svBox.dataset.step = v.step;
  svBox.querySelector(".sv-title").textContent = title;
  svBox.querySelector(".sv-time").textContent = time;
  const gal = svBox.querySelector(".sv-gal");
  if (gal.dataset.html !== cards) {
    gal.innerHTML = cards;
    gal.dataset.html = cards;
  }
  svBox.querySelector(".sv-foot").innerHTML = foot;
}
function onSkyReady(msg) {
  const p = roster.get(msg.id);
  if (!p?.connected) return;
  // not in Sky's setup, or an old setup's message: just tell the phone where things are
  if (!skySetupActive() || msg.setupId !== lob.sky.id) return sendStatus(p);
  skySet(p, msg.picked === true, msg.ready === true);
}
/** Someone new joined during the everyone's-ready countdown: back to the setup for them. */
function cancelSkyCountdown() {
  if (GAME.id !== "sky" || phase !== "countdown" || countdownWhy !== "ready") return;
  if (round && !round.ended) return; // IN-GAME COUNTDOWN: a round exists (training / 3-2-1): nothing to call off
  clearInterval(countdownTimer);
  phase = "lobby";
  autoStartAt = null;
  show("lobby");
  broadcastLobby();
  renderLobby();
}

// ── KNIGHT (Knight Platformer) ──
// ── Knight Platformer setup: a knight + a sword, READY; the game picker picks the LEVEL ──────────
// Once Knight Platformer is picked (lobby phase "setup") every phone's knight module (dev/party/knight/knight-pad.js)
// shows its knight + sword picker, then a READY screen; the picker also gets the LEVEL cards + PICK ANOTHER GAME.
// lob.knight = { id, level (the card: castle-night | castle-day), castle (its look), picks: { [clientId]: { knight, sword, ready } } }, saved with the lobby (a TV reload keeps it).
// Phone → TV ({t:"game", m}): {type:"kpick", setupId, knight, sword, ready} on every change · the picker only:
// {type:"klevel", id} (a level card: castle-night | castle-day; an older pad's {type:"kcastle", castle} picks the card with
// that look) and {type:"kother"} (PICK ANOTHER GAME: back to the game cards). The countdown
// starts once every connected player is ready (a not-ready player who just dropped gets KNIGHT_DROP_WAIT_MS); Enter on
// the TV starts at once (no pick = the default by slot). After the results: back here, picks kept, nobody ready.
const KNIGHT = GAMES.find((g) => g.id === "knight");
const KNIGHT_DROP_WAIT_MS = 4000;
const knightId = (v, list) => (typeof v === "string" && list.includes(v) ? v : null);
// Bots follow FoxBox's BOTS: FILL / OFF host setting (botsOn(), the B key / the host phone's toggle): FILL = bots in every
// free slot up to 8 through host.js's bot path (roundTarget; {type: "bot", bot: true, playerId, color, name}), OFF = none,
// not even solo. Each bot gets a random knight + sword picked in the setup (lob.knight.bots, re-rolled per setup); the TV
// panel lists the bots that will join and the phones' READY screen says "+N BOTS". Party points stay people-only.
const knightRandomPick = () => ({ knight: KNIGHT.knights[Math.floor(Math.random() * KNIGHT.knights.length)], sword: KNIGHT.swords[Math.floor(Math.random() * KNIGHT.swords.length)] });
function knightBotPick(slot) {
  if (lob.knight && !Array.isArray(lob.knight.bots)) lob.knight.bots = Array.from({ length: MAX_PLAYERS }, (_, i) => ({ slot: i, ...knightRandomPick() })); // (a setup saved before bots)
  return (lob.knight && lob.knight.bots.find((b) => b && b.slot === slot)) || knightRandomPick();
}
/** The slots bots would take in a knight round right now (FILL): every slot no roster member holds, up to maxPlayers. */
function knightBotSlots() {
  const fill = mirror ? mirror.bots === "fill" && GAME.bots !== false : botsOn(); // an extra TV shows the main TV's setting
  if (!fill || GAME.id !== "knight") return [];
  const held = new Set([...roster.values()].map((q) => q.slot));
  const free = [...Array(MAX_PLAYERS).keys()].filter((s) => !held.has(s));
  return free.slice(0, Math.max(0, Math.min(MAX_PLAYERS, GAME.maxPlayers || MAX_PLAYERS) - held.size));
}
/** startRound(): every bot gets its setup pick (knight + sword); host.js already marks them bot: true. */
function knightDressBots(players) {
  if (GAME.id !== "knight") return;
  for (const pl of players) {
    if (pl.type !== "bot") continue;
    const pk = knightBotPick(pl.playerId - 1);
    pl.bot = true;
    pl.knight = { knight: pk.knight, sword: pk.sword };
  }
}
/** The castle's look (the NIGHT / DAY level card the picker picked), remembered on this TV; night until someone picks. */
const KNIGHT_CASTLE_KEY = "foxbox-knight-castle";
const knightCastleSaved = () => { try { return localStorage.getItem(KNIGHT_CASTLE_KEY) === "day" ? "day" : "night"; } catch { return "night"; } };
const knightLook = (v) => (v === "day" || v === "night" ? v : null);
/** The level cards a picker can pick (open, not hidden). */
const knightCards = () => KNIGHT.levels.filter((l) => l.open && !l.hidden);
/** A setup's level card: its level id (castle-night / castle-day); an older value ("castle" + castle) → the matching card;
 *  no setup → the look this TV remembers. */
function knightCardOf(s) {
  const cards = knightCards(), id = s && s.level;
  const hit = cards.find((l) => l.id === id);
  if (hit) return hit;
  const look = knightLook(s && s.castle) || knightCastleSaved();
  return cards.find((l) => (l.level || l.id) === id && l.castle === look) || cards.find((l) => l.castle === look) || cards[0];
}
const knightCastleOf = (s) => { const c = knightCardOf(s); return knightLook(c && c.castle) || knightLook(s && s.castle) || knightCastleSaved(); };
/** Pick a level card (the picker's klevel, or an older pad's kcastle): the level + its look, remembered on this TV. */
function knightSetCard(card) {
  lob.knight.level = card.id;
  if (knightLook(card.castle)) {
    lob.knight.castle = card.castle; // (kept in step: anything reading lob.knight.castle sees the card's look)
    try { localStorage.setItem(KNIGHT_CASTLE_KEY, card.castle); } catch {}
  }
}
/** startRound(): the game's options get the card's map ("castle", what every module version knows) and its look. */
const knightOptions = () => {
  if (GAME.id !== "knight") return {};
  const c = knightCardOf(lob.knight);
  return { level: (c && (c.level || c.id)) || "castle", castle: knightCastleOf(lob.knight) };
};
function knightSetupActive() {
  return GAME.id === "knight" && lob.selectedGameId === "knight" && !!lob.knight && (phase === "lobby" || phase === "boot");
}
const validKnightSetup = (s) => !!s && typeof s === "object" && typeof s.id === "string" && typeof s.level === "string" && !!s.picks && typeof s.picks === "object";
/** A fresh setup; `keep` = the last one: picks kept (nobody ready), the same level. */
function newKnightSetup(keep) {
  const picks = {};
  if (keep) for (const [id, pk] of Object.entries(keep.picks)) if (roster.has(id) && pk) picks[id] = { knight: pk.knight, sword: pk.sword, ready: false };
  const bots = Array.from({ length: MAX_PLAYERS }, (_, slot) => ({ slot, ...knightRandomPick() })); // re-rolled per setup
  const card = knightCardOf(keep); // the same level card as last time (none: this TV's last look)
  lob.knight = { id: newRowSetupId(), level: card.id, picks, bots, castle: knightCastleOf({ level: card.id, castle: keep && keep.castle }) };
}
/** No pick yet: the default for this slot (the same as game.js: knight by slot, sword by slot). */
const knightDefault = (p) => ({ knight: KNIGHT.knights[p.slot % KNIGHT.knights.length], sword: KNIGHT.swords[p.slot % KNIGHT.swords.length] });
function knightPickOf(p) {
  const pk = lob.knight && lob.knight.picks[p.id], d = knightDefault(p);
  return { knight: knightId(pk && pk.knight, KNIGHT.knights) || d.knight, sword: knightId(pk && pk.sword, KNIGHT.swords) || d.sword };
}
const knightIsReady = (p) => !!(lob.knight && lob.knight.picks[p.id] && lob.knight.picks[p.id].ready);
/** Where a phone is in the setup (its kpick's step): "knight" (choosing a knight) | "sword" | "ready" (THAT'S ME). */
const knightStep = (p) => { const pk = lob.knight && lob.knight.picks[p.id]; return pk && (pk.step === "sword" || pk.step === "ready") ? pk.step : "knight"; };
/** One player's state on the TV: "away" | "knight" (picking a knight) | "sword" (picking a sword) | "picking" (that's me, not
 *  ready yet) | "ready". */
const knightState = (p) => (!p.connected ? "away" : knightIsReady(p) ? "ready" : knightStep(p) === "ready" ? "picking" : knightStep(p));
function knightReadiness() {
  const people = [...roster.values()].filter((p) => p.connected);
  return { readyCount: people.filter(knightIsReady).length, totalCount: people.length };
}
function allKnightReady() {
  if (!knightSetupActive()) return false;
  const { readyCount, totalCount } = knightReadiness();
  return totalCount > 0 && readyCount === totalCount;
}
/** Everyone connected is ready (and nobody not-ready dropped a moment ago): the countdown. */
function maybeStartKnight() {
  const dropWait = [...roster.values()].some((p) => !p.connected && Date.now() - p.goneAt < KNIGHT_DROP_WAIT_MS && !knightIsReady(p));
  if (phase === "lobby" && allKnightReady() && !dropWait) startCountdown(null, "ready");
}
/** Someone new joined during the everyone's-ready countdown: back to the setup for them. */
function cancelKnightCountdown() {
  if (GAME.id !== "knight" || phase !== "countdown" || countdownWhy !== "ready") return;
  if (round && !round.ended) return; // IN-GAME COUNTDOWN: a round exists (training / 3-2-1): nothing to call off
  clearInterval(countdownTimer);
  phase = "lobby";
  autoStartAt = null;
  show("lobby");
  broadcastLobby();
  renderLobby();
}
/** The lobby state's `knight` during the setup. */
function knightLobby() {
  const picks = {};
  for (const [id, pk] of Object.entries(lob.knight.picks)) if (roster.has(id) && pk) picks[id] = { knight: pk.knight, sword: pk.sword, ready: !!pk.ready, step: pk.step || "knight" };
  return { id: lob.knight.id, level: knightCardOf(lob.knight).id, levels: KNIGHT.levels, castle: knightCastleOf(lob.knight), picks, bots: knightBotSlots().length, ...knightReadiness() };
}
/** pickGame(): a fresh setup when the knight game is picked (unless it already is the pick); none for other games. */
function knightOnPick(g) {
  if (g.id !== "knight") lob.knight = null;
  else if (lob.selectedGameId !== "knight" || !validKnightSetup(lob.knight)) newKnightSetup(null);
}
/** {t:"game", m} from a phone: the setup's own messages. Returns true when it was one of them. */
function onKnightMsg(msg) {
  const m = msg.m;
  if (!m || typeof m !== "object" || !["kpick", "klevel", "kcastle", "kother"].includes(m.type)) return false;
  const p = roster.get(msg.id);
  if (!p || !p.connected) return true;
  if (!knightSetupActive()) return sendStatus(p), true; // not in the setup: just tell the phone where things are
  if (m.type === "kpick") {
    if (m.setupId !== lob.knight.id) return sendStatus(p), toPad(p.id, { t: "lobby", s: lobbyState() }), true; // an old setup's
    const d = knightDefault(p);
    const step = m.step === "sword" || m.step === "ready" ? m.step : m.step === "knight" ? "knight" : m.ready === true ? "ready" : "knight";
    lob.knight.picks[p.id] = { knight: knightId(m.knight, KNIGHT.knights) || d.knight, sword: knightId(m.sword, KNIGHT.swords) || d.sword, ready: m.ready === true, step };
  } else if (!mayPick(p.id)) return true; // the level and PICK ANOTHER GAME are the game picker's
  else if (m.type === "klevel") {
    // a level card (castle-night / castle-day); an older pad's "castle" keeps the current look
    const card = knightCards().find((l) => l.id === m.id) || knightCards().find((l) => (l.level || l.id) === m.id && l.castle === knightCastleOf(lob.knight));
    if (!card) return true; // COMING SOON / hidden / unknown
    knightSetCard(card);
  } else if (m.type === "kcastle") {
    // an older pad's DAY / NIGHT toggle: the card with that look on the same map
    if (m.castle !== "day" && m.castle !== "night") return true;
    const map = knightCardOf(lob.knight).level || "castle";
    const card = knightCards().find((l) => (l.level || l.id) === map && l.castle === m.castle);
    if (!card) return true;
    knightSetCard(card); // this round and the next setups on this TV
  } else {
    // kother, PICK ANOTHER GAME: back to the game cards (the TV stays on this game until the picker picks one)
    lob.knight = null;
    lob.selectedGameId = null;
    lob.browse = { gameId: GAME.id, view: "cards", flipped: false };
  }
  saveLobby();
  broadcastLobby();
  renderLobby();
  maybeStartKnight();
  return true;
}
/** startRound(): a round that started because everyone was ready takes the ready ones. */
const knightTakes = (p) => GAME.id !== "knight" || countdownWhy !== "ready" || !lob.knight || knightIsReady(p);
/** toLobby(): after the results everyone goes back to the FoxBox lobby (the game cards, Lakota); the next NONAME pick
 *  starts a fresh setup at the knight step (each phone preselects its last pick). A round / countdown called off goes
 *  back to the knight setup (picks kept, nobody ready). */
function knightBackToSetup(afterRound) {
  if (GAME.id !== "knight") return;
  if (afterRound) {
    lob.knight = null;
    lob.selectedGameId = null;
    lob.browse = { gameId: GAME.id, view: "cards", flipped: false };
    saveLobby();
    return;
  }
  if (lob.selectedGameId !== "knight" && !lob.knight) return;
  lob.selectedGameId = "knight";
  newKnightSetup(validKnightSetup(lob.knight) ? lob.knight : null);
  lob.browse = { gameId: GAME.id, view: "cards", flipped: false };
  saveLobby();
}
// ── end KNIGHT ──

// ── KART (FOX KART) ──
// ── FOX KART setup: a racer, READY; the track (one open: RAMPART RUN, 3 laps) ──────────────────
// Once FOX KART is picked (lobby phase "setup") every phone's kart module (dev/party/kart/kart-pad.js) shows its racer
// picker (8 critters, the kart in the player's slot colour), then READY (that tap also asks iPhone motion permission);
// the game picker also gets PICK ANOTHER GAME. lob.kart = { id, track, picks: { [clientId]: { racer, ready } }, bots },
// saved with the lobby (a TV reload keeps it); bots = this setup's racer order for the bots (re-rolled per setup).
// Phone → TV ({t:"game", m}): {type:"fkpick", setupId, racer, ready} on every change · the picker only: {type:"fktrack",
// id} (an open track) and {type:"fkother"} (PICK ANOTHER GAME: back to the game cards). The countdown starts once every
// connected player is ready (a not-ready player who just dropped gets KART_DROP_WAIT_MS); Enter on the TV starts at once
// (no pick = the racer by slot). After the results: the FoxBox lobby (Lakota's choice for NONAME); each phone's last
// racer is kept (lob.kartLast) and preselected the next time FOX KART is picked. A round / countdown called off (Esc)
// goes back to the setup, picks kept, nobody ready.
const KART = GAMES.find((g) => g.id === "kart");
const KART_DROP_WAIT_MS = 4000;
const kartRacer = (v) => (typeof v === "string" && KART.racers.includes(v) ? v : null);
const kartTrackOk = (id) => KART.tracks.some((t) => t.id === id && t.open);
const kartTrack = () => KART.tracks.find((t) => t.id === (lob.kart && lob.kart.track)) || KART.tracks.find((t) => t.open) || KART.tracks[0];
function kartSetupActive() {
  return GAME.id === "kart" && lob.selectedGameId === "kart" && !!lob.kart && (phase === "lobby" || phase === "boot");
}
const validKartSetup = (s) => !!s && typeof s === "object" && typeof s.id === "string" && typeof s.track === "string" && !!s.picks && typeof s.picks === "object";
function kartShuffled() {
  const a = KART.racers.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
/** A fresh setup; `keep` = the last one: its picks kept (nobody ready), the same track. The bots' racer order re-rolled. */
function newKartSetup(keep) {
  const picks = {};
  if (keep && keep.picks && typeof keep.picks === "object") for (const [id, pk] of Object.entries(keep.picks)) if (roster.has(id) && pk && kartRacer(pk.racer)) picks[id] = { racer: pk.racer, ready: false };
  const track = keep && kartTrackOk(keep.track) ? keep.track : (KART.tracks.find((t) => t.open) || KART.tracks[0]).id;
  lob.kart = { id: newRowSetupId(), track, picks, bots: kartShuffled() };
}
/** No pick yet: the racer this phone picked last time, else the one by slot (game.js does the same by slot). */
const kartDefault = (p) => kartRacer(lob.kartLast && lob.kartLast[p.id]) || KART.racers[p.slot % KART.racers.length];
function kartPickOf(p) {
  const pk = lob.kart && lob.kart.picks[p.id];
  return kartRacer(pk && pk.racer) || kartDefault(p);
}
const kartIsReady = (p) => !!(lob.kart && lob.kart.picks[p.id] && lob.kart.picks[p.id].ready);
/** One player's step: "away" | "picking" | "ready". */
const kartState = (p) => (!p.connected ? "away" : kartIsReady(p) ? "ready" : "picking");
function kartReadiness() {
  const people = [...roster.values()].filter((p) => p.connected);
  return { readyCount: people.filter(kartIsReady).length, totalCount: people.length };
}
function allKartReady() {
  if (!kartSetupActive()) return false;
  const { readyCount, totalCount } = kartReadiness();
  return totalCount > 0 && readyCount === totalCount;
}
/** Everyone connected is ready (and nobody not-ready dropped a moment ago): the countdown. */
function maybeStartKart() {
  const dropWait = [...roster.values()].some((p) => !p.connected && Date.now() - p.goneAt < KART_DROP_WAIT_MS && !kartIsReady(p));
  if (phase === "lobby" && allKartReady() && !dropWait) startCountdown(null, "ready");
}
/** Someone new joined during the everyone's-ready countdown: back to the setup for them. */
function cancelKartCountdown() {
  if (GAME.id !== "kart" || phase !== "countdown" || countdownWhy !== "ready") return;
  if (round && !round.ended) return; // IN-GAME COUNTDOWN: a round exists (training / 3-2-1): nothing to call off
  clearInterval(countdownTimer);
  phase = "lobby";
  autoStartAt = null;
  show("lobby");
  broadcastLobby();
  renderLobby();
}
/** The round FOX KART would start right now, by startRound()'s own rules (one plan for the TV panel, the lobby state and
 * the race, so the TV shows exactly the bots that will drive): the people = everyone connected (they'll all be READY at
 * the start) + people who dropped a moment ago (REJOIN_GRACE_MS) and were ready; the bots' slots = free slots first, then
 * slots held by people sitting it out (startRound's fill order); racers = the unpicked ones in this setup's order. */
function kartRoundPlan() {
  const fill = mirror ? mirror.bots === "fill" && GAME.bots !== false : botsOn(); // an extra TV shows the main TV's setting
  const now = Date.now();
  const humans = [...roster.values()]
    .filter((p) => !p.drawing && (p.connected || (now - p.goneAt < REJOIN_GRACE_MS && kartIsReady(p))))
    .sort((a, b) => a.slot - b.slot);
  const used = new Set(humans.map((p) => p.slot));
  const target = fill && GAME.id === "kart" ? Math.max(humans.length, Math.min(MAX_PLAYERS, GAME.maxPlayers || MAX_PLAYERS)) : humans.length;
  const slots = [];
  for (let s = 0; s < MAX_PLAYERS && humans.length + slots.length < target; s++) {
    if (used.has(s) || [...roster.values()].some((q) => q.slot === s)) continue;
    slots.push(s);
  }
  for (let s = 0; s < MAX_PLAYERS && humans.length + slots.length < target; s++) if (!used.has(s) && !slots.includes(s)) slots.push(s);
  slots.sort((a, b) => a - b);
  return { humans, slots, racers: kartBotRacers(slots, humans.map(kartPickOf)) };
}
/** The bots' racers (slot → racer): the racers nobody drives, in this setup's order (then repeats when they run out). */
function kartBotRacers(slots, taken) {
  const used = new Set(taken.filter(Boolean));
  const order = lob.kart && Array.isArray(lob.kart.bots) && lob.kart.bots.filter(kartRacer).length === KART.racers.length ? lob.kart.bots : KART.racers;
  const free = order.filter((r) => !used.has(r));
  const out = new Map();
  slots.forEach((slot, i) => out.set(slot, i < free.length ? free[i] : order[(i - free.length) % order.length]));
  return out;
}
/** startRound(): the READY flags are spent (a TV reload mid-race must not start another race from stale ones). */
function kartRoundStarts() {
  if (GAME.id !== "kart" || !lob.kart || !lob.kart.picks) return;
  for (const pk of Object.values(lob.kart.picks)) if (pk) pk.ready = false;
  saveLobby();
}
/** startRound(): every bot gets an unpicked racer (the TV panel showed the same); host.js already marks them bot: true. */
function kartDressBots(players) {
  if (GAME.id !== "kart") return;
  const bots = players.filter((pl) => pl.type === "bot");
  const racers = kartBotRacers(bots.map((pl) => pl.playerId - 1), players.filter((pl) => pl.type !== "bot").map((pl) => pl.kart && pl.kart.racer));
  for (const pl of bots) {
    pl.bot = true;
    pl.kart = { racer: racers.get(pl.playerId - 1) };
  }
}
/** startRound(): the game's options get the track. */
const kartOptions = () => (GAME.id === "kart" ? { track: kartTrack().id } : {});
/** The lobby state's `kart` during the setup. picks = this setup's real picks only (a phone with none shows its racer
 * picker); racerOf = the racer every roster player would drive right now (their pick, else last race's, else by slot). */
function kartLobby() {
  const picks = {}, racerOf = {};
  for (const [id, pk] of Object.entries(lob.kart.picks)) if (roster.has(id) && pk && kartRacer(pk.racer)) picks[id] = { racer: pk.racer, ready: !!pk.ready };
  for (const p of roster.values()) racerOf[p.id] = kartPickOf(p);
  const plan = kartRoundPlan(), slots = plan.slots, botRacers = plan.racers;
  const tr = kartTrack();
  return {
    id: lob.kart.id, track: tr.id, trackName: tr.name, laps: tr.laps || 3, tracks: KART.tracks, racers: KART.racers,
    picks, racerOf, bots: slots.length, botRacers: slots.map((s) => botRacers.get(s)), ...kartReadiness(),
  };
}
/** pickGame(): a fresh setup when FOX KART is picked (unless it already is the pick); none for other games. */
function kartOnPick(g) {
  if (g.id !== "kart") lob.kart = null;
  else if (lob.selectedGameId !== "kart" || !validKartSetup(lob.kart)) newKartSetup(null);
}
/** {t:"game", m} from a phone: the setup's own messages. Returns true when it was one of them. */
function onKartMsg(msg) {
  const m = msg.m;
  if (!m || typeof m !== "object" || !["fkpick", "fktrack", "fkother"].includes(m.type)) return false;
  const p = roster.get(msg.id);
  if (!p || !p.connected) return true;
  if (!kartSetupActive()) return sendStatus(p), true; // not in the setup: just tell the phone where things are
  if (m.type === "fkpick") {
    if (m.setupId !== lob.kart.id) return sendStatus(p), toPad(p.id, { t: "lobby", s: lobbyState() }), true; // an old setup's
    const racer = kartRacer(m.racer) || kartPickOf(p);
    lob.kart.picks[p.id] = { racer, ready: m.ready === true };
    if (kartRacer(m.racer)) lob.kartLast = { ...(lob.kartLast && typeof lob.kartLast === "object" ? lob.kartLast : {}), [p.id]: racer };
  } else if (!mayPick(p.id)) return true; // the track and PICK ANOTHER GAME are the game picker's
  else if (m.type === "fktrack") {
    if (!kartTrackOk(m.id)) return true; // COMING SOON
    lob.kart.track = m.id;
  } else {
    // fkother, PICK ANOTHER GAME: back to the game cards (the TV stays on this game until the picker picks one)
    lob.kart = null;
    lob.selectedGameId = null;
    lob.browse = { gameId: GAME.id, view: "cards", flipped: false };
  }
  saveLobby();
  broadcastLobby();
  renderLobby();
  maybeStartKart();
  return true;
}
/** startRound(): a round that started because everyone was ready takes the ready ones. */
const kartTakes = (p) => GAME.id !== "kart" || countdownWhy !== "ready" || !lob.kart || kartIsReady(p);
/** toLobby(): after the results the FoxBox lobby (the setup is done with); a round / countdown called off (Esc) goes
 * back to the kart setup, picks kept, nobody ready. */
function kartToLobby(afterRound) {
  if (afterRound) {
    if (lob.kart) {
      lob.kart = null;
      saveLobby();
    }
    return;
  }
  if (GAME.id !== "kart" || (lob.selectedGameId !== "kart" && !lob.kart)) return;
  lob.selectedGameId = "kart";
  newKartSetup(validKartSetup(lob.kart) ? lob.kart : null);
  saveLobby();
}
// ── end KART ──

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
  sky: null, // Sky Scramble's setup (see skySetupActive)
  golf: null, // TEE TIME's setup: { map: "sunny" | "sunset" | "night" | "candy" | "random" } (the picker's choice)
  knight: null, // KNIGHT: Knight Platformer's setup { id, level, picks } (see knightSetupActive)
  kart: null, // KART: FOX KART's setup { id, track, picks, bots } (see kartSetupActive)
  kartLast: {}, // KART: each phone's last racer (clientId → racer id), preselected the next time FOX KART is picked
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
    const s = lob.sky;
    if (s && (typeof s.id !== "string" || !s.picked || typeof s.picked !== "object" || !s.ready || typeof s.ready !== "object")) lob.sky = null;
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
  // The night's FoxBox points are people only (Lakota, day 2): bots never score, and places count among the
  // people (a person behind three bots is still the first PERSON in), so FILL and OFF score a night alike.
  const placeByPid = new Map();
  const human = (pid) => r.humanIdByPid.has(pid);
  if (GAME.seats) {
    const boatOf = new Map(r.players.map((pl) => [pl.playerId, pl.boat]));
    const boatRank = new Map();
    for (const pid of r.placement) {
      if (!human(pid)) continue; // a bot crew member: the boat ranks by its people
      const b = boatOf.get(pid);
      if (!boatRank.has(b)) boatRank.set(b, boatRank.size + 1);
      placeByPid.set(pid, boatRank.get(b));
    }
  } else r.placement.filter(human).forEach((pid, i) => placeByPid.set(pid, i + 1));
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
  const skyOn = skySetupActive();
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
          ...(skyOn ? { setup: skyState(p) } : {}), // Sky's setup: who's picking / drawing / ready
          ...(p.house ? { house: p.house } : {}),
        };
      }),
    ...(golfSetupActive() ? { golf: { map: lob.golf.map, maps: GAME.maps } } : {}), // TEE TIME's map choice
    bots: mirror ? mirror.bots || "off" : botsOn() ? "fill" : "off", // the host's BOTS setting (FILL / OFF)
    hostId: hostPhoneId(), // the host's phone: the only one with the BOTS toggle
    ...(partyEditable() ? { party: { group: partyInfo.group || "", pub: !!partyInfo.pub } } : {}), // web TV mode: its GROUP NAME + PUBLIC / PRIVATE too
    ...(knightSetupActive() ? { knight: knightLobby() } : {}), // KNIGHT: the knight setup (level, picks, who's ready)
    ...(kartSetupActive() ? { kart: kartLobby() } : {}), // KART: the kart setup (track, racers, who's ready, bots)
    ...(whosfoxSetupActive() ? { whosfox: { min: WHOSFOX_MIN, have: whosfoxPeople() } } : {}), // WHOSFOX: "needs 3+ players"
    pickerId: lob.pickerId,
    rollerId: lob.rollerId,
    leaderId: leaderId(),
    games: GAMES.map((g) => ({
      id: g.id, name: g.name, tagline: g.tagline, button: g.button, minPlayers: g.minPlayers, maxPlayers: g.maxPlayers,
      controls: g.controls, teams: !!g.seats, loop: `lobby2/media/${g.id}.mp4`, poster: `lobby2/media/${g.id}.jpg`,
      ...(g.card || {}), // chip / motion / rules / win for games the lobby bundle doesn't know yet
    })),
    browse: lob.browse,
    selectedGameId: lob.selectedGameId,
    look: lob.look,
    lastResults: lob.lastResults,
  };
}
let lastPublished = "";
function publishLobby() {
  if (ptrTv) { // USE CURSOR: the cursors only live on the lobby's cards, and only for players who are here
    if (!pointerLobby()) ptrTv.clear();
    else for (const c of ptrTv.list()) if (!roster.get(c.id)?.connected) ptrTv.remove(c.id);
  }
  syncTvB(); // a linked second TV gets the roster + seats too (they aren't all in the lobby state)
  const st = lobbyState();
  const json = JSON.stringify(st);
  if (json === lastPublished) return;
  lastPublished = json;
  globalThis.FOXBOX_LOBBY_STATE = st;
  try {
    window.dispatchEvent(new CustomEvent("foxbox:lobby", { detail: st }));
  } catch {}
  if (!mirror) wsSend({ t: "all", m: { t: "lobby", s: st } });
}
/** The picker chose a game: the hub switches to it (the TV page reloads) and waits in setup. */
function pickGame(gameId) {
  if (mirror || (phase !== "lobby" && phase !== "boot")) return; // a second TV follows the boss's pick
  const g = GAMES.find((q) => q.id === gameId);
  if (!g) return;
  if (g.id === "row") resetRowSetup();
  // Sky: a fresh setup (everyone picks a character and readies up), unless it's already the pick
  if (g.id !== "sky") lob.sky = null;
  else if (lob.selectedGameId !== "sky" || !lob.sky) newSkySetup();
  if (g.id !== "golf") lob.golf = null; // TEE TIME: a fresh map choice (RANDOM until the picker taps a map)
  else if (lob.selectedGameId !== "golf" || !lob.golf) lob.golf = { map: "random" };
  knightOnPick(g); // KNIGHT: a fresh knight setup (everyone picks a knight + sword and readies up)
  kartOnPick(g); // KART: a fresh kart setup (everyone picks a racer and readies up)
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

// ── USE CURSOR: phones as Wii-style pointers over the lobby ────────────────────────
// A phone with USE CURSOR on (lobby2-pad.js → pointer-pad.js) sends {t:"game", m:{type:"ptr", x, y, d?, tap?, rc?, off?}};
// pointer-tv.js draws one cursor per phone in its slot colour with its name, eased and clamped to the screen, and
// frames the game card it points at. Only on the lobby's cards, and each TV draws only its OWN phones (the screen they
// look at): the main TV its phones, an extra TV the phones that joined from its QR (net-p2p.js hands it their pointer
// before anything goes on to the main TV: FOXBOX_HOUSE_PTR → mirrorPointer). A tap: the picker's on a side card selects
// it (the browse, as a swipe on the picker's phone does), on the middle card picks it (the picker phone's own
// {t:"pickGame"} path; from an extra TV that message goes on to the main TV as the phone's own); anyone else's, or on
// no card, is a harmless ping.
var ptrTv = null, ptrLoad = null; // var: markGone / publishLobby may run before this line during start-up
var ptrWait = new Map(); // id → its newest message while pointer-tv.js loads
var ptrOut = null; // an extra TV: the lobby message a tap makes, for the main TV (mirrorPointer)
/** The lobby's cards are up here (the cursors' only screen for now). */
function pointerLobby() {
  return (phase === "lobby" || phase === "boot") && lob.selectedGameId !== GAME.id;
}
function onPointerMsg(msg) {
  const p = roster.get(msg.id);
  if (!p || !p.connected || (mirror ? p.house !== mirror.id : !!p.house) || !pointerLobby()) return;
  if (!ptrTv) {
    if (msg.m.off) ptrWait.delete(msg.id);
    else ptrWait.set(msg.id, msg.m);
    ptrLoad ||= import("./pointer-tv.js")
      .then((mod) => {
        ptrTv = mod.createPointerTv({ onTap: pointerTap });
        const waiting = [...ptrWait];
        ptrWait.clear();
        for (const [id, m] of waiting) onPointerMsg({ id, m });
      })
      .catch((e) => console.warn("[party] USE CURSOR: pointer-tv.js didn't load", e));
    return;
  }
  const c = colorSet(p.slot);
  ptrTv.update(msg.id, msg.m, { name: p.name, base: c.base, light: c.light, picker: msg.id === lob.pickerId });
}
/** A cursor's tap on hit (pointer-tv.js: the card under it, or null) → what it did: "pick" | "select" | "ping". */
function pointerTap(id, hit) {
  if (!pointerLobby() || lob.selectedGameId || !hit || id !== lob.pickerId || !GAMES.some((g) => g.id === hit.gameId)) return "ping";
  const pick = hit.kind === "card" && hit.offset === 0;
  const m = pick ? { t: "pickGame", gameId: hit.gameId } : { t: "browse", gameId: hit.gameId, view: "cards", flipped: false };
  if (mirror) ptrOut = m; // an extra TV: the main TV decides (mirrorPointer passes it on as the phone's own message)
  else onLobbyMsg({ ...m, id });
  return pick ? "pick" : "select";
}
/** An extra TV: one of ITS phones' pointer messages (net-p2p.js, globalThis.FOXBOX_HOUSE_PTR, synchronously): drawn here;
 * returns the lobby message that goes on to the main TV for it ({t:"browse"} / {t:"pickGame"} from the picker's tap), or
 * null (nothing goes on). */
function mirrorPointer(id, m) {
  if (!mirror || !m || typeof m !== "object") return null;
  ptrOut = null;
  onPointerMsg({ id, m });
  const out = ptrOut;
  ptrOut = null;
  return out;
}
/** One line for the fallback lobby: who picks, who rolls, who leads. */
function roleLine() {
  const nm = (id) => (id && (roster.get(id)?.name || lob.names[id])) || "—";
  const parts = [];
  if (lob.pickerId) parts.push(`${nm(lob.pickerId)} picks the game`);
  if (lob.rollerId) parts.push(`${nm(lob.rollerId)} rolls the look`);
  const lead = leaderId();
  if (lead) parts.push(`${nm(lead)} leads with ${lob.points[lead]} pts`);
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
    ...(GAME.id === "row" && lob.selectedGameId === "row" ? {
      rowSetup: { id: rowSetupToken(p), ready: rowPlayerReady(p), motionReady: p.motionReady === true && p.rowSetupId === rowSetupToken(p), ...rowReadiness() },
    } : {}),
    // Sky's setup: the phone shows its picker / READY screen from this (picked + ready = this player)
    ...(skySetupActive() ? {
      skySetup: { id: lob.sky.id, picked: !!lob.sky.picked[p.id], ready: skyState(p) === "ready", ...skyReadiness() },
    } : {}),
    ...(skySetupActive() && lob.sky.vote && lob.sky.vote.step !== "done" ? { skyVote: skyVoteFor(p) } : {}), // the doodle vote
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
  if (!round || round.humanIdByPid.get(p.slot + 1) !== p.id) return { ...base, state: "waiting" };
  if (phase === "countdown") return { ...base, state: "countdown" }; // the in-game 3-2-1 (the round's people)
  const pid = p.slot + 1;
  if (phase === "results" && round.placement) {
    // the TV's results list (crew members share their boat's place), shown on the phone as well
    const rows = round.results || resultRows(round);
    const mine = rows.findIndex((row) => row.members.some((m) => m.pid === pid));
    const place = mine + 1, title = rows[0].team ?? rows[0].members[0].name;
    const points = lob.lastResults.find((x) => x.id === p.id)?.points ?? 0;
    // backIn: seconds until the TV goes back to the lobby (the phone counts down from here, like autoIn)
    const backIn = Math.max(0, Math.round((resultsEndsAt - Date.now()) / 100) / 10);
    return {
      ...base, state: "results", place, won: place === 1, total: rows.length, winner: title, points, backIn,
      results: rows.map((row, i) => ({ team: row.team || null, color: row.color.base, names: row.members.map((m) => m.name), bots: row.members.map((m) => !!m.bot), mine: i === mine, ...(row.value != null ? { value: row.value } : {}) })),
    };
  }
  if (round.out.has(pid)) return { ...base, state: "out" };
  return { ...base, state: "playing", ...jetStatus(pid) }; // jetStatus: JETPACK ON THE PHONES (below)
}

// ── JETPACK ON THE PHONES (Lakota, Oct 31: "the Jetpack sound should play per player's phone, not on the TV") ──
// The running game's phones.jet() (set up in startRound) records each flyer's flight on the round; the flyer's
// status then carries jet = { kind: "A" | "C" | "D", phase: "fly" | "warn" | "end", t: the flight's id,
// left: seconds of flight to go right now }, and phone-sounds.js plays the item's sounds when it changes
// (left lets a phone that reloads mid-flight pick the loop back up for the time that's left, or stay quiet).
function jetStatus(pid) {
  const j = round && round.jet && round.jet.get(pid);
  if (!j) return {};
  return { jet: { kind: j.kind, phase: j.phase, t: j.t, left: Math.max(0, Math.round((j.endsAt - Date.now()) / 100) / 10) } };
}
// ── end JETPACK ON THE PHONES ──

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
  // the round's HUD stays up under the in-game countdown (a round exists in phase "countdown" now)
  $("hud").classList.toggle("show", phase === "playing" || phase === "results" || (phase === "countdown" && !!round && !round.ended));
  renderSkyReady();
  renderSkyVote();
  renderGolfMap();
  renderBotsToggle();
  renderKnightSetup(); // KNIGHT
  renderKartSetup(); // KART
  renderWhosfoxSetup(); // WHOSFOX
}
// an extra TV draws the doodle vote's clock from lob (the main TV's lobby loop does it there)
setInterval(() => {
  if (mirror && lob.sky && lob.sky.vote) renderSkyVote();
}, 250);

/** BOTS: FILL / OFF from the lobby (the toggle, the B key): saved on this TV for the next parties too. */
function setBotsMode(v) {
  if (mirror) return; // an extra TV shows the main TV's setting
  botsMode = v === "fill" ? "fill" : "off";
  try {
    localStorage.setItem(BOTS_KEY, botsMode);
  } catch {}
  renderLobby();
  broadcastLobby();
  syncTvB();
}
/** The host's phone (Lakota): the one phone that gets the BOTS toggle. Web (HOST steps): the HOST person's phone,
 * i.e. the first of this TV's phones with the name typed in the HOST steps; otherwise (the package, or no name
 * match) the oldest phone here from this TV's QR; when it leaves, the next-oldest takes over. null on extra TVs. */
function hostPhoneId() {
  if (mirror) return null;
  const here = lob.order.map((id) => roster.get(id)).filter((p) => p && p.connected && !p.house);
  const want = partyInfo && typeof partyInfo.host === "string" ? partyInfo.host.trim().toUpperCase() : "";
  const named = want ? here.find((p) => String(p.name || "").trim().toUpperCase() === want) : null;
  return (named || here[0] || {}).id || null;
}
/** {t:"game", m:{type:"bots", mode}} from the host's phone (its lobby toggle). */
function onBotsMsg(msg) {
  if (mirror || !(phase === "lobby" || phase === "boot") || msg.id !== hostPhoneId()) return;
  setBotsMode(msg.m.mode === "fill" ? "fill" : "off");
}
/** Web TV mode (?tv=1: no HOST steps on the TV, Lakota): the host's phone is the remote for the party's setup. net-p2p.js
 * marks the party info `edit`; the lobby state then carries {group, pub} and the host's phone shows GROUP NAME +
 * PUBLIC / PRIVATE next to its BOTS toggle (lobby2-pad.js). */
function partyEditable() {
  return !mirror && !!(partyInfo && partyInfo.edit);
}
/** {t:"game", m:{type:"party", group?, pub?}} from the host's phone: net-p2p.js checks the name (the HOST step's rules) and
 * tells the relay (the JOIN list of a public party); the TV chip, the extra TVs and the phones follow from the party info
 * it hands back. */
function onPartyMsg(msg) {
  if (!partyEditable() || !(phase === "lobby" || phase === "boot") || msg.id !== hostPhoneId()) return;
  if (typeof globalThis.FOXBOX_PARTY_EDIT !== "function") return;
  const change = {};
  if (typeof msg.m.group === "string") change.group = msg.m.group;
  if (typeof msg.m.pub === "boolean") change.pub = msg.m.pub;
  const res = globalThis.FOXBOX_PARTY_EDIT(change);
  if (!res || !res.ok || !res.party || typeof res.party !== "object") return; // (a name the rules refuse: the phone shows the old one again)
  partyInfo = res.party;
  syncTvB(true);
  publishLobby();
}
/** The lobby's "BOTS: FILL / OFF" label (#bots-toggle) by the party info: under the multi-TV party chip on the web,
 * else in the top-left corner. Clickable on the main TV (a TV with a mouse); an extra TV shows the main TV's. */
function renderBotsToggle() {
  const el = $("bots-toggle");
  if (!el) return;
  // the lobby and every game's setup (also Row's own seat lobby); not "boot": on the web that's the HOST /
  // JOIN GAME screens, which ask for it themselves
  const on = phase === "lobby";
  const fill = (mirror ? mirror.bots === "fill" : botsMode === "fill") && GAME.bots !== false;
  const txt = `BOTS: ${fill ? "FILL" : "OFF"}`;
  if (el.textContent !== txt) el.textContent = txt;
  el.dataset.mode = fill ? "fill" : "off";
  if (el.hidden === on) el.hidden = !on;
  if (!on) return;
  el.classList.toggle("bt-ro", !!mirror);
  el.title = mirror ? "The main TV chooses" : "Bots fill every free player spot (FILL) or stay out (OFF) · click or press B";
  const chip = document.querySelector(".fbx-tv2-chip"), r = chip && !chip.hidden && chip.getBoundingClientRect();
  el.style.top = r && r.height > 0 ? `${Math.round(r.bottom + 10)}px` : "";
  el.style.left = r && r.height > 0 ? `${Math.round(r.left)}px` : "";
  // the chip grows after this ran (its pixel font loading, a longer group name): the label follows it
  if (chip && !chip.dataset.botsFollow && typeof ResizeObserver === "function") {
    chip.dataset.botsFollow = "1";
    new ResizeObserver(() => renderBotsToggle()).observe(chip);
  }
}

/** TEE TIME's setup on the TV: the MAP panel under the join card (the picker chooses on their phone). */
function renderGolfMap() {
  const box = $("golf-map");
  if (!box) return;
  const layer = document.getElementById("fbx2-tv");
  const on = golfSetupActive() && phase === "lobby" && !!layer && !layer.hidden;
  if (box.hidden === on) box.hidden = !on;
  if (!on) return;
  const maps = GAME.maps || [], id = lob.golf.map, m = maps.find((q) => q.id === id) || maps[maps.length - 1];
  const picker = roster.get(lob.pickerId);
  const pips = maps.map((q) => `<i class="${q.id === id ? "on" : ""}" title="${esc(q.name)}"></i>`).join("");
  const html = `<div class="gm-head"><span>MAP</span><span class="gm-who">${esc(picker ? `${picker.name} PICKS` : "THE PICKER PICKS")}</span></div>`
    + `<img class="gm-pic" alt="" src="dev/party/golf/map-${esc(m.id)}.png"><div class="gm-name" data-map="${esc(m.id)}">${esc(m.name)}</div>`
    + `<div class="gm-pips">${pips}</div><div class="gm-hint">CHOOSE THE MAP ON THE PICKER'S PHONE, THEN START</div>`;
  if (box.dataset.html !== html) {
    box.innerHTML = html;
    box.dataset.html = html;
    box.dataset.map = m.id;
  }
  const join = layer.querySelector(".fbx2-join"), r = join && join.getBoundingClientRect();
  if (r && r.width > 0) {
    const cards = layer.querySelector(".fbx2-cards"), cr = cards && cards.getBoundingClientRect();
    const room = cr && cr.left > r.left ? cr.left - r.left - 28 : 330;
    box.style.left = `${Math.round(r.left)}px`;
    box.style.top = `${Math.round(r.bottom + 32)}px`;
    box.style.width = `${Math.round(Math.max(r.width, Math.min(330, room)))}px`;
  }
}

const SKY_LABEL = { ready: "READY", chosen: "NOT READY", picking: "PICKING", drawing: "DRAWING", away: "AWAY" };
/** Sky's setup on the TV: the READY CHECK panel, under the lobby screens' join card (QR). */
function renderSkyReady() {
  const box = $("sky-ready");
  if (!box) return;
  const layer = document.getElementById("fbx2-tv");
  const on = skySetupActive() && phase === "lobby" && !!layer && !layer.hidden;
  if (box.hidden === on) box.hidden = !on;
  if (!on) return;
  // everyone here (connected first), each with their character and where they are
  const list = [...roster.values()].sort((a, b) => (b.connected - a.connected) || a.slot - b.slot);
  const html = list
    .map((p) => {
      const st = skyState(p);
      const ch = p.character && characters.get(p.character);
      const pic = !ch
        ? sprite("puff", 3, { color: colorSet(p.slot).base })
        : ch.hitbox && ch.hitbox.ball
          ? `<span class="round" style="${esc(circleCropCss(ch))}"></span>`
          : `<img src="${esc(ch.src)}" alt="">`;
      return `<li class="${st}" data-player="${esc(p.id)}" data-setup="${st}"><span class="sr-pic">${pic}</span><span class="sr-name">${esc(p.name)}</span><span class="sr-badge">${SKY_LABEL[st]}</span></li>`;
    })
    .join("");
  const ol = $("sky-ready-list");
  if (ol.dataset.html !== html) {
    ol.innerHTML = html;
    ol.dataset.html = html;
  }
  const { readyCount, totalCount } = skyReadiness();
  $("sky-ready-count").textContent = `${readyCount}/${totalCount}`;
  box.classList.toggle("all", totalCount > 0 && readyCount === totalCount);
  box.classList.toggle("many", list.length > 4);
  // place it under the join card, as wide as the left column allows
  const join = layer.querySelector(".fbx2-join");
  const r = join && join.getBoundingClientRect();
  if (r && r.width > 0) {
    const cards = layer.querySelector(".fbx2-cards");
    const cr = cards && cards.getBoundingClientRect();
    const room = cr && cr.left > r.left ? cr.left - r.left - 28 : 330;
    box.style.left = `${Math.round(r.left)}px`;
    box.style.top = `${Math.round(r.bottom + 32)}px`;
    box.style.width = `${Math.round(Math.max(r.width, Math.min(330, room)))}px`;
    box.style.maxHeight = `${Math.max(120, Math.round(innerHeight - r.bottom - 52))}px`;
  }
}

// ── KNIGHT (Knight Platformer) ──
// The knight setup on the TV (#knight-setup, index.html), under the join card like Sky's READY CHECK: the LEVEL (a
// thumbnail, its name, "<PICKER> PICKS", the closed ones COMING SOON) and the READY list, every player's knight in their
// slot colour (drawn with dev/party/knight/knight-art.js, loaded on demand; coloured placeholders until it's there).
const KNIGHT_LABEL = { ready: "READY", picking: "THAT'S ME", knight: "PICKING KNIGHT", sword: "PICKING SWORD", away: "AWAY" };
let knightArt = null; // the art module once loaded; false = not available (placeholders)
let knightArtLoad = null;
let knightAnim = 0;
const knightWarned = new Set();
function knightWarn(key, e) {
  if (knightWarned.has(key)) return;
  knightWarned.add(key);
  console.warn(`[party] knight ${key}`, (e && e.message) || e);
}
function renderKnightSetup(force = false) {
  const box = $("knight-setup");
  if (!box) return;
  const layer = document.getElementById("fbx2-tv");
  const on = knightSetupActive() && phase === "lobby" && !!layer && !layer.hidden;
  if (box.hidden === on) box.hidden = !on;
  if (!on) {
    clearInterval(knightAnim);
    knightAnim = 0;
    return;
  }
  if (!knightArtLoad) {
    knightArtLoad = import("./knight/knight-art.js")
      .then((m) => { knightArt = m; renderKnightSetup(true); })
      .catch((e) => { knightArt = false; knightWarn("art not loaded (placeholders)", e); });
  }
  const lv = knightCardOf(lob.knight), look = knightCastleOf(lob.knight);
  const picker = roster.get(lob.pickerId);
  const { readyCount, totalCount } = knightReadiness();
  const list = [...roster.values()].sort((a, b) => (b.connected - a.connected) || a.slot - b.slot);
  const others = KNIGHT.levels.filter((l) => l !== lv && !l.hidden).map((l) => `<span class="ks-other${l.open ? "" : " soon"}" data-level="${esc(l.id)}">${esc(l.name)}${l.open ? "" : "<b>COMING SOON</b>"}</span>`).join("");
  const nameOf = (list, id) => ((knightArt && Array.isArray(knightArt[list]) && knightArt[list].find((q) => q.id === id)) || {}).name || "";
  const rows = list.map((p) => {
    const st = knightState(p), pk = knightPickOf(p), c = colorSet(p.slot).base;
    const what = [nameOf("KNIGHTS", pk.knight), nameOf("SWORDS", pk.sword)].filter(Boolean).join(" · ") || `KNIGHT ${pk.knight} · SWORD ${pk.sword}`;
    return `<li class="${st === "ready" || st === "away" ? st : "picking"}" style="--kc:${esc(c)}" data-player="${esc(p.id)}" data-setup="${st === "ready" || st === "away" ? st : "picking"}" data-step="${p.connected ? knightStep(p) : "away"}" data-knight="${pk.knight}" data-sword="${pk.sword}" data-color="${esc(c)}">`
      + `<canvas class="ks-pic" width="34" height="34" data-slot="${p.slot}" data-knight="${pk.knight}" data-sword="${pk.sword}"></canvas>`
      + `<span class="ks-who2"><span class="ks-name">${esc(p.name)}</span><span class="ks-what">${esc(what.toUpperCase())}</span></span><span class="ks-badge">${KNIGHT_LABEL[st]}</span></li>`;
  }).join("");
  const botRows = knightBotSlots().map((slot, i) => {
    const pk = knightBotPick(slot), c = colorSet(slot).base;
    const what = [nameOf("KNIGHTS", pk.knight), nameOf("SWORDS", pk.sword)].filter(Boolean).join(" · ") || `KNIGHT ${pk.knight} · SWORD ${pk.sword}`;
    return `<li class="bot" style="--kc:${esc(c)}" data-bot="${slot}" data-setup="bot" data-knight="${pk.knight}" data-sword="${pk.sword}" data-color="${esc(c)}">`
      + `<canvas class="ks-pic" width="34" height="34" data-slot="${slot}" data-knight="${pk.knight}" data-sword="${pk.sword}"></canvas>`
      + `<span class="ks-who2"><span class="ks-name">BOT ${i + 1}</span><span class="ks-what">${esc(what.toUpperCase())}</span></span><span class="ks-badge">BOT</span></li>`;
  });
  const html = `<div class="ks-head"><span>LEVEL</span><span class="ks-who">${esc(picker ? `${picker.name} PICKS` : "THE PICKER PICKS").toUpperCase()}</span></div>`
    + `<div class="ks-level"><canvas class="ks-thumb" width="320" height="180" data-level="${esc(lv.id)}" data-map="${esc(lv.level || lv.id)}" data-castle="${look}"></canvas><div class="ks-lvname" data-level="${esc(lv.id)}" data-castle="${look}">${esc(String(lv.name).replace(/\s*·\s*(DAY|NIGHT)\s*$/, ""))}${lv.castle ? ` <b class="ks-look">${look === "day" ? "DAY" : "NIGHT"}</b>` : ""}</div></div>`
    + `<div class="ks-others">${others}</div>`
    + `<div class="ks-head ks-rhead"><span>READY CHECK</span><span class="ks-count" data-test="knight-ready-count">${readyCount}/${totalCount}</span></div>`
    + `<ol class="ks-list" data-test="knight-ready-list">${rows}${botRows.join("")}</ol><div class="ks-hint">PICK A KNIGHT + A SWORD ON YOUR PHONE, THEN TAP READY</div>`;
  if (force || box.dataset.html !== html) {
    box.innerHTML = html;
    box.dataset.html = html;
    box.dataset.level = lv.id;
    drawKnightThumb(box);
    drawKnightSetup();
  }
  box.classList.toggle("all", totalCount > 0 && readyCount === totalCount);
  box.classList.toggle("many", list.length + botRows.length > 3);
  box.classList.toggle("crowd", list.length + botRows.length > 6); // 7-8 rows: tighter still, so all of them fit
  if (!knightAnim) knightAnim = setInterval(drawKnightSetup, 125);
  // under the join card, as wide as the left column allows (like Sky's panel)
  const join = layer.querySelector(".fbx2-join"), r = join && join.getBoundingClientRect();
  if (r && r.width > 0) {
    const cards = layer.querySelector(".fbx2-cards"), cr = cards && cards.getBoundingClientRect();
    const room = cr && cr.left > r.left ? cr.left - r.left - 28 : 330;
    box.style.left = `${Math.round(r.left)}px`;
    box.style.top = `${Math.round(r.bottom + 24)}px`;
    box.style.width = `${Math.round(Math.max(r.width, Math.min(360, room)))}px`;
    box.style.maxHeight = `${Math.max(160, Math.round(innerHeight - r.bottom - 40))}px`;
  }
}
/** The level thumbnail: the art's drawLevelThumb when it has one, else a little pixel castle. */
function drawKnightThumb(box) {
  const cv = box.querySelector("canvas.ks-thumb");
  if (!cv) return;
  const g = cv.getContext("2d"), W = cv.width, H = cv.height;
  g.imageSmoothingEnabled = false;
  if (knightArt && typeof knightArt.drawLevelThumb === "function") {
    try { return void knightArt.drawLevelThumb(g, cv.dataset.map || "castle", W, H, { castle: cv.dataset.castle === "day" ? "day" : "night" }); } catch (e) { knightWarn("drawLevelThumb threw", e); } // (art without the look ignores it)
  }
  ["#091228", "#0c1730", "#0f1d3c", "#142546", "#18294f"].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * 30, W, 31); });
  g.fillStyle = "#fff3b0";
  for (let i = 0; i < 26; i++) g.fillRect((i * 97) % W, 6 + ((i * 53) % 90), 2, 2);
  g.fillStyle = "#13213f";
  for (const [x, w, h] of [[30, 60, 70], [100, 120, 50], [150, 26, 96], [240, 50, 80]]) g.fillRect(x, 150 - h, w, h);
  g.fillStyle = "#1d3160";
  g.fillRect(0, 150, W, 30);
  g.fillStyle = "#ffd23f";
  g.fillRect(0, 150, W, 5);
  for (let x = 100; x < 220; x += 16) g.fillRect(x, 92, 8, 8);
}
/** Every player's knight (READY ones cheer), ~8 times a second while the panel is up. */
function drawKnightSetup() {
  const box = $("knight-setup");
  if (!box || box.hidden) return;
  const t = performance.now() / 1000;
  for (const cv of box.querySelectorAll("canvas.ks-pic")) {
    const g = cv.getContext("2d"), W = cv.width, H = cv.height, color = colorSet(Number(cv.dataset.slot) || 0);
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, W, H);
    if (knightArt && typeof knightArt.drawKnight === "function") {
      try {
        const ready = cv.parentElement && cv.parentElement.classList.contains("ready");
        knightArt.drawKnight(g, { knight: cv.dataset.knight, sword: cv.dataset.sword, color, x: 15, footY: H - 1, face: 1, k: 1, pose: ready ? "cheer" : "idle", t });
        continue;
      } catch (e) { knightWarn("drawKnight threw", e); }
    }
    g.fillStyle = "#0a1428"; // placeholder: a knight-sized block in the player's colour with its knight letter
    g.fillRect(10, 12, 12, 21);
    g.fillStyle = color.base;
    g.fillRect(11, 13, 10, 19);
    g.fillStyle = "#ffffff";
    g.font = "8px monospace";
    g.textAlign = "center";
    g.fillText(cv.dataset.knight || "?", 16, 25);
  }
}
// ── end KNIGHT ──

// ── KART (FOX KART) ──
// The kart setup on the TV (#kart-setup, index.html), under the join card like the knight's: the TRACK card (the game's
// own mini-map when the module has it — game.trackImage(id) —, its name, "3 LAPS") and the READY list, every racer's
// portrait in the player's slot colour (dev/party/kart/kart-art.js drawRacerPortrait, loaded on demand; coloured
// placeholders until it's there), the bots that will join with their racers.
const KART_LABEL = { ready: "READY", picking: "PICKING", away: "AWAY" };
let kartArt = null; // the art module once loaded; false = not available (placeholders)
let kartArtLoad = null;
let kartAnim = 0;
const kartWarned = new Set();
function kartWarn(key, e) {
  if (kartWarned.has(key)) return;
  kartWarned.add(key);
  console.warn(`[party] kart ${key}`, (e && e.message) || e);
}
const kartRacerName = (id) => ((kartArt && Array.isArray(kartArt.RACERS) && kartArt.RACERS.find((q) => q && q.id === id)) || {}).name || String(id || "").toUpperCase();
function renderKartSetup(force = false) {
  const box = $("kart-setup");
  if (!box) return;
  const layer = document.getElementById("fbx2-tv");
  const on = kartSetupActive() && phase === "lobby" && !!layer && !layer.hidden;
  if (box.hidden === on) box.hidden = !on;
  if (!on) {
    clearInterval(kartAnim);
    kartAnim = 0;
    return;
  }
  if (!kartArtLoad) {
    kartArtLoad = import("./kart/kart-art.js")
      .then((m) => { kartArt = m; renderKartSetup(true); })
      .catch((e) => { kartArt = false; kartWarn("art not loaded (placeholders)", e); });
  }
  const tr = kartTrack();
  const picker = roster.get(lob.pickerId);
  const { readyCount, totalCount } = kartReadiness();
  const list = [...roster.values()].sort((a, b) => (b.connected - a.connected) || a.slot - b.slot);
  const others = KART.tracks.filter((t) => t !== tr).map((t) => `<span class="fk-other${t.open ? "" : " soon"}" data-track="${esc(t.id)}">${esc(t.name)}${t.open ? "" : "<b>COMING SOON</b>"}</span>`).join("");
  const rows = list.map((p) => {
    const st = kartState(p), racer = kartPickOf(p), c = colorSet(p.slot).base;
    return `<li class="${st}" style="--kc:${esc(c)}" data-player="${esc(p.id)}" data-setup="${st}" data-racer="${esc(racer)}" data-color="${esc(c)}">`
      + `<canvas class="fk-pic" width="48" height="48" data-slot="${p.slot}" data-racer="${esc(racer)}"></canvas>`
      + `<span class="fk-who2"><span class="fk-name">${esc(p.name)}</span><span class="fk-what">${esc(kartRacerName(racer))}</span></span><span class="fk-badge">${KART_LABEL[st]}</span></li>`;
  }).join("");
  const plan = kartRoundPlan(), slots = plan.slots, botRacers = plan.racers; // the same bots the race will get
  const botRows = slots.map((slot, i) => {
    const racer = botRacers.get(slot), c = colorSet(slot).base;
    return `<li class="bot" style="--kc:${esc(c)}" data-bot="${slot}" data-setup="bot" data-racer="${esc(racer)}" data-color="${esc(c)}">`
      + `<canvas class="fk-pic" width="48" height="48" data-slot="${slot}" data-racer="${esc(racer)}"></canvas>`
      + `<span class="fk-who2"><span class="fk-name">BOT ${i + 1}</span><span class="fk-what">${esc(kartRacerName(racer))}</span></span><span class="fk-badge">BOT</span></li>`;
  });
  const choice = KART.tracks.filter((t) => t.open).length > 1; // one open track: nobody picks it
  const html = `<div class="fk-head"><span>TRACK</span><span class="fk-who">${choice ? esc(picker ? `${picker.name} PICKS` : "THE PICKER PICKS").toUpperCase() : ""}</span></div>`
    + `<div class="fk-track"><canvas class="fk-map" width="128" height="72" data-track="${esc(tr.id)}"></canvas><div class="fk-tname" data-track="${esc(tr.id)}">${esc(tr.name)}<small data-test="kart-laps">${tr.laps || 3} LAPS</small></div></div>`
    + (others ? `<div class="fk-others">${others}</div>` : "")
    + `<div class="fk-head fk-rhead"><span>READY CHECK</span><span class="fk-count" data-test="kart-ready-count">${readyCount}/${totalCount}</span></div>`
    + `<ol class="fk-list" data-test="kart-ready-list">${rows}${botRows.join("")}</ol><div class="fk-hint">PICK A RACER ON YOUR PHONE, THEN TAP READY</div>`;
  if (force || box.dataset.html !== html) {
    box.innerHTML = html;
    box.dataset.html = html;
    box.dataset.track = tr.id;
    drawKartTrack(box);
    drawKartSetup();
  } else if (box.querySelector("canvas.fk-map:not([data-real])")) drawKartTrack(box); // the game module set up meanwhile: its map now
  box.classList.toggle("all", totalCount > 0 && readyCount === totalCount);
  box.classList.toggle("many", list.length + botRows.length > 3);
  box.classList.toggle("crowd", list.length + botRows.length > 6); // 7-8 rows: tighter still, so all of them fit
  if (!kartAnim) kartAnim = setInterval(drawKartSetup, 250);
  // under the join card, as wide as the left column allows (like the knight's panel)
  const join = layer.querySelector(".fbx2-join"), r = join && join.getBoundingClientRect();
  if (r && r.width > 0) {
    const cards = layer.querySelector(".fbx2-cards"), cr = cards && cards.getBoundingClientRect();
    const room = cr && cr.left > r.left ? cr.left - r.left - 28 : 330;
    box.style.left = `${Math.round(r.left)}px`;
    box.style.top = `${Math.round(r.bottom + 24)}px`;
    box.style.width = `${Math.round(Math.max(r.width, Math.min(360, room)))}px`;
    box.style.maxHeight = `${Math.max(160, Math.round(innerHeight - r.bottom - 40))}px`;
  }
}
/** The track card: the game's mini-map (game.trackImage(id), a canvas) on grass, else a little pixel circuit. */
function drawKartTrack(box) {
  const cv = box.querySelector("canvas.fk-map");
  if (!cv) return;
  const g = cv.getContext("2d"), W = cv.width, H = cv.height;
  g.imageSmoothingEnabled = false;
  g.fillStyle = "#3f8f3a";
  g.fillRect(0, 0, W, H);
  let im = null;
  try { im = game && typeof game.trackImage === "function" ? game.trackImage(cv.dataset.track) : null; } catch (e) { kartWarn("trackImage threw", e); }
  if (im && im.width > 0 && im.height > 0) {
    const k = Math.min(W / im.width, H / im.height), w = Math.round(im.width * k), h = Math.round(im.height * k);
    g.imageSmoothingEnabled = k < 1; // a downscaled map reads better smoothed; never blur an upscale
    g.drawImage(im, Math.round((W - w) / 2), Math.round((H - h) / 2), w, h);
    cv.dataset.real = "1";
    return;
  }
  // placeholder: a grey loop road with a curb, the checkered start line
  g.fillStyle = "#2f7a32";
  for (let y = 0; y < H; y += 8) g.fillRect(0, y, W, 4);
  g.fillStyle = "#e8e2d0";
  g.fillRect(14, 10, W - 28, H - 20);
  g.fillStyle = "#5d6070";
  g.fillRect(16, 12, W - 32, H - 24);
  g.fillStyle = "#3f8f3a";
  g.fillRect(30, 24, W - 60, H - 48);
  g.fillStyle = "#e8e2d0";
  g.fillRect(28, 22, W - 56, 2);
  g.fillRect(28, H - 24, W - 56, 2);
  for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? "#ffffff" : "#14101f"; g.fillRect(W / 2 - 2 + (i % 2) * 2, 12 + i * 2, 2, 2); g.fillRect(W / 2 - (i % 2) * 2, 12 + i * 2, 2, 2); }
  g.fillStyle = "#ffd23f";
  g.fillRect(W / 2 - 1, 4, 2, 8);
}
/** Every racer's portrait (READY ones bob), ~4 times a second while the panel is up. */
function drawKartSetup() {
  const box = $("kart-setup");
  if (!box || box.hidden) return;
  const t = performance.now() / 1000;
  for (const cv of box.querySelectorAll("canvas.fk-pic")) {
    const g = cv.getContext("2d"), W = cv.width, H = cv.height, slot = Number(cv.dataset.slot) || 0, color = colorSet(slot);
    const li = cv.parentElement, ready = !!(li && li.classList.contains("ready")), racer = cv.dataset.racer;
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, W, H);
    if (kartArt && typeof kartArt.drawRacerPortrait === "function") {
      try {
        kartArt.drawRacerPortrait(g, racer, COLOR_KEYS[slot], 0, 0, W, { t, pose: ready ? "cheer" : "idle", bg: color.dark });
        continue;
      } catch (e) { kartWarn("drawRacerPortrait threw", e); }
    }
    g.fillStyle = color.dark; // placeholder: the slot colour with the racer's first letter
    g.fillRect(0, 0, W, H);
    g.fillStyle = color.base;
    g.fillRect(6, 8, W - 12, H - 12);
    g.fillStyle = "#ffffff";
    g.font = "10px monospace";
    g.textAlign = "center";
    g.fillText((racer || "?").slice(0, 1).toUpperCase(), W / 2, H - 9);
  }
}
// ── end KART ──
// ── WHOSFOX (WHO'S THE FOX?) setup: 3+ PEOPLE (bots never play it) ──
// Picked with fewer than 3 players: START does nothing and the TV + the phones say "NEEDS 3+ PLAYERS" (the phone module
// reads lobby.whosfox / lobby.players). The panel sits under the join card like TEE TIME's map.
const WHOSFOX_MIN = 3;
function whosfoxSetupActive() {
  return GAME.id === "whosfox" && lob.selectedGameId === "whosfox" && (phase === "lobby" || phase === "boot");
}
/** The people who'd play now (connected, not drawing). */
const whosfoxPeople = () => [...roster.values()].filter((p) => p.connected && !p.drawing).length;
let whosfoxNudge = 0;
function whosfoxNeedMore() {
  whosfoxNudge = Date.now();
  renderWhosfoxSetup();
  broadcastLobby();
}
function renderWhosfoxSetup() {
  const box = $("whosfox-setup");
  if (!box) return;
  const layer = document.getElementById("fbx2-tv");
  const on = whosfoxSetupActive() && phase === "lobby" && (!layer || !layer.hidden);
  if (box.hidden === on) box.hidden = !on;
  if (!on) return;
  const n = whosfoxPeople(), ok = n >= WHOSFOX_MIN;
  const picker = roster.get(lob.pickerId);
  const html = `<div class="wf-head"><span>WHO'S THE FOX?</span><span class="wf-who">3-8 PLAYERS</span></div>`
    + `<div class="wf-need ${ok ? "ok" : "no"}" data-test="whosfox-need" data-have="${n}">${ok ? `${n} PLAYERS · READY!` : `NEEDS 3+ PLAYERS<br><small>${n} HERE</small>`}</div>`
    + `<div class="wf-hint">${ok ? esc(picker ? `${String(picker.name).toUpperCase()} PRESSES START ON THEIR PHONE` : "THE PICKER PRESSES START") : "GET MORE PHONES TO SCAN THE QR CODE"}</div>`;
  if (box.dataset.html !== html) {
    box.innerHTML = html;
    box.dataset.html = html;
  }
  box.classList.toggle("nudge", !ok && Date.now() - whosfoxNudge < 1200);
  if (layer) {
    const join = layer.querySelector(".fbx2-join"), r = join && join.getBoundingClientRect();
    if (r && r.width > 0) {
      box.style.left = `${Math.round(r.left)}px`;
      box.style.top = `${Math.round(r.bottom + 32)}px`;
      box.style.width = `${Math.round(Math.max(r.width, 330))}px`;
    }
  }
}
setInterval(() => { if (GAME.id === "whosfox" && phase === "lobby") renderWhosfoxSetup(); }, 500);
// ── end WHOSFOX ──

function renderLobby() {
  const list = [...roster.values()].sort((a, b) => a.slot - b.slot);
  if (GAME.seats) {
    renderSeatLobby(list);
    renderBotsToggle(); // (the seat lobby is a lobby too: the BOTS label shows there as well)
    return;
  }
  const skyOn = skySetupActive();
  const cells = list.map((p) => {
    const c = colorSet(p.slot);
    const tag = !p.connected
      ? `<span class="tag">away</span>`
      : p.drawing
        ? `<span class="tag drawing">drawing…</span>`
        : skyOn
          ? `<span class="tag">${{ ready: "READY", chosen: "not ready", picking: "picking…" }[skyState(p)] || ""}</span>`
          : "";
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
  const skyLine = skyOn ? (({ readyCount, totalCount }) => `${readyCount} / ${totalCount} ready · Pick a character, then READY`)(skyReadiness()) : "";
  if (n > 0) {
    st.textContent = skyLine || `Press ${GAME.button} on your phone to start!`;
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
      ready: skyOn ? skyState(p) === "ready" : p.connected,
      tag: !p.connected ? "away" : p.drawing ? "drawing…" : skyOn ? SKY_LABEL[skyState(p)].toLowerCase() : undefined,
    })),
    games: GAMES.map((g) => ({ id: g.id, name: g.name, button: g.button, blurb: g.tagline })),
    current: GAME.id,
    status: n > 0 ? [skyLine || `Press ${GAME.button} on a phone to start!`, roleLine(), autoTxt, botTxt].filter(Boolean).join("  ·  ") : null,
  });
  renderSkyReady();
  renderSkyVote();
  renderGolfMap();
  renderBotsToggle();
  renderKnightSetup(); // KNIGHT
  renderKartSetup(); // KART
  renderWhosfoxSetup(); // WHOSFOX
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
          `<span class="seat-person"><span class="nm">${esc(who ? who.name : botsOn() ? "Bot" : "Open")}</span><span class="tag">${esc(SEAT_NAMES[seat])}${who && !who.away ? who.ready ? " · Ready" : " · Setting up" : ""}${who && who.house ? ` · ${esc(tvLabel(who.house))}` : ""}</span></span></div>`,
      );
      // the card's colour says which boat; the tag just says which seat
      web.push({ slot: boat * 2 + (seat === "paddle" ? 1 : 2), name: who ? who.name : botsOn() ? "Bot" : "Open", color: c.base, ready: !!who?.ready, tag: who && who.away ? "away" : `${SEAT_NAMES[seat]}${who ? who.ready ? " · Ready" : " · Setting up" : ""}` });
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
  const readiness = rowReadiness();
  const readyText = `${readiness.readyCount} / ${readiness.totalCount} ready · Check your phones`;
  const st = $("start-text");
  if (n > 0) {
    st.textContent = readyText;
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
    status: n > 0 ? [readyText, roleLine(), seatTxt].filter(Boolean).join("  ·  ") : null,
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

/** "TV 3": which TV of the party a house is (multi-TV), for the seat lobby's tags. */
function tvLabel(house) {
  const list = mirror ? mirror.tvs || [] : tvList();
  const t = list.find((x) => x.id === house);
  return t ? `TV ${t.n}` : "OTHER TV";
}

async function refreshInfo() {
  try {
    const res = await api("/api/info", { cache: "no-store" });
    if (res.ok) {
      const info = await res.json();
      if (info.padUrl) padUrl = info.padUrl;
      // multi-TV (web + relay): the HOST answers + the invite for other TVs (main TV), for its chip and the extra TVs
      if (!mirror && info.party && typeof info.party === "object") {
        const changed = JSON.stringify(info.party) !== JSON.stringify(partyInfo);
        partyInfo = info.party;
        if (changed) {
          syncTvB(true);
          renderBotsToggle(); // the chip is drawn now (web TV mode shows the lobby before it): the BOTS label goes under it
        }
      }
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
  if (GAME.id === "row") resetRowSetup();
  if (afterRound) {
    rotateRoles();
    lob.selectedGameId = null;
    lob.sky = null;
    lob.golf = null;
    lob.browse = { gameId: GAME.id, view: "cards", flipped: false };
    saveLobby();
  } else if (lob.sky) {
    // a round / countdown called off: back to Sky's setup, everyone keeps their pick and readies up again
    lob.sky.ready = {};
    saveLobby();
  } else if (GAME.id === "sky" && lob.selectedGameId === "sky") {
    newSkySetup(); // (a round that skipped the setup: the picker's start)
    saveLobby();
  }
  knightBackToSetup(afterRound); // KNIGHT: the game keeps going: back to the knight setup (picks kept, nobody ready)
  kartToLobby(afterRound); // KART: after the results the FoxBox lobby; called off: back to the kart setup (picks kept, nobody ready)
  clearTimeout(resultsTimer);
  clearInterval(countdownTimer);
  clearInterval(introTimer); // IN-GAME COUNTDOWN: Esc / a call-off during the 3-2-1 or the Row training
  $("countdown").classList.remove("ingame");
  if (round && !round.ended) {
    // Aborted mid-round: freeze the game; the next play() tears it down.
    round.ended = true;
    game.pause(true);
    // WHOSFOX: a game can let go of what it holds right away (WHO'S THE FOX?'s takes: photos, clips, voice takes)
    if (typeof game.abort === "function") try { game.abort(); } catch (e) { console.warn("[party] game.abort threw", e); }
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

/** why: "ready" = Sky's everyone-tapped-READY start; "start" = BONK / the TV's Enter / the picker.
 * IN-GAME COUNTDOWN (Lakota): no pre-game card any more. The round starts at once, paused on its start frame, and
 * the 3-2-1-GO runs over the game's own scene (beginIntro); FOX KART's start lights are its own countdown (intro
 * "own"); Row Row Rumble first runs its TRAINING (the game), then the countdown. */
function startCountdown(byPlayer, why = "start") {
  if (phase !== "lobby" || !setupDone) return;
  if (GAME.id === "row" && !allRowReady()) return;
  if (connectedCount() === 0) return;
  if (GAME.id === "whosfox" && whosfoxPeople() < WHOSFOX_MIN) return whosfoxNeedMore(); // WHOSFOX: people only, 3+
  // Somebody has to be able to play: not everyone may be busy drawing.
  if (![...roster.values()].some((p) => p.connected && !p.drawing)) return;
  countdownWhy = why;
  autoStartAt = null;
  drawHoldUntil = null;
  countdownCueId = `${Date.now()}-${stats.rounds + 1}`;
  introSub = GAME.id === "row" ? "" : why === "ready" ? "Everyone’s ready!" : byPlayer ? `${byPlayer.name} pressed ${GAME.button} — get ready!` : "Get ready!";
  startRound();
}

// ── IN-GAME COUNTDOWN ──────────────────────────────────────────────────────────
// GAMES[].intro: "321" (default) = 3-2-1 then GO!; "ready" = READY… then GO! (turn-based games); "own" = the game counts
// down itself (FOX KART). The round's game is running paused on its start frame (play({isPaused: true})); #countdown
// (class ingame: no background) draws the number over it, the phones get their spoken cues as before, and at GO the
// game resumes (pause(false)) and every phone's held input goes in. Extra TVs: m:round { hold, intro } + m:intro, timed
// on the boss clock (mirrorIntro). QA: __party.phase "countdown" while it runs, __party.intro.
const INTRO_MS = { "321": COUNTDOWN_MS, ready: 1500 };
const GO_MS = 700; // GO! stays over the running game this long
const introOf = (g) => (g.intro === "ready" || g.intro === "own" ? g.intro : "321");
let introSub = "";
let introTimer = null;
/** The #countdown overlay's text: label "3" / "READY…" / "GO!" (pops when it changes) + the small line. */
function introDraw(label, sub) {
  const num = $("cd-num");
  $("countdown").classList.add("ingame");
  $("countdown").dataset.game = GAME.id; // per-game placement (index.html: golf's sits under its challenge card)
  if ($("cd-sub").textContent !== sub) $("cd-sub").textContent = sub;
  if (num.textContent === label) return false;
  num.textContent = label;
  num.classList.toggle("go", label === "GO!");
  num.classList.toggle("ready", label.startsWith("READY"));
  num.style.animation = "none";
  void num.offsetWidth;
  num.style.animation = "";
  return true;
}
function introLabel(mode, left) {
  return mode === "ready" ? "READY…" : String(Math.max(1, left));
}
/** The main TV: the round is running paused on its start frame (or the Row training just ended): 3-2-1-GO over it. */
function beginIntro(r) {
  if (round !== r || r.ended || r.intro) return;
  const mode = introOf(GAME);
  r.hold = true;
  r.training = false;
  r.intro = { mode, goAt: Date.now() + INTRO_MS[mode], sub: introSub };
  try { game.pause(true); } catch {} // (Row has paused itself already: again is fine)
  phase = "countdown";
  isPaused = false;
  $("paused").classList.remove("show");
  flushTvB(); // the start frame's tick (a batch of 2 would hold it until GO): the extra TVs draw it during the countdown
  toTvB({ t: "m:intro", goAt: r.intro.goAt, mode, sub: r.intro.sub });
  const cueTargets = [...roster.values()]
    .filter((p) => p.connected && !p.drawing && (!globalThis.FOXBOX_LOBBY2 || p.audioReady))
    .sort((a, b) => a.slot - b.slot).map((p) => p.id);
  const tick = () => {
    if (round !== r || r.ended || phase !== "countdown") return clearInterval(introTimer);
    const left = Math.ceil((r.intro.goAt - Date.now()) / 1000);
    if (left <= 0) return introGo(r);
    if (introDraw(introLabel(mode, left), r.intro.sub) && mode === "321") {
      const cue = { 3: "three", 2: "two", 1: "one" }[left];
      if (cue && cueTargets.length) {
        const targetId = cueTargets[(3 - left) % cueTargets.length];
        wsSend({ t: "all", m: { t: "soundCue", id: `${countdownCueId}-${cue}`, cue, targetId } });
      }
    }
  };
  $("cd-num").textContent = "";
  show("countdown");
  broadcastLobby();
  clearInterval(introTimer);
  tick();
  introTimer = setInterval(tick, 100);
}
/** GO: the game runs, GO! over it for a moment, every phone's input goes in. */
function introGo(r) {
  clearInterval(introTimer);
  if (round !== r || r.ended) return;
  stats.introGoLateMs = Date.now() - r.intro.goAt; // QA: how late GO came (the 100 ms timer)
  r.intro = null;
  r.hold = false;
  if (tvBRound) tvBRound = { ...tvBRound, hold: false, intro: null }; // a TV that links from now on starts it running
  phase = "playing";
  try { game.pause(false); } catch (e) { console.error("[party] pause(false) threw", e); }
  introDraw("GO!", "");
  show("countdown");
  wsSend({ t: "all", m: { t: "soundCue", id: `${countdownCueId}-go`, cue: "go" } });
  setTimeout(() => { if (round === r && phase === "playing" && $("cd-num").textContent === "GO!") show(null); }, GO_MS);
  for (const p of roster.values()) forwardInput(p); // whatever the phones are holding right now
  broadcastLobby();
}
// ── end IN-GAME COUNTDOWN ──

function startRound() {
  if (phase !== "lobby" || (GAME.id === "row" && !allRowReady())) return;
  const now = Date.now();
  // Someone still drawing sits this round out (they'd play a half-finished drawing). A Sky round
  // that started because everyone was ready takes the ready ones (someone who dropped out before
  // readying up joins the next round).
  const skyReadyStart = GAME.id === "sky" && countdownWhy === "ready" && !!lob.sky;
  const humans = [...roster.values()]
    .filter((p) => GAME.id === "row" ? rowPlayerReady(p)
      : !p.drawing && (p.connected || now - p.goneAt < REJOIN_GRACE_MS) && (!skyReadyStart || !!lob.sky.ready[p.id]))
    .filter(knightTakes) // KNIGHT: a round started by READY takes the ready players
    .filter(kartTakes) // KART: the same for the kart setup
    .sort((a, b) => a.slot - b.slot);
  if (humans.length === 0 || (GAME.id === "whosfox" && humans.length < WHOSFOX_MIN)) { // WHOSFOX: 3+ people
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
        } else if (botsOn()) {
          const pid = freeIds.shift();
          nameById.set(pid, `Bot ${++botN}`);
          players.push({ type: "bot", bot: true, playerId: pid, color: BOAT_KEYS[boat], boat, seat, name: nameById.get(pid) });
          seatByPid.set(pid, seat);
        } // OFF: the seat stays empty (the game: a boat with nobody aboard sits out, see options.bots)
      }
  }
  for (const p of GAME.seats ? [] : humans) {
    // name: party-mode extra (the real platform sends none; seat games already had it)
    const pl = { type: "player", playerId: p.slot + 1, color: COLOR_KEYS[p.slot], name: p.name };
    const character = characterField(p);
    if (character) pl.character = character; // party-mode extra; absent = puffball
    if (GAME.id === "knight") pl.knight = knightPickOf(p); // KNIGHT: the knight + sword this player picked (party extra)
    const item = skyStartItem(p);
    if (item) pl.startItem = item; // Sky: the doodle vote's winner starts flying their free item (party extra)
    if (GAME.id === "kart") pl.kart = { racer: kartPickOf(p) }; // KART: the racer this player picked (party extra)
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
    nameById.set(s + 1, `Bot ${++botN}`);
    players.push({ type: "bot", bot: true, playerId: s + 1, color: COLOR_KEYS[s], name: nameById.get(s + 1) });
  }
  // If reserved slots blocked the bot fill, use them anyway (round size beats colour reservation).
  for (let s = 0; s < MAX_PLAYERS && players.length < target; s++) {
    if (players.some((q) => q.playerId === s + 1)) continue;
    nameById.set(s + 1, `Bot ${++botN}`);
    players.push({ type: "bot", bot: true, playerId: s + 1, color: COLOR_KEYS[s], name: nameById.get(s + 1) });
  }
  if (!GAME.seats) players.sort((a, b) => a.playerId - b.playerId);
  knightDressBots(players); // KNIGHT: bot: true + each bot's knight + sword
  kartDressBots(players); // KART: bot: true + each bot's racer (the unpicked ones)
  kartRoundStarts(); // KART: the READY flags are spent (a TV reload mid-race doesn't restart from them)
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
  // IN-GAME COUNTDOWN: the game starts paused on its start frame (hold) unless it counts down itself ("own") or
  // trains first (Row: TRAINING, then the countdown from onTrained). ?train=0 on the TV URL = no training (dev/tests).
  r.training = GAME.id === "row" && new URLSearchParams(location.search).get("train") !== "0";
  r.hold = introOf(GAME) !== "own" && !r.training;
  r.intro = null;
  stats.rounds++;
  phase = r.hold ? "countdown" : "playing";
  isPaused = false;
  clearInterval(countdownTimer);
  $("paused").classList.remove("show");
  $("scoreboard").innerHTML = "";
  // A game can ask for no player panel (Snowball Sumo: hud.setup({players:{hidden:true}})).
  $("scoreboard").style.display = hudPanelHidden() ? "none" : "";
  $("screen-points").innerHTML = "";

  const started = game.play({
    isPaused: r.hold,
    seed: r.seed,
    // FoxBox party extension: the game's setup choices (TEE TIME: the map the picker chose; every game: the
    // BOTS setting — Row Row Rumble leaves boats with nobody aboard out when it's "off")
    options: { bots: botsOn() ? "fill" : "off", ...(GAME.id === "golf" && lob.golf ? { map: lob.golf.map } : {}), ...knightOptions(), ...kartOptions(), ...(r.training ? { training: true } : {}) }, // KNIGHT: + the picker's level · KART: + the track · ROW: + training
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
    // FoxBox party extension (the Gaming Couch platform has none): the game talks to its players'
    // phones. send/broadcast wrap m as {t:"game", m} for pad.js; the phones answer with {t:"game", m}
    // → the module's optional fromPhone(playerId, m). connected(playerId): that player's phone is here.
    phones: {
      send(playerId, m) {
        const id = round === r && r.humanIdByPid.get(playerId);
        if (id && roster.get(id)?.connected && m && typeof m === "object") toPad(id, { t: "game", m });
      },
      broadcast(m) {
        if (round !== r || !m || typeof m !== "object") return;
        for (const id of r.humanIdByPid.values()) if (roster.get(id)?.connected) toPad(id, { t: "game", m });
      },
      connected(playerId) {
        const id = r.humanIdByPid.get(playerId);
        return !!(id && roster.get(id)?.connected);
      },
      // ── JETPACK ON THE PHONES (Lakota, Oct 31) ─────────────────────────────────────────────
      // Sky tells each flight's phase here: jet(playerId, { kind, phase: "fly" | "warn" | "end", t, left }).
      // It rides in that player's status (statusFor → jetStatus) so only the flyer's phone plays the sounds.
      jet(playerId, info) {
        const id = round === r && r.humanIdByPid.get(playerId);
        if (!id || !info || typeof info !== "object") return;
        if (!r.jet) r.jet = new Map();
        r.jet.set(playerId, { kind: info.kind, phase: info.phase, t: info.t, endsAt: Date.now() + Math.max(0, Number(info.left) || 0) * 1000 });
        const hp = roster.get(id);
        if (hp) sendStatus(hp);
      },
      // ── end JETPACK ON THE PHONES ──────────────────────────────────────────────────────────
    },
    // gameOver(ids best → worst, extra?): extra.values = { [playerId]: "247 PTS" } (party extension) adds a
    // score column to the TV's and the phones' results
    // ROW TRAINING (party extension): the game's controls check is over and its race is ready, paused on its start
    // frame: the in-game countdown, then the race (deferred: the game may call this from inside its own frame)
    ...(r.training ? {
      onTrained() {
        setTimeout(() => { if (round === r && !r.ended && r.training) beginIntro(r); }, 0);
      },
    } : {}),
    gameOver(ids, extra) {
      if (round !== r || r.ended) {
        stats.contractErrors.push("gameOver after round ended");
        return;
      }
      onGameOver(r, ids, extra);
    },
    ...tvBHooks(r), // multi-TV: the game's per-tick view for the extra TVs (relay parties, games with playMirror)
    // KART MTV: FOX KART draws only THIS TV's players' panes (every extra TV draws its own phones' players): the people
    // whose phones joined from the main TV's QR (roster house "") — or from an extra TV that isn't linked any more
    ...(GAME.id === "kart" ? { ownIds: [...r.humanIdByPid].filter(([, id]) => { const h = roster.get(id)?.house; return !h || !linkedTvs.has(h); }).map(([pid]) => pid) } : {}),
    // end KART MTV
  });
  // With drawn characters play() first loads their images and returns a Promise: the countdown starts once the
  // round's start frame is really drawn (until then the lobby stays up, so the TV never shows a stale frame).
  const go = () => {
    if (round !== r || r.ended) return;
    if (r.hold) return beginIntro(r); // the in-game 3-2-1-GO over the start frame
    // ROW TRAINING / FOX KART ("own"): the game runs now; the training ends in onTrained → the countdown
    show(null);
    for (const p of humans) forwardInput(p);
    broadcastLobby();
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
  $("scoreboard").classList.toggle("many", ordered.length >= 7); // a game whose HUD leaves less room tightens them (golf)
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
      // the meter can carry a small label over it (Row Row Rumble: "reloading")
      const label = d && typeof d.meterLabel === "string" && d.meterLabel ? `<div class="oh-label">${esc(d.meterLabel)}</div>` : "";
      const meter = d && typeof d.meter === "number" && d.meter >= 0 ? `${label}<div class="oh-meter"><div class="oh-meter-fill" style="width:${d.meter}%"></div></div>` : "";
      html.push(`<div class="overhead" style="left:${pt.x * 100}%;top:${(1 - pt.y) * 100}%;${colorVars(c)}"><div class="oh-name">${name}</div>${meter}</div>`);
    } else if (pt.type === "playerPosition" && pt.isOffScreen) {
      const left = clamp(pt.x, 0.05, 0.95) * 100;
      const top = clamp(1 - pt.y, 0.04, 0.96) * 100;
      html.push(`<div class="offscreen" style="left:${left}%;top:${top}%;${colorVars(c)}">${name}</div>`);
    }
  }
  $("screen-points").innerHTML = html.join("");
}

/**
 * The round's results, one list for the TV and every phone: a row per boat in a team game (its crew
 * together, ranked like the points), else a row per player. [{ team?, color, members: [{ pid, name, bot }] }]
 */
/** The results' BOT tag (Lakota: bots show in every game's results, tagged). */
const botTag = (m) => (m && m.bot ? ' <span class="bot-tag" data-test="bot-tag">BOT</span>' : "");
function resultRows(r) {
  const member = (pid) => ({ pid, name: r.nameById.get(pid) ?? `#${pid}`, bot: !r.humanIdByPid.has(pid) });
  // a game's score text per player (gameOver's extra.values, e.g. "247 PTS"): a third column
  const value = (pid) => (r.values && r.values[pid] != null ? { value: String(r.values[pid]).slice(0, 16) } : {});
  if (!GAME.seats) return r.placement.map((pid) => ({ color: r.colorById.get(pid) || colorSet(0), members: [member(pid)], ...value(pid) }));
  const boatOf = new Map(r.players.map((pl) => [pl.playerId, pl.boat]));
  const rows = [];
  for (const pid of r.placement) {
    const boat = boatOf.get(pid);
    let row = rows.find((x) => x.boat === boat);
    if (!row) rows.push((row = { boat, team: `${BOAT_NAMES[boat] ?? "?"} boat`, color: colorSet(COLOR_KEYS.indexOf(BOAT_KEYS[boat])), members: [] }));
    row.members.push(member(pid));
  }
  return rows;
}

function onGameOver(r, ids, extra) {
  r.ended = true;
  r.placement = [...ids];
  r.values = extra && extra.values && typeof extra.values === "object" ? extra.values : null;
  if (!mirror) {
    flushTvB(); // the linked extra TVs: the last ticks, then the finish order (+ a game's score column)
    toTvB({ t: "m:results", ids: r.placement, ...(r.values ? { values: r.values } : {}) });
    awardPoints(r); // (a second TV gets the points with the boss's lobby)
  }
  stats.gameOvers++;
  stats.lastPlacement = [...ids];
  phase = "results";
  $("screen-points").innerHTML = "";

  r.results = resultRows(r);
  const top = r.results[0];
  const team = !!top.team;
  $("res-title").innerHTML = `${crownedPuff(top.color.base, 9)}<span>${esc((team ? top.team : top.members[0].name).toUpperCase())} WINS!<span class="res-cursor">_</span></span>`;
  // an arcade high-score table: RANK · BOAT · CREW in team games, RANK · NAME otherwise
  const vals = !team && r.results.some((row) => row.value != null); // a score column (TEE TIME: "247 PTS")
  const head = team ? `<div class="res-row res-hd"><span>RANK</span><span>BOAT</span><span>CREW</span></div>` : `<div class="res-row res-hd"><span>RANK</span><span>NAME</span>${vals ? "<span class=\"val\">SCORE</span>" : ""}</div>`;
  $("res-list").className = team ? "team" : vals ? "solo vals" : "solo";
  $("res-list").innerHTML = head + r.results
    .map((row, i) => team
      ? `<div class="res-row${i === 0 ? " first" : ""}"><span>${ordinal(i + 1).toUpperCase()}</span><span>${esc(BOAT_NAMES[row.boat] ?? "").toUpperCase()}</span><span class="crew">${row.members.map((m) => esc(m.name) + botTag(m)).join(" · ")}</span></div>`
      : `<div class="res-row${i === 0 ? " first" : ""}"><span>${ordinal(i + 1).toUpperCase()}</span><span class="crew">${esc(row.members[0].name)}${botTag(row.members[0])}</span>${vals ? `<span class="val">${esc(row.value ?? "")}</span>` : ""}</div>`)
    .join("");
  const ends = Date.now() + RESULTS_MS;
  resultsEndsAt = ends;
  const upd = () => {
    const left = Math.max(0, Math.ceil((ends - Date.now()) / 1000));
    $("res-sub").textContent = `BACK TO THE LOBBY IN ${left}... THEN ${GAME.button} FOR A REMATCH!`;
    if (GAME.id === "knight") $("res-sub").textContent = `BACK TO THE LOBBY IN ${left}...`; // KNIGHT: setup2 goes back to the game cards (Lakota), no rematch hint
  };
  upd();
  clearInterval(countdownTimer);
  countdownTimer = setInterval(upd, 250);
  show("results");
  for (const p of roster.values()) sendStatus(p);
  if (mirror) return; // a second TV goes back to the lobby with the boss
  resultsTimer = setTimeout(() => {
    clearInterval(countdownTimer);
    toLobby(true);
  }, RESULTS_MS);
}

// ── Housekeeping tick ─────────────────────────────────────────────────────────
let lastAutoShown = null;
setInterval(() => {
  if (phase !== "lobby" || mirror) return; // a second TV keeps the boss's roster as sent
  skyVoteTick(); // Sky's doodle vote moves on with the clock
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
  // Sky's setup: everyone still here is ready, the one who wasn't left (a few seconds ago) → go
  maybeStartSky();
  maybeStartKnight(); // KNIGHT: the same for the knight setup
  maybeStartKart(); // KART: the same for the kart setup
  if (phase !== "lobby") return;
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
      if (phase !== "lobby") return; // started (the in-game countdown, a Row training, FOX KART's lights)
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
  if (e.repeat || mirror) return; // a second TV is display-only
  if (e.code === "KeyG" && phase === "lobby") {
    switchGame(e.shiftKey ? -1 : 1);
  } else if (e.code === "KeyB" && phase === "lobby" && !e.metaKey && !e.ctrlKey && !e.altKey) {
    setBotsMode(botsMode === "fill" ? "off" : "fill"); // BOTS: FILL / OFF (the lobby toggle does the same)
  } else if ((e.key === "Enter" || e.code === "Space") && phase === "lobby") {
    e.preventDefault();
    startCountdown(null);
  } else if ((e.key === "Enter" || e.code === "Space") && phase === "playing" && round && !round.ended && round.training) {
    e.preventDefault(); // ROW TRAINING: the TV skips the controls check (everyone passes)
    if (typeof game.skipTraining === "function") try { game.skipTraining(); } catch (err) { console.warn("[party] skipTraining threw", err); }
  } else if (e.key === "Enter" && phase === "results") {
    toLobby(true);
  } else if (e.code === "KeyP" && phase === "playing") {
    isPaused = !isPaused;
    game.pause(isPaused);
    $("paused").classList.toggle("show", isPaused);
    toTvB({ t: "m:pause", on: isPaused }); // the extra TVs freeze too (live games stop predicting)
  } else if (e.key === "Escape" && (phase === "playing" || phase === "countdown" || phase === "results")) {
    toLobby();
  }
});
window.addEventListener("pointerdown", () => renderLobby());

// ── Multi-TV (web build + relay) ──────────────────────────────────────────────
// A party can have up to 8 TVs: this one (the MAIN TV, the referee) and up to 7 EXTRA TVs in other homes. An
// extra TV joins from the start screen's JOIN GAME (a public party, or the invite code / ?join= link) as a
// display-only screen of the same relay room. net-p2p.js tells this page about it as {t:"screen", id, on}
// (never as a player). This TV runs everything as before and sends the extra TVs ({t:"scr", m} → every
// linked TV in one relay frame; {t:"scr1", id, m} → one TV):
//   m:lobby    the roster with seats / ready flags + houses + the lobby object, on every change; each extra TV
//              draws them with this same lobby / seat-lobby code
//   m:round    a round started: the players + the game's mirror header (game.play's onMirrorHeader); a TV
//              that links mid-round gets it on its own
//   m:ticks    the game's per-tick view ({q: seq, w: wall ms, k: [tick, …]}, `batch` ticks a message)
//   m:results  the finish order (an extra TV shows it when its replay reaches the last tick)
//   m:switch   the main TV is reloading into another game; the extra TVs follow
// Phones from an extra TV's QR (same room + &house=<that TV's id>) join THIS party and play like everyone
// else; their stick input also goes straight to their own TV, which predicts its own players in live games
// (Sky, Snowball, Row: game.playMirror's view.live). Every game with game.playMirror shows on every TV; others
// show a card there.
const MAX_TVS = 8; // this TV + 7 extra (net-p2p.js and the relay have the same cap)
function toTvB(m) {
  if (linkedTvs.size) wsSend({ t: "scr", m });
}
function toTv1(id, m) {
  if (linkedTvs.has(id)) wsSend({ t: "scr1", id, m });
}
/** {group, host, pub, invite, tvLink, site} from net-p2p.js once the relay room is open (null otherwise). */
let partyInfo = null;
/** A house's name for the TVs: the main TV's = the host's name (HOST steps), an extra TV's = its first player. */
function houseName(house) {
  if (!house) return (partyInfo && partyInfo.host) || "";
  const first = lob.order.map((id) => roster.get(id)).find((p) => p && p.house === house);
  return first ? first.name : "";
}
function tvList() {
  return [...linkedTvs.keys()].map((id, i) => ({ id, n: i + 2, name: houseName(id), here: [...roster.values()].filter((p) => p.house === id && p.connected).length }));
}
let tvBLast = "", tvBTicks = [], tvBSeq = 0, tvBRound = null, tvBBatch = 2;
// the round's most recent ticks (since the last full-state tick a game marks kf / k), for a TV that links mid-round
let tvBRecent = [];
let tvBRecentWhole = true; // the ring still holds every tick since the round's header
const TVB_RECENT_MAX = 200;
function syncTvB(force = false) {
  if (mirrorKit && !mirror) mirrorKit.bossBadge({ lobby: phase === "lobby" || phase === "boot", room: roomCode, party: partyInfo, tvs: tvList(), max: MAX_TVS, host: houseName("") });
  if (!linkedTvs.size) return;
  const holders = new Set(seatHolders());
  const m = {
    t: "m:lobby", game: GAME.id, phase, room: roomCode, lob, bots: botsOn() ? "fill" : "off",
    party: partyInfo ? { group: partyInfo.group, host: partyInfo.host, pub: partyInfo.pub, invite: partyInfo.invite, tvLink: partyInfo.tvLink } : null,
    tvs: tvList(),
    players: [...roster.values()].map((p) => ({
      id: p.id, slot: p.slot, name: p.name, connected: p.connected, seat: holders.has(p) ? p.seat : null,
      ready: !!GAME.seats && rowPlayerReady(p), drawing: !!p.drawing, house: p.house || "", character: p.character || null,
    })),
  };
  const json = JSON.stringify(m);
  if (!force && json === tvBLast) return sendTvPics();
  tvBLast = json;
  toTvB(m);
  sendTvPics();
}

// ── Pictures on every TV (Lakota: "drawings and selfies work across TVs") ─────────────────────────────────
// Each roster player's picture goes to every extra TV ONCE, as a small copy made here (at most PIC_MAX px a side,
// WebP — PNG where the browser can't make WebP — a few KB): {t:"m:pic", id, src, hitbox}, one relay frame each to
// that TV. The relay passes it like any message to a TV of the party (never stored or logged; far under its
// frame and rate limits). A TV that links later gets the ones it doesn't have. The extra TV shows the puffball
// until a picture is in, and keeps it if one never comes.
const PIC_MAX = 160; // px, the longer side
const PIC_MAX_CHARS = 24000; // a data URL longer than this is made again smaller
const picJobs = new Map(); // character id → { from: the picture's src, job: Promise<{ id, src, hitbox } | null> }
const tvPicSent = new Map(); // extra TV id → Map(character id → the src its copy was made from)
function smallPicture(id) {
  const c = characters.get(id);
  if (!c || typeof c.src !== "string" || !c.src) return Promise.resolve(null);
  const had = picJobs.get(id);
  if (had && had.from === c.src) return had.job; // (an edited drawing has a new src: made again)
  const job = new Promise((resolve) => {
    const im = new Image();
    const t = setTimeout(() => resolve(null), 8000);
    im.onload = () => {
      clearTimeout(t);
      try {
        const w = im.naturalWidth, h = im.naturalHeight;
        if (!(w > 0 && h > 0)) return resolve(null);
        let src = "";
        for (const [max, q] of [[PIC_MAX, 0.82], [112, 0.7], [80, 0.6]]) {
          const k = Math.min(1, max / Math.max(w, h));
          const cv = document.createElement("canvas");
          cv.width = Math.max(1, Math.round(w * k));
          cv.height = Math.max(1, Math.round(h * k));
          const g = cv.getContext("2d");
          g.imageSmoothingEnabled = true;
          g.imageSmoothingQuality = "high";
          g.drawImage(im, 0, 0, cv.width, cv.height);
          src = cv.toDataURL("image/webp", q);
          if (!src.startsWith("data:image/webp")) src = cv.toDataURL("image/png");
          if (src.length <= PIC_MAX_CHARS) break;
        }
        resolve(src.length <= PIC_MAX_CHARS * 2 ? { id, src, hitbox: c.hitbox || null } : null);
      } catch {
        resolve(null); // (a picture from another origin can't be read back: that TV keeps the puffball)
      }
    };
    im.onerror = () => {
      clearTimeout(t);
      resolve(null);
    };
    im.src = c.src;
  });
  const entry = { from: c.src, job };
  picJobs.set(id, entry);
  job.then((r) => { if (!r && picJobs.get(id) === entry) picJobs.delete(id); }); // not made: tried again on the next lobby change
  return job;
}
/** The main TV: every linked extra TV gets the pictures of the people in the party it doesn't have yet — and a
 * drawing again when its owner edited it (same id, new picture: the extra TV's copy is replaced). */
function sendTvPics() {
  if (mirror || !linkedTvs.size) return;
  const ids = new Set();
  for (const p of roster.values()) if (p.character && characters.has(p.character)) ids.add(p.character);
  if (!ids.size) return;
  for (const tv of linkedTvs.keys()) {
    let sent = tvPicSent.get(tv);
    if (!sent) tvPicSent.set(tv, (sent = new Map()));
    for (const id of ids) {
      const from = characters.get(id).src;
      if (sent.get(id) === from) continue;
      sent.set(id, from);
      smallPicture(id).then((pic) => {
        if (pic && linkedTvs.has(tv) && characters.get(id)?.src === from) toTv1(tv, { t: "m:pic", ...pic });
        else if (sent.get(id) === from) sent.delete(id);
      });
    }
  }
}
/** net-p2p.js: an extra TV linked ({on: true}: send it everything) or left. */
function onTvB(msg) {
  if (typeof msg.id !== "string") return;
  if (msg.on === false) linkedTvs.delete(msg.id);
  else linkedTvs.set(msg.id, { at: Date.now() });
  tvPicSent.delete(msg.id); // (re)linked or gone: it gets every picture again on its next lobby sync
  syncTvB(true);
  broadcastLobby(); // the lobby state's TV count
  if (msg.on === false || !round || !tvBRound || (phase !== "playing" && phase !== "results" && phase !== "countdown")) return;
  // IN-GAME COUNTDOWN: a TV linking during the 3-2-1 gets it with the round (it starts paused and counts down too)
  const intro = round.intro && !round.ended ? { goAt: round.intro.goAt, mode: round.intro.mode, sub: round.intro.sub } : null;
  const head = { ...tvBRound, hold: !!tvBRound.hold && !!(intro || round.hold), intro };
  // a round in progress: that TV mirrors it from here, starting at once — the header carries the ticks since the
  // last full-state one (Sky kf, golf k; any tick of Row / Snowball is full), applied before its first frame
  let from = tvBRecent.length - 1;
  let marked = false;
  for (let i = tvBRecent.length - 1; i >= 0; i--) if (tvBRecent[i] && (tvBRecent[i].kf || tvBRecent[i].k)) { from = i; marked = true; break; }
  // a game with keyframes (Sky kfEvery, golf key) that hasn't made one yet: the header is the keyframe, so all ticks since
  const h = tvBRound.header || {};
  if (!marked && (h.kfEvery || h.key) && tvBRecentWhole) from = 0;
  toTv1(msg.id, from >= 0 ? { ...head, late: { q: tvBSeq, w: Date.now(), k: tvBRecent.slice(from) } } : head);
  if (phase === "results" && round.placement) toTv1(msg.id, { t: "m:results", ids: round.placement, ...(round.values ? { values: round.values } : {}) });
}
/** The extra play() hooks for a relay party whose game can be mirrored (else none). */
function tvBHooks(r) {
  tvBRound = null;
  if (globalThis.FOXBOX_TRANSPORT !== "relay" || typeof game.playMirror !== "function") return {};
  return {
    onMirrorHeader(header) {
      if (round !== r) return;
      tvBTicks = [];
      tvBRecent = [];
      tvBRecentWhole = true;
      tvBBatch = header && header.batch === 1 ? 1 : 2;
      // IN-GAME COUNTDOWN: hold = the view starts paused on its start frame (the 3-2-1 comes as m:intro). ROW TRAINING:
      // the training's header carries `train` (runs at once); the race's header (sent when the training ends) holds
      const hold = r.training ? !(header && header.train) : !!r.hold;
      tvBRound = { t: "m:round", header, players: r.players.map(({ character, ...pl }) => pl), names: [...r.nameById], humans: [...r.humanIdByPid], seats: [...r.seatByPid], hold, intro: hold ? r.intro || null : null };
      toTvB(tvBRound);
    },
    // WHOSFOX (multi-TV): a game's side messages for the extra TVs (WHO'S THE FOX? takes: photos, clips, voice takes),
    // passed straight through the relay and never kept here (not in the ring a TV linking later gets)
    onMirrorSide(m) {
      if (round !== r || !linkedTvs.size || !m || typeof m !== "object") return;
      toTvB({ t: "m:side", m });
    },
    mirrorLinked: () => linkedTvs.size,
    onMirrorTick(tick) {
      if (round !== r) return;
      tvBRecent.push(tick);
      if (tvBRecent.length > TVB_RECENT_MAX) {
        tvBRecent.splice(0, tvBRecent.length - TVB_RECENT_MAX);
        tvBRecentWhole = false;
      }
      if (!linkedTvs.size) return;
      tvBTicks.push(tick);
      if (tvBTicks.length >= tvBBatch) flushTvB();
    },
  };
}
function flushTvB() {
  if (tvBTicks.length) toTvB({ t: "m:ticks", q: ++tvBSeq, w: Date.now(), k: tvBTicks });
  tvBTicks = [];
}

// This page IS an extra TV: it never runs a game or keeps players of its own; it draws the main TV's.
async function initTwoTvs() {
  if (globalThis.FOXBOX_SCREEN) mirror = { ui: null, view: null, player: null, leaving: false, id: globalThis.FOXBOX_SCREEN.id || "", party: null, tvs: [] };
  if (!mirror && globalThis.FOXBOX_TRANSPORT !== "relay") return;
  try {
    mirrorKit = await import("./mirror.js");
  } catch (e) {
    if (mirror) throw e;
    console.warn("[party] multi-TV mode unavailable", e);
    return;
  }
  if (mirror) mirror.ui = mirrorKit.screenUi({ game: GAME.name });
  if (mirror) globalThis.FOXBOX_HOUSE_GAME = mirrorGameInput; // KNIGHT: own phones' game input → this TV's live view first
  if (mirror) globalThis.FOXBOX_HOUSE_PTR = mirrorPointer; // USE CURSOR: own phones' pointers are drawn on this TV
}
function mirrorMsg(msg) {
  switch (msg.t) {
    case "m:lobby": return mirrorLobby(msg);
    case "m:round": return mirrorRound(msg);
    case "m:intro": // IN-GAME COUNTDOWN: the main TV's 3-2-1 started (goAt on the boss clock)
      if (mirrorPending) return void (mirrorPending.intro = msg); // the game is still setting up: once its view is up
      return mirrorIntro(round, msg);
    case "m:ticks":
      if (mirrorPending) return void mirrorPending.ticks.push(msg); // the game is still setting up: keep them
      return void (mirror.player && mirror.player.push(msg));
    case "m:results": return mirrorResults(round, msg.ids, false, msg.values);
    case "m:switch": return mirrorFollow(msg.game);
    case "m:pic": return mirrorPic(msg); // a small copy of a player's picture (drawing / selfie)
    case "m:side": // WHOSFOX: the running game's side message (a piece of a take) for this TV's view
      if (mirror.view && typeof mirror.view.side === "function") {
        try { mirror.view.side(msg.m); } catch (e) { console.warn("[party] view.side failed", e); }
      }
      return;
    case "pin": return mirrorInput(msg); // one of THIS TV's phones moved its stick / button (live games)
    case "m:pause": // the main TV paused / resumed its round
      if (phase === "playing" && game) {
        try { game.pause(!!msg.on); } catch {}
        $("paused").classList.toggle("show", !!msg.on);
      }
      return;
    case "m:full": // 8 TVs per party: stop dialling and say so
      wsReplaced = true;
      mirror.full = true;
      return mirror.ui.say("That party already has 8 TVs");
  }
}
/** An extra TV: a player's picture from the main TV (a small copy). The lobby and Sky draw it from now on; the
 * puffball stays until then (and if it never comes). Only a plain image data URL is taken. */
function mirrorPic(m) {
  const id = typeof m.id === "string" && m.id.length <= 80 ? m.id : "";
  const src = typeof m.src === "string" && m.src.length <= 120000 && /^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(m.src) ? m.src : "";
  if (!id || !src) return;
  const h = m.hitbox && typeof m.hitbox === "object" ? m.hitbox : null;
  const num = (v, d) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : d);
  const hitbox = h ? { x: num(h.x, 0), y: num(h.y, 0), w: num(h.w, 1), h: num(h.h, 1), ...(h.ball === true ? { ball: true } : {}) } : null;
  const had = characters.get(id);
  if (had && had.src === src) return;
  characters.set(id, { id, src, hitbox });
  preloadCharacter(id);
  renderLobby();
  // a round on this TV (Sky's live view) draws it as soon as it's in
  if (round && mirror.view && typeof mirror.view.setCharacters === "function") {
    try { mirror.view.setCharacters(roundCharacters(round)); } catch {}
  }
}
/** playerId → the play-context character ({src, hitbox, img?}) for a round's people whose pictures this TV has. */
function roundCharacters(r) {
  const out = {};
  for (const [pid, id] of r.humanIdByPid) {
    const p = roster.get(id);
    const c = p && characterField(p);
    if (c) out[pid] = c;
  }
  return out;
}
function mirrorLobby(m) {
  mirror.ui.waiting(false);
  if (m.game !== GAME.id) return mirrorFollow(m.game);
  roster.clear();
  for (const q of m.players || []) {
    const p = { id: q.id, slot: q.slot, name: q.name, character: typeof q.character === "string" && q.character ? q.character : null, seat: q.seat || null, connected: !!q.connected, goneAt: q.connected ? 0 : Date.now(),
      x: 0, b: 0, lastB: 0, drawing: !!q.drawing, house: q.house || "", rowSetupNonce: "0", rowReady: !!q.ready, motionReady: !!q.ready, rowSetupId: null };
    if (q.ready) p.rowSetupId = rowSetupToken(p); // what rowPlayerReady() checks
    roster.set(q.id, p);
  }
  if (m.lob && typeof m.lob === "object") Object.assign(lob, m.lob);
  mirror.bots = m.bots === "fill" ? "fill" : "off";
  mirror.party = m.party || null;
  mirror.tvs = Array.isArray(m.tvs) ? m.tvs : [];
  if (m.phase === "lobby" || m.phase === "boot") {
    if (phase !== "lobby") {
      mirrorLeaveRound();
      phase = "lobby";
      show("lobby");
    }
  } // (phase "countdown": the in-game countdown of a round whose m:round + m:intro this TV gets: no card here)
  // "playing" a game this TV can't draw: its lobby + a card saying where it is ("results" come with the replay)
  const elsewhere = (m.phase === "playing" || m.phase === "countdown") && typeof game.playMirror !== "function";
  if (elsewhere && phase !== "lobby") {
    mirrorLeaveRound();
    phase = "lobby";
    show("lobby");
  }
  mirror.ui.elsewhere(elsewhere, GAME.elsewhere); // KNIGHT: a game without a mirror view can name itself
  mirror.ui.lobby({ room: roomCode, players: m.players || [], lobby: phase === "lobby", me: mirror.id, party: mirror.party, tvs: mirror.tvs });
  renderLobby();
  publishLobby();
}
/** An extra TV: the main TV's in-game countdown over this TV's view of the round (started paused by m:round hold),
 * timed by the boss clock: at goAt the view runs (game.pause(false)) and GO! shows, like the main TV. */
function mirrorIntro(r, m) {
  if (!r || round !== r || r.ended || !m) return;
  const clock = globalThis.FOXBOX_CLOCK || { bossNow: () => Date.now() };
  const mode = m.mode === "ready" ? "ready" : "321";
  const goAt = Number.isFinite(m.goAt) ? m.goAt : clock.bossNow();
  r.intro = { mode, goAt, sub: typeof m.sub === "string" ? m.sub.slice(0, 120) : "", localGoAt: Date.now() + (goAt - clock.bossNow()) };
  r.hold = true;
  phase = "countdown";
  try { game.pause(true); } catch {}
  const tick = () => {
    if (round !== r || r.ended) return clearInterval(introTimer);
    const left = Math.ceil((r.intro.goAt - clock.bossNow()) / 1000);
    if (left > 0) return void introDraw(introLabel(mode, left), r.intro.sub);
    clearInterval(introTimer);
    stats.introGoLateMs = Math.round(clock.bossNow() - r.intro.goAt); // QA: how late GO came here (boss clock)
    r.intro = null;
    r.hold = false;
    phase = "playing";
    try { game.pause(false); } catch (e) { console.warn("[party] pause(false) threw", e); }
    introDraw("GO!", "");
    show("countdown");
    setTimeout(() => { if (round === r && phase === "playing" && $("cd-num").textContent === "GO!") show(null); }, GO_MS);
  };
  clearInterval(introTimer);
  $("cd-num").textContent = "";
  tick();
  if (r.intro) {
    show("countdown");
    introTimer = setInterval(tick, 100);
  }
}
/** A round header that came before game.setup() finished (Snowball's setup is async), + the ticks since. */
let mirrorPending = null;
function mirrorRound(m) {
  if (!game || typeof game.playMirror !== "function" || !m.header) return;
  if (!setupDone) {
    mirrorPending = { m, ticks: [] }; // a TV that (re)loads mid-round: the round starts once the game is set up
    return;
  }
  mirrorLeaveRound();
  const players = m.players || [];
  const colorById = new Map(players.map((pl) => [pl.playerId, GAME.seats ? colorSet(COLOR_KEYS.indexOf(BOAT_KEYS[pl.boat])) : colorSet(pl.playerId - 1)]));
  round = { players, nameById: new Map(m.names), colorById, humanIdByPid: new Map(m.humans), seatByPid: new Map(m.seats), out: new Set(), hudById: new Map(), placement: null, ended: false, seed: m.header.seed, ids: null, replayed: false };
  const r = round;
  r.hold = !!m.hold; // IN-GAME COUNTDOWN: the view starts paused on its start frame; m:intro counts it down
  phase = r.hold ? "countdown" : "playing";
  $("scoreboard").innerHTML = "";
  $("scoreboard").style.display = hudPanelHidden() ? "none" : "";
  $("screen-points").innerHTML = "";
  // this TV's own players: the round's people who joined from THIS TV's QR (their phones send input here too)
  const own = [...r.humanIdByPid].filter(([, id]) => roster.get(id)?.house === mirror.id && mirror.id).map(([pid]) => pid);
  const clock = globalThis.FOXBOX_CLOCK || { bossNow: () => Date.now() };
  // linked mid-round: the main TV's recent ticks came with the header; a view can take them before its first frame
  const lateM = m.late && Array.isArray(m.late.k) && m.late.k.length ? m.late : null;
  const late = lateM ? lateM.k.map((t, i) => [t, lateM.w - (lateM.k.length - 1 - i) * (1000 / 60)]) : null;
  // the pictures this TV has (small copies from the main TV) ride on the players like on the main TV's play():
  // Sky draws them, the rest stay puffballs (view.setCharacters adds ones that come in during the round)
  const chars = roundCharacters(r);
  const viewPlayers = players.map((pl) => (chars[pl.playerId] ? { ...pl, character: chars[pl.playerId] } : pl));
  try {
    mirror.view = game.playMirror({
      players: viewPlayers, gameProperties, header: m.header, own, clock, isPaused: r.hold, late,
      hud: {
        updatePlayers(data) { if (round === r) onHudPlayers(r, data.players || []); },
        updateScreenPoints(data) { if (round === r) renderScreenPoints(r, data.points || []); },
      },
    });
  } catch (err) {
    console.warn("[party] this TV can't show the main TV's round", err);
    mirror.view = null;
  }
  if (!mirror.view) {
    // the game couldn't start its view (a version mismatch?): the lobby + "playing on the main TV"
    phase = "lobby";
    show("lobby");
    mirror.ui.elsewhere(true, GAME.elsewhere); // KNIGHT
    return;
  }
  const onOver = () => mirrorResults(r, null, true);
  mirror.player = mirror.view && mirror.view.live
    ? mirrorKit.livePlayer(mirror.view, { game: GAME.id, own, onOver })
    : mirrorKit.tickPlayer(mirror.view, { game: GAME.id, onOver });
  // …a view that didn't take them (ctx.late is optional) gets them through its player, before its next frame
  if (lateM && !(mirror.view && mirror.view.lateApplied)) mirror.player.push({ t: "m:ticks", q: lateM.q, w: lateM.w, k: lateM.k });
  mirror.own = new Set(own);
  // "CONNECTED TO <HOST>'S GAME": the host's name from the HOST steps (golf's banner has the corner: top middle there);
  // no host name (web TV mode, or left blank): "CONNECTED TO <GROUP>"
  mirror.ui.playing(mirror.party?.host || houseName("") || "", { at: GAME.id === "golf" ? "top" : GAME.id === "knight" ? "bottom" : "corner", group: mirror.party?.group || "" }); // KNIGHT: bottom left
  // IN-GAME COUNTDOWN: a held round counts down with the main TV (m:intro, or the intro that came with a late header);
  // a running one (FOX KART's own lights, Row's training, a TV linking mid-round) just shows
  show(null);
  if (r.hold && m.intro) mirrorIntro(r, m.intro);
}
/** One of THIS TV's phones moved (it sends its input here as well as to the main TV): its player, at once. */
function mirrorInput(msg) {
  window.__foxboxLastInputAt = Date.now();
  if (!mirror.view || !mirror.view.live || phase !== "playing" || !round) return;
  const p = roster.get(msg.id);
  if (!p || p.house !== mirror.id) return;
  const pid = [...round.humanIdByPid].find(([, id]) => id === msg.id)?.[0];
  if (pid == null || !mirror.own.has(pid)) return;
  if (mirror.player && mirror.player.input) mirror.player.input(pid, msg);
}
// ── KNIGHT (multi-TV) ──
/**
 * One of THIS TV's phones sent the running game a {t:"game"} message that its live view takes (NONAME's {type:"in"}
 * buttons). net-p2p.js calls this (globalThis.FOXBOX_HOUSE_GAME) synchronously, before it passes the phone's message
 * on to the main TV: the view moves its knight at once (view.fromPhone) and returns the main TV's tick it applied the
 * input at; net-p2p.js adds that as m.at, and the main TV (the referee) applies it at that same tick. how = "p2p" (the
 * message goes on stamped) | "relay" (the phone's link is the relay: the main TV already has its own copy, unstamped).
 * null = not this TV's player in a live round (the message goes on unchanged).
 */
function mirrorGameInput(id, gm, how) {
  if (!mirror || !mirror.view || !mirror.view.live || phase !== "playing" || !round || !gm || typeof gm !== "object") return null;
  const p = roster.get(id);
  if (!p || p.house !== mirror.id) return null;
  const pid = [...round.humanIdByPid].find(([, cid]) => cid === id)?.[0];
  if (pid == null || !mirror.own.has(pid)) return null;
  window.__foxboxLastInputAt = Date.now();
  if (!mirror.player || typeof mirror.player.game !== "function") return null;
  return mirror.player.game(pid, gm, how);
}
// ── end KNIGHT ──
/** The main TV's finish order (+ score values) and/or the replay reaching its last tick: results once both are in (or 3 s after the order). */
function mirrorResults(r, ids, replayed, values) {
  if (!r || r !== round || r.ended) return;
  if (ids) r.ids = ids;
  if (values && typeof values === "object") r.bossValues = values;
  if (replayed) r.replayed = true;
  if (!r.ids) return;
  if (!r.replayed) {
    clearTimeout(r.wait);
    r.wait = setTimeout(() => mirrorResults(r, null, true), 3000);
    return;
  }
  clearTimeout(r.wait);
  onGameOver(r, r.ids, r.bossValues ? { values: r.bossValues } : undefined);
}
function mirrorLeaveRound() {
  mirrorPending = null;
  clearInterval(countdownTimer);
  clearInterval(introTimer);
  if (round) clearTimeout(round.wait);
  if (mirror.player) mirror.player.stop();
  if (mirror.view) mirror.view.stop();
  mirror.player = mirror.view = null;
  mirror.own = new Set();
  mirror.ui.playing(null);
  $("screen-points").innerHTML = "";
}
/** The main TV switched games: reload into the same one (?join=INVITE stays in the address). */
function mirrorFollow(id) {
  const g = GAMES.find((x) => x.id === id);
  if (!g || g === GAME || mirror.leaving) return;
  mirror.leaving = true;
  mirror.ui.say(`Switching to ${g.name}…`);
  const q = new URLSearchParams(location.search);
  q.set("game", g.id);
  location.search = q.toString();
}

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
  /** Sky's setup: { id, picked: {id: true}, ready: {id: true} } or null. */
  get sky() {
    return lob.sky && JSON.parse(JSON.stringify(lob.sky));
  },
  get countdownWhy() {
    return countdownWhy;
  },
  /** IN-GAME COUNTDOWN: { mode: "321" | "ready", goAt (this TV's clock), label } while it runs, else null. */
  get intro() {
    return round && round.intro ? { mode: round.intro.mode, goAt: round.intro.localGoAt || round.intro.goAt, label: $("cd-num").textContent } : null;
  },
  /** ROW TRAINING: the round is in its controls check. */
  get training() {
    return !!(round && !round.ended && round.training);
  },
  /** KNIGHT: the knight setup { id, level, picks: {id: {knight, sword, ready}} } or null. */
  get knight() {
    return lob.knight && JSON.parse(JSON.stringify(lob.knight));
  },
  /** KART: the kart setup { id, track, picks: {id: {racer, ready}}, bots } or null (+ last: each phone's last racer). */
  get kart() {
    return lob.kart && { ...JSON.parse(JSON.stringify(lob.kart)), last: { ...(lob.kartLast || {}) } };
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
  toTvB({ t: "m:switch", game: next.id }); // a linked second TV follows (it also notices on reconnect)
  const q = new URLSearchParams(location.search);
  q.set("game", next.id);
  location.search = q.toString();
}

function renderHub() {
  document.title = `${HUB_NAME} — ${GAME.name}`;
  $("hud").dataset.game = GAME.id; // per-game HUD layout (index.html: golf's player stack keeps clear of its panels)
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
  botsMode = loadBotsMode(); // after the HOST steps (their step 4 saves the choice)
  $("bots-toggle")?.addEventListener("click", () => setBotsMode(botsMode === "fill" ? "off" : "fill"));
  await initTwoTvs(); // web build + relay: the second-TV bits (a ?tv=CODE page becomes a second TV)
  if (lobbyUI()) lobbyUI().onPick = (id) => pickGame(id);
  if (!mirror) loadLobby(); // a second TV gets the boss's lobby instead
  // A saved pick for a different game than this page loaded (an old tab, the G key, a typed ?game=)
  // would leave everyone stuck on "picked …" in the lobby: forget it, and the picker picks again.
  if (lob.selectedGameId && lob.selectedGameId !== GAME.id) {
    lob.selectedGameId = null;
    saveLobby();
  }
  // Sky picked (this page just loaded for it, or reloaded mid-setup): its setup goes on / begins
  if (GAME.id === "sky" && lob.selectedGameId === "sky") {
    if (!lob.sky) {
      newSkySetup();
      saveLobby();
    }
  } else if (lob.sky) {
    lob.sky = null;
    saveLobby();
  }
  if (GAME.id === "golf" && lob.selectedGameId === "golf") { // TEE TIME: a setup with a map choice
    if (!lob.golf || typeof lob.golf.map !== "string") {
      lob.golf = { map: "random" };
      saveLobby();
    }
  } else if (lob.golf) {
    lob.golf = null;
    saveLobby();
  }
  // ── KNIGHT (Knight Platformer) ──: picked (this page just loaded for it, or reloaded mid-setup): its setup goes on / begins
  if (GAME.id === "knight" && lob.selectedGameId === "knight") {
    if (!validKnightSetup(lob.knight)) {
      newKnightSetup(null);
      saveLobby();
    }
  } else if (lob.knight) {
    lob.knight = null;
    saveLobby();
  }
  // ── end KNIGHT ──
  // ── KART (FOX KART) ──: picked (this page just loaded for it, or reloaded mid-setup): its setup goes on / begins
  if (GAME.id === "kart" && lob.selectedGameId === "kart") {
    if (!validKartSetup(lob.kart)) {
      newKartSetup(null);
      saveLobby();
    }
  } else if (lob.kart) {
    lob.kart = null;
    saveLobby();
  }
  // ── end KART ──
  renderHub();
  if (!mirror) loadRoster();
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
      // an extra TV that loaded mid-round: the main TV's round (and the ticks that came meanwhile) now
      if (mirror && mirrorPending) {
        const pend = mirrorPending;
        mirrorPending = null;
        mirrorRound(pend.m);
        for (const t of pend.ticks) if (mirror.player) mirror.player.push(t);
        if (pend.intro) mirrorIntro(round, pend.intro); // IN-GAME COUNTDOWN: an m:intro that came meanwhile
      }
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
