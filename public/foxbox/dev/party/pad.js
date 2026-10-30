/**
 * pad.js — Sky Scramble phone controller (party mode).
 *
 * Connects to tools/party-server.ts at /ws?role=pad, joins with a persistent client id
 * (localStorage) + nickname, and sends {t:"in", x, b} the moment the stick or BONK
 * changes (x −1..1 in 0.05 steps, b 0|1), plus a {t:"hb"} heartbeat every 2 s.
 * The TV host answers with {t:"status", state, color, …} which drives the screen.
 *
 * Character: after the name step (and from "Change character" between rounds) the phone
 * shows a picker — the default bouncy ball plus every drawn character from /api/characters.
 * The pick is remembered in localStorage and sent with join as `character` (id or null).
 * "Take a selfie" opens the camera (<input type=file capture=user> — works over plain http,
 * unlike getUserMedia), shows a circle cropper (drag to move, pinch / slider to zoom), and
 * uploads a 512×512 PNG of the square around the circle to POST /api/selfie. The server lists
 * it as the ball character "selfie-<client id>", which this phone then picks.
 *
 * "Draw your own" (draw.js) opens a full-screen drawing canvas; Done uploads the drawing (with a
 * white sticker edge, cropped, plus its hitbox) to POST /api/drawing as "drawn-<client id>",
 * which this phone then picks; the tile becomes "Edit my drawing". The canvas is kept in
 * localStorage (DRAW_KEY) after every stroke, so a reload / phone lock mid-drawing loses nothing
 * (and a reload goes straight back to the drawing). While the drawing screen is open the phone
 * reports {t:"state", drawing:true} (also in join): the TV shows "drawing…" and keeps this
 * player out of any round that starts meanwhile.
 *
 * Steering: touch anywhere in the left panel — left of centre steers left, right of
 * centre steers right, further from the centre = harder (full at ~65 % of the way to
 * the edge). Drag to adjust; let go and it springs back to 0. Works as "tap the left /
 * right half" too.
 */

import { createDrawPad } from "./draw.js";
import { isP2P, ready as netReady, openSocket, api } from "./net.js";
import { createRowPad } from "./row-pad.js";
import { createCapPad } from "./cap-pad.js";
import { createLandscape } from "./landscape.js";
import { createPhoneSounds } from "./phone-sounds.js";

const phoneSounds = createPhoneSounds({
  onReady: (audioReady) => queueMicrotask(() => sendRaw({ t: "state", drawing: drawOpen, audioReady: audioReady === true })),
});

const STORE_KEY = "sky-scramble-pad";
const DRAW_KEY = "sky-scramble-pad-drawing"; // the drawing in progress / last drawing (PNG data URL + settings)
const DRAW_MAX_CHARS = 2_500_000; // don't let a huge data URL blow the localStorage quota
const HEARTBEAT_MS = 2000;
const SILENT_RECONNECT_MS = 7000; // nothing heard from the server for this long → reconnect
const DEADZONE = 0.12;
const FULL_AT = 0.65; // fraction of the half-width where steering hits ±1

const $ = (id) => document.getElementById(id);

// ── Identity ────────────────────────────────────────────────────────────────────
function loadMe() {
  let me = {};
  try {
    me = JSON.parse(localStorage.getItem(STORE_KEY)) || {};
  } catch {}
  if (typeof me.id !== "string" || me.id.length < 8) {
    // crypto.randomUUID needs a secure context (https) — plain http on the LAN isn't one.
    me.id = "p" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }
  // Web version: one player per browser tab (kept across reloads of that tab), so two tabs —
  // or two people sharing a device — are two players. The name is still remembered for good.
  if (isP2P) {
    try {
      let tabId = sessionStorage.getItem("foxbox-client-id");
      if (!tabId) {
        tabId = "p" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
        sessionStorage.setItem("foxbox-client-id", tabId);
      }
      me.id = tabId;
    } catch {}
  }
  if (typeof me.name !== "string") me.name = "";
  if (typeof me.character !== "string" || !me.character) me.character = null;
  return me;
}
const me = loadMe();
function saveMe() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(me));
  } catch {}
}
saveMe();

// ── Screens ─────────────────────────────────────────────────────────────────────
let curScreen = null;
function showScreen(id) {
  curScreen = id;
  for (const s of ["name-screen", "char-screen", "crop-screen", "draw-screen", "pad-screen"]) $(s).classList.toggle("show", s === id);
  if (typeof syncExtras === "function") syncExtras();
}

// ── Character picker ────────────────────────────────────────────────────────────
/** id → { id, name, src } from /api/characters (null until fetched). */
let charList = null;

async function fetchCharacters() {
  try {
    const res = await api("/api/characters", { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    charList = new Map((data.characters || []).map((c) => [c.id, c]));
  } catch {
    if (!charList) charList = null;
  }
  return charList;
}

/** Ball characters (hitbox.ball): show just the hitbox circle, filling a round box. */
function circleCrop(el, c) {
  const { x, y, w, h } = c.hitbox;
  const pos = (o, s) => (s >= 1 ? 50 : (o / (1 - s)) * 100);
  el.style.backgroundImage = `url("${c.src}")`;
  el.style.backgroundSize = `${100 / w}% ${100 / h}%`;
  el.style.backgroundPosition = `${pos(x, w)}% ${pos(y, h)}%`;
}

function renderMeBall() {
  const ball = $("me-ball");
  const c = me.character && charList && charList.get(me.character);
  const round = !!(c && c.hitbox && c.hitbox.ball);
  ball.classList.toggle("pic", !!c && !round);
  ball.classList.toggle("roundpic", round);
  ball.removeAttribute("style");
  if (round) circleCrop(ball, c);
  else if (c) ball.style.backgroundImage = `url("${c.src}")`;
}

function cardEl(id, name, pic) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "char-card" + ((me.character || null) === id ? " sel" : "");
  const box = document.createElement("div");
  box.className = "pic";
  box.append(pic);
  const nm = document.createElement("div");
  nm.className = "nm";
  nm.textContent = name;
  b.append(box, nm);
  b.addEventListener("click", () => chooseCharacter(id));
  return b;
}

const mySelfieId = () => "selfie-" + me.id.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32);
const myDrawingId = () => "drawn-" + me.id.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32);

