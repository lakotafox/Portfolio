/**
 * net.js — how the TV page and the phones talk.
 *
 * By default: the local party server (tools/party-server.ts) — a WebSocket at /ws and fetch()
 * for /api/*. The web version of FoxBox (lakotafox.com/foxbox, no server) sets
 * globalThis.FOXBOX_NET = "p2p" (and FOXBOX_ROLE = "host" | "pad") before loading the page
 * script; then ./net-p2p.js (PeerJS / WebRTC, only shipped with the web build) stands in for
 * both, with the same messages. Pages `await ready` before their first connect.
 */
export const isP2P = globalThis.FOXBOX_NET === "p2p";

let p2p = null;
export const ready = isP2P
  ? import("./net-p2p.js").then(async (m) => {
      p2p = m;
      await m.init(globalThis.FOXBOX_ROLE === "pad" ? "pad" : "host");
    })
  : Promise.resolve();

/** A WebSocket-like object ({readyState, send, close, onopen, onmessage, onclose, onerror}). */
export function openSocket(role) {
  if (p2p) return p2p.openSocket(role);
  return new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws?role=${role}`);
}

/** fetch() for the /api/* calls (characters, selfie, drawing, info). */
export function api(path, init) {
  return p2p ? p2p.api(path, init) : fetch(path, init);
}
