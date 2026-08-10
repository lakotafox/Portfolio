// Mr Apple — the map's Floppy-style guide, shaped like Gifsmith's:
//
// 1. WELCOME WINDOW first: a centered w95 window ("a msg 4 u") with big
//    Mr Apple and a few typewriter intro lines. One button (">>" while
//    typing, "next >>" between lines, "lets go!" on the last) and the
//    "skip tutorial — i know what im doing!" link — the ONLY place skip
//    exists.
// 2. Then the in-app TOUR: a corner bubble with NO buttons — each line
//    advances only when the user does the right thing; wrong turns get a
//    recovery line that waits for the fix.
import { REDUCED_MOTION } from './map.js';
import { click, menuOpen, talkBlip } from './sounds.js';

const KEY = 'ofm-tutorial-done';
const DIR = 'mrapple/';
const TYPE_MS = 60;
const MOUTH = ['talk', 'idle', 'talk2', 'idle'];

// Floppy's intro shape: greeting → problem → gripe :( → mission!! →
// the treasure (big number) → question… → "let me show you!"
const WELCOME_LINES = [
  { line: 'hi!! im MR APPLE — welcome 2 ollies fruit map!!', frame: 'talk2' },
  { line: 'did u know portland is FULL of fruit trees?', frame: 'idle' },
  { line: 'apples, figs, plums, cherries… just growing on the street!', frame: 'idle' },
  { line: 'most people walk right past em every single day :(', frame: 'look' },
  { line: 'so we mapped every single one — all 34,992 of em!!', frame: 'talk' },
  { line: 'ever wonder where the closest fruit tree is?', frame: 'look2' },
  { line: 'lets pick a fruit!!', frame: 'squint' },
];
const WELCOME_MS = 38; // Floppy's intro types faster than the tour

const TOUR = [
  { line: 'pick a fruit from the bar up top! apples r a good start :)', frame: 'look' },
  { line: 'yesss!! now tap 📍 near me n ill find the closest ones 2 u', frame: 'idle' },
  { line: 'tap any tree 4 the deets! (the number bubbles zoom in when u tap em)', frame: 'idle' },
  { line: 'those buttons walk u right to the tree!! tap 🧭 apple maps or 🗺️ google maps', frame: 'look2', orClick: '.dir-btn' },
  { line: 'last thing — tap that ⤢ button up there!! it makes the map go fullscreen', frame: 'look2', orClick: '.fullscreen-btn' },
  { line: 'thats it!! take a lil, leave a lot. ok im out — bye!!', frame: 'squint', farewell: true },
];

