/* Entry.

   One kata on screen at a time. The whole curriculum rendered as a single
   scroll read as a manual — you cannot pace a lesson you can see the end of.
   Sensei is sticky, so the guide is never something you scroll back up to find.
*/

import { BELTS, TERMINAL_BELTS } from './belts.js';
import * as store from './store.js';
import { runCheck } from './checks.js';
import { createSensei, preload } from './sensei.js';
import { chime, thud, cycleAudio, audioMode, musicAllowed, AUDIO_LABEL } from './blip.js';
import { startMusic, stopMusic } from './music.js';
import { stackGame, pipeGame, quiz } from './games.js';

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

store.load();

const sensei = createSensei($('#sensei-img'), $('#sensei-text'));
preload();
$('#sensei-bubble').addEventListener('click', () => sensei.skip());
const say = (line) => sensei.say(line);

/* ------------------------------------------------------------- position -- */
/* A flat list of steps, so "next" is just an index. A step is either a belt
   intro or a kata. */

const STEPS = [];
BELTS.forEach((belt, bi) => {
  STEPS.push({ kind: 'intro', belt, bi });
  belt.katas.forEach((kata, ki) => STEPS.push({ kind: 'kata', belt, kata, bi, ki }));
});
STEPS.push({ kind: 'end' });

/** Where to resume: the first unfinished kata — or the belt intro just before
 *  it, but only when arriving at that belt fresh. Backing up unconditionally
 *  dumps him on a kata he already finished. */
function startPos() {
  const i = STEPS.findIndex((s) => s.kind === 'kata' && !store.isDone(s.kata.id));
  if (i === -1) return STEPS.length - 1;
  const prev = STEPS[i - 1];
  if (prev?.kind === 'intro' && !prev.belt.katas.some((k) => store.isDone(k.id))) return i - 1;
  return i;
}

let pos = startPos();

const stepDone = (s) => s.kind !== 'kata' || store.isDone(s.kata.id);

/* -------------------------------------------------------------- chrome ---- */

function renderRack() {
  const rack = $('#rack');
  rack.innerHTML = '';
  const all = [...BELTS, ...TERMINAL_BELTS];
  const earnedIds = new Set(
    BELTS.filter((b) => b.katas.every((k) => store.isDone(k.id))).map((b) => b.id),
  );
  const current = BELTS.find((b) => !earnedIds.has(b.id)) ?? null;

  for (const b of all) {
    const chip = el('div', 'belt-chip');
    chip.dataset.state = earnedIds.has(b.id) ? 'earned' : (b === current ? 'current' : 'locked');
    const sw = el('span', 'belt-swatch');
    sw.style.setProperty('--belt', `var(--belt-${b.id})`);
    chip.append(sw, el('span', null, b.name));
    if (earnedIds.has(b.id)) chip.append(el('span', 'tick', '✓'));
    rack.appendChild(chip);
  }

  $('#taskbar-rank').textContent = current ? `${current.name} — ${current.motto}` : 'Ready for the terminal';

  const totalKatas = BELTS.reduce((n, b) => n + b.katas.length, 0);
  const doneKatas = BELTS.reduce((n, b) => n + b.katas.filter((k) => store.isDone(k.id)).length, 0);
  $('#progress-fill').style.width = `${Math.round((doneKatas / totalKatas) * 100)}%`;
  $('#progress-label').textContent = `${doneKatas} / ${totalKatas} katas`;
}

/* ---------------------------------------------------------------- steps -- */