/** The "Take a selfie" tile: a <label> for the camera file input (the most reliable way to open it on iOS). */
function selfieTile() {
  const has = !!(charList && charList.has(mySelfieId()));
  const tile = document.createElement("label");
  tile.className = "char-card selfie";
  tile.htmlFor = "selfie-input";
  const box = document.createElement("div");
  box.className = "pic";
  const cam = document.createElement("div");
  cam.className = "cam";
  cam.textContent = "📸";
  box.append(cam);
  const nm = document.createElement("div");
  nm.className = "nm";
  nm.textContent = has ? "Retake selfie" : "Take a selfie";
  tile.append(box, nm);
  return tile;
}

/** The "Draw your own" tile — "Edit my drawing" once this phone has one (the drawing itself is its own card). */
function drawTile() {
  const mine = charList && charList.get(myDrawingId());
  const b = document.createElement("button");
  b.type = "button";
  b.id = "draw-tile";
  b.className = "char-card selfie drawtile";
  const box = document.createElement("div");
  box.className = "pic";
  const ic = document.createElement("div");
  ic.className = "cam";
  ic.textContent = mine ? "✏️" : "🖍️";
  box.append(ic);
  const nm = document.createElement("div");
  nm.className = "nm";
  nm.textContent = mine ? "Edit my drawing" : "Draw your own";
  b.append(box, nm);
  b.addEventListener("click", () => openDraw());
  return b;
}

async function showPicker() {
  release();
  showScreen("char-screen");
  const grid = $("char-grid");
  const draw = () => {
    grid.innerHTML = "";
    const ball = document.createElement("div");
    ball.className = "ballpic";
    grid.append(cardEl(null, "Bouncy ball", ball));
    grid.append(selfieTile());
    grid.append(drawTile());
    // my own drawing and selfie first, then everything else
    const list = charList ? [...charList.values()] : [];
    const mine = (c) => (c.id === myDrawingId() ? 2 : c.id === mySelfieId() ? 1 : 0);
    list.sort((a, b) => mine(b) - mine(a));
    for (const c of list) {
      let pic;
      if (c.hitbox && c.hitbox.ball) {
        pic = document.createElement("div");
        pic.className = "ballpic photo";
        circleCrop(pic, c);
      } else {
        pic = document.createElement("img");
        pic.src = c.src;
        pic.alt = "";
        pic.decoding = "async";
      }
      grid.append(cardEl(c.id, c.name, pic));
    }
  };
  draw();
  $("char-note").textContent = charList ? "" : "Loading drawings…";
  await fetchCharacters();
  if (!$("char-screen").classList.contains("show")) return;
  $("char-note").textContent = charList ? "" : "Couldn't load the drawings — the ball it is!";
  draw();
}

// ── Selfie: camera → circle cropper → upload ───────────────────────────────────
const CROP_OUT = 512; // output PNG size (the square around the circle)
const PHOTO_MAX = 1600; // the photo is downscaled to this once, so dragging stays smooth
const crop = { photo: null, zoom: 1, ox: 0, oy: 0, pointers: new Map(), pinch: null };

$("selfie-input").addEventListener("change", async (e) => {
  const input = e.target;
  const file = input.files && input.files[0];
  input.value = ""; // so picking the same photo again still fires "change"
  if (!file) return;
  $("char-note").textContent = "Loading your photo…";
  try {
    crop.photo = await loadPhoto(file);
  } catch {
    $("char-note").textContent = "Couldn't open that photo — try again?";
    return;
  }
  $("char-note").textContent = "";
  openCropper();
});