export function initMrApple() {
  const welcome = document.getElementById('mrapple-welcome');
  const wImg = document.getElementById('mrapple-welcome-img');
  const wText = document.getElementById('mrapple-welcome-text');
  const wCursor = document.getElementById('mrapple-welcome-cursor');
  const goBtn = document.getElementById('mrapple-go');
  const skipBtn = document.getElementById('mrapple-skip');

  const wrap = document.getElementById('mrapple');
  const img = document.getElementById('mrapple-img');
  const textEl = document.getElementById('mrapple-text');
  const cursorEl = document.getElementById('mrapple-cursor');
  const bubble = document.getElementById('mrapple-bubble');

  let timers = [];
  let typing = false;
  let fastForward = null;
  let phase = 'off'; // 'welcome' | 'tour' | 'off'
  let wLine = 0;
  let step = -1;
  let noLocation = false;

  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  function clearTimers() {
    for (const t of timers) { clearTimeout(t); clearInterval(t); }
    timers = [];
  }

  // one typewriter, pointed at whichever surface is active
  function say(text, frame, { imgEl, txtEl, curEl, onDone, speed = TYPE_MS } = {}) {
    clearTimers();
    typing = true;
    curEl.hidden = false;
    const setFrame = (f) => { imgEl.src = `${DIR}${f}.png`; };

    const finish = () => {
      clearTimers();
      typing = false;
      fastForward = null;
      txtEl.textContent = text;
      curEl.hidden = true;
      setFrame(frame);
      if (frame === 'idle') {
        timers.push(setInterval(() => {
          setFrame('blink');
          later(() => phase !== 'off' && setFrame(frame), 160);
        }, 3200));
      }
      renderGo();
      onDone?.();
    };
    fastForward = finish;

    if (REDUCED_MOTION) { finish(); return; }
    txtEl.textContent = '';
    let i = 0;
    timers.push(setInterval(() => {
      txtEl.textContent = text.slice(0, ++i);
      if (i % 3 === 0) setFrame(MOUTH[((i / 3) | 0) % MOUTH.length]);
      if (i % 2 === 0 && text[i - 1] !== ' ') talkBlip(); // Floppy's voice
      if (i >= text.length) finish();
    }, speed));
    renderGo();
  }

  // --- welcome window --------------------------------------------------
  function renderGo() {
    if (phase !== 'welcome') return;
    goBtn.textContent = typing ? '>>' : wLine < WELCOME_LINES.length - 1 ? 'next >>' : 'lets go!';
  }

  function showWelcomeLine(i) {
    wLine = i;
    const l = WELCOME_LINES[i];
    say(l.line, l.frame, { imgEl: wImg, txtEl: wText, curEl: wCursor, speed: WELCOME_MS });
  }

  function openWelcome() {
    phase = 'welcome';
    noLocation = false;
    welcome.hidden = false;
    showWelcomeLine(0);
  }

  function closeWelcome(whoosh) {
    clearTimers();
    if (!whoosh || REDUCED_MOTION) {
      welcome.hidden = true;
      return;
    }
    // Floppy's moment ends with a whoosh: the intro screen flies away and
    // the app is revealed underneath.
    menuOpen();
    welcome.classList.add('leaving');
    setTimeout(() => {
      welcome.hidden = true;
      welcome.classList.remove('leaving');
    }, 950);
  }

  goBtn.addEventListener('click', () => {
    if (phase !== 'welcome') return;
    click();
    if (typing) { fastForward?.(); return; }
    if (wLine < WELCOME_LINES.length - 1) showWelcomeLine(wLine + 1);
    else { closeWelcome(true); startTour(); }
  });
  skipBtn.addEventListener('click', () => {
    click();
    closeWelcome();
    end();
  });

  // --- the in-app tour (no buttons — actions advance it) ---------------
  function showStep(i) {
    step = i;
    const s = TOUR[i];
    say(s.line, s.frame, {
      imgEl: img,
      txtEl: textEl,
      curEl: cursorEl,
      onDone: s.farewell ? () => later(dismissTour, 2600) : undefined,
    });
  }

  function startTour() {
    phase = 'tour';
    wrap.hidden = false;
    showStep(0);
  }

  function advance() {
    if (phase !== 'tour') return;
    if (step + 1 < TOUR.length) showStep(step + 1);
  }

  function dismissTour() {
    clearTimers();
    wrap.classList.add('leaving');
    setTimeout(() => { wrap.hidden = true; wrap.classList.remove('leaving'); }, REDUCED_MOTION ? 0 : 450);
    end();
  }

  function end() {
    phase = 'off';
    localStorage.setItem(KEY, '1');
  }

  document.addEventListener('ofm:fruit-picked', () => {
    if (phase === 'tour' && step === 0) advance();
  });
  document.addEventListener('ofm:nearme-shown', () => {
    if (phase === 'tour' && step === 1) advance();
  });
  document.addEventListener('ofm:nearme-denied', () => {
    if (phase !== 'tour' || step !== 1) return;
    noLocation = true;
    step = 2; // the tap-a-tree action rescues them
    say('no location? no worries!! just tap any tree u see on the map instead', 'idle',
      { imgEl: img, txtEl: textEl, curEl: cursorEl });
  });
  document.addEventListener('ofm:popup', () => {
    if (phase === 'tour' && step === 2) { noLocation = false; advance(); }
  });
  // capture phase: Leaflet stops propagation on its controls/popups, so a
  // bubble-phase listener would never see dir-btn or fullscreen-btn taps.
  document.addEventListener('click', (e) => {
    if (phase !== 'tour') return;
    const t = e.target;
    // wrong turn: near me / walk before any fruit is on
    if (step === 0 && t.closest?.('#near-me-btn, #walk-btn')) {
      say('not yet!! pick a fruit first — then i can find em near u', 'talk',
        { imgEl: img, txtEl: textEl, curEl: cursorEl });
      return;
    }
    const s = TOUR[step];
    if (s?.orClick && t.closest?.(s.orClick)) advance();
  }, true);

  // tap the bubble while typing = fast-forward
  bubble.addEventListener('click', (e) => {
    if (phase === 'tour' && typing && !e.target.closest('button')) fastForward?.();
  });
  welcome.addEventListener('click', (e) => {
    if (phase === 'welcome' && typing && !e.target.closest('button')) fastForward?.();
  });

  // --- entry points ----------------------------------------------------
  function begin() {
    if (phase !== 'off') return;
    openWelcome();
  }

  if (localStorage.getItem(KEY) !== '1') {
    // Pre-stage the intro screen UNDER the title screen so the title's
    // fly-away reveals Mr Apple directly — the app never peeks through.
    welcome.hidden = false;
    const title = document.getElementById('title-screen');
    if (!title) {
      begin();
    } else {
      const watch = new MutationObserver(() => {
        if (!document.getElementById('title-screen')) {
          watch.disconnect();
          begin();
        }
      });
      watch.observe(document.body, { childList: true });
    }
  }

  // replay any time from the titlebar apple
  document.getElementById('mrapple-btn').addEventListener('click', () => {
    click();
    if (phase === 'tour') { dismissTour(); return; }
    if (phase === 'welcome') { closeWelcome(); end(); return; }
    begin();
  });
}
