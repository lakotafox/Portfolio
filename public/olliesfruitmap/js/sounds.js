// Sounds, the Gifsmith way: clicks.mp3 is a sprite file holding 8 separate
// click recordings — decode it once with Web Audio and play ONE random
// [offset, duration] slice per press. The menu whoosh is a single sound,
// so a plain Audio element is fine there. Sounds only ever fire from user
// gestures; mute persists; audio failures never break the UI.
const KEY = 'ofm-muted';

let muted = localStorage.getItem(KEY) === '1';

// [offset s, duration s] of each click inside sounds/clicks.mp3
// (same sprite table Gifsmith ships).
const CLICKS = [
  [1.083, 0.16], [1.871, 0.17], [2.125, 0.19], [3.582, 0.2],
  [4.515, 0.2], [5.034, 0.19], [5.403, 0.19], [6.331, 0.19],
];

let ctx = null;
let clickBuffer = null;
let decoding = false;

function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

async function loadClicks() {
  const ac = audioCtx();
  if (!ac || clickBuffer || decoding) return;
  decoding = true;
  try {
    const res = await fetch('sounds/clicks.mp3');
    clickBuffer = await ac.decodeAudioData(await res.arrayBuffer());
  } catch {
    decoding = false; // allow retry on a later gesture
  }
}

// Floppy's talk voice: a soft triangle blip at a random pitch, fired
// every couple of typed characters by the typewriter.
export function talkBlip() {
  if (muted) return;
  try {
    const ac = audioCtx();
    if (!ac || ac.state !== 'running') return;
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 340 + Math.random() * 180;
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.0004, t + 0.05);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  } catch {
    /* decoration only */
  }
}

export function click() {
  if (muted) return;
  try {
    const ac = audioCtx();
    if (!ac) return;
    loadClicks();
    if (!clickBuffer || ac.state !== 'running') return;
    const [offset, duration] = CLICKS[Math.floor(Math.random() * CLICKS.length)];
    const src = ac.createBufferSource();
    src.buffer = clickBuffer;
    const gain = ac.createGain();
    gain.gain.value = 0.5;
    src.connect(gain);
    gain.connect(ac.destination);
    src.start(0, offset, duration);
  } catch {
    /* decoration only */
  }
}

const menuA = new Audio('sounds/mainmenuopen.mp3');
menuA.preload = 'auto';
menuA.volume = 0.5;

export function menuOpen() {
  if (muted) return;
  try {
    menuA.currentTime = 0;
    menuA.play().catch(() => {});
  } catch {
    /* decoration only */
  }
}

export const isMuted = () => muted;
export function setMuted(next) {
  muted = next;
  localStorage.setItem(KEY, next ? '1' : '0');
}

export function initMuteButton(btn) {
  const render = () => {
    btn.textContent = muted ? '🔇' : '🔊';
    btn.setAttribute('aria-label', muted ? 'Unmute sounds' : 'Mute sounds');
    btn.setAttribute('aria-pressed', String(muted));
  };
  btn.addEventListener('click', () => {
    setMuted(!muted);
    render();
    click(); // confirms unmute audibly; no-op when muting
  });
  render();
}
