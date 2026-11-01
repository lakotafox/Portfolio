/**
 * pad.js — Sky Scramble phone controller (party mode).
 *
 * Connects to tools/party-server.ts at /ws?role=pad, joins with a persistent client id
 * (localStorage) + nickname, and sends {t:"in", x, b} the moment the stick or BONK
 * changes (x −1..1 in 0.05 steps, b 0|1), plus a {t:"hb"} heartbeat every 2 s.
 * The TV host answers with {t:"status", state, color, …} which drives the screen.
 *
 * Character: the picker (from "Change character" between rounds, the lobby's Character button, and
 * by itself in Sky Scramble's setup) — the default puffball plus every drawn character from
 * /api/characters. The pick is remembered in localStorage and sent with join as `character` (id or null).
 *
 * Sky Scramble's setup (status.skySetup: the TV has Sky picked): the phone goes straight to the
 * picker, then to a READY screen (the character big, READY, CHANGE CHARACTER) and tells the TV with
 * {t:"skyReady", setupId, picked, ready}; the TV starts the countdown once everyone is ready.
 * "Take a selfie" opens the camera (<input type=file capture=user> — works over plain http,
 * unlike getUserMedia), shows a circle cropper (drag to move, pinch / slider to zoom), and
 * uploads a 512×512 PNG of the square around the circle to POST /api/selfie. The server lists
 * it as the ball character "selfie-<client id>", which this phone then picks.
 *
 * Drawings (draw.js, a full-screen canvas; Done uploads the drawing with a white sticker edge,
 * cropped, plus its hitbox, to POST /api/drawing, and this phone then picks it):
 *   NEW DRAWING — always a blank canvas; the TV saves it as a NEW character of this player's (the
 *                 TV picks the id and lists this player as its `owner`).
 *   EDIT        — only on this player's own drawings (owner = me): that drawing, to change it; the
 *                 upload names it (X-Drawing-Id) and the TV replaces it — and refuses anyone else's.
 *   CLEAR       — on the canvas, to start over.
 * Lakota (Oct 31): with one drawing per phone and DRAW reopening the phone's last canvas, people drew
 * over each other's drawings. The canvas is kept in localStorage (DRAW_KEY, with who it belongs to and
 * which drawing it is) after every stroke, so a reload / phone lock mid-drawing loses nothing
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
import { createLandscape, createTurnHint, turnedDelta } from "./landscape.js";
import { crownedPuff, cryingPuff, sprite } from "./pixel-art.js";
import { createPhoneSounds } from "./phone-sounds.js";
import { createRowTrainPad, S as ROW_TRAIN } from "./row-train-pad.js"; // ROWTRAIN: Row Row Rumble's TRAINING overlay

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
// ROWTRAIN: Row Row Rumble's TRAINING overlay (row-train-pad.js); renderStatus feeds it the state + seat
const rowTrain = createRowTrainPad({ screen: $("pad-screen"), onChange: () => renderStatus() });

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
  for (const s of ["name-screen", "char-screen", "crop-screen", "draw-screen", "ready-screen", "vote-screen", "pad-screen"]) $(s)?.classList.toggle("show", s === id);
  if (typeof syncExtras === "function") syncExtras();
}

// The pixel icons in the markup: <i class="ico" data-sprite="pencil" data-scale="2" data-color="#…">
for (const el of document.querySelectorAll(".ico[data-sprite]")) {
  el.innerHTML = sprite(el.dataset.sprite, Number(el.dataset.scale) || 2, { color: el.dataset.color || "#0a1428" });
}
/** A pixel sprite as an element (for the picker tiles / the READY screen). */
function spriteEl(name, scale, color) {
  const t = document.createElement("template");
  t.innerHTML = sprite(name, scale, { color });
  return t.content.firstElementChild;
}
/** This phone's colour on the TV (the puffball's colour), grey until the TV gives one. */
const myColor = () => (lastStatus && lastStatus.color && lastStatus.color.base) || "#8a94a6";

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

/** A picker tile: the picture on a little pixel sky, the name under it; your current pick is gold. */
function cardEl(id, name, pic) {
  const b = document.createElement("button");
  b.type = "button";
  const sel = (me.character || null) === id;
  b.className = "char-card" + (sel ? " sel" : "");
  b.dataset.test = "char-tile";
  b.dataset.char = id || "";
  const box = document.createElement("span");
  box.className = "pic";
  box.append(pic);
  const nm = document.createElement("span");
  nm.className = "nm";
  nm.textContent = name;
  b.append(box, nm);
  if (sel) {
    const mark = document.createElement("span");
    mark.className = "selmark";
    mark.append(spriteEl("check", 2, "#0a1428"));
    b.append(mark);
  }
  b.addEventListener("click", () => chooseCharacter(id));
  return b;
}
/** My own drawing's tile with an EDIT key under it (only mine: the TV refuses anyone else's edit anyway). */
function editSlot(card, id) {
  const slot = document.createElement("div");
  slot.className = "char-slot";
  const ed = document.createElement("button");
  ed.type = "button";
  ed.className = "pxbtn pxbtn-paper pxbtn-sm char-edit";
  ed.dataset.test = "char-edit";
  ed.dataset.char = id;
  ed.setAttribute("aria-label", "Edit my drawing");
  const ico = document.createElement("i");
  ico.className = "ico";
  ico.innerHTML = sprite("pencil", 2);
  const label = document.createElement("span");
  label.textContent = "EDIT";
  ed.append(ico, label);
  ed.addEventListener("click", () => openDraw(id));
  slot.append(card, ed);
  return slot;
}

/** This player's id as the TV keeps it (X-Client-Id → the picture's owner). */
const myOwnerId = () => me.id.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32);
const mySelfieId = () => "selfie-" + myOwnerId();
/** One of MY drawings: the TV lists who made each one (owner); an older TV only had one per phone, "drawn-<my id>". */
const isMyDrawing = (c) => !!c && (typeof c.owner === "string" ? !!c.owner && c.owner === myOwnerId() : c.id === "drawn-" + myOwnerId());
/** What a character is called on the tiles and the READY screen. */
const charLabel = (c) => (!c ? "Puffball" : isMyDrawing(c) ? "My drawing" : c.id === mySelfieId() ? "My selfie" : c.name || "Drawing");

// SELFIE is a <label> for the camera file input (the most reliable way to open it on iOS); NEW DRAWING opens
// draw.js on a blank canvas (EDIT, on my own drawings' tiles, opens that drawing)
$("draw-tile").addEventListener("click", () => openDraw());

/** Where the picker's BACK goes: "pad" (the controller), "ready" (Sky's READY screen) or nowhere (hidden). */
let pickerBackTo = null;
function syncPickerBack() {
  // in Sky's setup there's only a way back once you've picked (CHANGE CHARACTER brought you here)
  pickerBackTo = skySetup() ? (sky.hadPick ? "ready" : null) : "pad";
  $("char-back").hidden = !pickerBackTo;
}
$("char-back").addEventListener("click", () => {
  if (pickerBackTo === "ready" && skySetup()) {
    // keep the character you had: back to READY
    sky.picked = true;
    sky.ready = false;
    sendSky();
    showReady();
  } else showScreen("pad-screen");
  renderStatus();
});

