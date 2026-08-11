/* The theme, looped under everything.

   Ported from ~/gifworkshop/src/lib/music.ts. Web Audio rather than an <audio>
   element so it shares the one AudioContext with sensei's voice and can be
   faded properly.

   Two things that bite:
   - Browsers refuse to start audio until the user has interacted with the page,
     so this is armed on the first pointerdown rather than called on load.
   - Gain sits at 0.07, well under sensei's blips. It is a room, not a track.
*/

import { getAudioContext } from './blip.js';

const URL = './sounds/dojotheme.mp3';
const VOLUME = 0.07;

let buffer = null;
let source = null;
let gain = null;
let loading = null;

async function load() {
  if (buffer) return buffer;
  if (!loading) {
    loading = fetch(URL)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((raw) => getAudioContext()?.decodeAudioData(raw))
      .then((b) => { buffer = b; return b; })
      .catch(() => null);          // no theme is not an error worth surfacing
  }
  return loading;
}

export async function startMusic(fadeIn = 2.5) {
  const ctx = getAudioContext();
  if (!ctx || source) return;
  const buf = await load();
  if (!buf || source) return;

  gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(VOLUME, ctx.currentTime + fadeIn);

  source = ctx.createBufferSource();
  source.buffer = buf;
  source.loop = true;
  source.connect(gain).connect(ctx.destination);
  source.start(0);
}

export function stopMusic(fade = 1.2) {
  const ctx = getAudioContext();
  if (!ctx || !source) return;
  const s = source, g = gain;
  source = null; gain = null;
  try {
    g.gain.cancelScheduledValues(ctx.currentTime);
    g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + fade);
    s.stop(ctx.currentTime + fade + 0.05);
  } catch { try { s.stop(); } catch { /* already stopped */ } }
}

export function musicPlaying() { return !!source; }