/** Decode a camera photo upright (EXIF orientation) into a canvas no bigger than PHOTO_MAX. */
async function loadPhoto(file) {
  let src = null;
  if (typeof createImageBitmap === "function") {
    try {
      src = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      src = null;
    }
  }
  if (!src) {
    // modern iOS Safari draws <img> upright from EXIF on its own
    const url = URL.createObjectURL(file);
    try {
      src = await new Promise((res, rej) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = rej;
        im.src = url;
      });
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
  const w = src.naturalWidth || src.width, h = src.naturalHeight || src.height;
  if (!(w > 0 && h > 0)) throw new Error("empty image");
  const k = Math.min(1, PHOTO_MAX / Math.max(w, h));
  const cv = document.createElement("canvas");
  cv.width = Math.max(1, Math.round(w * k));
  cv.height = Math.max(1, Math.round(h * k));
  const g = cv.getContext("2d");
  g.imageSmoothingQuality = "high";
  g.drawImage(src, 0, 0, cv.width, cv.height);
  if (src.close) src.close();
  return cv;
}

function stageSize() {
  return $("crop-stage").clientWidth || 300;
}
/** Image scale (stage px per photo px) at the current zoom: zoom 1 = the photo just covers the square. */
function cropScale() {
  const S = stageSize(), P = crop.photo;
  return Math.max(S / P.width, S / P.height) * crop.zoom;
}
/** Keep the photo covering the whole square. */
function clampCrop() {
  const S = stageSize(), sc = cropScale();
  crop.ox = Math.min(0, Math.max(S - crop.photo.width * sc, crop.ox));
  crop.oy = Math.min(0, Math.max(S - crop.photo.height * sc, crop.oy));
}
/** Zoom keeping the photo point under the stage centre still. */
function setZoom(z) {
  const S = stageSize();
  const before = cropScale();
  const cx = (S / 2 - crop.ox) / before, cy = (S / 2 - crop.oy) / before;
  crop.zoom = Math.max(1, Math.min(4, z));
  const after = cropScale();
  crop.ox = S / 2 - cx * after;
  crop.oy = S / 2 - cy * after;
  clampCrop();
  $("crop-zoom").value = String(crop.zoom);
  drawCrop();
}

function openCropper() {
  showScreen("crop-screen");
  $("crop-note").textContent = "";
  $("crop-use").disabled = false;
  crop.zoom = 1;
  $("crop-zoom").value = "1";
  requestAnimationFrame(() => {
    const S = stageSize(), sc = cropScale();
    crop.ox = (S - crop.photo.width * sc) / 2;
    crop.oy = (S - crop.photo.height * sc) / 2;
    drawCrop();
  });
}

function drawCrop() {
  if (!crop.photo) return;
  const cv = $("crop-canvas");
  const S = stageSize();
  const dpr = window.devicePixelRatio || 1;
  const px = Math.round(S * dpr);
  if (cv.width !== px) cv.width = cv.height = px;
  const g = cv.getContext("2d");
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, S, S);
  const sc = cropScale();
  g.drawImage(crop.photo, crop.ox, crop.oy, crop.photo.width * sc, crop.photo.height * sc);
  // dim everything outside the circle, then ring it
  g.fillStyle = "rgba(8, 12, 30, 0.62)";
  g.beginPath();
  g.rect(0, 0, S, S);
  g.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2, true);
  g.fill("evenodd");
  g.strokeStyle = "#fff";
  g.lineWidth = 4;
  g.beginPath();
  g.arc(S / 2, S / 2, S / 2 - 4, 0, Math.PI * 2);
  g.stroke();
}

const stage = $("crop-stage");
stage.addEventListener("pointerdown", (ev) => {
  ev.preventDefault();
  try {
    stage.setPointerCapture(ev.pointerId);
  } catch {}
  crop.pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
  if (crop.pointers.size === 2) {
    const [a, b] = [...crop.pointers.values()];
    crop.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, zoom: crop.zoom };
  }
});
stage.addEventListener("pointermove", (ev) => {
  const prev = crop.pointers.get(ev.pointerId);
  if (!prev || !crop.photo) return;
  ev.preventDefault();
  const cur = { x: ev.clientX, y: ev.clientY };
  crop.pointers.set(ev.pointerId, cur);
  if (crop.pointers.size >= 2 && crop.pinch) {
    const [a, b] = [...crop.pointers.values()];
    setZoom(crop.pinch.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / crop.pinch.d));
  } else if (crop.pointers.size === 1) {
    crop.ox += cur.x - prev.x;
    crop.oy += cur.y - prev.y;
    clampCrop();
    drawCrop();
  }
});
const cropUp = (ev) => {
  crop.pointers.delete(ev.pointerId);
  if (crop.pointers.size < 2) crop.pinch = null;
};
stage.addEventListener("pointerup", cropUp);
stage.addEventListener("pointercancel", cropUp);
stage.addEventListener("lostpointercapture", cropUp);
$("crop-zoom").addEventListener("input", (e) => setZoom(Number(e.target.value) || 1));
window.addEventListener("resize", () => {
  if ($("crop-screen").classList.contains("show") && crop.photo) {
    clampCrop();
    drawCrop();
  }
});
$("crop-back").addEventListener("click", () => showPicker());
$("crop-retake").addEventListener("click", () => $("selfie-input").click());

$("crop-use").addEventListener("click", async () => {
  if (!crop.photo) return;
  const btn = $("crop-use");
  btn.disabled = true;
  $("crop-note").textContent = "Sending to the TV…";
  try {
    // the square around the circle, at CROP_OUT × CROP_OUT
    const S = stageSize(), f = CROP_OUT / S, sc = cropScale();
    const out = document.createElement("canvas");
    out.width = out.height = CROP_OUT;
    const g = out.getContext("2d");
    g.imageSmoothingQuality = "high";
    g.drawImage(crop.photo, crop.ox * f, crop.oy * f, crop.photo.width * sc * f, crop.photo.height * sc * f);
    const blob = await new Promise((res) => out.toBlob(res, "image/png"));
    if (!blob) throw new Error("could not make the picture");
    const res = await api("/api/selfie", {
      method: "POST",
      headers: { "Content-Type": "image/png", "X-Client-Id": me.id, "X-Name": encodeURIComponent(me.name || "") },
      body: blob,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || !data.ok || !data.character) throw new Error((data && data.error) || `error ${res.status}`);
    if (!charList) charList = new Map();
    charList.set(data.character.id, data.character);
    crop.photo = null;
    chooseCharacter(data.character.id);
  } catch (err) {
    $("crop-note").textContent = `Didn't work (${err.message || err}) — try again?`;
    btn.disabled = false;
  }
});

// ── Draw your own ──────────────────────────────────────────────────────────────
let drawOpen = false; // the drawing screen is up (reported to the TV as drawing=true)
let drawSaveTimer = null;

function loadDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(DRAW_KEY));
    return d && typeof d === "object" ? d : null;
  } catch {
    return null;
  }
}
/** Remember the canvas + settings (and whether the screen is open). Skips an oversized picture. */
function saveDraft() {
  clearTimeout(drawSaveTimer);
  drawSaveTimer = null;
  const st = draw.state();
  st.open = drawOpen;
  if (st.png && st.png.length > DRAW_MAX_CHARS) {
    const old = loadDraft();
    st.png = old && old.png ? old.png : null; // too big to keep: hold on to the last one that fit
  }
  try {
    localStorage.setItem(DRAW_KEY, JSON.stringify(st));
  } catch {
    try {
      // over quota: keep at least the settings + open flag
      localStorage.setItem(DRAW_KEY, JSON.stringify({ ...st, png: null }));
    } catch {}
  }
}
function saveDraftSoon() {
  clearTimeout(drawSaveTimer);
  drawSaveTimer = setTimeout(saveDraft, 400);
}

