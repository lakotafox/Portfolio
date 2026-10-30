// Local phone feedback plus the host's shared spoken countdown. Device volume controls the sound.
export function createPhoneSounds({ onReady = () => {} } = {}) {
  const noop = { ready: false, status() {}, lobby() {}, input() {}, cue() {} };
  const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!globalThis.FOXBOX_LOBBY2 || !Context) return noop;

  let ctx = null, master = null, previousState = null, previousLobby = null;
  let clipsReady = false, ready = false, cueVersion = 0;
  const voices = new Set(), lastPlayed = new Map(), seenCues = new Set();
  const countdownVoices = new Set(), activeClips = new Map();
  const bytes = new Map(), buffers = new Map();
  const cueClips = {
    join: "join", pick: "pick", turn: "turn", roll: "roll", win: "win",
    finish: "lose", out: "lose", shove: "shove", paddle: "paddle", fire: "fire",
  };
  const countdownClips = ["three", "two", "one", "go"];
  const clipNames = [...countdownClips, ...new Set(Object.values(cueClips))];
  const loadingClips = new Set(), decodedClips = new Map();
  const hint = document.createElement("div");
  hint.textContent = "Tap anywhere for phone sound";
  hint.setAttribute("role", "status");
  hint.style.cssText = "position:fixed;bottom:calc(14px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);z-index:1000;pointer-events:none;white-space:nowrap;padding:9px 14px;border-radius:20px;background:#172c3eee;color:#fff;font:600 12px system-ui;box-shadow:0 2px 12px #0003";
  hint.hidden = true;
  document.body.append(hint);
  function updateReady() {
    const next = !!ctx && ctx.state === "running" && clipsReady && !document.hidden;
    hint.hidden = !previousState || next || document.hidden;
    if (next !== ready) { ready = next; onReady(ready); }
  }
  function fetchBytes(name) {
    const request = fetch(new URL(`./sounds/${name}.m4a`, import.meta.url))
      .then((r) => r.ok ? r.arrayBuffer() : null).catch(() => null);
    bytes.set(name, request);
    request.then((data) => {
      if (!data && bytes.get(name) === request) bytes.delete(name);
    });
    return request;
  }
  for (const name of clipNames) fetchBytes(name);
  const patterns = {
    join: [[523, 0, .1], [784, .1, .15]],
    roll: [[330, 0, .07], [440, .06, .07], [660, .12, .13]],
    pick: [[660, 0, .09], [880, .09, .13]],
    turn: [[784, 0, .09], [1047, .12, .16]],
    win: [[523, 0, .12], [659, .12, .12], [784, .24, .12], [1047, .36, .22]],
    finish: [[330, 0, .2, 220], [220, .2, .25, 110]],
    out: [[330, 0, .2, 165]],
    bonk: [[260, 0, .1, 700]],
    shove: [[150, 0, .12, 70]],
    paddle: [[220, 0, .09, 100]],
    fire: [[600, 0, .12, 120]],
  };
  function loadClip(name) {
    if (loadingClips.has(name) || decodedClips.has(name)) return;
    loadingClips.add(name);
    const data = bytes.get(name) || fetchBytes(name);
    buffers.set(name, data.then((b) => b ? ctx.decodeAudioData(b) : null).catch(() => null).then((buffer) => {
      loadingClips.delete(name);
      if (buffer) decodedClips.set(name, buffer);
      // decodeAudioData may consume its bytes, including on failure. A later gesture
      // can fetch fresh bytes; pending work and successfully decoded clips are kept.
      else if (bytes.get(name) === data) bytes.delete(name);
      clipsReady = countdownClips.every((clip) => decodedClips.has(clip));
      updateReady();
      return buffer;
    }));
  }
  function unlock() {
    if (document.hidden) return;
    try {
      if (!ctx) {
        ctx = new Context();
        master = ctx.createGain();
        master.gain.value = .65;
        master.connect(ctx.destination);
        ctx.addEventListener("statechange", updateReady);
      }
      // Retry only when the player taps or presses a key, never in a background loop.
      for (const name of clipNames) loadClip(name);
      if (ctx.state === "suspended" || ctx.state === "interrupted") ctx.resume().then(updateReady).catch(() => {});
      updateReady();
    } catch {}
  }
  document.addEventListener("pointerdown", unlock, true);
  // Touch browsers can grant audio activation only when the finger lifts. Retrying
  // here lets the very first tap unlock audio, including after a phone reload.
  document.addEventListener("pointerup", unlock, true);
  document.addEventListener("click", unlock, true);
  document.addEventListener("keydown", unlock, true);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) for (const voice of voices) { try { voice.stop(); } catch {} }
    updateReady();
  });
  const audible = () => !!ctx && ctx.state === "running" && !document.hidden;
  function track(source, envelope, clip) {
    voices.add(source);
    source.onended = () => {
      voices.delete(source);
      countdownVoices.delete(source);
      // A fading older source must not clear the newer source for the same clip.
      if (clip && activeClips.get(clip)?.source === source) activeClips.delete(clip);
      source.disconnect();
      if (envelope) envelope.disconnect();
    };
  }
  function play(kind) {
    if (!audible()) return;
    const now = performance.now();
    if (now - (lastPlayed.get(kind) ?? -Infinity) < 90) return;
    lastPlayed.set(kind, now);
    try {
      const name = cueClips[kind], buffer = decodedClips.get(name);
      if (buffer) {
        const active = activeClips.get(name);
        // An elimination immediately followed by results shares one game-over cue.
        // A distinct result after that cue has ended can play it again.
        if (active && name === "lose") return;
        if (active) {
          const end = ctx.currentTime + .02;
          active.envelope.gain.cancelScheduledValues(ctx.currentTime);
          active.envelope.gain.setValueAtTime(active.envelope.gain.value, ctx.currentTime);
          active.envelope.gain.linearRampToValueAtTime(0, end);
          active.source.stop(end);
        }
        const source = ctx.createBufferSource(), envelope = ctx.createGain();
        source.buffer = buffer;
        envelope.gain.setValueAtTime(1, ctx.currentTime);
        source.connect(envelope);
        envelope.connect(master);
        activeClips.set(name, { source, envelope });
        track(source, envelope, name);
        source.start();
        return;
      }
      // Optional feedback clips never delay an event: use the existing tone now if
      // fetching/decoding is pending or failed, without replaying it later.
      for (const [frequency, delay, duration, end = frequency] of patterns[kind] || []) {
        const oscillator = ctx.createOscillator(), envelope = ctx.createGain();
        const start = ctx.currentTime + delay;
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(frequency, start);
        oscillator.frequency.exponentialRampToValueAtTime(end, start + duration);
        envelope.gain.setValueAtTime(0, start);
        envelope.gain.linearRampToValueAtTime(.14, start + .006);
        envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
        oscillator.connect(envelope);
        envelope.connect(master);
        track(oscillator, envelope);
        oscillator.start(start);
        oscillator.stop(start + duration + .01);
      }
    } catch {}
  }
  async function speak(name, version = null) {
    if (!audible()) return;
    const requestedAt = performance.now();
    try {
      const buffer = await buffers.get(name);
      // A late network/decode response must never play an old number over GO.
      if (!buffer || !audible() || performance.now() - requestedAt > 400 || (version !== null && version !== cueVersion)) return;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(master);
      track(source);
      if (version !== null) countdownVoices.add(source);
      source.start();
    } catch {}
  }
  return {
    get ready() { return ready; },
    status(st) {
      if (!st || st.state === previousState) return;
      previousState = st.state;
      updateReady();
      if (st.state === "results") {
        const won = st.won ?? st.place === 1;
        play(won ? "win" : "finish");
      } else if (st.state === "lobby") play("join");
      else if (st.state === "out") play("out");
    },
    lobby(st, myId) {
      if (!st) return;
      if (previousLobby) {
        if (st.phase === "lobby" && st.pickerId === myId && previousLobby.pickerId !== myId) play("turn");
        else if (st.look?.seed !== previousLobby.seed) play("roll");
        else if (st.selectedGameId && st.selectedGameId !== previousLobby.selectedGameId) play("pick");
      }
      previousLobby = { pickerId: st.pickerId, seed: st.look?.seed, selectedGameId: st.selectedGameId };
    },
    input(next, prev, gameId, role) {
      if (previousState !== "playing") return;
      if ((next.b && !prev.b) || (next.c && !prev.c)) {
        play(gameId === "row" ? (role === "captain" ? "fire" : "paddle") : gameId === "snowball" ? "shove" : "bonk");
      }
    },
    cue(message, myId) {
      if (!message) return;
      if (!["three", "two", "one", "go"].includes(message.cue) || typeof message.id !== "string" || seenCues.has(message.id)) return;
      seenCues.add(message.id);
      if (seenCues.size > 64) seenCues.delete(seenCues.values().next().value);
      // Every phone receives every cue. A later number or GO invalidates delayed decodes
      // and stops older countdown speech, even if that later number belongs to another phone.
      const version = ++cueVersion;
      for (const source of countdownVoices) { try { source.stop(); } catch {} }
      countdownVoices.clear();
      if (message.targetId && message.targetId !== myId) return;
      speak(message.cue, version);
    },
  };
}
