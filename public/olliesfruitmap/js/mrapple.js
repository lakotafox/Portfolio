// Mr Apple — the map's Floppy-style guide, mechanics lifted from
// Gifsmith's welcome/tour: typewriter at 60 ms/char with a talk/talk2
// mouth cycle and ▌ cursor; tapping the bubble while typing fast-forwards
// the line; steps that need a manual advance get one ">>" button that
// reads "next >>" once the line lands; action steps have NO button — they
// advance when the user actually does the thing, and wrong turns get a
// recovery line that waits for the fix.
import { REDUCED_MOTION } from './map.js';
import { click } from './sounds.js';

const KEY = 'ofm-tutorial-done';
const DIR = 'mrapple/';
const TYPE_MS = 60;
const MOUTH = ['talk', 'idle', 'talk2', 'idle'];

export function initMrApple() {
  const wrap = document.getElementById('mrapple');
  const img = document.getElementById('mrapple-img');
  const textEl = document.getElementById('mrapple-text');
  const cursorEl = document.getElementById('mrapple-cursor');
  const goBtn = document.getElementById('mrapple-go');
  const skipBtn = document.getElementById('mrapple-skip');
  const bubble = document.getElementById('mrapple-bubble');

  let timers = [];
  let typing = false;
  let fastForward = null;
  let step = -1;
  let running = false;
  let noLocation = false;

  const setFrame = (f) => { img.src = `${DIR}${f}.png`; };
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  function clearTimers() {
    for (const t of timers) { clearTimeout(t); clearInterval(t); }
    timers = [];
  }

  function say(text, { frame = 'idle', onDone } = {}) {
    clearTimers();
    typing = true;
    cursorEl.hidden = false;

    const finish = () => {
      clearTimers();
      typing = false;
      fastForward = null;
      textEl.textContent = text;
      cursorEl.hidden = true;
      setFrame(frame);
      if (frame === 'idle') {
        // blink while waiting
        timers.push(setInterval(() => {
          setFrame('blink');
          later(() => running && setFrame(frame), 160);
        }, 3200));
      }
      renderGo();
      onDone?.();
    };
    fastForward = finish;

    if (REDUCED_MOTION) { finish(); return; }
    textEl.textContent = '';
    let i = 0;
    timers.push(setInterval(() => {
      textEl.textContent = text.slice(0, ++i);
      if (i % 3 === 0) setFrame(MOUTH[((i / 3) | 0) % MOUTH.length]);
      if (i >= text.length) finish();
    }, TYPE_MS));
    renderGo();
  }

  // --- the script -----------------------------------------------------
  // manual: advance via the >> button; event: wait for the real action.
  const steps = [
    { line: 'hi!! im mr apple 🍎 welcome 2 ollies fruit map!', frame: 'talk2', manual: true },
    { line: 'first — tap the fruit u want up top! apples r a good start :)', frame: 'look', event: 'fruit' },
    { line: 'yesss!! now tap 📍 near me n ill find the closest ones 2 u', frame: 'idle', event: 'nearme' },
    { line: 'tap any tree 4 the deets! (the number bubbles zoom in when u tap em)', frame: 'idle', event: 'popup' },
    { line: 'see those buttons?? 🧭 apple maps or 🗺️ google maps will walk u right to the tree!', frame: 'look2', manual: true, orClick: '.dir-btn' },
    { line: 'last thing — that ⤢ button up there makes the map go fullscreen!! tap it again 2 come back', frame: 'look2', manual: true, orClick: '.fullscreen-btn' },
    { line: 'thats it!! take a lil, leave a lot. ok im out — bye!!', frame: 'squint', farewell: true },
  ];

  function renderGo() {
    const s = steps[step];
    if (!s || (!s.manual && !typing) || s.farewell) {
      goBtn.hidden = !typing || !!s?.farewell;
    } else {
      goBtn.hidden = false;
    }
    goBtn.textContent = typing ? '>>' : 'next >>';
  }

  function showStep(i) {
    step = i;
    const s = steps[i];
    skipBtn.hidden = !!s.farewell;
    say(s.line, {
      frame: s.frame,
      onDone: s.farewell ? () => later(dismiss, 2600) : undefined,
    });
  }

  function advance() {
    if (!running) return;
    if (step + 1 < steps.length) showStep(step + 1);
  }

  function dismiss() {
    running = false;
    clearTimers();
    localStorage.setItem(KEY, '1');
    wrap.classList.add('leaving');
    setTimeout(() => { wrap.hidden = true; wrap.classList.remove('leaving'); }, REDUCED_MOTION ? 0 : 450);
  }

  // --- what they do drives the tour -----------------------------------
  document.addEventListener('ofm:fruit-picked', () => {
    if (running && step === 1) advance();
  });
  document.addEventListener('ofm:nearme-shown', () => {
    if (running && step === 2) advance();
  });
  document.addEventListener('ofm:nearme-denied', () => {
    if (!running || step !== 2) return;
    noLocation = true;
    step = 3; // the tap-a-tree action rescues them
    say('no location? no worries!! just tap any tree u see on the map instead', { frame: 'idle' });
  });
  document.addEventListener('ofm:popup', () => {
    if (!running) return;
    if (step === 3) { noLocation = false; advance(); }
  });
  document.addEventListener('click', (e) => {
    if (!running) return;
    const t = e.target;
    // wrong turn: near me / walk before any fruit is on
    if (step === 1 && t.closest?.('#near-me-btn, #walk-btn')) {
      say('not yet!! pick a fruit first — then i can find em near u', { frame: 'talk' });
      return;
    }
    // doing the optional thing also advances its step
    const s = steps[step];
    if (s?.orClick && t.closest?.(s.orClick)) advance();
  });

  // tap the bubble while typing = fast-forward (Gifsmith's welcome-body click)
  bubble.addEventListener('click', (e) => {
    if (!running) return;
    if (typing && !e.target.closest('button')) fastForward?.();
  });
  goBtn.addEventListener('click', () => {
    if (!running) return;
    click();
    if (typing) { fastForward?.(); return; }
    if (steps[step]?.manual) advance();
  });
  skipBtn.addEventListener('click', () => { click(); dismiss(); });

  function start() {
    if (running) return;
    noLocation = false;
    running = true;
    wrap.hidden = false;
    showStep(0);
  }

  // first visit: appear once the title screen is gone
  if (localStorage.getItem(KEY) !== '1') {
    const title = document.getElementById('title-screen');
    if (!title) {
      setTimeout(start, 900);
    } else {
      const watch = new MutationObserver(() => {
        if (!document.getElementById('title-screen')) {
          watch.disconnect();
          setTimeout(start, 1100);
        }
      });
      watch.observe(document.body, { childList: true });
    }
  }

  // replay any time from the titlebar
  document.getElementById('mrapple-btn').addEventListener('click', () => {
    click();
    if (running) return dismiss();
    start();
  });
}