function renderIntro(step) {
  const win = el('section', 'win w95-raised');
  const bar = el('header', 'w95-titlebar');
  const nm = el('div', 'titlebar-name');
  nm.append(el('span', 'titlebar-ico', '◆'), el('span', null, 'New belt'));
  bar.append(nm);
  win.append(bar);

  const body = el('div', 'win-body');
  const intro = el('div', 'belt-intro');
  intro.append(el('div', 'belt-big', step.belt.name));
  const bar2 = el('div', 'belt-bar');
  bar2.style.setProperty('--belt', `var(--belt-${step.belt.id})`);
  intro.append(bar2, el('div', 'belt-motto', step.belt.motto));
  body.append(intro, el('p', null, step.belt.intro));
  if (step.belt.handTyped) {
    body.append(el('p', 'cmd-note',
      'You type these yourself. There is nobody to ask yet — that is the only reason.'));
  }
  win.append(body);
  say(`${step.belt.name}. ${step.belt.motto}`);
  return win;
}

function renderEnd() {
  const win = el('section', 'win w95-raised');
  const bar = el('header', 'w95-titlebar');
  const nm = el('div', 'titlebar-name');
  nm.append(el('span', 'titlebar-ico', '❯'), el('span', null, 'The rest is not on this page'));
  bar.append(nm);
  win.append(bar);
  const b = el('div', 'win-body');
  b.append(el('p', null,
    'Three belts are left, and they are taught in your own terminal by the same sensei — because there I can check your work instead of taking your word for it.'));
  for (const t of TERMINAL_BELTS) {
    const k = el('div', 'kata');
    const h = el('div', 'kata-head');
    h.append(el('span', 'kata-num', '◆'), el('span', null, `${t.name} — ${t.motto}`));
    k.append(h, el('p', 'cmd-note', t.teaser));
    b.append(k);
  }
  win.append(b);
  say('You have taken this as far as a web page can. The rest is in your terminal.');
  return win;
}

function renderKata(step, onDone) {
  const { belt, kata, ki } = step;
  const win = el('section', 'win w95-raised');
  const done = store.isDone(kata.id);

  const bar = el('header', 'w95-titlebar');
  const nm = el('div', 'titlebar-name');
  const ico = el('span', 'titlebar-ico', done ? '✓' : String(ki + 1));
  nm.append(ico, el('span', null, kata.title));
  bar.append(nm, el('div', 'titlebar-btns', null));
  win.append(bar);

  const body = el('div', 'win-body');
  body.append(el('p', 'concept', kata.concept));
  if (kata.aside) body.append(el('p', null, kata.aside));

  if (kata.link) {
    const p = el('p');
    const a = el('a', null, kata.link.label);
    a.href = kata.link.href; a.target = '_blank'; a.rel = 'noopener';
    p.append('Instructions: ', a);
    body.append(p);
  }

  if (kata.ask) {
    const ask = el('div', 'ask');
    ask.append(el('span', 'ask-label', 'Say this'));
    const col = el('div');
    col.append(el('div', 'ask-say', `“${kata.ask}”`));
    if (kata.askNote) col.append(el('div', 'cmd-note', kata.askNote));
    ask.append(col);
    body.append(ask);
  }

  if (kata.command) {
    body.append(el('pre', 'cmd', kata.command));
    if (kata.cmdNote) body.append(el('p', 'cmd-note', kata.cmdNote));
  }

  const complete = () => {
    if (!store.isDone(kata.id)) {
      store.markDone(kata.id);
      ico.textContent = '✓';
      renderRack();
      const earned = belt.katas.every((k) => store.isDone(k.id));
      if (earned) {
        sensei.hold('bow');
        say(`${belt.name}. ${belt.motto}`).then(() => setTimeout(() => sensei.hold(null), 1300));
      }
    }
    onDone();
  };

  if (kata.game) {
    const host = el('div');
    body.append(host);
    const report = (msg) => { say(msg); };
    if (kata.game === 'stack') stackGame(host, (m) => { report(m); complete(); });
    if (kata.game === 'pipe') pipeGame(host, (m) => { report(m); complete(); });
  }

  if (kata.quiz) {
    const host = el('div');
    body.append(host);
    quiz(host, kata.quiz, (m) => say(m), complete);
  }

  if (kata.check) {
    body.append(el('p', 'check-label', kata.checkPrompt || 'Paste what it printed.'));
    const ta = el('textarea', 'paste w95-sunken');
    ta.placeholder = 'paste the output here';
    ta.spellcheck = false;
    body.append(ta);

    const row = el('div', 'check-row');
    const btn = el('button', 'w95-btn', 'Show sensei');
    btn.type = 'button';
    row.append(btn);
    body.append(row);

    const verdict = el('div', 'verdict');
    verdict.hidden = true;
    body.append(verdict);

    btn.addEventListener('click', () => {
      const r = runCheck(kata.check, ta.value);
      verdict.hidden = false;
      verdict.dataset.tone = r.tone;
      verdict.innerHTML = '';
      verdict.append(el('span', 'mark', r.tone === 'pass' ? '✓' : r.tone === 'near' ? '!' : '×'),
                     el('span', null, r.line));
      say(r.line);
      if (r.tone === 'pass') { chime(); complete(); } else { thud(); }
    });
  }

  if (!kata.check && !kata.game && !kata.quiz) {
    const row = el('div', 'check-row');
    const btn = el('button', 'w95-btn', done ? 'Done' : 'I have done this');
    btn.type = 'button';
    btn.disabled = done;
    btn.addEventListener('click', () => { chime(); complete(); btn.disabled = true; btn.textContent = 'Done'; });
    row.append(btn);
    body.append(row);
  }

  win.append(body);
  if (!done) say(kata.concept.split('. ')[0] + '.');
  return win;
}

