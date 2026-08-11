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

/** The one AudioContext, shared with music.js. Created lazily and resumed on
    demand — iOS parks it the moment you look away. */
export function getAudioContext() { return ensure(); }

/* Sound preference, cycled by one button:
     all -> music -> sfx -> off
   Gifsmith's four-state knob. Each emitter checks before it plays. */
const MODES = ['all', 'music', 'sfx', 'off'];
const KEY = 'dojo-audio';

let mode = 'all';
try { const v = localStorage.getItem(KEY); if (MODES.includes(v)) mode = v; } catch { /* private mode */ }

export function audioMode() { return mode; }
export function cycleAudio() {
  mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
  try { localStorage.setItem(KEY, mode); } catch { /* private mode */ }
  return mode;
}
export const sfxAllowed = () => mode === 'all' || mode === 'sfx';
export const musicAllowed = () => mode === 'all' || mode === 'music';

export const AUDIO_LABEL = { all: 'Sound: all', music: 'Sound: music', sfx: 'Sound: effects', off: 'Sound: off' };

/** One syllable of sensei's voice. */
export function blip() {
  if (!sfxAllowed()) return;
  note(340 + Math.random() * 180, 0, 0.05, 0.05);
}

/** Belt earned — a three-note power-on arpeggio. */
export function chime() {
  if (!sfxAllowed()) return;
  note(392, 0, 0.18, 0.06);
  note(523, 0.09, 0.18, 0.06);
  note(659, 0.18, 0.26, 0.06);
}

/** Wrong answer. Low and short — a correction, not a buzzer. */
export function thud() {
  if (!sfxAllowed()) return;
  note(180, 0, 0.12, 0.05);
}
