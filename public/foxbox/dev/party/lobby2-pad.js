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

  // name / character, one tap away
  const bar = document.createElement("div");
  bar.className = "fbx2-padbar";
  bar.style.cssText =
    "position:absolute;right:max(10px, env(safe-area-inset-right));top:max(10px, env(safe-area-inset-top));z-index:5;display:flex;gap:8px;";
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
  mk("✏️ Name", "lobby-edit-name", () => editName());
  const charBtn = mk("🧍 Character", "lobby-character", () => changeCharacter());
  layer.append(bar);
  document.body.append(layer);

  const shell = mountLobby(host, { mode: "phone", send, me: myId() });
  let lastJson = "";

  return {
    sync({ screen, connected, lobby: st }) {
      const show = !!(st && connected && screen === "pad-screen" && st.phase === "lobby");
      if (layer.hidden === show) layer.hidden = !show;
      document.body.classList.toggle("fbx2-lobby-on", show);
      if (!st) return;
      charBtn.hidden = st.currentGameId !== "sky";
      const json = JSON.stringify(st);
      if (json !== lastJson) {
        lastJson = json;
        shell.update({ ...st, me: myId() });
      }
    },
  };
}