async function showPicker() {
  release();
  sky.auto = !!skySetup(); // opened by Sky's setup: it closes with it
  showScreen("char-screen");
  syncPickerBack();
  const grid = $("char-grid");
  const fill = () => {
    grid.innerHTML = "";
    grid.append(cardEl(null, charLabel(null), spriteEl("puff", 6, myColor())));
    // my own drawings (newest first) and selfie first, then everything else
    const list = charList ? [...charList.values()] : [];
    const mine = (c) => (isMyDrawing(c) ? 2 : c.id === mySelfieId() ? 1 : 0);
    const at = new Map(list.map((c, i) => [c, i]));
    list.sort((a, b) => mine(b) - mine(a) || (mine(a) === 2 ? at.get(b) - at.get(a) : at.get(a) - at.get(b)));
    for (const c of list) {
      let pic;
      if (c.hitbox && c.hitbox.ball) {
        pic = document.createElement("span");
        pic.className = "ballpic photo";
        circleCrop(pic, c);
      } else {
        pic = document.createElement("img");
        pic.src = c.src;
        pic.alt = "";
        pic.decoding = "async";
      }
      const card = cardEl(c.id, charLabel(c), pic);
      grid.append(isMyDrawing(c) ? editSlot(card, c.id) : card);
    }
  };
  fill();
  $("char-note").textContent = charList ? "" : "Loading drawings…";
  await fetchCharacters();
  if (!$("char-screen").classList.contains("show")) return;
  $("char-note").textContent = charList ? "" : "Couldn't load the drawings — the puffball it is!";
  fill();
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
    const d = turnedDelta(stage, cur.x - prev.x, cur.y - prev.y); // (the cropper may be turned sideways: landscape.js)
    crop.ox += d.dx;
    crop.oy += d.dy;
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
let drawEdit = null; // EDIT: the id of my drawing on the canvas (DONE replaces it); null = a NEW drawing (DONE adds one)

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
  st.who = me.id; // whose canvas this is (two players in two tabs of one browser share this storage)
  st.edit = drawEdit; // and which drawing (null = a new one)
  if (st.png && st.png.length > DRAW_MAX_CHARS) {
    const old = loadDraft();
    // too big to keep: hold on to the last one that fit (of this same drawing)
    st.png = old && old.png && old.who === st.who && old.edit === st.edit ? old.png : null;
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

/**
 * The drawing screen. openDraw() = NEW DRAWING: always a blank canvas (only the pen, colour and size carry
 * over), saved as a new character. openDraw(id) = EDIT one of MY drawings: its canvas as I left it when this
 * browser has it, else the uploaded picture to work on. resume = the page came back mid-drawing (reload /
 * phone lock): the canvas as it was, NEW or EDIT as it was — but only my own (not another tab's player's).
 */
async function openDraw(editId = null, resume = false) {
  const draft = loadDraft() || {};
  const myDraft = draft.who === me.id;
  let state = { tool: draft.tool, color: draft.color, size: draft.size, paper: draft.paper };
  let src = "";
  if (resume) {
    if (myDraft || draft.who === undefined) state = draft; // (undefined: kept by an older page — this browser's)
    drawEdit = myDraft && typeof draft.edit === "string" && draft.edit ? draft.edit : null;
  } else if (editId) {
    const c = charList && charList.get(editId);
    if (!isMyDrawing(c)) return; // EDIT is only on my own drawings
    drawEdit = editId;
    if (myDraft && draft.edit === editId && typeof draft.png === "string") state = draft;
    else src = c.src; // made in another tab / browser, or this canvas holds another drawing now
  } else drawEdit = null;
  release();
  showScreen("draw-screen");
  setDrawing(true);
  $("draw-title").innerHTML = drawEdit ? "EDIT YOUR<br />DOODLE" : "DRAW YOUR<br />DOODLE";
  const fallback = !src
    ? null
    : await new Promise((res) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = () => res(null);
        im.src = src;
      });
  await draw.open(state, fallback);
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
    // EDIT names the drawing it replaces (the TV checks it's mine); NEW leaves it out and the TV makes a new one
    const send = (editId) =>
      api("/api/drawing", {
        method: "POST",
        headers: {
          "Content-Type": "image/png",
          "X-Client-Id": me.id,
          "X-Name": encodeURIComponent(me.name || ""),
          "X-Hitbox": JSON.stringify(baked.hitbox),
          ...(editId ? { "X-Drawing-Id": editId } : {}),
        },
        body: blob,
      });
    let res = await send(drawEdit);
    let data = await res.json().catch(() => null);
    if (drawEdit && res.status === 404) {
      // the drawing I was changing isn't on this TV (another party): keep this one as a new drawing
      res = await send(null);
      data = await res.json().catch(() => null);
    }
    if (!res.ok || !data || !data.ok || !data.character) throw new Error((data && data.error) || `error ${res.status}`);
    if (!charList) charList = new Map();
    charList.set(data.character.id, data.character);
    drawEdit = data.character.id; // this canvas is that drawing now: EDIT on it picks up right here
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
  const inSky = !!skySetup();
  if (ws && ws.readyState === 1) sendJoin(); // the TV gets the character first…
  else connect();
  if (inSky) {
    // …then, in Sky's setup, that it's picked: on to READY
    sky.picked = true;
    sky.ready = false;
    sky.hadPick = true;
    sendSky();
    showReady();
  } else showScreen("pad-screen");
  renderStatus();
}

// ── Sky Scramble setup: pick a character → READY ───────────────────────────────
// While the TV is in Sky's setup (status.skySetup) this phone is on its character picker (or the
// selfie / drawing screens it opens) or its READY screen — never the controller. `sky` is what this
// phone told the TV for that setup; the TV's word wins for a new setup (or after a reload here).
const sky = { id: null, picked: false, ready: false, hadPick: false, sentAt: 0, auto: false };
/** The TV's skySetup for this phone while Sky's setup is on (and we can hear the TV), else null. */
function skySetup() {
  const ss = lastStatus && lastStatus.state === "lobby" ? lastStatus.skySetup : null;
  return ss && ws && ws.readyState === 1 && hostUp && !replaced ? ss : null;
}
function sendSky() {
  if (!sky.id) return;
  sky.sentAt = Date.now();
  sendRaw({ t: "skyReady", setupId: sky.id, picked: sky.picked, ready: sky.ready });
}

// ── Sky Scramble: the doodle vote (Lakota, Nov 1) ───────────────────────────────────────────────────────
// The TV runs it (host.js skyVote*): everyone's ready and 2+ people play their own drawing → this screen (sideways like
// Sky's others): the doodles big, tap your favourite (never your own); a tie: a drumroll; the winner picks a free
// starting item (Sky's jetpack items) and starts the round flying it; everyone sees who won and what they picked.
// lastStatus.skyVote = { id, step: vote | tie | pick | won, cands: [{ id, char, name, mine, n? }], my, voted, voters, left,
// tied, winner, winnerName, item, items }. Sends {t:"game", m:{type:"vote", vote, for}} / {type:"vitem", vote, item}.
const VOTE_STEPS = ["vote", "tie", "pick", "won"];
const VOTE_ITEM_LABEL = { tanks: "TANKS", hat: "HAT", balloons: "BALLOONS" };
const VOTE_CSS = `
#vote-screen.show { display: grid; grid-template-rows: auto minmax(0, 1fr) auto; gap: 10px; }
#vote-screen .vs-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 4px 4px 0; min-width: 0; }
#vote-screen .vs-title { margin: 0; text-align: left; font-size: 13px; line-height: 1.4; min-width: 0; }
#vote-screen .vs-time { flex: none; font-size: 13px; min-width: 34px; text-align: center; }
#vote-screen .vs-time:empty { visibility: hidden; }
#vote-screen .vs-gal { display: flex; align-items: stretch; justify-content: center; gap: 16px; min-height: 0; overflow-x: auto; overflow-y: hidden;
  padding: 6px 8px 12px; touch-action: pan-x; overscroll-behavior: contain; }
#vote-screen .vs-gal[hidden], #vote-screen .vs-items[hidden] { display: none; }
#vote-screen .vs-card { position: relative; flex: none; height: 100%; aspect-ratio: 3 / 4; max-width: 46%; box-sizing: border-box; display: flex;
  flex-direction: column; align-items: stretch; gap: 6px; margin: 0; padding: 8px 8px 9px; border: 0; border-radius: 0; background: #1b1d3a;
  color: #fff9f1; font: inherit; box-shadow: 0 0 0 3px #fff9f1, 0 5px 0 3px #04050e; cursor: pointer; touch-action: manipulation; }
#vote-screen .vs-pic { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; background-color: #fff;
  background-image: linear-gradient(45deg, #e8edf4 25%, transparent 25%, transparent 75%, #e8edf4 75%), linear-gradient(45deg, #e8edf4 25%, transparent 25%, transparent 75%, #e8edf4 75%);
  background-size: 14px 14px; background-position: 0 0, 7px 7px; overflow: hidden; }
#vote-screen .vs-pic img { max-width: 92%; max-height: 92%; }
#vote-screen .vs-name { font-family: var(--px-soft); font-size: 16px; line-height: 1.1; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#vote-screen .vs-tag { position: absolute; top: 6px; left: 6px; font-family: var(--px-font); font-size: 8px; line-height: 1; padding: 4px 5px;
  color: #0a1428; background: #c9d2e6; box-shadow: 0 0 0 2px #0a1428; }
#vote-screen .vs-tag:empty { display: none; }
#vote-screen .vs-card.mine { opacity: 0.5; cursor: default; }
#vote-screen .vs-card.on { background: #2a2410; box-shadow: 0 0 0 4px #ffd23f, 0 5px 0 4px #04050e; }
#vote-screen .vs-card.on .vs-tag, #vote-screen .vs-card.win .vs-tag { background: #ffd23f; }
#vote-screen .vs-card:not(.mine):active { transform: translateY(3px); }
#vote-screen .vs-card.win { background: #2a2410; box-shadow: 0 0 0 4px #ffd23f, 0 5px 0 4px #04050e; }
#vote-screen .vs-card.out { opacity: 0.4; }
#vote-screen .vs-card.drum { animation: vs-drum calc(var(--n, 2) * 0.22s) steps(1, end) infinite; animation-delay: calc(var(--i, 0) * 0.22s); }
#vote-screen .vs-items { display: flex; align-items: stretch; justify-content: center; gap: 16px; min-height: 0; padding: 6px 8px 12px; }
#vote-screen .vs-item { flex: 1; max-width: 190px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
  margin: 0; border: 0; border-radius: 0; color: #0a1428; background: var(--px-gold, #ffd23f); font: 12px/1.2 var(--px-font);
  box-shadow: 0 0 0 3px #0a1428, 0 6px 0 3px #04050e, inset 0 -5px 0 #e3a51a, inset 0 4px 0 #fff3b0; cursor: pointer; touch-action: manipulation; }
#vote-screen .vs-item:active { transform: translateY(3px); }
#vote-screen .vs-item.on { background: #35d07f; box-shadow: 0 0 0 3px #0a1428, 0 6px 0 3px #04050e, inset 0 -5px 0 #1f9e5b, inset 0 4px 0 #b6f5d2; }
#vote-screen .vs-foot { font-family: var(--px-font); font-size: 9px; line-height: 1.6; color: #c9c8df; text-align: center; padding: 0 4px 2px; }
@keyframes vs-drum { 0% { background: #2a2410; box-shadow: 0 0 0 4px #ffd23f, 0 5px 0 4px #04050e; } 50% { background: #1b1d3a; box-shadow: 0 0 0 3px #fff9f1, 0 5px 0 3px #04050e; } }
@media (prefers-reduced-motion: reduce) { #vote-screen .vs-card.drum { animation: none; } }
`;
const voteScreen = (() => {
  const css = document.createElement("style");
  css.id = "vote-screen-css";
  css.textContent = VOTE_CSS;
  document.head.append(css);
  const sec = document.createElement("section");
  sec.id = "vote-screen";
  sec.className = "screen pxs";
  sec.dataset.test = "vote-screen";
  sec.innerHTML = `<div class="vs-head"><h2 class="px-title vs-title"></h2><span class="vs-time px-chip gold" data-test="vote-time"></span></div>
    <div class="vs-gal" data-test="vote-gallery"></div><div class="vs-items" data-test="vote-items" hidden></div><div class="vs-foot" data-test="vote-foot"></div>`;
  $("ready-screen").after(sec);
  const el = { title: sec.querySelector(".vs-title"), time: sec.querySelector(".vs-time"), gal: sec.querySelector(".vs-gal"), items: sec.querySelector(".vs-items"), foot: sec.querySelector(".vs-foot") };
  let mine = { vote: null, voteAt: 0, item: null, itemAt: 0 }; // what this phone just sent (shown at once; the TV confirms)
  const up = (t) => String(t || "").toUpperCase();
  const pic = (c, color) => {
    const ch = charList && charList.get(c.char);
    return ch && ch.src ? `<img src="${escHtml(ch.src)}" alt="">` : sprite("puff", 6, { color });
  };
  function render() {
    const sv = lastStatus && lastStatus.skyVote;
    if (!sv || !VOTE_STEPS.includes(sv.step)) return;
    const left = Math.max(0, Math.ceil(sv.left - (Date.now() - lastStatus.at) / 1000));
    const iWon = !!sv.winner && sv.winner === me.id;
    const myVote = sv.step === "vote" && mine.vote && Date.now() - mine.voteAt < 2500 ? mine.vote : sv.my;
    const title = sv.step === "vote" ? "VOTE FOR THE BEST DOODLE" : sv.step === "tie" ? "IT'S A TIE! DRUMROLL..."
      : sv.step === "pick" ? (iWon ? "YOUR DOODLE WON! PICK A FREE ITEM" : `${up(sv.winnerName)}'S DOODLE WON!`)
      : `${up(sv.winnerName)}'S DOODLE WINS · PICKS ${VOTE_ITEM_LABEL[sv.item] || ""}`;
    const time = (sv.step === "vote" || sv.step === "pick") && left > 0 ? String(left) : "";
    if (el.title.textContent !== title) el.title.textContent = title;
    if (el.time.textContent !== time) el.time.textContent = time;
    const showItems = sv.step === "pick" && iWon;
    el.items.hidden = !showItems;
    el.gal.hidden = showItems;
    if (showItems) {
      const picked = mine.item && Date.now() - mine.itemAt < 2500 ? mine.item : null;
      const html = (sv.items || []).map((it) => `<button type="button" class="vs-item${picked === it ? " on" : ""}" data-item="${escHtml(it)}" data-test="vote-item-${escHtml(it)}">${sprite(it, 5)}<span>${VOTE_ITEM_LABEL[it] || up(it)}</span></button>`).join("");
      if (el.items.dataset.html !== html) { el.items.innerHTML = html; el.items.dataset.html = html; }
    } else {
      const tied = sv.tied || [];
      const html = sv.cands.map((c) => {
        const i = tied.indexOf(c.id);
        const cls = sv.step === "vote" ? (c.mine ? "mine" : myVote === c.id ? "on" : "")
          : sv.step === "tie" ? (i >= 0 ? "drum" : "out") : c.id === sv.winner ? "win" : "out";
        const tag = sv.step === "vote" ? (c.mine ? "YOURS" : myVote === c.id ? "YOUR VOTE" : "")
          : sv.step !== "tie" && c.id === sv.winner ? "WINNER" : typeof c.n === "number" ? `${c.n} VOTE${c.n === 1 ? "" : "S"}` : "";
        const color = (lobbyState?.players || []).find((q) => q.id === c.id)?.color || "#8a94a6";
        const style = i >= 0 && sv.step === "tie" ? ` style="--i:${i};--n:${tied.length}"` : "";
        return `<button type="button" class="vs-card ${cls}" data-player="${escHtml(c.id)}" data-test="vote-card"${style}${c.mine ? " aria-disabled=\"true\"" : ""}><span class="vs-tag">${tag}</span><span class="vs-pic">${pic(c, color)}</span><span class="vs-name">${escHtml(c.name)}</span></button>`;
      }).join("");
      if (el.gal.dataset.html !== html) { el.gal.innerHTML = html; el.gal.dataset.html = html; }
    }
    const foot = sv.step === "vote" ? `${myVote ? "VOTED! TAP ANOTHER TO CHANGE IT" : "TAP YOUR FAVOURITE · NOT YOUR OWN"} · ${sv.voted}/${sv.voters} VOTED`
      : sv.step === "tie" ? "A RANDOM ONE OF THE TIED WINS"
      : sv.step === "pick" ? (iWon ? "YOU START THE ROUND FLYING IT" : `${up(sv.winnerName)} IS PICKING A FREE ITEM TO START WITH...`)
      : "GET READY!";
    if (el.foot.textContent !== foot) el.foot.textContent = foot;
  }
  el.gal.addEventListener("click", (e) => {
    const card = e.target.closest(".vs-card");
    const sv = lastStatus && lastStatus.skyVote;
    if (!card || !sv || sv.step !== "vote") return;
    const c = sv.cands.find((q) => q.id === card.dataset.player);
    if (!c || c.mine) return;
    mine = { ...mine, vote: c.id, voteAt: Date.now() };
    sendRaw({ t: "game", m: { type: "vote", vote: sv.id, for: c.id } });
    render();
  });
  el.items.addEventListener("click", (e) => {
    const b = e.target.closest(".vs-item");
    const sv = lastStatus && lastStatus.skyVote;
    if (!b || !sv || sv.step !== "pick" || sv.winner !== me.id) return;
    mine = { ...mine, item: b.dataset.item, itemAt: Date.now() };
    sendRaw({ t: "game", m: { type: "vitem", vote: sv.id, item: b.dataset.item } });
    render();
  });
  setInterval(() => { if (curScreen === "vote-screen") render(); }, 250); // the clock
  return { render };
})();
/** The doodle vote while it's on (the TV's skyVote for this phone), else null. */
function skyVote() {
  const sv = skySetup() && lastStatus.skyVote;
  return sv && VOTE_STEPS.includes(sv.step) ? sv : null;
}
function syncSky() {
  const away = replaced || !ws || ws.readyState !== 1 || !hostUp;
  // a dropped connection keeps the screen (we'll hear from the TV again; READY says so meanwhile);
  // "paused" (another tab took over) shows on the controller
  if (away && !replaced) {
    if (curScreen === "ready-screen") renderReady();
    return;
  }
  const ss = skySetup();
  if (!ss) {
    // the setup is over (the countdown, a round, back to the lobby): the controller again
    if (curScreen === "ready-screen" || curScreen === "vote-screen" || (curScreen === "char-screen" && sky.auto)) showScreen("pad-screen");
    sky.auto = false;
    return;
  }
  if (ss.id !== sky.id) {
    // a new setup (Sky was just picked), or this page just loaded into one: the TV knows our step
    sky.id = ss.id;
    sky.picked = !!ss.picked;
    sky.ready = !!ss.ready;
    sky.hadPick = sky.picked;
    sky.sentAt = 0;
  } else if (Date.now() - sky.sentAt > 1500) {
    // the TV un-readied us (a round called off, a drawing opened): believe it about READY; a pick
    // it doesn't know about (a message lost while reconnecting) it hears again
    sky.ready = !!ss.ready && sky.picked;
    if (!!ss.picked !== sky.picked) sendSky();
  }
  // the doodle vote (everyone ready, 2+ own drawings): its screen over READY / the picker, until it's over
  const sv = skyVote();
  if (sv) {
    if (curScreen === "ready-screen" || curScreen === "char-screen" || curScreen === "pad-screen") {
      release();
      showScreen("vote-screen");
      fetchCharacters().then(() => voteScreen.render()); // the doodles' pictures (drawn after our last look)
    }
    if (curScreen === "vote-screen") voteScreen.render();
    return;
  }
  if (curScreen === "vote-screen") return showReady(); // the vote is over: READY until the countdown
  // the controller is never the screen during the setup: the picker, or READY once picked
  if (curScreen === "pad-screen") {
    if (sky.picked) showReady();
    else showPicker();
  } else if (curScreen === "ready-screen") renderReady();
}
function showReady() {
  release();
  sky.auto = false;
  showScreen("ready-screen");
  renderReady();
}
function renderReady() {
  const ss = skySetup() || {};
  // your character, standing on a cloud (the puffball in your colour if you kept the default)
  const c = me.character && charList && charList.get(me.character);
  const box = $("rdy-char");
  const key = c ? `${c.id}|${c.src}` : `puff|${myColor()}`;
  if (box.dataset.key !== key) {
    box.dataset.key = key;
    box.innerHTML = "";
    if (!c) box.append(spriteEl("puff", 10, myColor()));
    else if (c.hitbox && c.hitbox.ball) {
      const ball = document.createElement("div");
      ball.className = "ballpic";
      circleCrop(ball, c);
      box.append(ball);
    } else {
      const im = document.createElement("img");
      im.src = c.src;
      im.alt = "";
      box.append(im);
    }
  }
  if ($("rdy-name").textContent !== me.name) $("rdy-name").textContent = me.name;
  $("rdy-as").textContent = charLabel(c || null).toUpperCase();
  const ready = sky.ready;
  $("ready-screen").classList.toggle("is-ready", ready);
  const go = $("rdy-go");
  go.classList.toggle("on", ready);
  go.setAttribute("aria-pressed", String(ready));
  $("rdy-go-label").textContent = ready ? "READY!" : "READY";
  const ico = ready ? "check" : "";
  if ($("rdy-go-ico").dataset.ico !== ico) {
    $("rdy-go-ico").dataset.ico = ico;
    $("rdy-go-ico").innerHTML = ready ? sprite("check", 3, { color: "#0a1428" }) : "";
  }
  // everyone's step comes with the lobby state; the count with this phone's status
  const players = ((lobbyState && lobbyState.players) || []).filter((q) => q.connected !== false);
  const total = ss.totalCount ?? players.length;
  const readyN = ss.readyCount ?? players.filter((q) => q.setup === "ready").length;
  const live = !!(ws && ws.readyState === 1 && hostUp && !replaced);
  const all = live && total > 0 && readyN === total;
  // lost the TV for a moment: say so, and READY waits (the pick is kept and re-sent on reconnect)
  const sockUp = !!(ws && ws.readyState === 1);
  $("rdy-count").textContent = live ? `${readyN}/${total} READY` : sockUp ? "WAITING FOR THE TV" : "RECONNECTING...";
  $("rdy-count").classList.toggle("go", all);
  $("rdy-count").classList.toggle("gold", (live && !all) || (!live && sockUp));
  $("rdy-count").classList.toggle("bad", !live && !sockUp);
  go.disabled = !live;
  $("ready-screen").classList.toggle("offline", !live);
  // the game picker can still back out to the game cards (like "Switch game" on the controller)
  $("rdy-switch").hidden = !(live && mode.count > 1 && (!lobbyState || iAmPicker()));
  const waiting = players.filter((q) => q.id !== me.id && q.setup && q.setup !== "ready").map((q) => String(q.name || "?").toUpperCase());
  let line = "";
  if (!live) line = "HANG ON, YOUR PICK IS SAVED";
  else if (ready) line = !waiting.length ? "EVERYONE'S READY!" : waiting.length <= 2 ? `WAITING FOR ${waiting.join(" & ")}` : `WAITING FOR ${waiting.length} PLAYERS`;
  else line = players.length > 1 && !waiting.length ? "EVERYONE ELSE IS READY!" : "TAP READY WHEN YOU ARE";
  const html = escHtml(line) + ((ready && waiting.length) || !live ? '<span class="cur">_</span>' : "");
  if ($("rdy-wait").dataset.html !== html) {
    $("rdy-wait").innerHTML = html;
    $("rdy-wait").dataset.html = html;
  }
}
$("rdy-go").addEventListener("click", () => {
  if (!skySetup() || !sky.picked) return;
  sky.ready = !sky.ready; // tap again: not ready after all
  sendSky();
  renderReady();
  if (sky.ready && navigator.vibrate) {
    try {
      navigator.vibrate(25);
    } catch {}
  }
});
$("rdy-switch").addEventListener("click", () => sendRaw({ t: "pick" }));
$("rdy-change").addEventListener("click", () => {
  if (skySetup()) {
    // back to the picker: not ready (and not picked) until you pick again
    sky.picked = false;
    sky.ready = false;
    sky.hadPick = true;
    sendSky();
  }
  showPicker();
});

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
// the host's phone only (the TV says which: lobby state hostId): BOTS FILL / OFF for every game
$("bots-host").addEventListener("click", () => window.foxboxLobby.bots());
$("edit-name").addEventListener("click", () => {
  release();
  $("name-input").value = me.name;
  showScreen("name-screen");
  setTimeout(() => $("name-input").focus(), 50);
});
$("me-chip").addEventListener("click", () => $("edit-name").click()); // the lobby card's name: tap to change it

// ── Connection ──────────────────────────────────────────────────────────────────
let ws = null;
let retryMs = 400;
let retryTimer = null;
let lastRx = 0;
let hostUp = false;
let replaced = false;
let lastStatus = null;
let rowConnectionEpoch = 0;

function setConn(kind, text) {
  const el = $("conn");
  el.className = kind;
  el.textContent = text;
  // Lakota (day 2): no header; a slim strip at the very top only while not connected (gone once connected)
  const strip = $("reconn");
  if (strip) {
    strip.hidden = kind === "ok";
    const t = kind === "ok" ? "" : text === "Connecting" ? "Connecting…" : text === "Reconnecting" ? "Reconnecting…" : text;
    if (strip.textContent !== t) strip.textContent = t;
  }
}

function connect() {
  clearTimeout(retryTimer);
  if (ws && (ws.readyState === 0 || ws.readyState === 1)) return;
  replaced = false;
  setConn("", "Connecting");
  const sock = openSocket("pad");
  ws = sock;
  sock.onopen = () => {
    rowConnectionEpoch++;
    retryMs = 400;
    lastRx = Date.now();
    setConn("ok", "Connected");
    sendJoin();
    sendSky(); // back after a blip mid-setup: our pick / READY again (an old setup's is ignored)
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
      if (hostUp) sendSky(); // the TV (re)loaded: remind it of our step in Sky's setup
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
    case "game": // FoxBox party extension: the running game's message for this phone (TEE TIME)
      if (foxGameMsg(msg)) break; // WHOSFOX: the WHO'S THE FOX? module's
      if (knightGameMsg(msg)) break; // KNIGHT: the knight module's (Knight Platformer is the hub's game)
      if (kartGameMsg(msg)) break; // KART: the kart module's (FOX KART is the hub's game)
      if (mode.id === "row" && msg.m && msg.m.type === "rowTrain") { rowTrain.onMessage(msg.m); renderStatus(); break; } // ROWTRAIN: the controls check
      if (mode.id === "row" && msg.m && msg.m.type === "rowBoat") { row.boatState(msg.m); break; } // ROWBOAT: reloading / stunned on the paddler's boat art
      if (mode.id === "snowball" && msg.m && msg.m.type === "round") { roundCue(msg.m); break; } // SNOWBALL: best of three
      if (msg.m && typeof msg.m === "object") {
        if (golfPad) golfPad.onMessage(msg.m);
        else {
          golfInbox.push(msg.m);
          if (golfInbox.length > 16) golfInbox.shift();
        }
      }
      break;
  }
}

// ── SNOWBALL: best of three — a round's start on the phone too (the game's {type:"round", text, sub}: ROUND 2 · GO!) ──
function roundCue(m) {
  let el = $("round-cue");
  if (!el) {
    const st = document.createElement("style");
    st.textContent = "#round-cue{position:absolute;left:50%;top:40%;z-index:60;transform:translate(-50%,-50%);pointer-events:none;text-align:center;" +
      "font-family:var(--px-font,ui-monospace,monospace);font-size:44px;line-height:1.15;color:#fff9f1;text-shadow:0 4px 0 #1d2a7a,0 6px 16px #000a;white-space:nowrap;opacity:0}" +
      "#round-cue small{display:block;margin-top:8px;font-size:30px;color:#ffd23f}#round-cue.on{animation:round-cue 1.6s ease-out forwards}" +
      "@keyframes round-cue{0%{opacity:0;transform:translate(-50%,-50%) scale(1.3)}14%{opacity:1;transform:translate(-50%,-50%) scale(1)}72%{opacity:1}100%{opacity:0}}";
    document.head.append(st);
    el = document.createElement("div");
    el.id = "round-cue";
    el.dataset.test = "round-cue";
    $("pad-screen").append(el);
  }
  el.textContent = String(m.text || "").slice(0, 24);
  if (m.sub) {
    const s = document.createElement("small");
    s.textContent = String(m.sub).slice(0, 24);
    el.append(s);
  }
  el.dataset.round = String(m.round || "");
  el.classList.remove("on");
  void el.offsetWidth; // (restart the animation)
  el.classList.add("on");
}

// ── TEE TIME (golf) ─────────────────────────────────────────────────────────────
// The golf controller is a module of its own (dev/party/golf/golf-pad.js, synced from
// topgolf-range/phone/), loaded the first time golf is the hub's game. It owns #golf during the
// countdown and the round, and talks to the TV game with {t:"game", m} both ways
// (topgolf-range/CONTRACT.md). The lobby keeps the plain START button; results stay pad.js's.
var golfPad = null; // var: onMessage / renderStatus may run before this line during start-up
var golfLoad = null;
var golfInbox = [];
function syncGolf() {
  const golf = mode.id === "golf";
  if (golf && !golfLoad) {
    golfLoad = import("./golf/golf-pad.js")
      .then((m) => {
        golfPad = m.createGolfPad($("golf"), {
          send: (m2) => sendRaw({ t: "game", m: m2 }),
          me: () => ({ id: me.id, name: me.name }),
        });
        for (const msg of golfInbox.splice(0)) golfPad.onMessage(msg);
        renderStatus();
      })
      .catch((e) => console.warn("[foxbox] golf controller didn't load", e));
  }
  const st = lastStatus && lastStatus.state;
  const connected = !!(ws && ws.readyState === 1 && hostUp && !replaced);
  const on = golf && connected && curScreen === "pad-screen" && (st === "countdown" || st === "playing");
  $("pad-screen").classList.toggle("golf", on);
  $("golf").hidden = !on;
  if (golf) $("bonk-wrap").hidden = on;
  if (golfPad) golfPad.show(on, lastStatus);
  // golf's setup (before START): the picker chooses the map, everyone sees it (golf-pad.js fills #golf-setup)
  const setupOn = golf && connected && !on && curScreen === "pad-screen" && !!lobbyState && lobbyState.phase === "setup" && !!lobbyState.golf;
  const box = $("golf-setup");
  if (box) {
    box.hidden = !setupOn;
    $("pad-screen").classList.toggle("golf-setup", setupOn);
    if (golfPad && golfPad.setup) golfPad.setup(setupOn ? { el: box, lobby: lobbyState, picker: lobbyState.pickerId === me.id } : null);
  }
}

// ── KNIGHT (Knight Platformer) ──
// The knight controller is a module of its own (dev/party/knight/knight-pad.js, synced from knight-platformer/phone/),
// loaded the first time knight is the hub's game. It covers the screen (#knight, pad.html) during the knight setup (the
// knight + sword picker, READY, the picker's LEVEL), the countdown and the round, and talks to the TV with {t:"game", m}
// both ways (knight-platformer CONTRACT.md "Phone protocol"). pad.js keeps the plain lobby and the results.
var knightPad = null; // var: onMessage / renderStatus may run before this line during start-up
var knightLoad = null;
var knightInbox = [];
/** onMessage(): a {t:"game"} message while knight is the hub's game goes to the knight module (buffered until loaded). */
function knightGameMsg(msg) {
  if (mode.id !== "knight" || !msg.m || typeof msg.m !== "object") return false;
  if (knightPad) knightPad.onMessage(msg.m);
  else {
    knightInbox.push(msg.m);
    if (knightInbox.length > 32) knightInbox.shift();
  }
  return true;
}
function syncKnight() {
  const on = mode.id === "knight";
  if (on && !knightLoad) {
    knightLoad = import("./knight/knight-pad.js")
      .then((m) => {
        knightPad = m.createKnightPad($("knight"), {
          send: (m2) => sendRaw({ t: "game", m: m2 }),
          me: () => ({ id: me.id, name: me.name }),
        });
        for (const msg of knightInbox.splice(0)) knightPad.onMessage(msg);
        renderStatus();
      })
      .catch((e) => console.warn("[foxbox] knight controller didn't load", e));
  }
  if (on) $("steer").hidden = true; // no stick: START in the plain lobby, the module's own gamepad in a round
  if (!knightPad) return;
  const connected = !!(ws && ws.readyState === 1 && hostUp && !replaced);
  try {
    knightPad.sync({ status: on ? lastStatus : null, lobby: lobbyState, connected, screen: curScreen });
  } catch (e) {
    console.warn("[foxbox] knight sync failed", e);
  }
  const cover = on && !!knightPad.active; // the module shows #knight itself; pad.js's BONK steps aside meanwhile
  document.body.classList.toggle("knight-on", cover);
  if (on) $("bonk-wrap").hidden = cover;
}
// ── end KNIGHT ──

// ── KART (FOX KART) ──
// The kart controller is a module of its own (dev/party/kart/kart-pad.js, synced from fox-kart/phone/), loaded the first
// time kart is the hub's game. It covers the screen (#kart, pad.html) during the kart setup (the racer picker, READY),
// the countdown and the race (the phone held sideways: tilt steers, GAS + ITEM), and talks to the TV with {t:"game", m}
// both ways (fox-kart CONTRACT.md "Phone protocol"). pad.js keeps the plain lobby and the results; the BOTS toggle stays
// the shell's (the host phone's PARTY sheet).
var kartPad = null; // var: onMessage / renderStatus may run before this line during start-up
var kartLoad = null;
var kartInbox = [];
var kartFails = 0; // failed loads of the module (a network blip, a stale cache): retried with a fresh URL
var kartRetryAt = 0;
/** onMessage(): a {t:"game"} message while kart is the hub's game goes to the kart module (buffered until loaded). */
function kartGameMsg(msg) {
  if (mode.id !== "kart" || !msg.m || typeof msg.m !== "object") return false;
  if (kartPad) kartPad.onMessage(msg.m);
  else {
    kartInbox.push(msg.m);
    if (kartInbox.length > 32) kartInbox.shift();
  }
  return true;
}
function loadKartPad() {
  // a failed import() is remembered for its URL: a retry needs a fresh one
  const url = kartFails ? `./kart/kart-pad.js?retry=${Date.now()}` : "./kart/kart-pad.js";
  kartLoad = import(url)
    .then((m) => {
      kartPad = m.createKartPad($("kart"), {
        send: (m2) => sendRaw({ t: "game", m: m2 }),
        me: () => ({ id: me.id, name: me.name }),
      });
      for (const msg of kartInbox.splice(0)) kartPad.onMessage(msg);
      renderStatus();
    })
    .catch((e) => {
      kartFails++;
      console.warn(`[foxbox] kart controller didn't load (try ${kartFails})`, e);
      kartRetryAt = Date.now() + Math.min(8000, 1500 * kartFails);
      kartLoad = null; // renderStatus (every message, every 0.5 s in the lobby) tries again after kartRetryAt
      renderStatus();
    });
}
function syncKart() {
  const on = mode.id === "kart";
  if (on && !kartPad && !kartLoad && Date.now() >= kartRetryAt) loadKartPad();
  if (on) $("steer").hidden = true; // no stick: START in the plain lobby, the module's own tilt wheel in a race
  // the controller didn't load (yet): no plain START (it would skip READY and can't steer) — say so, with RELOAD
  const failed = on && !kartPad && kartFails > 0;
  let reload = $("kart-reload");
  if (failed && !reload) {
    reload = document.createElement("button");
    reload.id = "kart-reload";
    reload.type = "button";
    reload.dataset.test = "kart-reload";
    reload.textContent = "RELOAD";
    reload.onclick = () => location.reload();
    $("status").appendChild(reload);
  }
  if (reload) reload.hidden = !failed;
  if (failed) {
    $("bonk-wrap").hidden = true;
    $("status-big").textContent = "The kart controller didn't load";
    $("status-small").textContent = "Trying again… or tap RELOAD";
  }
  if (!kartPad) return;
  const connected = !!(ws && ws.readyState === 1 && hostUp && !replaced);
  try {
    kartPad.sync({ status: on ? lastStatus : null, lobby: lobbyState, connected, screen: curScreen });
  } catch (e) {
    console.warn("[foxbox] kart sync failed", e);
  }
  const cover = on && !!kartPad.active; // the module shows #kart itself; pad.js's START steps aside meanwhile
  document.body.classList.toggle("kart-on", cover);
  if (on) $("bonk-wrap").hidden = cover;
}
// ── end KART ──
// ── WHOSFOX (WHO'S THE FOX?) ──
// The game's phone module (dev/party/whosfox/whosfox-pad.js, from the whos-the-fox repo), loaded the first time it's the hub's
// game. It covers the phone (#whosfox, pad.html; portrait) from the game's setup (the picker's START, "needs 3+ players")
// through the whole game, and talks to the TV with {t:"game", m} both ways. pad.js keeps the plain lobby and the results.
var foxPad = null; // var: onMessage / renderStatus may run before this line during start-up
var foxLoad = null;
var foxInbox = [];
function foxGameMsg(msg) {
  if (mode.id !== "whosfox" || !msg.m || typeof msg.m !== "object") return false;
  if (foxPad) foxPad.onMessage(msg.m);
  else {
    foxInbox.push(msg.m);
    if (foxInbox.length > 32) foxInbox.shift();
  }
  return true;
}
function syncFox() {
  const on = mode.id === "whosfox";
  if (on && !foxLoad) {
    foxLoad = import("./whosfox/whosfox-pad.js")
      .then((m) => {
        foxPad = m.createFoxPad($("whosfox"), {
          send: (m2) => sendRaw({ t: "game", m: m2 }),
          me: () => ({ id: me.id, name: me.name }),
          start: () => sendRaw({ t: "start" }),
        });
        for (const msg of foxInbox.splice(0)) foxPad.onMessage(msg);
        renderStatus();
      })
      .catch((e) => console.warn("[foxbox] whosfox controller didn't load", e));
  }
  if (on) $("steer").hidden = true; // no stick: the module has the buttons
  if (!foxPad) return;
  const connected = !!(ws && ws.readyState === 1 && hostUp && !replaced);
  try {
    foxPad.sync({ status: on ? lastStatus : null, lobby: lobbyState, connected, screen: curScreen });
  } catch (e) {
    console.warn("[foxbox] whosfox sync failed", e);
  }
  const cover = on && !!foxPad.active;
  document.body.classList.toggle("whosfox-on", cover);
  if (on) $("bonk-wrap").hidden = cover;
}
// ── end WHOSFOX ──

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
  /** The host's phone only: switch BOTS FILL / OFF for every game (the TV checks it's the host's phone). */
  bots() {
    if (!lobbyState || lobbyState.hostId !== me.id) return;
    sendRaw({ t: "game", m: { type: "bots", mode: lobbyState.bots === "fill" ? "off" : "fill" } });
  },
  /** The host's phone only, web TV mode (the lobby state has `party`): rename the party ({group}) or list it publicly or
   * not ({pub}). The TV checks it's the host's phone and the name. */
  party(change) {
    if (!lobbyState || lobbyState.hostId !== me.id || !lobbyState.party || !change || typeof change !== "object") return;
    const m = { type: "party" };
    if (typeof change.group === "string") m.group = change.group.slice(0, 60);
    if (typeof change.pub === "boolean") m.pub = change.pub;
    if (m.group != null || m.pub != null) sendRaw({ t: "game", m });
  },
  /** USE CURSOR (lobby2-pad.js → pointer-pad.js): the phone's pointer for its TV's lobby — {x, y} 0..10000, + d / tap /
   * rc, or {off:1} — as {t:"game", m:{type:"ptr", …}} (pointer-tv.js on the TV has the list). */
  ptr(m) {
    if (!m || typeof m !== "object") return false;
    const out = { type: "ptr" }; // first: an extra TV's link spots it by the message's start (net-p2p.js GAME_PTR)
    for (const k of Object.keys(m)) if (k !== "type") out[k] = m[k];
    return sendRaw({ t: "game", m: out });
  },
};
const iAmPicker = () => !!lobbyState && lobbyState.pickerId === me.id;
const iAmRoller = () => !!lobbyState && lobbyState.rollerId === me.id;
function lobbyLine() {
  if (!lobbyState) return "";
  const nm = (id) => (lobbyState.players.find((q) => q.id === id) || {}).name || "someone";
  const mine = lobbyState.players.find((q) => q.id === me.id);
  const bits = [];
  if (iAmPicker()) bits.push("You pick the game");
  else if (lobbyState.pickerId) bits.push(`${nm(lobbyState.pickerId)} picks`);
  if (iAmRoller()) bits.push("You roll the look");
  if (mine && mine.points) bits.push(`${mine.points} pts${lobbyState.leaderId === me.id ? ", in the lead" : ""}`);
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
  steer.hidden = rowing || mode.id === "golf"; // TEE TIME: START in the lobby, its own module in play (syncGolf)
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
    $("pad-screen").classList.remove("picking"); // a new seat: the seat picker folds away again
  }
  $("pad-screen").classList.toggle("captain", role === "captain");
  if (seat) {
    if (seat.color) { applyColor(seat.color); row.setColor(seat.color.base); } // ROWBOAT: the paddler's boat art in the boat's colour
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
  // Row setup: seat line + motion test + Ready on one screen (pad.html folds the seat picker)
  $("pad-screen").classList.toggle("row-setup", show && st === "lobby");
  if (!show) return;
  const seat = mySeat();
  box.classList.toggle("seated", !!seat);
  $("boats-head").textContent = !seat
    ? "Pick your boat"
    : $("pad-screen").classList.contains("picking")
      ? "Your seat · tap another to switch"
      : `${SEAT_LABEL[seat.seat] || "CREW"} · ${seat.boatName} boat · ⇄ Change seat`;
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
$("boats-head").addEventListener("click", () => {
  if (!mySeat()) return;
  $("pad-screen").classList.toggle("picking");
  renderBoats();
});

function renderStatus() {
  if (lastStatus && lastStatus.game) applyMode(lastStatus.game);
  applyRole();
  rowTrain.sync({ state: mode.id === "row" && lastStatus ? lastStatus.state : null, seat: role || null, connected: !!(ws && ws.readyState === 1 && hostUp && !replaced) }); // ROWTRAIN
  syncRowSetup();
  renderBoats();
  syncSky();
  if (lastStatus && lastStatus.hub) document.title = `${lastStatus.hub} — Controller`;
  // Between rounds you can switch character (it applies from the next round). Not on the results:
  // those count down back to the lobby (where Sky's setup has its own picker).
  const st0 = lastStatus && lastStatus.state;
  const between = !!(ws && ws.readyState === 1 && hostUp && !replaced && ["lobby", "waiting", "out"].includes(st0));
  $("change-char").hidden = !between || mode.id !== "sky"; // characters are a Sky Scramble thing (for now)
  $("change-char").textContent = me.character ? "Change character" : "Set up your character";
  $("switch-game").hidden = !(between && st0 === "lobby" && mode.count > 1 && (!lobbyState || iAmPicker()));
  // your name in the lobby card (the header is gone): tap it to change it
  const chip = $("me-chip");
  chip.hidden = !(between && st0 === "lobby");
  if ($("me-chip-name").textContent !== me.name) $("me-chip-name").textContent = me.name || "Name";
  const botsHost = $("bots-host");
  botsHost.hidden = !(between && st0 === "lobby" && !!lobbyState && lobbyState.hostId === me.id);
  const botsTxt = `🤖 BOTS: ${lobbyState && lobbyState.bots === "fill" ? "FILL" : "OFF"}`;
  if (botsHost.textContent !== botsTxt) botsHost.textContent = botsTxt;
  botsHost.dataset.mode = lobbyState && lobbyState.bots === "fill" ? "fill" : "off";
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
        s = mode.id === "row"
          ? !mySeat() ? "Pick a seat in a boat below" : st.rowSetup?.ready
            ? `Ready — ${st.rowSetup.readyCount}/${st.rowSetup.totalCount} players ready`
            : "Enable motion, test your controls, then tap Ready"
          : `Press ${mode.button} to start` + (st.hold === "drawing" ? " · someone's still drawing" : left != null ? ` · auto-start in ${left}s` : "");
        const ll = lobbyLine();
        if (ll) s += ` · ${ll}`;
        break;
      }
      case "countdown":
        b = "Get ready!";
        s = "Look at the TV 👀";
        break;
      case "playing":
        if (mode.id === "row" && rowTrain.visible()) { // ROWTRAIN: the controls check before the race (then ALL SET!)
          b = rowTrain.on() ? ROW_TRAIN.status : ROW_TRAIN.done.big;
          s = rowTrain.statusLine();
          break;
        }
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
        // the TV's results: who won (a boat in team games), your place and points, then the list
        b = st.won ?? st.place === 1 ? "YOU WON!" : `YOU CAME ${ordinal(st.place).toUpperCase()}`;
        s = `${String(st.winner || "").toUpperCase()} WINS!` + (st.points ? ` · +${st.points} PTS` : "");
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
  const rows = ws && ws.readyState === 1 && lastStatus?.state === "results" && Array.isArray(lastStatus.results) ? lastStatus.results : null;
  $("pad-screen").classList.toggle("results", !!rows);
  $("res-mini").hidden = !rows;
  $("res-art").hidden = !rows;
  if (rows) {
    // the arcade high-score table: RANK · BOAT · CREW (team games) or RANK · NAME; your row in green
    const team = !!rows[0]?.team;
    const vals = !team && rows.some((r) => r.value != null); // a score column (TEE TIME: "247 PTS")
    const solo = team ? "" : vals ? " solo vals" : " solo";
    // a bot's name carries a BOT tag (the host's BOTS setting: FILL)
    const nm = (r, k) => escHtml((r.names || [])[k] || "") + (Array.isArray(r.bots) && r.bots[k] ? ' <span class="bot-tag">BOT</span>' : "");
    const html = `<div class="r hd${solo}"><span>RANK</span><span>${team ? "BOAT" : "NAME"}</span>${team ? "<span>CREW</span>" : vals ? '<span class="val">SCORE</span>' : ""}</div>` +
      rows.map((r, i) => `<div class="r${i === 0 ? " first" : ""}${r.mine ? " mine" : ""}${solo}"><span class="rk">${ordinal(i + 1).toUpperCase()}</span>` +
        (team
          ? `<span>${escHtml(String(r.team || "").replace(/ boat$/i, "").toUpperCase())}</span><span class="crew">${(r.names || []).map((_, k) => nm(r, k)).join(" · ")}</span>`
          : `<span class="crew">${nm(r, 0)}</span>${vals ? `<span class="val">${escHtml(r.value ?? "")}</span>` : ""}`) + `</div>`).join("");
    if ($("res-mini").dataset.html !== html) {
      $("res-mini").innerHTML = html;
      $("res-mini").dataset.html = html;
    }
    // the crown is 1st place's alone: 2nd and 3rd see their own puffball, the rest a crying one
    const mineRow = rows.find((r) => r.mine);
    const won = lastStatus.won ?? lastStatus.place === 1;
    const myColor = mineRow?.color || "#ffd23f";
    const art = won || !mineRow ? crownedPuff(rows[0]?.color || "#ffd23f", 5)
      : lastStatus.place <= 3 ? sprite("puff", 5, { color: myColor })
      : cryingPuff(myColor, 5);
    if ($("res-art").dataset.html !== art) {
      $("res-art").innerHTML = art;
      $("res-art").dataset.html = art;
    }
  }
  renderBack();
  // the captain's sideways screen hides #status: mirror it in the middle column
  const capLine = b === "You're in!" ? s : s ? `${b} · ${s}` : b;
  if ($("cap-status").textContent !== capLine) $("cap-status").textContent = capLine;
  $("cap-seat").hidden = !(mode.seats && lastStatus && lastStatus.state === "lobby");
  syncGolf();
  syncKnight(); // KNIGHT
  syncKart(); // KART
  syncFox(); // WHOSFOX
  syncExtras();
}

