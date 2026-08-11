/* Procedural sound. No files — a shared AudioContext and two tiny sounds.
   Ported from ~/gifworkshop/src/lib/blip.ts. */

let ctx = null;

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  // iOS parks the context in 'suspended' or 'interrupted'; both need a resume
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  return ctx;
}

function note(freq, at, dur, gain) {
  const c = ensure();
  if (!c) return;
  const t = c.currentTime + at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0004, t + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur);
}

let muted = false;
export function setMuted(v) { muted = !!v; }
export function isMuted() { return muted; }

/** One syllable of sensei's voice. */
export function blip() {
  if (muted) return;
  note(340 + Math.random() * 180, 0, 0.05, 0.05);
}

/** Belt earned — a three-note power-on arpeggio. */
export function chime() {
  if (muted) return;
  note(392, 0, 0.18, 0.06);
  note(523, 0.09, 0.18, 0.06);
  note(659, 0.18, 0.26, 0.06);
}

/** Wrong answer. Low and short — a correction, not a buzzer. */
export function thud() {
  if (muted) return;
  note(180, 0, 0.12, 0.05);
}
