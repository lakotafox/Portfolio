/**
 * lobby2-pad.js — the FoxBox lobby screens on the phone (loaded when the page sets globalThis.FOXBOX_LOBBY2 to the
 * lobby2 bundle's URL: the website, and the package's pad page).
 *
 * During the lobby phase a full-screen layer shows the lobby2 phone shell over the controller: the rolled look, your
 * character card (pixel badges), the dice key, the game cards (the picker swipes and picks), the party scoreboard.
 * Once a game is picked (setup), during the round and on the results, the normal controller screen shows.
 *
 * The toolbar (FoxBox pixel arcade: FoxBox Pixel labels, square cream frame, navy fill, hard shadow, pixel icons):
 *   YOUR NAME + pencil   tap to rename (pad.js's name step)
 *   PAD                  the player's gamepad look (pad-skin.js): pad.js's name step, opened at its CONTROLLER choice
 *   CHARACTER            kept hidden (Lakota): Sky's own setup asks for the character when Sky is picked
 *   USE CURSOR           the phone as a Wii-style pointer for its TV's lobby (pointer-pad.js: a full-screen tap pad over
 *                        this layer, RECENTER, SPEED; the TV draws the cursor: pointer-tv.js). Phones with a motion API
 *                        and a touch screen; an extra TV's phones while they're linked straight to that TV
 *   PARTY                the host's phone only (lobby state hostId): a sheet with BOTS FILL / OFF, and in web TV mode
 *                        (the lobby state has `party`) GROUP NAME + PRIVATE / PUBLIC too
 * lobby2 gives the toolbar a place in its content (mountLobby({toolbar})): the first row upright, the top of the
 * right-hand column sideways (the Cards | Grid tabs step down by its height, --fbx2-tb-h). It scrolls with the content,
 * so it never sits on the cards, the Pick button or the panels. An older lobby2 bundle without the slot: top right.
 *
 * The shell speaks {t:"lobby", a:"roll"|"skip"|"pick"}; the cards speak {t:"browse"|"pickGame"}. Both go through
 * window.foxboxLobby (pad.js), which sends the logic's own messages.
 */
const PIX = `"FoxBox Pixel", "Press Start 2P", ui-monospace, monospace`;
const SOFT = `"FoxBox Soft", "Pixelify Sans", ui-rounded, system-ui, sans-serif`;
const CREAM = "#fff9f1", NAVY = "#101125", INK = "#0a1428", GOLD = "#ffd23f", SHADOW = "#04050e";

