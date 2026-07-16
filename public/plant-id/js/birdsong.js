// A short, cheerful synthesized bird chirp played when the user taps Identify.
// Uses the Web Audio API (frequency-swept sine "tweets" with vibrato) — no audio
// asset, no autoplay issues since it's triggered by a user gesture.

let ctx = null;

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// One "tweet": a sine that swoops between two pitches with a little vibrato.
function tweet(ac, startAt, dur, f0, f1, gain = 0.18) {
  const osc = ac.createOscillator();
  const vib = ac.createOscillator();
  const vibGain = ac.createGain();
  const amp = ac.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(f0, startAt);
  osc.frequency.exponentialRampToValueAtTime(f1, startAt + dur * 0.6);
  osc.frequency.exponentialRampToValueAtTime(f0 * 1.15, startAt + dur);

  // vibrato
  vib.type = 'sine';
  vib.frequency.setValueAtTime(28, startAt);
  vibGain.gain.setValueAtTime(18, startAt);
  vib.connect(vibGain).connect(osc.frequency);

  // amplitude envelope (quick attack, soft release)
  amp.gain.setValueAtTime(0.0001, startAt);
  amp.gain.exponentialRampToValueAtTime(gain, startAt + 0.015);
  amp.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);

  osc.connect(amp).connect(ac.destination);
  osc.start(startAt);
  vib.start(startAt);
  osc.stop(startAt + dur + 0.02);
  vib.stop(startAt + dur + 0.02);
}

// Plays a little 3-note song: chirp-chirp-chirrup.
export function playChirp() {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime + 0.02;
  tweet(ac, t, 0.12, 1800, 2600);
  tweet(ac, t + 0.14, 0.10, 2100, 3000);
  tweet(ac, t + 0.30, 0.18, 1600, 2400, 0.16);
}