/* ------------------------------------------------------------------ nav -- */

function show() {
  const stage = $('#stage');
  stage.innerHTML = '';
  const step = STEPS[pos];

  let node;
  if (step.kind === 'intro') node = renderIntro(step);
  else if (step.kind === 'end') node = renderEnd();
  else node = renderKata(step, () => refreshNav());

  stage.append(node);
  refreshNav();
  renderRack();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function refreshNav() {
  const step = STEPS[pos];
  $('#back').disabled = pos === 0;
  const next = $('#next');
  const last = pos >= STEPS.length - 1;
  next.disabled = last || !stepDone(step);
  next.textContent = last ? 'Finished' : (stepDone(step) ? 'Next →' : 'Finish this first');
  $('#step-label').textContent = step.kind === 'kata'
    ? `${step.belt.name} · kata ${step.ki + 1} of ${step.belt.katas.length}`
    : step.kind === 'intro' ? step.belt.name : 'The end of the web dojo';
}

$('#next').addEventListener('click', () => { if (pos < STEPS.length - 1) { pos++; show(); } });
$('#back').addEventListener('click', () => { if (pos > 0) { pos--; show(); } });

/* ---------------------------------------------------------------- misc --- */

function clock() {
  const d = new Date();
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ap = h < 12 ? 'AM' : 'PM';
  h = h % 12 || 12;
  $('#clock').textContent = `${h}:${m} ${ap}`;
}
clock();
setInterval(clock, 20000);

/* One button cycles all -> music -> effects -> off. */
const muteBtn = $('#mute');
muteBtn.textContent = AUDIO_LABEL[audioMode()];
muteBtn.addEventListener('click', (e) => {
  const m = cycleAudio();
  e.currentTarget.textContent = AUDIO_LABEL[m];
  if (musicAllowed()) startMusic(0.8); else stopMusic(0.6);
});

/* Browsers will not start audio before the user has touched the page, so the
   theme is armed on the first interaction rather than on load. */
const armMusic = () => {
  document.removeEventListener('pointerdown', armMusic);
  if (musicAllowed()) startMusic();
};
document.addEventListener('pointerdown', armMusic, { once: true, passive: true });

$('#reset').addEventListener('click', () => {
  if (!confirm('Wipe your progress and start over?')) return;
  store.reset();
  pos = 0;
  show();
  say('We begin again. No shame in it.');
});

show();
if (store.snapshot().done.length === 0) {
  say('Welcome. I am your sensei. We start with what a computer is — not with typing.');
}
