/* ============================================================================
   Sensei — sprite + speech.

   A port of ~/gifworkshop/src/components/setup/useFloppySpeech.ts from React to
   vanilla JS. The timings are not guesses; they are what makes Floppy feel alive
   and they are copied deliberately:

     - the mouth cycles off the TYPEWRITER INDEX, not a timer, so lip-sync is
       free and stops dead the instant the line finishes
     - blink first at 900ms, then every 2600ms, held for 180ms
     - an idle glance every 6400ms: squint -> look/look2 a few times -> squint
     - a blip on every OTHER non-space character — "a murmur, not a machine gun"
   ========================================================================== */

import { blip } from './blip.js';

const BASE = './sensei/';
const FRAMES = ['idle', 'blink', 'talk', 'talk2', 'look', 'look2', 'squint', 'bow'];
const FLAP = ['talk', 'idle', 'talk2', 'idle'];
const TYPE_MS = 38;

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function preload() {
  for (const f of FRAMES) new Image().src = `${BASE}${f}.png`;
}

/**
 * Owns one sensei: an <img> and a bit of text that types itself out.
 *
 * @param {HTMLImageElement} img
 * @param {HTMLElement} textEl
 */
export function createSensei(img, textEl) {
  let full = '';
  let shown = 0;
  let typing = false;
  let flap = 0;
  let blinking = false;
  let glance = null;
  let frozen = null;          // overrides everything while set (e.g. the bow)
  let typeTimer = null;
  let blinkFirst = null, blinkEvery = null, blinkHold = null;
  let glanceEvery = null;
  const glanceTimers = [];
  let onDone = null;

  const paint = () => {
    const name = frozen
      ? frozen
      : typing ? FLAP[flap % FLAP.length]
      : blinking ? 'blink'
      : (glance ?? 'idle');
    img.src = `${BASE}${name}.png`;
    textEl.textContent = full.slice(0, shown);
    if (typing) {
      const caret = document.createElement('span');
      caret.className = 'type-cursor';
      caret.textContent = '▌';
      textEl.appendChild(caret);
    }
  };

  const clearIdle = () => {
    clearTimeout(blinkFirst); clearInterval(blinkEvery); clearTimeout(blinkHold);
    clearInterval(glanceEvery);
    while (glanceTimers.length) clearTimeout(glanceTimers.pop());
    blinking = false; glance = null;
  };

  const startIdle = () => {
    clearIdle();
    if (reduced) return;
    const doBlink = () => {
      blinking = true; paint();
      blinkHold = setTimeout(() => { blinking = false; paint(); }, 180);
    };
    blinkFirst = setTimeout(doBlink, 900);
    blinkEvery = setInterval(doBlink, 2600);

    glanceEvery = setInterval(() => {
      // squint out, wander, squint back — the squint eases the eye-height change
      const passes = 1 + Math.floor(Math.random() * 4);
      const seq = ['squint'];
      for (let i = 0; i < passes; i++) seq.push('look', 'look', 'look2', 'look2');
      seq.push('squint');
      seq.forEach((f, i) => {
        glanceTimers.push(setTimeout(() => { glance = f; paint(); }, i * 220));
      });
      glanceTimers.push(setTimeout(() => { glance = null; paint(); }, seq.length * 220));
    }, 6400);
  };

  const finish = () => {
    clearInterval(typeTimer);
    shown = full.length;
    typing = false;
    paint();
    startIdle();
    if (onDone) { const f = onDone; onDone = null; f(); }
  };

  return {
    /** Type a line. Returns a promise that resolves when it has finished. */
    say(line, opts = {}) {
      clearInterval(typeTimer);
      clearIdle();
      full = String(line);
      shown = 0;
      flap = 0;
      frozen = opts.frame ?? null;
      typing = true;
      paint();

      if (reduced) { finish(); return Promise.resolve(); }

      return new Promise((resolve) => {
        onDone = resolve;
        typeTimer = setInterval(() => {
          shown++;
          const ch = full[shown - 1];
          if (ch && ch.trim() && shown % 2 === 0) { flap++; blip(); }
          if (shown >= full.length) finish();
          else paint();
        }, opts.ms ?? TYPE_MS);
      });
    },

    /** Reveal the rest of the current line immediately. */
    skip() { if (typing) finish(); },

    /** Hold a specific frame (the bow), or pass null to hand control back. */
    hold(frame) { frozen = frame; paint(); if (!frame) startIdle(); },

    get typing() { return typing; },

    destroy() { clearInterval(typeTimer); clearIdle(); },
  };
}
