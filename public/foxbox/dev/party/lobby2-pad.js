/**
 * lobby2-pad.js — the web version's FoxBox lobby screens on the phone (only loaded when the page
 * sets globalThis.FOXBOX_LOBBY2 to the lobby2 bundle's URL; the home TV hub never loads it).
 *
 * During the lobby phase a full-screen layer shows the lobby2 phone shell over the controller:
 * the rolled look, your role badges (🎮 Game Picker / 🎲 Theme Roller), the 🎲 Roll button,
 * skip buttons, the game cards (the picker swipes and picks), the party scoreboard. Name and
 * character (Sky Scramble) stay one tap away. Once a game is picked (setup), during the round
 * and on the results, the normal controller screen shows.
 *
 * The shell speaks {t:"lobby", a:"roll"|"skip"|"pick"}; the cards speak {t:"browse"|"pickGame"}.
 * Both go through window.foxboxLobby (pad.js), which sends the logic's own messages.
 */
export async function initLobby2Pad({ url, myId, editName, changeCharacter, lobby }) {
  // FOXBOX_LOBBY2 is relative to the PAGE (pad/index.html), not to this module's folder
  const mod = await import(new URL(url, location.href).href);
  const mountLobby = mod.mountLobby || (globalThis.FoxboxLobby2 && globalThis.FoxboxLobby2.mountLobby);
  if (typeof mountLobby !== "function") throw new Error("lobby2: no mountLobby");

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

  // name / character (and, on the host's phone only, BOTS FILL / OFF), one tap away
  const bar = document.createElement("div");
  bar.className = "fbx2-padbar";
  bar.style.cssText =
    "position:absolute;right:max(10px, env(safe-area-inset-right));top:max(10px, env(safe-area-inset-top));z-index:5;display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;max-width:calc(100vw - 20px);";
  const mk = (label, test, fn) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.dataset.test = test;
    b.style.cssText =
      "border:2px solid rgba(255,255,255,.75);border-radius:999px;padding:8px 14px;background:rgba(10,14,30,.72);color:#fff;font:700 15px ui-rounded,system-ui,sans-serif;";
    b.addEventListener("click", fn);
    bar.append(b);
    return b;
  };
  const nameBtn = mk("✏️ Name", "lobby-edit-name", () => editName()); // shows your name: tap it to change it
  const charBtn = mk("🧍 Character", "lobby-character", () => changeCharacter());
  // the host's BOTS setting for every game (the TV says which phone is the host's: lobby state hostId)
  const botsBtn = mk("🤖 BOTS: OFF", "lobby-bots", () => lobby.bots && lobby.bots());
  botsBtn.hidden = true;
  // web TV mode (the TV skipped the HOST steps; the lobby state then has `party`): the host's phone names the party and
  // makes it public or private, in a small sheet opened from PARTY next to BOTS
  const partyBtn = mk("🏷️ PARTY", "lobby-party", () => (party.open ? party.close() : party.show()));
  partyBtn.hidden = true;
  const party = partySheet(layer, lobby, bar);
  layer.append(bar);
  document.body.append(layer);

  const shell = mountLobby(host, { mode: "phone", send, me: myId() });
  let lastJson = "";

  return {
    sync({ screen, connected, lobby: st }) {
      const show = !!(st && connected && screen === "pad-screen" && st.phase === "lobby");
      if (layer.hidden === show) layer.hidden = !show;
      document.body.classList.toggle("fbx2-lobby-on", show);
      if (!st) return party.sync(null);
      charBtn.hidden = st.currentGameId !== "sky";
      const mine = (st.players || []).find((q) => q.id === myId());
      const nm = `✏️ ${(mine && mine.name) || "Name"}`;
      if (nameBtn.textContent !== nm) nameBtn.textContent = nm;
      botsBtn.hidden = !(st.hostId && st.hostId === myId());
      const bt = `🤖 BOTS: ${st.bots === "fill" ? "FILL" : "OFF"}`;
      if (botsBtn.textContent !== bt) botsBtn.textContent = bt;
      botsBtn.dataset.mode = st.bots === "fill" ? "fill" : "off";
      const mineParty = show && st.hostId && st.hostId === myId() && st.party && typeof st.party === "object" ? st.party : null;
      partyBtn.hidden = !mineParty;
      party.sync(mineParty);
      const json = JSON.stringify(st);
      if (json !== lastJson) {
        lastJson = json;
        shell.update({ ...st, me: myId() });
      }
    },
  };
}

/**
 * The host's PARTY sheet (web TV mode): GROUP NAME (the HOST step's rules: net-p2p.js puts them in
 * globalThis.FOXBOX_NAMES; the TV checks again) and PUBLIC / PRIVATE. Sends through lobby.party({group} | {pub});
 * the TV's next lobby state (party {group, pub}) is the truth it shows. Pixel look, like the TV's party chip.
 */