function setDrawing(on) {
  if (drawOpen === on) return;
  drawOpen = on;
  sendRaw({ t: "state", drawing: on });
}

const draw = createDrawPad(
  {
    screen: $("draw-screen"),
    stage: $("draw-stage"),
    board: $("draw-board"),
    art: $("draw-art"),
    guide: $("draw-guide"),
    tools: $("draw-tools"),
    colors: $("draw-colors"),
    sizes: $("draw-sizes"),
    body: $("draw-body"),
    paper: $("draw-paper"),
    preview: $("draw-preview"),
    undo: $("draw-undo"),
    clear: $("draw-clear"),
    confirm: $("draw-confirm"),
    clearYes: $("draw-clear-yes"),
    clearNo: $("draw-clear-no"),
    done: $("draw-done"),
    back: $("draw-back"),
    note: $("draw-note"),
  },
  {
    onChange: saveDraftSoon,
    onBack() {
      setDrawing(false);
      saveDraft();
      showPicker();
    },
    onDone: uploadDrawing,
  },
);

async function openDraw() {
  release();
  showScreen("draw-screen");
  setDrawing(true);
  const draft = loadDraft() || {};
  let fallback = null;
  const mine = charList && charList.get(myDrawingId());
  if (!("png" in draft) && mine) {
    // no local copy of my drawing (storage cleared / another browser): start from the uploaded one
    fallback = await new Promise((res) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = mine.src;
    });
  }
  await draw.open(draft, fallback);
  saveDraft();
}

async function uploadDrawing() {
  const baked = draw.bake();
  if (!baked) return;
  draw.busy(true);
  draw.note("Sending to the TV…", true);
  try {
    const blob = await new Promise((res) => baked.canvas.toBlob(res, "image/png"));
    if (!blob) throw new Error("could not make the picture");
    const res = await api("/api/drawing", {
      method: "POST",
      headers: {
        "Content-Type": "image/png",
        "X-Client-Id": me.id,
        "X-Name": encodeURIComponent(me.name || ""),
        "X-Hitbox": JSON.stringify(baked.hitbox),
      },
      body: blob,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || !data.ok || !data.character) throw new Error((data && data.error) || `error ${res.status}`);
    if (!charList) charList = new Map();
    charList.set(data.character.id, data.character);
    drawOpen = false; // chooseCharacter's join tells the TV (drawing: false)
    saveDraft();
    draw.busy(false);
    draw.note("");
    chooseCharacter(data.character.id);
  } catch (err) {
    draw.busy(false);
    draw.note(`Didn't work (${err.message || err}) — try again?`, true);
  }
}

function chooseCharacter(id) {
  me.character = id && charList && charList.has(id) ? id : null;
  saveMe();
  renderMeBall();
  showScreen("pad-screen");
  if (ws && ws.readyState === 1) sendJoin();
  else connect();
  renderStatus();
}

$("name-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("name-input").value.replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, 12);
  if (!name) {
    $("name-input").focus();
    return;
  }
  me.name = name;
  saveMe();
  $("name-input").blur();
  $("me-name").textContent = me.name;
  // Straight to "You're in!": the character (Sky Scramble only) is set up from there.
  renderMeBall();
  showScreen("pad-screen");
  if (ws && ws.readyState === 1) sendJoin();
  else connect();
  renderStatus();
});
$("change-char").addEventListener("click", () => showPicker());
$("switch-game").addEventListener("click", () => sendRaw({ t: "pick" }));
$("edit-name").addEventListener("click", () => {
  release();
  $("name-input").value = me.name;
  showScreen("name-screen");
  setTimeout(() => $("name-input").focus(), 50);
});

// ── Connection ──────────────────────────────────────────────────────────────────
let ws = null;
let retryMs = 400;
let retryTimer = null;
let lastRx = 0;
let hostUp = false;
let replaced = false;
let lastStatus = null;

function setConn(kind, text) {
  const el = $("conn");
  el.className = kind;
  el.textContent = text;
}

function connect() {
  clearTimeout(retryTimer);
  if (ws && (ws.readyState === 0 || ws.readyState === 1)) return;
  replaced = false;
  setConn("", "Connecting");
  const sock = openSocket("pad");
  ws = sock;
  sock.onopen = () => {
    retryMs = 400;
    lastRx = Date.now();
    setConn("ok", "Connected");
    sendJoin();
  };
  sock.onmessage = (ev) => {
    lastRx = Date.now();
    let msg;
    try {
      msg = JSON.parse(ev.data);
    } catch {
      return;
    }
    onMessage(msg);
  };
  sock.onclose = (ev) => {
    if (ws !== sock) return;
    ws = null;
    sent = { x: null, b: null, s: null };
    if (ev.code === 4000 || replaced) {
      replaced = true;
      setConn("bad", "Paused");
      renderStatus();
      return;
    }
    setConn("bad", "Reconnecting");
    renderStatus();
    retryTimer = setTimeout(connect, retryMs);
    retryMs = Math.min(3000, retryMs * 1.6);
  };
  sock.onerror = () => {};
}

function sendRaw(obj) {
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify(obj));
    return true;
  }
  return false;
}
function sendJoin() {
  sendRaw({ t: "join", id: me.id, name: me.name, character: me.character, drawing: drawOpen, audioReady: phoneSounds.ready === true });
  sent = { x: null, b: null, s: null };
  flush();
}

