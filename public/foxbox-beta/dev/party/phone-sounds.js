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
  // the paddle plays on every stroke: softer, spaced out and a little different each time so it never drones
  const minGapMs = { paddle: 380 }, clipGain = { paddle: 0.45 }, pitchJitter = { paddle: 0.08 };
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
    if (now - (lastPlayed.get(kind) ?? -Infinity) < (minGapMs[kind] ?? 90)) return;
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
        if (pitchJitter[kind]) source.playbackRate.value = 1 + (Math.random() * 2 - 1) * pitchJitter[kind];
        envelope.gain.setValueAtTime(clipGain[kind] ?? 1, ctx.currentTime);
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

  // ── JETPACK ON THE PHONES (Lakota, Oct 31: "the Jetpack sound should play per player's phone, not on the TV") ──
  // The TV puts this player's own flight in their status (host.js jetStatus): jet = { kind: "A" | "C" | "D",
  // phase: "fly" | "warn" | "end", t: the flight's id, left: seconds of flight to go }. Only the flyer's phone
  // gets it. When it changes: fly → the grab sound + the flight loop; warn → the end warning; end → the end.
  //   A tanks     grab: whoosh + ignition thump · flight: a low jet roar · warning: it coughs · end: "pfft"
  //   C hat       grab: a spinning-up whirr · flight: a whirring propeller · warning: it winds down · end: plink
  //   D balloons  grab: a rubbery squeak · flight: soft creaks · warning + end: three pops, one by one
  // A phone that reloads mid-flight picks the loop back up silently for the time that's left (no grab sound)
  // if its sound is unlocked, else stays quiet until the next phase; every loop also stops by itself
  // JET_SPARE_S after its flight should have ended, so nothing can drone on.
  // QA: if globalThis.__padSfxLog is an array, each sound that plays is pushed to it ({ type, kind, t, at }).
  const jet = (() => {
    const FLIGHT_S = 5, JET_SPARE_S = 1.5, POP_GAP_MS = 500;
    let bus = null, noiseBuf = null, loop = null, seen = null, popTimer = null;
    const note = (type, kind, t) => {
      const log = globalThis.__padSfxLog;
      if (!Array.isArray(log)) return;
      log.push({ type, kind, t, at: Date.now() });
      if (log.length > 400) log.shift();
    };
    // a bus into the phone's master, through a gentle compressor (overlapping sounds never clip) + one noise buffer
    function out() {
      if (!bus) {
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -12;
        comp.knee.value = 10;
        comp.ratio.value = 4;
        comp.attack.value = 0.003;
        comp.release.value = 0.15;
        comp.connect(master);
        bus = ctx.createGain();
        bus.gain.value = 1;
        bus.connect(comp);
        const len = Math.floor(ctx.sampleRate * 0.6);
        noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      return bus;
    }
    function env(g, t, a, peak, dur) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    }
    function tone({ type = "sine", f0, f1, dur, peak = 0.5, attack = 0.005, t = 0, glide = "exp", vib = 0, vibRate = 0, to = out() }) {
      const now = ctx.currentTime + t, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, now);
      if (f1 && f1 !== f0) glide === "exp" ? o.frequency.exponentialRampToValueAtTime(f1, now + dur) : o.frequency.linearRampToValueAtTime(f1, now + dur);
      if (vib) {
        const l = ctx.createOscillator(), lg = ctx.createGain();
        l.frequency.value = vibRate;
        lg.gain.value = vib;
        l.connect(lg);
        lg.connect(o.frequency);
        l.start(now);
        l.stop(now + dur + 0.02);
      }
      env(g, now, attack, peak, dur);
      o.connect(g);
      g.connect(to);
      o.start(now);
      o.stop(now + dur + 0.02);
    }
    function noise({ dur, peak = 0.4, f0 = 1200, f1, q = 1.2, type = "bandpass", t = 0, attack = 0.003 }) {
      const now = ctx.currentTime + t, src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = noiseBuf || (out(), noiseBuf);
      f.type = type;
      f.Q.value = q;
      f.frequency.setValueAtTime(f0, now);
      if (f1) f.frequency.exponentialRampToValueAtTime(f1, now + dur);
      env(g, now, attack, peak, dur);
      src.connect(f);
      f.connect(g);
      g.connect(out());
      src.start(now, Math.random() * 0.2);
      src.stop(now + dur + 0.02);
    }
    const jitter = (amt) => 1 + (Math.random() * 2 - 1) * amt;
    const semis = (base, n) => base * Math.pow(2, n / 12);
    const node = (v) => { const g = ctx.createGain(); g.gain.value = v; return g; };
    const filt = (type, freq, q = 0.8) => { const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; return f; };
    const noiseLoop = () => { const n = ctx.createBufferSource(); n.buffer = noiseBuf || (out(), noiseBuf); n.loop = true; return n; };
    /** a balloon pop: a sharp crack, a snap of rubber, a puff of air */
    function balloonPop(pitch = 1) {
      noise({ dur: 0.05, peak: 0.6, f0: 3200 * pitch, q: 0.7, type: "highpass" });
      tone({ type: "square", f0: 1400 * pitch, f1: 300, dur: 0.045, peak: 0.12 });
      noise({ dur: 0.18, peak: 0.12, f0: 900, f1: 300, q: 0.8, t: 0.03 });
    }
    const GRAB = {
      A() {
        noise({ dur: 0.55, peak: 0.26, f0: 300, f1: 2600, q: 0.7 });
        tone({ type: "sine", f0: 95, f1: 42, dur: 0.3, peak: 0.55, attack: 0.004 });
        noise({ dur: 0.4, peak: 0.2, f0: 180, f1: 900, q: 0.6, type: "lowpass", t: 0.02 });
        tone({ type: "triangle", f0: 220, f1: 660, dur: 0.4, peak: 0.12, attack: 0.02, t: 0.05 });
      },
      C() {
        tone({ type: "triangle", f0: 140, f1: 460, dur: 0.55, peak: 0.22, attack: 0.03, vib: 60, vibRate: 22 });
        noise({ dur: 0.5, peak: 0.12, f0: 500, f1: 1800, q: 1.2 });
        tone({ type: "sine", f0: semis(784, 0), dur: 0.08, peak: 0.08, t: 0.36 });
        tone({ type: "sine", f0: semis(784, 7), dur: 0.12, peak: 0.08, t: 0.44 });
      },
      D() {
        tone({ type: "sine", f0: 720, f1: 1250, dur: 0.16, peak: 0.24, attack: 0.01, vib: 70, vibRate: 38, glide: "lin" });
        tone({ type: "sine", f0: 980, f1: 1450, dur: 0.14, peak: 0.2, attack: 0.01, vib: 60, vibRate: 42, glide: "lin", t: 0.15 });
        tone({ type: "triangle", f0: 360, f1: 520, dur: 0.22, peak: 0.06, t: 0.02 });
      },
    };
    const WARN = {
      A() { // the tanks cough
        [0, 0.17, 0.41, 0.6, 0.83].forEach((t) => noise({ dur: 0.08, peak: 0.26, f0: 420, q: 0.8, type: "lowpass", t }));
        [0.02, 0.43].forEach((t) => tone({ type: "sine", f0: 120, f1: 60, dur: 0.1, peak: 0.22, t }));
      },
      C() { // a tired putt-putt as the motor starts winding down
        [0, 0.22, 0.5].forEach((t, i) => tone({ type: "square", f0: 140 - i * 25, f1: 90 - i * 15, dur: 0.06, peak: 0.07, t }));
      },
      D() { balloonPop(1.1); }, // the first balloon goes
    };
    const END = {
      A() { noise({ dur: 0.3, peak: 0.18, f0: 1800, f1: 300, q: 0.9 }); }, // pfft, empty
      C() { // the propeller stops with a little plink
        tone({ type: "triangle", f0: 620, f1: 310, dur: 0.12, peak: 0.12 });
        noise({ dur: 0.2, peak: 0.08, f0: 1200, f1: 300, q: 0.9, t: 0.02 });
      },
      D() { // the last balloon, and down you go
        balloonPop(0.8);
        tone({ type: "sine", f0: 880, f1: 280, dur: 0.45, peak: 0.1, attack: 0.02, t: 0.06 });
      },
    };
    /** The flight loop for item `kind` into `dest`: continuous sources in srcs (stopped once, at the end). */
    const LOOP = {
      A(dest, srcs) { // a low jet roar: rumbling noise + a sawtooth growl, fluttering; coughs in the warning
        const roar = node(0.75), n = noiseLoop(), lp = filt("lowpass", 480, 0.9);
        n.connect(lp); lp.connect(roar);
        const saw = ctx.createOscillator(), sl = filt("lowpass", 190, 0.7), sg = node(0.5);
        saw.type = "sawtooth";
        saw.frequency.value = 47;
        saw.connect(sl); sl.connect(sg); sg.connect(roar);
        const lfo = ctx.createOscillator(), lg = node(0.18);
        lfo.frequency.value = 11;
        lfo.connect(lg); lg.connect(roar.gain);
        roar.connect(dest);
        srcs.push(n, saw, lfo);
        return (t) => {
          const pat = [1, 1, 0, 1, 0, 0, 1, 0]; // the cough rhythm the tanks' flames show on the TV
          roar.gain.cancelScheduledValues(t);
          for (let i = 0; i < 14; i++) roar.gain.setValueAtTime(pat[i % 8] ? 0.75 : 0.08, t + i / 14);
          saw.frequency.setValueAtTime(47, t);
          saw.frequency.linearRampToValueAtTime(30, t + 1);
          lp.frequency.setValueAtTime(480, t);
          lp.frequency.exponentialRampToValueAtTime(260, t + 1);
        };
      },
      C(dest, srcs) { // a whirring propeller: a chopped hum + airy noise; winds down in the warning
        const chop = node(0.5), hum = ctx.createOscillator(), hg = node(0.32);
        hum.type = "triangle";
        hum.frequency.value = 330;
        hum.connect(hg); hg.connect(chop);
        const n = noiseLoop(), bp = filt("bandpass", 1500, 1.1), ng = node(0.9);
        n.connect(bp); bp.connect(ng); ng.connect(chop);
        const blade = ctx.createOscillator(), bd = node(0.45);
        blade.type = "square";
        blade.frequency.value = 17;
        blade.connect(bd); bd.connect(chop.gain);
        chop.connect(dest);
        srcs.push(hum, n, blade);
        return (t) => {
          blade.frequency.setValueAtTime(17, t);
          blade.frequency.linearRampToValueAtTime(3.5, t + 1);
          hum.frequency.setValueAtTime(330, t);
          hum.frequency.exponentialRampToValueAtTime(105, t + 1);
          bp.frequency.setValueAtTime(1500, t);
          bp.frequency.exponentialRampToValueAtTime(420, t + 1);
          dest.gain.setTargetAtTime(0.0001, t + 0.35, 0.25);
        };
      },
      D(dest, srcs, left, own) { // no engine: soft rubbery creaks now and then over the flight
        const t0 = ctx.currentTime;
        for (const t of [0.7, 1.55, 2.35, 3.3, 4.05].map((x) => x - (FLIGHT_S - left) + (Math.random() - 0.5) * 0.3)) {
          if (t < 0.1 || t > left - 1.1) continue; // only ahead, and none in the warning
          const at = t0 + t, o = ctx.createOscillator(), bp = filt("bandpass", 950, 5), g = ctx.createGain(), f0 = 170 * jitter(0.15);
          o.type = "sawtooth";
          o.frequency.setValueAtTime(f0, at);
          o.frequency.linearRampToValueAtTime(f0 * 1.45, at + 0.2);
          g.gain.setValueAtTime(0.0001, at);
          g.gain.exponentialRampToValueAtTime(0.9, at + 0.04);
          g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
          o.connect(bp); bp.connect(g); g.connect(dest);
          o.start(at);
          o.stop(at + 0.25);
          own.push(o);
        }
        return () => {};
      },
    };
    const LEVEL = { A: 0.24, C: 0.2, D: 0.3 };
    function startLoop(kind, left, t, label) {
      stopLoop(0.05, "replaced");
      if (!audible()) return;
      const t0 = ctx.currentTime, dest = ctx.createGain();
      dest.gain.setValueAtTime(0.0001, t0);
      dest.gain.exponentialRampToValueAtTime(LEVEL[kind], t0 + 0.3);
      dest.gain.setTargetAtTime(0.0001, t0 + left + JET_SPARE_S, 0.1); // silent by then whatever happens
      dest.connect(out());
      const srcs = [], own = [];
      const sputter = LOOP[kind](dest, srcs, left, own);
      for (const src of srcs) src.start(t0);
      const rec = { kind, t, dest, srcs, own, sputter, timer: 0 };
      // the safety net: a loop never outlives its flight by more than JET_SPARE_S (a lost "end", a TV gone)
      rec.timer = setTimeout(() => { if (loop === rec) stopLoop(0.2, "timeout"); }, (left + JET_SPARE_S) * 1000);
      loop = rec;
      note(label, kind, t);
    }
    function stopLoop(fade = 0.12, why = "end") {
      const rec = loop;
      if (!rec) return;
      loop = null;
      clearTimeout(rec.timer);
      try {
        const now = ctx.currentTime;
        if (rec.dest.gain.cancelAndHoldAtTime) rec.dest.gain.cancelAndHoldAtTime(now);
        else rec.dest.gain.cancelScheduledValues(now);
        rec.dest.gain.setTargetAtTime(0.0001, now, fade / 3);
        for (const src of rec.srcs) { try { src.stop(now + fade + 0.05); } catch {} }
        for (const o of rec.own) { try { o.disconnect(); } catch {} }
        setTimeout(() => { try { rec.dest.disconnect(); } catch {} }, (fade + 0.2) * 1000);
      } catch {}
      note("loop:stop", rec.kind, rec.t);
      if (why !== "end") note("loop:" + why, rec.kind, rec.t);
    }
    function play(table, type, kind, t) {
      if (!audible()) return;
      try {
        table[kind]();
        note(type, kind, t);
      } catch {}
    }
    document.addEventListener("visibilitychange", () => { if (document.hidden) stopLoop(0.05, "hidden"); });
    return {
      status(st) {
        const j = st && st.state === "playing" && st.jet && typeof st.jet === "object" && LOOP[st.jet.kind] ? st.jet : null;
        if (!j) { // not flying (or the round is over): no loop, nothing pending
          clearTimeout(popTimer);
          stopLoop(0.15, "cleared");
          seen = null;
          return;
        }
        const key = j.t + ":" + j.phase;
        if (seen && seen.key === key) return;
        const sameFlight = !!seen && seen.t === j.t;
        seen = { key, t: j.t, phase: j.phase };
        const left = Math.max(0, Number(j.left) || 0);
        if (j.phase === "fly") {
          if (sameFlight) return;
          const fresh = left > FLIGHT_S - 0.6; // just grabbed (a reload mid-flight is quiet: no grab sound)
          if (fresh) play(GRAB, "jetGet", j.kind, j.t);
          if (left > 0.8) startLoop(j.kind, left, j.t, fresh ? "loop:start" : "loop:resume");
        } else if (j.phase === "warn") {
          if (!sameFlight) return; // first heard of this flight in its warning (a reload): stay quiet
          if (loop && loop.t === j.t) { try { loop.sputter(ctx.currentTime); note("loop:sputter", j.kind, j.t); } catch {} }
          play(WARN, "jetSputter", j.kind, j.t);
          clearTimeout(popTimer);
          if (j.kind === "D") popTimer = setTimeout(() => { // the second balloon, half a second later
            if (seen && seen.t === j.t && seen.phase === "warn" && audible()) { try { balloonPop(0.95); note("jetPop", "D", j.t); } catch {} }
          }, POP_GAP_MS);
        } else if (j.phase === "end") {
          clearTimeout(popTimer);
          stopLoop(j.kind === "A" ? 0.15 : 0.08, "end");
          if (sameFlight) play(END, "jetEnd", j.kind, j.t);
        }
      },
    };
  })();
  // ── end JETPACK ON THE PHONES ──
  return {
    get ready() { return ready; },
    status(st) {
      jet.status(st); // JETPACK ON THE PHONES: this player's own flight (above)
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
        if (gameId === "row" && role === "captain" && !next.shot) return; // FIRE while reloading: no twang
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