// ── Sideways controllers + the web version's lobby screens ──────────────────────
// During a round the controller is full screen and landscape (landscape.js). The web version
// (globalThis.FOXBOX_LOBBY2 = the lobby2 bundle's URL) also covers the lobby phase with the
// FoxBox lobby screens and gives the controllers the rolled look (lobby2-pad.js).
// Sky Scramble on the website (Lakota: like NONAME's setup): once Sky is picked every Sky screen is sideways: the
// picker, the selfie cropper, the drawing, READY, and the controller from the countdown to the results' countdown. A
// portrait window turns them with CSS and says TURN YOUR PHONE SIDEWAYS once per Sky session (landscape.js). The FoxBox
// lobby before a pick stays as it is.
let lobby2Pad = null;
let skyLand = null; // Sky's setup screens' sideways turners (set up next to `land` below)
let turnHint = null, turnSeen = false, skyTurnShown = false; // (KNIGHT: the knight pad shows the same hint itself)
const SKY_PAD_STATES = ["countdown", "playing", "out", "waiting", "results"];
function syncExtras() {
  const st = lastStatus && lastStatus.state;
  const connected = !!(ws && ws.readyState === 1 && hostUp && !replaced);
  const playing = connected && curScreen === "pad-screen" && (st === "countdown" || st === "playing");
  const web = globalThis.FOXBOX_LANDSCAPE === true;
  const sky = web && mode.id === "sky";
  const skyPad = sky && connected && curScreen === "pad-screen" && SKY_PAD_STATES.includes(st);
  // TEE TIME is left alone: it has its own portrait + sideways layouts (golf-pad.js) and is swung like a club,
  // and turned with CSS a portrait phone would use the portrait layout in a sideways box (SWING cut off)
  if (typeof land !== "undefined") land.set((playing && web && mode.id !== "golf" && mode.id !== "knight" && mode.id !== "kart" && mode.id !== "whosfox") || skyPad); // on with the next release · KNIGHT: the knight pad turns itself · KART: so does the kart pad · WHOSFOX: portrait
  if (skyLand) {
    for (const [id, l] of Object.entries(skyLand)) l.set(sky && curScreen === id);
    const skyScreen = sky && (curScreen in skyLand || skyPad);
    const turned = skyScreen && !!(land.angle || Object.values(skyLand).some((l) => l.angle));
    if (turned && !turnSeen) {
      turnSeen = true; // once per Sky session, when a Sky screen first comes up turned (a tap hides it)
      turnHint.show(4500);
      skyTurnShown = true;
    }
    if (!turned && skyTurnShown) { turnHint.hide(); skyTurnShown = false; } // only the one Sky showed (NONAME's setup shows it too)
    if (!skyScreen) turnSeen = false;
  }
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

/** The results: "BACK TO THE LOBBY IN N..." like the TV's line, counted down from the TV's backIn. */
function renderBack() {
  const st = lastStatus;
  const on = !!(st && st.state === "results" && typeof st.backIn === "number" && ws && ws.readyState === 1 && !replaced);
  const el = $("res-back");
  if (el.hidden === on) el.hidden = !on;
  if (!on) return;
  const left = Math.max(0, Math.ceil(st.backIn - (Date.now() - st.at) / 1000));
  const txt = `BACK TO THE LOBBY IN ${left}...`;
  if (el.textContent !== txt) el.textContent = txt;
}
setInterval(() => {
  if (lastStatus && lastStatus.state === "results") renderBack();
}, 200);

// ── Controls ────────────────────────────────────────────────────────────────────
let x = 0;
let y = 0; // only used by 2D-stick games (down = +1)
let b = 0;
let c = 0; // the second button (b1): Row Row Rumble's right paddle
let s = 0; // a captain's tilt steering (-1 left … 1 right)
let shot = false; // that captain's FIRE press really shoots (reloaded): only then the phone twangs
let sent = { x: null, y: null, b: null, c: null, s: null };

function flush() {
  if (sent.x === x && sent.y === y && sent.b === b && sent.c === c && sent.s === s) return;
  if (sendRaw({ t: "in", x, y, b, c, s })) {
    phoneSounds.input({ b, c, shot }, sent, mode.id, role);
    sent = { x, y, b, c, s };
    window.__foxboxLastInputAt = Date.now();
  }
}

const steer = $("steer");
const land = createLandscape($("pad-screen"));
skyLand = {
  "char-screen": createLandscape($("char-screen")),
  "crop-screen": createLandscape($("crop-screen")),
  "draw-screen": createLandscape($("draw-screen"), { onLayout: () => draw.layout() }), // the canvas sizes itself again
  "ready-screen": createLandscape($("ready-screen")),
  "vote-screen": createLandscape($("vote-screen")), // the doodle vote
};
turnHint = createTurnHint();
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

// Setup is tied to the host epoch and exact seat. Permission/practice is local;
// only a host acknowledgment marks the player ready.
function syncRowSetup() {
  if (mode.id === "row" && lastStatus?.state !== "playing" && (x || y || s || b || c)) {
    x = y = s = b = c = 0;
    flush();
  }
  const seat = mySeat(), setup = lastStatus?.rowSetup;
  const connected = !!(ws && ws.readyState === 1 && hostUp && !replaced);
  const next = connected && mode.id === "row" && seat && setup ? {
    ...setup,
    key: `${rowConnectionEpoch}:${setup.id}:${seat.boat}:${seat.seat}`,
    active: lastStatus.state === "lobby",
  } : null;
  row.setSetup(role === "paddle" ? next : null);
  cap.setSetup(role === "captain" ? next : null);
}
function sendRowReady(expectedRole, readiness) {
  const seat = mySeat(), setup = lastStatus?.rowSetup;
  if (mode.id !== "row" || role !== expectedRole || !seat || !setup || !hostUp || replaced) return;
  if (readiness.ready ? lastStatus.state !== "lobby" : !["lobby", "countdown"].includes(lastStatus.state)) return;
  sendRaw({ t: "rowReady", setupId: setup.id, boat: seat.boat, seat: seat.seat,
    motionReady: readiness.motionReady === true, ready: readiness.ready === true });
}

// Motion-only CAPTAIN: paddling drives b and c during the race.
const row = createRowPad(
  {
    root: $("row"), boat: $("row-boat"),
    count: $("row-count"), countWrap: $("row-count-wrap"), hint: $("row-hint"), meter: $("row-meter"),
    sens: $("row-sens"), enable: $("row-enable"), ready: $("row-ready"), note: $("row-note"),
  },
  {
    onInput(v) {
      if (mode.id !== "row" || role !== "paddle" || lastStatus?.state !== "playing") return;
      x = v.x;
      b = v.b;
      c = v.c;
      flush();
    },
    state: () => lastStatus && lastStatus.state,
    onReady: (readiness) => sendRowReady("paddle", readiness),
  },
);

// Row Row Rumble FIRST MATE (internal captain seat): tilt steers, the stick aims, FIRE is b.
const cap = createCapPad(
  {
    root: $("cap"), steerFill: $("cap-steer-fill"), steerHint: $("cap-steer-hint"),
    aim: $("cap-aim"), aimKnob: $("cap-aim-knob"), aimArrow: $("cap-aim-arrow"), fire: $("cap-fire"), ring: $("cap-ring"),
    fireLabel: $("cap-fire-label"), role: $("cap-role"), enable: $("cap-enable"), ready: $("cap-ready"), note: $("cap-note"),
  },
  {
    onInput(v) {
      if (mode.id !== "row" || role !== "captain" || lastStatus?.state !== "playing") return;
      x = v.x;
      y = v.y;
      s = v.s;
      b = v.b;
      c = 0;
      shot = v.shot === true;
      flush();
    },
    state: () => lastStatus && lastStatus.state,
    onReady: (readiness) => sendRowReady("captain", readiness),
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
  if (golfPad) golfPad.release(); // TEE TIME: let go of a held aim arrow
  if (knightPad) knightPad.release(); // KNIGHT: let go of every held button
  if (kartPad) kartPad.release(); // KART: let go of GAS / ITEM
}
window.addEventListener("blur", release);

// ── No zoom / scroll / selection / callouts on the controller ───────────────────
const padScreen = $("pad-screen");
for (const type of ["touchstart", "touchmove", "touchend"]) {
  padScreen.addEventListener(
    type,
    (e) => {
      if (e.target.closest("button#edit-name, #status button, #row-enable, #row-ready, .row-link, #boats .seat, #boats-head, #cap-enable, #cap-ready, #golf [data-native], #golf-setup button, #kart [data-native]")) return; // let real buttons click (incl. Switch game; TEE TIME's data-native ones; KART: the kart pad's)
      if (padScreen.classList.contains("row-setup") && !e.target.closest("#cap-aim, #cap-fire")) return; // Row setup scrolls
      e.preventDefault();
    },
    { passive: false },
  );
}
document.addEventListener("touchmove", (e) => {
  if (!e.target.closest("input, #char-grid, #crop-stage, #fbx2-pad, #pad-screen.row-setup, #vote-screen .vs-gal")) e.preventDefault();
}, { passive: false });
for (const type of ["gesturestart", "gesturechange", "gestureend", "dblclick", "contextmenu", "selectstart"]) {
  document.addEventListener(type, (e) => {
    if (!e.target.closest || !e.target.closest("input")) e.preventDefault();
  });
}
window.addEventListener("resize", () => {
  setXY(x, y);
  draw.layout();
  syncExtras(); // a phone turned sideways: the TURN YOUR PHONE SIDEWAYS hint goes (the turned screens re-layout themselves)
});
// Full screen where the browser allows a page to ask (Android, iPad): once, on the first tap that
// isn't typing. iPhone Safari never does; there the Home Screen icon opens it full screen (pad.html).
let askedFull = false;
document.addEventListener("pointerup", (e) => {
  const el = document.documentElement, go = el.requestFullscreen || el.webkitRequestFullscreen;
  if (askedFull || e.target.closest?.("input") || !go || !(document.fullscreenEnabled || document.webkitFullscreenEnabled)) return;
  askedFull = true;
  if (document.fullscreenElement || document.webkitFullscreenElement) return;
  try {
    const p = go.call(el, { navigationUI: "hide" });
    if (p && p.catch) p.catch(() => {});
  } catch {}
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
  // reloaded (or the phone dropped the page) mid-drawing: straight back to it (only my own drawing in progress)
  const draft = loadDraft();
  if (draft && draft.open && (draft.who === me.id || draft.who === undefined)) {
    drawOpen = true; // the first join already says "drawing"
    openDraw(null, true);
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
