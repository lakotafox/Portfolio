// Sky Scramble — synthesised sound effects (Art agent). WebAudio only, no files.
//
//   const sfx = createSfx();  sfx.play(simEvent);
//   optional: sfx.setVolume(0..1), sfx.unlock()
//
// Quiet by default (the platform plays music). The AudioContext is created lazily on
// the first play()/unlock() and resumed on the first user gesture. Never throws.

const MASTER = 0.25;

// minimum seconds between two sounds of the same type, and per-player for bounces
const GAP = { bounce: 0.05, springLoad: 0.05, spring: 0.07, pop: 0.05, bonk: 0.06, stomp: 0.04, out: 0.12, finish: 0.8 };
const MAX_VOICES = 10;

// two octaves of C major pentatonic (semitones above C4): any mix of players' notes stays in key
const SCALE2 = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
// scale-step offsets for repeat bounces on the same cloud: up, up, back, down...
const MOTIF = [0, 1, 2, 1, 0, -1];

export function createSfx(opts = {}) {
  let ac = null, master = null, noiseBuf = null, dead = false;
  let volume = opts.volume == null ? MASTER : opts.volume;
  const lastByType = {};
  const lastBounceByPlayer = {};
  let voices = 0, resumeTries = 0;
  const recent = []; // timestamps of recent bounces (density limiter)
  const bounceState = {}; // playerId -> { step, rep } for the height-based bounce tune

  function ensure() {
    if (dead) return null;
    if (ac) return ac;
    try {
      const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!AC) { dead = true; return null; }
      ac = new AC();
      const comp = ac.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 12;
      comp.ratio.value = 4;
      comp.attack.value = 0.003;
      comp.release.value = 0.15;
      master = ac.createGain();
      master.gain.value = volume;
      master.connect(comp);
      comp.connect(ac.destination);
      const len = Math.floor(ac.sampleRate * 0.6);
      noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) {
      dead = true;
      ac = null;
    }
    return ac;
  }

  function unlock() {
    try {
      const c = ensure();
      if (c && c.state === 'suspended') c.resume().catch(() => {});
    } catch (e) { /* ignore */ }
  }

  try {
    if (typeof window !== 'undefined') {
      const once = () => {
        unlock();
        for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.removeEventListener(ev, once, true);
      };
      for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(ev, once, true);
    }
  } catch (e) { /* ignore */ }

  // ---- building blocks -----------------------------------------------------
  function voice(dur) {
    voices++;
    setTimeout(() => { voices = Math.max(0, voices - 1); }, (dur + 0.05) * 1000);
  }

  function env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  function tone({ type = 'sine', f0, f1, dur, peak = 0.5, attack = 0.005, t = 0, glide = 'exp', vib = 0, vibRate = 0 }) {
    const now = ac.currentTime + t;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, now);
    if (f1 && f1 !== f0) {
      if (glide === 'exp') o.frequency.exponentialRampToValueAtTime(f1, now + dur);
      else o.frequency.linearRampToValueAtTime(f1, now + dur);
    }
    if (vib) {
      const l = ac.createOscillator();
      const lg = ac.createGain();
      l.frequency.value = vibRate;
      lg.gain.value = vib;
      l.connect(lg);
      lg.connect(o.frequency);
      l.start(now);
      l.stop(now + dur + 0.02);
    }
    env(g, now, attack, peak, dur);
    o.connect(g);
    g.connect(master);
    o.start(now);
    o.stop(now + dur + 0.02);
  }

  function noise({ dur, peak = 0.4, f0 = 1200, f1, q = 1.2, type = 'bandpass', t = 0, attack = 0.003 }) {
    const now = ac.currentTime + t;
    const s = ac.createBufferSource();
    s.buffer = noiseBuf;
    const f = ac.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, now);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, now + dur);
    const g = ac.createGain();
    env(g, now, attack, peak, dur);
    s.connect(f);
    f.connect(g);
    g.connect(master);
    s.start(now, Math.random() * 0.2);
    s.stop(now + dur + 0.02);
  }

  const semis = (base, n) => base * Math.pow(2, n / 12);
  const jitter = (amt) => 1 + (Math.random() * 2 - 1) * amt;

  // ---- the sounds ----------------------------------------------------------
  const SOUNDS = {
    bounce(ev) {
      // Pitch follows the cloud's height, so climbing plays a rising pentatonic tune (wrapping
      // every two octaves) instead of one note over and over. Bouncing on the same cloud cycles
      // a little motif and gets quieter, which is what wore people out before.
      const pid = ev.playerId | 0;
      const step = Math.round((ev.y || 0) / 150);
      const st = bounceState[pid] || (bounceState[pid] = { step: null, rep: 0 });
      st.rep = st.step === step ? st.rep + 1 : 0;
      st.step = step;
      const deg = (((step + MOTIF[st.rep % MOTIF.length]) % SCALE2.length) + SCALE2.length) % SCALE2.length;
      const base = semis(262, SCALE2[deg]) * jitter(0.008);
      const tire = Math.max(0.55, 1 - st.rep * 0.12);
      // density limiter: quieter when many bounce together
      const nowS = ac.currentTime;
      while (recent.length && nowS - recent[0] > 0.25) recent.shift();
      recent.push(nowS);
      const k = tire / Math.sqrt(recent.length);
      tone({ type: 'sine', f0: base * 0.8, f1: base * 1.06, dur: 0.12, peak: 0.3 * k, attack: 0.006 });
      tone({ type: 'triangle', f0: base * 2, f1: base * 2.04, dur: 0.06, peak: 0.05 * k, t: 0.008 });
      return 0.14;
    },
    // landing on a spring: a quick squish (the hold is only a few frames)
    springLoad() {
      tone({ type: 'sine', f0: 320, f1: 120, dur: 0.1, peak: 0.4, attack: 0.003 });
      noise({ dur: 0.08, peak: 0.18, f0: 600, q: 0.9, type: 'lowpass' });
      return 0.1;
    },
    // the launch: big boing + whoosh + a sparkle on top
    spring() {
      const b = 150 * jitter(0.03);
      tone({ type: 'sine', f0: b, f1: b * 5, dur: 0.5, peak: 0.55, vib: 50, vibRate: 20 });
      tone({ type: 'triangle', f0: b * 2, f1: b * 7, dur: 0.3, peak: 0.13, t: 0.02 });
      noise({ dur: 0.45, peak: 0.2, f0: 500, f1: 4000, q: 0.8, t: 0.03 });
      [0, 4, 7, 12].forEach((n, i) => tone({ type: 'sine', f0: semis(1046.5, n), dur: 0.08, peak: 0.07, t: 0.12 + i * 0.05 }));
      return 0.6;
    },
    pop() {
      noise({ dur: 0.09, peak: 0.45, f0: 2400, f1: 900, q: 2.5 });
      tone({ type: 'sine', f0: 700 * jitter(0.06), f1: 1500, dur: 0.06, peak: 0.3 });
      return 0.12;
    },
    bonk() {
      noise({ dur: 0.26, peak: 0.32, f0: 3200, f1: 420, q: 1.6 });
      tone({ type: 'sine', f0: 900, f1: 260, dur: 0.2, peak: 0.12, attack: 0.02 });
      return 0.3;
    },
    stomp() {
      tone({ type: 'sine', f0: 170, f1: 48, dur: 0.22, peak: 0.85, attack: 0.002 });
      noise({ dur: 0.07, peak: 0.45, f0: 900, q: 0.8, type: 'lowpass' });
      // the comic "bonk" knock
      tone({ type: 'triangle', f0: 620 * jitter(0.04), f1: 380, dur: 0.12, peak: 0.32, t: 0.005 });
      tone({ type: 'square', f0: 1240, f1: 760, dur: 0.05, peak: 0.05, t: 0.005 });
      return 0.25;
    },
    out() {
      tone({ type: 'sine', f0: 1300, f1: 180, dur: 0.85, peak: 0.32, attack: 0.02, vib: 18, vibRate: 7 });
      tone({ type: 'triangle', f0: 120, f1: 60, dur: 0.25, peak: 0.25, t: 0.82 });
      return 1.1;
    },
    finish() {
      const notes = [0, 4, 7, 12, 16, 19, 24];
      notes.forEach((n, i) => {
        tone({ type: 'triangle', f0: semis(523.25, n), dur: i === notes.length - 1 ? 0.6 : 0.16, peak: 0.28, t: i * 0.085 });
        tone({ type: 'sine', f0: semis(523.25, n + 12), dur: 0.1, peak: 0.06, t: i * 0.085 });
      });
      noise({ dur: 0.5, peak: 0.06, f0: 7000, q: 0.7, type: 'highpass', t: notes.length * 0.085 - 0.05 });
      return 1.2;
    },
  };

  function play(ev) {
    try {
      if (!ev || !SOUNDS[ev.type]) return;
      const c = ensure();
      if (!c || !master) return;
      if (c.state === 'suspended') {
        // a few early tries (autoplay may be allowed on the TV); after that only a user
        // gesture resumes it, so a locked browser doesn't log a warning per sound
        if (resumeTries < 3) { resumeTries++; c.resume().catch(() => {}); }
        return; // don't queue up a backlog while locked
      }
      if (c.state !== 'running') return;
      const t = c.currentTime;
      const gap = GAP[ev.type] || 0.05;
      if (t - (lastByType[ev.type] ?? -9) < gap) return;
      if (ev.type === 'bounce') {
        const pid = ev.playerId | 0;
        if (t - (lastBounceByPlayer[pid] ?? -9) < 0.12) return;
        lastBounceByPlayer[pid] = t;
      }
      const important = ev.type === 'finish' || ev.type === 'out' || ev.type === 'stomp' || ev.type === 'spring';
      if (voices >= MAX_VOICES && !important) return;
      lastByType[ev.type] = t;
      const dur = SOUNDS[ev.type](ev);
      voice(dur || 0.2);
    } catch (e) { /* never break the game for sound */ }
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(1, +v || 0));
    try { if (master) master.gain.setTargetAtTime(volume, ac.currentTime, 0.02); } catch (e) { /* ignore */ }
  }

  return { play, setVolume, unlock };
}