function partySheet(layer, lobby, bar) {
  const PIX = `"FoxBox Pixel", "Press Start 2P", ui-monospace, monospace`;
  const SOFT = `"FoxBox Soft", "Pixelify Sans", ui-rounded, system-ui, sans-serif`;
  if (!document.getElementById("fbx2-party-css")) {
    const css = document.createElement("style");
    css.id = "fbx2-party-css";
    css.textContent = `
.fbx2-party { position: absolute; z-index: 6; left: max(12px, env(safe-area-inset-left)); right: max(12px, env(safe-area-inset-right));
  top: calc(max(10px, env(safe-area-inset-top)) + 52px); max-width: 420px; margin: 0 auto; box-sizing: border-box; padding: 12px 14px 14px;
  background: #101125; color: #fff9f1; border: 3px solid #fff9f1; box-shadow: 0 4px 0 #08091999, 0 12px 32px #00000080;
  font: 10px/1.5 ${PIX}; letter-spacing: 0.04em; text-transform: uppercase; }
.fbx2-party[hidden] { display: none; }
.fbx2-party-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; color: #ffd23f; font-size: 12px; }
.fbx2-party button { font: inherit; letter-spacing: inherit; text-transform: inherit; border-radius: 0; cursor: pointer; }
.fbx2-party-head button { border: 0; padding: 6px 4px 6px 12px; background: none; color: #fff9f1; font-size: 12px; }
.fbx2-party-l { display: block; margin-bottom: 6px; color: #c9c8df; font-size: 8px; }
.fbx2-party-row { display: flex; gap: 8px; }
.fbx2-party-row input { flex: 1; min-width: 0; box-sizing: border-box; padding: 7px 9px; border: 3px solid #fff9f1; border-radius: 0; outline: none;
  background: #05060f; color: #fff9f1; font: 400 18px/1.2 ${SOFT}; letter-spacing: 0.02em; text-transform: uppercase; }
.fbx2-party-row input:focus { border-color: #ffd23f; }
.fbx2-party-row input.bad { border-color: #ff5a3c; }
.fbx2-party-row button { padding: 0 12px; border: 3px solid #fff9f1; background: #ff9864; color: #20152c; box-shadow: 0 3px 0 #08091999; }
.fbx2-party-msg { min-height: 12px; margin: 6px 0 10px; color: #ff8a73; font-size: 8px; text-transform: none; }
.fbx2-party-msg.ok { color: #7be4dc; }
.fbx2-party-sw { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.fbx2-party-sw button { padding: 9px 6px; border: 3px solid #fff9f1; background: #24264a; color: #c9c8df; box-shadow: 0 3px 0 #08091999; }
.fbx2-party-sw button[aria-pressed="true"][data-act="priv"] { background: #c9a7ff; color: #20152c; }
.fbx2-party-sw button[aria-pressed="true"][data-act="pub"] { background: #7be4dc; color: #20152c; }
.fbx2-party-hint { margin: 9px 0 0; color: #c9c8df; font-size: 8px; line-height: 1.7; }
`;
    document.head.append(css);
  }
  const el = document.createElement("div");
  el.className = "fbx2-party";
  el.hidden = true;
  el.dataset.test = "party-sheet";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Party");
  el.innerHTML = `
    <div class="fbx2-party-head"><span>Party</span><button type="button" data-act="close" data-test="party-close" aria-label="Close">✕</button></div>
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
    <p class="fbx2-party-hint" data-test="party-hint"></p>`;
  layer.append(el);
  const input = el.querySelector("input");
  const msg = el.querySelector(".fbx2-party-msg");
  const priv = el.querySelector('[data-act="priv"]');
  const pub = el.querySelector('[data-act="pub"]');
  const hint = el.querySelector(".fbx2-party-hint");
  let cur = null; // the TV's party {group, pub} (null: not the host's phone / not TV mode / not in the lobby)
  let shownPub = null; // what the switch shows (a tap shows at once; the TV's lobby state confirms)
  let pubWait = 0, msgTimer = 0;
  const say = (text, ok = false) => {
    clearTimeout(msgTimer);
    msg.textContent = text;
    msg.classList.toggle("ok", ok);
    if (ok) msgTimer = setTimeout(() => { msg.textContent = ""; }, 2500);
  };
  const paint = () => {
    const on = !!shownPub;
    priv.setAttribute("aria-pressed", String(!on));
    pub.setAttribute("aria-pressed", String(on));
    el.dataset.pub = on ? "1" : "";
    hint.textContent = on ? "Shows in JOIN GAME on every FoxBox TV" : "Only TVs with your invite code or link";
  };
  const api = {
    open: false,
    show() {
      if (!cur) return;
      input.value = cur.group || "";
      input.classList.remove("bad");
      say("");
      shownPub = !!cur.pub;
      paint();
      const b = bar && bar.getBoundingClientRect(); // under the button bar (it wraps to two rows on a narrow phone)
      el.style.top = b && b.height ? `${Math.round(b.bottom + 8)}px` : "";
      el.hidden = false;
      api.open = true;
    },
    close() {
      el.hidden = true;
      api.open = false;
      if (document.activeElement === input) input.blur();
    },
    sync(p) {
      cur = p;
      if (!p) return api.open && api.close();
      if (!api.open) return;
      if (Date.now() >= pubWait) shownPub = !!p.pub;
      paint();
      if (document.activeElement !== input && !input.classList.contains("bad") && input.value !== (p.group || "")) input.value = p.group || "";
    },
  };
  const save = () => {
    if (!cur) return;
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
    if (name !== cur.group) lobby.party && lobby.party({ group: name });
    say("Saved", true);
  };
  const setPub = (on) => {
    if (!cur || shownPub === on) return;
    shownPub = on;
    pubWait = Date.now() + 1500; // until the TV's state has caught up
    paint();
    lobby.party && lobby.party({ pub: on });
  };
  el.querySelector('[data-act="save"]').addEventListener("click", save);
  el.querySelector('[data-act="close"]').addEventListener("click", () => api.close());
  priv.addEventListener("click", () => setPub(false));
  pub.addEventListener("click", () => setPub(true));
  input.addEventListener("input", () => { input.classList.remove("bad"); say(""); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); save(); }
    else if (e.key === "Escape") { e.preventDefault(); api.close(); }
  });
  return api;
}