// pixel icons: "#" = a pixel (currentColor), drawn 2 screen px per pixel, crisp
const ICONS = {
  pencil: ["......##", ".....###", "....###.", "...###..", "..###...", ".###....", "##......", "#......."],
  puff: ["..####..", ".######.", "########", "##.##.##", "##.##.##", "########", ".######.", "..####.."],
  sliders: ["..#.....", "########", "..#.....", "........", ".....#..", "########", ".....#..", "........"],
  close: ["#.....#", ".#...#.", "..#.#..", "...#...", "..#.#..", ".#...#.", "#.....#"],
  cursor: ["#......", "##.....", "###....", "####...", "#####..", "######.", "###....", "#.##..."],
  target: ["...#...", ".#####.", ".#...#.", "##.#.##", ".#...#.", ".#####.", "...#..."],
  pad: [".########.", "##.####.##", "#...##.#.#", "##.####.##", "###....###", ".##....##."],
};
function icon(name, px = 2) {
  const rows = ICONS[name], w = rows[0].length, h = rows.length;
  let rects = "";
  rows.forEach((r, y) => {
    for (let x = 0; x < w; x++) {
      if (r[x] !== "#") continue;
      let x2 = x;
      while (x2 + 1 < w && r[x2 + 1] === "#") x2++;
      rects += `<rect x="${x}" y="${y}" width="${x2 - x + 1}" height="1"/>`;
      x = x2;
    }
  });
  return `<svg class="fbx2-ico" viewBox="0 0 ${w} ${h}" width="${w * px}" height="${h * px}" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

function injectCss() {
  if (document.getElementById("fbx2-tb-css")) return;
  const css = document.createElement("style");
  css.id = "fbx2-tb-css";
  css.textContent = `
/* the toolbar */
.fbx2-padbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 8px; min-width: 0; padding-bottom: 4px; }
.fbx2-padbar > [data-test="lobby-edit-name"] { margin-right: auto; } /* your name left, the rest right (a wrapped row stays right) */
.fbx2-tb { appearance: none; margin: 0; box-sizing: border-box; display: inline-flex; align-items: center; gap: 7px; min-height: 36px;
  max-width: 100%; padding: 0 10px; border: 3px solid ${CREAM}; border-radius: 0; background: ${NAVY}; color: ${CREAM};
  box-shadow: 0 4px 0 ${SHADOW}; font: 400 9px/1 ${PIX}; letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap;
  cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
.fbx2-tb[hidden] { display: none; }
.fbx2-tb:active { transform: translateY(3px); box-shadow: 0 1px 0 ${SHADOW}; background: #24264a; }
.fbx2-tb[aria-expanded="true"], .fbx2-tb[aria-pressed="true"] { background: ${GOLD}; color: ${INK}; }
.fbx2-tb:focus-visible { outline: 3px solid ${GOLD}; outline-offset: 3px; }
.fbx2-tb .fbx2-ico { flex: none; display: block; }
.fbx2-tb-name { min-width: 0; max-width: 13ch; overflow: hidden; text-overflow: ellipsis; padding: 2px 0; }
.fbx2-tb[data-test="lobby-edit-name"] .fbx2-ico { color: ${GOLD}; }
.fbx2-tb[aria-expanded="true"] .fbx2-ico, .fbx2-tb[aria-pressed="true"] .fbx2-ico { color: ${INK}; }
@media (max-width: 359px) { .fbx2-tb { padding: 0 7px; gap: 5px; font-size: 8px; } }
/* sideways it sits over the right-hand column: centred like the tabs under it, a little tighter, the host's PARTY next
   to the name (Sky's CHARACTER is the one that wraps) */
@media (orientation: landscape) and (max-height: 520px) {
  .fbx2-padbar { justify-content: center; }
  .fbx2-padbar > [data-test="lobby-edit-name"] { margin-right: 0; }
  .fbx2-padbar > [data-test="lobby-party"] { order: 1; }
  .fbx2-padbar > [data-test="lobby-character"] { order: 2; }
  .fbx2-padbar > [data-test="lobby-pad"] { order: 0; }
  .fbx2-tb { padding: 0 7px; gap: 5px; font-size: 8px; }
}
/* an older lobby2 bundle without the toolbar slot: the top right of the layer */
.fbx2-padbar.fbx2-float { position: absolute; z-index: 5; top: max(10px, env(safe-area-inset-top)); right: max(10px, env(safe-area-inset-right));
  max-width: calc(100vw - 20px); justify-content: flex-end; }

/* the host's PARTY sheet */
.fbx2-party-back { position: absolute; inset: 0; z-index: 6; background: #05061199; }
.fbx2-party-back[hidden] { display: none; }
.fbx2-party { position: absolute; z-index: 7; left: 50%; transform: translateX(-50%); box-sizing: border-box;
  top: calc(max(10px, env(safe-area-inset-top)) + 6px); width: min(420px, calc(100% - 24px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)));
  max-height: calc(100% - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)); overflow-y: auto; overscroll-behavior: contain;
  padding: 12px 14px 14px; background: ${NAVY}; color: ${CREAM}; border: 3px solid ${CREAM}; box-shadow: 0 5px 0 ${SHADOW}, 0 14px 32px #00000080;
  font: 10px/1.5 ${PIX}; letter-spacing: 0.04em; text-transform: uppercase; }
.fbx2-party[hidden] { display: none; }
.fbx2-party-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; color: ${GOLD}; font-size: 12px; }
.fbx2-party button { font: inherit; letter-spacing: inherit; text-transform: inherit; border-radius: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.fbx2-party-x { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; margin: -6px -8px -6px 0; padding: 0; border: 0;
  background: none; color: ${CREAM}; }
.fbx2-party-x:active { color: ${GOLD}; }
.fbx2-party-sec + .fbx2-party-sec { margin-top: 12px; padding-top: 12px; border-top: 3px dashed #34365a; }
.fbx2-party-sec[hidden] { display: none; }
.fbx2-party-l { display: block; margin-bottom: 6px; color: #c9c8df; font-size: 8px; }
.fbx2-party-row { display: flex; gap: 8px; }
.fbx2-party-row input { flex: 1; min-width: 0; box-sizing: border-box; padding: 7px 9px; border: 3px solid ${CREAM}; border-radius: 0; outline: none;
  background: #05060f; color: ${CREAM}; font: 400 18px/1.2 ${SOFT}; letter-spacing: 0.02em; text-transform: uppercase; }
.fbx2-party-row input:focus { border-color: ${GOLD}; }
.fbx2-party-row input.bad { border-color: #ff5a3c; }
.fbx2-party-row button { padding: 0 12px; border: 3px solid ${CREAM}; background: #ff9864; color: #20152c; box-shadow: 0 3px 0 ${SHADOW}; }
.fbx2-party-row button:active, .fbx2-party-sw button:active, .fbx2-party-bots:active { transform: translateY(2px); box-shadow: 0 1px 0 ${SHADOW}; }
.fbx2-party-msg { min-height: 12px; margin: 6px 0 8px; color: #ff8a73; font-size: 8px; text-transform: none; }
.fbx2-party-msg.ok { color: #7be4dc; }
.fbx2-party-sw { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.fbx2-party-sw button, .fbx2-party-bots { min-height: 36px; padding: 6px; border: 3px solid ${CREAM}; background: #24264a; color: #c9c8df; box-shadow: 0 3px 0 ${SHADOW}; }
.fbx2-party-sw button[aria-pressed="true"][data-act="priv"] { background: #c9a7ff; color: #20152c; }
.fbx2-party-sw button[aria-pressed="true"][data-act="pub"] { background: #7be4dc; color: #20152c; }
.fbx2-party-bots { display: block; width: 100%; }
.fbx2-party-bots[hidden] { display: none; }
.fbx2-party-bots[aria-pressed="true"] { background: ${GOLD}; color: ${INK}; }
.fbx2-party-hint { margin: 8px 0 0; color: #c9c8df; font-size: 8px; line-height: 1.7; }
`;
  document.head.append(css);
}

export async function initLobby2Pad({ url, myId, editName, editPad, changeCharacter, lobby }) {
  // FOXBOX_LOBBY2 is relative to the PAGE (pad/index.html), not to this module's folder
  const mod = await import(new URL(url, location.href).href);
  const mountLobby = mod.mountLobby || (globalThis.FoxboxLobby2 && globalThis.FoxboxLobby2.mountLobby);
  if (typeof mountLobby !== "function") throw new Error("lobby2: no mountLobby");
  injectCss();

  const send = (m) => {
    if (!m || typeof m !== "object") return;
    if (m.t === "lobby") {
      if (m.a === "roll") lobby.roll();
      else if (m.a === "skip") lobby.skipTurn(m.role === "roller" ? "roller" : "picker");
      else if (m.a === "pick" && m.gameId) lobby.pickGame(m.gameId);
    } else if (m.t === "browse") lobby.browse(m.gameId, m.view, m.flipped);
    else if (m.t === "pickGame") lobby.pickGame(m.gameId);
    else if (m.t === "start") lobby.start();
    else if (m.t === "roll") lobby.roll();
    else if (m.t === "skipTurn") lobby.skipTurn(m.role);
  };

  const layer = document.createElement("div");
  layer.id = "fbx2-pad";
  layer.hidden = true;
  layer.style.cssText = "position:fixed;inset:0;z-index:40;";
  const host = document.createElement("div");
  host.style.cssText = "position:absolute;inset:0;";
  layer.append(host);

  const bar = document.createElement("div");
  bar.className = "fbx2-padbar";
  bar.dataset.test = "lobby-toolbar";
  const mk = (test, html, fn) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "fbx2-tb";
    b.dataset.test = test;
    b.innerHTML = html;
    b.addEventListener("click", fn);
    bar.append(b);
    return b;
  };
  const nameBtn = mk("lobby-edit-name", `<span class="fbx2-tb-name">Name</span>${icon("pencil")}`, () => editName());
  nameBtn.setAttribute("aria-label", "Change your name");
  const nameLabel = nameBtn.querySelector(".fbx2-tb-name");
  // SKINS: change the gamepad (the name step's CONTROLLER choice, without the keyboard)
  if (editPad) mk("lobby-pad", `${icon("pad")}<span>Pad</span>`, () => editPad()).setAttribute("aria-label", "Change your controller");
  // USE CURSOR: the chip shows once pointer-pad.js is loaded and this phone can do it (a click: iPhone asks for motion)
  let ptr = null;
  const cursorBtn = mk("lobby-cursor", `${icon("cursor")}<span>Use cursor</span>`, () => ptr && ptr.toggle());
  cursorBtn.hidden = true;
  cursorBtn.setAttribute("aria-pressed", "false");
  const charBtn = mk("lobby-character", `${icon("puff")}<span>Character</span>`, () => changeCharacter());
  charBtn.hidden = true;
  const partyBtn = mk("lobby-party", `${icon("sliders")}<span>Party</span>`, () => (sheet.open ? sheet.close() : sheet.show()));
  partyBtn.hidden = true;
  partyBtn.setAttribute("aria-haspopup", "dialog");
  partyBtn.setAttribute("aria-expanded", "false");
  const sheet = partySheet(layer, lobby, (open) => partyBtn.setAttribute("aria-expanded", String(open)));
  document.body.append(layer);

  const shell = mountLobby(host, { mode: "phone", send, me: myId(), toolbar: bar });
  // an older lobby2 bundle doesn't take the toolbar (no shell.toolbar): keep it in the layer's top right
  if (!shell.toolbar) {
    bar.classList.add("fbx2-float");
    layer.append(bar);
  }
  // sideways the lobby keeps the toolbar's height free above the cards' tabs (lobby.css --fbx2-tb-h)
  const measure = () => {
    const h = bar.getBoundingClientRect().height;
    if (h > 0) layer.style.setProperty("--fbx2-tb-h", `${Math.ceil(h)}px`);
  };
  if (typeof ResizeObserver === "function") new ResizeObserver(measure).observe(bar);
  window.addEventListener("resize", measure);
  let lastJson = "", lastSt = null;
  /** The lobby state for the shell. While the cursor pad covers the picker's phone, its cards don't take the pick
   * (pickerId masked): the picker picks on the TV, which moves the browse; when the pad goes, the shell sees this phone
   * as the picker again and its cards start from the TV's browse (instead of the card they showed before). */
  const push = () => {
    if (!lastSt) return;
    const st = ptr && ptr.active && lastSt.pickerId === myId() ? { ...lastSt, pickerId: "" } : lastSt;
    const json = JSON.stringify(st);
    if (json !== lastJson) {
      lastJson = json;
      shell.update({ ...st, me: myId() });
    }
  };
  const paintCursor = () => {
    const on = !!(ptr && ptr.on);
    if (cursorBtn.getAttribute("aria-pressed") !== String(on)) cursorBtn.setAttribute("aria-pressed", String(on));
  };
  let lastSync = null; // sync()'s last arguments: replayed once pointer-pad.js is in (the chip shows at once)
  import("./pointer-pad.js")
    .then((m) => {
      ptr = m.createPointerPad({
        layer,
        send: (pm) => lobby.ptr && lobby.ptr(pm),
        icon,
        onChange: () => {
          paintCursor();
          push();
        },
      });
      if (lastSync) api.sync(lastSync);
    })
    .catch((e) => console.warn("[foxbox] USE CURSOR didn't load", e));

  const api = {
    sync(args) {
      lastSync = args;
      const { screen, connected, lobby: st } = args;
      const show = !!(st && connected && screen === "pad-screen" && st.phase === "lobby");
      if (layer.hidden === show) layer.hidden = !show;
      document.body.classList.toggle("fbx2-lobby-on", show);
      if (!st) {
        if (ptr) ptr.sync({ show: false });
        return sheet.sync(null);
      }
      charBtn.hidden = true; // Lakota: no CHARACTER in the lobby bar; Sky's own setup asks for the character first
      const mine = (st.players || []).find((q) => q.id === myId());
      const nm = (mine && mine.name) || "Name";
      if (nameLabel.textContent !== nm) nameLabel.textContent = nm;
      const isHost = !!(show && st.hostId && st.hostId === myId());
      partyBtn.hidden = !isHost;
      sheet.sync(isHost ? { bots: st.bots === "fill" ? "fill" : "off", party: st.party && typeof st.party === "object" ? st.party : null } : null);
      // USE CURSOR: this phone's own TV draws the cursor. An extra TV's phone needs its direct link to that TV (the web
      // build's FOXBOX_PATH "p2p"): over the relay its pointer would reach the main TV, which only draws its own phones
      const ptrOk = !!(ptr && ptr.supported && typeof lobby.ptr === "function" && mine && (!mine.house || globalThis.FOXBOX_PATH === "p2p"));
      cursorBtn.hidden = !ptrOk;
      if (ptr) ptr.sync({ show: show && ptrOk, color: (mine && mine.color) || null, picker: !!(mine && st.pickerId === myId()) });
      paintCursor();
      if (show) requestAnimationFrame(measure);
      lastSt = st;
      push();
    },
  };
  return api;
}

/**
 * The host's PARTY sheet: BOTS FILL / OFF (every game: bots take every free player spot up to 8, or people only), and
 * in web TV mode (no HOST steps on the TV) GROUP NAME (the HOST step's rules: net-p2p.js puts them in
 * globalThis.FOXBOX_NAMES; the TV checks again) + PRIVATE / PUBLIC. Sends through lobby.bots() / lobby.party({group} |
 * {pub}); the TV's next lobby state is the truth it shows (a tap shows at once).
 */
function partySheet(layer, lobby, onOpen) {
  const back = document.createElement("div");
  back.className = "fbx2-party-back";
  back.hidden = true;
  const el = document.createElement("div");
  el.className = "fbx2-party";
  el.hidden = true;
  el.dataset.test = "party-sheet";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Party");
  el.innerHTML = `
    <div class="fbx2-party-head"><span>Party</span><button type="button" class="fbx2-party-x" data-act="close" data-test="party-close" aria-label="Close">${icon("close")}</button></div>
    <div class="fbx2-party-sec" data-sec="party">
      <label class="fbx2-party-l" for="fbx2-party-name">Group name</label>
      <div class="fbx2-party-row">
        <input id="fbx2-party-name" data-test="party-name" maxlength="24" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" enterkeyhint="done">
        <button type="button" data-act="save" data-test="party-save">OK</button>
      </div>
      <p class="fbx2-party-msg" data-test="party-msg" role="status" aria-live="polite"></p>
      <div class="fbx2-party-sw" role="group" aria-label="Public or private">
        <button type="button" data-act="priv" data-test="party-private">Private</button>
        <button type="button" data-act="pub" data-test="party-public">Public</button>
      </div>
      <p class="fbx2-party-hint" data-test="party-hint"></p>
    </div>
    <div class="fbx2-party-sec" data-sec="bots">
      <span class="fbx2-party-l">Bots</span>
      <button type="button" class="fbx2-party-bots" data-act="bots" data-test="lobby-bots" hidden>BOTS: OFF</button>
      <p class="fbx2-party-hint" data-test="bots-hint"></p>
    </div>`;
  layer.append(back, el);
  const secParty = el.querySelector('[data-sec="party"]');
  const input = el.querySelector("input");
  const msg = el.querySelector(".fbx2-party-msg");
  const priv = el.querySelector('[data-act="priv"]');
  const pub = el.querySelector('[data-act="pub"]');
  const hint = el.querySelector('[data-test="party-hint"]');
  const bots = el.querySelector('[data-act="bots"]');
  const botsHint = el.querySelector('[data-test="bots-hint"]');
  let cur = null; // {bots, party} while this is the host's phone in the lobby (party: web TV mode's {group, pub}, else null)
  let shownPub = null, shownBots = null; // what the switches show (a tap shows at once; the TV's lobby state confirms)
  let pubWait = 0, botsWait = 0, msgTimer = 0;
  const say = (text, ok = false) => {
    clearTimeout(msgTimer);
    msg.textContent = text;
    msg.classList.toggle("ok", ok);
    if (ok) msgTimer = setTimeout(() => { msg.textContent = ""; }, 2500);
  };
  const paint = () => {
    secParty.hidden = !(cur && cur.party);
    const on = !!shownPub;
    priv.setAttribute("aria-pressed", String(!on));
    pub.setAttribute("aria-pressed", String(on));
    el.dataset.pub = on ? "1" : "";
    hint.textContent = on ? "Shows in JOIN GAME on every FoxBox TV" : "Only TVs with your invite code or link";
    const fill = shownBots === "fill";
    bots.textContent = fill ? "BOTS: FILL" : "BOTS: OFF"; // (as the old lobby button read: QA scripts look for OFF / FILL)
    bots.dataset.mode = fill ? "fill" : "off";
    bots.setAttribute("aria-pressed", String(fill));
    botsHint.textContent = fill ? "Bots take every free spot, up to 8 players" : "People only";
  };
  const api = {
    open: false,
    show() {
      if (!cur) return;
      input.value = (cur.party && cur.party.group) || "";
      input.classList.remove("bad");
      say("");
      shownPub = !!(cur.party && cur.party.pub);
      shownBots = cur.bots;
      paint();
      back.hidden = el.hidden = false;
      api.open = true;
      onOpen(true);
    },
    close() {
      back.hidden = el.hidden = true;
      api.open = false;
      onOpen(false);
      if (document.activeElement === input) input.blur();
    },
    sync(c) {
      cur = c;
      bots.hidden = !c; // only the host's phone has it (QA scripts read that from [data-test=lobby-bots])
      if (!c) return api.open && api.close();
      if (!api.open) return;
      if (Date.now() >= pubWait) shownPub = !!(c.party && c.party.pub);
      if (Date.now() >= botsWait) shownBots = c.bots;
      paint();
      const g = (c.party && c.party.group) || "";
      if (c.party && document.activeElement !== input && !input.classList.contains("bad") && input.value !== g) input.value = g;
    },
  };
  const save = () => {
    if (!cur || !cur.party) return;
    const N = globalThis.FOXBOX_NAMES;
    let name = input.value.trim();
    if (N && typeof N.cleanGroupName === "function") {
      const r = N.cleanGroupName(input.value);
      if (!r.ok) {
        input.classList.add("bad");
        return say(r.why === "empty" ? "Type a name first" : r.why);
      }
      name = r.name;
    } else if (!name) return say("Type a name first");
    input.classList.remove("bad");
    input.value = name;
    input.blur();
    if (name !== cur.party.group) lobby.party && lobby.party({ group: name });
    say("Saved", true);
  };
  const setPub = (on) => {
    if (!cur || !cur.party || shownPub === on) return;
    shownPub = on;
    pubWait = Date.now() + 1500; // until the TV's state has caught up
    paint();
    lobby.party && lobby.party({ pub: on });
  };
  el.querySelector('[data-act="save"]').addEventListener("click", save);
  el.querySelector('[data-act="close"]').addEventListener("click", () => api.close());
  back.addEventListener("click", () => api.close());
  priv.addEventListener("click", () => setPub(false));
  pub.addEventListener("click", () => setPub(true));
  bots.addEventListener("click", () => {
    if (!cur) return;
    shownBots = shownBots === "fill" ? "off" : "fill";
    botsWait = Date.now() + 1500;
    paint();
    lobby.bots && lobby.bots();
  });
  input.addEventListener("input", () => { input.classList.remove("bad"); say(""); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); save(); }
    else if (e.key === "Escape") { e.preventDefault(); api.close(); }
  });
  return api;
}