setInterval(() => {
  if (!ws || ws.readyState !== 1) return;
  sendRaw({ t: "hb" });
  if (Date.now() - lastRx > SILENT_RECONNECT_MS) {
    // Half-open socket (Wi-Fi blip): drop it and dial again.
    try {
      ws.close();
    } catch {}
  }
}, HEARTBEAT_MS);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    release();
    if (drawOpen) saveDraft();
  } else if (!replaced && me.name && (!ws || ws.readyState > 1)) {
    retryMs = 400;
    connect();
  }
});
window.addEventListener("online", () => {
  if (!replaced && me.name) connect();
});
window.addEventListener("pagehide", () => {
  release();
  if (drawOpen) saveDraft();
});

function onMessage(msg) {
  switch (msg.t) {
    case "soundCue":
      phoneSounds.cue(msg, me.id);
      break;
    case "host":
      hostUp = !!msg.up;
      renderStatus();
      break;
    case "status":
      phoneSounds.status(msg);
      lastStatus = { ...msg, at: Date.now() };
      if (msg.color) applyColor(msg.color);
      if (msg.name && msg.name !== me.name && !me.name) me.name = msg.name;
      renderStatus();
      break;
    case "lobby":
      // Lobby v2: the shared lobby state (roles, scoreboard, the picker's browsing, the look seed)
      lobbyState = msg.s && typeof msg.s === "object" ? msg.s : null;
      phoneSounds.lobby(lobbyState, me.id);
      globalThis.FOXBOX_LOBBY_STATE = lobbyState;
      try {
        window.dispatchEvent(new CustomEvent("foxbox:lobby", { detail: lobbyState }));
      } catch {}
      renderStatus();
      break;
    case "replaced":
      replaced = true;
      break;
  }
}

// ── Lobby v2 ────────────────────────────────────────────────────────────────────
// The TV sends {t:"lobby", s} with everyone's roles; a phone UI (lobby2) talks back through
// window.foxboxLobby. The host checks the roles: only the GAME PICKER may browse / pick / start,
// only the THEME ROLLER may roll; anyone may skip either turn.
var lobbyState = null; // var: renderStatus may run before this line during start-up
let browseTimer = null;
let browsePending = null;
let browseSentAt = 0;
window.foxboxLobby = {
  get state() {
    return lobbyState;
  },
  get myId() {
    return me.id;
  },
  /** The picker's position in the game cards (mirrored on the TV), throttled to ~10/s. */
  browse(gameId, view = "cards", flipped = false) {
    browsePending = { t: "browse", gameId, view, flipped: !!flipped };
    const wait = Math.max(0, 100 - (Date.now() - browseSentAt));
    if (browseTimer) return;
    browseTimer = setTimeout(() => {
      browseTimer = null;
      browseSentAt = Date.now();
      sendRaw(browsePending);
    }, wait);
  },
  pickGame: (gameId) => sendRaw({ t: "pickGame", gameId }),
  roll: () => sendRaw({ t: "roll" }),
  skipTurn: (role) => sendRaw({ t: "skipTurn", role: role === "roller" ? "roller" : "picker" }),
  start: () => sendRaw({ t: "start" }),
};
const iAmPicker = () => !!lobbyState && lobbyState.pickerId === me.id;
const iAmRoller = () => !!lobbyState && lobbyState.rollerId === me.id;
function lobbyLine() {
  if (!lobbyState) return "";
  const nm = (id) => (lobbyState.players.find((q) => q.id === id) || {}).name || "someone";
  const mine = lobbyState.players.find((q) => q.id === me.id);
  const bits = [];
  if (iAmPicker()) bits.push("🎮 You pick the game");
  else if (lobbyState.pickerId) bits.push(`🎮 ${nm(lobbyState.pickerId)} picks`);
  if (iAmRoller()) bits.push("🎲 You roll the look");
  if (mine && mine.points) bits.push(`${mine.points} pts${lobbyState.leaderId === me.id ? " 👑" : ""}`);
  return bits.join(" · ");
}

function applyColor(c) {
  const r = document.documentElement.style;
  r.setProperty("--c", c.base);
  r.setProperty("--l", c.light);
  r.setProperty("--d", c.dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", c.dark);
}

// ── Status text ─────────────────────────────────────────────────────────────────
function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// The hub's current game (from the TV's status): sets the action button's name and whether
// the stick is left/right only ("x") or a full 2D stick ("xy").
let mode = { id: "sky", name: "Sky Scramble", button: "BONK", stick: "x", count: 1 };
function applyMode(g) {
  if (!g || (g.id === mode.id && g.button === mode.button && g.stick === mode.stick && g.count === mode.count && !!g.seats === !!mode.seats)) return;
  mode = { ...mode, ...g, seats: !!g.seats };
  $("bonk").textContent = mode.button;
  const rowing = mode.stick === "motion";
  steer.hidden = rowing;
  $("bonk-wrap").hidden = rowing;
  steer.classList.toggle("xy", mode.stick === "xy");
  $("steer-label").textContent = mode.stick === "xy" ? "drag to roll" : "slide to steer";
  setXY(0, 0);
  role = undefined; // re-pick the controller below
  applyRole();
}

// ── Seats (Row Row Rumble v2): pick a boat + seat; the seat decides the controller ──────────
let role = undefined; // "paddle" | "captain" | null (no seat yet) — undefined = not decided
function mySeat() {
  return mode.seats && lastStatus && lastStatus.seat ? lastStatus.seat : null;
}
function applyRole() {
  const rowing = mode.stick === "motion";
  const seat = mySeat();
  const want = !mode.seats ? (rowing ? "paddle" : null) : seat ? seat.seat : null;
  if (want !== role) {
    role = want;
    cap.show(role === "captain");
    row.show(rowing && role === "paddle");
    x = y = s = b = c = 0;
    flush();
  }
  $("pad-screen").classList.toggle("captain", role === "captain");
  if (role !== "captain") $("pad-screen").classList.remove("picking");
  if (seat) {
    if (seat.color) applyColor(seat.color);
    const label = `${SEAT_LABEL[seat.seat] || "CREW"} · ${seat.boatName} boat`;
    cap.setRole(label);
  }
}

// Seat ids stay "paddle" / "captain" (the game contract); the names people see: the rower is the
// CAPTAIN, the one who steers and fires is the FIRST MATE.
const SEAT_LABEL = { paddle: "CAPTAIN", captain: "FIRST MATE" };
const BOAT_LABEL = ["Red", "Blue", "Green", "Yellow"];
function renderBoats() {
  const st = lastStatus && lastStatus.state;
  const box = $("boats");
  const show = !!(mode.seats && lastStatus && lastStatus.boats && (st === "lobby" || st === "results") && ws && ws.readyState === 1 && hostUp);
  box.hidden = !show;
  $("pad-screen").classList.toggle("seated-play", !!mode.seats && !show);
  if (!show) return;
  const seat = mySeat();
  $("boats-head").textContent = seat ? "Your seat · tap another to switch" : "Pick your boat";
  const cols = lastStatus.boatColors || [];
  let html = "";
  lastStatus.boats.forEach((bt, i) => {
    html += `<div class="boat" style="--bc:${cols[i] || "#888"}"><div class="boat-name">${BOAT_LABEL[i]} boat</div>`;
    for (const k of ["paddle", "captain"]) {
      const who = bt[k];
      const cls = who ? (who.me ? " mine" : " taken") : "";
      const name = who ? (who.me ? "You" : who.name) : "free";
      html += `<button type="button" class="seat${cls}" data-boat="${i}" data-seat="${k}" data-test="seat-${i}-${k}"${who && !who.me ? " disabled" : ""}><b>${SEAT_LABEL[k]}</b>${escHtml(name)}</button>`;
    }
    html += `</div>`;
  });
  const grid = $("boats-grid");
  if (grid.dataset.html !== html) {
    grid.innerHTML = html;
    grid.dataset.html = html;
  }
}
const escHtml = (t) => String(t).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
$("boats-grid").addEventListener("click", (e) => {
  const btn = e.target.closest(".seat");
  if (!btn || btn.disabled) return;
  const boat = Number(btn.dataset.boat), seat = btn.dataset.seat;
  const mine = mySeat();
  if (mine && mine.boat === boat && mine.seat === seat) sendRaw({ t: "seat", boat: null });
  else sendRaw({ t: "seat", boat, seat });
  $("pad-screen").classList.remove("picking"); // the captain's overlay closes once a seat is tapped
});
$("cap-seat").addEventListener("click", () => $("pad-screen").classList.toggle("picking"));

function renderStatus() {
  if (lastStatus && lastStatus.game) applyMode(lastStatus.game);
  applyRole();
  renderBoats();
  if (lastStatus && lastStatus.hub) document.title = `${lastStatus.hub} — Controller`;
  // Between rounds you can switch character (it applies from the next round).
  const st0 = lastStatus && lastStatus.state;
  const between = !!(ws && ws.readyState === 1 && hostUp && !replaced && ["lobby", "results", "waiting", "out"].includes(st0));
  $("change-char").hidden = !between || mode.id !== "sky"; // characters are a Sky Scramble thing (for now)
  $("change-char").textContent = me.character ? "Change character" : "Set up your character";
  $("switch-game").hidden = !(between && st0 === "lobby" && mode.count > 1 && (!lobbyState || iAmPicker()));
  const seatNow = mySeat();
  $("game-name").textContent = seatNow ? `${mode.name} · ${SEAT_LABEL[seatNow.seat] || "CREW"} · ${seatNow.boatName} boat` : mode.name;
  const big = $("status-big");
  const small = $("status-small");
  $("me-name").textContent = me.name;
  let b = "";
  let s = "";
  if (replaced) {
    b = "Paused";
    s = "This controller is open somewhere else.";
    big.textContent = b;
    small.innerHTML = "";
    small.append(s, document.createElement("br"));
    const btn = document.createElement("button");
    btn.textContent = "Use this one";
    btn.onclick = () => connect();
    small.append(btn);
    return;
  }
  if (!ws || ws.readyState !== 1) {
    b = "Connecting…";
    s = isP2P ? "Finding the room…" : "Make sure you're on the home Wi-Fi";
  } else if (!hostUp) {
    b = isP2P ? "The host left" : "Waiting for the TV…";
    s = isP2P ? "Waiting for them to come back…" : "The game isn't open on the TV yet";
  } else if (!lastStatus) {
    b = "Joining…";
  } else {
    const st = lastStatus;
    switch (st.state) {
      case "lobby": {
        b = "You're in!";
        const left = st.autoIn != null ? Math.max(0, st.autoIn - Math.floor((Date.now() - st.at) / 1000)) : null;
        s = (mode.seats && !mySeat() ? "Pick a seat in a boat below" : role === "captain" ? "Press FIRE to start" : mode.stick === "motion" ? "Paddle to start" : `Press ${mode.button} to start`) + (st.hold === "drawing" ? " · someone's still drawing" : left != null ? ` · auto-start in ${left}s` : "");
        const ll = lobbyLine();
        if (ll) s += ` · ${ll}`;
        break;
      }
      case "countdown":
        b = "Get ready!";
        s = "Look at the TV 👀";
        break;
      case "playing":
        b = "GO GO GO!";
        s = role === "captain"
          ? "Tilt to steer · aim and FIRE at the other boats"
          : mode.stick === "motion"
          ? "Paddle! A steady beat is fastest"
          : mode.stick === "xy" ? "Drag to roll · SHOVE to bump" : "Steer ◀ ▶ · BONK = dive on heads";
        break;
      case "out":
        b = "Oops, you're out!";
        s = "Cheer on the others — next round soon";
        break;
      case "waiting":
        b = "Next round!";
        s = "A round is on — you'll join the next one";
        break;
      case "results":
        if (st.place === 1) {
          b = "🏆 You won! 🏆";
          s = `1st of ${st.total} — amazing!`;
        } else {
          b = `You came ${ordinal(st.place)}`;
          s = `of ${st.total} · ${st.winner} won`;
        }
        break;
      case "full":
        b = "Game is full";
        s = "8 players max — wait for a free spot";
        break;
      default:
        b = "…";
    }
  }
  if (big.textContent !== b) big.textContent = b;
  if (small.textContent !== s) small.textContent = s;
  // the captain's sideways screen hides #status: mirror it in the middle column
  const capLine = b === "You're in!" ? s : s ? `${b} · ${s}` : b;
  if ($("cap-status").textContent !== capLine) $("cap-status").textContent = capLine;
  $("cap-seat").hidden = !(mode.seats && lastStatus && lastStatus.state === "lobby");
  syncExtras();
}

// ── Sideways controllers + the web version's lobby screens ──────────────────────
// During a round the controller is full screen and landscape (landscape.js). The web version
// (globalThis.FOXBOX_LOBBY2 = the lobby2 bundle's URL) also covers the lobby phase with the
// FoxBox lobby screens and gives the controllers the rolled look (lobby2-pad.js).
let lobby2Pad = null;
function syncExtras() {
  const st = lastStatus && lastStatus.state;
  const connected = !!(ws && ws.readyState === 1 && hostUp && !replaced);
  const playing = connected && curScreen === "pad-screen" && (st === "countdown" || st === "playing");
  if (typeof land !== "undefined") land.set(playing && globalThis.FOXBOX_LANDSCAPE === true); // on with the next release
  if (lobby2Pad) {
    try {
      lobby2Pad.sync({ screen: curScreen, state: st, connected, gameId: mode.id, seats: !!mode.seats, role: role || null, lobby: lobbyState });
    } catch (e) {
      console.warn("[foxbox] lobby2 sync failed", e);
    }
  }
}
// Lobby auto-start countdown ticks locally between status pushes.
setInterval(() => {
  if (lastStatus && lastStatus.state === "lobby") renderStatus();
}, 500);

// ── Controls ────────────────────────────────────────────────────────────────────
let x = 0;
let y = 0; // only used by 2D-stick games (down = +1)
let b = 0;
let c = 0; // the second button (b1): Row Row Rumble's right paddle
let s = 0; // a captain's tilt steering (-1 left … 1 right)
let sent = { x: null, y: null, b: null, c: null, s: null };

function flush() {
  if (sent.x === x && sent.y === y && sent.b === b && sent.c === c && sent.s === s) return;
  if (sendRaw({ t: "in", x, y, b, c, s })) {
    phoneSounds.input({ b, c }, sent, mode.id, role);
    sent = { x, y, b, c, s };
    window.__foxboxLastInputAt = Date.now();
  }
}

const steer = $("steer");
const land = createLandscape($("pad-screen"));
const knob = $("knob");
const halfL = steer.querySelector(".half.l");
const halfR = steer.querySelector(".half.r");
let steerPointer = null;

const q20 = (v) => {
  v = Math.round(v * 20) / 20; // 0.05 steps: smooth enough, far fewer messages
  return Object.is(v, -0) ? 0 : v;
};
function setXY(vx, vy) {
  vx = Math.max(-1, Math.min(1, vx));
  vy = mode.stick === "xy" ? Math.max(-1, Math.min(1, vy)) : 0;
  const m = Math.hypot(vx, vy);
  if (m < DEADZONE) vx = vy = 0;
  else if (m > 1) { vx /= m; vy /= m; }
  vx = q20(vx);
  vy = q20(vy);
  const trackW = $("track").clientWidth;
  const rangeY = mode.stick === "xy" ? steer.clientHeight * 0.32 : 0;
  knob.style.transform = `translate(${(vx * trackW) / 2}px, ${vy * rangeY}px)`;
  halfL.classList.toggle("on", vx < 0);
  halfR.classList.toggle("on", vx > 0);
  if (vx !== x || vy !== y) {
    x = vx;
    y = vy;
    flush();
  }
}
const setX = (v) => setXY(v, 0);

function steerFrom(ev) {
  // in the stick's own frame, so it still works when the controller is turned sideways with CSS
  const { dx, dy, halfW: half, halfH } = land.local(ev, steer);
  if (mode.stick === "xy") {
    // a 2D stick: direction from the middle of the pad, full tilt at ~65 % of the way out
    const k = Math.min(half, halfH) * FULL_AT;
    setXY(dx / k, dy / k);
  } else setX(dx / (half * FULL_AT));
}

steer.addEventListener("pointerdown", (ev) => {
  ev.preventDefault();
  steerPointer = ev.pointerId;
  try {
    steer.setPointerCapture(ev.pointerId);
  } catch {}
  steer.classList.add("active");
  steerFrom(ev);
});
steer.addEventListener("pointermove", (ev) => {
  if (ev.pointerId !== steerPointer) return;
  ev.preventDefault();
  steerFrom(ev);
});
const steerEnd = (ev) => {
  if (ev.pointerId !== steerPointer) return;
  steerPointer = null;
  steer.classList.remove("active");
  setX(0);
};
steer.addEventListener("pointerup", steerEnd);
steer.addEventListener("pointercancel", steerEnd);
steer.addEventListener("lostpointercapture", steerEnd);

const bonk = $("bonk");
let bonkPointer = null;
function setB(v) {
  if (v === b) return;
  b = v;
  bonk.classList.toggle("down", !!v);
  flush();
  if (v && navigator.vibrate) {
    try {
      navigator.vibrate(25);
    } catch {}
  }
}
bonk.addEventListener("pointerdown", (ev) => {
  ev.preventDefault();
  bonkPointer = ev.pointerId;
  try {
    bonk.setPointerCapture(ev.pointerId);
  } catch {}
  setB(1);
});
const bonkEnd = (ev) => {
  if (ev.pointerId !== bonkPointer) return;
  bonkPointer = null;
  setB(0);
};
bonk.addEventListener("pointerup", bonkEnd);
bonk.addEventListener("pointercancel", bonkEnd);
bonk.addEventListener("lostpointercapture", bonkEnd);

// Row Row Rumble: the phone (or two paddle buttons) drives b and c directly.
const row = createRowPad(
  {
    root: $("row"), motion: $("row-motion"), buttons: $("row-buttons"), boat: $("row-boat"),
    count: $("row-count"), countWrap: $("row-count-wrap"), hint: $("row-hint"), meter: $("row-meter"),
    sens: $("row-sens"), enable: $("row-enable"), ready: $("row-ready"), note: $("row-note"),
    useButtons: $("row-use-buttons"), useMotion: $("row-use-motion"), oar: $("oar"),
  },
  {
    onInput(v) {
      if (role === "captain" || (mode.seats && role !== "paddle")) return; // its motion listener keeps running: only a paddler paddles
      x = v.x;
      b = v.b;
      c = v.c;
      flush();
      if (lastStatus && lastStatus.state === "lobby" && (v.b || v.c)) renderStatus();
    },
    state: () => lastStatus && lastStatus.state,
  },
);

// Row Row Rumble v2 captain: tilt steers (s), the stick aims (x, y), FIRE is b.
const cap = createCapPad(
  {
    root: $("cap"), steerFill: $("cap-steer-fill"), steerL: $("cap-left"), steerR: $("cap-right"), steerHint: $("cap-steer-hint"),
    aim: $("cap-aim"), aimKnob: $("cap-aim-knob"), aimArrow: $("cap-aim-arrow"), fire: $("cap-fire"), ring: $("cap-ring"),
    fireLabel: $("cap-fire-label"), role: $("cap-role"), enable: $("cap-enable"), useButtons: $("cap-use-buttons"), note: $("cap-note"),
  },
  {
    onInput(v) {
      if (role !== "captain") return;
      x = v.x;
      y = v.y;
      s = v.s;
      b = v.b;
      c = 0;
      flush();
    },
  },
);

function release() {
  steerPointer = null;
  bonkPointer = null;
  steer.classList.remove("active");
  if (role === "captain") cap.release();
  else if (mode.stick === "motion") row.release();
  else {
    setX(0);
    setB(0);
  }
}
window.addEventListener("blur", release);

// ── No zoom / scroll / selection / callouts on the controller ───────────────────
const padScreen = $("pad-screen");
for (const type of ["touchstart", "touchmove", "touchend"]) {
  padScreen.addEventListener(
    type,
    (e) => {
      if (e.target.closest("button#edit-name, #status button, #row-enable, #row-ready, .row-link, #boats .seat, #cap-enable")) return; // let real buttons click (incl. Switch game)
      e.preventDefault();
    },
    { passive: false },
  );
}
document.addEventListener("touchmove", (e) => {
  if (!e.target.closest("input, #char-grid, #crop-stage, #fbx2-pad")) e.preventDefault();
}, { passive: false });
for (const type of ["gesturestart", "gesturechange", "gestureend", "dblclick", "contextmenu", "selectstart"]) {
  document.addEventListener(type, (e) => {
    if (!e.target.closest || !e.target.closest("input")) e.preventDefault();
  });
}
window.addEventListener("resize", () => {
  setXY(x, y);
  draw.layout();
});

// ── Start ───────────────────────────────────────────────────────────────────────
await netReady; // the web version first asks for (and checks) the room code — and your name
if (globalThis.FOXBOX_LOBBY2) {
  // the controllers wear the rolled look too (self-installing; optional)
  import("./controller-look.js").catch((e) => console.warn("[foxbox] controller look didn't load", e));
  import("./lobby2-pad.js")
    .then((m) =>
      m.initLobby2Pad({
        url: globalThis.FOXBOX_LOBBY2,
        myId: () => me.id,
        editName: () => $("edit-name").click(),
        changeCharacter: () => showPicker(),
        lobby: window.foxboxLobby,
      }),
    )
    .then((h) => {
      lobby2Pad = h;
      syncExtras();
    })
    .catch((e) => console.warn("[foxbox] lobby2 screens didn't load — using the plain ones", e));
}
if (!me.name && globalThis.FOXBOX_NAME) {
  me.name = String(globalThis.FOXBOX_NAME).replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, 12);
  saveMe();
}
if (me.name) {
  $("me-name").textContent = me.name;
  showScreen("pad-screen");
  // reloaded (or the phone dropped the page) mid-drawing: straight back to it
  const draft = loadDraft();
  if (draft && draft.open) {
    drawOpen = true; // the first join already says "drawing"
    openDraw();
  }
  connect();
} else {
  showScreen("name-screen");
}
renderStatus();
// Show the remembered pick's thumbnail; forget it if that drawing was removed.
fetchCharacters().then((list) => {
  if (list && me.character && !list.has(me.character)) {
    me.character = null;
    saveMe();
    if (ws && ws.readyState === 1) sendJoin();
  }
  renderMeBall();
});
